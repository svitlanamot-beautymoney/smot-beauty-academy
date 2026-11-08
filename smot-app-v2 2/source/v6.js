/* ================= v6: S.MOT Square — masters' billboards ================= */
const bbUrl = p => !p ? null : /^https?:/.test(p) ? p : `${SUPA_URL}/storage/v1/object/public/billboards/${p}`;
D.billboards = [
  { id: 'b1', author_name: 'Svitlana Mot', city: 'Noordwijkerhout', headline: 'Bridal hair that holds all day', subline: 'OMC Hairworld Paris 2026 finalist', art: 'hairstyle', link: '#course-bridal-hairstyling', status: 'published' },
  { id: 'b2', author_name: 'Svitlana Mot', city: 'Noordwijkerhout', headline: 'The expensive blonde', subline: 'Colour · toning · balayage', art: 'hair-color', link: '#course-advanced-hair-coloring', status: 'published' },
  { id: 'b3', author_name: 'Nail artist · sample', city: 'Amsterdam', headline: 'Minimal gold nails', subline: 'Gel · nail art', art: 'nail-art', status: 'published', sample: true },
  { id: 'b4', author_name: 'Brow master · sample', city: 'Leiden', headline: 'Brows by design', subline: 'Shape · tint · lamination', art: 'brows', status: 'published', sample: true },
  { id: 'b5', author_name: 'Lash studio · sample', city: 'Haarlem', headline: 'Lashes that open the eyes', subline: 'Lift · classic · volume', art: 'lashes', status: 'published', sample: true },
  { id: 'b6', author_name: 'PMU artist · sample', city: 'Warsaw', headline: 'Soft powder brows', subline: 'Permanent makeup', art: 'permanent-makeup', status: 'published', sample: true },
  { id: 'b7', author_name: 'Barber · sample', city: 'Rotterdam', headline: 'Sharp fades', subline: 'Cuts · beards', art: 'barber', status: 'published', sample: true },
  { id: 'b8', author_name: 'Svitlana Mot', city: 'Noordwijkerhout', headline: 'Luxury extensions, €500 course', subline: 'Practical training in NL', art: 'hair-extensions', link: '#course-luxury-hair-extensions', status: 'published' }
];
D.myBillboards = [];
Object.assign(api, {
  async billboards() {
    if (MODE.demo) return D.billboards.filter(b => b.status === 'published');
    const list = rows(await sb.from('master_billboards').select('id,author_name,city,headline,subline,media_path,media_type,link,category_id,created_at').eq('status', 'published').order('created_at', { ascending: false }).limit(60));
    return list.map(b => ({ ...b, art: ctxCats.find(c => c.id === b.category_id)?.slug }));
  },
  async myBillboards(userId) {
    if (MODE.demo) return D.myBillboards;
    return rows(await sb.from('master_billboards').select('*').eq('owner_id', userId).order('created_at', { ascending: false }));
  },
  async addBillboard(acct, f, file) {
    const author_name = acct.profile?.display_name || acct.user.email.split('@')[0];
    if (MODE.demo) { const b = { id: uid(), author_name, city: acct.profile?.city || '', headline: f.headline, subline: f.subline, art: (D.categories.find(c => c.id === f.category_id) || {}).slug, media_path: file ? URL.createObjectURL(file) : null, media_type: file && file.type.startsWith('video') ? 'video' : 'image', link: f.link, status: 'pending' }; D.myBillboards.unshift(b); D.pendingBb.unshift(b); return {}; }
    let media_path = null, media_type = 'image';
    if (file) {
      media_path = `${acct.user.id}/${Date.now()}-${file.name.replace(/[^\w.\-]+/g, '_')}`;
      media_type = file.type.startsWith('video') ? 'video' : 'image';
      const up = await sb.storage.from('billboards').upload(media_path, file, { contentType: file.type });
      if (up.error) return up;
    }
    return sb.from('master_billboards').insert({ owner_id: acct.user.id, author_name, city: acct.profile?.city || null, headline: f.headline, subline: f.subline || null, link: f.link || null, category_id: f.category_id || null, media_path, media_type, status: 'pending' });
  },
  async pendingBillboards() {
    if (MODE.demo) return D.pendingBb.filter(b => b.status === 'pending');
    return rows(await sb.from('master_billboards').select('*').eq('status', 'pending').order('created_at'));
  },
  async reviewBillboard(b, ok) {
    if (MODE.demo) { b.status = ok ? 'published' : 'rejected'; if (ok && !D.billboards.includes(b)) D.billboards.unshift(b); return {}; }
    return sb.from('master_billboards').update({ status: ok ? 'published' : 'rejected', reviewed_at: new Date().toISOString() }).eq('id', b.id);
  },
  async archiveBillboard(b) {
    if (MODE.demo) { b.status = 'archived'; D.billboards = D.billboards.filter(x => x !== b); return {}; }
    return sb.from('master_billboards').update({ status: 'archived' }).eq('id', b.id);
  }
});
D.pendingBb = [];
let ctxCats = [];

