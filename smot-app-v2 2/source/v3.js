/* ================= v3: banner slider, main panel, news, levels, educator tools ================= */

/* Generative gold "hair" artwork for banners (until real photos are added as banners) */
const ART = {
  color:  { hue: 0,   y0: .18, spread: .7, amp: .16, freq: 1.6, tilt: .18,  cx: .72, cy: .32, glow: '#5a3b14' },
  levels: { hue: -4,  y0: .55, spread: .5, amp: .10, freq: 1.1, tilt: -.55, cx: .82, cy: .12, glow: '#4d3412' },
  champ:  { hue: 6,   y0: .25, spread: .6, amp: .22, freq: 2.2, tilt: .05,  cx: .55, cy: .45, glow: '#634515' },
  teach:  { hue: -18, y0: .2,  spread: .65, amp: .14, freq: 1.3, tilt: .3,  cx: .78, cy: .6,  glow: '#55302a' }
};
function GoldCanvas({ variant }) {
  const ref = useRef();
  useEffect(() => {
    const cv = ref.current; if (!cv) return; const g = cv.getContext('2d'); if (!g) return;
    const V = ART[variant] || ART.color; let raf = 0; const t0 = performance.now();
    const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const size = () => { const d = Math.min(window.devicePixelRatio || 1, 2); cv.width = Math.max(1, cv.clientWidth * d); cv.height = Math.max(1, cv.clientHeight * d); g.setTransform(d, 0, 0, d, 0, 0); };
    size(); let ro = null; try { ro = new ResizeObserver(size); ro.observe(cv); } catch (e) {}
    const N = 150, sparks = Array.from({ length: 26 }, (_, i) => ({ x: (i * 0.618) % 1, y: (i * 0.371) % 1, p: i * 1.7 }));
    function draw(now) {
      const w = cv.clientWidth, h = cv.clientHeight, t = reduce ? 4 : (now - t0) / 1000;
      const bg = g.createRadialGradient(w * V.cx, h * V.cy, 0, w * V.cx, h * V.cy, Math.max(w, h) * .9);
      bg.addColorStop(0, V.glow); bg.addColorStop(.55, '#17110a'); bg.addColorStop(1, '#0a0908');
      g.globalCompositeOperation = 'source-over'; g.fillStyle = bg; g.fillRect(0, 0, w, h);
      const lg = g.createLinearGradient(0, 0, w, 0);
      lg.addColorStop(0, `hsla(${36 + V.hue},70%,55%,0)`); lg.addColorStop(.35, `hsla(${38 + V.hue},72%,62%,1)`);
      lg.addColorStop(.7, `hsla(${42 + V.hue},85%,78%,1)`); lg.addColorStop(1, `hsla(${34 + V.hue},60%,50%,0)`);
      g.globalCompositeOperation = 'lighter'; g.strokeStyle = lg;
      for (let i = 0; i < N; i++) {
        const k = i / N, mid = 1 - Math.abs(k - .5) * 2;
        const y0 = h * (V.y0 + k * V.spread), amp = h * V.amp * (.55 + .45 * Math.sin(k * 11));
        const ph = k * 2.4 + t * .32;
        g.globalAlpha = .035 + .2 * mid * mid + (i % 17 === 0 ? .25 : 0);
        g.lineWidth = .5 + ((i * 37) % 10) / 6;
        g.beginPath();
        for (let s = 0; s <= 48; s++) {
          const u = s / 48, x = -0.08 * w + u * 1.16 * w;
          const y = y0 + h * V.tilt * (u - .5) + amp * Math.sin(u * Math.PI * V.freq + ph) + amp * .35 * Math.sin(u * Math.PI * V.freq * 2.3 + ph * 1.7 + k * 5);
          s ? g.lineTo(x, y) : g.moveTo(x, y);
        }
        g.stroke();
      }
      g.globalAlpha = 1;
      for (const sp of sparks) { const a = .5 + .5 * Math.sin(t * 1.6 + sp.p); g.fillStyle = `rgba(255,226,160,${.25 * a})`; g.beginPath(); g.arc(sp.x * w, sp.y * h, 1 + a * 1.4, 0, 6.3); g.fill(); }
      g.globalCompositeOperation = 'source-over';
      if (!reduce) raf = requestAnimationFrame(draw);
    }
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); ro && ro.disconnect(); };
  }, [variant]);
  return html`<canvas ref=${ref} className="hero-canvas" aria-hidden="true"></canvas>`;
}

