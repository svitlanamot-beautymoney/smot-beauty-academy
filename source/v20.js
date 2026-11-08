/* ================= v20: App Store readiness — report & block, account deletion, terms consent, iOS app mode ================= */
/* Inside the iOS app (Capacitor) the page runs from capacitor://localhost:
   e-mail links must open the website, and prices / purchase buttons are hidden
   (digital courses can only be sold in the app through Apple in-app purchase). */
const IOS_APP = !!(window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform());
const SITE_URL = 'https://comforting-mandazi-88fd1b.netlify.app';
const siteBase = () => IOS_APP ? SITE_URL + '/' : location.href.split('#')[0];
if (IOS_APP) document.documentElement.classList.add('ios-app');

const I18N_V20 = {
  en: {
    moreActions: 'More actions', report: 'Report', reportTitle: 'Report content', reportLead: 'Tell us what is wrong. The academy reviews every report within 24 hours and removes content that breaks the rules.',
    reason_spam: 'Spam or advertising', reason_offensive: 'Offensive or hateful', reason_harassment: 'Harassment or bullying', reason_nudity: 'Nudity or sexual content', reason_fake: 'Fake or misleading', reason_other: 'Something else',
    reportDetails: 'Details (optional)', alsoBlock: 'Also block this person — you will no longer see their content', sendReport: 'Send report', reportThanks: 'Thank you. The academy will review it within 24 hours.',
    blockUser: 'Block this person', blocked: 'Blocked. You will no longer see this person’s content.', blockedUsers: 'Blocked people', noBlocked: 'You have not blocked anyone.', unblock: 'Unblock', unblocked: 'Unblocked',
    accountSafety: 'Privacy and account', deleteAccount: 'Delete account', deleteLead: 'Your account and all your data will be deleted for good: profile, courses you teach, progress, certificates, messages, posts and billboards. This cannot be undone.',
    deleteConfirm: 'Type DELETE to confirm', deleteBtn: 'Delete my account forever', deleted: 'Your account has been deleted.',
    reportsTitle: 'Reports to review', noReports: 'No open reports.', removeContent: 'Remove content', dismiss: 'Keep (dismiss)', kind_post: 'Post', kind_billboard: 'Billboard', kind_story: 'Story', kind_model_call: 'Model call', kind_model_reply: 'Model reply', kind_message: 'Message', kind_review: 'Review', kind_question: 'Question', kind_profile: 'Profile',
    agreeTerms: 'I agree to the Terms of use. I will not post offensive or abusive content — the academy removes it and blocks such accounts.', readTerms: 'Read the terms',
    iosSoon: 'Soon in the app', iosSoonLong: 'This course will soon be available in the app.'
  },
  uk: {
    moreActions: 'Інші дії', report: 'Поскаржитися', reportTitle: 'Скарга на вміст', reportLead: 'Розкажи, що не так. Академія перевіряє кожну скаргу протягом 24 годин і видаляє вміст, що порушує правила.',
    reason_spam: 'Спам або реклама', reason_offensive: 'Образливе або мова ворожнечі', reason_harassment: 'Цькування чи переслідування', reason_nudity: 'Оголеність або сексуальний вміст', reason_fake: 'Фейк або оману', reason_other: 'Інше',
    reportDetails: 'Подробиці (необовʼязково)', alsoBlock: 'Також заблокувати цю людину — ти більше не бачитимеш її вміст', sendReport: 'Надіслати скаргу', reportThanks: 'Дякуємо. Академія перевірить протягом 24 годин.',
    blockUser: 'Заблокувати цю людину', blocked: 'Заблоковано. Ти більше не бачитимеш вміст цієї людини.', blockedUsers: 'Заблоковані люди', noBlocked: 'Ти нікого не блокувала.', unblock: 'Розблокувати', unblocked: 'Розблоковано',
    accountSafety: 'Приватність і акаунт', deleteAccount: 'Видалити акаунт', deleteLead: 'Акаунт і всі твої дані буде видалено назавжди: профіль, курси, які ти викладаєш, прогрес, сертифікати, повідомлення, дописи й білборди. Скасувати це неможливо.',
    deleteConfirm: 'Введи DELETE, щоб підтвердити', deleteBtn: 'Видалити мій акаунт назавжди', deleted: 'Акаунт видалено.',
    reportsTitle: 'Скарги на перевірку', noReports: 'Відкритих скарг немає.', removeContent: 'Видалити вміст', dismiss: 'Залишити', kind_post: 'Допис', kind_billboard: 'Білборд', kind_story: 'Історія', kind_model_call: 'Пошук моделі', kind_model_reply: 'Відгук моделі', kind_message: 'Повідомлення', kind_review: 'Відгук', kind_question: 'Питання', kind_profile: 'Профіль',
    agreeTerms: 'Я погоджуюся з Умовами використання. Я не публікуватиму образливий чи агресивний вміст — академія видаляє його і блокує такі акаунти.', readTerms: 'Прочитати умови',
    iosSoon: 'Скоро в застосунку', iosSoonLong: 'Цей курс незабаром буде доступний у застосунку.'
  },
  ru: {
    moreActions: 'Другие действия', report: 'Пожаловаться', reportTitle: 'Жалоба на содержимое', reportLead: 'Расскажи, что не так. Академия проверяет каждую жалобу в течение 24 часов и удаляет то, что нарушает правила.',
    reason_spam: 'Спам или реклама', reason_offensive: 'Оскорбительное или разжигание ненависти', reason_harassment: 'Травля или преследование', reason_nudity: 'Обнажённость или сексуальный контент', reason_fake: 'Фейк или обман', reason_other: 'Другое',
    reportDetails: 'Подробности (необязательно)', alsoBlock: 'Также заблокировать этого человека — ты больше не увидишь его публикации', sendReport: 'Отправить жалобу', reportThanks: 'Спасибо. Академия проверит в течение 24 часов.',
    blockUser: 'Заблокировать этого человека', blocked: 'Заблокировано. Ты больше не увидишь публикации этого человека.', blockedUsers: 'Заблокированные', noBlocked: 'Ты никого не блокировала.', unblock: 'Разблокировать', unblocked: 'Разблокировано',
    accountSafety: 'Приватность и аккаунт', deleteAccount: 'Удалить аккаунт', deleteLead: 'Аккаунт и все твои данные будут удалены навсегда: профиль, курсы, которые ты ведёшь, прогресс, сертификаты, сообщения, посты и билборды. Отменить это нельзя.',
    deleteConfirm: 'Введи DELETE, чтобы подтвердить', deleteBtn: 'Удалить мой аккаунт навсегда', deleted: 'Аккаунт удалён.',
    reportsTitle: 'Жалобы на проверку', noReports: 'Открытых жалоб нет.', removeContent: 'Удалить содержимое', dismiss: 'Оставить', kind_post: 'Пост', kind_billboard: 'Билборд', kind_story: 'История', kind_model_call: 'Поиск модели', kind_model_reply: 'Отклик модели', kind_message: 'Сообщение', kind_review: 'Отзыв', kind_question: 'Вопрос', kind_profile: 'Профиль',
    agreeTerms: 'Я согласна с Условиями использования. Я не буду публиковать оскорбительный или агрессивный контент — академия удаляет его и блокирует такие аккаунты.', readTerms: 'Прочитать условия',
    iosSoon: 'Скоро в приложении', iosSoonLong: 'Этот курс скоро станет доступен в приложении.'
  },
  nl: {
    moreActions: 'Meer acties', report: 'Melden', reportTitle: 'Inhoud melden', reportLead: 'Vertel wat er mis is. De academie bekijkt elke melding binnen 24 uur en verwijdert inhoud die de regels breekt.',
    reason_spam: 'Spam of reclame', reason_offensive: 'Beledigend of haatdragend', reason_harassment: 'Intimidatie of pesten', reason_nudity: 'Naakt of seksuele inhoud', reason_fake: 'Nep of misleidend', reason_other: 'Iets anders',
    reportDetails: 'Details (optioneel)', alsoBlock: 'Deze persoon ook blokkeren — je ziet hun inhoud niet meer', sendReport: 'Melding versturen', reportThanks: 'Bedankt. De academie bekijkt het binnen 24 uur.',
    blockUser: 'Deze persoon blokkeren', blocked: 'Geblokkeerd. Je ziet de inhoud van deze persoon niet meer.', blockedUsers: 'Geblokkeerde mensen', noBlocked: 'Je hebt niemand geblokkeerd.', unblock: 'Deblokkeren', unblocked: 'Gedeblokkeerd',
    accountSafety: 'Privacy en account', deleteAccount: 'Account verwijderen', deleteLead: 'Je account en al je gegevens worden definitief verwijderd: profiel, cursussen die je geeft, voortgang, certificaten, berichten, posts en billboards. Dit kan niet ongedaan worden gemaakt.',
    deleteConfirm: 'Typ DELETE om te bevestigen', deleteBtn: 'Mijn account definitief verwijderen', deleted: 'Je account is verwijderd.',
    agreeTerms: 'Ik ga akkoord met de Gebruiksvoorwaarden. Ik plaats geen beledigende of kwetsende inhoud — de academie verwijdert die en blokkeert zulke accounts.', readTerms: 'Voorwaarden lezen',
    iosSoon: 'Binnenkort in de app', iosSoonLong: 'Deze cursus is binnenkort beschikbaar in de app.'
  }
};
for (const k in I18N) Object.assign(I18N[k], { ...I18N_V20.en, ...(I18N_V20[k] || {}) });

