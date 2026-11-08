/* ================= v13: public master pages, installable app ================= */
Object.assign(api, {
  async master(id) {
    if (MODE.demo) {
      const p = [D.educator, ...D.hall].find(x => x.id === id); if (!p) return null;
      const courses = D.courses.filter(c => c.instructor_id === id && c.status === 'published').map(c => ({ ...c, lesson_count: (D.lessons[c.id] || []).length }));
      const free = courses.flatMap(c => (D.lessons[c.id] || []).filter(l => l.is_preview).map(l => ({ ...l, course: c })));
      return { p, courses, free, bbs: D.billboards.filter(b => b.author_name === p.display_name) };
    }
    const p = (await sb.from('profiles').select('id,display_name,professional_title,country,city,bio,expertise,portfolio_url,years_experience,avatar_url,academy_level').eq('id', id).maybeSingle()).data;
    if (!p) return null;
    const courses = rows(await sb.from('courses').select('id,slug,title,description,cover_image_url,price_cents,category_id,instructor_id,created_at').eq('instructor_id', id).eq('status', 'published'));
    const ls = courses.length ? rows(await sb.from('lessons').select('id,course_id,title,duration_seconds,is_preview,video_asset_id,sort_order').in('course_id', courses.map(c => c.id))) : [];
    const withCount = courses.map(c => ({ ...c, instructor: p, lesson_count: ls.filter(l => l.course_id === c.id).length }));
    const bbs = rows(await sb.from('master_billboards').select('*').eq('owner_id', id).eq('status', 'published'));
    return { p, courses: withCount, free: ls.filter(l => l.is_preview).map(l => ({ ...l, course: withCount.find(c => c.id === l.course_id) })), bbs };
  }
});
function MasterPage({ ctx, id }) {
  const { t, lang } = ctx; ctxCats = ctx.cats;
  const [d] = useAsync(() => api.master(id), [id, ctx.dataKey]);
  const [play, modal] = useLessonPlayer(ctx);
  if (d === null) return html`<div className="path"><${Empty} text=${t.notFoundMaster} /></div>`;
  if (!d) return html`<div className="section"><div className="skeleton"></div></div>`;
  const { p, courses, free, bbs } = d; const lv = p.academy_level || 0;
  function share() { const u = location.href.split('#')[0] + '#master-' + p.id; try { navigator.clipboard.writeText(u).then(() => ctx.toast(t.copied), () => ctx.toast(u)); } catch (e) { ctx.toast(u); } }
  return html`<div>
    <section className="section" style=${{ marginTop: '6px' }}><${Crumbs} items=${[[t.homeCrumb, 'home'], [t.masters, 'masters'], [p.display_name, null]]} /></section>
    <section className="section master-hero">
      <${Ava} p=${p} lg />
      <div className="mh-info">
        <span className=${'badge case lvl l' + lv}>${lv >= 3 ? html`<${Icon} n="shield" s=${13} /> ` : ''}${t[LEVELS[lv]]}</span>
        <h1>${p.display_name}</h1>
        <span className="muted">${[p.professional_title, p.city, p.country, p.years_experience ? p.years_experience + ' ' + t.years : ''].filter(Boolean).join(' · ')}</span>
        ${p.bio && html`<p>${p.bio}</p>`}
        ${(p.expertise || []).length > 0 && html`<div className="chips">${p.expertise.map(x => html`<span key=${x} className="badge gold case">${x}</span>`)}</div>`}
        <div className="row"><button className="btn gold" onClick=${share}><${Icon} n="share" s=${16} /> ${t.shareProfile}</button>${p.portfolio_url && html`<a className="btn" href=${p.portfolio_url} target="_blank" rel="noopener">${t.portfolio}</a>`}</div>
      </div>
    </section>
    <section className="section stats"><div className="stat"><b>${courses.length}</b><span>${t.coursesBy}</span></div><div className="stat"><b>${courses.reduce((s, c) => s + (c.lesson_count || 0), 0)}</b><span>${t.lessons}</span></div><div className="stat"><b>${lv + 1}/6</b><span>${t.levels}</span></div></section>
    ${courses.length > 0 && html`<section className="section"><${SectionHead} title=${t.coursesBy} /><div className="grid">${courses.map((c, i) => html`<${CourseCard} key=${c.id} c=${c} ctx=${ctx} featured=${i === 0} />`)}</div></section>`}
    ${free.length > 0 && html`<section className="section"><${SectionHead} title=${t.freeBy} /><div className="shelf-row">${free.map(l => html`<${LessonTile} key=${l.id} l=${l} ctx=${ctx} onOpen=${play} />`)}</div></section>`}
    ${bbs.length > 0 && html`<section className="section"><${SectionHead} title=${t.bbBy} /><div className="bb-row">${bbs.slice(0, 4).map(b => html`<div key=${b.id} className="slot std bb-cell"><${Billboard} ad=${b} size="std" ctx=${ctx} /></div>`)}</div></section>`}
    ${modal}
  </div>`;
}
