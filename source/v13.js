/* ================= v14: academic standards — rubrics, Foundations, lesson tests, transcript, EQF ================= */
const RUBRIC = [{ key: 'consultation', max: 20 }, { key: 'technique', max: 30 }, { key: 'result', max: 30 }, { key: 'hygiene', max: 20 }];
const LEVEL_EQF = [2, 3, 4, 5, 5, 6];
const CREDIT_HOURS = 27;
const credits = seconds => Math.round((seconds / 3600 / CREDIT_HOURS) * 2) / 2;
D.coreDone = null; D.quizzes = {}; D.quizAttempts = [];
D.quizzes['k1-l1'] = { pass_percent: 70, questions: [
  { q: { en: 'What does the level number in hair colour describe?', uk: 'Що означає рівень у фарбуванні волосся?', ru: 'Что обозначает уровень в окрашивании волос?' }, options: [{ en: 'How light or dark the hair is', uk: 'Наскільки світле чи темне волосся', ru: 'Насколько светлые или тёмные волосы' }, { en: 'The hair length', uk: 'Довжину волосся', ru: 'Длину волос' }, { en: 'The price of the dye', uk: 'Ціну фарби', ru: 'Цену краски' }], correct: 0 },
  { q: { en: 'Which tone neutralises orange?', uk: 'Який тон нейтралізує помаранчевий?', ru: 'Какой тон нейтрализует оранжевый?' }, options: [{ en: 'Gold', uk: 'Золотистий', ru: 'Золотистый' }, { en: 'Blue', uk: 'Синій', ru: 'Синий' }, { en: 'Red', uk: 'Червоний', ru: 'Красный' }], correct: 1 },
  { q: { en: 'Which tone neutralises yellow?', uk: 'Який тон нейтралізує жовтий?', ru: 'Какой тон нейтрализует жёлтый?' }, options: [{ en: 'Violet', uk: 'Фіолетовий', ru: 'Фиолетовый' }, { en: 'Green', uk: 'Зелений', ru: 'Зелёный' }, { en: 'Copper', uk: 'Мідний', ru: 'Медный' }], correct: 0 }] };

