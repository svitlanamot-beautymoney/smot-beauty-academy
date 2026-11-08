// S.MOT — lesson translation: subtitles in any language (Deepgram speech-to-text + OpenAI translation)
// and optional AI dubbing (ElevenLabs). Secrets: DEEPGRAM_API_KEY, OPENAI_API_KEY, ELEVENLABS_API_KEY (optional).
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

type Cue = { start: number; end: number; text: string };
const ts = (s: number) => {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60), ms = Math.round((s % 1) * 1000);
  const p = (n: number, l = 2) => String(n).padStart(l, "0");
  return `${p(h)}:${p(m)}:${p(sec)}.${p(ms, 3)}`;
};
const toVtt = (cues: Cue[]) => "WEBVTT\n\n" + cues.map((c, i) => `${i + 1}\n${ts(c.start)} --> ${ts(c.end)}\n${c.text}\n`).join("\n");

async function transcribe(url: string, key: string): Promise<{ cues: Cue[]; lang: string }> {
  const r = await fetch("https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&utterances=true&detect_language=true", {
    method: "POST", headers: { Authorization: `Token ${key}`, "Content-Type": "application/json" }, body: JSON.stringify({ url }),
  });
  if (!r.ok) throw new Error(`Transcription failed: ${r.status} ${await r.text()}`);
  const d = await r.json();
  const utt = d?.results?.utterances ?? [];
  const lang = d?.results?.channels?.[0]?.detected_language ?? "en";
  return { cues: utt.map((u: any) => ({ start: u.start, end: u.end, text: u.transcript })), lang };
}

async function translate(cues: Cue[], target: string, key: string): Promise<Cue[]> {
  const out: Cue[] = [];
  for (let i = 0; i < cues.length; i += 60) {
    const chunk = cues.slice(i, i + 60);
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini", temperature: 0.2, response_format: { type: "json_object" },
        messages: [
          { role: "system", content: `You translate subtitles of a professional beauty-industry video lesson (hair, makeup, nails, brows, lashes). Translate every line into the language with code "${target}". Keep professional terms accurate. Return JSON {"lines":[...]} with exactly the same number of lines in the same order.` },
          { role: "user", content: JSON.stringify({ lines: chunk.map((c) => c.text) }) },
        ],
      }),
    });
    if (!r.ok) throw new Error(`Translation failed: ${r.status} ${await r.text()}`);
    const lines: string[] = JSON.parse((await r.json()).choices[0].message.content).lines ?? [];
    chunk.forEach((c, k) => out.push({ ...c, text: lines[k] ?? c.text }));
  }
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const authHeader = req.headers.get("Authorization") ?? "";
    const asUser = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: u } = await asUser.auth.getUser();
    if (!u?.user) return json({ error: "Sign in required" }, 401);

    const { action = "translate", lesson_id, langs = [], dub = false } = await req.json();
    const { data: lesson } = await admin.from("lessons").select("id, course_id, video_asset_id, courses!inner(instructor_id)").eq("id", lesson_id).maybeSingle();
    if (!lesson) return json({ error: "Lesson not found" }, 404);
    const isOwner = (lesson as any).courses.instructor_id === u.user.id;
    const { data: adm } = await admin.from("user_roles").select("role").eq("user_id", u.user.id).eq("role", "admin").maybeSingle();
    if (!isOwner && !adm) return json({ error: "Only the course educator can translate this lesson" }, 403);

    const DG = Deno.env.get("DEEPGRAM_API_KEY"), OA = Deno.env.get("OPENAI_API_KEY"), EL = Deno.env.get("ELEVENLABS_API_KEY");
    const now = new Date().toISOString();

    if (action === "poll_dubs") {
      if (!EL) return json({ configured: false });
      const { data: rows } = await admin.from("lesson_tracks").select("*").eq("lesson_id", lesson_id).eq("kind", "audio").eq("status", "processing");
      for (const t of rows ?? []) {
        const s = await (await fetch(`https://api.elevenlabs.io/v1/dubbing/${t.provider_job_id}`, { headers: { "xi-api-key": EL } })).json();
        if (s.status === "dubbed") {
          const audio = await fetch(`https://api.elevenlabs.io/v1/dubbing/${t.provider_job_id}/audio/${t.lang}`, { headers: { "xi-api-key": EL } });
          const path = `${lesson.course_id}/dub/${lesson_id}-${t.lang}.mp4`;
          await admin.storage.from("course-videos").upload(path, await audio.arrayBuffer(), { contentType: "video/mp4", upsert: true });
          await admin.from("lesson_tracks").update({ status: "ready", file_path: path, updated_at: now }).eq("id", t.id);
        } else if (s.status === "failed") {
          await admin.from("lesson_tracks").update({ status: "failed", error_message: s.error ?? "Dubbing failed", updated_at: now }).eq("id", t.id);
        }
      }
      return json({ ok: true });
    }

    const targets: string[] = [...new Set((langs as string[]).filter((l) => /^[a-z]{2,3}(-[A-Za-z]{2,4})?$/.test(l)))].slice(0, 60);
    if (!targets.length || !lesson.video_asset_id) return json({ error: "No video or no languages" }, 400);

    if (!DG || !OA) {
      await admin.from("lesson_tracks").upsert(targets.map((lang) => ({ lesson_id, lang, kind: "subtitles", status: "requested", updated_at: now })), { onConflict: "lesson_id,lang,kind" });
      return json({ configured: false, requested: targets.length });
    }

    const { data: signed } = await admin.storage.from("course-videos").createSignedUrl(lesson.video_asset_id, 3600);
    const { cues, lang: source } = await transcribe(signed!.signedUrl, DG);
    await admin.from("lesson_tracks").upsert({ lesson_id, lang: source, kind: "subtitles", status: "ready", vtt: toVtt(cues), updated_at: now }, { onConflict: "lesson_id,lang,kind" });

    const results = await Promise.allSettled(targets.filter((l) => l !== source).map(async (lang) => {
      const tr = await translate(cues, lang, OA);
      await admin.from("lesson_tracks").upsert({ lesson_id, lang, kind: "subtitles", status: "ready", vtt: toVtt(tr), error_message: null, updated_at: now }, { onConflict: "lesson_id,lang,kind" });
    }));
    const failed = results.filter((r) => r.status === "rejected").length;

    if (dub && EL) {
      for (const lang of targets.filter((l) => l !== source)) {
        const fd = new FormData();
        fd.append("source_url", signed!.signedUrl); fd.append("target_lang", lang); fd.append("source_lang", source); fd.append("num_speakers", "1");
        const r = await fetch("https://api.elevenlabs.io/v1/dubbing", { method: "POST", headers: { "xi-api-key": EL }, body: fd });
        const d = await r.json();
        await admin.from("lesson_tracks").upsert({ lesson_id, lang, kind: "audio", status: r.ok ? "processing" : "failed", provider_job_id: d.dubbing_id ?? null, error_message: r.ok ? null : JSON.stringify(d).slice(0, 500), updated_at: now }, { onConflict: "lesson_id,lang,kind" });
      }
    }
    return json({ configured: true, source, translated: targets.length - failed, failed });
  } catch (e) {
    return json({ error: String((e as Error).message ?? e) }, 500);
  }
});
