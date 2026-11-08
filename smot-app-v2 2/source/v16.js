/* ================= v17: master studio — review queue, quick phrases, questions, students, reminders, lesson order ================= */
Object.assign(P, { ask: 'M4 5h16v11H9l-5 4zM12 8.5v3M12 14h.01', up: 'M12 19V5M5 12l7-7 7 7', down: 'M12 5v14M19 12l-7 7-7-7', bell2: 'M6 16V11a6 6 0 1 1 12 0v5l2 2H4zM10 21h4' });
const daysAgo = d => Math.max(0, Math.floor((Date.now() - new Date(d)) / 864e5));
D.questions = [
  { id: 'q1', lesson_id: 'k1-l3', author_name: 'Olena · sample', t_sec: 245, body: 'How do I keep the babylights even near the hairline?', answer: null, created_at: daysFromNow(-1) },
  { id: 'q2', lesson_id: 'k1-l5', author_name: 'Marta · sample', t_sec: 130, body: 'Can I use 6% developer on fine hair for this placement?', answer: 'Better 3% on fine hair and a little longer processing. Check every 10 minutes.', answered_at: daysFromNow(-2), created_at: daysFromNow(-3) }
];
D.templates = null;
const SAMPLE_STUDENTS = ['Olena', 'Marta', 'Iryna', 'Daria', 'Sofia', 'Anna'];
Object.assign(api, {
  async questions(lessonId) {
    if (MODE.demo || !isUuid(lessonId)) return D.questions.filter(q => q.lesson_id === lessonId);
    return rows(await sb.from('lesson_questions').select('*').eq('lesson_id', lessonId).order('created_at'));
  },
  async askQuestion(acct, lesson, body, t_sec) {
    const author_name = acct.profile?.display_name || acct.user.email.split('@')[0];
    if (MODE.demo || !isUuid(lesson.id)) { D.questions.push({ id: uid(), lesson_id: lesson.id, author_id: acct.user.id, author_name, t_sec, body, answer: null, created_at: new Date().toISOString() }); return {}; }
    return sb.from('lesson_questions').insert({ lesson_id: lesson.id, author_id: acct.user.id, author_name, t_sec, body });
  },
  async answerQuestion(q, answer) {
    if (MODE.demo || !isUuid(q.id)) { q.answer = answer; q.answered_at = new Date().toISOString(); return {}; }
    return sb.rpc('answer_question', { p_id: q.id, p_answer: answer });
  },
  async masterQuestions(userId) {
    if (MODE.demo) { const all = Object.values(D.lessons).flat(); return D.questions.map(q => { const l = all.find(x => x.id === q.lesson_id); return { ...q, _ref: q, lesson: l?.title, course: D.courses.find(c => c.id === l?.course_id) }; }); }
    const courses = rows(await sb.from('courses').select('id,slug,title').eq('instructor_id', userId)); if (!courses.length) return [];
    const lessons = rows(await sb.from('lessons').select('id,course_id,title').in('course_id', courses.map(c => c.id))); if (!lessons.length) return [];
    const qs = rows(await sb.from('lesson_questions').select('*').in('lesson_id', lessons.map(l => l.id)).order('created_at', { ascending: false }).limit(200));
    return qs.map(q => { const l = lessons.find(x => x.id === q.lesson_id); return { ...q, lesson: l?.title, course: courses.find(c => c.id === l?.course_id) }; });
  },
  async templates(acct, t) {
    if (MODE.demo) { if (!D.templates) D.templates = [t.tplA, t.tplB, t.tplC].map((body, i) => ({ id: 'tp' + i, body })); return D.templates; }
    return rows(await sb.from('feedback_templates').select('*').eq('user_id', acct.user.id).order('created_at'));
  },
  async addTemplate(acct, body) { if (MODE.demo) { D.templates.push({ id: uid(), body }); return {}; } return sb.from('feedback_templates').insert({ user_id: acct.user.id, body }); },
  async delTemplate(tp) { if (MODE.demo) { D.templates = D.templates.filter(x => x !== tp); return {}; } return sb.from('feedback_templates').delete().eq('id', tp.id); },
  async courseStudents(course) {
    if (MODE.demo) { const total = D.lessons[course.id]?.length || 8; return SAMPLE_STUDENTS.map((n, i) => ({ student_id: 'ds' + i, display_name: n + ' · sample', city: ['Leiden', 'Amsterdam', 'Rotterdam', 'Haarlem', 'Utrecht', 'Noordwijk'][i], enrolled_at: daysFromNow(-30 - i * 3), done: Math.round(total * [1, .8, .6, .4, .3, .1][i]), total, last_active: daysFromNow(-(i < 3 ? i : 9 + i * 2)), avg_grade: [92, 85, 78, null, 70, null][i], works: [5, 4, 3, 0, 2, 0][i] })); }
    return rows(await sb.rpc('course_students', { p_course: course.id }));
  },
  async notifyCourse(course, title, body, studentId) {
    if (MODE.demo) return { data: studentId ? 1 : SAMPLE_STUDENTS.length };
    return sb.rpc('notify_course', { p_course: course.id, p_title: title, p_body: body || '', p_student: studentId || null });
  },
  async moveLesson(courseId, lessons, i, dir) {
    const j = i + dir; if (j < 0 || j >= lessons.length) return {};
    const a = lessons[i], b = lessons[j];
    if (MODE.demo) { const arr = D.lessons[courseId]; const ia = arr.indexOf(arr.find(x => x.id === a.id)), ib = arr.indexOf(arr.find(x => x.id === b.id)); [arr[ia], arr[ib]] = [arr[ib], arr[ia]]; arr.forEach((x, k) => x.sort_order = k + 1); return {}; }
    const sa = a.sort_order ?? i + 1, sb2 = b.sort_order ?? j + 1;
    const r1 = await sb.from('lessons').update({ sort_order: sa === sb2 ? j + 1 : sb2 }).eq('id', a.id); if (r1.error) return r1;
    return sb.from('lessons').update({ sort_order: sa === sb2 ? i + 1 : sa }).eq('id', b.id);
  }
});