Object.assign(api, {
  async core() {
    if (MODE.demo) return { modules: CORE_MODULES, questions: CORE_QUESTIONS_DEMO.map(({ correct, ...q }) => q) };
    const [m, q] = await Promise.all([sb.from('core_modules').select('*').order('id'), sb.rpc('get_core_quiz')]);
    return { modules: rows(m), questions: rows(q) };
  },
  async coreStatus(userId) {
    if (MODE.demo) return D.coreDone;
    return (await sb.from('core_completions').select('*').eq('user_id', userId).maybeSingle()).data;
  },
  async submitCore(answers) {
    if (MODE.demo) { const s = CORE_QUESTIONS_DEMO.filter((q, i) => answers[i] === q.correct).length, tot = CORE_QUESTIONS_DEMO.length, passed = s * 100 >= 80 * tot; if (passed) D.coreDone = { score: s, total: tot, passed_at: new Date().toISOString() }; return { score: s, total: tot, passed }; }
    const r = await sb.rpc('submit_core_quiz', { p_answers: answers });
    return r.error ? { error: r.error } : r.data[0];
  },
  async quiz(lessonId) {
    if (MODE.demo) { const q = D.quizzes[lessonId]; if (!q || !q.questions.length) return null; const best = D.quizAttempts.filter(a => a.lesson_id === lessonId).sort((a, b) => b.score - a.score)[0]; return { questions: q.questions.map(({ correct, ...x }) => x), pass_percent: q.pass_percent, best_score: best?.score, best_total: best?.total, passed: D.quizAttempts.some(a => a.lesson_id === lessonId && a.passed) }; }
    const r = await sb.rpc('get_quiz', { p_lesson: lessonId });
    return (r.data || [])[0] || null;
  },
  async submitQuiz(lessonId, answers) {
    if (MODE.demo) { const q = D.quizzes[lessonId]; const s = q.questions.filter((x, i) => answers[i] === x.correct).length, tot = q.questions.length, passed = s * 100 >= q.pass_percent * tot; D.quizAttempts.push({ lesson_id: lessonId, score: s, total: tot, passed, created_at: new Date().toISOString() }); return { score: s, total: tot, passed }; }
    const r = await sb.rpc('submit_quiz', { p_lesson: lessonId, p_answers: answers });
    return r.error ? { error: r.error } : r.data[0];
  },
  async courseQuizzes(courseId) {
    if (MODE.demo) return Object.keys(D.quizzes).filter(id => (D.lessons[courseId] || []).some(l => l.id === id)).map(id => ({ lesson_id: id, questions: D.quizzes[id].questions.length, passed: D.quizAttempts.some(a => a.lesson_id === id && a.passed) }));
    const r = await sb.rpc('course_quizzes', { p_course: courseId });
    return r.error ? [] : r.data;
  },
  async quizForEdit(lessonId) {
    if (MODE.demo) return D.quizzes[lessonId] || { questions: [], pass_percent: 70 };
    return (await sb.from('lesson_quizzes').select('*').eq('lesson_id', lessonId).maybeSingle()).data || { questions: [], pass_percent: 70 };
  },
  async saveQuiz(lessonId, questions, pass) {
    if (MODE.demo) { D.quizzes[lessonId] = { questions, pass_percent: pass }; return {}; }
    return sb.from('lesson_quizzes').upsert({ lesson_id: lessonId, questions, pass_percent: pass, updated_at: new Date().toISOString() });
  },
  async gradeWork(userId, w, grade, feedback, revise, scores) {
    if (MODE.demo) { const x = D.works.find(z => z.id === w.id); if (x) { x.status = revise ? 'revision_requested' : 'reviewed'; x.rubric_scores = scores; } return {}; }
    const r = await sb.from('lesson_submissions').update({ grade: revise ? null : Number(grade), rubric_scores: revise ? null : scores, educator_feedback: feedback || null, status: revise ? 'revision_requested' : 'reviewed', reviewed_at: new Date().toISOString(), reviewed_by: userId }).eq('id', w.id);
    if (!r.error) await sb.from('user_notifications').insert({ recipient_id: w.student_id, actor_id: userId, type: revise ? 'revision_requested' : 'practice_reviewed', title: revise ? 'Please redo your work' : 'Your work was graded', body: revise ? (feedback || '') : `${grade}/100 ${feedback ? '· ' + feedback : ''}`, link: '#account-learning' });
    return r;
  },
  async transcript(userId) {
    const [learn, core] = await Promise.all([api.learning(userId), api.coreStatus(userId)]);
    let lessons = [], attempts = [];
    if (MODE.demo) { lessons = Object.values(D.lessons).flat(); attempts = D.quizAttempts; }
    else {
      const ids = learn.items.map(i => i.course.id);
      lessons = ids.length ? rows(await sb.from('lessons').select('id,course_id,duration_seconds').in('course_id', ids)) : [];
      attempts = rows(await sb.from('quiz_attempts').select('lesson_id,score,total,passed').eq('student_id', userId));
    }
    const subs = learn.submissions || [];
    const rowsT = learn.items.map(i => {
      const ls = lessons.filter(l => l.course_id === i.course.id), lids = new Set(ls.map(l => l.id));
      const g = subs.filter(s => lids.has(s.lesson_id) && s.grade != null).map(s => s.grade);
      const cert = learn.certificates.find(c => c.course_id === i.course.id);
      const secs = ls.reduce((s, l) => s + (l.duration_seconds || 0), 0);
      return { course: i.course, done: i.done, total: i.total, hours: Math.round(secs / 360) / 10, credits: credits(secs), avg: g.length ? Math.round(g.reduce((a, b) => a + b, 0) / g.length) : null, quizzes: [...new Set(attempts.filter(a => a.passed && lids.has(a.lesson_id)).map(a => a.lesson_id))].length, cert };
    });
    return { rows: rowsT, core, certificates: learn.certificates, graded: subs.filter(s => s.grade >= 80).length };
  }
});

