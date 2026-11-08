/* ================= v9: step-by-step structure — 3 doors, guided paths, breadcrumbs, next step ================= */
Object.assign(P, { menu: 'M4 6h16M4 12h16M4 18h16', door: 'M6 3h12v18H6zM14 12h.01' });
const MORE = [['models', 'users'], ['stories', 'heart'], ['foundation', 'shield'], ['news', 'news'], ['certification', 'award'], ['talents', 'search'], ['careers', 'brief'], ['community', 'chat'], ['partners', 'handshake'], ['championships', 'cal']];

function Crumbs({ items }) {
  return html`<nav className="crumbs" aria-label="Breadcrumb">${items.map(([label, r], i) => html`<${React.Fragment} key=${i}>${i > 0 && html`<span className="sep">›</span>`}${r && i < items.length - 1 ? html`<button onClick=${() => go(r)}>${label}</button>` : html`<span className="here">${label}</span>`}<//>`)}</nav>`;
}
function Stepper({ ctx, n, total }) {
  return html`<div className="stepper"><span>${ctx.t.step} ${n} ${ctx.t.of} ${total}</span><div className="stepbar">${Array.from({ length: total }, (_, i) => html`<i key=${i} className=${i < n ? 'on' : ''}></i>`)}</div></div>`;
}
function MoreMenu({ ctx, onClose }) {
  const { t } = ctx;
  return html`<${Modal} title=${t.more} onClose=${onClose}>
    <div className="more-list">${[['home', 'home', t.homeTab], ['videos', 'play', t.videos], ['upload', 'upload', t.uploadLesson], ['academy', 'book', t.academy], ['masters', 'steps', t.masters], ['square', 'image', t.square], ...MORE.map(([r, i]) => [r, i, t[r]]), ['account', 'user', t.account]].map(([r, i, l]) => html`<button key=${r} onClick=${() => { onClose(); go(r); }}><span className="ic"><${Icon} n=${i} s=${20} /></span>${l}<${Icon} n="chevR" s=${16} /></button>`)}</div>
  <//>`;
}

function WhoDoors({ ctx }) {
  const { t } = ctx;
  const doors = [
    ['path-master', 'award', t.doorEdu, t.doorEduD, html`<div className="door-ladder">${[5, 4, 3].map(l => html`<span key=${l} className=${'lv l' + l}>${t[LEVELS[l]]}</span>`)}</div>`],
    ['path-student', 'book', t.doorStu, t.doorStuD, html`<div className="door-ladder up">${[0, 1, 2].map(l => html`<span key=${l} className=${'lv l' + l}>${t[LEVELS[l]]}</span>`)}<span className="lv teach"><${Icon} n="arrow" s=${12} /> ${t.canTeach}</span></div>`],
    ['path-employer', 'store', t.doorEmp, t.doorEmpD, null]
  ];
  return html`<section className="section"><div style=${{ textAlign: 'center', display: 'grid', gap: '6px', justifyItems: 'center' }}><h2 style=${{ font: "600 italic clamp(30px,4.5vw,46px) var(--serif)", color: 'var(--gold-2)' }}>${t.who}</h2><p className="muted" style=${{ margin: 0 }}>${t.whoLead}</p></div>
    <div className="doors">${doors.map(([r, i, h, d, extra], k) => html`<button key=${r} className=${'door' + (k === 0 ? ' first' : '')} onClick=${() => go(r)}><span className="door-n">${k + 1}</span><span className="ic"><${Icon} n=${i} s=${28} /></span><b>${h}</b><span>${d}</span>${extra}<span className="btn gold">${t.start} <${Icon} n="arrow" s=${16} /></span></button>`)}</div>
  </section>`;
}
function BillboardRow({ ctx }) {
  const { t } = ctx; ctxCats = ctx.cats;
  const [list] = useAsync(() => api.billboards(), [ctx.dataKey]);
  const ads = (list || []).slice(0, 4);
  return html`<div className="bb-row">${ads.map(a => html`<div key=${a.id} className="slot std bb-cell"><${Billboard} ad=${a} size="std" ctx=${ctx} /></div>`)}</div>`;
}
function HomeV8({ ctx }) {
  const { t } = ctx;
  return html`<div>
    <${AcademyTitle} ctx=${ctx} />
    <${LaunchRibbon} ctx=${ctx} />
    <${HeroSlider} ctx=${ctx} />
    ${ctx.acct && html`<${ContinueCard} ctx=${ctx} />`}
    <${VideoShelves} ctx=${ctx} />
    <${WhoDoors} ctx=${ctx} />
    <${HomeSoul} ctx=${ctx} />
    <section className="section"><div className="section-head"><h2 style=${{ fontSize: '22px' }}>${t.showcase}</h2></div>
      <div className="showcase">
        <div style=${{ display: 'grid', gap: '10px', minWidth: 0 }}><div className="section-head"><b>${t.hallTitle}</b><button className="link" onClick=${() => go('masters')}>${t.viewAll} <${Icon} n="arrow" s=${16} /></button></div><${MastersLadder} ctx=${ctx} compact tiers=${[5, 4, 3]} /></div>
        <div style=${{ display: 'grid', gap: '10px', minWidth: 0 }}><div className="section-head"><b>${t.square}</b><button className="link" onClick=${() => go('square')}>${t.enterSquare} <${Icon} n="arrow" s=${16} /></button></div><${BillboardRow} ctx=${ctx} /></div>
      </div>
    </section>
  </div>`;
}