/* ---------- Lesson questions (students ask, master answers) ---------- */
function QuestionsPanel({ ctx, lesson, course, now, seek }) {
  const { t, lang, acct } = ctx;
  const [list, , reload] = useAsync(() => acct ? api.questions(lesson.id) : [], [lesson.id, acct?.user.id]);
  const [body, setBody] = useState(''); const [ans, setAns] = useState({});
  const isMaster = acct && (course?.instructor_id === acct.user.id || acct.roles.includes('admin'));
  if (!acct) return null;
  async function ask(e) { e.preventDefault(); if (body.trim().length < 3) return; const r = await api.askQuestion(acct, lesson, body.trim(), Math.floor(now)); if (r?.error) ctx.toast(r.error.message); else { setBody(''); ctx.toast(t.questionSent); reload(); } }
  async function answer(q) { const a = (ans[q.id] || '').trim(); if (a.length < 2) return; const r = await api.answerQuestion(q._ref || q, a); if (r?.error) ctx.toast(r.error.message); else { setAns({ ...ans, [q.id]: '' }); ctx.toast(t.saved); reload(); } }
  return html`<div className="notes qa">
    <b><${Icon} n="ask" s=${16} /> ${t.questionsTitle}</b>
    ${(list || []).length ? html`<ul className="qa-list">${list.map(q => html`<li key=${q.id}>
      <div className="qa-q">${q.t_sec != null && html`<button className="tc" onClick=${() => seek(q.t_sec)}>${fmtT(q.t_sec)}</button>`}<span><b>${q.author_name || t.member}</b> ${q.body}</span></div>
      ${q.answer ? html`<div className="qa-a"><span className="eyebrow">${t.masterAnswer}</span><p>${q.answer}</p></div>`
        : isMaster ? html`<div className="note-add"><input id=${'qa-' + q.id} placeholder=${t.answerPh} value=${ans[q.id] || ''} onInput=${e => setAns({ ...ans, [q.id]: e.target.value })} /><button className="btn sm gold" onClick=${() => answer(q)}>${t.answerBtn}</button></div>`
        : html`<small className="muted">${t.waitingAnswer}</small>`}
    </li>`)}</ul>` : html`<small className="muted">${t.noQuestions}</small>`}
    ${!isMaster && html`<form className="note-add" onSubmit=${ask}><input id="qa-body" maxLength="1500" placeholder=${t.askPh} value=${body} onInput=${e => setBody(e.target.value)} /><button className="btn sm">${t.askBtn} · ${fmtT(now)}</button></form>`}
  </div>`;
}