/* ---------- Foundations ---------- */
function FoundationPage({ ctx }) {
  const { t, lang, acct } = ctx;
  const [d] = useAsync(() => api.core(), []);
  const [st, , reload] = useAsync(() => acct ? api.coreStatus(acct.user.id) : null, [acct?.user?.id, ctx.dataKey]);
  const [open, setOpen] = useState(0); const [test, setTest] = useState(false); const [ans, setAns] = useState({}); const [res, setRes] = useState(null);
  async function submit() { if (!acct) return go('account'); const qs = d.questions; const r = await api.submitCore(qs.map((_, i) => ans[i] ?? -1)); if (r?.error) ctx.toast(r.error.message); else { setRes(r); reload(); ctx.bump(); window.scrollTo({ top: 0 }); if (r.passed) celebrate('core'); } }
  if (!d) return html`<div className="section"><div className="skeleton"></div></div>`;
  return html`<div className="path">
    <${Crumbs} items=${[[t.homeCrumb, 'home'], [t.academy, 'academy'], [t.foundation, null]]} />
    <section className="q"><h1>${t.foundation}</h1><p className="muted" style=${{ margin: 0 }}>${t.foundationLead}</p>
      ${st && html`<span className="badge" style=${{ justifySelf: 'start' }}><${Icon} n="check" s=${14} /> ${t.foundationDone} · ${fill(t.scoreOf, { a: st.score, b: st.total })} · ${fmtDate(st.passed_at, lang)}</span>`}
      ${res && html`<div className=${'notice' + (res.passed ? '' : ' err')}>${res.passed ? t.testPassed : t.testFailed} · ${fill(t.scoreOf, { a: res.score, b: res.total })}</div>`}
    </section>
    ${!test ? html`<section className="q">
      <div className="list">${d.modules.map((m, i) => html`<div key=${m.id} className=${'card module' + (open === i ? ' open' : '')}>
        <button className="module-head" onClick=${() => setOpen(open === i ? -1 : i)}><span className="cnum">${i + 1}</span><b>${loc(m.title, lang)}</b><${Icon} n="chevR" s=${16} /></button>
        ${open === i && html`<p>${loc(m.body, lang)}</p>`}
      </div>`)}</div>
      <button className="btn gold" style=${{ justifySelf: 'start' }} onClick=${() => { setTest(true); setRes(null); setAns({}); }}>${t.startTest} · ${d.questions.length}</button>
    </section>` : html`<section className="q">
      <div className="list">${d.questions.map((q, i) => html`<div key=${q.id || i} className="card quiz-q"><b>${i + 1}. ${loc(q.q, lang)}</b>
        <div className="quiz-opts">${q.options.map((o, k) => html`<label key=${k} className=${'quiz-opt' + (ans[i] === k ? ' on' : '')}><input type="radio" name=${'cq' + i} checked=${ans[i] === k} onChange=${() => setAns({ ...ans, [i]: k })} />${loc(o, lang)}</label>`)}</div></div>`)}</div>
      <div className="row"><button className="btn gold" disabled=${Object.keys(ans).length < d.questions.length} onClick=${submit}>${acct ? t.submitTest : t.signInToEnroll}</button><button className="btn" onClick=${() => setTest(false)}>${t.backBtn}</button><span className="muted">${t.passMark}: 80%</span></div>
    </section>`}
  </div>`;
}