/* ---------- Student path: one question per screen ---------- */
function StudentPath({ ctx }) {
  const { t, lang, cats, acct } = ctx;
  const [courses] = useAsync(() => api.courses(), [ctx.dataKey]);
  const [s, setS] = useState({ step: 1, fac: null, slug: null, course: null, months: null });
  const all = courses || [];
  const counts = countBy(all);
  const cat = cats.find(c => c.slug === s.slug);
  const course = all.find(c => c.id === s.course);
  const set = o => { setS({ ...s, ...o }); window.scrollTo({ top: 0 }); };
  const back = () => set({ step: Math.max(1, s.step - 1) });
  const crumbs = [[t.homeCrumb, 'home'], [t.pathStudent, null]];
  if (s.fac) crumbs.push([t['fac_' + s.fac], null]);
  if (cat) crumbs.push([loc(cat.name, lang), null]);
  async function addToPlan() {
    if (!acct) return go('account');
    const cur = await api.plan(acct.user.id);
    const ids = [...new Set([...(cur?.course_ids || []), s.course])];
    const r = await api.savePlan(acct.user.id, { id: cur?.id, title: cur?.title || t.plan, months: s.months, course_ids: ids });
    if (r?.error) ctx.toast(r.error.message); else { ctx.toast(t.planSaved); go('academy-plan'); }
  }
  const who = c => c.instructor ? [c.instructor.display_name, c.instructor.professional_title].filter(Boolean).join(' · ') : (c.instructor_id === D.educator.id ? D.educator.display_name + ' · ' + t[LEVELS[D.educator.academy_level]] : '');
  return html`<div className="path">
    <${Crumbs} items=${crumbs} />
    <${Stepper} ctx=${ctx} n=${s.step} total=${5} />
    ${s.step === 1 && html`<section className="q"><h1>${t.chooseFaculty}</h1>
      <div className="choice-grid">${FACULTIES.map(f => html`<button key=${f} className="choice" onClick=${() => set({ fac: f, step: 2, slug: null, course: null })}><span className="ic"><${Icon} n=${FAC_ICON[f]} s=${24} /></span><b>${t['fac_' + f]}</b><span>${t['fac_' + f + '_d']}</span></button>`)}</div></section>`}
    ${s.step === 2 && html`<section className="q"><h1>${t.chooseDir}</h1>
      <div className="list">${cats.filter(c => c.faculty === s.fac).map(c => html`<button key=${c.id} className="li choice-row" onClick=${() => set({ slug: c.slug, step: 3, course: null })}><div className="grow"><b>${loc(c.name, lang)}</b><small>${counts[c.id] || 0} ${t.nCourses}</small></div><${Icon} n="chevR" s=${18} /></button>`)}</div></section>`}
    ${s.step === 3 && html`<section className="q"><h1>${t.chooseCourse}</h1>
      ${(() => { const list = all.filter(c => c.category_id === cat?.id); return list.length ? html`<div className="list">${list.map(c => html`<button key=${c.id} className="li choice-row" onClick=${() => set({ course: c.id, step: 4 })}><span className="avatar">${initials(who(c) || 'S')}</span><div className="grow"><b>${loc(c.title, lang)}</b><small>${[who(c), c.lesson_count != null ? c.lesson_count + ' ' + t.lessons : ''].filter(Boolean).join(' · ')}</small></div><span className="price">${fmtPrice(c.price_cents, lang, t)}</span></button>`)}</div>`
        : html`<${Empty} text=${t.noCoursesDir}><div className="row"><button className="btn" onClick=${back}>${t.backBtn}</button><button className="btn gold" onClick=${() => go('path-master')}>${t.ctaApply}</button></div><//>`; })()}
    </section>`}
    ${s.step === 4 && html`<section className="q"><h1>${t.chooseFormat}</h1>
      <div className="choice-grid four">${[0, 3, 6, 12].map(m => html`<button key=${m} className="choice" onClick=${() => set({ months: m, step: 5 })}><b className="big">${m === 0 ? '1' : m}</b><b>${t['fmt' + m]}</b>${course && m > 0 && course.price_cents > 0 && html`<span>${fmtPrice(Math.round(course.price_cents / m), lang, t)} ${t.perMonth}</span>`}</button>`)}</div></section>`}
    ${s.step === 5 && course && html`<section className="q"><h1>${t.yourPath}</h1>
      <div className="card summary">
        <div className="sum-row"><span>${t.directions}</span><b>${t['fac_' + s.fac]} › ${loc(cat.name, lang)}</b></div>
        <div className="sum-row"><span>${t.educator}</span><b>${who(course) || '—'}</b></div>
        <div className="sum-row"><span>${t.regCourse}</span><b>${loc(course.title, lang)}</b></div>
        <div className="sum-row"><span>${t.planFormat}</span><b>${t['fmt' + s.months]}</b></div>
        <div className="sum-row"><span>${t.planTotal}</span><b className="price">${fmtPrice(course.price_cents, lang, t)}</b></div>
      </div>
      <div className="row"><button className="btn gold" onClick=${addToPlan}>${acct ? t.addToPlan : t.signUpFirst} <${Icon} n="arrow" s=${16} /></button><button className="btn" onClick=${() => go('course-' + course.slug)}>${t.openCourse}</button></div>
    </section>`}
    ${s.step > 1 && html`<button className="link backlink" onClick=${back}><${Icon} n="back" s=${16} /> ${t.backBtn}</button>`}
  </div>`;
}