function HeroSlider({ ctx }) {
  const { t, lang } = ctx;
  const [promos] = useAsync(() => api.news('promo'), [ctx.dataKey]);
  const defaults = [
    { id: 'd6', art: 'color', eyebrow: t.videos, title: t.sl6t, text: t.sl6d, btn: t.sl6b, link: '#videos' },
    { id: 'd5', art: 'champ', eyebrow: t.hallTitle, title: t.sl5t, text: t.sl5d, btn: t.sl5b, link: '#masters' },
    { id: 'd0', art: 'color', eyebrow: 'Global Beauty Academy', title: t.sl0t, text: t.sl0d, btn: t.sl0b, link: '#academy' },
    { id: 'd4', art: 'teach', eyebrow: t.educators, title: t.sl4t, text: t.sl4d, btn: t.sl4b, link: '#account-apply' },
    { id: 'd3', art: 'champ', eyebrow: t.talents, title: t.sl3t, text: t.sl3d, btn: t.sl3b, link: '#talents' },
    { id: 'd2', art: 'levels', eyebrow: t.levelsTitle, title: t.sl2t, text: t.sl2d, btn: t.sl2b, link: '#academy-levels' },
    { id: 'd1', art: 'color', eyebrow: t.academy, title: t.sl1t, text: t.sl1d, btn: t.sl1b, link: '#course-advanced-hair-coloring' }
  ];
  const slides = [...(promos || []).map((p, i) => ({ id: p.id, art: ['color', 'champ', 'teach', 'levels'][i % 4], eyebrow: t.news, title: loc(p.title, lang), text: loc(p.body, lang), btn: t.readMore, link: p.link, image: p.image_url })), ...defaults];
  const [i, setI] = useState(0); const [hold, setHold] = useState(false);
  const n = slides.length, cur = slides[i % n];
  useEffect(() => { if (hold) return; const id = setTimeout(() => setI(x => (x + 1) % n), 6500); return () => clearTimeout(id); }, [i, hold, n]);
  const open = l => { if (!l) return; if (l.startsWith('#')) go(l.slice(1)); else window.open(l, '_blank', 'noopener'); };
  return html`<section className="slider" onMouseEnter=${() => setHold(true)} onMouseLeave=${() => setHold(false)} aria-roledescription="carousel">
    ${cur.image ? html`<img className="slide-img" src=${cur.image} alt="" />` : html`<${GoldCanvas} key=${cur.art} variant=${cur.art} />`}
    <div className="slide-shade"></div>
    <div className="slide-body" key=${cur.id}>
      <span className="eyebrow">${cur.eyebrow}</span>
      <h1 className="slide-title">${cur.title}</h1>
      ${cur.text && html`<p>${cur.text}</p>`}
      ${cur.link && html`<button className="btn gold" onClick=${() => open(cur.link)}>${cur.btn} <${Icon} n="arrow" s=${18} /></button>`}
    </div>
    <div className="slide-nav">
      <button className="iconbtn" aria-label="Previous" onClick=${() => setI((i - 1 + n) % n)}><${Icon} n="chevL" /></button>
      <div className="dots">${slides.map((s, k) => html`<button key=${s.id} className=${k === i % n ? 'on' : ''} aria-label=${'Slide ' + (k + 1)} onClick=${() => setI(k)}></button>`)}</div>
      <button className="iconbtn" aria-label="Next" onClick=${() => setI((i + 1) % n)}><${Icon} n="chevR" /></button>
    </div>
  </section>`;
}

function MainPanel({ ctx }) {
  const { t } = ctx;
  const tiles = [['academy', 'book', t.academy], ['masters', 'steps', t.masters], ['academy-plan', 'cal', t.plan], ['square', 'image', t.square], ['academy-educators', 'users', t.educators], ['talents', 'search', t.talents], ['foundation', 'shield', t.foundation], ['certification', 'award', t.certification]];
  return html`<section className="section"><${SectionHead} title=${t.panel} />
    <div className="panel">${tiles.map(([r, i, l]) => html`<button key=${r} className="tile" onClick=${() => go(r)}><span className="ic"><${Icon} n=${i} s=${22} /></span><span>${l}</span></button>`)}</div>
  </section>`;
}

