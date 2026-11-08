/* ================= v18: free opening — every course free until payments, admin switch ================= */
Object.assign(api, {
  async loadSettings() {
    if (MODE.demo) return;
    const r = (await sb.from('platform_settings').select('key,value')).data || [];
    const f = r.find(x => x.key === 'free_launch'); if (f) FREE_LAUNCH = f.value === true || f.value === 'true';
  },
  async setFreeLaunch(on) {
    if (MODE.demo) { FREE_LAUNCH = on; return {}; }
    const r = await sb.from('platform_settings').upsert({ key: 'free_launch', value: on, updated_at: new Date().toISOString() });
    if (!r.error) FREE_LAUNCH = on; return r;
  }
});
function LaunchRibbon({ ctx }) {
  const { t, acct } = ctx;
  const [, setV] = useState(0);
  useEffect(() => { api.loadSettings().then(() => setV(v => v + 1)).catch(() => {}); }, [ctx.dataKey]);
  if (!FREE_LAUNCH) return null;
  return html`<section className="section"><div className="ribbon">
    <span className="ribbon-mark">✦</span>
    <div className="ribbon-text"><b>${t.launchTitle}</b><span>${t.launchText}</span></div>
    <div className="row">${!acct && html`<button className="btn sm gold" onClick=${() => go('account')}>${t.launchJoin}</button>`}<button className="btn sm" onClick=${() => go('community')}>${t.launchCommunity}</button></div>
  </div></section>`;
}
function FreeLaunchAdmin({ ctx }) {
  const { t } = ctx;
  const [, setV] = useState(0);
  useEffect(() => { api.loadSettings().then(() => setV(v => v + 1)); }, []);
  async function toggle() { const r = await api.setFreeLaunch(!FREE_LAUNCH); if (r?.error) ctx.toast(r.error.message); else { ctx.toast(t.saved); setV(v => v + 1); ctx.bump(); } }
  return html`<section className="section"><div className="card" style=${{ display: 'grid', gap: '10px' }}>
    <div className="row" style=${{ justifyContent: 'space-between' }}><b>${t.launchTitle}</b><span className=${'badge case' + (FREE_LAUNCH ? ' gold' : '')}>${FREE_LAUNCH ? t.launchOn : t.launchOff}</span></div>
    <small className="muted">${t.launchAdminHint}</small>
    <button className="btn sm" style=${{ justifySelf: 'start' }} onClick=${toggle}>${FREE_LAUNCH ? t.launchTurnOff : t.launchTurnOn}</button>
  </div></section>`;
}
