/* ================= v16: student tools — resume, speed/loop/mirror, notes, models, growth, portfolio ================= */
Object.assign(P, {
  mirror: 'M12 3v18M8 7 3 12l5 5M16 7l5 5-5 5',
  loop: 'M17 2l3 3-3 3M4 11V9a4 4 0 0 1 4-4h12M7 22l-3-3 3-3M20 13v2a4 4 0 0 1-4 4H4',
  note: 'M5 3h10l4 4v14H5zM14 3v5h5M8 13h8M8 17h5',
  camera: 'M4 8h3l2-3h6l2 3h3v11H4zM12 17a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7',
  play: P.play || 'M7 4v16l13-8z'
});
const fmtT = s => { s = Math.max(0, Math.floor(s || 0)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
const isUuid = x => /^[0-9a-f-]{36}$/i.test(String(x || ''));

D.notes = []; D.modelReplies = [];
D.modelCalls = [
  { id: 'mc1', author_id: 'demo-x1', author_name: 'Olena', city: 'Leiden', category_slug: 'hair-color', when_text: 'Saturday morning', body: 'Looking for a model with medium or long hair for a balayage, free of charge. Products are on me, the work is checked by my educator.', status: 'open', created_at: daysFromNow(-1), sample: true },
  { id: 'mc2', author_id: 'demo-x2', author_name: 'Marta', city: 'Amsterdam', category_slug: 'makeup', when_text: 'Next week, any evening', body: 'Need a model for a bridal makeup practice, about 1.5 hours. You get a free soft-glam look.', status: 'open', created_at: daysFromNow(-2), sample: true },
  { id: 'mc3', author_id: 'demo-x3', author_name: 'Daria', city: 'Rotterdam', category_slug: 'brows', when_text: 'Friday 14:00', body: 'Brow lamination and shaping practice. Model with natural brows, no tint in the last 4 weeks.', status: 'open', created_at: daysFromNow(-3), sample: true }
];

/* sample before/after images drawn in the browser (demo only) */
function demoHair(after, seed) {
  try {
    const c = document.createElement('canvas'); c.width = 600; c.height = 750; const g = c.getContext('2d');
    let r = seed || 7; const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280;
    const bg = g.createLinearGradient(0, 0, 0, 750); bg.addColorStop(0, '#1b1612'); bg.addColorStop(1, '#0c0a08'); g.fillStyle = bg; g.fillRect(0, 0, 600, 750);
    const base = after ? ['#5a3a22', '#c99a5c', '#f1d9a2'] : ['#3b2a1e', '#4a3324', '#5b3f2b'];
    for (let i = 0; i < 260; i++) {
      const x = 90 + rnd() * 420, w = 3 + rnd() * 9; const gr = g.createLinearGradient(0, 60, 0, 720);
      gr.addColorStop(0, base[0]); gr.addColorStop(after ? 0.35 + rnd() * 0.2 : 0.6, base[1]); gr.addColorStop(1, after && rnd() > 0.35 ? base[2] : base[1]);
      g.strokeStyle = gr; g.globalAlpha = 0.35 + rnd() * 0.5; g.lineWidth = w; g.beginPath(); g.moveTo(x, 60);
      g.bezierCurveTo(x + (rnd() - 0.5) * 120, 300, x + (rnd() - 0.5) * 160, 520, x + (rnd() - 0.5) * 90, 720); g.stroke();
    }
    g.globalAlpha = 1; return c.toDataURL('image/jpeg', 0.85);
  } catch (e) { return ''; }
}
let demoPf = null;
function demoPortfolio() {
  if (!demoPf) demoPf = [
    { id: 'pf1', title: 'Soft balayage on fine hair', category_slug: 'hair-color', before_url: demoHair(false, 3), after_url: demoHair(true, 3), grade: 92, created_at: daysFromNow(-4), sample: true },
    { id: 'pf2', title: 'Warm toner refresh', category_slug: 'hair-color', before_url: demoHair(false, 11), after_url: demoHair(true, 11), grade: 85, created_at: daysFromNow(-11), sample: true }
  ];
  return demoPf;
}

Object.assign(api, {
  async getPos(acct, lessonId) {
    const local = lsGet('smot-pos', {})[lessonId];
    if (MODE.demo || !acct || !isUuid(lessonId)) return local?.t || 0;
    const r = (await sb.from('watch_positions').select('position_sec').eq('user_id', acct.user.id).eq('lesson_id', lessonId).maybeSingle()).data;
    return r?.position_sec ?? local?.t ?? 0;
  },
  async savePos(acct, lesson, course, t, dur) {
    const m = lsGet('smot-pos', {}); m[lesson.id] = { t: Math.floor(t), dur: Math.floor(dur || 0), at: Date.now(), title: lesson.title, slug: course?.slug, ctitle: course?.title, cat: course?.category_id }; lsSet('smot-pos', m);
    if (MODE.demo || !acct || !isUuid(lesson.id)) return;
    await sb.from('watch_positions').upsert({ user_id: acct.user.id, lesson_id: lesson.id, position_sec: Math.floor(t), updated_at: new Date().toISOString() });
  },
  async lastWatched(acct) {
    const m = lsGet('smot-pos', {}); const loc0 = Object.entries(m).map(([id, v]) => ({ id, ...v })).sort((a, b) => b.at - a.at)[0];
    if (MODE.demo || !acct) return loc0 || null;
    const r = (await sb.from('watch_positions').select('position_sec,updated_at,lesson:lessons(id,title,duration_seconds,course:courses(slug,title,category_id))').eq('user_id', acct.user.id).order('updated_at', { ascending: false }).limit(1)).data?.[0];
    if (!r?.lesson) return loc0 || null;
    return { id: r.lesson.id, t: r.position_sec, dur: r.lesson.duration_seconds, title: r.lesson.title, slug: r.lesson.course?.slug, ctitle: r.lesson.course?.title, cat: r.lesson.course?.category_id };
  },
  async notes(acct, lessonId) {
    if (MODE.demo || !isUuid(lessonId)) return D.notes.filter(n => n.lesson_id === lessonId);
    return rows(await sb.from('lesson_notes').select('*').eq('user_id', acct.user.id).eq('lesson_id', lessonId).order('t_sec'));
  },
  async addNote(acct, lessonId, t_sec, body) {
    if (MODE.demo || !isUuid(lessonId)) { D.notes.push({ id: uid(), lesson_id: lessonId, t_sec, body }); return {}; }
    return sb.from('lesson_notes').insert({ user_id: acct.user.id, lesson_id: lessonId, t_sec, body });
  },
  async delNote(n) { if (MODE.demo || !isUuid(n.id)) { D.notes = D.notes.filter(x => x !== n); return {}; } return sb.from('lesson_notes').delete().eq('id', n.id); },
  async modelCalls() {
    if (MODE.demo) return D.modelCalls.filter(c => c.status === 'open' || c.mine);
    return rows(await sb.from('model_calls').select('*').order('created_at', { ascending: false }).limit(200));
  },
  async addModelCall(acct, f) {
    const author_name = acct.profile?.display_name || acct.user.email.split('@')[0];
    if (MODE.demo) { D.modelCalls.unshift({ id: uid(), author_id: acct.user.id, author_name, ...f, status: 'open', created_at: new Date().toISOString(), mine: true }); return {}; }
    return sb.from('model_calls').insert({ author_id: acct.user.id, author_name, city: f.city, category_slug: f.category_slug || null, when_text: f.when_text || null, body: f.body });
  },
  async closeModelCall(c) { if (MODE.demo) { c.status = 'closed'; return {}; } return sb.from('model_calls').update({ status: 'closed' }).eq('id', c.id); },
  async replyModel(acct, c, f) {
    if (MODE.demo) { D.modelReplies.push({ id: uid(), call_id: c.id, author_id: acct.user.id, ...f, created_at: new Date().toISOString() }); return {}; }
    return sb.from('model_replies').insert({ call_id: c.id, author_id: acct.user.id, name: f.name, contact: f.contact, body: f.body || null });
  },
  async modelReplies(c) {
    if (MODE.demo) return D.modelReplies.filter(r => r.call_id === c.id);
    return rows(await sb.from('model_replies').select('*').eq('call_id', c.id).order('created_at'));
  },
  async portfolio(userId) {
    if (MODE.demo) return [...(D.myPf || []), ...demoPortfolio()];
    return rows(await sb.rpc('portfolio_of', { p_user: userId }));
  },
  async addPortfolio(acct, f, before, after) {
    if (MODE.demo) { D.myPf = [{ id: uid(), ...f, before_url: before ? URL.createObjectURL(before) : null, after_url: URL.createObjectURL(after), grade: f.submission_id ? (D.submissions.find(s => s.id === f.submission_id)?.grade ?? null) : null, created_at: new Date().toISOString() }, ...(D.myPf || [])]; return {}; }
    const up = async (file, k) => { const path = `${acct.user.id}/pf-${k}-${Date.now()}.${extOf(file)}`; const r = await sb.storage.from('avatars').upload(path, file, { contentType: file.type }); if (r.error) throw r.error; return pubUrl('avatars', path); };
    try {
      const before_url = before ? await up(before, 'b') : null; const after_url = await up(after, 'a');
      return sb.from('portfolio_items').insert({ user_id: acct.user.id, title: f.title, category_slug: f.category_slug || null, before_url, after_url, submission_id: isUuid(f.submission_id) ? f.submission_id : null });
    } catch (e) { return { error: e }; }
  },
  async delPortfolio(it) { if (MODE.demo) { D.myPf = (D.myPf || []).filter(x => x.id !== it.id); demoPf = (demoPf || []).filter(x => x.id !== it.id); return {}; } return sb.from('portfolio_items').delete().eq('id', it.id); }
});

/* ---------- Study player: resume, speed, A-B loop, mirror, notes ---------- */
function StudyPlayer({ ctx, lesson, url, cat, course }) {
  const { t, lang, acct } = ctx;
  const vref = useRef();
  const dur0 = lesson.duration_seconds || 900;
  const [rate, setRate] = useState(1); const [mirror, setMirror] = useState(false);
  const [A, setA] = useState(null); const [B, setB] = useState(null);
  const [now, setNow] = useState(0); const [dur, setDur] = useState(dur0); const [resumed, setResumed] = useState(0);
  const nowRef = useRef(0); nowRef.current = now;
  const seek = s => { const v = vref.current; if (v && url) v.currentTime = s; setNow(s); };
  useEffect(() => { let off = false; (async () => { const p = await api.getPos(acct, lesson.id); if (!off && p > 5 && p < dur0 - 5) { seek(p); setResumed(p); } })(); return () => { off = true; }; }, [lesson.id, url]);
  useEffect(() => { // demo clock when there is no real video
    if (url) return; const id = setInterval(() => setNow(n => { let x = n + 0.25 * rate; if (A != null && B != null && x > B) x = A; return Math.min(x, dur0); }), 250); return () => clearInterval(id);
  }, [url, rate, A, B]);
  useEffect(() => { const v = vref.current; if (!v) return; v.playbackRate = rate;
    const tu = () => { if (A != null && B != null && v.currentTime > B) v.currentTime = A; setNow(v.currentTime); };
    const md = () => { if (v.duration && isFinite(v.duration)) setDur(v.duration); if (nowRef.current > 1) v.currentTime = nowRef.current; };
    v.addEventListener('timeupdate', tu); v.addEventListener('loadedmetadata', md); return () => { v.removeEventListener('timeupdate', tu); v.removeEventListener('loadedmetadata', md); };
  }, [url, rate, A, B]);
  useEffect(() => { const id = setInterval(() => api.savePos(acct, lesson, course, nowRef.current, dur), 5000); return () => { clearInterval(id); api.savePos(acct, lesson, course, nowRef.current, dur); }; }, [lesson.id, dur]);
  return html`<div className="study">
    <${LessonPlayer} ctx=${ctx} lesson=${lesson} url=${url} cat=${cat} vref=${vref} mirror=${mirror} demoT=${url ? 0 : now} demoDur=${url ? 0 : dur0} />
    ${resumed > 0 && html`<div className="resume-chip"><${Icon} n="play" s=${14} /> ${t.resumedAt} ${fmtT(resumed)} <button className="link" onClick=${() => { seek(0); setResumed(0); }}>${t.fromStart}</button></div>`}
    <div className="tools">
      <div className="tool"><span className="tool-l">${t.speed}</span><div className="seg-s">${[0.5, 0.75, 1, 1.25, 1.5, 2].map(r => html`<button key=${r} className=${rate === r ? 'on' : ''} onClick=${() => setRate(r)}>${r}×</button>`)}</div></div>
      <div className="tool"><span className="tool-l"><${Icon} n="loop" s=${14} /> ${t.loopPart}</span><div className="seg-s">
        <button className=${A != null ? 'on' : ''} onClick=${() => { setA(Math.floor(now)); if (B != null && B <= now) setB(null); }}>${t.setA}${A != null ? ' ' + fmtT(A) : ''}</button>
        <button className=${B != null ? 'on' : ''} disabled=${A == null} onClick=${() => now > A && setB(Math.ceil(now))}>${t.setB}${B != null ? ' ' + fmtT(B) : ''}</button>
        ${(A != null || B != null) && html`<button onClick=${() => { setA(null); setB(null); }} aria-label=${t.clearLoop}>×</button>`}</div></div>
      <button className=${'btn sm' + (mirror ? ' gold' : '')} onClick=${() => setMirror(!mirror)} title=${t.mirrorHint}><${Icon} n="mirror" s=${15} /> ${t.mirror}</button>
    </div>
    ${A != null && B != null && html`<small className="muted">${t.loopOn}: ${fmtT(A)}–${fmtT(B)}</small>`}
    ${mirror && html`<small className="muted">${t.mirrorHint}</small>`}
    <${NotesPanel} ctx=${ctx} lesson=${lesson} now=${now} seek=${seek} />
    <${QuestionsPanel} ctx=${ctx} lesson=${lesson} course=${course} now=${now} seek=${seek} />
  </div>`;
}
function NotesPanel({ ctx, lesson, now, seek }) {
  const { t, acct } = ctx;
  const [list, , reload] = useAsync(() => acct ? api.notes(acct, lesson.id) : [], [lesson.id, acct?.user.id]);
  const [body, setBody] = useState('');
  if (!acct) return html`<div className="notes"><b><${Icon} n="note" s=${16} /> ${t.myNotes}</b><small className="muted">${t.signInNotes}</small></div>`;
  async function add(e) { e.preventDefault(); if (!body.trim()) return; const r = await api.addNote(acct, lesson.id, Math.floor(now), body.trim()); if (r?.error) ctx.toast(r.error.message); else { setBody(''); reload(); } }
  return html`<div className="notes">
    <b><${Icon} n="note" s=${16} /> ${t.myNotes}</b>
    <form className="note-add" onSubmit=${add}><input id="note-body" maxLength="1000" placeholder=${t.notePh} value=${body} onInput=${e => setBody(e.target.value)} /><button className="btn sm gold">${t.addNoteAt} ${fmtT(now)}</button></form>
    ${(list || []).length ? html`<ul className="note-list">${[...list].sort((a, b) => a.t_sec - b.t_sec).map(n => html`<li key=${n.id}><button className="tc" onClick=${() => seek(n.t_sec)}>${fmtT(n.t_sec)}</button><span>${n.body}</span><button className="x" aria-label="×" onClick=${async () => { await api.delNote(n); reload(); }}>×</button></li>`)}</ul>` : html`<small className="muted">${t.noNotes}</small>`}
  </div>`;
}
function ContinueCard({ ctx }) {
  const { t, lang } = ctx;
  const [last] = useAsync(() => api.lastWatched(ctx.acct), [ctx.dataKey, ctx.acct?.user.id]);
  if (!last || !last.slug || !(last.t > 5)) return null;
  const cat = ctx.cats.find(c => c.id === last.cat);
  const pct = last.dur ? Math.min(100, Math.round(last.t / last.dur * 100)) : 0;
  const open = () => { try { sessionStorage.setItem('smot-open', last.id); } catch (e) {} go('course-' + last.slug); };
  return html`<section className="section"><button className="continue" onClick=${open}>
    <div className="cont-thumb"><${Cover} k=${cat?.slug} ratio="16/9" mark=${false} /><span className="vplay"><${Icon} n="play" s=${22} fill=${true} /></span></div>
    <div className="cont-body"><span className="eyebrow">${t.continueWatching}</span><b>${loc(last.title, lang)}</b><small className="muted">${loc(last.ctitle, lang)} · ${fmtT(last.t)}${last.dur ? ' / ' + fmtT(last.dur) : ''}</small><div className="bar"><i style=${{ width: pct + '%' }}></i></div></div>
  </button></section>`;
}

/* ---------- Growth chart from master grades ---------- */
function GrowthChart({ ctx, subs }) {
  const { t, lang } = ctx;
  const g = (subs || []).filter(s => s.status === 'reviewed' && s.grade != null).sort((a, b) => new Date(a.submitted_at) - new Date(b.submitted_at));
  if (g.length < 2) return html`<section className="section"><${SectionHead} title=${t.growth} /><${Empty} text=${t.noGrowth} /></section>`;
  const W = 460, H = 220, L = 34, R = 18, T = 24, Bm = 30;
  const x = i => L + (W - L - R) * (g.length === 1 ? 0.5 : i / (g.length - 1)); const y = v => T + (H - T - Bm) * (1 - v / 100);
  const pts = g.map((s, i) => [x(i), y(s.grade)]);
  const line = pts.map(p => p.join(',')).join(' ');
  const area = `${L},${y(0)} ${line} ${pts[pts.length - 1][0]},${y(0)}`;
  const first = g[0], last = g[g.length - 1];
  const crit = RUBRIC.map(r => { const a = first.rubric_scores?.[r.key], b = last.rubric_scores?.[r.key]; return a != null && b != null ? { k: r.key, a: Math.round(a / r.max * 100), b: Math.round(b / r.max * 100) } : null; }).filter(Boolean);
  return html`<section className="section"><${SectionHead} title=${t.growth} />
    <div className="card growth">
      <div className="growth-top"><div><span className="eyebrow">${t.growthLead}</span><div className="growth-num"><span>${first.grade}</span><${Icon} n="arrow" s=${22} /><b>${last.grade}</b><small>/100</small></div></div><span className="badge gold case">+${last.grade - first.grade}</span></div>
      <div className="chart-wrap"><svg viewBox=${`0 0 ${W} ${H}`} role="img" aria-label=${t.growth}>
        <defs><linearGradient id="gArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f1d9a2" stopOpacity=".35" /><stop offset="1" stopColor="#f1d9a2" stopOpacity="0" /></linearGradient></defs>
        ${[0, 50, 100].map(v => html`<g key=${v}><line x1=${L} x2=${W - R} y1=${y(v)} y2=${y(v)} stroke="rgba(241,217,162,.12)" /><text x=${L - 8} y=${y(v) + 4} textAnchor="end" fill="#a39b8e" fontSize="13">${v}</text></g>`)}
        <polygon points=${area} fill="url(#gArea)" />
        <polyline points=${line} fill="none" stroke="#f1d9a2" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
        ${pts.map((p, i) => html`<g key=${i}><circle cx=${p[0]} cy=${p[1]} r=${i === pts.length - 1 ? 6 : 4} fill=${i === pts.length - 1 ? '#f1d9a2' : '#0d0b08'} stroke="#f1d9a2" strokeWidth="2" /><text x=${p[0]} y=${p[1] - 12} textAnchor="middle" fill="#ece4d6" fontSize="15" fontWeight="600">${g[i].grade}</text><text x=${p[0]} y=${H - 8} textAnchor="middle" fill="#a39b8e" fontSize="12">${fmtDate(g[i].submitted_at, lang, { day: 'numeric', month: 'short' })}</text></g>`)}
      </svg></div>
      ${crit.length > 0 && html`<div className="crit">${crit.map(c => html`<div key=${c.k} className="crit-row"><span>${t['r_' + c.k]}</span><div className="crit-bar"><i className="was" style=${{ width: c.a + '%' }}></i><i className="now" style=${{ width: c.b + '%' }}></i></div><small>${c.a}% → <b>${c.b}%</b></small></div>`)}</div>`}
    </div>
  </section>`;
}
function GrowthSection({ ctx }) {
  const [learn] = useAsync(() => api.learning(ctx.acct.user.id), [ctx.dataKey, ctx.acct.user.id]);
  if (!learn) return null; return html`<${GrowthChart} ctx=${ctx} subs=${learn.submissions} />`;
}

/* ---------- Models board ---------- */
function ModelsPage({ ctx }) {
  const { t, lang, acct } = ctx;
  const [list, , reload] = useAsync(() => api.modelCalls(), [ctx.dataKey]);
  const [city, setCity] = useState(''); const [cat, setCat] = useState('');
  const [form, setForm] = useState(false); const [reply, setReply] = useState(null); const [mine, setMine] = useState(null);
  const shown = (list || []).filter(c => (!city || (c.city || '').toLowerCase().includes(city.toLowerCase())) && (!cat || c.category_slug === cat));
  const catName = s => { const c = ctx.cats.find(x => x.slug === s); return c ? loc(c.name, lang) : ''; };
  const isMine = c => acct && (c.author_id === acct.user.id || c.mine);
  return html`<div>
    <section className="section soul-hero"><span className="eyebrow">${t.practice}</span><h1>${t.models}</h1><p>${t.modelsLead}</p>
      <button className="btn gold" onClick=${() => acct ? setForm(true) : go('account')}><${Icon} n="camera" s=${16} /> ${t.postCall}</button></section>
    <section className="section"><div className="filters"><label className="field">${t.city}<input id="mc-city" value=${city} onInput=${e => setCity(e.target.value)} placeholder="Leiden, Amsterdam…" /></label>
      <label className="field">${t.direction}<select id="mc-cat" value=${cat} onChange=${e => setCat(e.target.value)}><option value="">${t.allDirections}</option>${ctx.cats.map(c => html`<option key=${c.slug} value=${c.slug}>${loc(c.name, lang)}</option>`)}</select></label></div></section>
    <section className="section">${shown.length ? html`<div className="grid">${shown.map(c => html`<article key=${c.id} className="card model-card">
        <div className="row" style=${{ justifyContent: 'space-between' }}><span className="badge tag">${c.city}</span>${catName(c.category_slug) && html`<span className="badge plain case">${catName(c.category_slug)}</span>`}</div>
        ${c.when_text && html`<b><${Icon} n="cal" s=${15} /> ${c.when_text}</b>`}
        <p>${c.body}</p>
        <small className="muted">${c.author_name || t.member} · ${fmtDate(c.created_at, lang, { day: 'numeric', month: 'short' })}${c.sample ? ' · ' + t.sample : ''}</small>
        ${isMine(c) ? html`<div className="row"><button className="btn sm" onClick=${() => setMine(c)}>${t.replies}</button>${c.status === 'open' && html`<button className="btn sm" onClick=${async () => { await api.closeModelCall(c); reload(); }}>${t.closeCall}</button>`}</div>`
          : html`<button className="btn sm gold" onClick=${() => acct ? setReply(c) : go('account')}>${t.beModel}</button>`}
      </article>`)}</div>` : html`<${Empty} text=${t.noCalls} />`}
      <p className="muted" style=${{ marginTop: '14px', fontSize: '13px' }}>${t.modelSafety}</p></section>
    ${form && html`<${ModelCallForm} ctx=${ctx} onClose=${() => setForm(false)} onDone=${() => { setForm(false); reload(); }} />`}
    ${reply && html`<${ModelReplyForm} ctx=${ctx} call=${reply} onClose=${() => setReply(null)} />`}
    ${mine && html`<${ModelRepliesModal} ctx=${ctx} call=${mine} onClose=${() => setMine(null)} />`}
  </div>`;
}
function ModelCallForm({ ctx, onClose, onDone }) {
  const { t, lang, acct } = ctx;
  const [f, setF] = useState({ city: acct.profile?.city || '' }); const [busy, setBusy] = useState(false);
  const set = k => e => setF({ ...f, [k]: e.target.value });
  async function send(e) { e.preventDefault(); setBusy(true); const r = await api.addModelCall(acct, f); setBusy(false); if (r?.error) ctx.toast(r.error.message); else { ctx.toast(t.saved); onDone(); } }
  return html`<${Modal} title=${t.postCall} onClose=${onClose}><form className="form" onSubmit=${send}>
    <div className="two"><label className="field">${t.city}<input id="mcf-city" required minLength="2" maxLength="80" value=${f.city} onInput=${set('city')} /></label>
    <label className="field">${t.direction}<select id="mcf-cat" value=${f.category_slug || ''} onChange=${set('category_slug')}><option value="">—</option>${ctx.cats.map(c => html`<option key=${c.slug} value=${c.slug}>${loc(c.name, lang)}</option>`)}</select></label></div>
    <label className="field">${t.whenText}<input id="mcf-when" maxLength="120" value=${f.when_text || ''} onInput=${set('when_text')} /></label>
    <label className="field">${t.callBody}<textarea id="mcf-body" required minLength="10" maxLength="1000" value=${f.body || ''} onInput=${set('body')}></textarea></label>
    <button className="btn gold" disabled=${busy}>${busy ? t.loading : t.publish}</button></form><//>`;
}
function ModelReplyForm({ ctx, call, onClose }) {
  const { t, acct } = ctx;
  const [f, setF] = useState({ name: (acct.profile?.display_name || '').split(' ')[0] }); const [busy, setBusy] = useState(false);
  const set = k => e => setF({ ...f, [k]: e.target.value });
  async function send(e) { e.preventDefault(); setBusy(true); const r = await api.replyModel(acct, call, f); setBusy(false); if (r?.error) ctx.toast(r.error.message); else { ctx.toast(t.replySent); onClose(); } }
  return html`<${Modal} title=${t.beModel} onClose=${onClose}><form className="form" onSubmit=${send}>
    <p className="muted" style=${{ margin: 0 }}>${call.city}${call.when_text ? ' · ' + call.when_text : ''}</p>
    <label className="field">${t.yourName}<input id="mr-name" required maxLength="80" value=${f.name || ''} onInput=${set('name')} /></label>
    <label className="field">${t.contactField}<input id="mr-contact" required minLength="3" maxLength="160" value=${f.contact || ''} onInput=${set('contact')} /></label>
    <label className="field">${t.message}<textarea id="mr-body" maxLength="600" value=${f.body || ''} onInput=${set('body')}></textarea></label>
    <small className="muted">${t.contactPrivate}</small>
    <button className="btn gold" disabled=${busy}>${busy ? t.loading : t.send}</button></form><//>`;
}
function ModelRepliesModal({ ctx, call, onClose }) {
  const { t, lang } = ctx;
  const [list] = useAsync(() => api.modelReplies(call), [call.id]);
  return html`<${Modal} title=${t.replies} onClose=${onClose}>${(list || []).length ? html`<div className="list">${list.map(r => html`<div key=${r.id} className="li"><div className="grow"><b>${r.name}</b><small>${r.contact}</small>${r.body && html`<small style=${{ display: 'block', color: '#d4cec5' }}>${r.body}</small>`}</div><small className="muted">${fmtDate(r.created_at, lang, { day: 'numeric', month: 'short' })}</small></div>`)}</div>` : html`<${Empty} text=${t.noReplies} />`}<//>`;
}

/* ---------- Portfolio: before / after ---------- */
function BeforeAfter({ before, after, t }) {
  const [x, setX] = useState(50);
  if (!before) return html`<div className="ba"><img src=${after} alt="" /></div>`;
  return html`<div className="ba">
    <img src=${after} alt=${t.after} />
    <div className="ba-before" style=${{ clipPath: `inset(0 ${100 - x}% 0 0)` }}><img src=${before} alt=${t.before} /></div>
    <div className="ba-line" style=${{ left: x + '%' }}><span>⟷</span></div>
    <span className="ba-tag l">${t.before}</span><span className="ba-tag r">${t.after}</span>
    <input type="range" min="0" max="100" value=${x} onInput=${e => setX(+e.target.value)} aria-label=${t.before + ' / ' + t.after} />
  </div>`;
}
function PortfolioItem({ ctx, it, onDelete }) {
  const { t, lang } = ctx; const c = ctx.cats.find(x => x.slug === it.category_slug);
  return html`<article className="pf-item"><${BeforeAfter} before=${it.before_url} after=${it.after_url} t=${t} />
    <div className="pf-meta"><div style=${{ minWidth: 0 }}><b>${it.title}</b><small className="muted">${c ? loc(c.name, lang) + ' · ' : ''}${fmtDate(it.created_at, lang, { day: 'numeric', month: 'short', year: 'numeric' })}${it.sample ? ' · ' + t.sample : ''}</small></div>
      ${it.grade != null && html`<span className="grade-seal" title=${t.verifiedGrade}><b>${Math.round(it.grade)}</b><small>${t.masterGrade}</small></span>`}</div>
    ${onDelete && html`<button className="link" style=${{ justifySelf: 'start' }} onClick=${() => onDelete(it)}>${t.pfDelete}</button>`}
  </article>`;
}
function PortfolioTab({ ctx }) {
  const { t, acct } = ctx;
  const [list, , reload] = useAsync(() => api.portfolio(acct.user.id), [ctx.dataKey, acct.user.id]);
  const [form, setForm] = useState(false);
  async function share() { const u = location.href.split('#')[0] + '#portfolio-' + acct.user.id; try { await navigator.clipboard.writeText(u); ctx.toast(t.linkCopied); } catch (e) { ctx.toast(u); } }
  return html`<section className="section">
    <div className="section-head"><div><h2 style=${{ fontSize: '22px' }}>${t.portfolio}</h2><p className="muted" style=${{ margin: '4px 0 0', maxWidth: '60ch' }}>${t.portfolioLead}</p></div>
      <div className="row"><button className="btn sm" onClick=${share}><${Icon} n="share" s=${14} /> ${t.shareLink}</button><button className="btn sm gold" onClick=${() => setForm(true)}>${t.addWork}</button></div></div>
    ${(list || []).length ? html`<div className="pf-grid">${list.map(it => html`<${PortfolioItem} key=${it.id} ctx=${ctx} it=${it} onDelete=${async x => { await api.delPortfolio(x); reload(); }} />`)}</div>` : html`<${Empty} text=${t.emptyPf} />`}
    ${form && html`<${PortfolioForm} ctx=${ctx} onClose=${() => setForm(false)} onDone=${() => { setForm(false); reload(); }} />`}
  </section>`;
}
function PortfolioForm({ ctx, onClose, onDone }) {
  const { t, lang, acct } = ctx;
  const [learn] = useAsync(() => api.learning(acct.user.id), [acct.user.id]);
  const [f, setF] = useState({}); const [b, setB] = useState(null); const [a, setA] = useState(null); const [busy, setBusy] = useState(false);
  const graded = (learn?.submissions || []).filter(s => s.status === 'reviewed' && s.grade != null);
  const set = k => e => setF({ ...f, [k]: e.target.value });
  async function send(e) { e.preventDefault(); if (!a) return; setBusy(true); const r = await api.addPortfolio(acct, f, b, a); setBusy(false); if (r?.error) ctx.toast(r.error.message || String(r.error)); else { ctx.toast(t.saved); onDone(); } }
  return html`<${Modal} title=${t.addWork} onClose=${onClose}><form className="form" onSubmit=${send}>
    <label className="field">${t.workTitle}<input id="pf-title" required minLength="2" maxLength="120" value=${f.title || ''} onInput=${set('title')} /></label>
    <label className="field">${t.direction}<select id="pf-cat" value=${f.category_slug || ''} onChange=${set('category_slug')}><option value="">—</option>${ctx.cats.map(c => html`<option key=${c.slug} value=${c.slug}>${loc(c.name, lang)}</option>`)}</select></label>
    <div className="two"><label className="field">${t.beforePhoto}<input id="pf-before" type="file" accept="image/jpeg,image/png,image/webp" onChange=${e => setB(e.target.files[0] || null)} /></label>
    <label className="field">${t.afterPhoto}<input id="pf-after" type="file" required accept="image/jpeg,image/png,image/webp" onChange=${e => setA(e.target.files[0] || null)} /></label></div>
    <label className="field">${t.linkGraded}<select id="pf-sub" value=${f.submission_id || ''} onChange=${set('submission_id')}><option value="">${t.noLink}</option>${graded.map(s => html`<option key=${s.id} value=${s.id}>${s.file_name} · ${s.grade}/100</option>`)}</select></label>
    <small className="muted">${t.gradeHonest}</small>
    <button className="btn gold" disabled=${busy || !a}>${busy ? t.loading : t.save}</button></form><//>`;
}
function PortfolioPage({ ctx, uid: who }) {
  const { t, acct } = ctx;
  const id = who || acct?.user.id;
  const [list] = useAsync(() => id ? api.portfolio(id) : [], [id, ctx.dataKey]);
  const name = (list || [])[0]?.display_name || (acct && id === acct.user.id ? acct.profile?.display_name : '') || t.member;
  const avg = (list || []).filter(x => x.grade != null); const mean = avg.length ? Math.round(avg.reduce((s, x) => s + Number(x.grade), 0) / avg.length) : null;
  return html`<div>
    <section className="section soul-hero"><span className="eyebrow">${t.portfolio}</span><h1>${name}</h1>
      <div className="row" style=${{ justifyContent: 'center' }}><span className="badge case">${(list || []).length} ${t.worksN}</span>${mean != null && html`<span className="badge gold case">${t.avgGrade}: ${mean}/100</span>`}</div></section>
    <section className="section">${(list || []).length ? html`<div className="pf-grid">${list.map(it => html`<${PortfolioItem} key=${it.id} ctx=${ctx} it=${it} />`)}</div>` : html`<${Empty} text=${t.emptyPf} />`}</section>
  </div>`;
}

function AutoOpen({ lessons, enrolled, watch }) {
  useEffect(() => { let id = null; try { id = sessionStorage.getItem('smot-open'); } catch (e) {} const l = id && lessons.find(x => x.id === id); if (l && (enrolled || l.is_preview)) { try { sessionStorage.removeItem('smot-open'); } catch (e) {} watch(l); } }, [lessons.length, enrolled]);
  return null;
}