/* ---------- Master path: checklist that always shows the next step ---------- */
function useMasterSteps(ctx) {
  const { acct } = ctx;
  const uidv = acct?.user?.id;
  const [creds] = useAsync(() => uidv ? api.credentials(uidv) : [], [ctx.dataKey, uidv]);
  const [teach] = useAsync(() => uidv && acct.roles.includes('instructor') ? api.teaching(uidv) : [], [ctx.dataKey, uidv]);
  const [works] = useAsync(() => uidv && acct.roles.includes('instructor') ? api.courseWorks(uidv) : [], [ctx.dataKey, uidv]);
  const [reqs] = useAsync(() => uidv ? api.myLevelRequests(uidv) : [], [ctx.dataKey, uidv]);
  if (!acct) return null;
  const p = acct.profile || {}, isEdu = acct.roles.includes('instructor'), c = teach || [];
  const done = {
    mp1: !!(p.display_name && (p.professional_title || (p.expertise || []).length)),
    mp2: isEdu || acct.application?.status === 'approved',
    mp3: (creds || []).length > 0,
    mp4: c.length > 0,
    mp5: c.some(x => (x.lesson_count || 0) > 0),
    mp6: c.some(x => ['submitted', 'published'].includes(x.status)),
    mp7: c.some(x => x.status === 'published') && (works || []).length === 0,
    mp8: (p.academy_level || 0) >= 3 || (reqs || []).length > 0
  };
  const route = { mp1: 'account-profile', mp2: 'account-apply', mp3: 'account-teaching', mp4: 'account-teaching', mp5: 'account-teaching', mp6: 'account-teaching', mp7: 'account-teaching', mp8: 'academy-levels' };
  const pending = { mp2: acct.application?.status === 'pending' && !isEdu };
  const order = ['mp1', 'mp2', 'mp3', 'mp4', 'mp5', 'mp6', 'mp7', 'mp8'];
  const next = order.find(k => !done[k] && !pending[k]) || null;
  return { order, done, route, pending, next };
}
function ChecklistPath({ ctx, title, items, crumbs }) {
  const { t } = ctx;
  const n = items.filter(i => i.done).length;
  const cur = items.find(i => !i.done && !i.wait);
  return html`<div className="path">
    <${Crumbs} items=${crumbs} />
    <${Stepper} ctx=${ctx} n=${cur ? items.indexOf(cur) + 1 : items.length} total=${items.length} />
    <section className="q"><h1>${title}</h1>
      <div className="checklist">${items.map((it, i) => { const state = it.done ? 'done' : it === cur ? 'cur' : it.wait ? 'wait' : 'todo'; return html`<div key=${i} className=${'check-item ' + state}>
        <span className="cnum">${it.done ? html`<${Icon} n="check" s=${16} />` : i + 1}</span>
        <div className="grow"><b>${it.title}</b><small>${it.desc}</small></div>
        ${state === 'cur' && html`<button className="btn gold sm" onClick=${it.action}>${t.go} <${Icon} n="arrow" s=${14} /></button>`}
        ${state === 'wait' && html`<span className="badge warn">${t.pending}</span>`}
      </div>`; })}</div>
    </section>
  </div>`;
}
function MasterPath({ ctx }) {
  const { t, acct } = ctx;
  const m = useMasterSteps(ctx);
  const crumbs = [[t.homeCrumb, 'home'], [t.pathMaster, null]];
  const items = !acct ? [{ title: t.signUpFirst, desc: t.signUpFirstD, action: () => go('account') }, ...['mp1', 'mp2', 'mp3', 'mp4', 'mp5', 'mp6', 'mp7', 'mp8'].map(k => ({ title: t[k], desc: t[k + 'd'] }))]
    : m.order.map(k => ({ title: t[k], desc: t[k + 'd'], done: m.done[k], wait: m.pending[k], action: () => go(m.route[k]) }));
  return html`<${ChecklistPath} ctx=${ctx} title=${t.pathMaster} items=${items} crumbs=${crumbs} />`;
}
function EmployerPath({ ctx }) {
  const { t, acct } = ctx;
  const [emp, , reload] = useAsync(() => acct ? api.myEmployer(acct.user.id) : null, [ctx.dataKey, acct?.user?.id]);
  const [reg, setReg] = useState(false);
  const realEmp = MODE.demo && ctx.demoRole !== 'admin' ? null : emp;
  const items = [
    { title: t.signUpFirst, desc: t.signUpFirstD, done: !!acct, action: () => go('account') },
    { title: t.ep1, desc: t.ep1d, done: !!realEmp, action: () => setReg(true) },
    { title: t.ep2, desc: t.ep2d, done: realEmp?.status === 'approved', wait: realEmp && realEmp.status === 'pending' },
    { title: t.ep3, desc: t.ep3d, done: false, action: () => go('talents') },
    { title: t.ep4, desc: t.ep4d, done: false, action: () => go('talents') }
  ];
  return html`<div>
    <${ChecklistPath} ctx=${ctx} title=${t.pathEmployer} items=${items} crumbs=${[[t.homeCrumb, 'home'], [t.pathEmployer, null]]} />
    ${reg && html`<${SimpleForm} ctx=${ctx} title=${t.employerCta} submit=${t.sendForApproval} done=${t.sentForApproval}
      fields=${[['name', t.salonName, 'text', true], ['country', t.country, 'text', true], ['city', t.city, 'text', true], ['website', t.website, 'url'], ['description', t.bio, 'textarea']]}
      onSubmit=${x => api.registerEmployer(acct.user.id, x)} onClose=${() => { setReg(false); reload(); }} />`}
  </div>`;
}

