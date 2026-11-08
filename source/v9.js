/* ================= v10: video-first platform, paid lessons, quick upload, path to state recognition ================= */
Object.assign(api, {
  async library() {
    if (MODE.demo) return D.courses.filter(c => c.status === 'published').flatMap(c => (D.lessons[c.id] || []).map(l => ({ ...l, course: c })));
    const courses = await api.courses();
    if (!courses.length) return [];
    const ls = rows(await sb.from('lessons').select('id,course_id,title,duration_seconds,sort_order,is_preview,video_asset_id').in('course_id', courses.map(c => c.id)).order('sort_order'));
    return ls.map(l => ({ ...l, course: courses.find(c => c.id === l.course_id) }));
  },
  async buyCourse(userId, course) {
    /* Online payment (Stripe Checkout) is connected in the next step; until then the button explains how to buy. */
    return { pending: true };
  }
});
const hoursOf = lessons => Math.max(1, Math.round((lessons || []).reduce((s, l) => s + (l.duration_seconds || 0), 0) / 3600));

function LessonTile({ l, ctx, onOpen }) {
  const { t, lang, cats } = ctx;
  const cat = cats.find(c => c.id === l.course?.category_id);
  const who = l.course?.instructor?.display_name || (l.course?.instructor_id === D.educator.id ? D.educator.display_name : '');
  return html`<button className="vtile" onClick=${() => onOpen(l)}>
    <div className="vthumb"><${Cover} k=${cat?.slug} img=${l.course?.cover_image_url} ratio="16/9" mark=${false} />
      <span className="vplay"><${Icon} n="play" s=${22} fill=${true} /></span>
      ${l.duration_seconds && html`<span className="vdur">${Math.round(l.duration_seconds / 60)} ${t.min}</span>`}
      <span className="vcc" title=${t.inYourLang}><${Icon} n="globe" s=${11} /> CC</span>
      <span className=${'vbadge ' + (l.is_preview ? 'free' : 'paid')}>${l.is_preview ? t.free : html`<${Icon} n="lock" s=${12} /> ${fmtPrice(l.course?.price_cents, lang, t)}`}</span>
    </div>
    <b>${loc(l.title, lang)}</b>
    <small>${[who, cat && loc(cat.name, lang)].filter(Boolean).join(' · ')}</small>
  </button>`;
}
function useLessonPlayer(ctx) {
  const { t, lang, acct } = ctx;
  const [open, setOpen] = useState(null); const [url, setUrl] = useState(null);
  async function play(l) { setOpen(l); setUrl(null); if (l.is_preview || l.enrolled) setUrl(await api.videoUrl(l.video_asset_id)); }
  async function buy(c) { if (!acct) return go('account'); const r = await api.buyCourse(acct.user.id, c); if (r?.pending) ctx.toast(t.payingSoon); }
  const modal = open && html`<${Modal} title=${loc(open.title, lang)} onClose=${() => setOpen(null)}>
    ${open.is_preview ? html`<${StudyPlayer} ctx=${ctx} lesson=${open} url=${url} course=${open.course} cat=${(ctx.cats.find(c => c.id === open.course?.category_id) || {}).slug} />`
      : html`<div className="vthumb big locked"><${Cover} k=${(ctx.cats.find(c => c.id === open.course?.category_id) || {}).slug} ratio="16/9" mark=${false} /><span className="vplay"><${Icon} n="lock" s=${26} /></span></div>
        <div className="row" style=${{ justifyContent: 'space-between' }}><span className="badge tag">${t.locked2}</span><span className="price" style=${{ fontSize: '22px' }}>${fmtPrice(open.course?.price_cents, lang, t)}</span></div>`}
    <b>${loc(open.course?.title, lang)}</b>
    <div className="row">${!open.is_preview && html`<button className="btn gold" onClick=${() => buy(open.course)}>${t.buyCourse}</button>`}<button className="btn" onClick=${() => { setOpen(null); go('course-' + open.course?.slug); }}>${t.openProgram}</button></div>
  <//>`;
  return [play, modal];
}
function VideoShelves({ ctx }) {
  const { t } = ctx;
  const [lib] = useAsync(() => api.library(), [ctx.dataKey]);
  const [play, modal] = useLessonPlayer(ctx);
  const all = lib || [];
  const free = all.filter(l => l.is_preview);
  const shelves = FACULTIES.map(f => [f, all.filter(l => (ctx.cats.find(c => c.id === l.course?.category_id) || {}).faculty === f)]).filter(([, ls]) => ls.length);
  return html`<section className="section">
    <div className="section-head"><div><span className="eyebrow">${t.videos}</span><h2 style=${{ fontSize: '24px', marginTop: '4px' }}>${t.sl6t}</h2></div><button className="link" onClick=${() => go('videos')}>${t.viewAll} <${Icon} n="arrow" s=${16} /></button></div>
    ${!lib ? html`<div className="skeleton" style=${{ height: '180px' }}></div>` : html`
      ${free.length > 0 && html`<div className="shelf"><b>${t.freeLessons}</b><div className="shelf-row">${free.map(l => html`<${LessonTile} key=${l.id} l=${l} ctx=${ctx} onOpen=${play} />`)}</div></div>`}
      ${shelves.map(([f, ls]) => html`<div key=${f} className="shelf"><b>${t['fac_' + f]}</b><div className="shelf-row">${ls.slice(0, 12).map(l => html`<${LessonTile} key=${l.id} l=${l} ctx=${ctx} onOpen=${play} />`)}</div></div>`)}`}
    <div className="row"><button className="btn gold" onClick=${() => go('upload')}><${Icon} n="upload" s=${16} /> ${t.upl}</button></div>
    ${modal}
  </section>`;
}
function VideosPage({ ctx, slug }) {
  const { t, lang, cats } = ctx;
  const [lib] = useAsync(() => api.library(), [ctx.dataKey]);
  const [sel, setSel] = useState(null);
  const [play, modal] = useLessonPlayer(ctx);
  const list = (lib || []).filter(l => !sel || (cats.find(c => c.id === l.course?.category_id) || {}).slug === sel);
  return html`<div>
    <section className="section" style=${{ marginTop: '6px' }}><${Crumbs} items=${[[t.homeCrumb, 'home'], [t.videos, null]]} /></section>
    <section className="section"><h1 style=${{ font: "600 italic clamp(32px,5vw,52px) var(--serif)", color: 'var(--gold-2)' }}>${t.videos}</h1><p className="muted" style=${{ margin: 0 }}>${t.sl6d}</p>
      <div className="row"><button className="btn gold" onClick=${() => go('upload')}><${Icon} n="upload" s=${16} /> ${t.upl}</button></div></section>
    <section className="section"><${Directions} ctx=${ctx} selected=${sel} onPick=${setSel} /></section>
    <section className="section">${!lib ? html`<div className="skeleton"></div>` : list.length ? html`<div className="vgrid">${list.map(l => html`<${LessonTile} key=${l.id} l=${l} ctx=${ctx} onOpen=${play} />`)}</div>` : html`<${Empty} text=${t.noCoursesDir} />`}</section>
    ${modal}
  </div>`;
}
function UploadPage({ ctx }) {
  const { t, lang, acct, cats } = ctx;
  const isEdu = acct?.roles.includes('instructor') || acct?.roles.includes('admin');
  const [mine, , reload] = useAsync(() => isEdu ? api.teaching(acct.user.id) : [], [ctx.dataKey, acct?.user?.id]);
  const [f, setF] = useState({ course: '', title: '', minutes: '', preview: false, newTitle: '', newCat: '', newPrice: '', auto: true });
  const [file, setFile] = useState(null); const [busy, setBusy] = useState(false);
  const set = k => e => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  if (!acct || !isEdu) return html`<div className="path"><${Crumbs} items=${[[t.homeCrumb, 'home'], [t.uploadLesson, null]]} /><section className="q"><h1>${t.uploadLesson}</h1><${Empty} text=${t.onlyEducators}><button className="btn gold" onClick=${() => go('path-master')}>${t.pathMaster} <${Icon} n="arrow" s=${16} /></button><//></section></div>`;
  async function send(e) {
    e.preventDefault(); if (!file || !f.title) return;
    setBusy(true);
    let courseId = f.course;
    if (courseId === 'new') {
      const r = await api.createCourse(acct.user.id, { title: f.newTitle, description: '', category_id: f.newCat, price: f.newPrice }, lang);
      if (r?.error) { setBusy(false); return ctx.toast(r.error.message); }
      const fresh = await api.teaching(acct.user.id); courseId = (fresh.find(c => loc(c.title, lang) === f.newTitle) || fresh[0])?.id;
    }
    const lessons = (mine || []).find(c => c.id === courseId)?.lesson_count || 0;
    const r = await api.addLesson(courseId, { title: { [lang]: f.title, en: f.title }, description: {}, minutes: f.minutes, is_preview: f.preview }, file, lessons + 1);
    setBusy(false);
    if (!r?.error && f.auto) {
      const ls = MODE.demo ? (D.lessons[courseId] || []) : rows(await sb.from('lessons').select('id,sort_order').eq('course_id', courseId).order('sort_order', { ascending: false }).limit(1));
      const nl = MODE.demo ? ls[ls.length - 1] : ls[0];
      if (nl) await api.requestTranslation(nl.id, PLATFORM_LANGS, false);
    }
    if (r?.error) ctx.toast(r.error.message); else { ctx.toast(t.uploadDone); setF({ ...f, title: '', minutes: '', preview: false }); setFile(null); e.target.reset(); reload(); ctx.bump(); }
  }
  return html`<div className="path">
    <${Crumbs} items=${[[t.homeCrumb, 'home'], [t.videos, 'videos'], [t.uploadLesson, null]]} />
    <section className="q"><h1>${t.uploadLesson}</h1><p className="muted" style=${{ margin: 0 }}>${t.uploadLead}</p>
      <form className="form card upload-card" onSubmit=${send}>
        <label className="drop"><input id="up-file" type="file" accept="video/*" required onChange=${e => setFile(e.target.files[0] || null)} /><span className="ic"><${Icon} n="upload" s=${30} /></span><b>${file ? file.name : t.videoFile}</b><small>${file ? Math.round(file.size / 1048576) + ' MB' : 'MP4 · MOV · WEBM'}</small></label>
        <label className="field">${t.pickCourse}<select id="up-course" required value=${f.course} onChange=${set('course')}><option value="">—</option>${(mine || []).map(c => html`<option key=${c.id} value=${c.id}>${loc(c.title, lang)}</option>`)}<option value="new">+ ${t.quickCourse}</option></select></label>
        ${f.course === 'new' && html`<div className="two"><label className="field">${t.courseTitle}<input id="up-ntitle" required value=${f.newTitle} onInput=${set('newTitle')} /></label><label className="field">${t.category}<select id="up-ncat" required value=${f.newCat} onChange=${set('newCat')}><option value="">—</option>${cats.map(c => html`<option key=${c.id} value=${c.id}>${loc(c.name, lang)}</option>`)}</select></label></div>
          <label className="field">${t.price}<input id="up-nprice" type="number" min="0" inputMode="numeric" value=${f.newPrice} onInput=${set('newPrice')} /></label>`}
        <label className="field">${t.lessonTitle}<input id="up-title" required value=${f.title} onInput=${set('title')} /></label>
        <label className="field">${t.durationMin}<input id="up-min" type="number" min="0" inputMode="numeric" value=${f.minutes} onInput=${set('minutes')} /></label>
        <label className="check"><input id="up-prev" type="checkbox" checked=${f.preview} onChange=${set('preview')} />${t.isPreview}</label>
        <label className="check"><input id="up-auto" type="checkbox" checked=${f.auto} onChange=${set('auto')} /><span><${Icon} n="globe" s=${14} /> ${t.autoTranslate}</span></label>
        <button className="btn gold" disabled=${busy}>${busy ? t.uploading : t.uploadBtn}</button>
      </form>
    </section>
  </div>`;
}
function StateRecognition({ ctx }) {
  const { t } = ctx;
  return html`<section className="section"><div className="card state">
    <span className="eyebrow">${t.stateTitle}</span>
    <p style=${{ margin: 0, fontSize: '16px' }}>${t.stateText}</p>
    <div className="state-grid">
      <div><b>🇳🇱 NL</b><span>${t.stateNL}</span></div>
      <div><b>🇺🇦 UA</b><span>${t.stateUA}</span></div>
      <div className="have"><b>${t.stateHave}</b><span>${t.stateHaveD}</span></div>
    </div>
  </div></section>`;
}