/* ---------- Review queue with quick phrases and "save & next" ---------- */
function ReviewQueue({ ctx }) {
  const { t, lang, acct } = ctx;
  const [list, , reload] = useAsync(() => api.courseWorks(acct.user.id), [ctx.dataKey, acct.user.id]);
  const [tpls, , reloadT] = useAsync(() => api.templates(acct, t), [acct.user.id]);
  const [w, setW] = useState(null); const [g, setG] = useState(''); const [fb, setFb] = useState(''); const [busy, setBusy] = useState(false); const [url, setUrl] = useState(null); const [sc, setSc] = useState({});
  const queue = [...(list || [])].sort((a, b) => new Date(a.submitted_at) - new Date(b.submitted_at));
  async function openW(x) { setW(x); setG(''); setFb(''); setSc({}); setUrl(null); setUrl(await api.workUrl(x.file_path)); }
  async function save(revise, next) {
    if (!revise && (g === '' || g < 0 || g > 100)) return;
    setBusy(true); const r = await api.gradeWork(acct.user.id, w, g, fb, revise, sc); setBusy(false);
    if (r?.error) return ctx.toast(r.error.message);
    ctx.toast(t.saved); const rest = queue.filter(x => x.id !== w.id); reload(); ctx.bump();
    if (next && rest.length) openW(rest[0]); else setW(null);
  }
  async function saveTpl() { if (fb.trim().length < 2) return; const r = await api.addTemplate(acct, fb.trim()); r?.error ? ctx.toast(r.error.message) : (ctx.toast(t.tplSaved), reloadT()); }
  return html`<section className="section"><${SectionHead} title=${t.studentWorks + (queue.length ? ' · ' + queue.length : '')} />
    ${queue.length ? html`<div className="list">${queue.map(x => { const dd = daysAgo(x.submitted_at); return html`<div key=${x.id} className="li" style=${{ flexWrap: 'wrap' }}>
      <span className="avatar">${initials(x.student || t.student)}</span>
      <div className="grow"><b>${x.student || t.student}</b><small>${loc(x.lesson, lang)} · ${loc(x.course, lang)}</small></div>
      <span className=${'badge case' + (dd >= 3 ? ' warn' : '')}>${dd === 0 ? t.today : t.waits + ' ' + dd + ' ' + t.dShort}</span>
      <button className="btn sm gold" onClick=${() => openW(x)}>${t.reviewNow}</button></div>`; })}</div>` : html`<${Empty} text=${t.allReviewed} />`}
    ${w && html`<${Modal} title=${(w.student || t.student) + ' · ' + loc(w.lesson, lang)} onClose=${() => setW(null)}>
      ${url ? (/\.(mp4|mov|webm)$/i.test(w.file_name || '') ? html`<video className="video" src=${url} controls playsInline></video>` : /\.pdf$/i.test(w.file_name || '') ? html`<a className="btn" href=${url} target="_blank" rel="noopener">${t.view} ${w.file_name}</a>` : html`<img src=${url} alt="" style=${{ borderRadius: '14px', maxHeight: '50vh', objectFit: 'contain' }} />`) : html`<div className="notice">${w.file_name || ''}</div>`}
      ${w.student_note && html`<p className="notice" style=${{ margin: 0 }}>${w.student_note}</p>`}
      <${RubricGrader} ctx=${ctx} scores=${sc} setScores=${x => { setSc(x); setG(String(RUBRIC.reduce((s2, r) => s2 + (Number(x[r.key]) || 0), 0))); }} />
      <div className="tpl"><span className="tool-l">${t.quickPhrases}</span><div className="chips">${(tpls || []).map(tp => html`<span key=${tp.id} className="tpl-chip"><button onClick=${() => setFb(fb ? fb.trim() + ' ' + tp.body : tp.body)}>${tp.body}</button><button className="x" aria-label="×" onClick=${async () => { await api.delTemplate(tp); reloadT(); }}>×</button></span>`)}</div></div>
      <label className="field">${t.feedback}<textarea id="rq-fb" value=${fb} onInput=${e => setFb(e.target.value)}></textarea></label>
      <button className="link" style=${{ justifySelf: 'start' }} onClick=${saveTpl}>+ ${t.saveTpl}</button>
      <div className="row"><button className="btn gold" disabled=${busy || g === ''} onClick=${() => save(false, true)}>${queue.length > 1 ? t.saveNext : t.gradeSave}</button><button className="btn" disabled=${busy} onClick=${() => save(true, true)}>${t.needsRevision}</button></div>
    <//>`}
  </section>`;
}

/* ---------- Master questions inbox ---------- */
function QuestionsInbox({ ctx }) {
  const { t, lang, acct } = ctx;
  const [list, , reload] = useAsync(() => api.masterQuestions(acct.user.id), [ctx.dataKey, acct.user.id]);
  const [ans, setAns] = useState({}); const [showAll, setShowAll] = useState(false);
  const open = (list || []).filter(q => !q.answer); const shown = showAll ? (list || []) : open;
  async function answer(q) { const a = (ans[q.id] || '').trim(); if (a.length < 2) return; const r = await api.answerQuestion(q._ref || q, a); if (r?.error) ctx.toast(r.error.message); else { ctx.toast(t.saved); setAns({ ...ans, [q.id]: '' }); reload(); ctx.bump(); } }
  return html`<section className="section"><div className="section-head"><h2>${t.questionsTitle}${open.length ? ' · ' + open.length : ''}</h2><button className="link" onClick=${() => setShowAll(!showAll)}>${showAll ? t.onlyOpen : t.showAnswered}</button></div>
    ${shown.length ? html`<div className="list">${shown.map(q => html`<div key=${q.id} className="card qa-card">
      <small className="muted">${loc(q.course?.title, lang)} · ${loc(q.lesson, lang)}${q.t_sec != null ? ' · ' + fmtT(q.t_sec) : ''} · ${fmtDate(q.created_at, lang, { day: 'numeric', month: 'short' })}</small>
      <p style=${{ margin: 0 }}><b>${q.author_name || t.member}:</b> ${q.body}</p>
      ${q.answer ? html`<div className="qa-a"><span className="eyebrow">${t.masterAnswer}</span><p>${q.answer}</p></div>`
        : html`<div className="note-add"><input id=${'qi-' + q.id} placeholder=${t.answerPh} value=${ans[q.id] || ''} onInput=${e => setAns({ ...ans, [q.id]: e.target.value })} /><button className="btn sm gold" onClick=${() => answer(q)}>${t.answerBtn}</button></div>`}
    </div>`)}</div>` : html`<${Empty} text=${t.noOpenQuestions} />`}
  </section>`;
}

/* ---------- My students per course, reminders and announcements ---------- */
function MyStudents({ ctx, courses }) {
  const { t, lang } = ctx;
  const [cid, setCid] = useState(courses[0]?.id);
  const course = courses.find(c => c.id === cid) || courses[0];
  const [list] = useAsync(() => course ? api.courseStudents(course) : [], [course?.id, ctx.dataKey]);
  const [ann, setAnn] = useState(false);
  async function remind(s) { const r = await api.notifyCourse(course, t.remindTitle, t.remindBody, s.student_id); r?.error ? ctx.toast(r.error.message) : ctx.toast(t.reminded); }
  if (!course) return null;
  return html`<section className="section"><div className="section-head"><h2>${t.myStudents}</h2><button className="btn sm" onClick=${() => setAnn(true)}><${Icon} n="bell2" s=${15} /> ${t.announce}</button></div>
    ${courses.length > 1 && html`<label className="field" style=${{ maxWidth: '420px', marginBottom: '12px' }}>${t.course}<select id="ms-course" value=${course.id} onChange=${e => setCid(e.target.value)}>${courses.map(c => html`<option key=${c.id} value=${c.id}>${loc(c.title, lang)}</option>`)}</select></label>`}
    ${(list || []).length ? html`<div className="list">${list.map(s => { const pct = s.total ? Math.round(s.done / s.total * 100) : 0; const idle = daysAgo(s.last_active); const sleepy = idle >= 7 && pct < 100; return html`<div key=${s.student_id} className="li stu-row">
      <span className="avatar">${initials(s.display_name || t.student)}</span>
      <div className="grow"><b>${s.display_name || t.student}</b><small>${[s.city, (idle === 0 ? t.today : t.lastSeen + ' ' + idle + ' ' + t.dShort)].filter(Boolean).join(' · ')}</small><div className="bar"><i style=${{ width: pct + '%' }}></i></div></div>
      <div className="stu-num"><b>${pct}%</b><small>${s.done}/${s.total}</small></div>
      <div className="stu-num"><b>${s.avg_grade ?? '—'}</b><small>${t.avgGradeShort}</small></div>
      ${sleepy ? html`<button className="btn sm gold" onClick=${() => remind(s)}>${t.remind}</button>` : html`<span className="badge case">${pct === 100 ? t.finished : t.active}</span>`}
    </div>`; })}</div>` : html`<${Empty} text=${t.noStudentsYet} />`}
    ${ann && html`<${AnnounceModal} ctx=${ctx} course=${course} onClose=${() => setAnn(false)} />`}
  </section>`;
}
function AnnounceModal({ ctx, course, onClose }) {
  const { t, lang } = ctx;
  const [f, setF] = useState({ title: '', body: '' }); const [busy, setBusy] = useState(false);
  async function send(e) { e.preventDefault(); setBusy(true); const r = await api.notifyCourse(course, f.title, f.body); setBusy(false); if (r?.error) ctx.toast(r.error.message); else { ctx.toast(t.sentTo + ' ' + (r.data ?? '')); onClose(); } }
  return html`<${Modal} title=${t.announce + ' · ' + loc(course.title, lang)} onClose=${onClose}><form className="form" onSubmit=${send}>
    <label className="field">${t.annTitle}<input id="an-title" required minLength="2" maxLength="120" value=${f.title} onInput=${e => setF({ ...f, title: e.target.value })} placeholder=${t.annTitlePh} /></label>
    <label className="field">${t.annBody}<textarea id="an-body" maxLength="1000" value=${f.body} onInput=${e => setF({ ...f, body: e.target.value })}></textarea></label>
    <button className="btn gold" disabled=${busy}>${busy ? t.loading : t.send}</button></form><//>`;
}

