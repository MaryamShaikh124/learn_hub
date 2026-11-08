import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Bell, BookOpen, ChevronDown, CreditCard, GraduationCap, LayoutDashboard, LogOut, Menu, Search, Settings, Shield, Sparkles, Users, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function Notifications() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const load = async () => {
    const { data } = await api.get('/notifications');
    setItems(data.data.notifications);
    setUnread(data.data.unread);
  };
  useEffect(() => { if (localStorage.getItem('learnhub_token')) load().catch(() => {}); }, []);
  const markRead = async (item) => {
    if (!item.read) {
      await api.put(`/notifications/${item.id}/read`);
      setItems((previous) => previous.map((entry) => entry.id === item.id ? { ...entry, read: true } : entry));
      setUnread((count) => Math.max(0, count - 1));
    }
    setOpen(false);
  };
  return <div className="notification-wrap">
    <button className="icon-button notification-button" aria-label="Notifications" onClick={() => setOpen(!open)}><Bell size={19} />{unread > 0 && <span className="notification-count">{unread > 9 ? '9+' : unread}</span>}</button>
    {open && <div className="notification-panel"><div className="notification-header"><strong>Notifications</strong><button onClick={async () => { await api.put('/notifications/read-all'); setUnread(0); setItems(items.map((item) => ({ ...item, read: true }))); }}>Mark all read</button></div>{items.length ? items.slice(0, 6).map((item) => <Link key={item.id} to={item.link || '#'} onClick={() => markRead(item)} className={`notification-item ${item.read ? '' : 'unread'}`}><span className="notification-dot" /><span><b>{item.title}</b><small>{item.message}</small></span></Link>) : <p className="notification-empty">You’re all caught up.</p>}</div>}
  </div>;
}

function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  useEffect(() => setMobileOpen(false), [location.pathname]);
  const homeLink = user?.role === 'admin' ? '/admin' : user?.role === 'instructor' ? '/instructor' : '/dashboard';
  return <header className="site-header"><div className="header-inner">
    <Link to="/" className="brand"><span className="brand-mark"><GraduationCap size={21} /></span><span>learn<span>hub</span></span></Link>
    <button className="mobile-menu-toggle" aria-label={mobileOpen ? 'Close menu' : 'Open menu'} onClick={() => setMobileOpen(!mobileOpen)}>{mobileOpen ? <X /> : <Menu />}</button>
    <nav className={`main-nav ${mobileOpen ? 'open' : ''}`}>
      <NavLink to="/courses">Explore</NavLink>
      {user && <NavLink to={homeLink}>Dashboard</NavLink>}
      {user?.role === 'instructor' && <NavLink to="/instructor/courses">My courses</NavLink>}
      {user?.role === 'admin' && <NavLink to="/admin/users">Users</NavLink>}
    </nav>
    <div className="header-actions">
      <Link to="/courses" className="header-search" aria-label="Search courses"><Search size={18} /></Link>
      {user ? <><Notifications /><div className="user-menu"><Link to="/profile" className="user-avatar" aria-label="Profile settings">{user.name?.charAt(0).toUpperCase()}</Link><button className="text-button signout-button" onClick={() => { logout(); navigate('/'); }}><LogOut size={15} /> Sign out</button></div></> : <><Link className="login-link" to="/login">Log in</Link><Link className="button button-primary header-cta" to="/register">Get started <ChevronDown size={15} /></Link></>}
    </div>
  </div></header>;
}

function Footer() {
  return <footer className="site-footer"><div className="footer-inner"><Link to="/" className="brand"><span className="brand-mark"><GraduationCap size={21} /></span><span>learn<span>hub</span></span></Link><p>Skills for the work and life you want.</p><span>© {new Date().getFullYear()} LearnHub</span></div></footer>;
}

export function SiteLayout() {
  return <><Header /><main className="site-main"><Outlet /></main><Footer /></>;
}

const dashboards = {
  student: [{ to: '/dashboard', label: 'Overview', icon: LayoutDashboard }, { to: '/my-learning', label: 'My learning', icon: BookOpen }, { to: '/payments', label: 'Payment records', icon: CreditCard }, { to: '/certificates', label: 'Certificates', icon: GraduationCap }],
  instructor: [{ to: '/instructor', label: 'Overview', icon: LayoutDashboard }, { to: '/instructor/courses', label: 'Courses', icon: BookOpen }, { to: '/instructor/students', label: 'Students', icon: Users }],
  admin: [{ to: '/admin', label: 'Overview', icon: Shield }, { to: '/admin/users', label: 'User management', icon: Users }, { to: '/admin/courses', label: 'Courses', icon: BookOpen }, { to: '/admin/payments', label: 'Demo payments', icon: CreditCard }],
};

export function DashboardLayout() {
  const { user } = useAuth();
  const items = dashboards[user?.role] || dashboards.student;
  return <div className="dashboard-shell"><aside className="dashboard-sidebar"><Link to={user?.role === 'admin' ? '/admin' : user?.role === 'instructor' ? '/instructor' : '/dashboard'} className="sidebar-welcome"><span className="sidebar-user-icon"><Sparkles size={18} /></span><span><b>Your workspace</b><small>Learn something today</small></span></Link><span className="sidebar-section-label">MENU</span><nav>{items.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} end={to === '/dashboard' || to === '/instructor' || to === '/admin'}><Icon size={18} />{label}</NavLink>)}</nav><div className="sidebar-bottom"><Link to="/profile"><Settings size={17} /> Profile settings</Link><div className="sidebar-user"><span className="user-avatar">{user?.name?.charAt(0).toUpperCase()}</span><span><b>{user?.name}</b><small>{user?.role}</small></span></div></div></aside><section className="dashboard-content"><Outlet /></section></div>;
}
