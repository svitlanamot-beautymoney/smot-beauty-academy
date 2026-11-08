/* ================= v5: academy title, faculties, collapsible directions ================= */
const FACULTIES = ['hair', 'face', 'nails', 'skin', 'barber', 'business'];
const FAC_ICON = { hair: 'award', face: 'user', nails: 'heart', skin: 'shield', barber: 'brief', business: 'steps' };
(function demoCategories() {
  const fac = { c1: 'face', c2: 'hair', c3: 'hair', c4: 'hair', c5: 'barber', c6: 'business' };
  const order = { c3: 10, c2: 12, c4: 13, c1: 20, c5: 50, c6: 60 };
  D.categories.forEach(c => { c.faculty = fac[c.id]; c.sort_order = order[c.id]; });
  D.categories.push(
    { id: 'c7', slug: 'haircut', faculty: 'hair', sort_order: 11, name: { en: 'Haircuts', uk: 'Стрижки', ru: 'Стрижки', nl: 'Knippen', pl: 'Strzyżenie', it: 'Tagli' } },
    { id: 'c8', slug: 'brows', faculty: 'face', sort_order: 21, name: { en: 'Brows', uk: 'Брови', ru: 'Брови', nl: 'Wenkbrauwen', pl: 'Brwi', it: 'Sopracciglia' } },
    { id: 'c9', slug: 'lashes', faculty: 'face', sort_order: 22, name: { en: 'Lashes', uk: 'Вії', ru: 'Ресницы', nl: 'Wimpers', pl: 'Rzęsy', it: 'Ciglia' } },
    { id: 'c10', slug: 'permanent-makeup', faculty: 'face', sort_order: 23, name: { en: 'Permanent makeup', uk: 'Перманентний макіяж (татуаж)', ru: 'Перманентный макияж (татуаж)', nl: 'Permanente make-up', pl: 'Makijaż permanentny', it: 'Trucco permanente' } },
    { id: 'c11', slug: 'manicure', faculty: 'nails', sort_order: 30, name: { en: 'Manicure', uk: 'Манікюр', ru: 'Маникюр', nl: 'Manicure', pl: 'Manicure', it: 'Manicure' } },
    { id: 'c12', slug: 'pedicure', faculty: 'nails', sort_order: 31, name: { en: 'Pedicure', uk: 'Педикюр', ru: 'Педикюр', nl: 'Pedicure', pl: 'Pedicure', it: 'Pedicure' } },
    { id: 'c13', slug: 'nail-art', faculty: 'nails', sort_order: 32, name: { en: 'Nail art', uk: 'Дизайн нігтів', ru: 'Дизайн ногтей', nl: 'Nail art', pl: 'Zdobienie paznokci', it: 'Nail art' } },
    { id: 'c14', slug: 'cosmetology', faculty: 'skin', sort_order: 40, name: { en: 'Cosmetology & skincare', uk: 'Косметологія та догляд за шкірою', ru: 'Косметология и уход за кожей', nl: 'Huidverzorging', pl: 'Kosmetologia', it: 'Estetica e cura della pelle' } }
  );
  D.categories.sort((a, b) => a.sort_order - b.sort_order);
  PALETTES.haircut = ['#e3c6a0', '#8d6142', '#2e1d14']; PALETTES.brows = ['#d9b39a', '#7a4e3c', '#26160f']; PALETTES.lashes = ['#e2c2b4', '#80545a', '#22141a'];
  PALETTES['permanent-makeup'] = ['#e7b7ae', '#9b5550', '#2a1517']; PALETTES.manicure = ['#f0d3c8', '#b98579', '#2c1c1c']; PALETTES.pedicure = ['#ecd1bf', '#a8806a', '#281c16'];
  PALETTES['nail-art'] = ['#f2d9a8', '#b68e4e', '#2a2014']; PALETTES.cosmetology = ['#eed8c6', '#a7876f', '#241b15'];
})();
api.categories = async function () {
  if (MODE.demo) return D.categories;
  return rows(await sb.from('categories').select('id,slug,name,sort_order,faculty').eq('is_active', true).order('sort_order'));
};

