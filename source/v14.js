/* ================= v15: soul of the house — founder letter, stories, thanks, word of the day, celebrations ================= */
const dayIndex = () => Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 864e5);
const wordOfDay = lang => { const w = WORDS[lang] || WORDS.en; return w[dayIndex() % w.length]; };
const celebrate = kind => { try { window.dispatchEvent(new CustomEvent('smot:celebrate', { detail: kind })); } catch (e) {} };
D.stories = [
  { id: 'st1', kind: 'story', author_name: 'Olena', title: 'From a cleaning job to my own chair', from_text: 'Cleaning offices in Rotterdam, no Dutch, no diploma', to_text: 'Colourist in a salon, my own regular clients', body: 'I watched the free lessons at night after work. The first time my educator gave me 85 for a balayage, I cried in the kitchen. Now clients book me two weeks ahead.', status: 'published', created_at: daysFromNow(-3), sample: true },
  { id: 'st2', kind: 'story', author_name: 'Marta', title: 'I almost gave up after my first test', from_text: 'Failed the Foundations test twice', to_text: 'Professional Artist, teaching juniors', body: 'I thought I was not made for this. Then I read the topics again, slowly, and passed. Every level since then has felt like proof that I belong here.', status: 'published', created_at: daysFromNow(-6), sample: true },
  { id: 'st3', kind: 'thanks', author_name: 'Iryna', educator_name: 'Svitlana Mot', body: 'Thank you for every comment on my practical work. You never just wrote a number. You told me why, and that changed how I see my own hands.', status: 'published', created_at: daysFromNow(-2), sample: true },
  { id: 'st4', kind: 'thanks', author_name: 'Daria', educator_name: 'Svitlana Mot', body: 'You answered my message at eleven at night before my first bridal client. I will never forget it.', status: 'published', created_at: daysFromNow(-5), sample: true }
];
D.myStories = [];
Object.assign(api, {
  async stories(kind) {
    if (MODE.demo) return D.stories.filter(s => s.status === 'published' && (!kind || s.kind === kind));
    let q = sb.from('member_stories').select('*').eq('status', 'published').order('created_at', { ascending: false }).limit(60);
    if (kind) q = q.eq('kind', kind);
    return rows(await q);
  },
  async addStory(acct, f, file) {
    const author_name = acct.profile?.display_name || acct.user.email.split('@')[0];
    if (MODE.demo) { const s = { id: uid(), ...f, author_name, photo_url: file ? URL.createObjectURL(file) : null, status: 'pending', created_at: new Date().toISOString() }; D.myStories.unshift(s); D.pendingStoriesList = [s, ...(D.pendingStoriesList || [])]; return {}; }
    let photo_url = null;
    if (file) { const path = `${acct.user.id}/story-${Date.now()}.${extOf(file)}`; const up = await sb.storage.from('avatars').upload(path, file, { contentType: file.type }); if (up.error) return up; photo_url = pubUrl('avatars', path); }
    return sb.from('member_stories').insert({ author_id: acct.user.id, author_name, kind: f.kind, title: f.title || null, body: f.body, from_text: f.from_text || null, to_text: f.to_text || null, educator_name: f.educator_name || null, photo_url, status: 'pending' });
  },
  async pendingStories() {
    if (MODE.demo) return (D.pendingStoriesList || []).filter(s => s.status === 'pending');
    return rows(await sb.from('member_stories').select('*').eq('status', 'pending').order('created_at'));
  },
  async reviewStory(s, ok) {
    if (MODE.demo) { s.status = ok ? 'published' : 'rejected'; if (ok) D.stories.unshift(s); return {}; }
    return sb.from('member_stories').update({ status: ok ? 'published' : 'rejected' }).eq('id', s.id);
  }
});

