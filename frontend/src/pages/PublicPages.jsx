import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowDown, ArrowRight, ArrowUpRight, BadgeCheck, BookOpen, Check, ChevronLeft, ChevronRight, CirclePlay, GraduationCap, Heart, Lightbulb, LockKeyhole, Search, ShieldCheck, Sparkles, Star, Users } from 'lucide-react';
import api, { getErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Button, CourseCard, EmptyState, Loading, PageHeading, ProgressBar, StatCard } from '../components/Shared';

function roleHome(role) {
  return role === 'admin' ? '/admin' : role === 'instructor' ? '/instructor' : '/dashboard';
}

export function HomePage() {
  const [courses, setCourses] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    Promise.all([api.get('/courses?limit=3&sort=popular'), api.get('/stats')])
      .then(([courseResponse, statsResponse]) => {
        setCourses(courseResponse.data.data.courses);
        setStats(statsResponse.data.data);
      })
      .catch((requestError) => setError(getErrorMessage(requestError)));
  }, []);
  return <div className="home-page">
    <section className="hero-section"><div className="hero-copy"><span className="hero-kicker"><Sparkles size={15} /> YOUR NEXT CHAPTER STARTS HERE</span><h1>Make room for<br /><em>what’s next.</em></h1><p>Learn practical skills from people who do the work. Find your next big idea, one good lesson at a time.</p><div className="hero-actions"><Link to="/courses" className="button button-primary">Explore courses <ArrowRight size={17} /></Link><Link to="/register" className="button button-light">Start learning free</Link></div><div className="hero-proof"><div className="avatar-stack"><span>AR</span><span>MK</span><span>JS</span><span>+</span></div><div><div className="proof-stars"><Star size={13} fill="currentColor" /><Star size={13} fill="currentColor" /><Star size={13} fill="currentColor" /><Star size={13} fill="currentColor" /><Star size={13} fill="currentColor" /></div><small>{stats?.students ? `${Number(stats.students).toLocaleString()}+ learners` : 'A community of curious learners'}</small></div></div></div><div className="hero-visual"><div className="hero-visual-orb orb-one" /><div className="hero-visual-orb orb-two" /><div className="hero-note note-top"><span className="note-icon"><BadgeCheck size={18} /></span><span><b>Learn at your pace</b><small>Little steps, real progress</small></span></div><div className="hero-learning-card"><div className="hero-card-image"><div className="hero-card-art"><span>CREATIVE<br />THINKING</span><span className="art-shape" /></div><span className="play-bubble"><CirclePlay size={22} fill="white" /></span></div><div className="hero-card-content"><span className="eyebrow">FEATURED COURSE</span><h3>Designing for the digital world</h3><div className="hero-card-meta"><span><Star size={13} fill="currentColor" /> 4.9</span><span>8 lessons</span><span>Beginner</span></div><ProgressBar value={68} /><div className="hero-card-footer"><small>Your learning journey</small><b>68%</b></div></div></div><div className="hero-note note-bottom"><span className="note-icon note-yellow"><Lightbulb size={18} /></span><span><b>Learn something useful</b><small>Skills that go places</small></span></div><span className="hero-scribble">✳</span></div><div className="hero-scroll"><ArrowDown size={16} /> SCROLL TO EXPLORE</div></section>
    <section className="trust-strip"><span>Made for curious minds</span><i /><span>Learn on your schedule</span><i /><span>Build skills that last</span><i /><span>Celebrate every milestone</span></section>
    <section className="section-block home-courses"><div className="section-top"><div><span className="eyebrow">A GOOD PLACE TO BEGIN</span><h2>Find your next <em>favorite</em> course.</h2><p>Fresh skills, thoughtful teachers, and lessons that get to the point.</p></div><Link to="/courses" className="text-link">Explore all courses <ArrowUpRight size={17} /></Link></div>{error ? <div className="alert alert-error">{error}</div> : null}<div className="course-grid">{courses.map((course) => <CourseCard key={course.id} course={course} />)}</div>{courses.length === 0 && !error && <div className="soft-empty"><BookOpen size={22} /><span>New courses are on the way. Check back soon.</span></div>}</section>
    <section className="feature-section"><div className="feature-art"><div className="feature-stamp"><GraduationCap size={28} /><span>GROW<br />WITH US</span></div><div className="feature-quote">“The beautiful thing about learning is nobody can take it away from you.”<small>— B.B. King</small></div><span className="feature-doodle">✳</span></div><div className="feature-copy"><span className="eyebrow">A BETTER WAY TO GROW</span><h2>Small lessons.<br /><em>Big momentum.</em></h2><p>Learning should fit into your life, not the other way around. Pick up a new skill, make it your own, and see how far it takes you.</p><div className="feature-points"><span><Check size={16} /> Learn on your own time</span><span><Check size={16} /> Practical, human-made lessons</span><span><Check size={16} /> Celebrate your progress</span></div><Link to="/courses" className="text-link">Find your starting point <ArrowRight size={16} /></Link></div></section>
    <section className="stats-band"><div><span className="eyebrow">LEARNHUB, BY THE NUMBERS</span><h2>Made for the<br /><em>next step.</em></h2></div><div className="public-stat"><strong>{stats?.courses ?? '—'}</strong><span>thoughtful courses</span></div><div className="public-stat"><strong>{stats?.instructors ?? '—'}</strong><span>expert instructors</span></div><div className="public-stat"><strong>{stats?.students ?? '—'}</strong><span>curious learners</span></div></section>
    <section className="bottom-cta"><div className="cta-spark">✳</div><span className="eyebrow">YOUR NEXT STEP IS WAITING</span><h2>Curiosity looks good<br />on <em>you.</em></h2><p>Join a community of people making room for what’s next.</p><Link to="/register" className="button button-white">Create your free account <ArrowRight size={17} /></Link></section>
  </div>;
}