function Crest({ s = 64 }) {
  const gid = 'cg' + (React.useId ? React.useId().replace(/[^\w]/g, '') : Math.random().toString(36).slice(2));
  const g = `url(#${gid})`;
  return html`<svg width=${s} height=${s * 1.15} viewBox="0 0 100 115" aria-hidden="true" className="crest">
    <defs><linearGradient id=${gid} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f1d9a2" /><stop offset="1" stop-color="#b8873f" /></linearGradient></defs>
    <path d="M50 4 L90 16 V52 C90 78 72 96 50 108 C28 96 10 78 10 52 V16 Z" fill="#14110c" stroke=${g} stroke-width="3" />
    <path d="M50 12 L82 22 V52 C82 73 68 88 50 98 C32 88 18 73 18 52 V22 Z" fill="none" stroke="#cfa86555" stroke-width="1" />
    <text x="50" y="58" text-anchor="middle" font-family="Playfair Display, Georgia, serif" font-style="italic" font-weight="700" font-size="30" fill=${g}>SM</text>
    <path d="M30 70 Q50 80 70 70" fill="none" stroke=${g} stroke-width="1.6" />
    <text x="50" y="86" text-anchor="middle" font-family="DM Sans, sans-serif" font-weight="700" font-size="7.5" letter-spacing="2" fill="#cfa865">MMXXVI</text>
    <path d="M22 40 q-6 14 4 28 M26 36 q-8 16 2 30 M78 40 q6 14 -4 28 M74 36 q8 16 -2 30" fill="none" stroke="#cfa86599" stroke-width="1.2" />
  </svg>`;
}
function AcademyTitle({ ctx }) {
  const { t } = ctx;
  return html`<header className="acad-title">
    <${Crest} s=${60} />
    <div className="acad-name">
      <span className="eyebrow">${t.est}</span>
      <h1><span>S.MOT</span> Global Beauty Academy</h1>
      <p>${t.acadSub}</p>
      <span className="motto">Ars · Disciplina · Excellentia</span>
    </div>
  </header>`;
}

function Directions({ ctx, onPick, selected, openDefault, counts }) {
  const { t, lang, cats } = ctx;
  const sel = cats.find(c => c.slug === selected);
  const pick = slug => onPick ? onPick(slug) : go(slug ? 'academy-c-' + slug : 'academy');
  return html`<details className="dirs" open=${!!openDefault}>
    <summary><span className="ic"><${Icon} n="book" s=${20} /></span><span className="grow"><b>${t.directions}</b><small>${sel ? t.chosen + ': ' + loc(sel.name, lang) : t.directionsHint}</small></span><span className="chev"><${Icon} n="chevR" s=${18} /></span></summary>
    <div className="dirs-body">
      <button className=${'dir-all' + (!selected ? ' on' : '')} onClick=${() => pick(null)}>${t.allDirections}</button>
      ${FACULTIES.map(f => {
        const sub = cats.filter(c => (c.faculty || 'business') === f);
        if (!sub.length) return null;
        const open = sel && sel.faculty === f;
        return html`<details key=${f} className="fac" open=${open}>
          <summary><span className="ic"><${Icon} n=${FAC_ICON[f]} s=${18} /></span><span className="grow"><b>${t['fac_' + f]}</b><small>${t['fac_' + f + '_d']}</small></span><span className="chev"><${Icon} n="chevR" s=${16} /></span></summary>
          <div className="fac-list">${sub.map(c => html`<button key=${c.id} className=${'dir' + (selected === c.slug ? ' on' : '')} onClick=${() => pick(c.slug)}><span>${loc(c.name, lang)}</span>${counts && html`<small className="cnt">${counts[c.id] || 0}</small>`}<${Icon} n="arrow" s=${16} /></button>`)}</div>
        </details>`; })}
    </div>
  </details>`;
}