/* ---------- Lesson test for students ---------- */
function QuizModal({ ctx, lesson, onClose, onDone }) {
  const { t, lang } = ctx;
  const [q] = useAsync(() => api.quiz(lesson.id), [lesson.id]);
  const [ans, setAns] = useState({}); const [res, setRes] = useState(null);
  async function submit() { const r = await api.submitQuiz(lesson.id, q.questions.map((_, i) => ans[i] ?? -1)); if (r?.error) ctx.toast(r.error.message); else { setRes(r); onDone && onDone(); if (r.passed) celebrate('test'); } }
  return html`<${Modal} title=${t.quiz + ': ' + loc(lesson.title, lang)} onClose=${onClose}>
    ${!q ? html`<div className="skeleton" style=${{ height: '120px' }}></div>` : html`
      ${res && html`<div className=${'notice' + (res.passed ? '' : ' err')}>${res.passed ? t.testPassed : t.testFailed} · ${fill(t.scoreOf, { a: res.score, b: res.total })}</div>`}
      ${q.passed && !res && html`<span className="badge" style=${{ justifySelf: 'start' }}>${t.testPassed}</span>`}
      ${q.questions.map((x, i) => html`<div key=${i} className="quiz-q"><b>${i + 1}. ${loc(x.q, lang)}</b><div className="quiz-opts">${x.options.map((o, k) => html`<label key=${k} className=${'quiz-opt' + (ans[i] === k ? ' on' : '')}><input type="radio" name=${'lq' + i} checked=${ans[i] === k} onChange=${() => setAns({ ...ans, [i]: k })} />${loc(o, lang)}</label>`)}</div></div>`)}
      <div className="row"><button className="btn gold" disabled=${Object.keys(ans).length < q.questions.length} onClick=${submit}>${t.submitTest}</button><span className="muted">${t.passMark}: ${q.pass_percent}%</span></div>`}
  <//>`;
}

/* ---------- Lesson test editor for educators ---------- */
function QuizEditor({ ctx, lesson, onClose }) {
  const { t, lang } = ctx;
  const [d] = useAsync(() => api.quizForEdit(lesson.id), [lesson.id]);
  const [qs, setQs] = useState(null); const [pass, setPass] = useState(70);
  useEffect(() => { if (d) { setQs(d.questions || []); setPass(d.pass_percent || 70); } }, [d]);
  const blank = () => ({ q: { [lang]: '' }, options: [{ [lang]: '' }, { [lang]: '' }, { [lang]: '' }], correct: 0 });
  const upd = (i, f) => setQs(qs.map((x, k) => k === i ? f(x) : x));
  async function save() { const clean = qs.filter(x => loc(x.q, lang).trim() && x.options.filter(o => loc(o, lang).trim()).length >= 2).map(x => ({ ...x, options: x.options.filter(o => loc(o, lang).trim()) })); const r = await api.saveQuiz(lesson.id, clean, Number(pass)); r?.error ? ctx.toast(r.error.message) : (ctx.toast(t.saved), onClose()); }
  return html`<${Modal} title=${t.editQuiz + ': ' + loc(lesson.title, lang)} onClose=${onClose}>
    ${!qs ? html`<div className="skeleton" style=${{ height: '120px' }}></div>` : html`
      ${qs.map((x, i) => html`<div key=${i} className="card quiz-edit">
        <label className="field">${t.question} ${i + 1}<input value=${loc(x.q, lang)} onInput=${e => upd(i, y => ({ ...y, q: { ...y.q, [lang]: e.target.value } }))} /></label>
        ${x.options.map((o, k) => html`<div key=${k} className="opt-row"><input type="radio" name=${'cor' + i} checked=${x.correct === k} onChange=${() => upd(i, y => ({ ...y, correct: k }))} title=${t.correctOpt} /><input className="input" placeholder=${t.option + ' ' + (k + 1)} value=${loc(o, lang)} onInput=${e => upd(i, y => ({ ...y, options: y.options.map((oo, kk) => kk === k ? { ...oo, [lang]: e.target.value } : oo) }))} /></div>`)}
        <div className="row" style=${{ justifyContent: 'space-between' }}><small className="muted">● = ${t.correctOpt}</small><button className="btn sm" onClick=${() => setQs(qs.filter((_, k) => k !== i))}>${t.deleteLesson}</button></div>
      </div>`)}
      <button className="btn" onClick=${() => setQs([...qs, blank()])}><${Icon} n="plus" s=${14} /> ${t.addQuestion}</button>
      <label className="field">${t.passMark}, %<input type="number" min="1" max="100" value=${pass} onInput=${e => setPass(e.target.value)} /></label>
      <button className="btn gold" onClick=${save}>${t.saveQuiz}</button>`}
  <//>`;
}