/* Terms: zero tolerance for objectionable content + account deletion */
(function () {
  const rules = {
    en: ['Community rules', 'There is zero tolerance for offensive, hateful, sexual, violent or abusive content and for harassment. Every post, billboard, story and message can be reported; the academy reviews reports within 24 hours, removes such content and blocks the accounts that publish it. You can block any person so you no longer see their content.'],
    uk: ['Правила спільноти', 'Нульова терпимість до образливого, ворожого, сексуального, насильницького чи агресивного вмісту та до цькування. На кожен допис, білборд, історію й повідомлення можна поскаржитися; академія перевіряє скарги протягом 24 годин, видаляє такий вміст і блокує акаунти, що його публікують. Будь-яку людину можна заблокувати, щоб більше не бачити її вміст.'],
    ru: ['Правила сообщества', 'Нулевая терпимость к оскорбительному, враждебному, сексуальному, жестокому или агрессивному контенту и к травле. На каждый пост, билборд, историю и сообщение можно пожаловаться; академия проверяет жалобы в течение 24 часов, удаляет такой контент и блокирует аккаунты, которые его публикуют. Любого человека можно заблокировать, чтобы больше не видеть его публикации.']
  };
  const del = {
    en: ['Deleting your account', 'You can delete your account at any time: Account → Profile → Delete account. Your profile and personal data are deleted at once.'],
    uk: ['Видалення акаунта', 'Акаунт можна видалити будь-коли: Кабінет → Профіль → Видалити акаунт. Профіль і особисті дані видаляються одразу.'],
    ru: ['Удаление аккаунта', 'Аккаунт можно удалить в любой момент: Кабинет → Профиль → Удалить аккаунт. Профиль и личные данные удаляются сразу.']
  };
  try {
    for (const l in LEGAL.terms) {
      const doc = LEGAL.terms[l], r = rules[l] || rules.en, d = del[l] || del.en;
      const i = doc.findIndex(s => /content|вміст|контент|regels|treści|contenut/i.test(s[0]));
      if (i >= 0) doc[i] = r; else doc.push(r);
      doc.push(d);
    }
  } catch (e) {}
})();

