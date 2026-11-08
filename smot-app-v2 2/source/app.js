const { useState, useEffect, useMemo, useCallback, useRef } = React;
const html = htm.bind(React.createElement);

/* ---------- helpers ---------- */
const store = { get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
function pickLang() { const s = store.get('smot.lang', null); if (s && I18N[s]) return s; const n = (navigator.language || 'en').slice(0, 2).toLowerCase(); return I18N[n] ? n : 'en'; }
const loc = (o, lang) => !o ? '' : typeof o === 'string' ? o : (o[lang] || o.en || o.uk || o.ru || Object.values(o)[0] || '');
var FREE_LAUNCH = true; // free opening: every published course can be joined at no cost until payments are connected
const fmtPrice = (c, lang, t) => !c ? t.free : FREE_LAUNCH ? t.freeLaunchPrice : fmtPriceRaw(c, lang, t);
const fmtPriceRaw = (c, lang, t) => !c ? t.free : new Intl.NumberFormat(lang === 'uk' ? 'uk-UA' : lang, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(c / 100);
const fmtDate = (d, lang, opts) => d ? new Intl.DateTimeFormat(lang === 'uk' ? 'uk-UA' : lang, opts || { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(d)) : '';
const initials = n => String(n || 'S').split(/\s+/).map(x => x[0]).join('').slice(0, 2).toUpperCase();
const fill = (s, o) => s.replace(/\{(\w+)\}/g, (_, k) => o[k]);
const LEVELS = ['lvS', 'lv1', 'lv2', 'lv3', 'lv4', 'lvG'];
/* Proposed S.MOT ladder: course certificates, graded practical work and verified achievements (prior learning counts) */
const levelIndex = ({ certs = 0, ach = 0, graded = 0, official = 0 }) => {
  /* Levels 1–2 are earned automatically; levels 3–5 only through the S.MOT commission (official level) */
  let i = 0;
  if (certs >= 1 || ach >= 1) i = 1;
  if ((certs >= 3 && graded >= 5) || ach >= 2) i = 2;
  return Math.max(i, official || 0);
};
const parseRoute = () => { const h = decodeURIComponent((location.hash || '').slice(1)); return h || 'home'; };
const go = r => { location.hash = r; window.scrollTo({ top: 0 }); };

/* ---------- icons ---------- */
const P = {
  home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  book: 'M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 19V5M8 7h7',
  award: 'M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM8.5 13.9 7 22l5-3 5 3-1.5-8.1',
  brief: 'M3 7h18v13H3zM8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18',
  users: 'M16 20v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 20v-1a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
  user: 'M20 21v-1a5 5 0 0 0-5-5H9a5 5 0 0 0-5 5v1M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  globe: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20',
  bell: 'M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3',
  heart: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z',
  chat: 'M21 11.5a8.4 8.4 0 0 1-9 8.4 8.6 8.6 0 0 1-3.9-.9L3 21l1.9-5.1A8.4 8.4 0 1 1 21 11.5z',
  share: 'M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8.6 13.5l6.8 4M15.4 6.5l-6.8 4',
  arrow: 'M5 12h14M13 6l6 6-6 6', back: 'M19 12H5M11 18l-6-6 6-6',
  check: 'M20 6 9 17l-5-5', play: 'M6 4l14 8-14 8z', lock: 'M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4',
  cal: 'M3 5h18v16H3zM16 3v4M8 3v4M3 10h18', pin: 'M12 22s7-6 7-12a7 7 0 0 0-14 0c0 6 7 12 7 12zM12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  store: 'M3 9l1.5-5h15L21 9M3 9v11h18V9M3 9h18M9 20v-6h6v6', x: 'M18 6 6 18M6 6l12 12', upload: 'M12 16V4M6 10l6-6 6 6M4 20h16',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4', bookmark: 'M6 3h12v18l-6-4-6 4z', plus: 'M12 5v14M5 12h14', image: 'M3 4h18v16H3zM3 16l5-5 5 5M14 13l2-2 5 5M8.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z',
  news: 'M4 4h13v16H6a2 2 0 0 1-2-2zM17 8h3v10a2 2 0 0 1-2 2M8 8h5M8 12h5M8 16h3', steps: 'M3 20h5v-5h5v-5h5V5h3', chevL: 'M15 18l-6-6 6-6', chevR: 'M9 18l6-6-6-6', handshake: 'M3 12l4-4 5 3 5-3 4 4-9 8zM7 8l3-3h4l3 3'
};
const Icon = ({ n, s = 20, fill: f }) => html`<svg width=${s} height=${s} viewBox="0 0 24 24" fill=${f ? 'currentColor' : 'none'} stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d=${P[n]} /></svg>`;

/* ---------- designed cover art (stand-in until real photos are uploaded) ---------- */
const PALETTES = {
  'hair-color': ['#e9c98f', '#b07a3f', '#4a2e1c'], 'hair-extensions': ['#f1d6a8', '#c69a62', '#5a3a22'], hairstyle: ['#e8c4a8', '#9c6a4a', '#3a221a'],
  makeup: ['#e9b8a4', '#a85c56', '#3b1e22'], barber: ['#c9b49a', '#6b5440', '#1f1a16'], 'beauty-business': ['#e6cf9c', '#8f7448', '#26221b'],
  gold: ['#ecd29d', '#b08443', '#2c2014'], rose: ['#ecc0b0', '#a86d62', '#2d1a1b'], umber: ['#d7b08a', '#7b5136', '#22170f']
};
function Cover({ k, label, corner, ratio, mark = true, img }) {
  const [a, b, c] = PALETTES[k] || PALETTES.gold;
  const bg = `radial-gradient(120% 90% at 78% 18%, ${a}cc 0%, transparent 46%), radial-gradient(90% 80% at 20% 100%, ${c} 10%, transparent 70%), repeating-linear-gradient(112deg, ${b}00 0 9px, ${a}33 10px 12px, ${b}00 13px 22px), linear-gradient(150deg, ${b} 0%, ${c} 78%)`;
  return html`<div className="cover" style=${ratio ? { aspectRatio: ratio } : null}>
    ${img ? html`<img className="art" src=${img} alt="" style=${{ width: '100%', height: '100%', objectFit: 'cover' }} />` : html`<div className="art" style=${{ background: bg }}></div>`}
    ${mark && html`<span className="mark"><${Crest} s=${22} /></span>`}
    ${corner && html`<span className="corner">${corner}</span>`}
    ${label && html`<span className="tag">${label}</span>`}
  </div>`;
}

/* ---------- small UI ---------- */
const StatusBadge = ({ s, t }) => {
  const map = { pending: ['warn', t.pending], approved: ['', t.approved], rejected: ['bad', t.rejected], draft: ['plain', t.draft], submitted: ['warn', t.submitted], published: ['', t.published], verified: ['', t.verifiedS], reviewed: ['', t.verifiedS], revision_requested: ['warn', t.submitted], archived: ['plain', t.archive] };
  const [cls, label] = map[s] || ['plain', s];
  return html`<span className=${'badge ' + cls}>${label}</span>`;
};
function Modal({ title, onClose, children }) {
  useEffect(() => { const f = e => e.key === 'Escape' && onClose(); addEventListener('keydown', f); return () => removeEventListener('keydown', f); }, []);
  return html`<div className="modal-bg" onClick=${e => e.target === e.currentTarget && onClose()}>
    <div className="modal" role="dialog" aria-modal="true" aria-label=${title}>
      <div className="modal-head"><h2>${title}</h2><button className="iconbtn" onClick=${onClose} aria-label="Close"><${Icon} n="x" /></button></div>
      ${children}
    </div></div>`;
}
const Empty = ({ text, children }) => html`<div className="empty"><span>${text}</span>${children}</div>`;
const SectionHead = ({ title, action, onAction }) => html`<div className="section-head"><h2>${title}</h2>${action && html`<button className="link" onClick=${onAction}>${action} <${Icon} n="arrow" s=${16} /></button>`}</div>`;
const SampleTag = ({ t, show }) => show ? html`<span className="badge plain case">${t.sample}</span>` : null;
function useAsync(fn, deps) {
  const [state, set] = useState({ loading: true, data: null });
  const reload = useCallback(() => { let alive = true; set(s => ({ ...s, loading: true })); Promise.resolve(fn()).then(d => alive && set({ loading: false, data: d })).catch(() => alive && set({ loading: false, data: null })); return () => { alive = false; }; }, deps);
  useEffect(reload, [reload]);
  return [state.data, state.loading, reload];
}

/* ---------- shell ---------- */
const NAV = ['videos', 'academy', 'masters', 'square'];
const TABS = [['home', 'home'], ['videos', 'play'], ['academy', 'book'], ['masters', 'steps'], ['account', 'user']];
function Topbar({ ctx }) {
  const { t, lang, setLang, route, acct } = ctx;
  const [more, setMore] = useState(false);
  const base = route.split('-')[0];
  return html`<header className="topbar"><div className="topbar-in">
    <button className="brand brand-crest" onClick=${() => go('home')} aria-label="S.MOT Global Beauty Academy"><${Crest} s=${34} /><span className="brand-txt"><b>Global Beauty</b><span>Academy</span></span></button>
    <nav className="topnav" aria-label="Main">${NAV.map(n => html`<button key=${n} className=${base === n || (n === 'academy' && base === 'course') ? 'on' : ''} onClick=${() => go(n)}>${t[n]}</button>`)}<button onClick=${() => setMore(true)}>${t.more} ▾</button></nav>
    <div className="top-actions">
      <select className="langsel" id="lang" aria-label=${t.language} value=${lang} onChange=${e => setLang(e.target.value)}>${LANGS.map(l => html`<option key=${l.code} value=${l.code}>${l.short}</option>`)}</select>
      <button className="iconbtn" aria-label=${t.notifications} onClick=${() => go(acct ? 'account-notifications' : 'account')}><${Icon} n="bell" />${acct && ctx.unread > 0 && html`<i className="dot"></i>`}</button>
      <button className="iconbtn" aria-label=${t.account} onClick=${() => go('account')}><${Icon} n="user" /></button>
      <button className="iconbtn menu-btn" aria-label=${t.more} onClick=${() => setMore(true)}><${Icon} n="menu" /></button>
    </div>
  </div>${more && html`<${MoreMenu} ctx=${ctx} onClose=${() => setMore(false)} />`}</header>`;
}
function Tabbar({ ctx }) {
  const base = ctx.route.split('-')[0];
  const label = { home: ctx.t.homeTab, videos: ctx.t.videos, academy: ctx.t.academy, masters: ctx.t.masters, account: ctx.t.profile };
  return html`<nav className="tabbar" aria-label="Sections">${TABS.map(([r, i]) => html`<button key=${r} className=${base === r || (r === 'academy' && base === 'course') ? 'on' : ''} onClick=${() => go(r)}><${Icon} n=${i} s=${22} /><span>${label[r]}</span></button>`)}</nav>`;
}
function DemoStrip({ ctx }) {
  const { t, demoRole, setDemoRole } = ctx;
  const roles = [['guest', t.guest], ['student', t.role_student], ['instructor', t.role_instructor], ['commission', t.commission], ['admin', t.role_admin]];
  return html`<div className="demo" role="note"><p>${t.demo}</p><div className="seg"><span>${t.demoAs}:</span>${roles.map(([r, l]) => html`<button key=${r} className=${demoRole === r ? 'on' : ''} onClick=${() => setDemoRole(r)}>${l}</button>`)}</div></div>`;
}
function Footer({ ctx }) {
  return html`<footer className="footer">
    <div className="langpills">${LANGS.map(l => html`<button key=${l.code} className=${ctx.lang === l.code ? 'on' : ''} onClick=${() => ctx.setLang(l.code)}>${l.short}</button>`)}</div>
    <span style=${{ marginTop: '14px' }}><${Crest} s=${48} /></span>
    <b>S.MOT Global Beauty Academy</b>
    <span>${ctx.t.footerTag}</span>
    <span className="foot-links"><button onClick=${() => go('verify')}>${ctx.t.verifyTitle}</button><button onClick=${() => go('legal-terms')}>${ctx.t.terms}</button><button onClick=${() => go('legal-privacy')}>${ctx.t.privacy}</button><button onClick=${() => go('legal-cookies')}>${ctx.t.cookies}</button></span>
    <span>${ctx.t.founded} · © ${new Date().getFullYear()} · ${ctx.t.rights}</span>
  </footer>`;
}

/* ---------- shared blocks ---------- */
function CourseCard({ c, ctx, featured }) {
  const { t, lang } = ctx;
  const cat = ctx.cats.find(x => x.id === c.category_id);
  const who = c.instructor ? [c.instructor.display_name, c.instructor.professional_title].filter(Boolean).join(' · ') : (c.instructor_id === D.educator.id ? D.educator.display_name + ' · ' + D.educator.professional_title : '');
  return html`<button className=${'course' + (featured ? ' featured' : '')} onClick=${() => go('course-' + c.slug)}>
    <${Cover} k=${cat?.slug} img=${c.cover_image_url} label=${cat ? loc(cat.name, lang) : ''} corner=${c.sample ? html`<span className="badge plain case">${t.sample}</span>` : null} />
    <div className="meta">${c.tag ? html`<span className="badge tag">${t['tag_' + c.tag]}</span>` : html`<span></span>`}<span>${c.lesson_count != null ? c.lesson_count + ' ' + t.lessons : ''}</span></div>
    <h3>${loc(c.title, lang)}</h3>
    ${who && html`<div className="who">${who}</div>`}
    <p className="desc">${loc(c.description, lang)}</p>
    <div className="meta"><span className="price">${fmtPrice(c.price_cents, lang, t)}</span></div>
    <span className="btn primary cta">${t.openProgram} <${Icon} n="arrow" s=${18} /></span>
  </button>`;
}
function ProgressCard({ item, ctx }) {
  const { t, lang } = ctx; const pct = item.total ? Math.round(item.done / item.total * 100) : 0;
  return html`<div className="progress-card">
    <div className="top"><h3>${loc(item.course.title, lang)}</h3><span className=${'badge' + (pct === 100 ? ' gold' : '')}>${pct === 100 ? t.done : t.inProgress}</span></div>
    <div className="row" style=${{ justifyContent: 'space-between' }}><span className="muted">${t.courseProgress}</span><b style=${{ color: 'var(--gold-2)', fontVariantNumeric: 'tabular-nums' }}>${pct}%</b></div>
    <div className="bar"><i style=${{ width: pct + '%' }}></i></div>
    <span className="muted">${fill(t.lessonsDone, { a: item.done, b: item.total })}</span>
    <button className="btn soft wide" onClick=${() => go('course-' + item.course.slug)}>${t.continueL} <${Icon} n="arrow" s=${18} /></button>
  </div>`;
}
function Journey({ ctx, certs, ach, graded, edu }) {
  const { t } = ctx; const i = levelIndex({ certs, ach, graded, official: ctx.acct?.profile?.academy_level || 0 });
  return html`<div className="card journey">
    <h2 style=${{ fontSize: '20px' }}>${t.journey}</h2>
    <div className="lvl"><div><b>${t[LEVELS[i]]}</b><div className="muted">${i < 5 ? t.next + ': ' + t[LEVELS[i + 1]] : t.topLevel}</div></div><span style=${{ color: 'var(--gold)' }}><${Icon} n="award" s=${34} /></span></div>
    <div className="ladder">${LEVELS.map((_, k) => html`<span key=${k} className=${k <= i ? 'on' : ''}></span>`)}</div>
    <div className="ladder-labels">${LEVELS.map(l => html`<span key=${l}>${t[l]}</span>`)}</div>
    <div className="row" style=${{ justifyContent: 'space-between' }}><small className="muted">${t.journeyNote}</small><button className="link" onClick=${() => go('academy-levels')}>${t.levels} <${Icon} n="arrow" s=${16} /></button></div>
  </div>`;
}
function CertCard({ c, ctx, sample }) {
  const { t, lang } = ctx;
  return html`<div className="cert">
    <span className="seal"><${Crest} s=${40} /></span>
    <span className="eyebrow">${t.regTitle}</span>
    <span className="no">${c.certificate_number}</span>
    <dl>
      <dt>${t.regHolder}</dt><dd>${c.student_name}</dd>
      <dt>${t.regCourse}</dt><dd>${c.course_title}</dd>
      <dt>${t.regIssued}</dt><dd>${fmtDate(c.issued_at, lang)}</dd>
      <dt>${t.regStatus}</dt><dd><span className="badge">${t.verified}</span> ${sample ? html`<span className="badge plain case">${t.sample}</span>` : null}</dd>
    </dl>
  </div>`;
}
function Hero({ eyebrow, title, em, text, children, badge }) {
  return html`<section className="hero-card">
    <div className="row" style=${{ justifyContent: 'space-between' }}><span className="eyebrow">${eyebrow}</span>${badge}</div>
    <h1>${em ? title + ' ' : title}${em ? html`<em>${em}</em>` : null}</h1>
    ${text && html`<p>${text}</p>`}
    ${children}
  </section>`;
}
const needSignIn = ctx => { ctx.toast(ctx.t.signIn + '…'); go('account'); };

/* ---------- pages ---------- */
function CoursePage({ ctx, slug }) {
  const { t, lang, acct, cats } = ctx;
  const [d, loading, reload] = useAsync(() => api.course(slug, acct?.user?.id), [slug, ctx.dataKey, acct?.user?.id]);
  const [submitFor, setSubmitFor] = useState(null);
  const [video, setVideo] = useState(null);
  const [cq, , reloadQ] = useAsync(() => d?.course ? api.courseQuizzes(d.course.id) : [], [d?.course?.id, ctx.dataKey, acct?.user?.id]);
  const [quizFor, setQuizFor] = useState(null);
  if (loading && !d) return html`<div className="section"><div className="skeleton"></div></div>`;
  if (!d) return html`<div className="section"><${Empty} text=${t.noCourses}><button className="btn" onClick=${() => go('academy')}>${t.back}</button><//></div>`;
  const { course: c, lessons, reviews, instructor, enrolled, progress, submissions } = d;
  const cat = cats.find(x => x.id === c.category_id);
  const doneSet = new Set(progress.filter(p => p.completed_at).map(p => p.lesson_id));
  const pct = lessons.length ? Math.round([...doneSet].filter(id => lessons.find(l => l.id === id)).length / lessons.length * 100) : 0;
  async function enrollFree() { const r = await api.enrollFree(acct.user.id, c.id); if (r?.error) ctx.toast(r.error.message); else { ctx.toast(t.enrolledOk); reload(); } }
  async function complete(l) { const r = await api.completeLesson(acct.user.id, l.id); if (r?.error) ctx.toast(r.error.message); else { ctx.toast(t.done); if (lessons.every(x => x.id === l.id || doneSet.has(x.id))) celebrate('cert'); reload(); } }
  async function watch(l) { const u = await api.videoUrl(l.video_asset_id); setVideo({ l, u }); }
  return html`<div>
    <div style=${{ marginTop: '14px' }}><${Crumbs} items=${[[t.homeCrumb, 'home'], [t.academy, 'academy'], ...(cat ? [[loc(cat.name, lang), 'academy-c-' + cat.slug]] : []), [loc(c.title, lang), null]]} /></div>
    <section className="section course-hero">
      <div style=${{ display: 'grid', gap: '14px', minWidth: 0 }}>
        <${Cover} k=${cat?.slug} img=${c.cover_image_url} label=${cat ? loc(cat.name, lang) : ''} ratio="16/9" />
        <div className="row">${c.tag && html`<span className="badge tag">${t['tag_' + c.tag]}</span>`}<${SampleTag} t=${t} show=${c.sample} /><span className="muted">${lessons.length} ${t.lessons}</span></div>
        <h1 style=${{ fontSize: 'clamp(26px,4.4vw,40px)', lineHeight: 1.1 }}>${loc(c.title, lang)}</h1>
        <p style=${{ margin: 0, color: '#d4cec5', fontSize: '16.5px', maxWidth: '62ch' }}>${loc(c.description, lang)}</p>
      </div>
      <aside className="sticky-buy">
        <div className="card" style=${{ display: 'grid', gap: '14px' }}>
          ${FREE_LAUNCH && c.price_cents ? html`<div style=${{ display: 'grid', gap: '4px' }}><span className="price" style=${{ fontSize: '30px' }}>${t.free} <s className="old-price">${fmtPriceRaw(c.price_cents, lang, t)}</s></span><small className="muted">${t.freeLaunchNote}</small></div>` : html`<span className="price" style=${{ fontSize: '30px' }}>${fmtPrice(c.price_cents, lang, t)}</span>`}
          <span className="muted">${lessons.length} ${t.lessons} · ${hoursOf(lessons)} ${t.hours}</span>
          ${enrolled ? html`<div style=${{ display: 'grid', gap: '8px' }}><span className="badge" style=${{ justifySelf: 'start' }}>${t.enrolled}</span><div className="bar"><i style=${{ width: pct + '%' }}></i></div><span className="muted">${t.progress}: ${pct}%</span></div>`
            : acct && (!c.price_cents || FREE_LAUNCH) ? html`<button className="btn gold wide" onClick=${enrollFree}>${t.enrollFree}</button>`
            : acct ? html`<button className="btn gold wide" onClick=${() => ctx.toast(t.payingSoon)}>${t.buyCourse}</button><small className="muted">${t.payingSoon}</small>`
            : html`<button className="btn primary wide" onClick=${() => go('account')}>${t.signInToEnroll}</button>`}
        </div>
        ${instructor && html`<div className="card" style=${{ display: 'grid', gap: '10px' }}>
          <span className="eyebrow">${t.educator}</span>
          <button className="post-head" style=${{ background: 'none', border: 0, color: 'inherit', textAlign: 'left', cursor: 'pointer', padding: 0 }} onClick=${() => go('master-' + instructor.id)}><${Ava} p=${instructor} /><div><b>${instructor.display_name}</b><small>${instructor.professional_title || ''}</small></div></button>
          ${instructor.bio && html`<p style=${{ margin: 0, color: '#d4cec5' }}>${instructor.bio}</p>`}
        </div>`}
      </aside>
    </section>

    <section className="section"><${SectionHead} title=${t.curriculum} />
      <div className="list">${lessons.map((l, i) => {
        const open = enrolled || l.is_preview; const done = doneSet.has(l.id); const sub = submissions.find(s => s.lesson_id === l.id);
        return html`<div key=${l.id} className="li" style=${{ flexWrap: 'wrap' }}>
          <span className="num">${done ? html`<span style=${{ color: 'var(--ok)' }}><${Icon} n="check" /></span>` : i + 1}</span>
          <div className="grow"><b>${loc(l.title, lang)}</b><small>${l.duration_seconds ? Math.round(l.duration_seconds / 60) + ' ' + t.min : ''}${l.is_preview ? ' · ' + t.preview : ''}${!open ? ' · ' + t.locked : ''}</small>
            ${sub && html`<div className="row" style=${{ marginTop: '6px' }}><${StatusBadge} s=${sub.status} t=${t} />${sub.grade != null && html`<span className="muted">${t.grade}: <b style=${{ color: 'var(--gold-2)' }}>${sub.grade}/100</b></span>`}</div>`}
            <${RubricView} ctx=${ctx} scores=${sub?.rubric_scores} />
            ${sub?.educator_feedback && html`<small style=${{ display: 'block', marginTop: '4px', color: '#d4cec5' }}>${t.feedback}: ${sub.educator_feedback}</small>`}
          </div>
          <div className="row">
            ${open ? html`<button className="btn sm" onClick=${() => watch(l)}><${Icon} n="play" s=${14} /> ${t.watch}</button>` : html`<span className="muted"><${Icon} n="lock" s=${18} /></span>`}
            ${open && acct && (cq || []).some(x => x.lesson_id === l.id) && html`<button className=${'btn sm' + ((cq || []).find(x => x.lesson_id === l.id)?.passed ? ' passed' : '')} onClick=${() => setQuizFor(l)}>${(cq || []).find(x => x.lesson_id === l.id)?.passed ? '✓ ' : ''}${t.quiz}</button>`}
            ${enrolled && acct && acct.user.id !== c.instructor_id && html`
              ${!done && html`<button className="btn sm" onClick=${() => complete(l)}><${Icon} n="check" s=${14} /> ${t.markDone}</button>`}
              <button className="btn sm" onClick=${() => setSubmitFor(l)}><${Icon} n="upload" s=${14} /> ${t.submitWork}</button>`}
          </div>
        </div>`; })}
      </div>
    </section>

    <section className="section"><${SectionHead} title=${t.reviews} />
      ${reviews.length ? html`<div className="grid two">${reviews.map(r => html`<div key=${r.id} className="card" style=${{ display: 'grid', gap: '8px' }}><span style=${{ color: 'var(--gold)', letterSpacing: '2px' }}>${'★'.repeat(r.rating)}<span style=${{ color: 'var(--line)' }}>${'★'.repeat(5 - r.rating)}</span></span><p style=${{ margin: 0 }}>${r.body}</p></div>`)}</div>` : html`<${Empty} text=${t.noReviews} />`}
    </section>

    <${AutoOpen} lessons=${lessons} enrolled=${enrolled} watch=${watch} />
    <${CourseExtras} ctx=${ctx} course=${c} enrolled=${enrolled} reviews=${reviews} reload=${reload} />
    ${quizFor && html`<${QuizModal} ctx=${ctx} lesson=${quizFor} onClose=${() => setQuizFor(null)} onDone=${reloadQ} />`}
    ${submitFor && html`<${SubmitWork} ctx=${ctx} lesson=${submitFor} onClose=${() => setSubmitFor(null)} onDone=${() => { setSubmitFor(null); reload(); }} />`}
    ${video && html`<${Modal} title=${loc(video.l.title, lang)} onClose=${() => setVideo(null)}>
      <${StudyPlayer} ctx=${ctx} lesson=${video.l} url=${video.u} cat=${cat?.slug} course=${c} />
    <//>`}
  </div>`;
}
function SubmitWork({ ctx, lesson, onClose, onDone }) {
  const { t, lang, acct } = ctx; const [file, setFile] = useState(null); const [note, setNote] = useState(''); const [busy, setBusy] = useState(false);
  const [core, coreLoading] = useAsync(() => api.coreStatus(acct.user.id), [acct.user.id]);
  if (!coreLoading && !core) return html`<${Modal} title=${t.submitWork} onClose=${onClose}><p className="notice" style=${{ margin: 0 }}>${t.foundationRequired}</p><button className="btn gold" onClick=${() => { onClose(); go('foundation'); }}>${t.foundation} <${Icon} n="arrow" s=${16} /></button><//>`;
  async function send(e) { e.preventDefault(); if (!file) return; setBusy(true); const r = await api.submitWork(acct.user.id, lesson.id, file, note); setBusy(false); if (r?.error) ctx.toast(r.error.message); else { ctx.toast(t.uploaded); onDone(); } }
  return html`<${Modal} title=${t.submitWork} onClose=${onClose}>
    <span className="muted">${loc(lesson.title, lang)}</span>
    <form className="form" onSubmit=${send}>
      <label className="field">${t.chooseFile}<input id="work-file" type="file" accept="image/*,video/*,application/pdf" required onChange=${e => setFile(e.target.files[0] || null)} /></label>
      <label className="field">${t.note}<textarea id="work-note" value=${note} onInput=${e => setNote(e.target.value)} maxLength="2000"></textarea></label>
      <button className="btn gold" disabled=${busy || !file}>${busy ? t.loading : t.upload}</button>
    </form>
  <//>`;
}

function Certification({ ctx }) {
  const { t, lang, acct } = ctx;
  const [learn] = useAsync(() => acct ? api.learning(acct.user.id) : null, [ctx.dataKey, acct?.user?.id]);
  const [ach] = useAsync(() => acct ? api.achievements(acct.user.id) : [], [ctx.dataKey, acct?.user?.id]);
  const kinds = [['c1', 'award'], ['c2', 'shield'], ['c3', 'cal']];
  return html`<div>
    <div style=${{ marginTop: '14px' }}><${Hero} eyebrow="Standards" title=${t.certTitle} text=${t.certLead} /></div>
    <${VerifyBox} ctx=${ctx} />
    <section className="section"><div className="grid">${kinds.map(([k, i]) => html`<div key=${k} className="pillar" style=${{ cursor: 'default' }}><span className="ic"><${Icon} n=${i} s=${22} /></span><b>${t[k]}</b><span>${t[k + 'd']}</span></div>`)}</div></section>
    <section className="section home-grid">
      <${CertCard} ctx=${ctx} sample=${true} c=${{ certificate_number: 'SM-2026-7F3A91C2', student_name: 'Svitlana Mot', course_title: loc(D.courses.find(x => x.id === "k6").title, lang), issued_at: '2026-10-28' }} />
      <div className="card" style=${{ display: 'grid', gap: '10px', alignContent: 'start' }}><span className="eyebrow">${t.eduStandard}</span><p style=${{ margin: 0, fontSize: '16px' }}>${t.eduStandardD}</p><button className="btn" style=${{ justifySelf: 'start' }} onClick=${() => go('account-apply')}>${t.ctaApply}</button></div>
    </section>
    <${StateRecognition} ctx=${ctx} />
    ${acct && learn && html`<section className="section"><${SectionHead} title=${t.myCerts} />
      ${learn.certificates.length ? html`<div className="grid two">${learn.certificates.map(c => html`<${CertCard} key=${c.id} c=${c} ctx=${ctx} />`)}</div>` : html`<${Empty} text=${t.noCerts} />`}
      <${Journey} ctx=${ctx} certs=${learn.certificates.length} ach=${(ach || []).filter(a => a.status === 'verified').length} graded=${learn.submissions.filter(x => x.grade >= 80).length} edu=${acct.roles.includes('instructor')} />
    </section>`}
  </div>`;
}

function Careers({ ctx, tab: tab0 }) {
  const { t, lang, acct } = ctx;
  const [tab, setTab] = useState(tab0 || 'masters');
  const [edu] = useAsync(() => api.educators(), [ctx.dataKey]);
  const [jobs] = useAsync(() => api.jobs(), [ctx.dataKey]);
  const [salons] = useAsync(() => api.salons(), [ctx.dataKey]);
  const [spec, setSpec] = useState(''); const [country, setCountry] = useState('');
  const [applyTo, setApplyTo] = useState(null); const [reg, setReg] = useState(false); const [view, setView] = useState(null);
  const masters = (edu || []).filter(e => (!spec || (e.expertise || []).includes(spec)) && (!country || e.country === country));
  const specs = [...new Set((edu || []).flatMap(e => e.expertise || []))]; const countries = [...new Set((edu || []).map(e => e.country).filter(Boolean))];
  return html`<div>
    <div style=${{ marginTop: '14px' }}><${Hero} eyebrow="Your talent. Your world." title="Build your global career." text=${t.jobsLead}><div className="chips"><span className="badge">Global talent network</span></div><//></div>
    <div className="section"><div className="pills">
      ${[['masters', 'users'], ['salons', 'store'], ['vacancies', 'brief']].map(([k, i]) => html`<button key=${k} className=${'pill' + (tab === k ? ' on' : '')} onClick=${() => setTab(k)}><${Icon} n=${i} s=${18} /> ${t[k]}</button>`)}<button className="pill" onClick=${() => go('talents')}><${Icon} n="search" s=${18} /> ${t.talents}</button>
    </div></div>

    ${tab === 'masters' && html`<section className="section">
      <h2 style=${{ fontSize: '22px' }}>${t.eduTitle}</h2>
      <div className="form"><div className="two">
        <label className="field">${t.expertise.split(',')[0]}<select id="f-spec" value=${spec} onChange=${e => setSpec(e.target.value)}><option value="">${t.allSpecs}</option>${specs.map(s => html`<option key=${s}>${s}</option>`)}</select></label>
        <label className="field">${t.country}<select id="f-country" value=${country} onChange=${e => setCountry(e.target.value)}><option value="">${t.allCountries}</option>${countries.map(s => html`<option key=${s}>${s}</option>`)}</select></label>
      </div></div>
      ${masters.length ? html`<div className="grid two">${masters.map(m => html`<${MasterCard} key=${m.id} m=${m} ctx=${ctx} onView=${setView} />`)}</div>` : html`<${Empty} text=${t.noEducators}><button className="btn" onClick=${() => go('account-apply')}>${t.ctaApply}</button><//>`}
    </section>`}

    ${tab === 'salons' && html`<section className="section">
      <div className="section-head"><h2>${t.salons}</h2><button className="btn sm gold" onClick=${() => acct ? setReg(true) : needSignIn(ctx)}><${Icon} n="plus" s=${16} /> ${t.employerCta}</button></div>
      ${(salons || []).length ? html`<div className="grid two">${salons.map(s => html`<div key=${s.id} className="card" style=${{ display: 'grid', gap: '8px' }}><div className="row" style=${{ justifyContent: 'space-between' }}><b style=${{ fontSize: '18px' }}>${s.business_name}</b><${SampleTag} t=${t} show=${s.sample} /></div><span className="row muted" style=${{ gap: '6px' }}><${Icon} n="pin" s=${16} /> ${[s.city, s.country].filter(Boolean).join(', ')}</span>${s.description && html`<p style=${{ margin: 0 }}>${s.description}</p>`}${(s.specialties || []).length > 0 && html`<span className="tags muted">${s.specialties.join(' · ')}</span>`}</div>`)}</div>` : html`<${Empty} text=${t.noJobs} />`}
    </section>`}

    ${tab === 'vacancies' && html`<section className="section">
      <div className="section-head"><h2>${t.vacancies}</h2><button className="btn sm gold" onClick=${() => acct ? setReg(true) : needSignIn(ctx)}><${Icon} n="plus" s=${16} /> ${t.employerCta}</button></div>
      ${(jobs || []).length ? html`<div className="grid two">${jobs.map(j => html`<div key=${j.id} className="card" style=${{ display: 'grid', gap: '10px' }}>
        <div className="row" style=${{ justifyContent: 'space-between' }}><span className="badge gold case">${t['jt_' + j.job_type] || j.job_type}</span><${SampleTag} t=${t} show=${j.sample} /></div>
        <b style=${{ fontSize: '19px' }}>${j.title}</b>
        <span className="row muted" style=${{ gap: '6px' }}><${Icon} n="pin" s=${16} /> ${[j.employer, j.city, j.country].filter(Boolean).join(' · ')}</span>
        <p style=${{ margin: 0, color: '#d4cec5' }}>${j.description}</p>
        <div className="row" style=${{ justifyContent: 'space-between' }}><span className="price">${j.compensation || ''}</span><span className="muted">${(j.languages || []).map(x => x.toUpperCase()).join(' · ')}</span></div>
        <button className="btn primary" onClick=${() => acct ? setApplyTo(j) : needSignIn(ctx)}>${t.applyJob}</button>
      </div>`)}</div>` : html`<${Empty} text=${t.noJobs} />`}
    </section>`}

    ${view && html`<${Modal} title=${view.display_name} onClose=${() => setView(null)}>
      <div className="post-head"><span className="avatar lg">${initials(view.display_name)}</span><div><b>${view.professional_title || ''}</b><small>${view.country || ''}</small></div></div>
      ${view.bio && html`<p style=${{ margin: 0 }}>${view.bio}</p>`}
      ${(view.expertise || []).length > 0 && html`<div className="chips">${view.expertise.map(x => html`<span key=${x} className="badge gold case">${x}</span>`)}</div>`}
      ${view.portfolio_url && html`<a className="btn" href=${view.portfolio_url} target="_blank" rel="noopener">${t.portfolio}</a>`}
    <//>`}
    ${applyTo && html`<${SimpleForm} ctx=${ctx} title=${applyTo.title} fields=${[['message', t.message, 'textarea']]} submit=${t.applyJob} done=${t.applied}
      onSubmit=${f => api.applyJob(acct.user.id, applyTo.id, f.message)} onClose=${() => setApplyTo(null)} />`}
    ${reg && html`<${SimpleForm} ctx=${ctx} title=${t.employerCta} submit=${t.sendForApproval} done=${t.sentForApproval}
      fields=${[['name', t.salonName, 'text', true], ['country', t.country, 'text', true], ['city', t.city, 'text', true], ['website', t.website, 'url'], ['description', t.bio, 'textarea']]}
      onSubmit=${f => api.registerEmployer(acct.user.id, f)} onClose=${() => setReg(false)} />`}
  </div>`;
}
function SimpleForm({ ctx, title, fields, submit, done, onSubmit, onClose }) {
  const [f, setF] = useState({}); const [busy, setBusy] = useState(false);
  async function send(e) { e.preventDefault(); setBusy(true); const r = await onSubmit(f); setBusy(false); if (r?.error) ctx.toast(r.error.message); else { ctx.toast(done); onClose(); } }
  return html`<${Modal} title=${title} onClose=${onClose}><form className="form" onSubmit=${send}>
    ${fields.map(([k, label, type, req, opts]) => html`<label key=${k} className="field">${label}
      ${type === 'textarea' ? html`<textarea id=${'sf-' + k} required=${!!req} value=${f[k] || ''} onInput=${e => setF({ ...f, [k]: e.target.value })}></textarea>`
        : type === 'select' ? html`<select id=${'sf-' + k} required=${!!req} value=${f[k] || ''} onChange=${e => setF({ ...f, [k]: e.target.value })}><option value="">—</option>${opts.map(([v, l]) => html`<option key=${v} value=${v}>${l}</option>`)}</select>`
        : html`<input id=${'sf-' + k} type=${type} required=${!!req} value=${f[k] || ''} onInput=${e => setF({ ...f, [k]: e.target.value })} />`}
    </label>`)}
    <button className="btn gold" disabled=${busy}>${busy ? ctx.t.loading : submit}</button>
  </form><//>`;
}

function EventCard({ e, ctx, compact, onRegister, results }) {
  const { t, lang } = ctx; const d = new Date(e.starts_at);
  return html`<div className="event">
    <div className="date"><div className="cal"><b>${d.getDate()}</b><small>${fmtDate(e.starts_at, lang, { month: 'short' })}</small></div>
      <div style=${{ minWidth: 0 }}><h3>${e.title}</h3><span className="row muted" style=${{ gap: '6px' }}><${Icon} n="pin" s=${15} /> ${[e.venue, e.city, e.country].filter(Boolean).join(', ')}</span></div></div>
    ${!compact && e.description && html`<p style=${{ margin: 0, color: '#d4cec5' }}>${e.description}</p>`}
    ${(e.categories || []).length > 0 && html`<div className="chips">${e.categories.map(c => html`<span key=${c.id} className="badge gold case">${c.name}</span>`)}</div>`}
    <div className="row" style=${{ justifyContent: 'space-between' }}>
      <span className="muted">${e.registration_deadline ? t.deadline + ' ' + fmtDate(e.registration_deadline, lang) : ''}</span>
      <${SampleTag} t=${t} show=${e.sample} />
    </div>
    ${results && results.length > 0 && html`<div className="list">${results.map(r => html`<div key=${r.id} className="li"><span className="num">${r.placement || '—'}</span><div className="grow"><b>${r.award_title || t.place + ' ' + r.placement}</b><small>${(e.categories.find(c => c.id === r.category_id) || {}).name || ''}</small></div></div>`)}</div>`}
    ${!compact && onRegister && html`<button className="btn primary" onClick=${() => onRegister(e)}>${t.registerEv}</button>`}
    ${compact && html`<button className="btn soft" onClick=${() => go('championships')}>${t.registerEv} <${Icon} n="arrow" s=${16} /></button>`}
  </div>`;
}
function Championships({ ctx }) {
  const { t, acct } = ctx;
  const [ev] = useAsync(() => api.events(), [ctx.dataKey]);
  const [reg, setReg] = useState(null);
  return html`<div>
    <div style=${{ marginTop: '14px' }}><${Hero} eyebrow=${t.championships} title=${t.champTitle} text=${t.champLead} /></div>
    <section className="section">
      ${ev && ev.events.length ? html`<div className="grid two">${ev.events.map(e => html`<${EventCard} key=${e.id} e=${e} ctx=${ctx} results=${ev.results.filter(r => r.event_id === e.id)} onRegister=${x => acct ? setReg(x) : needSignIn(ctx)} />`)}</div>` : html`<${Empty} text=${t.noEvents} />`}
    </section>
    ${reg && html`<${SimpleForm} ctx=${ctx} title=${reg.title} submit=${t.registerEv} done=${t.registered}
      fields=${[['category', t.category, 'select', true, (reg.categories || []).map(c => [c.id, c.name])], ['team', t.team, 'text'], ['country', t.country, 'text']]}
      onSubmit=${f => api.registerEvent(acct.user.id, reg.id, f.category, f.team, f.country)} onClose=${() => setReg(null)} />`}
  </div>`;
}

function Community({ ctx }) {
  const { t, lang, acct } = ctx;
  const canRead = MODE.demo || !!acct;
  const [posts, loading, reload] = useAsync(() => canRead ? api.posts(acct?.user?.id) : [], [ctx.dataKey, acct?.user?.id]);
  const [body, setBody] = useState(''); const [busy, setBusy] = useState(false); const [cat, setCat] = useState('all');
  async function publish() { if (!body.trim()) return; setBusy(true); const r = await api.addPost(acct.user.id, body.trim(), acct.profile?.display_name || t.member); setBusy(false); if (r?.error) ctx.toast(r.error.message); else { setBody(''); reload(); } }
  async function like(p) { if (!acct) return needSignIn(ctx); await api.toggleLike(acct.user.id, p); reload(); }
  function share() { const u = location.href.split('#')[0] + '#community'; try { navigator.clipboard.writeText(u).then(() => ctx.toast(t.copied), () => ctx.toast(u)); } catch (e) { ctx.toast(u); } }
  const cats = [...new Set((posts || []).map(p => p.cat).filter(Boolean))];
  const list = (posts || []).filter(p => cat === 'all' || p.cat === cat);
  return html`<div>
    <div style=${{ marginTop: '14px' }}><${Hero} eyebrow="One global beauty family" title="Connect. Inspire. Grow." text=${t.commLead}><div className="chips"><span className="badge">Global network</span><span className="muted">6 languages</span></div><//></div>
    <section className="section">
      ${acct ? html`<div className="composer"><h3>${t.share}</h3><textarea id="post-body" placeholder=${t.postPh} value=${body} maxLength="3000" onInput=${e => setBody(e.target.value)}></textarea>
        <div className="row" style=${{ justifyContent: 'space-between' }}><span className="row muted" style=${{ gap: '6px', fontSize: '13.5px' }}><${Icon} n="image" s=${16} /> ${t.photoSoon}</span><button className="btn gold sm" disabled=${busy || !body.trim()} onClick=${publish}>${t.publish}</button></div></div>`
        : html`<${Empty} text=${t.signInToPost}><button className="btn primary" onClick=${() => go('account')}>${t.signIn}</button><//>`}
    </section>
    ${canRead && html`<section className="section"><${SectionHead} title=${t.feed} />
      ${cats.length > 1 && html`<div className="pills"><button className=${'pill' + (cat === 'all' ? ' on' : '')} onClick=${() => setCat('all')}>${t.allCats}</button>${cats.map(c => html`<button key=${c} className=${'pill' + (cat === c ? ' on' : '')} onClick=${() => setCat(c)}>${c === 'hair' ? loc(D.categories[1].name, lang) : loc(D.categories[0].name, lang)}</button>`)}</div>`}
      ${loading && !posts ? html`<div className="skeleton"></div>` : list.length ? html`<div className="grid two">${list.map(p => html`<article key=${p.id} className="post">
        <div className="post-head"><span className="avatar">${initials(p.author || t.member)}</span><div style=${{ minWidth: 0 }}><b>${p.author || t.member}</b><small>${[p.country, 'S.MOT member', p.sample ? t.sample : fmtDate(p.created_at, lang, { day: 'numeric', month: 'short' })].filter(Boolean).join(' · ')}</small></div></div>
        ${p.art && html`<${Cover} k=${p.art} ratio="4/3" />`}
        <p>${p.body}</p>
        <div className="post-actions"><button className=${p.liked ? 'on' : ''} onClick=${() => like(p)} aria-label="Like"><${Icon} n="heart" fill=${p.liked} /> ${p.likes}</button><button className="share" onClick=${share} aria-label="Share"><${Icon} n="share" /></button></div>
      </article>`)}</div>` : html`<${Empty} text=${t.noPosts} />`}
    </section>`}
  </div>`;
}

function Partners({ ctx }) {
  const { t, lang, acct } = ctx;
  const [d] = useAsync(() => api.partners(), [ctx.dataKey]);
  const [apply, setApply] = useState(false);
  return html`<div>
    <div style=${{ marginTop: '14px' }}><${Hero} eyebrow=${t.partners} title=${t.partTitle} text=${t.partLead}><div className="row"><button className="btn gold" onClick=${() => acct ? setApply(true) : needSignIn(ctx)}>${t.partnerCta}</button></div><//></div>
    <section className="section"><${SectionHead} title=${t.partners} />
      ${d && d.partners.length ? html`<div className="grid two">${d.partners.map(p => html`<div key=${p.id} className="card" style=${{ display: 'grid', gap: '8px' }}><div className="row" style=${{ justifyContent: 'space-between' }}><b style=${{ fontSize: '18px' }}>${p.brand_name}</b><span className="badge gold case">${t['pt_' + p.partner_type] || p.partner_type}</span></div><span className="muted">${[p.city, p.country].filter(Boolean).join(', ')}</span>${p.description && html`<p style=${{ margin: 0 }}>${p.description}</p>`}<${SampleTag} t=${t} show=${p.sample} /></div>`)}</div>` : html`<${Empty} text=${t.noPartners} />`}
    </section>
    ${d && d.offers.length > 0 && html`<section className="section"><${SectionHead} title=${t.offers} /><div className="grid two">${d.offers.map(o => html`<div key=${o.id} className="card" style=${{ display: 'grid', gap: '8px' }}><span className="badge tag" style=${{ justifySelf: 'start' }}>${o.offer_type}</span><b style=${{ fontSize: '18px' }}>${o.title}</b><p style=${{ margin: 0, color: '#d4cec5' }}>${o.description}</p>${o.valid_until && html`<span className="muted">${t.validUntil} ${fmtDate(o.valid_until, lang)}</span>`}</div>`)}</div></section>`}
    ${apply && html`<${SimpleForm} ctx=${ctx} title=${t.partnerCta} submit=${t.sendForApproval} done=${t.sentForApproval}
      fields=${[['name', t.brandName, 'text', true], ['type', t.partnerType, 'select', true, [['product_brand', t.pt_product_brand], ['supplier', t.pt_supplier], ['academy', t.pt_academy]]], ['country', t.country, 'text', true], ['email', t.contactEmail, 'email'], ['description', t.bio, 'textarea']]}
      onSubmit=${f => api.applyPartner(acct.user.id, f)} onClose=${() => setApply(false)} />`}
  </div>`;
}

/* ---------- auth ---------- */
function Auth({ ctx }) {
  const { t } = ctx;
  const [mode, setMode] = useState('signin'); const [email, setEmail] = useState(''); const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false); const [msg, setMsg] = useState(null);
  async function submit(e) {
    e.preventDefault(); setMsg(null);
    if (MODE.demo) { ctx.setDemoRole('student'); return; }
    setBusy(true);
    let r;
    if (mode === 'signup') r = await sb.auth.signUp({ email, password: pw, options: { emailRedirectTo: location.href.split('#')[0] } });
    else if (mode === 'forgot') r = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.href.split('#')[0] + '#account-profile' });
    else r = await sb.auth.signInWithPassword({ email, password: pw });
    setBusy(false);
    if (r.error) setMsg({ err: true, text: r.error.message });
    else if (mode === 'forgot') setMsg({ text: t.resetSent });
    else if (mode === 'signup' && !r.data.session) setMsg({ text: t.checkEmail });
  }
  return html`<div className="auth">
    <${Crest} s=${44} />
    <h1>${mode === 'signup' ? t.signUp : mode === 'forgot' ? t.forgot : t.welcomeBack}</h1>
    <p className="muted" style=${{ margin: 0 }}>${t.authLead}</p>
    <form className="form card" onSubmit=${submit}>
      <label className="field">${t.email}<input id="auth-email" type="email" required autoComplete="email" value=${email} onInput=${e => setEmail(e.target.value)} placeholder="name@example.com" /></label>
      ${mode !== 'forgot' && html`<label className="field">${t.password}<input id="auth-password" type="password" required minLength="8" autoComplete=${mode === 'signin' ? 'current-password' : 'new-password'} value=${pw} onInput=${e => setPw(e.target.value)} /></label>`}
      <button className="btn gold wide" disabled=${busy}>${busy ? t.loading : mode === 'signup' ? t.signUp : mode === 'forgot' ? t.submit : t.signIn}</button>
      ${msg && html`<p className=${'notice' + (msg.err ? ' err' : '')} role="status" style=${{ margin: 0 }}>${msg.text}</p>`}
      ${mode === 'signin' && html`<button type="button" className="link" style=${{ justifySelf: 'center' }} onClick=${() => setMode('forgot')}>${t.forgot}</button>`}
    </form>
    <button className="link" style=${{ justifySelf: 'center' }} onClick=${() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setMsg(null); }}>${mode === 'signin' ? t.noAccount + ' ' + t.signUp : t.haveAccount + ' ' + t.signIn}</button>
  </div>`;
}

/* ---------- account ---------- */
function Account({ ctx, tab: tab0 }) {
  const { t, lang, acct } = ctx;
  if (!acct) return html`<${Auth} ctx=${ctx} />`;
  const roles = acct.roles; const isAdmin = roles.includes('admin'), isEdu = roles.includes('instructor'), isStu = roles.includes('student'), isCom = roles.includes('commission') || isAdmin;
  const tabs = ['overview', ...(isStu || !roles.length ? ['learning', 'plan', 'transcript', 'portfolio'] : []), ...(isEdu ? ['studio', 'teaching'] : []), 'messages', 'billboard', 'achievements', 'profile', 'notifications', ...(isCom ? ['commission'] : []), ...(isAdmin ? ['admin'] : []), ...(!isEdu ? ['apply'] : [])];
  const tab = tabs.includes(tab0) ? tab0 : 'overview';
  const name = acct.profile?.display_name || acct.user.email;
  const area = isAdmin ? t.adminArea : isEdu ? t.eduArea : t.studentArea;
  return html`<div>
    <section className="section acc-head">
      <${Ava} p=${acct.profile || { display_name: name }} lg />
      <div style=${{ display: 'grid', gap: '6px', minWidth: 0, flex: 1 }}>
        <span className="eyebrow">${area}</span><h1>${name}</h1>
        <div className="chips">${roles.map(r => html`<span key=${r} className="badge case">${t['role_' + r]}</span>`)}${!roles.length && html`<span className="badge warn case">${t.pending}</span>`}</div>
      </div>
      <button className="btn sm" onClick=${ctx.signOut}>${t.signOut}</button>
    </section>
    <div className="section scroll-x"><div className="pills">${tabs.map(k => html`<button key=${k} className=${'pill' + (tab === k ? ' on' : '')} onClick=${() => go('account-' + k)}>${k === 'apply' ? t.applyTitle : k === 'billboard' ? t.myBillboard : k === 'plan' ? t.plan : t[k]}</button>`)}</div></div>
    ${tab === 'overview' && html`<${Overview} ctx=${ctx} />`}
    ${tab === 'learning' && html`<${Learning} ctx=${ctx} />`}
    ${tab === 'studio' && html`<${Studio} ctx=${ctx} />`}
    ${tab === 'teaching' && html`<${Teaching} ctx=${ctx} />`}
    ${tab === 'achievements' && html`<${Achievements} ctx=${ctx} />`}
    ${tab === 'profile' && html`<${ProfileForm} ctx=${ctx} />`}
    ${tab === 'notifications' && html`<${Notifications} ctx=${ctx} />`}
    ${tab === 'admin' && html`<${Admin} ctx=${ctx} />`}
    ${tab === 'billboard' && html`<${MyBillboard} ctx=${ctx} />`}
    ${tab === 'plan' && html`<${PlanBuilder} ctx=${ctx} />`}
    ${tab === 'messages' && html`<${MessagesTab} ctx=${ctx} />`}
    ${tab === 'transcript' && html`<${TranscriptTab} ctx=${ctx} />`}
    ${tab === 'portfolio' && html`<${PortfolioTab} ctx=${ctx} />`}
    ${tab === 'commission' && html`<${CommissionPanel} ctx=${ctx} />`}
    ${tab === 'apply' && html`<${ApplyTeach} ctx=${ctx} />`}
  </div>`;
}
function Overview({ ctx }) {
  const { t, lang, acct } = ctx;
  const [learn] = useAsync(() => api.learning(acct.user.id), [ctx.dataKey, acct.user.id]);
  const [ach] = useAsync(() => api.achievements(acct.user.id), [ctx.dataKey, acct.user.id]);
  const [notes] = useAsync(() => api.notifications(acct.user.id), [ctx.dataKey, acct.user.id]);
  const verified = (ach || []).filter(a => a.status === 'verified').length;
  return html`<div>
    <${Greeting} ctx=${ctx} />
    <${ContinueCard} ctx=${ctx} />
    <${NextStepCard} ctx=${ctx} />
    <${GrowthSection} ctx=${ctx} />
    ${!acct.roles.length && html`<section className="section"><div className="card" style=${{ display: 'grid', gap: '10px' }}><h2 style=${{ fontSize: '20px' }}>${t.noRole}</h2><p style=${{ margin: 0 }} className="muted">${t.noRoleD}</p>
      ${acct.application ? html`<div className="row"><span className="muted">${t.appStatus}:</span><${StatusBadge} s=${acct.application.status} t=${t} /></div>` : html`<div className="row"><button className="btn primary" onClick=${() => go('account-profile')}>${t.profile}</button><button className="btn" onClick=${() => go('account-apply')}>${t.applyTitle}</button></div>`}
    </div></section>`}
    <section className="section stats">
      <div className="stat"><b>${learn ? learn.items.length : '–'}</b><span>${t.statCourses}</span></div>
      <div className="stat"><b>${learn ? learn.certificates.length : '–'}</b><span>${t.statCerts}</span></div>
      <div className="stat"><b>${ach ? verified : '–'}</b><span>${t.statAch}</span></div>
    </section>
    ${learn && learn.items.length > 0 && html`<section className="section"><${SectionHead} title=${t.learning} action=${t.viewAll} onAction=${() => go('account-learning')} /><${ProgressCard} item=${learn.items.find(i => i.done < i.total) || learn.items[0]} ctx=${ctx} /></section>`}
    <section className="section"><${Journey} ctx=${ctx} certs=${learn ? learn.certificates.length : 0} ach=${verified} graded=${learn ? learn.submissions.filter(x => x.grade >= 80).length : 0} edu=${acct.roles.includes('instructor')} /></section>
    <section className="section"><${SectionHead} title=${t.notifications} action=${t.viewAll} onAction=${() => go('account-notifications')} />
      ${(notes || []).length ? html`<div className="list">${notes.slice(0, 3).map(n => html`<div key=${n.id} className="li"><span style=${{ color: 'var(--gold)' }}><${Icon} n="bell" /></span><div className="grow"><b>${n.title}</b><small>${n.body}</small></div><small className="muted">${fmtDate(n.created_at, lang, { day: 'numeric', month: 'short' })}</small></div>`)}</div>` : html`<${Empty} text=${t.noNotifications} />`}
    </section>
  </div>`;
}
function Learning({ ctx }) {
  const { t, lang, acct } = ctx;
  const [learn] = useAsync(() => api.learning(acct.user.id), [ctx.dataKey, acct.user.id]);
  if (!learn) return html`<div className="section"><div className="skeleton"></div></div>`;
  return html`<div>
    <section className="section"><${SectionHead} title=${t.learning} />
      ${learn.items.length ? html`<div className="grid two">${learn.items.map(i => html`<${ProgressCard} key=${i.course.id} item=${i} ctx=${ctx} />`)}</div>` : html`<${Empty} text=${t.noEnroll}><button className="btn primary" onClick=${() => go('academy')}>${t.browse}</button><//>`}
    </section>
    <section className="section"><${SectionHead} title=${t.myCerts} />
      ${learn.certificates.length ? html`<div className="grid two">${learn.certificates.map(c => html`<${CertCard} key=${c.id} c=${c} ctx=${ctx} />`)}</div>` : html`<${Empty} text=${t.noCerts} />`}
    </section>
    ${learn.submissions.length > 0 && html`<section className="section"><${SectionHead} title=${t.submitWork} />
      <div className="list">${learn.submissions.map(s => html`<div key=${s.id} className="li" style=${{ flexWrap: 'wrap' }}><span style=${{ color: 'var(--gold)' }}><${Icon} n="upload" /></span><div className="grow"><b>${s.file_name}</b><small>${fmtDate(s.submitted_at, lang)}${s.educator_feedback ? ' · ' + s.educator_feedback : ''}</small></div>${s.grade != null && html`<b style=${{ color: 'var(--gold-2)' }}>${s.grade}/100</b>`}<${StatusBadge} s=${s.status} t=${t} /></div>`)}</div>
    </section>`}
  </div>`;
}
function Teaching({ ctx }) {
  const { t, lang, acct, cats } = ctx;
  const [list, , reload] = useAsync(() => api.teaching(acct.user.id), [ctx.dataKey, acct.user.id]);
  const [f, setF] = useState({ title: '', description: '', category_id: '', price: '' }); const [busy, setBusy] = useState(false); const [edit, setEdit] = useState(null);
  async function create(e) { e.preventDefault(); setBusy(true); const r = await api.createCourse(acct.user.id, f, lang); setBusy(false); if (r?.error) ctx.toast(r.error.message); else { setF({ title: '', description: '', category_id: '', price: '' }); ctx.toast(t.saved); reload(); } }
  async function submit(c) { const r = await api.setCourseStatus(c.id, 'submitted'); if (r?.error) ctx.toast(r.error.message); else { ctx.toast(t.submitted); reload(); } }
  return html`<div>
    <section className="section"><${SectionHead} title=${t.teaching} />
      ${(list || []).length ? html`<div className="list">${list.map(c => html`<div key=${c.id} className="li" style=${{ flexWrap: 'wrap' }}>
        <div className="grow" style=${{ cursor: 'pointer' }} onClick=${() => go('course-' + c.slug)}><b>${loc(c.title, lang)}</b><small>${fmtPrice(c.price_cents, lang, t)} · ${c.students || 0} ${t.students}${c.lesson_count != null ? ' · ' + c.lesson_count + ' ' + t.lessons : ''}</small></div>
        <${StatusBadge} s=${c.status} t=${t} />
        <button className="btn sm" onClick=${() => setEdit(c.id)}>${t.manage}</button>
        ${c.status === 'draft' && html`<button className="btn sm" onClick=${() => submit(c)}>${t.sendReview}</button>`}
      </div>`)}</div>` : html`<${Empty} text=${t.noCourses} />`}
    </section>
    ${edit && html`<${CourseEditor} ctx=${ctx} id=${edit} onClose=${() => { setEdit(null); reload(); }} />`}
    <${ReviewQueue} ctx=${ctx} />
    <${Diplomas} ctx=${ctx} />
    <section className="section"><div className="card"><form className="form" onSubmit=${create}>
      <h2 style=${{ fontSize: '20px' }}>${t.newCourse}</h2>
      <label className="field">${t.courseTitle}<input id="nc-title" required value=${f.title} onInput=${e => setF({ ...f, title: e.target.value })} /></label>
      <label className="field">${t.courseDesc}<textarea id="nc-desc" value=${f.description} onInput=${e => setF({ ...f, description: e.target.value })}></textarea></label>
      <div className="two">
        <label className="field">${t.category}<select id="nc-cat" required value=${f.category_id} onChange=${e => setF({ ...f, category_id: e.target.value })}><option value="">—</option>${cats.map(c => html`<option key=${c.id} value=${c.id}>${loc(c.name, lang)}</option>`)}</select></label>
        <label className="field">${t.price}<input id="nc-price" type="number" min="0" step="1" inputMode="numeric" value=${f.price} onInput=${e => setF({ ...f, price: e.target.value })} /></label>
      </div>
      <button className="btn gold" disabled=${busy}>${busy ? t.loading : t.createDraft}</button>
    </form></div></section>
  </div>`;
}
function Achievements({ ctx }) {
  const { t, lang, acct } = ctx;
  const [list, , reload] = useAsync(() => api.achievements(acct.user.id), [ctx.dataKey, acct.user.id]);
  const [f, setF] = useState({}); const [busy, setBusy] = useState(false);
  async function add(e) { e.preventDefault(); setBusy(true); const r = await api.addAchievement(acct.user.id, f); setBusy(false); if (r?.error) ctx.toast(r.error.message); else { setF({}); ctx.toast(t.sentForApproval); reload(); } }
  const set = k => e => setF({ ...f, [k]: e.target.value });
  return html`<div>
    <section className="section"><${SectionHead} title=${t.achievements} />
      ${(list || []).length ? html`<div className="list">${list.map(a => html`<div key=${a.id} className="li"><span style=${{ color: 'var(--gold)' }}><${Icon} n="award" /></span><div className="grow"><b>${a.title}</b><small>${[a.issuer, a.achievement_date && fmtDate(a.achievement_date, lang)].filter(Boolean).join(' · ')}</small></div><${StatusBadge} s=${a.status} t=${t} /></div>`)}</div>` : html`<${Empty} text=${t.c2d} />`}
    </section>
    <section className="section"><div className="card"><form className="form" onSubmit=${add}>
      <h2 style=${{ fontSize: '20px' }}>${t.addAch}</h2>
      <label className="field">${t.achTitle}<input id="ach-title" required minLength="2" maxLength="160" value=${f.title || ''} onInput=${set('title')} /></label>
      <div className="two"><label className="field">${t.issuer}<input id="ach-issuer" value=${f.issuer || ''} onInput=${set('issuer')} /></label><label className="field">${t.date}<input id="ach-date" type="date" value=${f.achievement_date || ''} onInput=${set('achievement_date')} /></label></div>
      <label className="field">${t.evidence}<input id="ach-url" type="url" placeholder="https://" value=${f.evidence_url || ''} onInput=${set('evidence_url')} /></label>
      <button className="btn gold" disabled=${busy}>${busy ? t.loading : t.sendAch}</button>
    </form></div></section>
  </div>`;
}
function ProfileForm({ ctx }) {
  const { t, acct } = ctx; const p = acct.profile || {};
  const [f, setF] = useState({ display_name: p.display_name || '', professional_title: p.professional_title || '', country: p.country || '', bio: p.bio || '', expertise: (p.expertise || []).join(', '), languages: (p.languages || []).join(', '), portfolio_url: p.portfolio_url || '', years_experience: p.years_experience ?? '', public_profile_opt_in: !!p.public_profile_opt_in, public_directory_opt_in: !!p.public_directory_opt_in, city: p.city || '', open_to_work: !!p.open_to_work, preferred_language: p.preferred_language || ctx.lang });
  const [busy, setBusy] = useState(false);
  const set = k => e => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  async function save(e) { e.preventDefault(); setBusy(true); const r = await api.saveProfile(acct.user.id, f); setBusy(false); if (r?.error) ctx.toast(r.error.message); else { ctx.toast(t.saved); ctx.refreshAccount({ ...p, ...f, expertise: splitList(f.expertise), languages: splitList(f.languages) }); } }
  return html`<section className="section"><div className="card"><form className="form" onSubmit=${save}>
    <${AvatarUpload} ctx=${ctx} />
    <div className="two"><label className="field">${t.displayName}<input id="pf-name" value=${f.display_name} onInput=${set('display_name')} /></label><label className="field">${t.proTitle}<input id="pf-title" value=${f.professional_title} onInput=${set('professional_title')} /></label></div>
    <div className="two"><label className="field">${t.country}<input id="pf-country" value=${f.country} onInput=${set('country')} /></label><label className="field">${t.city}<input id="pf-city" value=${f.city} onInput=${set('city')} /></label></div>
    <label className="field">${t.yearsExp}<input id="pf-years" type="number" min="0" max="70" value=${f.years_experience} onInput=${set('years_experience')} /></label>
    <label className="field">${t.bio}<textarea id="pf-bio" value=${f.bio} onInput=${set('bio')}></textarea></label>
    <label className="field">${t.expertise}<input id="pf-exp" value=${f.expertise} onInput=${set('expertise')} /></label>
    <div className="two"><label className="field">${t.teachLangs}<input id="pf-langs" value=${f.languages} onInput=${set('languages')} /></label><label className="field">${t.portfolioUrl}<input id="pf-url" type="url" placeholder="https://" value=${f.portfolio_url} onInput=${set('portfolio_url')} /></label></div>
    <label className="field">${t.prefLang}<select id="pf-lang" value=${f.preferred_language} onChange=${set('preferred_language')}>${LANGS.map(l => html`<option key=${l.code} value=${l.code}>${l.label}</option>`)}</select></label>
    <label className="check"><input id="pf-public" type="checkbox" checked=${f.public_profile_opt_in} onChange=${set('public_profile_opt_in')} />${t.publicProfile}</label>
    <label className="check"><input id="pf-otw" type="checkbox" checked=${f.open_to_work} onChange=${set('open_to_work')} />${t.openToWork}</label>
    ${acct.roles.includes('instructor') && html`<label className="check"><input id="pf-dir" type="checkbox" checked=${f.public_directory_opt_in} onChange=${set('public_directory_opt_in')} />${t.directory}</label>`}
    <button className="btn gold" disabled=${busy}>${busy ? t.loading : t.save}</button>
  </form></div></section>`;
}
function Notifications({ ctx }) {
  const { t, lang, acct } = ctx;
  useEffect(() => { api.markRead(acct.user.id); }, []);
  const [notes] = useAsync(() => api.notifications(acct.user.id), [ctx.dataKey, acct.user.id]);
  return html`<section className="section">${(notes || []).length ? html`<div className="list">${notes.map(n => html`<div key=${n.id} className="li"><span style=${{ color: 'var(--gold)' }}><${Icon} n="bell" /></span><div className="grow"><b>${n.title}</b><small>${n.body}</small></div><small className="muted">${fmtDate(n.created_at, lang, { day: 'numeric', month: 'short' })}</small></div>`)}</div>` : html`<${Empty} text=${t.noNotifications} />`}</section>`;
}
function ApplyTeach({ ctx }) {
  const { t, acct } = ctx;
  const [f, setF] = useState({ full_name: acct.profile?.display_name || '' }); const [busy, setBusy] = useState(false); const [sent, setSent] = useState(false);
  const set = k => e => setF({ ...f, [k]: e.target.value });
  async function send(e) { e.preventDefault(); setBusy(true); const r = await api.applyTeach(acct.user.id, f); setBusy(false); if (r?.error) ctx.toast(r.error.message); else { setSent(true); ctx.toast(t.sentForApproval); } }
  if (sent || acct.application) return html`<section className="section"><div className="card" style=${{ display: 'grid', gap: '10px' }}><h2 style=${{ fontSize: '20px' }}>${t.applyTitle}</h2><div className="row"><span className="muted">${t.appStatus}:</span><${StatusBadge} s=${acct.application?.status || 'pending'} t=${t} /></div></div></section>`;
  return html`<section className="section"><div className="card"><form className="form" onSubmit=${send}>
    <h2 style=${{ fontSize: '20px' }}>${t.applyTitle}</h2><p className="muted" style=${{ margin: 0 }}>${t.applyD}</p>
    <div className="two"><label className="field">${t.fullName}<input id="ap-name" required value=${f.full_name} onInput=${set('full_name')} /></label><label className="field">${t.country}<input id="ap-country" value=${f.country || ''} onInput=${set('country')} /></label></div>
    <div className="two"><label className="field">${t.yearsExp}<input id="ap-years" type="number" min="0" max="70" value=${f.experience_years || ''} onInput=${set('experience_years')} /></label><label className="field">${t.teachLangs}<input id="ap-langs" value=${f.teaching_languages || ''} onInput=${set('teaching_languages')} /></label></div>
    <label className="field">${t.expertise}<input id="ap-exp" value=${f.expertise || ''} onInput=${set('expertise')} /></label>
    <label className="field">${t.eduSummary}<textarea id="ap-edu" value=${f.education_summary || ''} onInput=${set('education_summary')}></textarea></label>
    <label className="field">${t.portfolioUrl}<input id="ap-url" type="url" placeholder="https://" value=${f.portfolio_url || ''} onInput=${set('portfolio_url')} /></label>
    <button className="btn gold" disabled=${busy}>${busy ? t.loading : t.sendApp}</button>
  </form></div></section>`;
}
function Admin({ ctx }) {
  const { t, lang, acct } = ctx;
  const [q, , reload] = useAsync(() => api.adminQueue(), [ctx.dataKey]);
  async function act(p) { const r = await p; if (r?.error) ctx.toast(r.error.message); else { ctx.toast(t.saved); reload(); } }
  if (!q) return html`<div className="section"><div className="skeleton"></div></div>`;
  const Btns = ({ ok, no }) => html`<div className="row"><button className="btn sm gold" onClick=${ok}>${t.approve}</button><button className="btn sm" onClick=${no}>${t.reject}</button></div>`;
  const block = (title, items, render) => html`<section className="section"><${SectionHead} title=${title + (items.length ? ' · ' + items.length : '')} />${items.length ? html`<div className="list">${items.map(render)}</div>` : html`<${Empty} text=${t.nothing} />`}</section>`;
  return html`<div>
    ${block(t.pendingApps, q.apps, a => html`<div key=${a.id} className="li" style=${{ flexWrap: 'wrap' }}><div className="grow"><b>${a.full_name || '—'}</b><small>${[a.country, a.experience_years && a.experience_years + ' ' + t.years, (a.expertise || []).join(', '), (a.teaching_languages || []).join('/').toUpperCase()].filter(Boolean).join(' · ')}</small>${a.education_summary && html`<small style=${{ display: 'block', color: '#d4cec5' }}>${a.education_summary}</small>`}</div><${Btns} ok=${() => act(api.reviewApp(acct.user.id, a, true))} no=${() => act(api.reviewApp(acct.user.id, a, false))} /></div>`)}
    ${block(t.pendingAch, q.ach, a => html`<div key=${a.id} className="li" style=${{ flexWrap: 'wrap' }}><span style=${{ color: 'var(--gold)' }}><${Icon} n="award" /></span><div className="grow"><b>${a.title}</b><small>${[a.profile, a.issuer].filter(Boolean).join(' · ')}</small>${a.evidence_url && html`<a className="link" href=${a.evidence_url} target="_blank" rel="noopener">${t.evidence}</a>`}</div><${Btns} ok=${() => act(api.reviewAch(acct.user.id, a, true))} no=${() => act(api.reviewAch(acct.user.id, a, false))} /></div>`)}
    ${block(t.pendingCourses, q.courses, c => html`<div key=${c.id} className="li" style=${{ flexWrap: 'wrap' }}><div className="grow" style=${{ cursor: 'pointer' }} onClick=${() => go('course-' + c.slug)}><b>${loc(c.title, lang)}</b><small>${fmtPrice(c.price_cents, lang, t)}</small></div><${Btns} ok=${() => act(api.setCourseStatus(c.id, 'published'))} no=${() => act(api.setCourseStatus(c.id, 'rejected'))} /></div>`)}
    <${FreeLaunchAdmin} ctx=${ctx} />
    <${UsersAdmin} ctx=${ctx} />
    <${StoryReview} ctx=${ctx} />
    <${BillboardReview} ctx=${ctx} />
    <${CredReview} ctx=${ctx} />
    ${block(t.pendingOrgs, q.orgs, o => html`<div key=${o.id} className="li" style=${{ flexWrap: 'wrap' }}><span style=${{ color: 'var(--gold)' }}><${Icon} n=${o.kind === 'employer' ? 'store' : 'shield'} /></span><div className="grow"><b>${o.name}</b><small>${[o.city, o.country].filter(Boolean).join(', ')}</small></div><${Btns} ok=${() => act(api.reviewOrg(o, true))} no=${() => act(api.reviewOrg(o, false))} /></div>`)}
    <${NewsManager} ctx=${ctx} />
  </div>`;
}

/* ---------- root ---------- */
function App() {
  const [lang, setLangS] = useState(pickLang());
  const [route, setRoute] = useState(parseRoute());
  const [ready, setReady] = useState(false);
  const [demoRole, setDemoRoleS] = useState('guest');
  const [acct, setAcct] = useState(null);
  const [cats, setCats] = useState([]);
  const [dataKey, setDataKey] = useState(0);
  const [toastMsg, setToast] = useState(null);
  const [unread, setUnread] = useState(0);
  const t = I18N[lang];
  const timer = useRef();
  const toast = m => { setToast(m); clearTimeout(timer.current); timer.current = setTimeout(() => setToast(null), 3200); };
  const setLang = l => { setLangS(l); store.set('smot.lang', l); document.documentElement.lang = l; };
  useEffect(() => { document.documentElement.lang = lang; }, []);
  useEffect(() => { const f = () => setRoute(parseRoute()); addEventListener('hashchange', f); return () => removeEventListener('hashchange', f); }, []);

  const setDemoRole = r => { setDemoRoleS(r); resetDemoUserData(r); setAcct(r === 'guest' ? null : demoAccount(r)); setDataKey(k => k + 1); if (r !== 'guest' && parseRoute() === 'account') setRoute('account'); };

  useEffect(() => {
    (async () => {
      const live = await probeLive();
      MODE.demo = !live;
      setCats(await api.categories());
      if (live) {
        const { data } = await sb.auth.getSession();
        if (data.session?.user) setAcct(await api.account(data.session.user));
        sb.auth.onAuthStateChange(async (_e, s) => { setAcct(s?.user ? await api.account(s.user) : null); setDataKey(k => k + 1); });
      }
      setReady(true);
    })();
  }, []);
  useEffect(() => { if (acct) api.notifications(acct.user.id).then(n => setUnread((n || []).filter(x => !x.read_at).length)); else setUnread(0); }, [acct?.user?.id, dataKey]);

  const signOut = async () => { if (MODE.demo) setDemoRole('guest'); else { await sb.auth.signOut(); setAcct(null); } go('home'); };
  const refreshAccount = profile => setAcct(a => a ? { ...a, profile } : a);
  const bump = () => setDataKey(k => k + 1);
  const ctx = { t, lang, setLang, route, acct, cats, dataKey, toast, demoRole, setDemoRole, signOut, refreshAccount, unread, bump };

  let page;
  const [base, ...rest] = route.split('-'); const arg = rest.join('-');
  if (!ready) page = html`<div className="section"><div className="skeleton" style=${{ height: '320px' }}></div><div className="grid"><div className="skeleton"></div><div className="skeleton"></div></div></div>`;
  else if (base === 'academy') page = html`<${Academy} ctx=${ctx} tab=${arg} />`;
  else if (base === 'models') page = html`<${ModelsPage} ctx=${ctx} />`;
  else if (base === 'portfolio') page = html`<${PortfolioPage} ctx=${ctx} uid=${arg} />`;
  else if (base === 'stories') page = html`<${StoriesPage} ctx=${ctx} />`;
  else if (base === 'foundation') page = html`<${FoundationPage} ctx=${ctx} />`;
  else if (base === 'master') page = html`<${MasterPage} key=${arg} ctx=${ctx} id=${arg} />`;
  else if (base === 'verify') page = html`<div className="path"><${VerifyBox} ctx=${ctx} /></div>`;
  else if (base === 'legal') page = html`<${LegalPage} ctx=${ctx} kind=${arg} />`;
  else if (base === 'videos') page = html`<${VideosPage} ctx=${ctx} />`;
  else if (base === 'upload') page = html`<${UploadPage} ctx=${ctx} />`;
  else if (base === 'path') page = arg === 'master' ? html`<${MasterPath} ctx=${ctx} />` : arg === 'employer' ? html`<${EmployerPath} ctx=${ctx} />` : html`<${StudentPath} ctx=${ctx} />`;
  else if (base === 'masters') page = html`<${MastersPage} ctx=${ctx} />`;
  else if (base === 'square') page = html`<${SquarePage} ctx=${ctx} />`;
  else if (base === 'talents') page = html`<${Talents} ctx=${ctx} />`;
  else if (base === 'news') page = html`<${NewsPage} ctx=${ctx} />`;
  else if (base === 'course') page = html`<${CoursePage} key=${arg} ctx=${ctx} slug=${arg} />`;
  else if (base === 'certification') page = html`<${Certification} ctx=${ctx} />`;
  else if (base === 'careers') page = html`<${Careers} ctx=${ctx} tab=${arg} />`;
  else if (base === 'educators') page = html`<${Academy} ctx=${ctx} tab="educators" />`;
  else if (base === 'levels') page = html`<${Academy} ctx=${ctx} tab="levels" />`;
  else if (base === 'championships') page = html`<${Championships} ctx=${ctx} />`;
  else if (base === 'community') page = html`<${Community} ctx=${ctx} />`;
  else if (base === 'partners') page = html`<${Partners} ctx=${ctx} />`;
  else if (base === 'account') page = html`<${Account} ctx=${ctx} tab=${arg} />`;
  else page = html`<${HomeV8} ctx=${ctx} />`;

  return html`<${React.Fragment}>
    <${Topbar} ctx=${ctx} />
    <main className="shell">
      ${ready && MODE.demo && html`<${DemoStrip} ctx=${ctx} />`}
      ${page}
      <${Footer} ctx=${ctx} />
    </main>
    <${Tabbar} ctx=${ctx} />
    <${CelebrationHost} ctx=${ctx} />
    ${toastMsg && html`<div className="toast" role="status">${toastMsg}</div>`}
  <//>`;
}
ReactDOM.createRoot(document.getElementById('root')).render(html`<${App} />`);
