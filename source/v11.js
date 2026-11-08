/* ================= v12: complete platform — verification, free enrolment, reviews, chat, users, photos, legal ================= */
D.conversations = []; D.messages = [];
D.users = [
  { id: 'u1', email: 'svitlana@example.com', display_name: 'Svitlana Mot', roles: ['admin', 'instructor'], academy_level: 4 },
  { id: 'u2', email: 'student.a@example.com', display_name: 'Student · sample A', roles: ['student'], academy_level: 2 },
  { id: 'u3', email: 'master.b@example.com', display_name: 'Master · sample B', roles: ['instructor'], academy_level: 3 },
  { id: 'u4', email: 'new.user@example.com', display_name: '', roles: [], academy_level: 0 }
];
const pubUrl = (bucket, path) => `${SUPA_URL}/storage/v1/object/public/${bucket}/${path}`;
const extOf = f => (f.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');

Object.assign(api, {
  async verifyCert(num) {
    if (MODE.demo) {
      const all = [{ certificate_number: 'SM-2026-7F3A91C2', student_name: 'Svitlana Mot', course_title: loc(D.courses.find(x => x.id === 'k6').title, 'en'), issued_at: '2026-10-28', lessons: 3, hours: 1 }, ...D.certificates.map(c => ({ ...c, lessons: 3, hours: 1 }))];
      return all.find(c => c.certificate_number.toUpperCase() === String(num).trim().toUpperCase()) || null;
    }
    const r = await sb.rpc('verify_certificate', { p_number: num });
    return (r.data || [])[0] || null;
  },
  async enrollFree(userId, courseId) {
    if (MODE.demo) { if (!D.enrollments.find(e => e.course_id === courseId)) D.enrollments.push({ id: uid(), course_id: courseId }); return {}; }
    return sb.from('enrollments').insert({ student_id: userId, course_id: courseId });
  },
  async addReview(userId, courseId, rating, body) {
    if (MODE.demo) { D.reviews.push({ id: uid(), course_id: courseId, rating, body, author: 'You' }); return {}; }
    return sb.from('reviews').insert({ student_id: userId, course_id: courseId, rating, body: body || null, is_published: true });
  },
  async conversation(courseId, studentId, instructorId) {
    if (MODE.demo) { let c = D.conversations.find(x => x.course_id === courseId && x.student_id === studentId); if (!c) { c = { id: uid(), course_id: courseId, student_id: studentId, instructor_id: instructorId }; D.conversations.push(c); } return c; }
    const ex = (await sb.from('course_conversations').select('*').eq('course_id', courseId).eq('student_id', studentId).maybeSingle()).data;
    if (ex) return ex;
    const r = await sb.from('course_conversations').insert({ course_id: courseId, student_id: studentId, instructor_id: instructorId }).select('*').single();
    return r.data || null;
  },
  async messages(convId) {
    if (MODE.demo) return D.messages.filter(m => m.conversation_id === convId);
    return rows(await sb.from('course_messages').select('*').eq('conversation_id', convId).order('created_at'));
  },
  async sendMessage(conv, userId, body) {
    if (MODE.demo) { D.messages.push({ id: uid(), conversation_id: conv.id, sender_id: userId, body, created_at: new Date().toISOString() }); return {}; }
    const r = await sb.from('course_messages').insert({ conversation_id: conv.id, sender_id: userId, body });
    if (!r.error) { const to = userId === conv.student_id ? conv.instructor_id : conv.student_id; await sb.from('user_notifications').insert({ recipient_id: to, actor_id: userId, type: 'message', title: 'New message', body: body.slice(0, 140), link: '#account-messages' }); }
    return r;
  },
  async myConversations(userId) {
    if (MODE.demo) return D.conversations.map(c => ({ ...c, course: D.courses.find(x => x.id === c.course_id), other: c.student_id === userId ? D.educator.display_name : 'Student' }));
    const list = rows(await sb.from('course_conversations').select('*').or(`student_id.eq.${userId},instructor_id.eq.${userId}`).order('updated_at', { ascending: false }));
    const cids = [...new Set(list.map(c => c.course_id))], pids = [...new Set(list.flatMap(c => [c.student_id, c.instructor_id]))];
    const [cs, ps] = await Promise.all([cids.length ? sb.from('courses').select('id,slug,title').in('id', cids) : { data: [] }, pids.length ? sb.from('profiles').select('id,display_name').in('id', pids) : { data: [] }]);
    return list.map(c => ({ ...c, course: rows(cs).find(x => x.id === c.course_id), other: rows(ps).find(p => p.id === (c.student_id === userId ? c.instructor_id : c.student_id))?.display_name }));
  },
  async markRead(userId) {
    if (MODE.demo) { D.notifications.forEach(n => { n.read_at = n.read_at || new Date().toISOString(); }); return {}; }
    return sb.from('user_notifications').update({ read_at: new Date().toISOString() }).eq('recipient_id', userId).is('read_at', null);
  },
  async adminUsers(q) {
    if (MODE.demo) return D.users.filter(u => !q || (u.email + ' ' + u.display_name).toLowerCase().includes(q.toLowerCase()));
    const r = await sb.rpc('admin_users', { p_query: q || null });
    return r.error ? [] : r.data;
  },
  async setRole(userId, role, on) {
    if (MODE.demo) { const u = D.users.find(x => x.id === userId); if (u) u.roles = on ? [...new Set([...u.roles, role])] : u.roles.filter(r => r !== role); return {}; }
    return on ? sb.from('user_roles').insert({ user_id: userId, role }) : sb.from('user_roles').delete().eq('user_id', userId).eq('role', role);
  },
  async adminEnroll(userId, courseId) {
    if (MODE.demo) return {};
    return sb.from('enrollments').insert({ student_id: userId, course_id: courseId });
  },
  async uploadCover(userId, courseId, file) {
    if (MODE.demo) { const c = D.courses.find(x => x.id === courseId); if (c) c.cover_image_url = URL.createObjectURL(file); return {}; }
    const path = `${userId}/${courseId}-${Date.now()}.${extOf(file)}`;
    const up = await sb.storage.from('course-covers').upload(path, file, { contentType: file.type });
    if (up.error) return up;
    return sb.from('courses').update({ cover_image_url: pubUrl('course-covers', path) }).eq('id', courseId);
  },
  async uploadAvatar(userId, file) {
    if (MODE.demo) return { url: URL.createObjectURL(file) };
    const path = `${userId}/avatar-${Date.now()}.${extOf(file)}`;
    const up = await sb.storage.from('avatars').upload(path, file, { contentType: file.type });
    if (up.error) return up;
    const url = pubUrl('avatars', path);
    const r = await sb.from('profiles').upsert({ id: userId, avatar_url: url, updated_at: new Date().toISOString() });
    return r.error ? r : { url };
  },
  async deleteLesson(courseId, lessonId) {
    if (MODE.demo) { D.lessons[courseId] = (D.lessons[courseId] || []).filter(l => l.id !== lessonId); return {}; }
    return sb.from('lessons').delete().eq('id', lessonId);
  }
});

function Ava({ p, lg }) {
  const name = p?.display_name || p?.email || 'S';
  return html`<span className=${'avatar' + (lg ? ' lg' : '')}>${p?.avatar_url ? html`<img src=${p.avatar_url} alt="" />` : initials(name)}</span>`;
}

function VerifyBox({ ctx }) {
  const { t, lang } = ctx;
  const [num, setNum] = useState(''); const [res, setRes] = useState(undefined); const [busy, setBusy] = useState(false);
  async function check(e) { e.preventDefault(); setBusy(true); setRes(await api.verifyCert(num)); setBusy(false); }
  return html`<section className="section"><div className="card verify">
    <div style=${{ display: 'grid', gap: '6px' }}><span className="eyebrow">${t.certification}</span><h2 style=${{ fontSize: '22px' }}>${t.verifyTitle}</h2><span className="muted">${t.verifyLead}</span></div>
    <form className="verify-form" onSubmit=${check}><input className="input" id="vf-num" required placeholder="SM-2026-XXXXXXXX" value=${num} onInput=${e => setNum(e.target.value)} style=${{ fontFamily: 'var(--mono)', letterSpacing: '1px', textTransform: 'uppercase' }} /><button className="btn gold" disabled=${busy}>${busy ? t.loading : t.verifyBtn}</button></form>
    ${res === null && html`<p className="notice err" style=${{ margin: 0 }}>${t.certNotFound}</p>`}
    ${res && html`<div style=${{ display: 'grid', gap: '10px' }}><span className="badge" style=${{ justifySelf: 'start' }}><${Icon} n="check" s=${14} /> ${t.certValid}</span><${CertCard} ctx=${ctx} c=${res} /><span className="muted">${res.lessons} ${t.lessons} · ${res.hours} ${t.hours}</span></div>`}
  </div></section>`;
}

function ChatModal({ ctx, conv, title, onClose }) {
  const { t, lang, acct } = ctx;
  const [list, , reload] = useAsync(() => conv ? api.messages(conv.id) : [], [conv?.id]);
  const [body, setBody] = useState(''); const end = useRef();
  useEffect(() => { end.current && end.current.scrollIntoView({ block: 'end' }); }, [list]);
  async function send(e) { e.preventDefault(); if (!body.trim()) return; const r = await api.sendMessage(conv, acct.user.id, body.trim()); if (r?.error) ctx.toast(r.error.message); else { setBody(''); reload(); } }
  return html`<${Modal} title=${title} onClose=${onClose}>
    <div className="chat">${(list || []).length ? list.map(m => html`<div key=${m.id} className=${'msg' + (m.sender_id === acct.user.id ? ' me' : '')}><span>${m.body}</span><small>${fmtDate(m.created_at, lang, { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}</small></div>`) : html`<span className="muted">${t.noMessages}</span>`}<i ref=${end}></i></div>
    <form className="chat-form" onSubmit=${send}><input className="input" id="chat-body" maxLength="4000" placeholder=${t.msgPh} value=${body} onInput=${e => setBody(e.target.value)} /><button className="btn gold" disabled=${!body.trim()}>${t.send}</button></form>
  <//>`;
}
function CourseExtras({ ctx, course, enrolled, reviews, reload }) {
  const { t, lang, acct } = ctx;
  const [chat, setChat] = useState(null); const [rating, setRating] = useState(5); const [text, setText] = useState(''); const [sent, setSent] = useState(false);
  if (!acct || !enrolled || acct.user.id === course.instructor_id) return null;
  async function openChat() { const c = await api.conversation(course.id, acct.user.id, course.instructor_id); c ? setChat(c) : ctx.toast(t.error); }
  async function review(e) { e.preventDefault(); const r = await api.addReview(acct.user.id, course.id, rating, text); if (r?.error) ctx.toast(r.error.message); else { setSent(true); ctx.toast(t.reviewSent); reload(); } }
  return html`<section className="section grid two">
    <div className="card" style=${{ display: 'grid', gap: '10px', alignContent: 'start' }}><b style=${{ fontSize: '18px' }}>${t.writeEducator}</b><span className="muted">${t.messages}</span><button className="btn primary" style=${{ justifySelf: 'start' }} onClick=${openChat}><${Icon} n="chat" s=${16} /> ${t.writeEducator}</button></div>
    ${!sent && html`<form className="card form" onSubmit=${review}><b style=${{ fontSize: '18px' }}>${t.writeReview}</b>
      <div className="stars">${[1, 2, 3, 4, 5].map(n => html`<button type="button" key=${n} className=${n <= rating ? 'on' : ''} onClick=${() => setRating(n)} aria-label=${n + ' / 5'}>★</button>`)}</div>
      <textarea id="rv-body" className="input" placeholder=${t.reviewPh} value=${text} onInput=${e => setText(e.target.value)}></textarea>
      <button className="btn gold" style=${{ justifySelf: 'start' }}>${t.sendReview}</button></form>`}
    ${chat && html`<${ChatModal} ctx=${ctx} conv=${chat} title=${loc(course.title, lang)} onClose=${() => setChat(null)} />`}
  </section>`;
}
function MessagesTab({ ctx }) {
  const { t, lang, acct } = ctx;
  const [list] = useAsync(() => api.myConversations(acct.user.id), [ctx.dataKey, acct.user.id]);
  const [open, setOpen] = useState(null);
  return html`<section className="section"><${SectionHead} title=${t.messages} />
    ${(list || []).length ? html`<div className="list">${list.map(c => html`<button key=${c.id} className="li choice-row" onClick=${() => setOpen(c)}><${Icon} n="chat" s=${20} /><div className="grow"><b>${c.other || t.member}</b><small>${loc(c.course?.title, lang)}</small></div><${Icon} n="chevR" s=${16} /></button>`)}</div>` : html`<${Empty} text=${t.noMessages} />`}
    ${open && html`<${ChatModal} ctx=${ctx} conv=${open} title=${(open.other || t.member) + ' · ' + loc(open.course?.title, lang)} onClose=${() => setOpen(null)} />`}
  </section>`;
}
function UsersAdmin({ ctx }) {
  const { t, lang } = ctx;
  const [q, setQ] = useState(''); const [list, setList] = useState(null); const [enr, setEnr] = useState({});
  const [courses] = useAsync(() => api.courses(), [ctx.dataKey]);
  const load = async () => setList(await api.adminUsers(q));
  useEffect(() => { load(); }, []);
  async function toggle(u, role) { const on = !u.roles.includes(role); const r = await api.setRole(u.id, role, on); if (r?.error) ctx.toast(r.error.message); else { ctx.toast(t.saved); load(); } }
  async function enroll(u) { if (!enr[u.id]) return; const r = await api.adminEnroll(u.id, enr[u.id]); r?.error ? ctx.toast(r.error.message) : ctx.toast(t.enrollDone); }
  return html`<section className="section"><${SectionHead} title=${t.users} />
    <form className="verify-form" onSubmit=${e => { e.preventDefault(); load(); }}><input className="input" id="us-q" placeholder=${t.searchUsers} value=${q} onInput=${e => setQ(e.target.value)} /><button className="btn">${t.searchPh.split(' ')[0]}</button></form>
    <div className="list">${(list || []).map(u => html`<div key=${u.id} className="card user-row">
      <div className="post-head"><${Ava} p=${u} /><div style=${{ minWidth: 0 }}><b>${u.display_name || '—'}</b><small>${u.email}</small></div></div>
      <div className="chips"><span className="muted" style=${{ fontSize: '12.5px' }}>${t.roles}:</span>${['student', 'instructor', 'commission', 'admin'].map(r => html`<button key=${r} className=${'role-chip' + (u.roles.includes(r) ? ' on' : '')} onClick=${() => toggle(u, r)}>${t['role_' + r]}</button>`)}</div>
      <div className="verify-form"><select className="input" id=${'en-' + u.id} value=${enr[u.id] || ''} onChange=${e => setEnr({ ...enr, [u.id]: e.target.value })}><option value="">${t.enrollStudent}…</option>${(courses || []).map(c => html`<option key=${c.id} value=${c.id}>${loc(c.title, lang)}</option>`)}</select><button className="btn sm gold" disabled=${!enr[u.id]} onClick=${() => enroll(u)}>${t.enroll}</button></div>
    </div>`)}</div>
  </section>`;
}
function CoverUpload({ ctx, course, onDone }) {
  const { t, acct } = ctx;
  async function pick(e) { const f = e.target.files[0]; if (!f) return; const r = await api.uploadCover(acct.user.id, course.id, f); if (r?.error) ctx.toast(r.error.message); else { ctx.toast(t.coverSaved); onDone && onDone(); ctx.bump(); } }
  return html`<label className="drop small"><input type="file" id="cv-file" accept="image/jpeg,image/png,image/webp" onChange=${pick} />${course.cover_image_url ? html`<img src=${course.cover_image_url} alt="" className="cv-prev" />` : html`<span className="ic"><${Icon} n="image" s=${24} /></span>`}<b>${t.cover}</b></label>`;
}
function AvatarUpload({ ctx }) {
  const { t, acct } = ctx;
  async function pick(e) { const f = e.target.files[0]; if (!f) return; const r = await api.uploadAvatar(acct.user.id, f); if (r?.error) ctx.toast(r.error.message); else { ctx.toast(t.avatarSaved); ctx.refreshAccount({ ...(acct.profile || {}), avatar_url: r.url }); } }
  return html`<label className="ava-up"><input type="file" id="av-file" accept="image/jpeg,image/png,image/webp" onChange=${pick} /><${Ava} p=${acct.profile || { display_name: acct.user.email }} lg /><span className="btn sm"><${Icon} n="upload" s=${14} /> ${t.avatar}</span></label>`;
}
function DeleteLesson({ ctx, course, lesson, onDone }) {
  const { t } = ctx; const [arm, setArm] = useState(false);
  async function del() { if (!arm) { setArm(true); setTimeout(() => setArm(false), 3000); return; } const r = await api.deleteLesson(course, lesson.id); r?.error ? ctx.toast(r.error.message) : (ctx.toast(t.deleted), onDone()); }
  return html`<button className=${'btn sm' + (arm ? ' danger' : '')} onClick=${del}>${arm ? t.confirmDelete : t.deleteLesson}</button>`;
}

/* ---------- Legal drafts (to be checked by a lawyer) ---------- */
const LEGAL = {
  terms: {
    en: [['Who we are', 'S.MOT Global Beauty Academy is an online education platform operated from the Netherlands. Contact: the academy e-mail shown on the site.'], ['Accounts', 'You must give correct details and keep your password safe. One person, one account. We may suspend accounts that break these terms.'], ['Courses and lessons', 'Educators publish their own courses after review by the academy. You get personal, non-transferable access to the courses you are enrolled in. Downloading, recording or sharing paid lessons is not allowed.'], ['Educators', 'Educators confirm they own the rights to their videos and materials and give S.MOT a licence to show, translate and subtitle them on the platform. Educators are responsible for the accuracy and safety of their teaching.'], ['Certificates and levels', 'S.MOT certificates and levels are issued by the academy. They are not state diplomas unless a programme is explicitly marked as state-accredited.'], ['Payments and refunds', 'Prices are shown in euros. Payment and refund rules will be added when online payment is launched, in line with EU consumer law (including the 14-day withdrawal right where it applies).'], ['Content rules', 'No illegal, offensive or misleading content. Billboards, posts and messages may be moderated or removed.'], ['Liability', 'We do our best to keep the platform available and correct, but we are not liable for indirect damage. Nothing here limits rights you have under mandatory law.'], ['Law', 'Dutch law applies. Disputes go to the competent court in the Netherlands, unless consumer law gives you another option.']],
    uk: [['Хто ми', 'S.MOT Global Beauty Academy — онлайн-платформа навчання, що працює з Нідерландів. Контакт: пошта академії, вказана на сайті.'], ['Акаунти', 'Вказуйте правдиві дані й бережіть пароль. Одна людина — один акаунт. Ми можемо призупинити акаунт, що порушує ці умови.'], ['Курси та уроки', 'Викладачі публікують власні курси після перевірки академією. Ви отримуєте особистий доступ без права передачі до курсів, на які записані. Завантажувати, записувати чи поширювати платні уроки заборонено.'], ['Викладачі', 'Викладач підтверджує, що має права на свої відео й матеріали, і надає S.MOT ліцензію показувати, перекладати й додавати до них субтитри на платформі. Викладач відповідає за точність і безпечність свого навчання.'], ['Сертифікати та рівні', 'Сертифікати й рівні S.MOT видає академія. Це не державні дипломи, якщо програму прямо не позначено як акредитовану державою.'], ['Оплата й повернення', 'Ціни вказано в євро. Правила оплати й повернення буде додано під час запуску онлайн-оплати відповідно до права ЄС про захист споживачів (зокрема 14 днів на відмову, де це застосовно).'], ['Правила контенту', 'Заборонено незаконний, образливий чи оманливий контент. Білборди, дописи й повідомлення можуть модеруватися або видалятися.'], ['Відповідальність', 'Ми робимо все, щоб платформа працювала й була точною, але не відповідаємо за непрямі збитки. Ніщо тут не обмежує ваших прав за обов’язковим законом.'], ['Право', 'Застосовується право Нідерландів. Спори розглядає компетентний суд у Нідерландах, якщо закон про захист споживачів не дає іншого варіанту.']],
    ru: [['Кто мы', 'S.MOT Global Beauty Academy — онлайн-платформа обучения, работающая из Нидерландов. Контакт: почта академии, указанная на сайте.'], ['Аккаунты', 'Указывайте достоверные данные и берегите пароль. Один человек — один аккаунт. Мы можем приостановить аккаунт, нарушающий эти условия.'], ['Курсы и уроки', 'Преподаватели публикуют собственные курсы после проверки академией. Вы получаете личный доступ без права передачи к курсам, на которые записаны. Скачивать, записывать или распространять платные уроки запрещено.'], ['Преподаватели', 'Преподаватель подтверждает, что владеет правами на свои видео и материалы, и предоставляет S.MOT лицензию показывать, переводить и снабжать их субтитрами на платформе. Преподаватель отвечает за точность и безопасность своего обучения.'], ['Сертификаты и уровни', 'Сертификаты и уровни S.MOT выдаёт академия. Это не государственные дипломы, если программа прямо не отмечена как аккредитованная государством.'], ['Оплата и возврат', 'Цены указаны в евро. Правила оплаты и возврата будут добавлены при запуске онлайн-оплаты в соответствии с правом ЕС о защите потребителей (включая 14 дней на отказ, где это применимо).'], ['Правила контента', 'Запрещён незаконный, оскорбительный или вводящий в заблуждение контент. Билборды, публикации и сообщения могут модерироваться или удаляться.'], ['Ответственность', 'Мы делаем всё, чтобы платформа работала и была точной, но не отвечаем за косвенный ущерб. Ничто здесь не ограничивает ваши права по обязательному закону.'], ['Право', 'Применяется право Нидерландов. Споры рассматривает компетентный суд в Нидерландах, если закон о защите потребителей не даёт другого варианта.']]
  },
  privacy: {
    en: [['Controller', 'The operator of S.MOT Global Beauty Academy (Netherlands) is responsible for your personal data under the GDPR.'], ['What we collect', 'Account data (e-mail, name), profile data you choose to add (photo, title, country, city, specialities, diplomas), learning data (enrolments, progress, practical works, grades, certificates), messages, and technical logs.'], ['Why', 'To provide the courses, grading and certificates (contract), to keep the platform secure (legitimate interest), and to show your profile or rating publicly or to employers only when you switch this on (consent).'], ['Who sees it', 'Your educators see the works you send them. Employers see you only if you tick “open to job offers” and your profile is public. Service providers: Supabase (database and storage, EU region where available) and, once enabled, translation and payment providers.'], ['How long', 'As long as your account exists, and certificates for as long as needed to verify them. You can ask us to delete your account.'], ['Your rights', 'Access, correction, deletion, restriction, objection, data portability and withdrawing consent. You can also complain to the Dutch Data Protection Authority (Autoriteit Persoonsgegevens).']],
    uk: [['Відповідальна особа', 'Оператор S.MOT Global Beauty Academy (Нідерланди) відповідає за ваші персональні дані згідно з GDPR.'], ['Що ми збираємо', 'Дані акаунта (пошта, ім’я), дані профілю, які ви додаєте самі (фото, звання, країна, місто, спеціалізації, дипломи), навчальні дані (записи на курси, прогрес, практичні роботи, оцінки, сертифікати), повідомлення й технічні журнали.'], ['Навіщо', 'Щоб надавати курси, оцінювання й сертифікати (договір), захищати платформу (законний інтерес) і показувати ваш профіль чи рейтинг публічно або роботодавцям лише тоді, коли ви це ввімкнете (згода).'], ['Хто бачить', 'Ваші викладачі бачать роботи, які ви їм надсилаєте. Роботодавці бачать вас лише якщо ви позначили «відкрита до пропозицій» і профіль публічний. Постачальники послуг: Supabase (база й сховище, регіон ЄС, де можливо), а після підключення — сервіси перекладу й оплати.'], ['Як довго', 'Поки існує ваш акаунт, а сертифікати — стільки, скільки потрібно для їх перевірки. Ви можете попросити видалити акаунт.'], ['Ваші права', 'Доступ, виправлення, видалення, обмеження, заперечення, перенесення даних і відкликання згоди. Також можна поскаржитися до нідерландського органу захисту даних (Autoriteit Persoonsgegevens).']],
    ru: [['Ответственное лицо', 'Оператор S.MOT Global Beauty Academy (Нидерланды) отвечает за ваши персональные данные согласно GDPR.'], ['Что мы собираем', 'Данные аккаунта (почта, имя), данные профиля, которые вы добавляете сами (фото, звание, страна, город, специализации, дипломы), учебные данные (записи на курсы, прогресс, практические работы, оценки, сертификаты), сообщения и технические журналы.'], ['Зачем', 'Чтобы предоставлять курсы, оценивание и сертификаты (договор), защищать платформу (законный интерес) и показывать ваш профиль или рейтинг публично или работодателям только когда вы это включите (согласие).'], ['Кто видит', 'Ваши преподаватели видят работы, которые вы им отправляете. Работодатели видят вас, только если вы отметили «открыта к предложениям» и профиль публичный. Поставщики услуг: Supabase (база и хранилище, регион ЕС, где возможно), а после подключения — сервисы перевода и оплаты.'], ['Как долго', 'Пока существует ваш аккаунт, а сертификаты — столько, сколько нужно для их проверки. Вы можете попросить удалить аккаунт.'], ['Ваши права', 'Доступ, исправление, удаление, ограничение, возражение, перенос данных и отзыв согласия. Также можно пожаловаться в нидерландский орган по защите данных (Autoriteit Persoonsgegevens).']]
  },
  cookies: {
    en: [['What we store', 'Only what is needed: your sign-in session and your chosen language, kept in your browser’s local storage. No advertising or tracking cookies.'], ['Changes', 'If we ever add analytics, we will ask for your consent first.']],
    uk: [['Що ми зберігаємо', 'Лише необхідне: сесію входу та обрану мову в локальному сховищі браузера. Жодних рекламних чи відстежувальних cookie.'], ['Зміни', 'Якщо ми колись додамо аналітику, спочатку попросимо вашу згоду.']],
    ru: [['Что мы храним', 'Только необходимое: сессию входа и выбранный язык в локальном хранилище браузера. Никаких рекламных или отслеживающих cookie.'], ['Изменения', 'Если мы когда-нибудь добавим аналитику, сначала попросим ваше согласие.']]
  }
};
function LegalPage({ ctx, kind }) {
  const { t, lang } = ctx;
  const k = ['terms', 'privacy', 'cookies'].includes(kind) ? kind : 'terms';
  const doc = LEGAL[k][lang] || LEGAL[k].en;
  return html`<div className="path">
    <${Crumbs} items=${[[t.homeCrumb, 'home'], [t.legal, null], [t[k], null]]} />
    <div className="pills">${['terms', 'privacy', 'cookies'].map(x => html`<button key=${x} className=${'pill' + (x === k ? ' on' : '')} onClick=${() => go('legal-' + x)}>${t[x]}</button>`)}</div>
    <section className="q"><h1>${t[k]}</h1><p className="notice" style=${{ margin: 0 }}>${t.legalDraft}</p>
      <div className="legal">${doc.map(([h, p], i) => html`<div key=${i}><h3>${i + 1}. ${h}</h3><p>${p}</p></div>`)}</div></section>
  </div>`;
}