Object.assign(P, { flag: 'M5 21V4M5 4h11l-2.5 4L16 12H5' });

/* ---------- Blocks and reports ---------- */
let BLOCKED = new Set();
D.blocks = []; D.reports = [];
Object.assign(api, {
  async loadBlocks(userId) {
    if (MODE.demo) { BLOCKED = new Set(D.blocks.map(b => b.blocked_id)); return; }
    if (!userId) { BLOCKED = new Set(); return; }
    const r = rows(await sb.from('user_blocks').select('blocked_id').eq('blocker_id', userId));
    BLOCKED = new Set(r.map(x => x.blocked_id));
  },
  async myBlocks(userId) {
    if (MODE.demo) return D.blocks;
    const list = rows(await sb.from('user_blocks').select('blocked_id,created_at').eq('blocker_id', userId).order('created_at', { ascending: false }));
    const ids = list.map(b => b.blocked_id);
    const ps = ids.length ? rows(await sb.from('profiles').select('id,display_name').in('id', ids)) : [];
    return list.map(b => ({ ...b, name: ps.find(p => p.id === b.blocked_id)?.display_name }));
  },
  async block(userId, otherId, name) {
    if (!otherId || otherId === userId) return {};
    if (MODE.demo) { if (!D.blocks.find(b => b.blocked_id === otherId)) D.blocks.push({ blocked_id: otherId, name, created_at: new Date().toISOString() }); BLOCKED.add(otherId); return {}; }
    const r = await sb.from('user_blocks').upsert({ blocker_id: userId, blocked_id: otherId }, { onConflict: 'blocker_id,blocked_id', ignoreDuplicates: true });
    if (!r.error) BLOCKED.add(otherId); return r;
  },
  async unblock(userId, otherId) {
    if (MODE.demo) { D.blocks = D.blocks.filter(b => b.blocked_id !== otherId); BLOCKED.delete(otherId); return {}; }
    const r = await sb.from('user_blocks').delete().eq('blocker_id', userId).eq('blocked_id', otherId);
    if (!r.error) BLOCKED.delete(otherId); return r;
  },
  async report(userId, f) {
    if (MODE.demo) { D.reports.unshift({ id: uid(), ...f, status: 'open', created_at: new Date().toISOString() }); return {}; }
    return sb.from('content_reports').insert({ reporter_id: userId, kind: f.kind, item_id: String(f.item_id), owner_id: isUuid(f.owner_id) ? f.owner_id : null, reason: f.reason, details: f.details || null });
  },
  async openReports() {
    if (MODE.demo) return D.reports.filter(r => r.status === 'open');
    return rows(await sb.from('content_reports').select('*').eq('status', 'open').order('created_at', { ascending: false }).limit(100));
  },
  async resolveReport(r, remove) {
    if (MODE.demo) { D.reports.forEach(x => { if (x.kind === r.kind && x.item_id === r.item_id) x.status = remove ? 'removed' : 'dismissed'; }); return {}; }
    return sb.rpc('resolve_report', { p_report: r.id, p_remove: remove });
  },
  async deleteMyAccount() {
    if (MODE.demo) return {};
    const r = await sb.rpc('delete_my_account');
    if (!r.error) { try { await sb.auth.signOut(); } catch (e) {} }
    return r;
  }
});

