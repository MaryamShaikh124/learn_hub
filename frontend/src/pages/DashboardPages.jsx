import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowDown, ArrowRight, ArrowUp, BadgeCheck, BookOpen, Check, ChevronRight, CirclePlus, Clock3, Eye, GraduationCap, LayoutGrid, Pencil, Plus, Search, ShieldCheck, Star, Trash2, TrendingUp, Users, X } from 'lucide-react';
import api, { getErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Button, CourseCard, EmptyState, Loading, PageHeading, ProgressBar, StatCard } from '../components/Shared';

function useRequest(path) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    api.get(path).then(({ data: response }) => { if (active) setData(response.data); })
      .catch((requestError) => { if (active) setError(getErrorMessage(requestError)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [path]);
  return { data, error, loading, setData, reload: () => api.get(path).then(({ data: response }) => setData(response.data)) };
}

export function StudentDashboardPage() {
  const { user } = useAuth();
  const { data, error, loading } = useRequest('/enrollments/me');
  if (loading) return <Loading />;
  const enrollments = data?.enrollments || [];
  const stats = data?.stats || {};
  return <div className="dashboard-page"><PageHeading eyebrow="YOUR LEARNING SPACE" title={`Good to see you, ${user?.name?.split(' ')[0]}.`} description="A little progress adds up. Let’s see where you’re headed." action={<Link className="button button-primary" to="/courses">Find a course <ArrowRight size={16} /></Link>} />{error && <div className="alert alert-error">{error}</div>}<div className="stats-grid"><StatCard icon={BookOpen} label="Enrolled courses" value={stats.enrolled ?? 0} tone="purple" /><StatCard icon={TrendingUp} label="In progress" value={stats.inProgress ?? 0} tone="blue" /><StatCard icon={BadgeCheck} label="Completed" value={stats.completed ?? 0} tone="green" /><StatCard icon={GraduationCap} label="Certificates" value={stats.certificates ?? 0} tone="yellow" /></div><div className="dashboard-section-heading"><div><span className="eyebrow">KEEP YOUR MOMENTUM</span><h2>Pick up where you left off</h2></div><Link to="/my-learning" className="text-link">View all <ArrowRight size={15} /></Link></div>{enrollments.length ? <div className="learning-list">{enrollments.slice(0, 3).map((item) => <LearningRow item={item} key={item.id} />)}</div> : <EmptyState title="Your learning story starts here" body="Explore courses and find something you’re excited to learn." action={<Link className="button button-primary" to="/courses">Explore courses <ArrowRight size={16} /></Link>} />}<div className="dashboard-promo"><div><span className="eyebrow">A LITTLE EVERY DAY</span><h3>Progress is a practice.</h3><p>Just 15 minutes of learning can add up to something wonderful.</p></div><div className="promo-icon"><Clock3 size={28} /></div><Link to="/courses" className="text-link">Find your next lesson <ArrowRight size={15} /></Link></div></div>;
}

function LearningRow({ item }) {
  const course = item.course || {};
  return <article className="learning-row"><Link className="learning-row-art" to={`/learn/${course.id}`}><span><BookOpen size={22} /></span></Link><div className="learning-row-main"><div className="learning-row-top"><div><span className="eyebrow">{course.category || 'COURSE'}</span><Link to={`/learn/${course.id}`}><h3>{course.title}</h3></Link><p>By {course.instructor?.name || 'LearnHub instructor'}</p></div><span className={`status-pill ${item.status}`}>{item.status === 'completed' ? 'Completed' : `${item.progress || 0}% complete`}</span></div><ProgressBar value={item.progress || 0} /><div className="learning-row-bottom"><span>{item.progress || 0}% complete</span><Link to={item.status === 'completed' && item.certificateId ? `/certificates/${item.certificateId}` : `/learn/${course.id}`}>{item.status === 'completed' ? 'View certificate' : 'Continue learning'} <ArrowRight size={14} /></Link></div></div></article>;
}

export function MyLearningPage() {
  const { data, error, loading } = useRequest('/enrollments/me');
  if (loading) return <Loading />;
  const enrollments = data?.enrollments || [];
  return <div className="dashboard-page"><PageHeading eyebrow="YOUR COURSE COLLECTION" title="My learning" description="Every course you’ve started, all in one place." action={<Link className="button button-primary" to="/courses">Explore courses <ArrowRight size={16} /></Link>} />{error && <div className="alert alert-error">{error}</div>}{enrollments.length ? <div className="learning-list">{enrollments.map((item) => <LearningRow item={item} key={item.id} />)}</div> : <EmptyState title="Nothing on your learning shelf yet" body="Find a course that sparks your curiosity and it’ll show up here." action={<Link to="/courses" className="button button-primary">Explore courses</Link>} />}</div>;
}

export function CertificatesPage() {
  const { data, error, loading } = useRequest('/certificates/me');
  if (loading) return <Loading label="Finding your achievements…" />;
  const certificates = data?.certificates || [];
  return <div className="dashboard-page"><PageHeading eyebrow="YOUR MILESTONES" title="Certificates" description="A little proof of what you’ve put your mind to." />{error && <div className="alert alert-error">{error}</div>}{certificates.length ? <div className="certificate-grid">{certificates.map((certificate) => <Link className="certificate-card" to={`/certificates/${certificate.id}`} key={certificate.id}><div className="certificate-card-top"><span className="certificate-seal"><GraduationCap size={24} /></span><span className="eyebrow">LEARNHUB CERTIFICATE</span></div><h3>{certificate.course.title}</h3><p>Earned by {certificate.student.name}</p><div className="certificate-card-footer"><span>{new Date(certificate.issuedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span><span className="text-link">View <ArrowRight size={14} /></span></div></Link>)}</div> : <EmptyState title="Your first certificate is waiting" body="Complete every lesson in a course and we’ll create your certificate automatically." action={<Link to="/my-learning" className="button button-primary">Go to my learning</Link>} />}</div>;
}

export function CertificateDetailPage() {
  const [certificate, setCertificate] = useState(null);
  const [error, setError] = useState('');
  const { id } = useParams();
  useEffect(() => { api.get(`/certificates/${id}`).then(({ data }) => setCertificate(data.data.certificate)).catch((requestError) => setError(getErrorMessage(requestError))); }, [id]);
  if (error) return <div className="content-page"><EmptyState title="Certificate unavailable" body={error} action={<Link className="button button-primary" to="/certificates">Back to certificates</Link>} /></div>;
  if (!certificate) return <Loading label="Preparing your certificate…" />;
  return <div className="certificate-view-page"><div className="certificate-toolbar"><Link to="/certificates" className="text-link">← Back to certificates</Link><Button variant="outline" onClick={() => window.print()}><GraduationCap size={16} /> Print / Save as PDF</Button></div><article className="certificate-paper"><div className="certificate-frame"><div className="certificate-brand"><span className="brand-mark"><GraduationCap size={22} /></span> LEARNHUB</div><span className="eyebrow">A MILESTONE WORTH CELEBRATING</span><h1>Certificate<br /><em>of completion</em></h1><p className="certificate-intro">This is to proudly recognize that</p><h2>{certificate.student.name}</h2><p className="certificate-intro">has successfully completed the course</p><h3>{certificate.course.title}</h3><div className="certificate-signoff"><span><b>{new Date(certificate.issuedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</b><small>DATE COMPLETED</small></span><span className="certificate-seal"><GraduationCap size={27} /></span><span><b>{certificate.certificateNumber}</b><small>CERTIFICATE NUMBER</small></span></div></div></article></div>;
}

export function InstructorDashboardPage() {
  const { data, error, loading } = useRequest('/instructor/analytics');
  if (loading) return <Loading label="Gathering your course insights…" />;
  const totals = data?.totals || {};
  return <div className="dashboard-page"><PageHeading eyebrow="INSTRUCTOR STUDIO" title="Your teaching, in motion." description="See what’s resonating and who’s learning with you." action={<Link to="/instructor/courses" className="button button-primary"><Plus size={17} /> Create a course</Link>} />{error && <div className="alert alert-error">{error}</div>}<div className="stats-grid"><StatCard icon={BookOpen} label="Your courses" value={totals.courses ?? 0} tone="purple" /><StatCard icon={Users} label="Total learners" value={totals.enrollments ?? 0} tone="blue" /><StatCard icon={BadgeCheck} label="Completions" value={totals.completed ?? 0} tone="green" /><StatCard icon={Star} label="Average rating" value={Number(totals.averageRating || 0).toFixed(1)} note={`${totals.reviewCount || 0} learner reviews`} tone="yellow" /></div><div className="dashboard-section-heading"><div><span className="eyebrow">COURSE PERFORMANCE</span><h2>Your courses at a glance</h2></div><Link to="/instructor/courses" className="text-link">Manage courses <ArrowRight size={15} /></Link></div>{data?.courses?.length ? <div className="table-card"><table><thead><tr><th>Course</th><th>Students</th><th>Completed</th><th>Rating</th><th>Status</th></tr></thead><tbody>{data.courses.map((course) => <tr key={course.id}><td><Link to={`/courses/${course.id}`} className="table-title">{course.title}</Link></td><td>{course.enrollments}</td><td>{course.completed}</td><td><span className="rating"><Star size={13} fill="currentColor" /> {Number(course.averageRating).toFixed(1)}</span></td><td><span className={`status-pill ${course.published ? 'published' : ''}`}>{course.published ? 'Published' : 'Draft'}</span></td></tr>)}</tbody></table></div> : <EmptyState title="Ready when you are" body="Create your first course and start sharing what you know." action={<Link to="/instructor/courses" className="button button-primary">Create a course</Link>} />}<div className="dashboard-section-heading"><div><span className="eyebrow">RECENT ACTIVITY</span><h2>Latest enrollments</h2></div><Link to="/instructor/students" className="text-link">All students <ArrowRight size={15} /></Link></div>{data?.recentEnrollments?.length ? <div className="table-card"><table><thead><tr><th>Student</th><th>Course</th><th>Progress</th><th>Joined</th></tr></thead><tbody>{data.recentEnrollments.slice(0, 5).map((row) => <tr key={row.id}><td>{row.student.name}<small className="table-sub">{row.student.email}</small></td><td>{row.course.title}</td><td>{row.progress}%</td><td>{new Date(row.enrolledAt).toLocaleDateString()}</td></tr>)}</tbody></table></div> : <p className="muted-copy">Your latest student enrollments will appear here.</p>}</div>;
}

const emptyCourse = { title: '', shortDescription: '', description: '', category: 'Development', level: 'Beginner', language: 'English', price: 0, thumbnail: '', published: false };
const emptyLesson = { title: '', description: '', videoUrl: '', durationMinutes: 0 };

export function InstructorCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(null);
  const [editing, setEditing] = useState('');
  const [busy, setBusy] = useState(false);
  const [lessonsCourse, setLessonsCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [lessonForm, setLessonForm] = useState(emptyLesson);
  const [editingLesson, setEditingLesson] = useState('');
  const load = () => api.get('/courses/manage/mine').then(({ data }) => setCourses(data.data.courses)).catch((requestError) => setError(getErrorMessage(requestError))).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);
  const startEdit = (course) => { setEditing(course.id); setForm({ ...course }); setError(''); };
  const saveCourse = async (event) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      if (editing) await api.put(`/courses/${editing}`, form);
      else await api.post('/courses', form);
      setForm(null); setEditing(''); await load();
    } catch (requestError) { setError(getErrorMessage(requestError)); }
    finally { setBusy(false); }
  };
  const removeCourse = async (course) => {
    if (!window.confirm(`Delete “${course.title}” and its lessons, reviews, and enrollments? This cannot be undone.`)) return;
    try { await api.delete(`/courses/${course.id}`); setCourses((items) => items.filter((item) => item.id !== course.id)); }
    catch (requestError) { setError(getErrorMessage(requestError)); }
  };
  const openLessons = async (course) => {
    setLessonsCourse(course); setError('');
    try { const { data } = await api.get(`/courses/${course.id}`); setLessons(data.data.lessons.map((lesson) => ({ ...lesson, _id: lesson.id }))); }
    catch (requestError) { setError(getErrorMessage(requestError)); }
  };
  const saveLesson = async (event) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      if (editingLesson) await api.put(`/lessons/${editingLesson}`, lessonForm);
      else await api.post(`/courses/${lessonsCourse.id}/lessons`, lessonForm);
      setLessonForm(emptyLesson); setEditingLesson('');
      await openLessons(lessonsCourse);
    } catch (requestError) { setError(getErrorMessage(requestError)); }
    finally { setBusy(false); }
  };
  const removeLesson = async (lesson) => {
    if (!window.confirm(`Delete lesson “${lesson.title}”?`)) return;
    try { await api.delete(`/lessons/${lesson.id || lesson._id}`); await openLessons(lessonsCourse); }
    catch (requestError) { setError(getErrorMessage(requestError)); }
  };
  const moveLesson = async (index, direction) => {
    const ordered = [...lessons];
    const destination = index + direction;
    if (destination < 0 || destination >= ordered.length) return;
    [ordered[index], ordered[destination]] = [ordered[destination], ordered[index]];
    try {
      await api.put(`/courses/${lessonsCourse.id}/lessons/reorder`, {
        lessonIds: ordered.map((lesson) => lesson.id || lesson._id),
      });
      await openLessons(lessonsCourse);
    } catch (requestError) { setError(getErrorMessage(requestError)); }
  };
  if (loading) return <Loading label="Loading your course studio…" />;
  return <div className="dashboard-page"><PageHeading eyebrow="INSTRUCTOR STUDIO" title="Your courses" description="Create useful learning experiences and keep your curriculum fresh." action={<Button onClick={() => { setForm({ ...emptyCourse }); setEditing(''); setError(''); }}><Plus size={17} /> New course</Button>} />{error && <div className="alert alert-error">{error}</div>}{courses.length ? <div className="managed-course-list">{courses.map((course) => <article className="managed-course" key={course.id}><div className="managed-course-art"><BookOpen size={22} /></div><div className="managed-course-copy"><div className="managed-course-meta"><span className={`status-pill ${course.published ? 'published' : ''}`}>{course.published ? 'Published' : 'Draft'}</span><span>{course.category}</span></div><h3>{course.title}</h3><p>{course.shortDescription}</p><div className="managed-course-stats"><span><Users size={14} /> {course.enrollmentCount || 0} students</span><span><BookOpen size={14} /> {course.lessonCount || 0} lessons</span><span><Star size={14} fill="currentColor" /> {Number(course.averageRating).toFixed(1)}</span></div></div><div className="managed-course-actions"><Button variant="outline" onClick={() => openLessons(course)}><BookOpen size={15} /> Lessons</Button><Button variant="light" onClick={() => startEdit(course)}><Pencil size={15} /> Edit</Button><button className="icon-button danger-icon" aria-label="Delete course" onClick={() => removeCourse(course)}><Trash2 size={17} /></button></div></article>)}</div> : <EmptyState title="Your teaching studio is ready" body="Create your first course, add a few lessons, and publish when you’re ready." action={<Button onClick={() => setForm({ ...emptyCourse })}><Plus size={16} /> Create course</Button>} />}{form && <Modal title={editing ? 'Edit your course' : 'Create a course'} onClose={() => setForm(null)}><form className="stack-form" onSubmit={saveCourse}><label>Course title<input required minLength={4} maxLength={140} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label><label>Short description<input required minLength={10} maxLength={180} value={form.shortDescription} onChange={(event) => setForm({ ...form, shortDescription: event.target.value })} placeholder="What will learners get out of it?" /></label><label>Full description<textarea required minLength={20} maxLength={5000} rows="4" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label><div className="form-grid"><label>Category<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{['Development', 'Design', 'Business', 'Data Science', 'Marketing', 'Photography'].map((item) => <option key={item}>{item}</option>)}</select></label><label>Level<select value={form.level} onChange={(event) => setForm({ ...form, level: event.target.value })}>{['Beginner', 'Intermediate', 'Advanced'].map((item) => <option key={item}>{item}</option>)}</select></label><label>Price (PKR)<input type="number" min="0" max="1000000" step="1" value={form.price} onChange={(event) => setForm({ ...form, price: Number(event.target.value) })} /></label><label>Language<input maxLength={40} value={form.language} onChange={(event) => setForm({ ...form, language: event.target.value })} /></label></div><label>Thumbnail image URL <span className="input-hint">(optional)</span><input type="url" value={form.thumbnail || ''} onChange={(event) => setForm({ ...form, thumbnail: event.target.value })} placeholder="https://…" /></label><label className="checkbox-label"><input type="checkbox" checked={Boolean(form.published)} onChange={(event) => setForm({ ...form, published: event.target.checked })} /> Publish this course so learners can find it</label><div className="modal-actions"><Button type="button" variant="outline" onClick={() => setForm(null)}>Cancel</Button><Button disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Create course'} <ArrowRight size={15} /></Button></div></form></Modal>}{lessonsCourse && <Modal title={`Lessons · ${lessonsCourse.title}`} onClose={() => { setLessonsCourse(null); setLessonForm(emptyLesson); setEditingLesson(''); }}><form className="stack-form lesson-form" onSubmit={saveLesson}><label>Lesson title<input required minLength={2} value={lessonForm.title} onChange={(event) => setLessonForm({ ...lessonForm, title: event.target.value })} /></label><label>Video URL (YouTube or Vimeo)<input type="url" required value={lessonForm.videoUrl} onChange={(event) => setLessonForm({ ...lessonForm, videoUrl: event.target.value })} placeholder="https://…" /></label><label>Description<textarea rows="2" value={lessonForm.description} onChange={(event) => setLessonForm({ ...lessonForm, description: event.target.value })} /></label><label>Duration (minutes)<input type="number" min="0" max="600" value={lessonForm.durationMinutes} onChange={(event) => setLessonForm({ ...lessonForm, durationMinutes: Number(event.target.value) })} /></label><Button disabled={busy}>{editingLesson ? 'Save lesson' : 'Add lesson'} <Plus size={16} /></Button></form><div className="managed-lesson-list">{lessons.map((lesson, index) => <div className="managed-lesson" key={lesson.id || lesson._id}><span className="lesson-number">{String(index + 1).padStart(2, '0')}</span><b>{lesson.title}</b><div><button className="icon-button" aria-label={`Move ${lesson.title} up`} disabled={index === 0} onClick={() => moveLesson(index, -1)}><ArrowUp size={14} /></button><button className="icon-button" aria-label={`Move ${lesson.title} down`} disabled={index === lessons.length - 1} onClick={() => moveLesson(index, 1)}><ArrowDown size={14} /></button><button className="icon-button" aria-label={`Edit ${lesson.title}`} onClick={() => { setEditingLesson(lesson.id || lesson._id); setLessonForm({ title: lesson.title, description: lesson.description || '', videoUrl: lesson.videoUrl || '', durationMinutes: lesson.durationMinutes || 0 }); }}><Pencil size={15} /></button><button className="icon-button danger-icon" aria-label={`Delete ${lesson.title}`} onClick={() => removeLesson(lesson)}><Trash2 size={15} /></button></div></div>)}{!lessons.length && <p className="muted-copy">No lessons added yet.</p>}</div></Modal>}</div>;
}

function Modal({ title, children, onClose }) {
  useEffect(() => {
    const closeOnEscape = (event) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="modal-card" role="dialog" aria-modal="true" aria-label={title}><div className="modal-header"><h2>{title}</h2><button className="icon-button" onClick={onClose} aria-label="Close dialog"><X size={20} /></button></div><div className="modal-body">{children}</div></section></div>;
}

export function InstructorStudentsPage() {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    setLoading(true);
    api.get('/instructor/students', { params: courseId ? { courseId } : {} }).then(({ data }) => { setStudents(data.data.students); setCourses(data.data.courses); })
      .catch((requestError) => setError(getErrorMessage(requestError))).finally(() => setLoading(false));
  }, [courseId]);
  const filtered = students.filter((item) => `${item.student.name} ${item.student.email} ${item.course.title}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="dashboard-page"><PageHeading eyebrow="YOUR LEARNERS" title="Students" description="See who’s learning from you and how far they’ve come." />{error && <div className="alert alert-error">{error}</div>}<div className="table-toolbar"><label className="search-field"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a student…" /></label><select value={courseId} onChange={(event) => setCourseId(event.target.value)} aria-label="Filter by course"><option value="">All your courses</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</select></div>{loading ? <Loading /> : filtered.length ? <div className="table-card"><table><thead><tr><th>Student</th><th>Course</th><th>Progress</th><th>Status</th><th>Enrolled</th></tr></thead><tbody>{filtered.map((row) => <tr key={row.id}><td><b>{row.student.name}</b><small className="table-sub">{row.student.email}</small></td><td>{row.course.title}</td><td><div className="table-progress">{row.progress}%<ProgressBar value={row.progress} /></div></td><td><span className={`status-pill ${row.status}`}>{row.status}</span></td><td>{new Date(row.enrolledAt).toLocaleDateString()}</td></tr>)}</tbody></table></div> : <EmptyState title="No learners just yet" body="When students join one of your courses, they’ll show up here." />}</div>;
}

export function AdminDashboardPage() {
  const { data, error, loading } = useRequest('/admin/overview');
  const { data: activity } = useRequest('/admin/activity');
  if (loading) return <Loading label="Loading platform overview…" />;
  const totals = data?.totals || {};
  return <div className="dashboard-page"><PageHeading eyebrow="LEARNHUB ADMIN" title="A view of the whole picture." description="Platform health, new faces, and the latest learning activity." action={<Link to="/admin/users" className="button button-primary"><Users size={16} /> Manage users</Link>} />{error && <div className="alert alert-error">{error}</div>}<div className="stats-grid"><StatCard icon={Users} label="Total users" value={totals.users ?? 0} tone="purple" /><StatCard icon={GraduationCap} label="Students" value={totals.students ?? 0} tone="blue" /><StatCard icon={ShieldCheck} label="Instructors" value={totals.instructors ?? 0} tone="green" /><StatCard icon={BookOpen} label="Courses" value={totals.courses ?? 0} tone="yellow" /><StatCard icon={TrendingUp} label="Enrollments" value={totals.enrollments ?? 0} tone="purple" /><StatCard icon={BadgeCheck} label="Completions" value={totals.completed ?? 0} tone="green" /></div><div className="admin-overview-grid"><section><div className="dashboard-section-heading"><div><span className="eyebrow">RECENTLY JOINED</span><h2>New community members</h2></div><Link to="/admin/users" className="text-link">Manage users <ArrowRight size={15} /></Link></div>{data?.recentUsers?.length ? <div className="table-card"><table><thead><tr><th>Name</th><th>Role</th><th>Joined</th><th>Account</th></tr></thead><tbody>{data.recentUsers.map((person) => <tr key={person.id}><td><b>{person.name}</b><small className="table-sub">{person.email}</small></td><td><span className="role-pill">{person.role}</span></td><td>{new Date(person.createdAt).toLocaleDateString()}</td><td>{person.isActive ? 'Active' : 'Inactive'}</td></tr>)}</tbody></table></div> : <p className="muted-copy">New users will appear here.</p>}</section><section><div className="dashboard-section-heading"><div><span className="eyebrow">LEARNER FEEDBACK</span><h2>Recent reviews</h2></div></div>{activity?.reviews?.length ? <div className="activity-list">{activity.reviews.slice(0, 5).map((review) => <div className="activity-row" key={review.id}><span className="activity-icon"><Star size={15} fill="currentColor" /></span><span><b>{review.student}</b><small>reviewed {review.course}</small></span><strong>{review.rating}/5</strong></div>)}</div> : <div className="soft-empty"><ShieldCheck size={20} /><span>Course reviews will appear here as learners share feedback.</span></div>}</section></div><div className="dashboard-section-heading"><div><span className="eyebrow">ENROLLMENT PULSE</span><h2>Recent course enrollments</h2></div><Link to="/admin/courses" className="text-link">Browse courses <ArrowRight size={15} /></Link></div>{data?.recentEnrollments?.length ? <div className="table-card"><table><thead><tr><th>Student</th><th>Course</th><th>Status</th><th>Enrolled</th></tr></thead><tbody>{data.recentEnrollments.map((row) => <tr key={row.id}><td>{row.student}</td><td>{row.course}</td><td><span className={`status-pill ${row.status}`}>{row.status}</span></td><td>{new Date(row.enrolledAt).toLocaleDateString()}</td></tr>)}</tbody></table></div> : <p className="muted-copy">Enrollments will appear as learners join a course.</p>}</div>;
}

export function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [instructorForm, setInstructorForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const load = () => { setLoading(true); api.get('/admin/users', { params: { q: query || undefined, role: role || undefined } }).then(({ data }) => setUsers(data.data.users)).catch((requestError) => setError(getErrorMessage(requestError))).finally(() => setLoading(false)); };
  useEffect(() => { const timer = window.setTimeout(load, 250); return () => window.clearTimeout(timer); }, [query, role]);
  const updateUser = async (user, payload) => {
    try { const { data } = await api.patch(`/admin/users/${user.id}`, payload); setUsers((items) => items.map((item) => item.id === user.id ? data.data.user : item)); }
    catch (requestError) { setError(getErrorMessage(requestError)); }
  };
  const createInstructor = async (event) => {
    event.preventDefault(); setBusy(true); setError('');
    try { await api.post('/admin/instructors', instructorForm); setInstructorForm(null); load(); }
    catch (requestError) { setError(getErrorMessage(requestError)); }
    finally { setBusy(false); }
  };
  return <div className="dashboard-page"><PageHeading eyebrow="COMMUNITY MANAGEMENT" title="People make the platform." description="Manage accounts and invite new instructors." action={<Button onClick={() => setInstructorForm({ name: '', email: '', password: '' })}><Plus size={17} /> Add instructor</Button>} />{error && <div className="alert alert-error">{error}</div>}<div className="table-toolbar"><label className="search-field"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search names or email…" /></label><select value={role} onChange={(event) => setRole(event.target.value)} aria-label="Filter users by role"><option value="">All roles</option><option value="student">Students</option><option value="instructor">Instructors</option><option value="admin">Administrators</option></select></div>{loading ? <Loading /> : <div className="table-card"><table><thead><tr><th>Member</th><th>Role</th><th>Joined</th><th>Account status</th></tr></thead><tbody>{users.map((person) => <tr key={person.id}><td><b>{person.name}</b><small className="table-sub">{person.email}</small></td><td><select className="inline-select" value={person.role} onChange={(event) => updateUser(person, { role: event.target.value })} aria-label={`Change role for ${person.name}`}><option value="student">Student</option><option value="instructor">Instructor</option><option value="admin">Admin</option></select></td><td>{new Date(person.createdAt).toLocaleDateString()}</td><td><button className={`account-toggle ${person.isActive ? 'active' : ''}`} onClick={() => updateUser(person, { isActive: !person.isActive })}>{person.isActive ? 'Active' : 'Disabled'}</button></td></tr>)}</tbody></table>{!users.length && <div className="table-empty">No users match those filters.</div>}</div>}{instructorForm && <Modal title="Invite an instructor" onClose={() => setInstructorForm(null)}><form className="stack-form" onSubmit={createInstructor}><p className="muted-copy">Create an instructor account. Share the temporary password with them securely; they can update it from profile settings.</p><label>Full name<input required minLength={2} maxLength={80} value={instructorForm.name} onChange={(event) => setInstructorForm({ ...instructorForm, name: event.target.value })} /></label><label>Email address<input required type="email" value={instructorForm.email} onChange={(event) => setInstructorForm({ ...instructorForm, email: event.target.value })} /></label><label>Temporary password<input required type="password" minLength={8} maxLength={72} value={instructorForm.password} onChange={(event) => setInstructorForm({ ...instructorForm, password: event.target.value })} /></label><div className="modal-actions"><Button type="button" variant="outline" onClick={() => setInstructorForm(null)}>Cancel</Button><Button disabled={busy}>{busy ? 'Creating…' : 'Create instructor account'}</Button></div></form></Modal>}</div>;
}

export function AdminCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [courseForm, setCourseForm] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    Promise.all([
      api.get('/courses/manage/mine'),
      api.get('/admin/users', { params: { role: 'instructor' } }),
    ])
      .then(([courseResponse, instructorResponse]) => {
        setCourses(courseResponse.data.data.courses);
        setInstructors(instructorResponse.data.data.users.filter((user) => user.isActive));
      })
      .catch((requestError) => setError(getErrorMessage(requestError)))
      .finally(() => setLoading(false));
  }, []);
  const filtered = courses.filter((course) => `${course.title} ${course.instructor?.name}`.toLowerCase().includes(query.toLowerCase()));
  const newCourse = () => {
    setError('');
    setCourseForm({
      title: '',
      shortDescription: '',
      description: '',
      category: 'Development',
      level: 'Beginner',
      language: 'English',
      price: 0,
      thumbnail: '',
      published: false,
      instructorId: '',
    });
  };
  const deleteCourse = async (course) => {
    if (!window.confirm(`Delete “${course.title}” and its course data? This cannot be undone.`)) return;
    try { await api.delete(`/courses/${course.id}`); setCourses((items) => items.filter((item) => item.id !== course.id)); }
    catch (requestError) { setError(getErrorMessage(requestError)); }
  };
  const saveCourse = async (event) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const { id, ...payload } = courseForm;
      if (id) {
        const { data } = await api.put(`/courses/${id}`, payload);
        setCourses((items) => items.map((item) => item.id === id ? { ...item, ...data.data.course } : item));
      } else {
        const { data } = await api.post('/courses', payload);
        setCourses((items) => [{ ...data.data.course, enrollmentCount: 0 }, ...items]);
      }
      setCourseForm(null);
    } catch (requestError) { setError(getErrorMessage(requestError)); }
    finally { setBusy(false); }
  };
  return <div className="dashboard-page"><PageHeading eyebrow="COURSE OVERSIGHT" title="Courses across LearnHub" description="Review course visibility and create courses for instructors." action={<Button onClick={newCourse}><Plus size={17} /> Add course</Button>} />{error && <div className="alert alert-error">{error}</div>}<div className="table-toolbar"><label className="search-field"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search course or instructor…" /></label><span className="muted-copy">{courses.length} courses</span></div>{loading ? <Loading /> : filtered.length ? <div className="table-card"><table><thead><tr><th>Course</th><th>Instructor</th><th>Students</th><th>Price</th><th>Visibility</th><th>Actions</th></tr></thead><tbody>{filtered.map((course) => <tr key={course.id}><td><Link className="table-title" to={`/courses/${course.id}`}>{course.title}</Link><small className="table-sub">{course.category}</small></td><td>{course.instructor?.name}</td><td>{course.enrollmentCount || 0}</td><td>{course.price ? `PKR ${Number(course.price).toLocaleString()}` : 'Free'}</td><td><span className={`status-pill ${course.published ? 'published' : ''}`}>{course.published ? 'Published' : 'Draft'}</span></td><td><div className="table-actions"><button className="icon-button" onClick={() => setCourseForm({ ...course })} aria-label={`Edit ${course.title}`}><Pencil size={15} /></button><button className="icon-button danger-icon" onClick={() => deleteCourse(course)} aria-label={`Delete ${course.title}`}><Trash2 size={16} /></button></div></td></tr>)}</tbody></table></div> : <EmptyState title="No matching courses" body="Try a different search term." />}{courseForm && <Modal title={courseForm.id ? 'Edit course' : 'Add course'} onClose={() => setCourseForm(null)}><form className="stack-form" onSubmit={saveCourse}><label>Course title<input required minLength={4} maxLength={140} value={courseForm.title} onChange={(event) => setCourseForm({ ...courseForm, title: event.target.value })} /></label><label>Short description<input required minLength={10} maxLength={180} value={courseForm.shortDescription} onChange={(event) => setCourseForm({ ...courseForm, shortDescription: event.target.value })} /></label><label>Full description<textarea required minLength={20} maxLength={5000} rows="4" value={courseForm.description} onChange={(event) => setCourseForm({ ...courseForm, description: event.target.value })} /></label><div className="form-grid"><label>Category<select value={courseForm.category} onChange={(event) => setCourseForm({ ...courseForm, category: event.target.value })}>{['Development', 'Design', 'Business', 'Data Science', 'Marketing', 'Photography'].map((item) => <option key={item}>{item}</option>)}</select></label><label>Level<select value={courseForm.level} onChange={(event) => setCourseForm({ ...courseForm, level: event.target.value })}>{['Beginner', 'Intermediate', 'Advanced'].map((item) => <option key={item}>{item}</option>)}</select></label><label>Price (PKR)<input type="number" min="0" max="1000000" step="1" value={courseForm.price} onChange={(event) => setCourseForm({ ...courseForm, price: Number(event.target.value) })} /></label><label>Language<input maxLength={40} value={courseForm.language} onChange={(event) => setCourseForm({ ...courseForm, language: event.target.value })} /></label></div>{!courseForm.id && <label>Instructor<select value={courseForm.instructorId} onChange={(event) => setCourseForm({ ...courseForm, instructorId: event.target.value })}><option value="">Assign to me (admin)</option>{instructors.map((instructor) => <option key={instructor.id} value={instructor.id}>{instructor.name} — {instructor.email}</option>)}</select></label>}<label>Thumbnail image URL<input type="url" value={courseForm.thumbnail || ''} onChange={(event) => setCourseForm({ ...courseForm, thumbnail: event.target.value })} /></label><label className="checkbox-label"><input type="checkbox" checked={Boolean(courseForm.published)} onChange={(event) => setCourseForm({ ...courseForm, published: event.target.checked })} /> Published in the public catalog</label><div className="modal-actions"><Button type="button" variant="outline" onClick={() => setCourseForm(null)}>Cancel</Button><Button disabled={busy}>{busy ? 'Saving…' : courseForm.id ? 'Save changes' : 'Create course'} <Check size={15} /></Button></div></form></Modal>}</div>;
}

export function ProfilePage() {
  const { user, setUser, logout } = useAuth();
  const [profile, setProfile] = useState({ name: user?.name || '', headline: user?.headline || '', bio: user?.bio || '' });
  const [password, setPassword] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const saveProfile = async (event) => {
    event.preventDefault(); setBusy(true); setError(''); setNotice('');
    try { const { data } = await api.put('/auth/profile', profile); setUser(data.data.user); localStorage.setItem('learnhub_user', JSON.stringify(data.data.user)); setNotice('Your profile has been updated.'); }
    catch (requestError) { setError(getErrorMessage(requestError)); }
    finally { setBusy(false); }
  };
  const changePassword = async (event) => {
    event.preventDefault(); setError(''); setNotice('');
    if (password.newPassword !== password.confirmPassword) return setError('Your new passwords don’t match.');
    setBusy(true);
    try { await api.put('/auth/password', password); logout(); window.location.assign('/login'); }
    catch (requestError) { setError(getErrorMessage(requestError)); setBusy(false); }
  };
  return <div className="dashboard-page"><PageHeading eyebrow="YOUR ACCOUNT" title="Profile settings" description="Keep your details up to date and your account secure." />{error && <div className="alert alert-error">{error}</div>}{notice && <div className="alert alert-success">{notice}</div>}<div className="settings-grid"><form className="settings-card stack-form" onSubmit={saveProfile}><div><span className="eyebrow">YOUR DETAILS</span><h2>Profile information</h2></div><label>Full name<input required minLength={2} maxLength={80} value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} /></label><label>Email address<input value={user?.email || ''} disabled /><small>Email address can’t be changed here.</small></label><label>Professional headline<input maxLength={120} value={profile.headline} onChange={(event) => setProfile({ ...profile, headline: event.target.value })} placeholder="e.g. Product designer & lifelong learner" /></label><label>About you<textarea rows="4" maxLength={500} value={profile.bio} onChange={(event) => setProfile({ ...profile, bio: event.target.value })} placeholder="A little about what you do and what you love learning…" /></label><Button disabled={busy}>Save profile <Check size={16} /></Button></form><form className="settings-card stack-form" onSubmit={changePassword}><div><span className="eyebrow">ACCOUNT SECURITY</span><h2>Change your password</h2><p>Changing your password signs out other active sessions.</p></div><label>Current password<input type="password" required autoComplete="current-password" value={password.currentPassword} onChange={(event) => setPassword({ ...password, currentPassword: event.target.value })} /></label><label>New password<input type="password" required minLength={8} maxLength={72} autoComplete="new-password" value={password.newPassword} onChange={(event) => setPassword({ ...password, newPassword: event.target.value })} /></label><label>Confirm new password<input type="password" required minLength={8} autoComplete="new-password" value={password.confirmPassword} onChange={(event) => setPassword({ ...password, confirmPassword: event.target.value })} /></label><Button variant="outline" disabled={busy}>Update password <ShieldCheck size={16} /></Button></form></div></div>;
}