function WordOfDay({ ctx, compact }) {
  const { t, lang } = ctx;
  return html`<div className=${'word' + (compact ? ' compact' : '')}><span className="eyebrow">${t.wordOfDay}</span><p>“${wordOfDay(lang)}”</p></div>`;
}
function FounderLetter({ ctx, full }) {
  const { t, lang } = ctx;
  const paras = FOUNDER_LETTER[lang] || FOUNDER_LETTER.en;
  const [open, setOpen] = useState(!!full);
  const p = D.educator;
  return html`<article className="letter">
    <div className="letter-head"><${Ava} p=${p} lg /><div><span className="eyebrow">${t.founderLetter}</span><h2>Svitlana Mot</h2><small className="muted">${t.signFounder}</small></div></div>
    <div className="letter-body">${(open ? paras : paras.slice(0, 1)).map((x, i) => html`<p key=${i}>${x}</p>`)}</div>
    ${open ? html`<div className="signature">Svitlana Mot</div>` : html`<button className="link" onClick=${() => setOpen(true)}>${t.readLetter} <${Icon} n="arrow" s=${16} /></button>`}
  </article>`;
}
function StoryCard({ s, ctx, onOpen }) {
  const { t, lang } = ctx;
  if (s.kind === 'thanks') return html`<figure className="thanks"><blockquote>${s.body}</blockquote><figcaption><b>${s.author_name || t.member}</b> → ${s.educator_name || t.educator}${s.sample ? html` <span className="badge plain case">${t.sample}</span>` : ''}</figcaption></figure>`;
  return html`<button className="story" onClick=${() => onOpen(s)}>
    ${s.photo_url ? html`<img className="story-img" src=${s.photo_url} alt="" />` : html`<${Cover} k="rose" ratio="16/9" mark=${false} />`}
    <div className="story-path"><span>${s.from_text || '…'}</span><${Icon} n="arrow" s=${14} /><b>${s.to_text || '…'}</b></div>
    <h3>${s.title || s.author_name}</h3>
    <p>${s.body}</p>
    <small className="muted">${s.author_name || t.member} · ${fmtDate(s.created_at, lang, { day: 'numeric', month: 'short' })}${s.sample ? ' · ' + t.sample : ''}</small>
  </button>`;
}
function StoryForm({ ctx, onClose, kind0 }) {
  const { t, acct } = ctx;
  const [f, setF] = useState({ kind: kind0 || 'story' }); const [file, setFile] = useState(null); const [busy, setBusy] = useState(false);
  const set = k => e => setF({ ...f, [k]: e.target.value });
  async function send(e) { e.preventDefault(); setBusy(true); const r = await api.addStory(acct, f, file); setBusy(false); if (r?.error) ctx.toast(r.error.message); else { ctx.toast(t.storySent); onClose(); } }
  return html`<${Modal} title=${t.shareStory} onClose=${onClose}><form className="form" onSubmit=${send}>
    <div className="pills">${['story', 'thanks'].map(k => html`<button type="button" key=${k} className=${'pill' + (f.kind === k ? ' on' : '')} onClick=${() => setF({ ...f, kind: k })}>${t['kind_' + k]}</button>`)}</div>
    ${f.kind === 'story' ? html`
      <label className="field">${t.storyTitle}<input id="sf-title" maxLength="120" value=${f.title || ''} onInput=${set('title')} /></label>
      <div className="two"><label className="field">${t.fromText}<input id="sf-from" maxLength="200" value=${f.from_text || ''} onInput=${set('from_text')} /></label><label className="field">${t.toText}<input id="sf-to" maxLength="200" value=${f.to_text || ''} onInput=${set('to_text')} /></label></div>
      <label className="field">${t.photoOpt}<input id="sf-photo" type="file" accept="image/jpeg,image/png,image/webp" onChange=${e => setFile(e.target.files[0] || null)} /></label>`
      : html`<label className="field">${t.educatorName}<input id="sf-edu" required maxLength="80" value=${f.educator_name || ''} onInput=${set('educator_name')} /></label>`}
    <label className="field">${t.storyBody}<textarea id="sf-body" required minLength="10" maxLength="3000" value=${f.body || ''} onInput=${set('body')}></textarea></label>
    <button className="btn gold" disabled=${busy}>${busy ? t.loading : t.sendForApproval}</button>
  </form><//>`;
}
function StoriesPage({ ctx }) {
  const { t, acct } = ctx;
  const [list] = useAsync(() => api.stories(), [ctx.dataKey]);
  const [open, setOpen] = useState(null); const [form, setForm] = useState(null);
  const stories = (list || []).filter(s => s.kind === 'story'), thanks = (list || []).filter(s => s.kind === 'thanks');
  const share = k => acct ? setForm(k) : go('account');
  return html`<div>
    <section className="section soul-hero"><span className="eyebrow">S.MOT</span><h1>${t.stories}</h1><p>${t.storiesLead}</p><div className="row" style=${{ justifyContent: 'center' }}><button className="btn gold" onClick=${() => share('story')}>${t.shareStory}</button><button className="btn" onClick=${() => share('thanks')}>${t.kind_thanks}</button></div></section>
    <section className="section"><${FounderLetter} ctx=${ctx} full /></section>
    <section className="section"><${WordOfDay} ctx=${ctx} /></section>
    <section className="section"><${SectionHead} title=${t.stories} />${stories.length ? html`<div className="grid">${stories.map(s => html`<${StoryCard} key=${s.id} s=${s} ctx=${ctx} onOpen=${setOpen} />`)}</div>` : html`<${Empty} text=${t.noStories} />`}</section>
    <section className="section"><${SectionHead} title=${t.thanksWall} />${thanks.length ? html`<div className="thanks-wall">${thanks.map(s => html`<${StoryCard} key=${s.id} s=${s} ctx=${ctx} />`)}</div>` : html`<${Empty} text=${t.noStories} />`}</section>
    ${open && html`<${Modal} title=${open.title || open.author_name} onClose=${() => setOpen(null)}>
      ${open.photo_url && html`<img src=${open.photo_url} alt="" style=${{ borderRadius: '16px', maxHeight: '40vh', objectFit: 'cover' }} />`}
      <div className="story-path"><span>${open.from_text}</span><${Icon} n="arrow" s=${14} /><b>${open.to_text}</b></div>
      <p style=${{ margin: 0, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>${open.body}</p><small className="muted">${open.author_name}</small>
    <//>`}
    ${form && html`<${StoryForm} ctx=${ctx} kind0=${form} onClose=${() => setForm(null)} />`}
  </div>`;
}
function HomeSoul({ ctx }) {
  const { t } = ctx;
  const [list] = useAsync(() => api.stories(), [ctx.dataKey]);
  const [open, setOpen] = useState(null);
  const st = (list || []).filter(s => s.kind === 'story').slice(0, 2), th = (list || []).find(s => s.kind === 'thanks');
  return html`<section className="section">
    <div className="unity"><${Crest} s=${36} /><p>${t.unity}</p></div>
    <div className="soul-grid">
      <${FounderLetter} ctx=${ctx} />
      <div style=${{ display: 'grid', gap: '12px', alignContent: 'start', minWidth: 0 }}>
        <${WordOfDay} ctx=${ctx} compact />
        ${th && html`<${StoryCard} s=${th} ctx=${ctx} />`}
      </div>
    </div>
    ${st.length > 0 && html`<div className="section-head" style=${{ marginTop: '6px' }}><h2 style=${{ fontSize: '22px' }}>${t.stories}</h2><button className="link" onClick=${() => go('stories')}>${t.viewAll} <${Icon} n="arrow" s=${16} /></button></div>
      <div className="grid two">${st.map(s => html`<${StoryCard} key=${s.id} s=${s} ctx=${ctx} onOpen=${() => go('stories')} />`)}</div>`}
  </section>`;
}
function Greeting({ ctx }) {
  const { t, acct } = ctx;
  const h = new Date().getHours(); const g = h < 12 ? t.gm : h < 18 ? t.ga : t.ge;
  const first = (acct.profile?.display_name || '').split(' ')[0];
  return html`<section className="section"><div className="greet"><h2>${g}${first ? ', ' + first : ''} ✨</h2><${WordOfDay} ctx=${ctx} compact /></div></section>`;
}
function StoryReview({ ctx }) {
  const { t } = ctx;
  const [list, , reload] = useAsync(() => api.pendingStories(), [ctx.dataKey]);
  async function act(s, ok) { const r = await api.reviewStory(s, ok); r?.error ? ctx.toast(r.error.message) : (ctx.toast(t.saved), reload(), ctx.bump()); }
  return html`<section className="section"><${SectionHead} title=${t.pendingStories + ((list || []).length ? ' · ' + list.length : '')} />
    ${(list || []).length ? html`<div className="list">${list.map(s => html`<div key=${s.id} className="card" style=${{ display: 'grid', gap: '8px' }}><div className="row" style=${{ justifyContent: 'space-between' }}><b>${s.title || s.author_name}</b><span className="badge tag">${t['kind_' + s.kind]}</span></div><p style=${{ margin: 0, color: '#d4cec5' }}>${s.body}</p><small className="muted">${s.author_name}${s.educator_name ? ' → ' + s.educator_name : ''}</small><div className="row"><button className="btn sm gold" onClick=${() => act(s, true)}>${t.approve}</button><button className="btn sm" onClick=${() => act(s, false)}>${t.reject}</button></div></div>`)}</div>` : html`<${Empty} text=${t.nothing} />`}
  </section>`;
}

/* Golden celebration for every achievement */
function CelebrationHost({ ctx }) {
  const { t } = ctx;
  const [kind, setKind] = useState(null); const ref = useRef();
  useEffect(() => { const f = e => setKind(e.detail || 'test'); addEventListener('smot:celebrate', f); return () => removeEventListener('smot:celebrate', f); }, []);
  useEffect(() => {
    if (!kind) return; const id = setTimeout(() => setKind(null), 7000);
    const cv = ref.current; const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!cv || reduce) return () => clearTimeout(id);
    const g = cv.getContext('2d'); const W = cv.width = innerWidth, H = cv.height = innerHeight;
    const P = Array.from({ length: 140 }, () => ({ x: W / 2, y: H * 0.45, vx: (Math.random() - .5) * 14, vy: -Math.random() * 14 - 4, r: 2 + Math.random() * 4, c: ['#f1d9a2', '#cfa865', '#e8cc93', '#fff4d6'][Math.floor(Math.random() * 4)], a: 1 }));
    let raf; const step = () => { g.clearRect(0, 0, W, H); P.forEach(p => { p.vy += .35; p.x += p.vx; p.y += p.vy; p.a *= .985; g.globalAlpha = p.a; g.fillStyle = p.c; g.beginPath(); g.arc(p.x, p.y, p.r, 0, 6.3); g.fill(); }); g.globalAlpha = 1; if (P.some(p => p.a > .05 && p.y < H + 20)) raf = requestAnimationFrame(step); };
    step(); return () => { clearTimeout(id); cancelAnimationFrame(raf); };
  }, [kind]);
  if (!kind) return null;
  const text = kind === 'cert' ? t.celebrateCert : kind === 'core' ? t.celebrateCore : t.celebrateTest;
  return html`<div className="celebrate" role="dialog" aria-live="polite" onClick=${() => setKind(null)}><canvas ref=${ref}></canvas><div className="celebrate-card"><${Crest} s=${64} /><h2>${t.youDidIt}</h2><p>${text}</p><small className="muted">${wordOfDay(ctx.lang)}</small><button className="btn gold" onClick=${() => setKind(null)}>${t.continueL}</button></div></div>`;
}