/* Hide content from blocked people everywhere it is listed */
(function () {
  const keep = (list, key) => Array.isArray(list) ? list.filter(x => !x || !BLOCKED.has(x[key])) : list;
  [['posts', 'author_id'], ['billboards', 'owner_id'], ['stories', 'author_id'], ['modelCalls', 'author_id'], ['modelReplies', 'author_id'], ['messages', 'sender_id'], ['questions', 'author_id']].forEach(([fn, key]) => {
    const f = api[fn]; if (typeof f !== 'function') return;
    api[fn] = async function (...a) { return keep(await f.apply(api, a), key); };
  });
  const course = api.course;
  api.course = async function (...a) { const d = await course.apply(api, a); if (d && Array.isArray(d.reviews)) d.reviews = keep(d.reviews, 'student_id'); return d; };
  const account = api.account;
  api.account = async function (user) { const a = await account.call(api, user); try { await api.loadBlocks(user.id); } catch (e) {} return a; };
})();

/* ---------- "Report / block" button for any user content ---------- */
function Flag({ ctx, kind, id, owner, name }) {
  const { t, acct } = ctx;
  const [open, setOpen] = useState(false);
  if (!id || id === 'cta') return null;
  if (acct && owner && owner === acct.user.id) return null;
  const click = e => { e.stopPropagation(); e.preventDefault(); acct || MODE.demo ? setOpen(true) : needSignIn(ctx); };
  return html`<span className="flag" onClick=${e => e.stopPropagation()}>
    <button type="button" className="flag-btn" aria-label=${t.report} title=${t.report} onClick=${click}><${Icon} n="flag" s=${15} /></button>
    ${open && html`<${ReportModal} ctx=${ctx} kind=${kind} id=${id} owner=${owner} name=${name} onClose=${() => setOpen(false)} />`}
  </span>`;
}
function ReportModal({ ctx, kind, id, owner, name, onClose }) {
  const { t, acct } = ctx;
  const [reason, setReason] = useState('offensive'); const [details, setDetails] = useState(''); const [alsoBlock, setAlsoBlock] = useState(!!owner); const [busy, setBusy] = useState(false);
  const me = acct?.user?.id || 'demo-user';
  async function send(e) {
    e.preventDefault(); setBusy(true);
    const r = await api.report(me, { kind, item_id: id, owner_id: owner, reason, details: details.trim() });
    if (!r?.error && alsoBlock && owner) await api.block(me, owner, name);
    setBusy(false);
    if (r?.error) ctx.toast(r.error.message); else { ctx.toast(alsoBlock && owner ? t.blocked : t.reportThanks); onClose(); ctx.bump(); }
  }
  async function blockOnly() { setBusy(true); const r = await api.block(me, owner, name); setBusy(false); if (r?.error) ctx.toast(r.error.message); else { ctx.toast(t.blocked); onClose(); ctx.bump(); } }
  return html`<${Modal} title=${t.reportTitle} onClose=${onClose}>
    <form className="form" onSubmit=${send} style=${{ display: 'grid', gap: '12px' }}>
      <p className="muted" style=${{ margin: 0 }}>${t.reportLead}</p>
      <div className="report-reasons">${['offensive', 'harassment', 'nudity', 'spam', 'fake', 'other'].map(k => html`<label key=${k} className=${'report-reason' + (reason === k ? ' on' : '')}><input type="radio" name="report-reason" value=${k} checked=${reason === k} onChange=${() => setReason(k)} /> ${t['reason_' + k]}</label>`)}</div>
      <label className="field">${t.reportDetails}<textarea id="report-details" maxLength="1000" value=${details} onInput=${e => setDetails(e.target.value)}></textarea></label>
      ${owner && html`<label className="check"><input id="report-block" type="checkbox" checked=${alsoBlock} onChange=${e => setAlsoBlock(e.target.checked)} /> <span>${t.alsoBlock}</span></label>`}
      <div className="row"><button className="btn gold" disabled=${busy}>${t.sendReport}</button>${owner && html`<button type="button" className="btn" disabled=${busy} onClick=${blockOnly}>${t.blockUser}</button>`}</div>
    </form>
  <//>`;
}

