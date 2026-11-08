import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { DashboardLayout, SiteLayout } from './components/Layout';
import { ProtectedRoute } from './components/Guards';
import {
  AdminCoursesPage,
  AdminDashboardPage,
  AdminPaymentsPage,
  AdminUsersPage,
  CertificateDetailPage,
  CertificatesPage,
  InstructorCoursesPage,
  InstructorDashboardPage,
  InstructorStudentsPage,
  MyLearningPage,
  PaymentHistoryPage,
  ProfilePage,
  StudentDashboardPage,
} from './pages/DashboardPages';
import { AuthPage, CourseDetailPage, CoursesPage, HomePage } from './pages/PublicPages';
import LearningPage from './pages/LearningPage';

function RoleLanding() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return <Navigate to={user ? user.role === 'admin' ? '/admin' : user.role === 'instructor' ? '/instructor' : '/dashboard' : '/'} replace />;
}

export default function App() {
  return <Routes>
    <Route element={<SiteLayout />}>
      <Route index element={<HomePage />} />
      <Route path="courses" element={<CoursesPage />} />
      <Route path="courses/:id" element={<CourseDetailPage />} />
      <Route path="login" element={<AuthPage mode="login" />} />
      <Route path="register" element={<AuthPage mode="register" />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route element={<ProtectedRoute roles={['student']} />}>
            <Route path="dashboard" element={<StudentDashboardPage />} />
            <Route path="my-learning" element={<MyLearningPage />} />
            <Route path="certificates" element={<CertificatesPage />} />
            <Route path="payments" element={<PaymentHistoryPage />} />
            <Route path="certificates/:id" element={<CertificateDetailPage />} />
            <Route path="learn/:courseId" element={<LearningPage />} />
          </Route>
          <Route element={<ProtectedRoute roles={['instructor']} />}>
            <Route path="instructor" element={<InstructorDashboardPage />} />
            <Route path="instructor/courses" element={<InstructorCoursesPage />} />
            <Route path="instructor/students" element={<InstructorStudentsPage />} />
          </Route>
          <Route element={<ProtectedRoute roles={['admin']} />}>
            <Route path="admin" element={<AdminDashboardPage />} />
            <Route path="admin/users" element={<AdminUsersPage />} />
            <Route path="admin/courses" element={<AdminCoursesPage />} />
            <Route path="admin/payments" element={<AdminPaymentsPage />} />
          </Route>
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Route>
      <Route path="*" element={<RoleLanding />} />
    </Route>
  </Routes>;
}
