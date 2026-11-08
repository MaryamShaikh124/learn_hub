import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BadgeCheck, BookOpen, Check, ChevronLeft, ChevronRight, CircleCheck, CirclePlay, Menu, X } from 'lucide-react';
import api, { getErrorMessage } from '../services/api';
import { Button, Loading, ProgressBar } from '../components/Shared';

function videoEmbed(url) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtu.be')) return `https://www.youtube-nocookie.com/embed/${parsed.pathname.slice(1)}`;
    if (parsed.hostname.includes('youtube.com')) {
      const id = parsed.searchParams.get('v') || parsed.pathname.split('/').filter(Boolean).pop();
      if (id) return `https://www.youtube-nocookie.com/embed/${id}`;
    }
    if (parsed.hostname.includes('vimeo.com')) {
      const id = parsed.pathname.split('/').filter(Boolean).pop();
      if (id && /^\d+$/.test(id)) return `https://player.vimeo.com/video/${id}`;
    }
    return url;
  } catch {
    return '';
  }
}

export default function LearningPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState(0);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showLessons, setShowLessons] = useState(false);
  const load = async () => {
    const { data: response } = await api.get(`/enrollments/learn/${courseId}`);
    setData(response.data);
  };
  useEffect(() => { setData(null); setError(''); load().catch((requestError) => setError(getErrorMessage(requestError))); }, [courseId]);
  const lessons = data?.lessons || [];
  const current = lessons[selected];
  const completed = useMemo(() => new Set((data?.enrollment?.completedLessons || []).map((id) => String(id))), [data]);
  if (error) return <div className="learning-error"><span className="eyebrow">LEARNING ROOM</span><h1>This course isn’t available yet.</h1><p>{error}</p><Link className="button button-primary" to="/my-learning">Back to my learning</Link></div>;
  if (!data) return <Loading label="Opening your learning room…" />;
  const markComplete = async () => {
    if (!current) return;
    setBusy(true); setError('');
    try {
      const { data: response } = await api.post(`/enrollments/${courseId}/lessons/${current.id || current._id}/complete`);
      setData((previous) => ({ ...previous, enrollment: { ...previous.enrollment, progress: response.data.progress, status: response.data.status, completedLessons: response.data.completedLessons } }));
      if (response.data.status === 'completed') {
        setError('');
      } else if (selected < lessons.length - 1) setSelected((index) => index + 1);
    } catch (requestError) { setError(getErrorMessage(requestError)); }
    finally { setBusy(false); }
  };
  return <div className="learning-room">
    <header className="learning-topbar"><Link to="/my-learning" className="learning-back"><ArrowLeft size={17} /> My learning</Link><span className="learning-top-title">{data.course.title}</span><button className="icon-button lesson-toggle" onClick={() => setShowLessons(!showLessons)} aria-label="Toggle lesson list">{showLessons ? <X size={19} /> : <Menu size={19} />}</button><div className="learning-progress-meta"><span>{data.enrollment.progress || 0}% complete</span><ProgressBar value={data.enrollment.progress} /></div></header>
    <div className="learning-workspace"><aside className={`lesson-sidebar ${showLessons ? 'show' : ''}`}><div className="lesson-sidebar-header"><span className="eyebrow">YOUR COURSE</span><h2>{data.course.title}</h2><p>{data.course.instructor?.name}</p></div><div className="lesson-overall-progress"><div><span>Course progress</span><b>{data.enrollment.progress || 0}%</b></div><ProgressBar value={data.enrollment.progress} /></div><div className="lesson-nav-list">{lessons.map((lesson, index) => <button key={lesson.id || lesson._id} onClick={() => { setSelected(index); setShowLessons(false); }} className={`lesson-nav-item ${selected === index ? 'selected' : ''}`}><span className={`lesson-nav-icon ${completed.has(String(lesson.id || lesson._id)) ? 'done' : ''}`}>{completed.has(String(lesson.id || lesson._id)) ? <Check size={15} /> : <span>{String(index + 1).padStart(2, '0')}</span>}</span><span className="lesson-nav-copy"><b>{lesson.title}</b><small>{lesson.durationMinutes ? `${lesson.durationMinutes} min` : 'Lesson'}</small></span><ChevronRight size={15} className="lesson-nav-chevron" /></button>)}{!lessons.length && <p className="lesson-empty">Your instructor is adding course content.</p>}</div><Link to={`/courses/${courseId}`} className="course-info-link"><BookOpen size={16} /> Course overview <ArrowRight size={14} /></Link></aside>
      <main className="lesson-stage">{current ? <><div className="lesson-stage-heading"><span className="eyebrow">LESSON {String(selected + 1).padStart(2, '0')} OF {String(lessons.length).padStart(2, '0')}</span><h1>{current.title}</h1></div><div className="video-frame">{current.videoUrl && videoEmbed(current.videoUrl) ? <iframe src={videoEmbed(current.videoUrl)} title={current.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen /> : <div className="video-unavailable"><CirclePlay size={40} /><p>This video link could not be embedded.</p><a href={current.videoUrl} target="_blank" rel="noreferrer">Open video in a new tab <ArrowRight size={14} /></a></div>}</div><div className="lesson-stage-bottom"><div><span className="eyebrow">A NOTE FROM YOUR INSTRUCTOR</span><p>{current.description || 'Take your time with this lesson. You can return whenever you need a refresher.'}</p></div><div className="lesson-stage-actions"><Button variant="outline" disabled={selected === 0} onClick={() => setSelected((index) => Math.max(0, index - 1))}><ChevronLeft size={16} /> Previous</Button><Button disabled={busy || completed.has(String(current.id || current._id))} onClick={markComplete}>{busy ? 'Saving…' : completed.has(String(current.id || current._id)) ? 'Lesson completed' : 'Mark complete'} {completed.has(String(current.id || current._id)) ? <CircleCheck size={16} /> : <Check size={16} />}</Button>{selected < lessons.length - 1 && <button className="next-lesson-link" onClick={() => setSelected((index) => index + 1)}>Next <ChevronRight size={16} /></button>}</div></div>{error && <div className="alert alert-error">{error}</div>}{data.enrollment.status === 'completed' && <div className="completion-banner"><BadgeCheck size={21} /><div><b>You did it. Course complete!</b><span>Your certificate is ready in your achievements.</span></div><Link to="/certificates">View certificate <ArrowRight size={15} /></Link></div>}</> : <div className="lesson-no-content"><span className="lesson-empty-icon"><BookOpen size={26} /></span><span className="eyebrow">READY WHEN YOU ARE</span><h1>Your course is taking shape.</h1><p>Your instructor hasn’t added any lessons yet. Check back soon.</p><Link to={`/courses/${courseId}`} className="text-link">Course overview <ArrowRight size={15} /></Link></div>}</main></div>
  </div>;
}