/* ---------- One clear next action in the cabinet ---------- */
function NextStepCard({ ctx }) {
  const { t, lang, acct } = ctx;
  const isEdu = acct.roles.includes('instructor');
  const m = useMasterSteps(ctx);
  const [learn] = useAsync(() => !isEdu ? api.learning(acct.user.id) : null, [ctx.dataKey, acct.user.id]);
  const [core, coreLoading] = useAsync(() => api.coreStatus(acct.user.id), [ctx.dataKey, acct.user.id]);
  let title = null, desc = '', action = null;
  if (!coreLoading && !core && !isEdu) { title = t.foundation; desc = t.foundationRequired; action = () => go('foundation'); }
  else if (isEdu && m) { if (m.next) { title = t[m.next]; desc = t[m.next + 'd']; action = () => go(m.route[m.next]); } }
  else if (learn) {
    const open = learn.items.find(i => i.done < i.total);
    if (open) { title = t.ns_continue; desc = loc(open.course.title, lang) + ' · ' + fill(t.lessonsDone, { a: open.done, b: open.total }); action = () => go('course-' + open.course.slug); }
    else if (!learn.items.length) { title = t.ns_choose; desc = t.doorStuD; action = () => go('path-student'); }
    else { title = t.ns_level; desc = t.commissionText; action = () => go('academy-levels'); }
  }
  if (!title) return null;
  return html`<section className="section"><div className="next-step"><span className="eyebrow">${t.nextStep}</span><b>${title}</b><span>${desc}</span><button className="btn gold" onClick=${action}>${t.go} <${Icon} n="arrow" s=${16} /></button></div></section>`;
}