/* ---------- Rubric grading (educator) ---------- */
function RubricGrader({ ctx, scores, setScores }) {
  const { t } = ctx; const sum = RUBRIC.reduce((s, r) => s + (Number(scores[r.key]) || 0), 0);
  return html`<div className="rubric"><b>${t.rubric}</b>${RUBRIC.map(r => html`<label key=${r.key} className="rub-row"><span>${t['r_' + r.key]}</span><input type="range" min="0" max=${r.max} value=${scores[r.key] ?? 0} onInput=${e => setScores({ ...scores, [r.key]: Number(e.target.value) })} /><b>${scores[r.key] ?? 0}/${r.max}</b></label>`)}<div className="rub-total"><span>${t.total}</span><b className="grade">${sum}<small>/100</small></b></div></div>`;
}
function RubricView({ ctx, scores }) {
  const { t } = ctx; if (!scores) return null;
  return html`<div className="rub-view">${RUBRIC.map(r => html`<span key=${r.key} className="badge plain case">${t['r_' + r.key]} ${scores[r.key] ?? 0}/${r.max}</span>`)}</div>`;
}

/* ---------- Transcript ---------- */
function TranscriptTab({ ctx }) {
  const { t, lang, acct } = ctx;
  const [d] = useAsync(() => api.transcript(acct.user.id), [ctx.dataKey, acct.user.id]);
  if (!d) return html`<div className="section"><div className="skeleton"></div></div>`;
  const lv = levelIndex({ certs: d.certificates.length, ach: 0, graded: d.graded, official: acct.profile?.academy_level || 0 });
  const tot = d.rows.reduce((s, r) => ({ hours: s.hours + r.hours, credits: s.credits + r.credits }), { hours: 0, credits: 0 });
  const no = 'TR-' + String(acct.user.id).replace(/[^a-z0-9]/gi, '').slice(-8).toUpperCase();
  return html`<section className="section"><div className="card transcript">
    <div className="tr-head"><${Crest} s=${48} /><div style=${{ minWidth: 0 }}><span className="eyebrow">${t.transcript}</span><h2>${acct.profile?.display_name || acct.user.email}</h2><span className="muted mono">${no} · ${fmtDate(new Date(), lang)}</span></div></div>
    <p className="muted" style=${{ margin: 0 }}>${t.transcriptLead}</p>
    <div className="tr-meta">
      <div><small>${t.foundation}</small><b>${d.core ? t.foundationDone + ' · ' + fill(t.scoreOf, { a: d.core.score, b: d.core.total }) : t.notYet}</b></div>
      <div><small>${t.yourLevel}</small><b>${t[LEVELS[lv]]} · EQF ${LEVEL_EQF[lv]}</b></div>
    </div>
    <div className="tr-table-wrap"><table className="tr-table"><thead><tr><th>${t.regCourse}</th><th>${t.progress}</th><th>${t.hours}</th><th>${t.credits}</th><th>${t.avg}</th><th>${t.quizzesPassed}</th><th>${t.certification}</th></tr></thead>
      <tbody>${d.rows.map(r => html`<tr key=${r.course.id}><td>${loc(r.course.title, lang)}</td><td>${r.done}/${r.total}</td><td>${r.hours}</td><td>${r.credits}</td><td>${r.avg ?? '—'}</td><td>${r.quizzes}</td><td className="mono">${r.cert ? r.cert.certificate_number : '—'}</td></tr>`)}
      <tr className="tot"><td>${t.totalRow}</td><td></td><td>${Math.round(tot.hours * 10) / 10}</td><td>${tot.credits}</td><td></td><td></td><td>${d.certificates.length}</td></tr></tbody></table></div>
    <small className="muted">${t.creditsNote}. ${t.eqfNote}</small>
  </div></section>`;
}
