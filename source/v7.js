/* ================= v7: ladder of masters, student rating, study plan, certification commission ================= */
D.educator.academy_level = 4;
D.hall = [
  { id: 'h1', display_name: 'Grand Master · sample', professional_title: 'Colour & cutting', country: 'United Kingdom', academy_level: 5, sample: true },
  { id: 'h2', display_name: 'Grand Master · sample', professional_title: 'Bridal & editorial', country: 'Italy', academy_level: 5, sample: true },
  { ...D.educator, sample: false },
  { id: 'h4', display_name: 'International Master · sample', professional_title: 'Lashes & brows', country: 'Poland', academy_level: 4, sample: true },
  { id: 'h5', display_name: 'Senior Artist · sample', professional_title: 'Nail aesthetics', country: 'Netherlands', academy_level: 3, sample: true },
  { id: 'h6', display_name: 'Senior Artist · sample', professional_title: 'Permanent makeup', country: 'Ukraine', academy_level: 3, sample: true },
  { id: 'h7', display_name: 'Professional · sample', professional_title: 'Barber', country: 'Netherlands', academy_level: 2, sample: true },
  { id: 'h8', display_name: 'Professional · sample', professional_title: 'Makeup', country: 'Germany', academy_level: 2, sample: true },
  { id: 'h9', display_name: 'Junior · sample', professional_title: 'Hair colour', country: 'Netherlands', academy_level: 1, sample: true },
  { id: 'h10', display_name: 'Junior · sample', professional_title: 'Manicure', country: 'Belgium', academy_level: 1, sample: true },
  { id: 'h11', display_name: 'Student · sample', professional_title: '', country: 'Netherlands', academy_level: 0, sample: true },
  { id: 'h12', display_name: 'Student · sample', professional_title: '', country: 'Ukraine', academy_level: 0, sample: true },
  { id: 'h13', display_name: 'Student · sample', professional_title: '', country: 'Poland', academy_level: 0, sample: true }
];
D.talents.forEach((x, i) => { x.academy_level = [2, 2, 1, 1][i] ?? 1; });
D.plans = []; D.levelReqs = [{ id: 'lr1', applicant_name: 'Senior Artist · sample', current_level: 3, requested_level: 4, message: 'Finalist of two international championships, 9 years teaching.', evidence_url: 'https://example.com', status: 'pending', created_at: daysFromNow(-1) }];
D.myLevelReqs = [];

Object.assign(api, {
  async hall() {
    if (MODE.demo) return D.hall;
    return rows(await sb.from('profiles').select('id,display_name,professional_title,country,city,expertise,academy_level,portfolio_url,bio').or('public_directory_opt_in.eq.true,public_profile_opt_in.eq.true').order('academy_level', { ascending: false }).limit(200));
  },
  async rating(catId) {
    if (MODE.demo) return [...D.talents].sort((a, b) => b.avg_grade - a.avg_grade);
    const r = await sb.rpc('student_rating', { p_category: catId || null });
    return r.error ? [] : r.data;
  },
  async plan(userId) {
    if (MODE.demo) return D.plans[0] || null;
    return (await sb.from('learning_plans').select('*').eq('student_id', userId).order('updated_at', { ascending: false }).limit(1).maybeSingle()).data;
  },
  async savePlan(userId, p) {
    if (MODE.demo) { D.plans = [{ ...p, id: p.id || uid() }]; return {}; }
    const row = { student_id: userId, title: p.title || 'My study plan', months: p.months, course_ids: p.course_ids, updated_at: new Date().toISOString() };
    return p.id ? sb.from('learning_plans').update(row).eq('id', p.id) : sb.from('learning_plans').insert(row);
  },
  async myLevelRequests(userId) {
    if (MODE.demo) return D.myLevelReqs;
    return rows(await sb.from('level_reviews').select('*').eq('user_id', userId).order('created_at', { ascending: false }));
  },
  async requestLevel(acct, f, current) {
    const row = { applicant_name: acct.profile?.display_name || acct.user.email, current_level: current, requested_level: Number(f.level), message: f.message || null, evidence_url: f.evidence || null, status: 'pending' };
    if (MODE.demo) { const x = { id: uid(), ...row, created_at: new Date().toISOString() }; D.myLevelReqs.unshift(x); D.levelReqs.push(x); return {}; }
    return sb.from('level_reviews').insert({ ...row, user_id: acct.user.id });
  },
  async commissionQueue() {
    if (MODE.demo) return D.levelReqs.filter(r => r.status === 'pending');
    return rows(await sb.from('level_reviews').select('*').eq('status', 'pending').order('created_at'));
  },
  async decideLevel(userId, r, ok, note) {
    if (MODE.demo) { r.status = ok ? 'approved' : 'rejected'; r.decision_note = note; return {}; }
    return sb.from('level_reviews').update({ status: ok ? 'approved' : 'rejected', decision_note: note || null, decided_by: userId, decided_at: new Date().toISOString() }).eq('id', r.id);
  }
});

