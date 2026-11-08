/* ---------- Supabase connection (publishable key only; access is enforced by RLS) ---------- */
const SUPA_URL = 'https://yoheyfsgewikjqbficrr.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvaGV5ZnNnZXdpa2pxYmZpY3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM3NTg0NjUsImV4cCI6MjEwOTMzNDQ2NX0.AB8lKpzFba9I0yXAj7bvqt-mVYy0AxQdd8thf1cGvJ0';
let sb = null;
try { sb = window.supabase.createClient(SUPA_URL, SUPA_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }); } catch (e) { sb = null; }

const MODE = { demo: true };
async function probeLive() {
  if (!sb) return false;
  try {
    const r = await Promise.race([
      sb.from('categories').select('id').limit(1),
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 6000))
    ]);
    return !r.error;
  } catch (e) { return false; }
}

/* ---------- Demo dataset (shown only when the live database is unreachable, e.g. in a preview) ---------- */
const uid = () => Math.random().toString(36).slice(2, 10);
const daysFromNow = d => new Date(Date.now() + d * 864e5).toISOString();
const D = {
  categories: [
    { id: 'c1', slug: 'makeup', name: { en: 'Makeup', uk: 'Макіяж', ru: 'Макияж', nl: 'Make-up', pl: 'Makijaż', it: 'Make-up' } },
    { id: 'c2', slug: 'hairstyle', name: { en: 'Hairstyle', uk: 'Зачіски', ru: 'Причёски', nl: 'Haarstyling', pl: 'Fryzury', it: 'Acconciature' } },
    { id: 'c3', slug: 'hair-color', name: { en: 'Hair Color', uk: 'Фарбування волосся', ru: 'Окрашивание волос', nl: 'Haarkleuring', pl: 'Koloryzacja', it: 'Colore' } },
    { id: 'c4', slug: 'hair-extensions', name: { en: 'Hair Extensions', uk: 'Нарощування', ru: 'Наращивание', nl: 'Hairextensions', pl: 'Przedłużanie', it: 'Extension' } },
    { id: 'c5', slug: 'barber', name: { en: 'Barber', uk: 'Барбер', ru: 'Барбер', nl: 'Barbier', pl: 'Barber', it: 'Barbiere' } },
    { id: 'c6', slug: 'beauty-business', name: { en: 'Beauty Business', uk: 'Beauty-бізнес', ru: 'Beauty-бизнес', nl: 'Beauty business', pl: 'Biznes beauty', it: 'Business beauty' } }
  ],
  educator: { id: 'edu-svitlana', display_name: 'Svitlana Mot', professional_title: 'International Educator · Senior Artist', country: 'Netherlands', years_experience: 16, expertise: ['Bridal hairstyles', 'Hair colour', 'Hair extensions', 'Makeup'], bio: 'Hair colourist and makeup artist. OMC Hairworld Paris 2026 finalist, Team Netherlands.', portfolio_url: 'https://www.instagram.com/svitlana.mot/', level: 'lv4' },
  courses: [],
  lessons: {},
  events: [], jobs: [], partners: [], offers: [], posts: [], reactions: [],
  reviews: [], certificates: [], enrollments: [], progress: [], submissions: [], achievements: [], notifications: [],
  applications: [], pendingAch: [], orgs: []
};
(function seed() {
  const mk = (id, cat, slug, price, tag, title, desc, lessons) => {
    D.courses.push({ id, slug, category_id: cat, price_cents: price, currency: 'EUR', status: 'published', instructor_id: 'edu-svitlana', tag, title, description: desc, created_at: daysFromNow(-20), sample: true });
    D.lessons[id] = lessons.map((t, i) => ({ id: id + '-l' + (i + 1), course_id: id, title: { en: t }, description: {}, duration_seconds: (8 + (i * 7) % 17) * 60, sort_order: i + 1, is_preview: i === 0, video_asset_id: null }));
  };
  mk('k1', 'c3', 'advanced-hair-coloring', 34000, 'popular',
    { en: 'Advanced Hair Coloring', uk: 'Advanced Hair Coloring: складне фарбування', ru: 'Advanced Hair Coloring: сложное окрашивание' },
    { en: 'Complex colouring techniques, colour theory and creating expensive-looking tones.', uk: 'Складні техніки фарбування, колористика та створення дорогих відтінків.', ru: 'Сложные техники окрашивания, колористика и создание дорогих оттенков.' },
    ['Colour theory and the level system', 'Consultation and strand test', 'Lightening without damage', 'Toning: neutralising warmth', 'Placement: balayage', 'Placement: foilyage', 'Root shadow and melt', 'Colour correction basics', 'Practical: blonde transformation', 'Aftercare and pricing']);
  mk('k2', 'c4', 'luxury-hair-extensions', 50000, 'masterclass',
    { en: 'Luxury Hair Extensions', uk: 'Luxury Hair Extensions: практичний курс', ru: 'Luxury Hair Extensions: практический курс' },
    { en: 'Keratin bonds, sectioning, correction and safe work with natural hair.', uk: 'Капсульне нарощування, розподіл пасом, корекція та безпечна робота.', ru: 'Капсульное наращивание, распределение прядей, коррекция и безопасная работа.' },
    ['Choosing hair and colour match', 'Sectioning map', 'Keratin bonds step by step', 'Tape method', 'Blending and cutting', 'Correction and removal', 'Practical: full head', 'Client care and pricing']);
  mk('k3', 'c2', 'bridal-hairstyling', 29000, 'popular',
    { en: 'Bridal Hairstyling: Classic to Editorial', uk: 'Весільні зачіски: від класики до editorial', ru: 'Свадебные причёски: от классики до editorial' },
    { en: 'Hairstyles that hold all day, from soft waves to sculpted chignons.', uk: 'Зачіски, що тримаються весь день: від м’яких хвиль до скульптурних пучків.', ru: 'Причёски, которые держатся весь день: от мягких волн до скульптурных пучков.' },
    ['Preparation and texture', 'Hollywood waves', 'Low chignon', 'Volume without backcombing', 'Accessories and veil', 'Practical: trial look']);
  mk('k4', 'c1', 'bridal-makeup', 22000, 'new',
    { en: 'Bridal Makeup that Lasts', uk: 'Весільний макіяж, що тримається', ru: 'Свадебный макияж, который держится' },
    { en: 'Long-wear skin, camera-ready eyes and lips that survive the day.', uk: 'Стійка шкіра, очі для камери та губи, що витримують увесь день.', ru: 'Стойкая кожа, глаза для камеры и губы, которые выдерживают весь день.' },
    ['Skin prep for long wear', 'Foundation and correction', 'Soft smoky eyes', 'Lashes and brows', 'Lips and setting', 'Practical: full bridal look']);
  mk('k5', 'c5', 'modern-barber-art', 18000, 'new',
    { en: 'Modern Barber Art', uk: 'Modern Barber Art', ru: 'Modern Barber Art' },
    { en: 'Men’s cuts, fades, shapes and professional technique.', uk: 'Чоловічі стрижки, фейди, форми та професійна техніка.', ru: 'Мужские стрижки, фейды, формы и профессиональная техника.' },
    ['Tools and clipper guards', 'Skin fade', 'Scissor over comb', 'Beard shaping', 'Practical: classic fade']);
  mk('k6', 'c6', 'honest-price', 0, null,
    { en: 'Honest Price: Pricing Your Work', uk: 'Чесна ціна: як рахувати вартість роботи', ru: 'Честная цена: как считать стоимость работы' },
    { en: 'Calculate your real cost per service and raise prices with confidence.', uk: 'Порахуй реальну собівартість послуги й підвищуй ціни впевнено.', ru: 'Посчитай реальную себестоимость услуги и поднимай цены уверенно.' },
    ['Your cost per hour', 'Materials per service', 'Talking about price']);

  D.events = [
    { id: 'e1', title: 'S.MOT Open Cup 2027', description: 'Open hairdressing and makeup championship for members of the house.', country: 'Netherlands', city: 'Amsterdam', venue: '', starts_at: daysFromNow(140), registration_deadline: daysFromNow(100), status: 'published', sample: true,
      categories: [{ id: 'e1c1', name: 'Bridal hairstyle' }, { id: 'e1c2', name: 'Colour creation' }, { id: 'e1c3', name: 'Editorial makeup' }] },
    { id: 'e2', title: 'Bridal Look Online Challenge', description: 'Photo-based online contest judged by S.MOT educators.', country: 'Online', city: '', starts_at: daysFromNow(45), registration_deadline: daysFromNow(30), status: 'published', sample: true,
      categories: [{ id: 'e2c1', name: 'Bridal hair & makeup' }] }
  ];
  D.jobs = [
    { id: 'j1', title: 'Senior Colourist', job_type: 'employment', specialty: 'Hair colour', country: 'Netherlands', city: 'Leiden', description: 'Full-time colourist for a busy salon, Dutch or English.', languages: ['nl', 'en'], compensation: '€2,800–3,400 / month', employer: 'Sample Salon', sample: true },
    { id: 'j2', title: 'Chair rental, city centre', job_type: 'chair_rental', specialty: 'Hairstyling', country: 'Netherlands', city: 'Noordwijk', description: 'Bright workstation with backwash, flexible days.', languages: ['nl', 'en', 'uk'], compensation: '€190 / week', employer: 'Sample Studio', sample: true },
    { id: 'j3', title: 'Bridal makeup artist, season 2027', job_type: 'freelance', specialty: 'Makeup', country: 'Italy', city: 'Milan', description: 'Freelance team for destination weddings, April–October.', languages: ['en', 'it'], compensation: 'Per booking', employer: 'Sample Wedding Agency', sample: true }
  ];
  D.partners = [{ id: 'p1', brand_name: 'Sample Professional Brand', partner_type: 'product_brand', country: 'Netherlands', description: 'Professional colour and care line for salons.', specialties: ['Colour', 'Care'], sample: true }];
  D.offers = [{ id: 'o1', partner_id: 'p1', title: '15% off for S.MOT students', description: 'Starter colour kit discount for enrolled students.', offer_type: 'discount', valid_until: daysFromNow(90).slice(0, 10), sample: true }];
  D.posts = [
    { id: 'po1', author: 'Svitlana Mot', country: 'Netherlands', body: 'Behind the scenes from OMC Hairworld Paris. Months of training for one look.', created_at: daysFromNow(-1), cat: 'hair', art: 'gold', likes: 248, sample: true },
    { id: 'po2', author: 'S.MOT Academy', country: 'Netherlands', body: 'New course: Luxury Hair Extensions. First lesson is free to preview.', created_at: daysFromNow(-3), cat: 'hair', art: 'rose', likes: 134, sample: true },
    { id: 'po3', author: 'S.MOT Academy', country: 'Netherlands', body: 'Bridal makeup that lasts: three tips for skin prep before the wedding day.', created_at: daysFromNow(-5), cat: 'makeup', art: 'umber', likes: 186, sample: true }
  ];
  D.reviews = [{ id: 'r1', course_id: 'k1', rating: 5, body: 'Clear system for toning. My blondes changed after lesson four.', author: 'Student', sample: true }];
  D.applications = [
    { id: 'a1', full_name: 'Applicant (sample)', country: 'Poland', experience_years: 9, expertise: ['Hair extensions'], teaching_languages: ['pl', 'en'], education_summary: 'Diploma in hairdressing, 4 years teaching.', status: 'pending', created_at: daysFromNow(-2) },
    { id: 'a2', full_name: 'Applicant (sample)', country: 'Italy', experience_years: 12, expertise: ['Makeup'], teaching_languages: ['it', 'en'], education_summary: 'Makeup academy graduate, editorial work.', status: 'pending', created_at: daysFromNow(-4) }
  ];
  D.pendingAch = [{ id: 'pa1', title: 'Finalist, OMC Hairworld Paris 2026', issuer: 'OMC Hairworld', profile: 'Svitlana Mot', status: 'pending' }];
  D.orgs = [{ id: 'or1', kind: 'employer', name: 'Sample Salon', country: 'Netherlands', city: 'Leiden', status: 'pending' }];
})();