/* ---------- Studio: the master's home ---------- */
function Studio({ ctx }) {
  const { t, acct } = ctx;
  const [courses] = useAsync(() => api.teaching(acct.user.id), [ctx.dataKey, acct.user.id]);
  const [works] = useAsync(() => api.courseWorks(acct.user.id), [ctx.dataKey, acct.user.id]);
  const [qs] = useAsync(() => api.masterQuestions(acct.user.id), [ctx.dataKey, acct.user.id]);
  const students = (courses || []).reduce((s, c) => s + (c.students || 0), 0);
  const openQ = (qs || []).filter(q => !q.answer).length; const nWorks = (works || []).length;
  const oldest = (works || []).reduce((m, w) => Math.max(m, daysAgo(w.submitted_at)), 0);
  const first = (acct.profile?.display_name || '').split(' ')[0];
  const scrollTo = id => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  return html`<div>
    <section className="section"><div className="greet"><h2>${t.studioHello}${first ? ', ' + first : ''} ✨</h2><p className="muted" style=${{ margin: 0 }}>${nWorks || openQ ? t.studioTodo : t.studioClear}</p></div></section>
    <section className="section"><div className="studio-stats">
      <button className=${'stat-tile' + (nWorks ? ' hot' : '')} onClick=${() => scrollTo('st-works')}><b>${nWorks}</b><span>${t.stWaiting}</span>${oldest >= 3 && html`<small>${t.oldest} ${oldest} ${t.dShort}</small>`}</button>
      <button className=${'stat-tile' + (openQ ? ' hot' : '')} onClick=${() => scrollTo('st-q')}><b>${openQ}</b><span>${t.stQuestions}</span></button>
      <button className="stat-tile" onClick=${() => scrollTo('st-s')}><b>${students}</b><span>${t.stStudents}</span></button>
      <button className="stat-tile" onClick=${() => go('account-teaching')}><b>${(courses || []).length}</b><span>${t.stCourses}</span></button>
    </div></section>
    <div id="st-works"><${ReviewQueue} ctx=${ctx} /></div>
    <div id="st-q"><${QuestionsInbox} ctx=${ctx} /></div>
    <div id="st-s">${(courses || []).length ? html`<${MyStudents} ctx=${ctx} courses=${courses} />` : ''}</div>
  </div>`;
}