export function CoursesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [result, setResult] = useState({ courses: [], page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const q = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const priceType = searchParams.get('priceType') || '';
  const sort = searchParams.get('sort') || 'popular';
  const page = Number(searchParams.get('page') || 1);
  const update = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    if (key !== 'page') next.delete('page');
    setSearchParams(next);
  };
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    api.get('/courses', { params: { q, category, priceType, sort, page, limit: 9 } })
      .then(({ data }) => { if (active) setResult(data.data); })
      .catch((requestError) => { if (active) setError(getErrorMessage(requestError)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [q, category, priceType, sort, page]);
  return <div className="content-page"><PageHeading eyebrow="THE COURSE LIBRARY" title={<>A new skill is closer<br className="desktop-break" /> than you think.</>} description="Explore practical, thoughtfully made courses for wherever you want to go next." /><div className="catalog-toolbar"><label className="search-field"><Search size={18} /><input value={q} onChange={(event) => update('q', event.target.value)} placeholder="Search skills, topics, courses…" aria-label="Search courses" /></label><div className="filter-fields"><select value={category} onChange={(event) => update('category', event.target.value)} aria-label="Filter by category"><option value="">All categories</option>{['Development', 'Design', 'Business', 'Data Science', 'Marketing', 'Photography'].map((item) => <option key={item}>{item}</option>)}</select><select value={priceType} onChange={(event) => update('priceType', event.target.value)} aria-label="Filter by price"><option value="">All prices</option><option value="free">Free</option><option value="paid">Paid</option></select><select value={sort} onChange={(event) => update('sort', event.target.value)} aria-label="Sort courses"><option value="popular">Most popular</option><option value="newest">Newest</option><option value="rating">Top rated</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option></select></div></div>{error && <div className="alert alert-error">{error}</div>}{loading ? <Loading label="Finding the right course…" /> : result.courses.length ? <><div className="catalog-result-note"><span><b>{result.total}</b> {result.total === 1 ? 'course' : 'courses'} to explore</span><span>Page {result.page} of {result.pages}</span></div><div className="course-grid">{result.courses.map((course) => <CourseCard key={course.id} course={course} />)}</div>{result.pages > 1 && <div className="pagination"><button className="button button-outline" disabled={page <= 1} onClick={() => update('page', String(page - 1))}><ChevronLeft size={17} /> Previous</button><span>{page} / {result.pages}</span><button className="button button-outline" disabled={page >= result.pages} onClick={() => update('page', String(page + 1))}>Next <ChevronRight size={17} /></button></div>}</> : !error && <EmptyState title="No courses found" body="Try another search or clear a filter to discover more." action={<Button variant="light" onClick={() => setSearchParams({})}>Clear filters</Button>} />}</div>;
}

export function CourseDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [enrolled, setEnrolled] = useState(false);
  const [canManage, setCanManage] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [review, setReview] = useState({ rating: 5, comment: '' });
  const [notice, setNotice] = useState('');
  const load = async () => {
    const [courseResult, reviewResult] = await Promise.all([api.get(`/courses/${id}`), api.get(`/reviews/${id}`)]);
    setCourse(courseResult.data.data.course);
    setLessons(courseResult.data.data.lessons);
    setEnrolled(courseResult.data.data.enrolled);
    setCanManage(courseResult.data.data.canManage);
    setReviews(reviewResult.data.data.reviews);
  };
  useEffect(() => { load().catch((requestError) => setError(getErrorMessage(requestError))); }, [id]);
  const enroll = async () => {
    if (!user) return navigate('/login', { state: { from: { pathname: `/courses/${id}` } } });
    setBusy(true); setError('');
    try {
      await api.post(`/enrollments/free/${id}`);
      setNotice('You’re enrolled! Your course is ready.');
      await load();
    } catch (requestError) { setError(getErrorMessage(requestError)); }
    finally { setBusy(false); }
  };
  const submitReview = async (event) => {
    event.preventDefault(); setError(''); setNotice('');
    try { await api.post(`/reviews/${id}`, review); setReview({ rating: 5, comment: '' }); setNotice('Thanks for sharing your feedback.'); await load(); }
    catch (requestError) { setError(getErrorMessage(requestError)); }
  };
  if (!course && error) return <div className="content-page"><EmptyState title="We couldn’t load this course" body={error} action={<Link className="button button-primary" to="/courses">Back to courses</Link>} /></div>;
  if (!course) return <Loading label="Loading course details…" />;
  const canReview = enrolled && user?.role === 'student' && !reviews.some((item) => item.student.id === user.id);
  return <div className="content-page course-detail-page">
    <div className="breadcrumbs"><Link to="/courses">Courses</Link><span>/</span><span>{course.category}</span><span>/</span><b>{course.title}</b></div>
    {notice && <div className="alert alert-success">{notice}</div>}{error && <div className="alert alert-error">{error}</div>}
    <section className="detail-hero"><div className="detail-hero-copy"><div className="detail-tags"><span>{course.category}</span><span>{course.level}</span><span>{course.language}</span></div><h1>{course.title}</h1><p>{course.shortDescription}</p><div className="detail-byline"><span>Created by <b>{course.instructor?.name}</b></span><span className="rating"><Star size={15} fill="currentColor" /> {Number(course.averageRating).toFixed(1)} <small>({course.reviewCount} reviews)</small></span></div><div className="detail-facts"><span><BookOpen size={16} /> {lessons.length} lessons</span><span><Users size={16} /> Self-paced</span><span><ShieldCheck size={16} /> Certificate of completion</span></div></div><aside className="purchase-card"><div className="purchase-cover"><div className="cover-art"><span>{course.category?.toUpperCase()}</span><BookOpen size={34} /><span className="cover-art-caption">LEARN SOMETHING NEW</span></div></div><div className="purchase-content"><strong className="purchase-price">{course.price > 0 ? `PKR ${Number(course.price).toLocaleString()}` : 'Free'}</strong><p>{course.price > 0 ? 'Paid enrollment is not available yet.' : 'Full lifetime access to this course.'}</p>{enrolled ? <Link to={`/learn/${id}`} className="button button-primary button-full">Continue learning <ArrowRight size={17} /></Link> : course.price > 0 ? <Button className="button-full" disabled>Paid enrollment unavailable</Button> : <Button className="button-full" disabled={busy || (canManage && user?.role !== 'admin')} onClick={enroll}>{busy ? 'Getting things ready…' : 'Enroll for free'} <ArrowRight size={17} /></Button>}{canManage && <Link to="/instructor/courses" className="button button-outline button-full">Manage course</Link>}<div className="purchase-guarantees"><span><Check size={14} /> Learn at your own pace</span><span><Check size={14} /> Access on any device</span><span><Check size={14} /> Certificate when you finish</span></div></div></aside></section>
    <div className="detail-columns"><div className="detail-main"><section className="content-section"><span className="eyebrow">ABOUT THIS COURSE</span><h2>What you’ll learn</h2><p className="description-long">{course.description}</p><div className="learning-outcomes"><span><Check size={16} /> Practical skills you can put to work</span><span><Check size={16} /> A clear path from first steps to confidence</span><span><Check size={16} /> Lessons made to fit your schedule</span></div></section><section className="content-section curriculum-section"><div className="section-top"><div><span className="eyebrow">THE CURRICULUM</span><h2>Course lessons</h2></div><span className="curriculum-total">{lessons.length} lessons</span></div><div className="curriculum-list">{lessons.length ? lessons.map((lesson, index) => <div className="curriculum-row" key={lesson.id || lesson._id}><span className="lesson-number">{String(index + 1).padStart(2, '0')}</span><span className="lesson-row-title"><b>{lesson.title}</b>{lesson.description && !lesson.locked && <small>{lesson.description}</small>}</span><span className="lesson-lock">{lesson.locked ? <LockKeyhole size={15} /> : <CirclePlay size={16} />}</span></div>) : <p className="muted-copy">The instructor is preparing the curriculum.</p>}</div></section><section className="content-section review-section"><div className="section-top"><div><span className="eyebrow">LEARNER NOTES</span><h2>Reviews <span className="review-title-rating"><Star size={17} fill="currentColor" /> {Number(course.averageRating).toFixed(1)}</span></h2></div><span className="curriculum-total">{course.reviewCount} reviews</span></div>{canReview && <form className="review-form" onSubmit={submitReview}><label>Your rating<select value={review.rating} onChange={(event) => setReview({ ...review, rating: Number(event.target.value) })}>{[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} stars</option>)}</select></label><label>Your review<textarea required maxLength={1500} value={review.comment} onChange={(event) => setReview({ ...review, comment: event.target.value })} placeholder="What did you enjoy or find useful?" /></label><Button>Share review <ArrowRight size={15} /></Button></form>}{reviews.length ? <div className="review-list">{reviews.map((item) => <article key={item.id} className="review-card"><div className="review-author"><span className="user-avatar avatar-small">{item.student.name?.charAt(0)}</span><div><b>{item.student.name}</b><small>{new Date(item.createdAt).toLocaleDateString()}</small></div><span className="rating"><Star size={14} fill="currentColor" /> {item.rating}</span></div><p>{item.comment}</p></article>)}</div> : <p className="muted-copy">No reviews yet. Complete a lesson and be the first to share your experience.</p>}</section></div><aside className="detail-aside"><div className="instructor-card"><span className="eyebrow">YOUR INSTRUCTOR</span><span className="instructor-avatar">{course.instructor?.name?.slice(0, 1)}</span><h3>{course.instructor?.name}</h3><p>{course.instructor?.headline || 'LearnHub instructor'}</p><p className="instructor-bio">{course.instructor?.bio || 'Sharing practical experience and helping learners take their next step.'}</p></div><div className="aside-note"><Heart size={17} /><b>Made with care</b><p>Course content is thoughtfully put together by an instructor who knows their craft.</p></div></aside></div>
  </div>;
}

