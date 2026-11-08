import { Link } from 'react-router-dom';
import { BookOpen, Clock3, Star, ArrowRight, LoaderCircle, SearchX, Sparkles } from 'lucide-react';

export function Button({ children, variant = 'primary', className = '', ...props }) {
  return <button className={`button button-${variant} ${className}`} {...props}>{children}</button>;
}

export function Loading({ label = 'Loading your learning space…' }) {
  return <div className="loading-state"><LoaderCircle className="spin" size={23} /><span>{label}</span></div>;
}

export function EmptyState({ title, body, action }) {
  return <div className="empty-state"><span className="empty-icon"><SearchX size={22} /></span><h3>{title}</h3><p>{body}</p>{action}</div>;
}

export function PageHeading({ eyebrow, title, description, action }) {
  return <div className="page-heading"><div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h1>{title}</h1>{description && <p>{description}</p>}</div>{action}</div>;
}

export function CourseCard({ course }) {
  const colors = ['lavender', 'mint', 'peach', 'blue'];
  const color = colors[(String(course.id).charCodeAt(0) || 0) % colors.length];
  return (
    <article className="course-card">
      <Link to={`/courses/${course.id}`} className={`course-cover ${color}`} aria-label={`View ${course.title}`}>
        {course.thumbnail ? <img src={course.thumbnail} alt="" /> : <div className="cover-art"><span className="cover-orbit" /><BookOpen size={31} /><span>LEARNHUB / CLASS {String(course.id).slice(-3)}</span></div>}
        <span className="course-category">{course.category}</span>
      </Link>
      <div className="course-card-body">
        <div className="course-meta"><span>{course.level || 'All levels'}</span><span className="rating"><Star size={14} fill="currentColor" /> {Number(course.averageRating || 0).toFixed(1)} <small>({course.reviewCount || 0})</small></span></div>
        <Link to={`/courses/${course.id}`} className="course-title"><h3>{course.title}</h3></Link>
        <p className="course-description">{course.shortDescription}</p>
        <div className="course-instructor">{course.instructor?.name || 'LearnHub instructor'}<span>{course.lessonCount || 0} lessons</span></div>
        <div className="course-card-bottom"><strong>{course.price > 0 ? `PKR ${Number(course.price).toLocaleString()}` : 'Free'}</strong><Link to={`/courses/${course.id}`} aria-label={`View ${course.title}`} className="round-arrow"><ArrowRight size={17} /></Link></div>
      </div>
    </article>
  );
}

export function StatCard({ icon: Icon = Sparkles, label, value, note, tone = 'purple' }) {
  return <div className="stat-card"><span className={`stat-icon ${tone}`}><Icon size={20} /></span><div><span className="stat-label">{label}</span><strong>{value ?? '—'}</strong>{note && <small>{note}</small>}</div></div>;
}

export function ProgressBar({ value = 0 }) {
  return <div className="progress-track" role="progressbar" aria-valuenow={value} aria-valuemin="0" aria-valuemax="100"><span style={{ width: `${Math.min(100, Math.max(0, value))}%` }} /></div>;
}

export function CourseMiniMeta({ duration }) {
  return <span className="mini-meta"><Clock3 size={14} /> {duration ? `${duration} min` : 'Self-paced'}</span>;
}