/* ---------- Course editor helpers: reorder and bulk upload ---------- */
function MoveLesson({ ctx, lessons, i, onDone }) {
  const { t } = ctx; const courseId = lessons[i].course_id;
  async function mv(dir) { const r = await api.moveLesson(courseId, lessons, i, dir); r?.error ? ctx.toast(r.error.message) : onDone(); }
  return html`<span className="mv"><button aria-label=${t.moveUp} disabled=${i === 0} onClick=${() => mv(-1)}><${Icon} n="up" s=${14} /></button><button aria-label=${t.moveDown} disabled=${i === lessons.length - 1} onClick=${() => mv(1)}><${Icon} n="down" s=${14} /></button></span>`;
}
function BulkUpload({ ctx, course, count, onDone }) {
  const { t, lang } = ctx;
  const [files, setFiles] = useState([]); const [done, setDone] = useState(0); const [busy, setBusy] = useState(false);
  const nice = n => n.replace(/\.[^.]+$/, '').replace(/^\d+[\s._-]*/, '').replace(/[_-]+/g, ' ').trim() || n;
  async function go2() {
    const list = [...files].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true })); setBusy(true); setDone(0);
    for (let k = 0; k < list.length; k++) { const f = list[k]; const r = await api.addLesson(course, { title: { [lang]: nice(f.name) }, description: {}, minutes: '', is_preview: false }, f, count + k + 1); if (r?.error) { ctx.toast(r.error.message); break; } setDone(k + 1); }
    setBusy(false); ctx.toast(t.bulkDone + ' ' + list.length); setFiles([]); onDone();
  }
  return html`<div className="card bulk"><b><${Icon} n="upload" s=${16} /> ${t.bulkUpload}</b><small className="muted">${t.bulkHint}</small>
    <input id="bulk-files" type="file" accept="video/*" multiple onChange=${e => setFiles([...e.target.files])} />
    ${files.length > 0 && html`<ol className="bulk-list">${[...files].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true })).map(f => html`<li key=${f.name}>${nice(f.name)}</li>`)}</ol>
      <button className="btn gold" disabled=${busy} onClick=${go2}>${busy ? t.loading + ' ' + done + '/' + files.length : t.bulkStart + ' (' + files.length + ')'}</button>`}
  </div>`;
}