/* Layout of the wall: like Times Square, panels of different sizes */
const SLOTS = ['xl', 'tall', 'std', 'wide', 'std', 'tall', 'std', 'wide', 'std'];
function Billboard({ ad, size, ctx }) {
  const { t } = ctx;
  const url = bbUrl(ad.media_path);
  const [a, b, c] = PALETTES[ad.art] || PALETTES.gold;
  const open = () => ad.cta ? go(ad.cta) : ad.link ? (ad.link.startsWith('#') ? go(ad.link.slice(1)) : window.open(ad.link, '_blank', 'noopener')) : null;
  return html`<button className=${'bb ' + size} onClick=${open} style=${{ '--a': a, '--b': b, '--c': c }}>
    ${url ? (ad.media_type === 'video' ? html`<video className="bb-media" src=${url} autoPlay muted loop playsInline></video>` : html`<img className="bb-media" src=${url} alt=${ad.headline} />`) : html`<span className="bb-art"></span>`}
    <span className="bb-shine"></span><span className="bb-scan"></span><span className="bb-shade"></span>
    <span className="bb-top"><span className="bb-live"><i></i>${t.live}</span>${ad.sample && html`<span className="badge plain case">${t.sample}</span>`}</span>
    <span className="bb-text">
      <b className="bb-head">${ad.headline}</b>
      ${ad.subline && html`<span className="bb-sub">${ad.subline}</span>`}
      <span className="bb-by">${ad.author_name || t.master}${ad.city ? ' · ' + ad.city : ''}</span>
    </span>
  </button>`;
}
/* One slot cycles through several ads with its own rhythm */
function Slot({ ads, size, offset, ctx }) {
  const [k, setK] = useState(0);
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  useEffect(() => { if (reduce || ads.length < 2) return; const id = setInterval(() => setK(x => (x + 1) % ads.length), 5200 + offset * 900); return () => clearInterval(id); }, [ads.length]);
  const ad = ads[k % ads.length];
  return html`<div className=${'slot ' + size}><${Billboard} key=${ad.id + '-' + k} ad=${ad} size=${size} ctx=${ctx} /></div>`;
}
function BillboardWall({ ctx, compact }) {
  const { t } = ctx; ctxCats = ctx.cats;
  const [list] = useAsync(() => api.billboards(), [ctx.dataKey]);
  const own = { id: 'cta', headline: t.yourAdHere, subline: t.yourAdHereD, author_name: 'S.MOT Square', art: 'gold', cta: 'account-billboard' };
  const ads = [...(list || [])];
  const slots = compact ? SLOTS.slice(0, 6) : SLOTS;
  const buckets = slots.map(() => []);
  ads.forEach((ad, i) => buckets[i % slots.length].push(ad));
  buckets[slots.length - 1].push(own);
  buckets.forEach(b => { if (!b.length) b.push(own); });
  const ticker = ads.map(a => `${a.author_name || t.master}${a.city ? ' · ' + a.city : ''} — ${a.headline}`);
  return html`<div className="square">
    <div className="wall">${slots.map((s, i) => html`<${Slot} key=${i + '-' + buckets[i].length} ads=${buckets[i]} size=${s} offset=${i} ctx=${ctx} />`)}</div>
    ${ticker.length > 0 && html`<div className="ticker" aria-hidden="true"><div className="ticker-in">${[...ticker, ...ticker].map((x, i) => html`<span key=${i}>✦ ${x}</span>`)}</div></div>`}
  </div>`;
}
function SquareSection({ ctx }) {
  const { t } = ctx;
  return html`<section className="section">
    <div className="section-head"><div><span className="eyebrow">Times Square of beauty</span><h2 style=${{ fontSize: '26px', marginTop: '4px' }}>${t.square}</h2></div><button className="link" onClick=${() => go('square')}>${t.enterSquare} <${Icon} n="arrow" s=${16} /></button></div>
    <${BillboardWall} ctx=${ctx} compact />
    <div className="row"><button className="btn gold" onClick=${() => go('account-billboard')}><${Icon} n="plus" s=${16} /> ${t.placeAd}</button><span className="muted">${t.squareLead}</span></div>
  </section>`;
}
function SquarePage({ ctx }) {
  const { t } = ctx;
  return html`<div>
    <section className="section square-head"><span className="eyebrow">Times Square of beauty</span><h1>${t.square}</h1><p>${t.squareLead}</p><div className="row"><button className="btn gold" onClick=${() => go('account-billboard')}><${Icon} n="plus" s=${16} /> ${t.placeAd}</button></div></section>
    <section className="section"><${BillboardWall} ctx=${ctx} /></section>
  </div>`;
}
function MyBillboard({ ctx }) {
  const { t, lang, acct, cats } = ctx;
  const [list, , reload] = useAsync(() => api.myBillboards(acct.user.id), [ctx.dataKey, acct.user.id]);
  const [f, setF] = useState({}); const [file, setFile] = useState(null); const [busy, setBusy] = useState(false); const [preview, setPreview] = useState(null);
  const set = k => e => setF({ ...f, [k]: e.target.value });
  function pickFile(e) { const x = e.target.files[0] || null; setFile(x); try { setPreview(x ? URL.createObjectURL(x) : null); } catch (er) { setPreview(null); } }
  async function send(e) { e.preventDefault(); setBusy(true); const r = await api.addBillboard(acct, f, file); setBusy(false); if (r?.error) ctx.toast(r.error.message); else { ctx.toast(t.bbSent); setF({}); setFile(null); setPreview(null); e.target.reset(); reload(); } }
  const cat = cats.find(c => c.id === f.category_id);
  const draft = { id: 'draft', headline: f.headline || t.yourAdHere, subline: f.subline || '', author_name: acct.profile?.display_name || t.master, city: acct.profile?.city, art: cat?.slug || 'gold', media_path: preview, media_type: file && file.type.startsWith('video') ? 'video' : 'image' };
  return html`<div>
    <section className="section bb-editor">
      <div className="card"><form className="form" onSubmit=${send}>
        <h2 style=${{ fontSize: '20px' }}>${t.placeAd}</h2>
        <p className="muted" style=${{ margin: 0 }}>${t.bbHint}</p>
        <label className="field">${t.bbHeadline}<input id="bb-head" required minLength="2" maxLength="80" value=${f.headline || ''} onInput=${set('headline')} /></label>
        <label className="field">${t.bbSub}<input id="bb-sub" maxLength="160" value=${f.subline || ''} onInput=${set('subline')} /></label>
        <label className="field">${t.bbMedia}<input id="bb-file" type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime" onChange=${pickFile} /></label>
        <div className="two">
          <label className="field">${t.bbDirection}<select id="bb-cat" value=${f.category_id || ''} onChange=${set('category_id')}><option value="">—</option>${cats.map(c => html`<option key=${c.id} value=${c.id}>${loc(c.name, lang)}</option>`)}</select></label>
          <label className="field">${t.bbLink}<input id="bb-link" placeholder="https://instagram.com/…" value=${f.link || ''} onInput=${set('link')} /></label>
        </div>
        <button className="btn gold" disabled=${busy}>${busy ? t.loading : t.sendForApproval}</button>
      </form></div>
      <div className="bb-preview slot tall"><${Billboard} ad=${draft} size="tall" ctx=${ctx} /></div>
    </section>
    <section className="section"><${SectionHead} title=${t.myBillboard} />
      ${(list || []).length ? html`<div className="list">${list.map(b => html`<div key=${b.id} className="li" style=${{ flexWrap: 'wrap' }}><span style=${{ color: 'var(--gold)' }}><${Icon} n="image" /></span><div className="grow"><b>${b.headline}</b><small>${b.subline || ''}</small></div><${StatusBadge} s=${b.status} t=${t} />${b.status !== 'archived' && html`<button className="btn sm" onClick=${async () => { await api.archiveBillboard(b); reload(); ctx.bump(); }}>${t.archive}</button>`}</div>`)}</div>` : html`<${Empty} text=${t.noBillboards} />`}
    </section>
  </div>`;
}
function BillboardReview({ ctx }) {
  const { t } = ctx;
  const [list, , reload] = useAsync(() => api.pendingBillboards(), [ctx.dataKey]);
  async function act(b, ok) { const r = await api.reviewBillboard(b, ok); r?.error ? ctx.toast(r.error.message) : (ctx.toast(t.saved), reload(), ctx.bump()); }
  return html`<section className="section"><${SectionHead} title=${t.pendingBb + ((list || []).length ? ' · ' + list.length : '')} />
    ${(list || []).length ? html`<div className="grid">${list.map(b => html`<div key=${b.id} style=${{ display: 'grid', gap: '10px' }}><div className="slot std bb-box"><${Billboard} ad=${b} size="std" ctx=${ctx} /></div><div className="row"><button className="btn sm gold" onClick=${() => act(b, true)}>${t.approve}</button><button className="btn sm" onClick=${() => act(b, false)}>${t.reject}</button></div></div>`)}</div>` : html`<${Empty} text=${t.nothing} />`}
  </section>`;
}