function demoAccount(role) {
  const id = role === 'instructor' ? 'edu-svitlana' : 'demo-' + role;
  const profile = role === 'instructor'
    ? { ...D.educator, public_profile_opt_in: true, public_directory_opt_in: true, languages: ['uk', 'en', 'nl', 'ru'], preferred_language: 'uk' }
    : { id, display_name: role === 'admin' ? 'Academy Admin' : role === 'commission' ? 'Commission member' : 'Svitlana Mot', professional_title: role === 'admin' ? 'S.MOT Administration' : role === 'commission' ? 'S.MOT Certification Commission' : 'Hair colourist', academy_level: role === 'commission' ? 5 : 0, country: 'Netherlands', bio: '', expertise: ['Hair colour'], languages: ['uk', 'en'], years_experience: 16, public_profile_opt_in: false, public_directory_opt_in: false, preferred_language: 'uk' };
  return { user: { id, email: 'demo@smot.example' }, roles: [role], profile, application: role === 'instructor' ? { status: 'approved' } : null };
}
function resetDemoUserData(role) {
  D.enrollments = []; D.progress = []; D.certificates = []; D.submissions = []; D.achievements = []; D.notifications = [];
  if (role === 'student') {
    D.enrollments = [{ id: 'en1', course_id: 'k1' }, { id: 'en2', course_id: 'k6' }];
    D.progress = D.lessons.k1.slice(0, 6).map(l => ({ lesson_id: l.id, completed_at: daysFromNow(-3) })).concat(D.lessons.k6.map(l => ({ lesson_id: l.id, completed_at: daysFromNow(-9) })));
    D.certificates = [{ id: 'ce1', course_id: 'k6', certificate_number: 'SM-2026-7F3A91C2', issued_at: daysFromNow(-9), student_name: 'Svitlana Mot', course_title: 'Honest Price: Pricing Your Work' }];
    D.submissions = [
      { id: 's0a', lesson_id: 'k1-l1', file_name: 'first-root-touch-up.jpg', status: 'reviewed', grade: 61, rubric_scores: { consultation: 12, technique: 17, result: 18, hygiene: 14 }, educator_feedback: 'Good start. Section cleaner and time the developer.', submitted_at: daysFromNow(-40) },
      { id: 's0b', lesson_id: 'k1-l2', file_name: 'gloss.jpg', status: 'reviewed', grade: 70, rubric_scores: { consultation: 14, technique: 20, result: 21, hygiene: 15 }, educator_feedback: 'Better consultation. Even saturation next time.', submitted_at: daysFromNow(-30) },
      { id: 's0c', lesson_id: 'k1-l3', file_name: 'babylights.jpg', status: 'reviewed', grade: 78, rubric_scores: { consultation: 16, technique: 23, result: 23, hygiene: 16 }, educator_feedback: 'Fine sections, nice blend.', submitted_at: daysFromNow(-20) },
      { id: 's0d', lesson_id: 'k1-l4', file_name: 'toner.jpg', status: 'reviewed', grade: 85, rubric_scores: { consultation: 17, technique: 26, result: 25, hygiene: 17 }, educator_feedback: 'Beautiful tone. Keep the workstation tidier.', submitted_at: daysFromNow(-11) },
      { id: 's1', lesson_id: 'k1-l5', file_name: 'balayage-before-after.jpg', status: 'reviewed', grade: 92, rubric_scores: { consultation: 18, technique: 28, result: 27, hygiene: 19 }, educator_feedback: 'Clean placement, soft root. Watch the toner timing on the ends.', submitted_at: daysFromNow(-4) }];
    D.achievements = [{ id: 'ac1', title: 'Finalist, OMC Hairworld Paris 2026', issuer: 'OMC Hairworld', achievement_date: '2026-09-28', status: 'verified' }, { id: 'ac2', title: 'Diploma, S&A group', issuer: 'S&A group', achievement_date: '2010-06-01', status: 'pending' }];
    D.notifications = [{ id: 'n1', title: 'Practice reviewed', body: 'Your balayage work received 92/100.', created_at: daysFromNow(-4) }];
  }
  if (role === 'instructor') {
    D.notifications = [{ id: 'n2', title: 'New practical work', body: 'A student sent work for “Placement: balayage”.', created_at: daysFromNow(-1) }];
  }
}

