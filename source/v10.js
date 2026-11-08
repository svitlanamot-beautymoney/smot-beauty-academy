/* ================= v11: every lesson in every language — subtitles + AI voice-over ================= */
const WORLD_LANGS = ['en', 'uk', 'nl', 'ru', 'pl', 'it', 'de', 'fr', 'es', 'pt', 'ro', 'tr', 'ar', 'zh', 'ja', 'ko', 'hi', 'cs', 'sk', 'hu', 'el', 'bg', 'hr', 'sr', 'lt', 'lv', 'et', 'fi', 'sv', 'da', 'no', 'he', 'vi', 'th', 'id', 'ka', 'kk', 'az'];
const PLATFORM_LANGS = ['en', 'uk', 'nl', 'ru', 'pl', 'it'];
const langName = (code, ui) => { try { return new Intl.DisplayNames([ui === 'uk' ? 'uk' : ui], { type: 'language' }).of(code) || code; } catch (e) { return code; } };
const DEMO_LINES = { en: 'Section the hair into four parts before you start.', uk: 'Перед початком розділіть волосся на чотири зони.', ru: 'Перед началом разделите волосы на четыре зоны.', nl: 'Verdeel het haar eerst in vier delen.', pl: 'Przed rozpoczęciem podziel włosy na cztery części.', it: 'Prima di iniziare dividi i capelli in quattro sezioni.', de: 'Teilen Sie das Haar vor dem Start in vier Partien.', fr: 'Séparez les cheveux en quatre sections avant de commencer.', es: 'Divide el cabello en cuatro secciones antes de empezar.' };
D.tracks = {};
const demoTracks = lessonId => D.tracks[lessonId] || PLATFORM_LANGS.concat(['de', 'fr', 'es']).map(l => ({ lang: l, kind: 'subtitles', status: 'ready', vtt: `WEBVTT\n\n1\n00:00:00.000 --> 00:10:00.000\n${DEMO_LINES[l]}\n` })).concat([{ lang: 'uk', kind: 'audio', status: 'ready' }, { lang: 'en', kind: 'audio', status: 'ready' }]);

Object.assign(api, {
  async tracks(lessonId) {
    if (MODE.demo) return demoTracks(lessonId);
    return rows(await sb.from('lesson_tracks').select('lang,kind,status,vtt,file_path,error_message').eq('lesson_id', lessonId));
  },
  async requestTranslation(lessonId, langs, dub) {
    if (MODE.demo) {
      D.tracks[lessonId] = langs.map(l => ({ lang: l, kind: 'subtitles', status: 'ready', vtt: `WEBVTT\n\n1\n00:00:00.000 --> 00:10:00.000\n${DEMO_LINES[l] || DEMO_LINES.en}\n` })).concat(dub ? langs.map(l => ({ lang: l, kind: 'audio', status: 'processing' })) : []);
      return { data: { configured: true } };
    }
    return sb.functions.invoke('lesson-translate', { body: { action: 'translate', lesson_id: lessonId, langs, dub } });
  },
  async trackUrl(path) {
    if (MODE.demo || !path) return null;
    return (await sb.storage.from('course-videos').createSignedUrl(path, 3600)).data?.signedUrl || null;
  }
});