/* ---------- Account: blocked people + delete account ---------- */
function AccountSafety({ ctx }) {
  const { t, lang, acct } = ctx;
  const [list, , reload] = useAsync(() => api.myBlocks(acct.user.id), [acct.user.id, ctx.dataKey]);
  const [ask, setAsk] = useState(false); const [word, setWord] = useState(''); const [busy, setBusy] = useState(false);
  async function unblock(b) { const r = await api.unblock(acct.user.id, b.blocked_id); if (r?.error) ctx.toast(r.error.message); else { ctx.toast(t.unblocked); reload(); ctx.bump(); } }
  async function del() {
    setBusy(true); const r = await api.deleteMyAccount(); setBusy(false);
    if (r?.error) return ctx.toast(r.error.message);
    setAsk(false); ctx.toast(t.deleted); ctx.signOut();
  }
  return html`<section className="section" id="account-safety"><${SectionHead} title=${t.accountSafety} />
    <div className="card" style=${{ display: 'grid', gap: '10px' }}>
      <b>${t.blockedUsers}</b>
      ${(list || []).length ? html`<div className="list">${list.map(b => html`<div key=${b.blocked_id} className="li"><span className="avatar">${initials(b.name || '?')}</span><div className="grow"><b>${b.name || t.member}</b><small>${fmtDate(b.created_at, lang, { day: 'numeric', month: 'short', year: 'numeric' })}</small></div><button className="btn sm" onClick=${() => unblock(b)}>${t.unblock}</button></div>`)}</div>` : html`<small className="muted">${t.noBlocked}</small>`}
    </div>
    <div className="card danger-zone" style=${{ display: 'grid', gap: '10px', marginTop: '12px' }}>
      <b>${t.deleteAccount}</b>
      <small className="muted">${t.deleteLead}</small>
      <button id="delete-account" className="btn danger" style=${{ justifySelf: 'start' }} onClick=${() => { setWord(''); setAsk(true); }}>${t.deleteAccount}</button>
    </div>
    ${ask && html`<${Modal} title=${t.deleteAccount} onClose=${() => setAsk(false)}>
      <p style=${{ margin: 0 }}>${t.deleteLead}</p>
      <label className="field">${t.deleteConfirm}<input id="delete-word" className="input" autoComplete="off" autoCapitalize="characters" value=${word} onInput=${e => setWord(e.target.value)} placeholder="DELETE" /></label>
      <button id="delete-confirm" className="btn danger wide" disabled=${busy || word.trim().toUpperCase() !== 'DELETE'} onClick=${del}>${busy ? t.loading : t.deleteBtn}</button>
    <//>`}
  </section>`;
}

/* ---------- Admin: reports queue ---------- */
function ReportsAdmin({ ctx }) {
  const { t, lang } = ctx;
  const [list, , reload] = useAsync(() => api.openReports(), [ctx.dataKey]);
  async function act(r, remove) { const x = await api.resolveReport(r, remove); if (x?.error) ctx.toast(x.error.message); else { ctx.toast(t.saved); reload(); ctx.bump(); } }
  return html`<section className="section"><${SectionHead} title=${t.reportsTitle + ((list || []).length ? ' · ' + list.length : '')} />
    ${(list || []).length ? html`<div className="list">${list.map(r => html`<div key=${r.id} className="li" style=${{ flexWrap: 'wrap' }}>
      <span style=${{ color: 'var(--bad)' }}><${Icon} n="flag" /></span>
      <div className="grow"><b>${t['kind_' + r.kind] || r.kind} · ${t['reason_' + r.reason] || r.reason}</b><small>${fmtDate(r.created_at, lang, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}${r.details ? ' · ' + r.details : ''}</small></div>
      <div className="row"><button className="btn sm danger" onClick=${() => act(r, true)}>${t.removeContent}</button><button className="btn sm" onClick=${() => act(r, false)}>${t.dismiss}</button></div>
    </div>`)}</div>` : html`<${Empty} text=${t.noReports} />`}
  </section>`;
}

/* ---------- Sign-up: accept terms ---------- */
function AgreeTerms({ t }) {
  return html`<label className="check agree"><input id="auth-agree" type="checkbox" required /> <span>${t.agreeTerms} <button type="button" className="link" onClick=${() => go('legal-terms')}>${t.readTerms}</button></span></label>`;
}