export function AuthPage({ mode }) {
  const isRegister = mode === 'register';
  const { login, register, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (user) navigate(roleHome(user.role), { replace: true }); }, [user, navigate]);
  const submit = async (event) => {
    event.preventDefault(); setError('');
    if (isRegister && form.password !== form.confirmPassword) return setError('Your passwords don’t match.');
    setBusy(true);
    try {
      const session = isRegister ? await register({ name: form.name, email: form.email, password: form.password, confirmPassword: form.confirmPassword }) : await login({ email: form.email, password: form.password });
      navigate(location.state?.from?.pathname || roleHome(session.role), { replace: true });
    } catch (requestError) { setError(getErrorMessage(requestError)); }
    finally { setBusy(false); }
  };
  return <div className="auth-page"><div className="auth-art"><span className="eyebrow">LEARNHUB / YOUR NEXT CHAPTER</span><div className="auth-art-copy"><h2>Make room<br />for <em>what’s next.</em></h2><p>Good things happen when you stay curious.</p></div><div className="auth-art-footer"><span>LEARN A LITTLE. GROW A LOT.</span><span>01 — ∞</span></div></div><div className="auth-panel"><div className="auth-form-wrap"><Link to="/" className="brand auth-brand"><span className="brand-mark"><GraduationCap size={21} /></span><span>learn<span>hub</span></span></Link><span className="eyebrow">{isRegister ? 'START YOUR JOURNEY' : 'WELCOME BACK'}</span><h1>{isRegister ? 'Your next step starts here.' : 'Good to have you back.'}</h1><p className="auth-subtitle">{isRegister ? 'Create your free account and find something worth learning.' : 'Pick up right where your curiosity left off.'}</p>{error && <div className="alert alert-error">{error}</div>}<form onSubmit={submit} className="auth-form">{isRegister && <label>Full name<input autoComplete="name" required minLength={2} maxLength={80} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Your name" /></label>}<label>Email address<input type="email" autoComplete="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@example.com" /></label><label>Password<input type="password" autoComplete={isRegister ? 'new-password' : 'current-password'} minLength={8} required value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="At least 8 characters" /></label>{isRegister && <label>Confirm password<input type="password" autoComplete="new-password" minLength={8} required value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} placeholder="Type your password again" /></label>}<Button className="button-full" disabled={busy}>{busy ? 'One moment…' : isRegister ? 'Create account' : 'Log in'} <ArrowRight size={17} /></Button></form><p className="auth-switch">{isRegister ? 'Already have an account?' : 'New to LearnHub?'} <Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'Log in' : 'Create an account'}</Link></p><p className="auth-role-note"><ShieldCheck size={15} /> Student accounts are open to everyone. Instructor and administrator access is managed securely.</p></div></div></div>;
}