/* Player with language choice: subtitles in any ready language, voice-over where available */
function LessonPlayer({ ctx, lesson, url, cat, vref: extRef, mirror, demoT, demoDur }) {
  const { t, lang } = ctx;
  const [tracks] = useAsync(() => api.tracks(lesson.id), [lesson.id, ctx.dataKey]);
  const subs = (tracks || []).filter(x => x.kind === 'subtitles' && x.status === 'ready');
  const dubs = (tracks || []).filter(x => x.kind === 'audio' && x.status === 'ready');
  const [sub, setSub] = useState(null); const [dub, setDub] = useState('');
  const [src, setSrc] = useState(url);
  useEffect(() => { if (sub === null && subs.length) setSub(subs.find(s => s.lang === lang) ? lang : subs[0].lang); }, [tracks]);
  useEffect(() => { (async () => { if (!dub) return setSrc(url); const d = dubs.find(x => x.lang === dub); setSrc((await api.trackUrl(d?.file_path)) || url); })(); }, [dub, url]);
  const blobs = useMemo(() => subs.map(s => { try { return { lang: s.lang, src: URL.createObjectURL(new Blob([s.vtt || 'WEBVTT'], { type: 'text/vtt' })) }; } catch (e) { return { lang: s.lang, src: '' }; } }), [tracks]);
  const ownRef = useRef(); const vref = extRef || ownRef;
  useEffect(() => { const v = vref.current; if (!v) return; for (const tt of v.textTracks) tt.mode = tt.language === sub ? 'showing' : 'disabled'; }, [sub, blobs, src]);
  const demoLine = !src && sub ? (subs.find(s => s.lang === sub)?.vtt || '').split('\n').slice(4).join(' ') : '';
  return html`<div className="player">
    ${src ? html`<video ref=${vref} className=${'video' + (mirror ? ' mirrored' : '')} src=${src} controls autoPlay playsInline crossOrigin="anonymous">${blobs.map(b => html`<track key=${b.lang} kind="subtitles" srcLang=${b.lang} label=${langName(b.lang, lang)} src=${b.src} default=${b.lang === sub} />`)}</video>`
      : html`<div className="vthumb big"><div className=${mirror ? 'mirrored' : ''}><${Cover} k=${cat} ratio="16/9" mark=${false} /></div>${demoDur ? html`<span className="demo-time">${fmtT(demoT || 0)} / ${fmtT(demoDur)}</span><span className="demo-prog"><i style=${{ width: Math.min(100, (demoT || 0) / demoDur * 100) + '%' }}></i></span>` : ''}<span className="vplay"><${Icon} n="play" s=${30} fill=${true} /></span>${demoLine && html`<span className="demo-sub">${demoLine}</span>`}</div>`}
    <div className="lang-bar">
      <label className="lang-pick"><span><${Icon} n="chat" s=${15} /> ${t.subtitles}</span><select id="pl-sub" value=${sub || ''} onChange=${e => setSub(e.target.value || '')}><option value="">${t.off}</option>${subs.map(s => html`<option key=${s.lang} value=${s.lang}>${langName(s.lang, lang)}</option>`)}</select></label>
      <label className="lang-pick"><span><${Icon} n="globe" s=${15} /> ${t.audioTrack}</span><select id="pl-dub" value=${dub} onChange=${e => setDub(e.target.value)}><option value="">${t.original}</option>${dubs.map(s => html`<option key=${s.lang} value=${s.lang}>${langName(s.lang, lang)}</option>`)}</select></label>
      ${subs.length > 0 && html`<span className="badge gold case">${subs.length} ${t.langsN}</span>`}
    </div>
  </div>`;
}

/* Educator: translate a lesson into any languages */
function TranslateModal({ ctx, lesson, onClose }) {
  const { t, lang } = ctx;
  const [tracks, , reload] = useAsync(() => api.tracks(lesson.id), [lesson.id]);
  const [sel, setSel] = useState(PLATFORM_LANGS); const [dub, setDub] = useState(false); const [busy, setBusy] = useState(false);
  const toggle = l => setSel(sel.includes(l) ? sel.filter(x => x !== l) : [...sel, l]);
  async function start() {
    setBusy(true); const r = await api.requestTranslation(lesson.id, sel, dub); setBusy(false);
    if (r?.error) ctx.toast(r.error.message || String(r.error)); else ctx.toast(r?.data?.configured === false ? t.trNotConfigured : t.trRequested);
    reload();
  }
  const status = l => (tracks || []).find(x => x.lang === l && x.kind === 'subtitles')?.status;
  return html`<${Modal} title=${t.translateTitle + ': ' + loc(lesson.title, lang)} onClose=${onClose}>
    <p className="muted" style=${{ margin: 0 }}>${t.translateLead}</p>
    <div className="row"><button className="btn sm" onClick=${() => setSel(WORLD_LANGS)}>${t.allLangs} · ${WORLD_LANGS.length}</button><button className="btn sm" onClick=${() => setSel(PLATFORM_LANGS)}>6</button><span className="muted">${sel.length} ${t.langsN}</span></div>
    <div className="lang-grid">${WORLD_LANGS.map(l => { const s = status(l); return html`<label key=${l} className=${'lang-chip' + (sel.includes(l) ? ' on' : '')}><input type="checkbox" checked=${sel.includes(l)} onChange=${() => toggle(l)} /><span>${langName(l, lang)}</span>${s && html`<i className=${'st ' + s} title=${t['st_' + s]}></i>`}</label>`; })}</div>
    <label className="check"><input id="tr-dub" type="checkbox" checked=${dub} onChange=${e => setDub(e.target.checked)} />${t.dubVoice}</label>
    <button className="btn gold" disabled=${busy || !sel.length} onClick=${start}>${busy ? t.loading : t.startTranslate}</button>
  <//>`;
}