/* ---------- API: same calls in live and demo mode ---------- */
const rows = r => (r && !r.error && r.data) ? r.data : [];
const api = {
  async categories() {
    if (MODE.demo) return D.categories;
    return rows(await sb.from('categories').select('id,slug,name,sort_order').eq('is_active', true).order('sort_order'));
  },
  async courses() {
    if (MODE.demo) return D.courses.filter(c => c.status === 'published').map(c => ({ ...c, lesson_count: D.lessons[c.id].length }));
    const list = rows(await sb.from('courses').select('id,slug,title,description,cover_image_url,price_cents,currency,status,category_id,instructor_id,created_at').eq('status', 'published').order('created_at', { ascending: false }));
    const ids = [...new Set(list.map(c => c.instructor_id))];
    const profs = ids.length ? rows(await sb.from('profiles').select('id,display_name,professional_title').in('id', ids)) : [];
    return list.map(c => ({ ...c, tag: (Date.now() - new Date(c.created_at)) < 30 * 864e5 ? 'new' : null, instructor: profs.find(p => p.id === c.instructor_id) }));
  },
  async course(slug, userId) {
    if (MODE.demo) {
      const c = D.courses.find(x => x.slug === slug); if (!c) return null;
      return { course: c, lessons: D.lessons[c.id], reviews: D.reviews.filter(r => r.course_id === c.id), instructor: D.educator,
        enrolled: !!D.enrollments.find(e => e.course_id === c.id) || (userId === c.instructor_id),
        progress: D.progress, submissions: D.submissions };
    }
    const c = (await sb.from('courses').select('*').eq('slug', slug).maybeSingle()).data; if (!c) return null;
    const [lessons, reviews, instructor] = await Promise.all([
      sb.from('lessons').select('id,course_id,title,description,duration_seconds,sort_order,is_preview,video_asset_id').eq('course_id', c.id).order('sort_order'),
      sb.from('reviews').select('id,rating,body,created_at').eq('course_id', c.id).eq('is_published', true),
      sb.from('profiles').select('id,display_name,professional_title,bio,country,years_experience').eq('id', c.instructor_id).maybeSingle()
    ]);
    let enrolled = false, progress = [], submissions = [];
    if (userId) {
      enrolled = userId === c.instructor_id || !!(await sb.from('enrollments').select('id').eq('course_id', c.id).eq('student_id', userId).maybeSingle()).data;
      const lids = rows(lessons).map(l => l.id);
      if (lids.length) {
        progress = rows(await sb.from('lesson_progress').select('lesson_id,completed_at').eq('student_id', userId).in('lesson_id', lids));
        submissions = rows(await sb.from('lesson_submissions').select('id,lesson_id,file_name,status,grade,rubric_scores,educator_feedback,submitted_at').eq('student_id', userId).in('lesson_id', lids));
      }
    }
    return { course: c, lessons: rows(lessons), reviews: rows(reviews), instructor: instructor.data, enrolled, progress, submissions };
  },
  async completeLesson(userId, lessonId) {
    if (MODE.demo) { if (!D.progress.find(p => p.lesson_id === lessonId)) D.progress.push({ lesson_id: lessonId, completed_at: new Date().toISOString() }); return {}; }
    const row = { student_id: userId, lesson_id: lessonId, completed_at: new Date().toISOString(), last_position_seconds: 0, updated_at: new Date().toISOString() };
    const ex = (await sb.from('lesson_progress').select('id').eq('student_id', userId).eq('lesson_id', lessonId).maybeSingle()).data;
    return ex ? sb.from('lesson_progress').update(row).eq('id', ex.id) : sb.from('lesson_progress').insert(row);
  },
  async videoUrl(path) {
    if (MODE.demo || !path) return null;
    const r = await sb.storage.from('course-videos').createSignedUrl(path, 3600);
    return r.data?.signedUrl || null;
  },
  async submitWork(userId, lessonId, file, note) {
    if (MODE.demo) { D.submissions.push({ id: uid(), lesson_id: lessonId, file_name: file.name, status: 'submitted', submitted_at: new Date().toISOString() }); return {}; }
    const path = `${userId}/${lessonId}/${Date.now()}-${file.name.replace(/[^\w.\-]+/g, '_')}`;
    const up = await sb.storage.from('smot-practice-submissions').upload(path, file, { contentType: file.type });
    if (up.error) return up;
    return sb.from('lesson_submissions').insert({ lesson_id: lessonId, student_id: userId, file_path: path, file_name: file.name, file_type: file.type || 'application/octet-stream', file_size_bytes: file.size, student_note: note || null, status: 'submitted' });
  },
  async educators() {
    if (MODE.demo) return [{ ...D.educator, sample: true }];
    return rows(await sb.from('profiles').select('id,display_name,professional_title,country,bio,expertise,portfolio_url,years_experience,avatar_url').eq('public_directory_opt_in', true));
  },
  async jobs() {
    if (MODE.demo) return D.jobs;
    const list = rows(await sb.from('job_listings').select('id,employer_id,title,job_type,specialty,country,city,description,languages,compensation,created_at').eq('status', 'published').order('created_at', { ascending: false }));
    const ids = [...new Set(list.map(j => j.employer_id))];
    const emps = ids.length ? rows(await sb.from('employers').select('id,business_name').in('id', ids)) : [];
    return list.map(j => ({ ...j, employer: emps.find(e => e.id === j.employer_id)?.business_name }));
  },
  async salons() {
    if (MODE.demo) return [{ id: 'sa1', business_name: 'Sample Salon', country: 'Netherlands', city: 'Leiden', specialties: ['Colour', 'Bridal'], description: 'Colour-focused salon with a team of six.', sample: true }];
    return rows(await sb.from('employers').select('id,business_name,country,city,specialties,description,website_url').eq('status', 'approved'));
  },
  async applyJob(userId, jobId, message) {
    if (MODE.demo) return {};
    return sb.from('job_applications').insert({ job_id: jobId, applicant_id: userId, message: message || null });
  },
  async registerEmployer(userId, f) {
    if (MODE.demo) return {};
    return sb.from('employers').insert({ owner_id: userId, business_name: f.name, country: f.country, city: f.city, website_url: f.website || null, description: f.description || null, specialties: [], status: 'pending' });
  },
  async events() {
    if (MODE.demo) return { events: D.events, results: [] };
    const events = rows(await sb.from('championship_events').select('id,title,description,country,city,venue,starts_at,ends_at,registration_deadline,website_url,status').in('status', ['published', 'completed']).order('starts_at'));
    const ids = events.map(e => e.id);
    const cats = ids.length ? rows(await sb.from('championship_categories').select('id,event_id,name,division').in('event_id', ids)) : [];
    const results = ids.length ? rows(await sb.from('championship_results').select('id,event_id,category_id,placement,award_title').in('event_id', ids).order('placement')) : [];
    return { events: events.map(e => ({ ...e, categories: cats.filter(c => c.event_id === e.id) })), results };
  },
  async registerEvent(userId, ev, catId, team, country) {
    if (MODE.demo) return {};
    return sb.from('championship_registrations').insert({ event_id: ev, category_id: catId, participant_id: userId, team_name: team || null, country: country || null, status: 'submitted' });
  },
  async partners() {
    if (MODE.demo) return { partners: D.partners, offers: D.offers };
    const [p, o] = await Promise.all([
      sb.from('partners').select('id,brand_name,partner_type,country,city,website_url,description,specialties').eq('status', 'approved'),
      sb.from('partner_offers').select('id,partner_id,title,description,offer_type,valid_until,application_url').eq('status', 'published')
    ]);
    return { partners: rows(p), offers: rows(o) };
  },
  async applyPartner(userId, f) {
    if (MODE.demo) return {};
    return sb.from('partners').insert({ owner_id: userId, brand_name: f.name, partner_type: f.type, country: f.country, contact_email: f.email || null, description: f.description || null, specialties: [], status: 'pending' });
  },
  async posts(userId) {
    if (MODE.demo) return D.posts.map(p => ({ ...p, liked: D.reactions.includes(p.id) }));
    const list = rows(await sb.from('community_posts').select('id,author_id,body,created_at').eq('status', 'published').order('created_at', { ascending: false }).limit(50));
    const ids = list.map(p => p.id), aids = [...new Set(list.map(p => p.author_id))];
    const [re, pr] = await Promise.all([
      ids.length ? sb.from('community_reactions').select('post_id,user_id').in('post_id', ids) : { data: [] },
      aids.length ? sb.from('profiles').select('id,display_name,country').in('id', aids) : { data: [] }
    ]);
    const R = rows(re), P = rows(pr);
    return list.map(p => { const a = P.find(x => x.id === p.author_id); return { ...p, author: a?.display_name, country: a?.country, likes: R.filter(r => r.post_id === p.id).length, liked: !!R.find(r => r.post_id === p.id && r.user_id === userId) }; });
  },
  async addPost(userId, body, name) {
    if (MODE.demo) { D.posts.unshift({ id: uid(), author: name, country: 'Netherlands', body, created_at: new Date().toISOString(), art: 'gold', likes: 0, cat: 'hair', sample: true }); return {}; }
    return sb.from('community_posts').insert({ author_id: userId, body, status: 'published' });
  },
  async toggleLike(userId, post) {
    if (MODE.demo) { const i = D.reactions.indexOf(post.id); const p = D.posts.find(x => x.id === post.id); if (i >= 0) { D.reactions.splice(i, 1); p.likes--; } else { D.reactions.push(post.id); p.likes++; } return {}; }
    return post.liked ? sb.from('community_reactions').delete().eq('post_id', post.id).eq('user_id', userId) : sb.from('community_reactions').insert({ post_id: post.id, user_id: userId, reaction: 'like' });
  },
  /* account */
  async account(user) {
    const [r, p, a] = await Promise.all([
      sb.from('user_roles').select('role').eq('user_id', user.id),
      sb.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      sb.from('instructor_applications').select('status,created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle()
    ]);
    return { user, roles: rows(r).map(x => x.role), profile: p.data || null, application: a.data || null };
  },
  async learning(userId) {
    if (MODE.demo) {
      return { items: D.enrollments.map(e => { const c = D.courses.find(x => x.id === e.course_id); const ls = D.lessons[c.id]; return { course: c, total: ls.length, done: ls.filter(l => D.progress.find(p => p.lesson_id === l.id)).length }; }),
        certificates: D.certificates, submissions: D.submissions };
    }
    const en = rows(await sb.from('enrollments').select('course_id').eq('student_id', userId));
    const cids = en.map(e => e.course_id);
    const courses = cids.length ? rows(await sb.from('courses').select('id,slug,title,category_id').in('id', cids)) : [];
    const lessons = cids.length ? rows(await sb.from('lessons').select('id,course_id').in('course_id', cids)) : [];
    const prog = rows(await sb.from('lesson_progress').select('lesson_id,completed_at').eq('student_id', userId).not('completed_at', 'is', null));
    const certificates = rows(await sb.from('certificates').select('*').eq('student_id', userId).order('issued_at', { ascending: false }));
    const submissions = rows(await sb.from('lesson_submissions').select('id,lesson_id,file_name,status,grade,rubric_scores,educator_feedback,submitted_at').eq('student_id', userId).order('submitted_at', { ascending: false }));
    return { items: courses.map(c => { const ls = lessons.filter(l => l.course_id === c.id); return { course: c, total: ls.length, done: ls.filter(l => prog.find(p => p.lesson_id === l.id)).length }; }), certificates, submissions };
  },
  async saveProfile(userId, f) {
    if (MODE.demo) return {};
    const row = { id: userId, display_name: f.display_name || null, professional_title: f.professional_title || null, country: f.country || null, bio: f.bio || null, portfolio_url: f.portfolio_url || null, years_experience: f.years_experience === '' || f.years_experience == null ? null : Number(f.years_experience), expertise: splitList(f.expertise), languages: splitList(f.languages), public_profile_opt_in: !!f.public_profile_opt_in, public_directory_opt_in: !!f.public_directory_opt_in, city: f.city || null, open_to_work: !!f.open_to_work, preferred_language: ['en', 'uk', 'nl', 'ru', 'pl', 'it'].includes(f.preferred_language) ? f.preferred_language : 'en', updated_at: new Date().toISOString() };
    return sb.from('profiles').upsert(row);
  },
  async applyTeach(userId, f) {
    if (MODE.demo) return {};
    return sb.from('instructor_applications').insert({ user_id: userId, full_name: f.full_name, country: f.country || null, experience_years: f.experience_years ? Number(f.experience_years) : null, expertise: splitList(f.expertise), teaching_languages: splitList(f.teaching_languages), education_summary: f.education_summary || null, bio: f.bio || null, portfolio_url: f.portfolio_url || null, status: 'pending' });
  },
  async achievements(userId) {
    if (MODE.demo) return D.achievements;
    return rows(await sb.from('profile_achievements').select('*').eq('profile_id', userId).order('created_at', { ascending: false }));
  },
  async addAchievement(userId, f) {
    if (MODE.demo) { D.achievements.unshift({ id: uid(), ...f, status: 'pending' }); return {}; }
    return sb.from('profile_achievements').insert({ profile_id: userId, title: f.title, issuer: f.issuer || null, achievement_date: f.achievement_date || null, evidence_url: f.evidence_url || null, description: f.description || null, status: 'pending' });
  },
  async notifications(userId) {
    if (MODE.demo) return D.notifications;
    return rows(await sb.from('user_notifications').select('id,title,body,link,created_at,read_at').eq('recipient_id', userId).order('created_at', { ascending: false }).limit(30));
  },
  async teaching(userId) {
    if (MODE.demo) return D.courses.filter(c => c.instructor_id === userId).map(c => ({ ...c, lesson_count: D.lessons[c.id]?.length || 0, students: c.id === 'k1' ? 38 : c.id === 'k2' ? 21 : 9 }));
    const list = rows(await sb.from('courses').select('id,slug,title,status,price_cents,category_id,created_at').eq('instructor_id', userId).order('created_at', { ascending: false }));
    const ids = list.map(c => c.id);
    const en = ids.length ? rows(await sb.from('enrollments').select('course_id').in('course_id', ids)) : [];
    const ls = ids.length ? rows(await sb.from('lessons').select('course_id').in('course_id', ids)) : [];
    return list.map(c => ({ ...c, students: en.filter(e => e.course_id === c.id).length, lesson_count: ls.filter(l => l.course_id === c.id).length }));
  },
  async createCourse(userId, f, lang) {
    const slug = slugify(f.title) + '-' + Math.random().toString(36).slice(2, 6);
    const title = { [lang]: f.title, en: f.title }, description = { [lang]: f.description || '', en: f.description || '' };
    if (MODE.demo) { const id = uid(); D.courses.unshift({ id, slug, title, description, category_id: f.category_id, price_cents: Math.round(Number(f.price || 0) * 100), status: 'draft', instructor_id: userId, created_at: new Date().toISOString(), sample: true }); D.lessons[id] = []; return {}; }
    return sb.from('courses').insert({ instructor_id: userId, slug, title, description, category_id: f.category_id || null, price_cents: Math.round(Number(f.price || 0) * 100), currency: 'EUR', status: 'draft' });
  },
  async setCourseStatus(id, status) {
    if (MODE.demo) { const c = D.courses.find(x => x.id === id); if (c) c.status = status; return {}; }
    return sb.from('courses').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
  },
  async adminQueue() {
    if (MODE.demo) return { apps: D.applications.filter(a => a.status === 'pending'), ach: D.pendingAch.filter(a => a.status === 'pending'), courses: D.courses.filter(c => c.status === 'submitted'), orgs: D.orgs.filter(o => o.status === 'pending') };
    const [a, h, c, e, p] = await Promise.all([
      sb.from('instructor_applications').select('*').eq('status', 'pending').order('created_at'),
      sb.from('profile_achievements').select('*').eq('status', 'pending').order('created_at'),
      sb.from('courses').select('id,slug,title,price_cents,instructor_id,created_at').eq('status', 'submitted'),
      sb.from('employers').select('id,business_name,country,city').eq('status', 'pending'),
      sb.from('partners').select('id,brand_name,country,city').eq('status', 'pending')
    ]);
    return { apps: rows(a), ach: rows(h), courses: rows(c), orgs: rows(e).map(x => ({ id: x.id, kind: 'employer', name: x.business_name, country: x.country, city: x.city })).concat(rows(p).map(x => ({ id: x.id, kind: 'partner', name: x.brand_name, country: x.country, city: x.city }))) };
  },
  async reviewApp(adminId, app, ok) {
    if (MODE.demo) { app.status = ok ? 'approved' : 'rejected'; const x = D.applications.find(a => a.id === app.id); if (x) x.status = app.status; return {}; }
    const r = await sb.from('instructor_applications').update({ status: ok ? 'approved' : 'rejected', reviewed_at: new Date().toISOString() }).eq('id', app.id);
    if (r.error || !ok) return r;
    await sb.from('user_roles').insert({ user_id: app.user_id, role: 'instructor' });
    return r;
  },
  async reviewAch(adminId, a, ok) {
    if (MODE.demo) { const x = D.pendingAch.find(z => z.id === a.id); if (x) x.status = ok ? 'verified' : 'rejected'; return {}; }
    return sb.from('profile_achievements').update({ status: ok ? 'verified' : 'rejected', reviewed_at: new Date().toISOString(), reviewed_by: adminId }).eq('id', a.id);
  },
  async reviewOrg(o, ok) {
    if (MODE.demo) { const x = D.orgs.find(z => z.id === o.id); if (x) x.status = ok ? 'approved' : 'rejected'; return {}; }
    return sb.from(o.kind === 'employer' ? 'employers' : 'partners').update({ status: ok ? 'approved' : 'rejected' }).eq('id', o.id);
  }
};
function splitList(s) { return Array.isArray(s) ? s : String(s || '').split(',').map(x => x.trim()).filter(Boolean); }
function slugify(s) { return String(s || 'course').toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').slice(0, 48) || 'course'; }

/* ---------- v3: news, banners, students, credentials, course editing ---------- */
D.news = [
  { id: 'nw1', kind: 'news', status: 'published', published_at: daysFromNow(-2), sample: true,
    title: { en: 'OMC Hairworld Paris 2026: Team Netherlands finalist', uk: 'OMC Hairworld Paris 2026: фіналістка збірної Нідерландів', ru: 'OMC Hairworld Paris 2026: финалистка сборной Нидерландов' },
    body: { en: 'Svitlana Mot, founder of S.MOT, reached the final of the world championship in Paris with Team Netherlands.', uk: 'Засновниця S.MOT Світлана Мот вийшла у фінал чемпіонату світу в Парижі у складі збірної Нідерландів.', ru: 'Основательница S.MOT Светлана Мот вышла в финал чемпионата мира в Париже в составе сборной Нидерландов.' } },
  { id: 'nw2', kind: 'course', status: 'published', published_at: daysFromNow(-5), link: '#course-luxury-hair-extensions', sample: true,
    title: { en: 'New course: Luxury Hair Extensions', uk: 'Новий курс: Luxury Hair Extensions', ru: 'Новый курс: Luxury Hair Extensions' },
    body: { en: 'Eight practical lessons on keratin bonds, tape and blending. The first lesson is free.', uk: 'Вісім практичних уроків: капсули, стрічки та змішування пасом. Перший урок безкоштовний.', ru: 'Восемь практических уроков: капсулы, ленты и смешивание прядей. Первый урок бесплатный.' } },
  { id: 'nw3', kind: 'event', status: 'published', published_at: daysFromNow(-8), link: '#championships', sample: true,
    title: { en: 'Registration for S.MOT Open Cup 2027 is open', uk: 'Відкрито реєстрацію на S.MOT Open Cup 2027', ru: 'Открыта регистрация на S.MOT Open Cup 2027' },
    body: { en: 'Three categories, Amsterdam. Registration closes three months before the event.', uk: 'Три категорії, Амстердам. Реєстрація закривається за три місяці до події.', ru: 'Три категории, Амстердам. Регистрация закрывается за три месяца до события.' } }
];
D.credentials = [];
D.pendingCreds = [{ id: 'pc1', title: 'Master colourist diploma', issuer: 'Sample academy', instructor: 'Applicant (sample)', status: 'pending', file_path: null }];
D.students = [{ id: 'st1', display_name: 'Svitlana Mot', professional_title: 'Hair colourist', country: 'Netherlands', expertise: ['Hair colour', 'Bridal'], sample: true, level: 2 }];

Object.assign(api, {
  async news(kind) {
    if (MODE.demo) return D.news.filter(n => n.status === 'published' && (!kind || n.kind === kind));
    let q = sb.from('academy_news').select('id,kind,title,body,image_url,link,published_at,status').eq('status', 'published').order('published_at', { ascending: false }).limit(30);
    if (kind) q = q.eq('kind', kind);
    return rows(await q);
  },
  async allNews() {
    if (MODE.demo) return D.news;
    return rows(await sb.from('academy_news').select('*').order('created_at', { ascending: false }).limit(50));
  },
  async addNews(f, lang) {
    const row = { kind: f.kind || 'news', title: { [lang]: f.title, en: f.title }, body: { [lang]: f.body || '', en: f.body || '' }, image_url: f.image_url || null, link: f.link || null, status: 'published', published_at: new Date().toISOString() };
    if (MODE.demo) { D.news.unshift({ id: uid(), ...row, sample: true }); return {}; }
    return sb.from('academy_news').insert(row);
  },
  async setNewsStatus(id, status) {
    if (MODE.demo) { const n = D.news.find(x => x.id === id); if (n) n.status = status; return {}; }
    return sb.from('academy_news').update({ status, updated_at: new Date().toISOString(), ...(status === 'published' ? { published_at: new Date().toISOString() } : {}) }).eq('id', id);
  },
  async students() {
    if (MODE.demo) return D.students;
    return rows(await sb.from('profiles').select('id,display_name,professional_title,country,expertise,avatar_url').eq('public_profile_opt_in', true).limit(60));
  },
  async credentials(userId) {
    if (MODE.demo) return D.credentials;
    return rows(await sb.from('instructor_credentials').select('*').eq('instructor_id', userId).order('created_at', { ascending: false }));
  },
  async addCredential(userId, f, file) {
    if (MODE.demo) { D.credentials.unshift({ id: uid(), title: f.title, issuer: f.issuer, issued_at: f.issued_at, status: 'pending' }); return {}; }
    const path = `${userId}/${Date.now()}-${file.name.replace(/[^\w.\-]+/g, '_')}`;
    const up = await sb.storage.from('instructor-credentials').upload(path, file, { contentType: file.type });
    if (up.error) return up;
    return sb.from('instructor_credentials').insert({ instructor_id: userId, title: f.title, issuer: f.issuer || null, issued_at: f.issued_at || null, file_path: path, mime_type: file.type, status: 'pending' });
  },
  async pendingCredentials() {
    if (MODE.demo) return D.pendingCreds.filter(c => c.status === 'pending');
    const list = rows(await sb.from('instructor_credentials').select('*').eq('status', 'pending').order('created_at'));
    const ids = [...new Set(list.map(c => c.instructor_id))];
    const pr = ids.length ? rows(await sb.from('profiles').select('id,display_name').in('id', ids)) : [];
    return list.map(c => ({ ...c, instructor: pr.find(p => p.id === c.instructor_id)?.display_name }));
  },
  async credentialUrl(path) {
    if (MODE.demo || !path) return null;
    return (await sb.storage.from('instructor-credentials').createSignedUrl(path, 600)).data?.signedUrl || null;
  },
  async reviewCredential(c, ok) {
    if (MODE.demo) { const x = D.pendingCreds.find(z => z.id === c.id); if (x) x.status = ok ? 'approved' : 'rejected'; return {}; }
    return sb.from('instructor_credentials').update({ status: ok ? 'approved' : 'rejected', reviewed_at: new Date().toISOString() }).eq('id', c.id);
  },
  async courseForEdit(id) {
    if (MODE.demo) { const c = D.courses.find(x => x.id === id); return { course: c, lessons: D.lessons[id] || [] }; }
    const [c, l] = await Promise.all([sb.from('courses').select('*').eq('id', id).maybeSingle(), sb.from('lessons').select('*').eq('course_id', id).order('sort_order')]);
    return { course: c.data, lessons: rows(l) };
  },
  async saveCourseTexts(id, title, description) {
    if (MODE.demo) { const c = D.courses.find(x => x.id === id); if (c) { c.title = title; c.description = description; } return {}; }
    return sb.from('courses').update({ title, description, updated_at: new Date().toISOString() }).eq('id', id);
  },
  async addLesson(courseId, f, file, order) {
    let video_asset_id = null;
    if (MODE.demo) { (D.lessons[courseId] = D.lessons[courseId] || []).push({ id: uid(), course_id: courseId, title: f.title, description: f.description, duration_seconds: (Number(f.minutes) || 0) * 60, sort_order: order, is_preview: !!f.is_preview, video_asset_id: file ? 'demo' : null }); return {}; }
    if (file) {
      const path = `${courseId}/${Date.now()}-${file.name.replace(/[^\w.\-]+/g, '_')}`;
      const up = await sb.storage.from('course-videos').upload(path, file, { contentType: file.type });
      if (up.error) return up;
      video_asset_id = path;
    }
    return sb.from('lessons').insert({ course_id: courseId, title: f.title, description: f.description || {}, duration_seconds: f.minutes ? Number(f.minutes) * 60 : null, sort_order: order, is_preview: !!f.is_preview, video_asset_id });
  }
});

/* ---------- v4: grading, talent search for employers ---------- */
D.works = [
  { id: 'w1', lesson_id: 'k1-l5', lesson: 'Placement: balayage', course: 'Advanced Hair Coloring', student: 'Student · sample A', file_name: 'balayage.jpg', student_note: 'First try with foils on fine hair.', status: 'submitted', submitted_at: daysFromNow(-1) },
  { id: 'w2', lesson_id: 'k2-l3', lesson: 'Keratin bonds step by step', course: 'Luxury Hair Extensions', student: 'Student · sample B', file_name: 'bonds-video.mp4', status: 'submitted', submitted_at: daysFromNow(-2) }
];
D.talents = [
  { id: 't1', display_name: 'Student · sample A', professional_title: 'Colourist', country: 'Netherlands', city: 'Leiden', expertise: ['Hair colour', 'Balayage'], avg_grade: 94.5, graded_works: 12, certificates: 3, verified_achievements: 1, sample: true },
  { id: 't2', display_name: 'Student · sample B', professional_title: 'Extensions specialist', country: 'Netherlands', city: 'Noordwijk', expertise: ['Hair extensions'], avg_grade: 91, graded_works: 8, certificates: 2, verified_achievements: 0, sample: true },
  { id: 't3', display_name: 'Student · sample C', professional_title: 'Bridal stylist', country: 'Netherlands', city: 'Haarlem', expertise: ['Bridal hairstyles', 'Makeup'], avg_grade: 88, graded_works: 10, certificates: 4, verified_achievements: 2, sample: true },
  { id: 't4', display_name: 'Student · sample D', professional_title: 'Barber', country: 'Poland', city: 'Warsaw', expertise: ['Barber'], avg_grade: 85, graded_works: 6, certificates: 1, verified_achievements: 0, sample: true }
];
Object.assign(api, {
  async courseWorks(userId) {
    if (MODE.demo) return D.works.filter(w => w.status === 'submitted');
    const courses = rows(await sb.from('courses').select('id,title').eq('instructor_id', userId));
    if (!courses.length) return [];
    const lessons = rows(await sb.from('lessons').select('id,course_id,title').in('course_id', courses.map(c => c.id)));
    if (!lessons.length) return [];
    const subs = rows(await sb.from('lesson_submissions').select('*').in('lesson_id', lessons.map(l => l.id)).eq('status', 'submitted').order('submitted_at'));
    const sids = [...new Set(subs.map(s => s.student_id))];
    const prof = sids.length ? rows(await sb.from('profiles').select('id,display_name').in('id', sids)) : [];
    return subs.map(s => { const l = lessons.find(x => x.id === s.lesson_id); return { ...s, lesson: l?.title, course: courses.find(c => c.id === l?.course_id)?.title, student: prof.find(p => p.id === s.student_id)?.display_name }; });
  },
  async workUrl(path) {
    if (MODE.demo || !path) return null;
    return (await sb.storage.from('smot-practice-submissions').createSignedUrl(path, 600)).data?.signedUrl || null;
  },
  async gradeWork(userId, w, grade, feedback, revise) {
    if (MODE.demo) { const x = D.works.find(z => z.id === w.id); if (x) x.status = revise ? 'revision_requested' : 'reviewed'; return {}; }
    const r = await sb.from('lesson_submissions').update({ grade: revise ? null : Number(grade), educator_feedback: feedback || null, status: revise ? 'revision_requested' : 'reviewed', reviewed_at: new Date().toISOString(), reviewed_by: userId }).eq('id', w.id);
    if (!r.error) await sb.from('user_notifications').insert({ recipient_id: w.student_id, actor_id: userId, type: revise ? 'revision_requested' : 'practice_reviewed', title: revise ? 'Please redo your work' : 'Your work was graded', body: revise ? (feedback || '') : `${grade}/100 ${feedback ? '· ' + feedback : ''}`, link: '#account-learning' });
    return r;
  },
  async myEmployer(userId) {
    if (MODE.demo) return { status: 'approved', business_name: 'Sample Salon' };
    return (await sb.from('employers').select('id,status,business_name').eq('owner_id', userId).limit(1).maybeSingle()).data;
  },
  async talentSearch(f) {
    if (MODE.demo) return D.talents.filter(x => (!f.country || x.country.toLowerCase() === f.country.toLowerCase()) && (!f.city || x.city.toLowerCase().includes(f.city.toLowerCase())) && (!f.specialty || x.expertise.some(e => e.toLowerCase().includes(f.specialty.toLowerCase()))));
    const r = await sb.rpc('talent_search', { p_country: f.country || null, p_city: f.city || null, p_specialty: f.specialty || null });
    return r.error ? { error: r.error } : r.data;
  },
  async inviteTalent(id, msg) {
    if (MODE.demo) return {};
    return sb.rpc('invite_talent', { p_student: id, p_message: msg || '' });
  }
});