function MastersLadder({ ctx, compact, tiers: only }) {
  const { t } = ctx;
  const [list] = useAsync(() => api.hall(), [ctx.dataKey]);
  const [view, setView] = useState(null);
  const tiers = only || [5, 4, 3, 2, 1, 0];
  return html`<div className=${'ladder-hall' + (compact ? ' compact' : '')}>
    ${tiers.map(lv => {
      const people = (list || []).filter(p => (p.academy_level || 0) === lv);
      const shown = people.slice(0, compact ? 5 : 12);
      return html`<div key=${lv} className=${'tier t' + lv} style=${{ '--w': (58 + (5 - lv) * 8.4) + '%' }}>
        <div className="tier-head"><span className="tier-num">${lv + 1}</span><b>${t[LEVELS[lv]]}</b><small>${people.length}</small></div>
        <div className="tier-people">${shown.length ? shown.map(p => html`<button key=${p.id} className="person" title=${p.display_name} onClick=${() => p.academy_level >= 1 && !p.sample ? go('master-' + p.id) : setView(p)}><${Ava} p=${p} />${!compact && html`<span className="pname">${p.display_name}</span>`}</button>`) : html`<span className="muted" style=${{ fontSize: '13px' }}>${t.nobodyYet}</span>`}${people.length > shown.length && html`<span className="more">+${people.length - shown.length}</span>`}</div>
      </div>`; })}
    ${view && html`<${Modal} title=${view.display_name} onClose=${() => setView(null)}>
      <div className="post-head"><span className="avatar lg">${initials(view.display_name)}</span><div><b>${t[LEVELS[view.academy_level || 0]]}</b><small>${[view.professional_title, view.country].filter(Boolean).join(' · ')}</small></div></div>
      ${view.bio && html`<p style=${{ margin: 0 }}>${view.bio}</p>`}
      ${view.academy_level >= 3 && html`<span className="badge gold case" style=${{ justifySelf: 'start' }}><${Icon} n="shield" s=${14} /> ${t.officialLevel}</span>`}
      ${view.sample && html`<span className="badge plain case" style=${{ justifySelf: 'start' }}>${t.sample}</span>`}
    <//>`}
  </div>`;
}
function RatingTable({ ctx }) {
  const { t, lang, cats } = ctx;
  const [cat, setCat] = useState('');
  const [list] = useAsync(() => api.rating(cat), [ctx.dataKey, cat]);
  return html`<div className="card" style=${{ display: 'grid', gap: '12px' }}>
    <div className="section-head"><div><h2 style=${{ fontSize: '20px' }}>${t.rating}</h2><small className="muted">${t.ratingLead}</small></div>
      <select className="langsel" id="rt-cat" value=${cat} onChange=${e => setCat(e.target.value)} aria-label=${t.bbDirection}><option value="">${t.allDirections}</option>${cats.map(c => html`<option key=${c.id} value=${c.id}>${loc(c.name, lang)}</option>`)}</select></div>
    ${(list || []).length ? html`<div className="rank">${list.map((s, i) => html`<div key=${s.id} className=${'rank-row' + (i < 3 ? ' top' + (i + 1) : '')}>
      <span className="rank-n">${i + 1}</span><span className="avatar">${initials(s.display_name)}</span>
      <div className="grow"><b>${s.display_name}</b><small>${[t[LEVELS[s.academy_level || 0]], s.city, s.country].filter(Boolean).join(' · ')}</small></div>
      <span className="grade">${s.avg_grade}<small>/100</small></span>
    </div>`)}</div>` : html`<${Empty} text=${t.noRating} />`}
  </div>`;
}
function CommissionCard({ ctx }) {
  const { t } = ctx;
  return html`<div className="card commission"><${Crest} s=${44} /><div style=${{ display: 'grid', gap: '6px', minWidth: 0 }}><span className="eyebrow">${t.commission}</span><b style=${{ fontSize: '18px' }}>${t.commissionTitle}</b><p style=${{ margin: 0, color: '#d4cec5' }}>${t.commissionText}</p></div></div>`;
}
function MastersPage({ ctx }) {
  const { t } = ctx;
  return html`<div>
    <section className="section square-head"><${Crest} s=${56} /><h1 style=${{ fontSize: 'clamp(36px,6vw,64px)' }}>${t.hallTitle}</h1><p>${t.hallLead}</p></section>
    <section className="section"><${MastersLadder} ctx=${ctx} /></section>
    <section className="section"><${CommissionCard} ctx=${ctx} /></section>
    <section className="section"><${RatingTable} ctx=${ctx} /></section>
  </div>`;
}
function HomeLadder({ ctx }) {
  const { t } = ctx;
  return html`<section className="section"><div className="section-head"><div><span className="eyebrow">${t.levelsTitle}</span><h2 style=${{ fontSize: '24px', marginTop: '4px' }}>${t.hallTitle}</h2></div><button className="link" onClick=${() => go('masters')}>${t.viewAll} <${Icon} n="arrow" s=${16} /></button></div>
    <p className="muted" style=${{ margin: 0 }}>${t.hallLead}</p>
    <${MastersLadder} ctx=${ctx} compact />
  </section>`;
}

function PlanBuilder({ ctx }) {
  const { t, lang, acct, cats } = ctx;
  const [courses] = useAsync(() => api.courses(), [ctx.dataKey]);
  const [saved] = useAsync(() => acct ? api.plan(acct.user.id) : null, [ctx.dataKey, acct?.user?.id]);
  const [p, setP] = useState({ months: 6, course_ids: [], title: '' });
  const [cat, setCat] = useState(''); const [max, setMax] = useState('');
  useEffect(() => { if (saved) setP({ id: saved.id, months: saved.months, course_ids: saved.course_ids || [], title: saved.title || '' }); }, [saved]);
  const all = courses || [];
  const list = all.filter(c => (!cat || c.category_id === cat) && (!max || c.price_cents <= Number(max) * 100));
  const chosen = p.course_ids.map(id => all.find(c => c.id === id)).filter(Boolean);
  const total = chosen.reduce((s, c) => s + (c.price_cents || 0), 0);
  const toggle = id => setP({ ...p, course_ids: p.course_ids.includes(id) ? p.course_ids.filter(x => x !== id) : [...p.course_ids, id] });
  const months = p.months || 0;
  const sched = months ? Array.from({ length: months }, (_, m) => chosen.filter((_, i) => Math.floor(i * months / Math.max(chosen.length, 1)) === m)) : [];
  async function save() { if (!acct) return needSignIn(ctx); const r = await api.savePlan(acct.user.id, p); r?.error ? ctx.toast(r.error.message) : ctx.toast(t.planSaved); }
  const who = c => c.instructor ? c.instructor.display_name : (c.instructor_id === D.educator.id ? D.educator.display_name : '');
  return html`<div>
    <section className="section"><h2 style=${{ fontSize: '24px' }}>${t.plan}</h2><p className="muted" style=${{ margin: 0, maxWidth: '64ch' }}>${t.planLead}</p></section>
    <section className="section"><div className="pills">${[0, 3, 6, 12].map(m => html`<button key=${m} className=${'pill' + (p.months === m ? ' on' : '')} onClick=${() => setP({ ...p, months: m })}>${t['fmt' + m]}</button>`)}</div></section>
    <section className="section plan-grid">
      <div style=${{ display: 'grid', gap: '12px', minWidth: 0 }}>
        <div className="form"><div className="two">
          <label className="field">${t.bbDirection}<select id="pl-cat" value=${cat} onChange=${e => setCat(e.target.value)}><option value="">${t.allDirections}</option>${cats.map(c => html`<option key=${c.id} value=${c.id}>${loc(c.name, lang)}</option>`)}</select></label>
          <label className="field">${t.maxPrice}<input id="pl-max" type="number" min="0" inputMode="numeric" value=${max} onInput=${e => setMax(e.target.value)} /></label>
        </div></div>
        <b>${t.planPick}</b>
        <div className="list">${list.map(c => { const on = p.course_ids.includes(c.id); const cc = cats.find(x => x.id === c.category_id); return html`<label key=${c.id} className=${'li pick' + (on ? ' on' : '')}>
          <input type="checkbox" checked=${on} onChange=${() => toggle(c.id)} />
          <div className="grow"><b>${loc(c.title, lang)}</b><small>${[who(c), cc && loc(cc.name, lang), c.lesson_count != null ? c.lesson_count + ' ' + t.lessons : ''].filter(Boolean).join(' · ')}</small></div>
          <span className="price">${fmtPrice(c.price_cents, lang, t)}</span>
        </label>`; })}</div>
      </div>
      <aside className="card plan-sum">
        <label className="field">${t.planTitleF}<input id="pl-title" value=${p.title} placeholder=${t.plan} onInput=${e => setP({ ...p, title: e.target.value })} /></label>
        <div className="row" style=${{ justifyContent: 'space-between' }}><span className="muted">${t.planTotal}</span><span className="price" style=${{ fontSize: '26px' }}>${fmtPrice(total, lang, t)}</span></div>
        ${months > 0 && total > 0 && html`<div className="row" style=${{ justifyContent: 'space-between' }}><span className="muted">${t.perMonth}</span><b>${fmtPrice(Math.round(total / months), lang, t)}</b></div>`}
        ${!chosen.length ? html`<span className="muted">${t.planEmpty}</span>` : months ? html`<div className="months">${sched.map((cs, m) => html`<div key=${m} className=${'month' + (cs.length ? ' has' : '')}><small>${t.planMonth} ${m + 1}</small>${cs.map(c => html`<span key=${c.id}>${loc(c.title, lang)}</span>`)}</div>`)}</div>`
          : html`<div className="list">${chosen.map(c => html`<div key=${c.id} className="li"><div className="grow"><b>${loc(c.title, lang)}</b></div></div>`)}</div>`}
        <button className="btn gold" onClick=${save}>${t.savePlan}</button>
      </aside>
    </section>
  </div>`;
}

function LevelRequest({ ctx, current }) {
  const { t, lang, acct } = ctx;
  const [list, , reload] = useAsync(() => acct ? api.myLevelRequests(acct.user.id) : [], [ctx.dataKey, acct?.user?.id]);
  const [f, setF] = useState({ level: String(Math.min(current + 1, 5)) }); const [busy, setBusy] = useState(false);
  if (!acct) return null;
  async function send(e) { e.preventDefault(); setBusy(true); const r = await api.requestLevel(acct, f, current); setBusy(false); if (r?.error) ctx.toast(r.error.message); else { ctx.toast(t.reqSent); setF({ level: f.level }); reload(); } }
  return html`<section className="section grid two">
    <div className="card"><form className="form" onSubmit=${send}>
      <h2 style=${{ fontSize: '20px' }}>${t.requestLevel}</h2>
      <label className="field">${t.requestedLevel}<select id="lr-level" value=${f.level} onChange=${e => setF({ ...f, level: e.target.value })}>${[1, 2, 3, 4, 5].filter(l => l > current).map(l => html`<option key=${l} value=${l}>${l + 1}. ${t[LEVELS[l]]}</option>`)}</select></label>
      <label className="field">${t.reqMsg}<textarea id="lr-msg" required value=${f.message || ''} onInput=${e => setF({ ...f, message: e.target.value })}></textarea></label>
      <label className="field">${t.evidence}<input id="lr-url" type="url" placeholder="https://" value=${f.evidence || ''} onInput=${e => setF({ ...f, evidence: e.target.value })} /></label>
      <button className="btn gold" disabled=${busy || current >= 5}>${busy ? t.loading : t.sendForApproval}</button>
    </form></div>
    <div style=${{ display: 'grid', gap: '10px', alignContent: 'start' }}>
      <${CommissionCard} ctx=${ctx} />
      ${(list || []).length > 0 && html`<b>${t.myRequests}</b><div className="list">${list.map(r => html`<div key=${r.id} className="li" style=${{ flexWrap: 'wrap' }}><div className="grow"><b>${t[LEVELS[r.requested_level]]}</b><small>${fmtDate(r.created_at, lang)}${r.decision_note ? ' · ' + r.decision_note : ''}</small></div><${StatusBadge} s=${r.status} t=${t} /></div>`)}</div>`}
    </div>
  </section>`;
}
function CommissionPanel({ ctx }) {
  const { t, lang, acct } = ctx;
  const [list, , reload] = useAsync(() => api.commissionQueue(), [ctx.dataKey]);
  const [notes, setNotes] = useState({});
  async function act(r, ok) { const x = await api.decideLevel(acct.user.id, r, ok, notes[r.id]); x?.error ? ctx.toast(x.error.message) : (ctx.toast(t.saved), reload()); }
  return html`<div>
    <section className="section"><${CommissionCard} ctx=${ctx} /></section>
    <section className="section"><${SectionHead} title=${t.levelRequests + ((list || []).length ? ' · ' + list.length : '')} />
      ${(list || []).length ? html`<div className="list">${list.map(r => html`<div key=${r.id} className="card" style=${{ display: 'grid', gap: '10px' }}>
        <div className="row" style=${{ justifyContent: 'space-between' }}><b style=${{ fontSize: '17px' }}>${r.applicant_name || t.member}</b><span className="row" style=${{ gap: '6px' }}><span className="badge plain case">${t[LEVELS[r.current_level]]}</span><${Icon} n="arrow" s=${14} /><span className="badge gold case">${t[LEVELS[r.requested_level]]}</span></span></div>
        ${r.message && html`<p style=${{ margin: 0, color: '#d4cec5' }}>${r.message}</p>`}
        ${r.evidence_url && html`<a className="link" href=${r.evidence_url} target="_blank" rel="noopener">${t.evidence} <${Icon} n="arrow" s=${14} /></a>`}
        <label className="field">${t.decisionNote}<textarea id=${'cn-' + r.id} value=${notes[r.id] || ''} onInput=${e => setNotes({ ...notes, [r.id]: e.target.value })}></textarea></label>
        <div className="row"><button className="btn sm gold" onClick=${() => act(r, true)}>${t.approve}</button><button className="btn sm" onClick=${() => act(r, false)}>${t.reject}</button></div>
      </div>`)}</div>` : html`<${Empty} text=${t.nothing} />`}
    </section>
  </div>`;
}