function NewsCard({ n, ctx, wide }) {
  const { t, lang } = ctx;
  const open = () => n.link && (n.link.startsWith('#') ? go(n.link.slice(1)) : window.open(n.link, '_blank', 'noopener'));
  return html`<article className=${'news' + (wide ? ' wide' : '')}>
    ${n.image_url ? html`<div className="cover" style=${{ aspectRatio: '16/9' }}><img src=${n.image_url} alt="" style=${{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>` : html`<${Cover} k=${{ news: 'gold', course: 'hair-color', event: 'umber', promo: 'rose' }[n.kind]} ratio="16/9" />`}
    <div className="row" style=${{ justifyContent: 'space-between' }}><span className="badge tag">${t['kind_' + n.kind] || n.kind}</span><small className="muted">${fmtDate(n.published_at, lang)}</small></div>
    <h3>${loc(n.title, lang)}</h3>
    <p>${loc(n.body, lang)}</p>
    <div className="row" style=${{ justifyContent: 'space-between' }}>${n.link ? html`<button className="link" onClick=${open}>${t.readMore} <${Icon} n="arrow" s=${16} /></button>` : html`<span></span>`}<${SampleTag} t=${t} show=${n.sample} /></div>
  </article>`;
}
function NewsPage({ ctx }) {
  const { t } = ctx;
  const [news] = useAsync(() => api.news(), [ctx.dataKey]);
  const list = (news || []).filter(n => n.kind !== 'promo');
  return html`<div>
    <div style=${{ marginTop: '14px' }}><${Hero} eyebrow=${t.news} title=${t.newsTitle} text=${t.newsLead} /></div>
    <section className="section">${!news ? html`<div className="skeleton"></div>` : list.length ? html`<div className="grid">${list.map(n => html`<${NewsCard} key=${n.id} n=${n} ctx=${ctx} />`)}</div>` : html`<${Empty} text=${t.noNews} />`}</section>
  </div>`;
}

function Home({ ctx }) {
  const { t, lang, acct } = ctx;
  const [courses] = useAsync(() => api.courses(), [ctx.dataKey]);
  const [news] = useAsync(() => api.news(), [ctx.dataKey]);
  const [learn] = useAsync(() => acct ? api.learning(acct.user.id) : null, [ctx.dataKey, acct?.user?.id]);
  const list = courses || [], nl = (news || []).filter(n => n.kind !== 'promo');
  return html`<div>
    <${AcademyTitle} ctx=${ctx} />
    <${HeroSlider} ctx=${ctx} />
    <${HomeLadder} ctx=${ctx} />
    <${SquareSection} ctx=${ctx} />
    <section className="section"><${Directions} ctx=${ctx} counts=${countBy(list)} /></section>
    <${MainPanel} ctx=${ctx} />
    <section className="section"><${SectionHead} title=${t.rolesTitle} />
      <div className="grid roles">${[['r_edu', 'award', 'account-apply', t.ctaApply], ['r_stu', 'book', 'academy', t.ctaCourses], ['r_emp', 'store', 'talents', t.sl3b]].map(([k, i, r, b]) => html`<div key=${k} className="role"><span className="ic"><${Icon} n=${i} s=${24} /></span><b>${t[k]}</b><span>${t[k + '_d']}</span><button className="btn soft" onClick=${() => go(r)}>${b} <${Icon} n="arrow" s=${16} /></button></div>`)}</div>
    </section>
    ${learn && learn.items.length > 0 && html`<section className="section"><${SectionHead} title=${t.learning} action=${t.viewAll} onAction=${() => go('account-learning')} /><${ProgressCard} item=${learn.items.find(i => i.done < i.total) || learn.items[0]} ctx=${ctx} /></section>`}
    <section className="section"><${SectionHead} title=${t.news} action=${t.viewAll} onAction=${() => go('news')} />
      ${!news ? html`<div className="grid"><div className="skeleton"></div><div className="skeleton"></div></div>` : nl.length ? html`<div className="grid">${nl.slice(0, 3).map(n => html`<${NewsCard} key=${n.id} n=${n} ctx=${ctx} />`)}</div>` : html`<${Empty} text=${t.noNews} />`}
    </section>
    <section className="section"><${SectionHead} title=${t.featured} action=${t.viewAll} onAction=${() => go('academy')} />
      ${!courses ? html`<div className="grid"><div className="skeleton"></div><div className="skeleton"></div><div className="skeleton"></div></div>` : list.length ? html`<div className="grid">${list.slice(0, 3).map((c, i) => html`<${CourseCard} key=${c.id} c=${c} ctx=${ctx} featured=${i === 0} />`)}</div>` : html`<${Empty} text=${t.noCourses} />`}
    </section>
    <section className="section"><${SectionHead} title=${t.levelsTitle} action=${t.viewAll} onAction=${() => go('academy-levels')} /><${LadderStrip} ctx=${ctx} /></section>
    <section className="section"><${SectionHead} title=${t.pathTitle} />
      <div className="steps">${['s1', 's2', 's3', 's4'].map((s, i) => html`<div key=${s} className="step"><i>${i + 1}</i><b>${t[s]}</b><span>${t[s + 'd']}</span></div>`)}</div>
    </section>
    <section className="section home-grid">
      <${CertCard} ctx=${ctx} sample=${true} c=${{ certificate_number: 'SM-2026-7F3A91C2', student_name: 'Svitlana Mot', course_title: loc(D.courses.find(x => x.id === 'k6').title, lang), issued_at: '2026-10-28' }} />
      <div className="card" style=${{ display: 'grid', gap: '10px', alignContent: 'start' }}><span className="eyebrow">${t.certification}</span><p style=${{ margin: 0, fontSize: '16px' }}>${t.regNote}</p><button className="btn" style=${{ justifySelf: 'start' }} onClick=${() => go('certification')}>${t.certTitle}</button></div>
    </section>
  </div>`;
}

/* Compact horizontal ladder for the home page */
function LadderStrip({ ctx }) {
  const { t } = ctx;
  return html`<div className="ladder-strip">${LEVELS.map((l, i) => html`<button key=${l} className="rung" onClick=${() => go('academy-levels')} style=${{ '--h': (38 + i * 12) + '%' }}><i>${i + 1}</i><b>${t[l]}</b></button>`)}</div>`;
}

function MasterCard({ m, ctx, onView }) {
  const { t } = ctx;
  return html`<div className="master">
    <div className="master-top"><${Ava} p=${m} lg /><div className="info"><div className="row" style=${{ justifyContent: 'space-between' }}><b>${m.display_name}</b><span className="badge case">${t[LEVELS[m.academy_level ?? 3]]}</span></div><span className="muted">${m.professional_title || ''}</span><span className="loc">${[m.country, m.years_experience ? m.years_experience + ' ' + t.years : ''].filter(Boolean).join(' · ')}</span></div></div>
    ${(m.expertise || []).length > 0 && html`<div className="tags">${m.expertise.join(' · ')}</div>`}
    <div className="acts"><button className="btn primary" onClick=${() => go('master-' + m.id)}>${t.profileBtn}</button>${m.portfolio_url ? html`<a className="btn" href=${m.portfolio_url} target="_blank" rel="noopener"><${Icon} n="bookmark" s=${16} /> ${t.portfolio}</a>` : html`<span></span>`}</div>
    <${SampleTag} t=${t} show=${m.sample} />
  </div>`;
}

function Academy({ ctx, tab: tab0 }) {
  const { t, lang, acct, cats } = ctx;
  const catSlug = (tab0 || '').startsWith('c-') ? tab0.slice(2) : null;
  const tab = ['courses', 'levels', 'plan', 'educators', 'students'].includes(tab0) ? tab0 : 'courses';
  const [learn] = useAsync(() => acct ? api.learning(acct.user.id) : null, [ctx.dataKey, acct?.user?.id]);
  return html`<div>
    <div style=${{ marginTop: '14px' }}><${Hero} eyebrow="Global Beauty Academy" title="Learn. Create." em="Become." text=${t.p_edu_d} badge=${acct ? html`<span className="badge">${acct.roles.includes('instructor') ? t.eduArea : t.studentArea}</span>` : null}>
      <div className="chips" style=${{ justifyContent: 'space-between' }}><span className="badge tag">Global education</span><span className="row muted" style=${{ gap: '6px' }}><${Icon} n="globe" s=${18} /> 6 languages</span></div>
    <//></div>
    <div className="section scroll-x"><div className="pills">
      ${[['courses', 'book', t.academy], ['levels', 'steps', t.levels], ['plan', 'cal', t.plan], ['educators', 'users', t.educators], ['students', 'user', t.studentsTab]].map(([k, i, l]) => html`<button key=${k} className=${'pill' + (tab === k ? ' on' : '')} onClick=${() => go(k === 'courses' ? 'academy' : 'academy-' + k)}><${Icon} n=${i} s=${18} /> ${l}</button>`)}
    </div></div>
    ${tab === 'courses' && html`<${CourseCatalog} key=${catSlug || 'all'} ctx=${ctx} learn=${learn} catSlug=${catSlug} />`}
    ${tab === 'levels' && html`<${LevelsPage} ctx=${ctx} learn=${learn} />`}
    ${tab === 'plan' && html`<${PlanBuilder} ctx=${ctx} />`}
    ${tab === 'educators' && html`<${EducatorsDir} ctx=${ctx} />`}
    ${tab === 'students' && html`<${StudentsDir} ctx=${ctx} />`}
  </div>`;
}
function CourseCatalog({ ctx, learn, catSlug }) {
  const { t, lang, cats } = ctx;
  const [courses] = useAsync(() => api.courses(), [ctx.dataKey]);
  const catObj = cats.find(c => c.slug === catSlug); const cat = catObj ? catObj.id : 'all'; const [q, setQ] = useState('');
  const list = (courses || []).filter(c => (cat === 'all' || c.category_id === cat) && (!q || (loc(c.title, lang) + ' ' + loc(c.description, lang)).toLowerCase().includes(q.toLowerCase())));
  return html`<div>
    <section className="section" style=${{ marginTop: '4px' }}><${Crumbs} items=${[[t.homeCrumb, 'home'], [t.academy, catObj ? 'academy' : null], ...(catObj ? [[t['fac_' + (catObj.faculty || 'business')], null], [loc(catObj.name, lang), null]] : [])]} /></section>
    ${learn && learn.items.length > 0 && html`<section className="section"><${SectionHead} title=${t.learning} action=${t.viewAll} onAction=${() => go('account-learning')} /><div className="grid two">${learn.items.map(i => html`<${ProgressCard} key=${i.course.id} item=${i} ctx=${ctx} />`)}</div></section>`}
    <section className="section">
      <div className="search"><${Icon} n="search" s=${18} /><input className="input" id="course-search" type="search" placeholder=${t.searchPh} value=${q} onInput=${e => setQ(e.target.value)} /></div>
      <${Directions} ctx=${ctx} selected=${catSlug} counts=${countBy(courses || [])} />
      ${catObj && html`<div className="row"><span className="badge gold case">${t['fac_' + (catObj.faculty || 'business')]}</span><b style=${{ fontSize: '18px' }}>${loc(catObj.name, lang)}</b><button className="link" onClick=${() => go('academy')}><${Icon} n="x" s=${14} /> ${t.allDirections}</button></div>`}
      ${!courses ? html`<div className="grid"><div className="skeleton"></div><div className="skeleton"></div></div>` : list.length ? html`<div className="grid">${list.map((c, i) => html`<${CourseCard} key=${c.id} c=${c} ctx=${ctx} featured=${i === 0 && cat === 'all' && !q} />`)}</div>` : html`<${Empty} text=${t.noCourses}><button className="btn" onClick=${() => go('account-apply')}>${t.ctaApply}</button><//>`}
    </section>
  </div>`;
}
function LevelsPage({ ctx, learn }) {
  const { t, acct } = ctx;
  const [ach] = useAsync(() => acct ? api.achievements(acct.user.id) : [], [ctx.dataKey, acct?.user?.id]);
  const verified = (ach || []).filter(a => a.status === 'verified').length;
  const cur = acct && learn ? levelIndex({ certs: learn.certificates.length, ach: verified, graded: learn.submissions.filter(s => s.grade >= 80).length, official: acct.profile?.academy_level || 0 }) : -1;
  return html`<div>
    <section className="section"><h2 style=${{ fontSize: '24px' }}>${t.levelsTitle}</h2><p className="muted" style=${{ margin: 0, maxWidth: '64ch', fontSize: '16px' }}>${t.levelsLead}</p><small className="muted">${t.eqfNote}</small>
      <button className="card found-cta" onClick=${() => go('foundation')}><span className="ic"><${Icon} n="shield" s=${22} /></span><div className="grow"><b>${t.foundation}</b><small>${t.foundationLead}</small></div><${Icon} n="chevR" s=${18} /></button></section>
    <section className="section"><div className="levels">${LEVELS.map((l, i) => {
      const state = cur < 0 ? '' : i < cur ? 'done' : i === cur ? 'cur' : 'next';
      return html`<div key=${l} className=${'level ' + state} style=${{ '--w': (40 + i * 12) + '%' }}>
        <span className="lnum">${i + 1}</span>
        <div className="grow"><b>${t[l]} <span className="eqf">EQF ${LEVEL_EQF[i]}</span></b><small><span className="muted">${t.reqTitle}:</span> ${t[l + 'd']}</small><div className="lbar"><i></i></div></div>
        ${state === 'done' && html`<span className="badge"><${Icon} n="check" s=${14} /></span>`}
        ${state === 'cur' && html`<span className="badge gold">${t.yourLevel}</span>`}
        ${i >= 3 && state !== 'cur' && html`<span className="badge plain case" title=${t.commissionTitle}><${Icon} n="shield" s=${12} /> ${t.commission}</span>`}
        ${state === 'next' && html`<span className="muted"><${Icon} n="lock" s=${18} /></span>`}
      </div>`; }).reverse()}</div></section>
    ${acct && cur >= 0 && html`<${LevelRequest} ctx=${ctx} current=${cur} />`}
    ${!acct && html`<section className="section"><${CommissionCard} ctx=${ctx} /></section>`}
    <section className="section grid two">
      <div className="card" style=${{ display: 'grid', gap: '10px', alignContent: 'start' }}><span className="eyebrow">${t.rplTitle}</span><p style=${{ margin: 0, fontSize: '16px' }}>${t.rplText}</p><button className="btn gold" style=${{ justifySelf: 'start' }} onClick=${() => go(acct ? (acct.roles.includes('instructor') ? 'account-teaching' : 'account-achievements') : 'account')}>${t.rplCta}</button></div>
      <div className="card" style=${{ display: 'grid', gap: '10px', alignContent: 'start' }}><span className="eyebrow">${t.uniTitle}</span><p style=${{ margin: 0, fontSize: '16px' }}>${t.uniText}</p><span className="badge plain case" style=${{ justifySelf: 'start' }}>2027+</span></div>
    </section>
  </div>`;
}
function EducatorsDir({ ctx }) {
  const { t } = ctx;
  const [edu] = useAsync(() => api.educators(), [ctx.dataKey]); const [view, setView] = useState(null);
  return html`<section className="section"><p className="muted" style=${{ margin: 0 }}>${t.eduLead}</p>
    ${(edu || []).length ? html`<div className="grid two">${edu.map(m => html`<${MasterCard} key=${m.id} m=${m} ctx=${ctx} onView=${setView} />`)}</div>` : html`<${Empty} text=${t.noEducators}><button className="btn" onClick=${() => go('account-apply')}>${t.ctaApply}</button><//>`}
    ${view && html`<${Modal} title=${view.display_name} onClose=${() => setView(null)}>
      <div className="post-head"><span className="avatar lg">${initials(view.display_name)}</span><div><b>${view.professional_title || ''}</b><small>${view.country || ''}</small></div></div>
      ${view.bio && html`<p style=${{ margin: 0 }}>${view.bio}</p>`}
      ${(view.expertise || []).length > 0 && html`<div className="chips">${view.expertise.map(x => html`<span key=${x} className="badge gold case">${x}</span>`)}</div>`}
    <//>`}
  </section>`;
}
function StudentsDir({ ctx }) {
  const { t } = ctx;
  const [list] = useAsync(() => api.students(), [ctx.dataKey]);
  return html`<section className="section"><p className="muted" style=${{ margin: 0 }}>${t.studentsLead}</p>
    ${(list || []).length ? html`<div className="grid">${list.map(s => html`<div key=${s.id} className="master"><div className="master-top"><span className="avatar lg">${initials(s.display_name)}</span><div className="info"><b>${s.display_name}</b><span className="muted">${s.professional_title || ''}</span><span className="loc">${s.country || ''}</span>${s.level != null && html`<span className="badge case" style=${{ justifySelf: 'start', marginTop: '6px' }}>${t[LEVELS[s.level]]}</span>`}</div></div>${(s.expertise || []).length > 0 && html`<div className="tags">${s.expertise.join(' · ')}</div>`}<${SampleTag} t=${t} show=${s.sample} /></div>`)}</div>` : html`<${Empty} text=${t.noStudents} />`}
  </section>`;
}

/* ---------- educator tools ---------- */
function LangFields({ id, label, value, onChange, multiline, ctx }) {
  const [l, setL] = useState(ctx.lang);
  const v = value || {};
  return html`<div className="field"><span>${label}</span>
    <div className="langtabs">${LANGS.map(x => html`<button type="button" key=${x.code} className=${(l === x.code ? 'on ' : '') + (v[x.code] ? 'has' : '')} onClick=${() => setL(x.code)}>${x.short}</button>`)}</div>
    ${multiline ? html`<textarea id=${id + '-' + l} value=${v[l] || ''} onInput=${e => onChange({ ...v, [l]: e.target.value })}></textarea>` : html`<input id=${id + '-' + l} value=${v[l] || ''} onInput=${e => onChange({ ...v, [l]: e.target.value })} />`}
  </div>`;
}
function CourseEditor({ ctx, id, onClose }) {
  const { t, lang } = ctx;
  const [d, , reload] = useAsync(() => api.courseForEdit(id), [id]);
  const [title, setTitle] = useState(null); const [desc, setDesc] = useState(null);
  const [lf, setLf] = useState({ title: {}, description: {}, minutes: '', is_preview: false }); const [file, setFile] = useState(null); const [busy, setBusy] = useState(false); const [tr, setTr] = useState(null); const [qz, setQz] = useState(null);
  useEffect(() => { if (d?.course) { setTitle(d.course.title || {}); setDesc(d.course.description || {}); } }, [d]);
  async function saveTexts() { const r = await api.saveCourseTexts(id, title, desc); r?.error ? ctx.toast(r.error.message) : ctx.toast(t.saved); }
  async function addLesson(e) {
    e.preventDefault(); if (!Object.values(lf.title).some(Boolean)) return;
    setBusy(true); const r = await api.addLesson(id, lf, file, (d.lessons.length || 0) + 1); setBusy(false);
    if (r?.error) ctx.toast(r.error.message); else { ctx.toast(t.lessonAdded); setLf({ title: {}, description: {}, minutes: '', is_preview: false }); setFile(null); reload(); }
  }
  return html`<${Modal} title=${d?.course ? loc(d.course.title, lang) : t.manage} onClose=${onClose}>
    ${!d ? html`<div className="skeleton"></div>` : html`
      <div className="notice">${t.translateHint}</div>
      <span className="badge plain case" style=${{ justifySelf: 'start' }}><${Icon} n="globe" s=${14} /> ${t.autoSoon}</span>
      <${LangFields} id="ce-title" label=${t.courseTitle} value=${title} onChange=${setTitle} ctx=${ctx} />
      <${LangFields} id="ce-desc" label=${t.courseDesc} value=${desc} onChange=${setDesc} multiline ctx=${ctx} />
      <button className="btn" onClick=${saveTexts}>${t.saveTexts}</button>
      <${CoverUpload} ctx=${ctx} course=${d.course} onDone=${reload} />
      <h3 style=${{ fontSize: '17px', marginTop: '6px' }}>${t.lessonsMgmt} · ${d.lessons.length}</h3>
      <div className="list">${d.lessons.map((l, i) => html`<div key=${l.id} className="li"><span className="num">${i + 1}</span><${MoveLesson} ctx=${ctx} lessons=${d.lessons} i=${i} onDone=${reload} /><div className="grow"><b>${loc(l.title, lang)}</b><small>${[l.duration_seconds ? Math.round(l.duration_seconds / 60) + ' ' + t.min : '', l.is_preview ? t.preview : '', l.video_asset_id ? '▶' : ''].filter(Boolean).join(' · ')}</small></div><button className="btn sm" onClick=${() => setTr(l)}><${Icon} n="globe" s=${14} /> ${t.translate}</button><button className="btn sm" onClick=${() => setQz(l)}>${t.quiz}</button><${DeleteLesson} ctx=${ctx} course=${id} lesson=${l} onDone=${reload} /></div>`)}</div>
      <${BulkUpload} ctx=${ctx} course=${id} count=${d.lessons.length} onDone=${reload} />
      ${qz && html`<${QuizEditor} ctx=${ctx} lesson=${qz} onClose=${() => setQz(null)} />`}
      ${tr && html`<${TranslateModal} ctx=${ctx} lesson=${tr} onClose=${() => setTr(null)} />`}
      <form className="form card" style=${{ background: 'var(--card)' }} onSubmit=${addLesson}>
        <b>${t.addLesson}</b>
        <${LangFields} id="ls-title" label=${t.lessonTitle} value=${lf.title} onChange=${v => setLf({ ...lf, title: v })} ctx=${ctx} />
        <${LangFields} id="ls-desc" label=${t.lessonDesc} value=${lf.description} onChange=${v => setLf({ ...lf, description: v })} multiline ctx=${ctx} />
        <div className="two"><label className="field">${t.durationMin}<input id="ls-min" type="number" min="0" value=${lf.minutes} onInput=${e => setLf({ ...lf, minutes: e.target.value })} /></label>
          <label className="field">${t.videoFile}<input id="ls-video" type="file" accept="video/*" onChange=${e => setFile(e.target.files[0] || null)} /></label></div>
        <label className="check"><input id="ls-prev" type="checkbox" checked=${lf.is_preview} onChange=${e => setLf({ ...lf, is_preview: e.target.checked })} />${t.isPreview}</label>
        <button className="btn gold" disabled=${busy}>${busy ? t.loading : t.addLesson}</button>
      </form>`}
  <//>`;
}
function Diplomas({ ctx }) {
  const { t, lang, acct } = ctx;
  const [list, , reload] = useAsync(() => api.credentials(acct.user.id), [ctx.dataKey, acct.user.id]);
  const [f, setF] = useState({}); const [file, setFile] = useState(null); const [busy, setBusy] = useState(false);
  async function send(e) { e.preventDefault(); if (!file) return; setBusy(true); const r = await api.addCredential(acct.user.id, f, file); setBusy(false); if (r?.error) ctx.toast(r.error.message); else { setF({}); setFile(null); e.target.reset(); ctx.toast(t.sentForApproval); reload(); } }
  return html`<section className="section"><${SectionHead} title=${t.diplomas} />
    <p className="muted" style=${{ margin: 0 }}>${t.diplomaHint}</p>
    ${(list || []).length > 0 && html`<div className="list">${list.map(c => html`<div key=${c.id} className="li"><span style=${{ color: 'var(--gold)' }}><${Icon} n="award" /></span><div className="grow"><b>${c.title}</b><small>${[c.issuer, c.issued_at && fmtDate(c.issued_at, lang)].filter(Boolean).join(' · ')}</small></div><${StatusBadge} s=${c.status} t=${t} /></div>`)}</div>`}
    <div className="card"><form className="form" onSubmit=${send}>
      <b>${t.addDiploma}</b>
      <label className="field">${t.diplomaTitle}<input id="dp-title" required value=${f.title || ''} onInput=${e => setF({ ...f, title: e.target.value })} /></label>
      <div className="two"><label className="field">${t.issuer}<input id="dp-issuer" value=${f.issuer || ''} onInput=${e => setF({ ...f, issuer: e.target.value })} /></label><label className="field">${t.date}<input id="dp-date" type="date" value=${f.issued_at || ''} onInput=${e => setF({ ...f, issued_at: e.target.value })} /></label></div>
      <label className="field">${t.diplomaFile}<input id="dp-file" type="file" required accept="application/pdf,image/jpeg,image/png" onChange=${e => setFile(e.target.files[0] || null)} /></label>
      <button className="btn gold" disabled=${busy}>${busy ? t.loading : t.addDiploma}</button>
    </form></div>
  </section>`;
}
function CredReview({ ctx }) {
  const { t } = ctx;
  const [list, , reload] = useAsync(() => api.pendingCredentials(), [ctx.dataKey]);
  async function act(c, ok) { const r = await api.reviewCredential(c, ok); r?.error ? ctx.toast(r.error.message) : (ctx.toast(t.saved), reload()); }
  async function view(c) { const u = await api.credentialUrl(c.file_path); u ? window.open(u, '_blank', 'noopener') : ctx.toast(t.sample); }
  return html`<section className="section"><${SectionHead} title=${t.pendingCreds + ((list || []).length ? ' · ' + list.length : '')} />
    ${(list || []).length ? html`<div className="list">${list.map(c => html`<div key=${c.id} className="li" style=${{ flexWrap: 'wrap' }}><span style=${{ color: 'var(--gold)' }}><${Icon} n="award" /></span><div className="grow"><b>${c.title}</b><small>${[c.instructor, c.issuer].filter(Boolean).join(' · ')}</small></div><div className="row"><button className="btn sm" onClick=${() => view(c)}>${t.view}</button><button className="btn sm gold" onClick=${() => act(c, true)}>${t.approve}</button><button className="btn sm" onClick=${() => act(c, false)}>${t.reject}</button></div></div>`)}</div>` : html`<${Empty} text=${t.nothing} />`}
  </section>`;
}
function NewsManager({ ctx }) {
  const { t, lang } = ctx;
  const [list, , reload] = useAsync(() => api.allNews(), [ctx.dataKey]);
  const [f, setF] = useState({ kind: 'news' }); const [busy, setBusy] = useState(false);
  const set = k => e => setF({ ...f, [k]: e.target.value });
  async function add(e) { e.preventDefault(); setBusy(true); const r = await api.addNews(f, lang); setBusy(false); if (r?.error) ctx.toast(r.error.message); else { setF({ kind: 'news' }); ctx.toast(t.published); reload(); ctx.bump(); } }
  async function status(n, s) { const r = await api.setNewsStatus(n.id, s); r?.error ? ctx.toast(r.error.message) : (reload(), ctx.bump()); }
  return html`<section className="section"><${SectionHead} title=${t.manageNews} />
    <div className="card"><form className="form" onSubmit=${add}>
      <b>${t.addNews}</b>
      <label className="field">${t.newsKind}<select id="nw-kind" value=${f.kind} onChange=${set('kind')}>${['news', 'promo', 'event', 'course'].map(k => html`<option key=${k} value=${k}>${t['kind_' + k]}</option>`)}</select></label>
      <label className="field">${t.newsTitleF}<input id="nw-title" required value=${f.title || ''} onInput=${set('title')} /></label>
      <label className="field">${t.newsBody}<textarea id="nw-body" value=${f.body || ''} onInput=${set('body')}></textarea></label>
      <div className="two"><label className="field">${t.imageUrl}<input id="nw-img" type="url" placeholder="https://" value=${f.image_url || ''} onInput=${set('image_url')} /></label><label className="field">${t.linkUrl}<input id="nw-link" placeholder="#academy" value=${f.link || ''} onInput=${set('link')} /></label></div>
      <button className="btn gold" disabled=${busy}>${busy ? t.loading : t.publishNow}</button>
    </form></div>
    ${(list || []).length > 0 && html`<div className="list">${list.map(n => html`<div key=${n.id} className="li" style=${{ flexWrap: 'wrap' }}><span className="badge tag">${t['kind_' + n.kind]}</span><div className="grow"><b>${loc(n.title, lang)}</b><small>${fmtDate(n.published_at || n.created_at, lang)}</small></div><${StatusBadge} s=${n.status} t=${t} />${n.status === 'published' ? html`<button className="btn sm" onClick=${() => status(n, 'archived')}>${t.archive}</button>` : html`<button className="btn sm gold" onClick=${() => status(n, 'published')}>${t.publishNow}</button>`}</div>`)}</div>`}
  </section>`;
}

/* ---------- v4: grading and talent search ---------- */
function StudentWorks({ ctx }) {
  const { t, lang, acct } = ctx;
  const [list, , reload] = useAsync(() => api.courseWorks(acct.user.id), [ctx.dataKey, acct.user.id]);
  const [w, setW] = useState(null); const [g, setG] = useState(''); const [fb, setFb] = useState(''); const [busy, setBusy] = useState(false); const [url, setUrl] = useState(null); const [sc, setSc] = useState({});
  async function openW(x) { setW(x); setG(''); setFb(''); setSc({}); setUrl(await api.workUrl(x.file_path)); }
  async function save(revise) { if (!revise && (g === '' || g < 0 || g > 100)) return; setBusy(true); const r = await api.gradeWork(acct.user.id, w, g, fb, revise, sc); setBusy(false); if (r?.error) ctx.toast(r.error.message); else { ctx.toast(t.saved); setW(null); reload(); } }
  return html`<section className="section"><${SectionHead} title=${t.studentWorks + ((list || []).length ? ' · ' + list.length : '')} />
    ${(list || []).length ? html`<div className="list">${list.map(x => html`<div key=${x.id} className="li" style=${{ flexWrap: 'wrap' }}><span className="avatar">${initials(x.student || t.student)}</span><div className="grow"><b>${x.student || t.student}</b><small>${loc(x.course, lang)} · ${loc(x.lesson, lang)} · ${fmtDate(x.submitted_at, lang, { day: 'numeric', month: 'short' })}</small></div><button className="btn sm gold" onClick=${() => openW(x)}>${t.grade}</button></div>`)}</div>` : html`<${Empty} text=${t.noWorks} />`}
    ${w && html`<${Modal} title=${(w.student || t.student) + ' · ' + loc(w.lesson, lang)} onClose=${() => setW(null)}>
      ${url ? (/\.(mp4|mov|webm)$/i.test(w.file_name || '') ? html`<video className="video" src=${url} controls playsInline></video>` : /\.pdf$/i.test(w.file_name || '') ? html`<a className="btn" href=${url} target="_blank" rel="noopener">${t.view} ${w.file_name}</a>` : html`<img src=${url} alt=${w.file_name} style=${{ borderRadius: '16px', maxHeight: '50vh', objectFit: 'contain' }} />`) : html`<${Cover} k="hair-color" ratio="4/3" label=${w.file_name} />`}
      ${w.student_note && html`<p className="notice" style=${{ margin: 0 }}>${w.student_note}</p>`}
      <${RubricGrader} ctx=${ctx} scores=${sc} setScores=${x => { setSc(x); setG(String(RUBRIC.reduce((s2, r) => s2 + (Number(x[r.key]) || 0), 0))); }} />
      <label className="field">${t.feedback}<textarea id="gr-fb" value=${fb} onInput=${e => setFb(e.target.value)}></textarea></label>
      <div className="row"><button className="btn gold" disabled=${busy || g === ''} onClick=${() => save(false)}>${t.gradeSave}</button><button className="btn" disabled=${busy} onClick=${() => save(true)}>${t.needsRevision}</button></div>
    <//>`}
  </section>`;
}
function Talents({ ctx }) {
  const { t, acct } = ctx;
  const [emp] = useAsync(() => acct ? api.myEmployer(acct.user.id) : null, [ctx.dataKey, acct?.user?.id]);
  const isAdmin = acct?.roles.includes('admin');
  const allowed = MODE.demo || isAdmin || emp?.status === 'approved';
  const [f, setF] = useState({ country: '', city: '', specialty: '' });
  const [res, setRes] = useState(null); const [inv, setInv] = useState(null); const [reg, setReg] = useState(false);
  async function search(e) { e && e.preventDefault(); const r = await api.talentSearch(f); if (r?.error) { ctx.toast(r.error.message); setRes([]); } else setRes(r || []); }
  useEffect(() => { if (acct && allowed) search(); }, [acct?.user?.id, allowed, ctx.dataKey]);
  const set = k => e => setF({ ...f, [k]: e.target.value });
  return html`<div>
    <div style=${{ marginTop: '14px' }}><${Hero} eyebrow=${t.talents} title=${t.talentsTitle} text=${t.talentsLead}><div className="chips"><span className="badge">${t.avgGrade}</span><span className="badge gold case">${t.city}</span></div><//></div>
    ${!acct ? html`<section className="section"><${Empty} text=${t.onlyEmployers}><button className="btn primary" onClick=${() => go('account')}>${t.signIn}</button><//></section>`
      : !allowed ? html`<section className="section"><${Empty} text=${emp ? t.employerPending : t.onlyEmployers}>${!emp && html`<button className="btn gold" onClick=${() => setReg(true)}>${t.employerCta}</button>`}<//></section>`
      : html`<section className="section">
        <form className="form card" onSubmit=${search}><div className="talent-filters">
          <label className="field">${t.country}<input id="tl-country" value=${f.country} onInput=${set('country')} placeholder="Netherlands" /></label>
          <label className="field">${t.city}<input id="tl-city" value=${f.city} onInput=${set('city')} placeholder="Leiden" /></label>
          <label className="field">${t.specialty}<input id="tl-spec" value=${f.specialty} onInput=${set('specialty')} placeholder="Hair colour" /></label>
          <button className="btn gold" style=${{ alignSelf: 'end' }}><${Icon} n="search" s=${16} /> ${t.searchPh.split(' ')[0]}</button>
        </div></form>
        ${!res ? html`<div className="skeleton"></div>` : res.length ? html`<div className="grid two">${res.map((x, i) => html`<div key=${x.id} className=${'master' + (i === 0 ? ' top' : '')}>
          <div className="master-top"><span className="avatar lg">${initials(x.display_name)}</span><div className="info">
            <div className="row" style=${{ justifyContent: 'space-between' }}><b>${x.display_name}</b><span className="grade">${x.avg_grade ?? '—'}<small>/100</small></span></div>
            <span className="muted">${x.professional_title || ''}</span>
            <span className="loc row" style=${{ gap: '4px' }}><${Icon} n="pin" s=${14} /> ${[x.city, x.country].filter(Boolean).join(', ')}</span>
          </div></div>
          ${(x.expertise || []).length > 0 && html`<div className="tags">${x.expertise.join(' · ')}</div>`}
          <div className="chips"><span className="badge plain case">${x.graded_works} ${t.gradedWorks}</span><span className="badge gold case">${x.certificates} ${t.statCerts.toLowerCase()}</span>${x.verified_achievements > 0 && html`<span className="badge case">${x.verified_achievements} ${t.verifiedS.toLowerCase()}</span>`}<${SampleTag} t=${t} show=${x.sample} /></div>
          <button className="btn primary" onClick=${() => setInv(x)}>${t.invite}</button>
        </div>`)}</div>` : html`<${Empty} text=${t.noTalents} />`}
      </section>`}
    ${inv && html`<${SimpleForm} ctx=${ctx} title=${t.invite + ': ' + inv.display_name} fields=${[['message', t.inviteMsg, 'textarea', true]]} submit=${t.invite} done=${t.invited} onSubmit=${x => api.inviteTalent(inv.id, x.message)} onClose=${() => setInv(null)} />`}
    ${reg && html`<${SimpleForm} ctx=${ctx} title=${t.employerCta} submit=${t.sendForApproval} done=${t.sentForApproval}
      fields=${[['name', t.salonName, 'text', true], ['country', t.country, 'text', true], ['city', t.city, 'text', true], ['website', t.website, 'url'], ['description', t.bio, 'textarea']]}
      onSubmit=${x => api.registerEmployer(acct.user.id, x)} onClose=${() => { setReg(false); ctx.bump(); }} />`}
  </div>`;
}

function countBy(list) { const o = {}; (list || []).forEach(c => { o[c.category_id] = (o[c.category_id] || 0) + 1; }); return o; }
