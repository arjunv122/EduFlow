import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/auth/Login';
import StudentRegister from './pages/auth/StudentRegister';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Role-specific dashboards
import AdminDashboard from './pages/dashboard/AdminDashboard';
import FacultyDashboard from './pages/dashboard/FacultyDashboard';
import StudentDashboard from './pages/dashboard/StudentDashboard';

// Admin-exclusive pages
import Analytics from './pages/admin/Analytics';
import UserProvisioning from './pages/admin/UserProvisioning';
import AuditLog from './pages/admin/AuditLog';
import InstitutionSettings from './pages/admin/InstitutionSettings';

import AcademicsManager from './pages/academics/AcademicsManager';
import FacultyManager from './pages/faculty/FacultyManager';
import StudentManager from './pages/student/StudentManager';
import SubstitutionDashboard from './pages/substitutions/SubstitutionDashboard';
import AnnouncementsPage from './pages/announcements/AnnouncementsPage';
import ChangePassword from './pages/profile/ChangePassword';

// Attendance
import AttendanceDashboard from './pages/attendance/AttendanceDashboard';
import StudentAttendance from './pages/attendance/StudentAttendance';

// Assessments
import AssessmentDashboard from './pages/assessments/AssessmentDashboard';
import QuizBuilder from './pages/assessments/QuizBuilder';
import QuizAttempt from './pages/assessments/QuizAttempt';
import QuizResult from './pages/assessments/QuizResult';
import Gradebook from './pages/assessments/Gradebook';
import AssignmentBuilder from './pages/assessments/AssignmentBuilder';
import AssignmentView from './pages/assessments/AssignmentView';
import AssignmentSubmissions from './pages/assessments/AssignmentSubmissions';

// Student Leave
import StudentLeaveManager from './pages/student/StudentLeaveManager';

// Faculty / HOD
import HODLeaveApproval from './pages/faculty/HODLeaveApproval';
import MeetingScheduler from './pages/faculty/MeetingScheduler';

// Public landing page
import LandingPage from './pages/LandingPage';

// ─── Coming Soon placeholder ──────────────────────────────────────
const ComingSoon = ({ title, eta = 'Sprint 3' }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', height: '55vh', textAlign: 'center',
    border: '1px dashed var(--border)', borderRadius: 'var(--radius-xl)',
    padding: '3rem',
  }}>
    <p style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🚧</p>
    <h2 className="serif-heading page-title" style={{ marginBottom: '0.5rem' }}>{title}</h2>
    <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>
      This module is in active development — estimated release: <strong>{eta}</strong>
    </p>
  </div>
);

// ─── Unauthorized page ────────────────────────────────────────────
const Unauthorized = () => (
  <div style={{
    minHeight: '100vh', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    background: 'var(--bg-primary)', color: 'var(--text-primary)',
  }}>
    <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '3rem', color: 'var(--accent)' }}>403</h1>
    <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', margin: '0.5rem 0 1.5rem' }}>
      You do not have permission to access this page.
    </p>
    <a href="/login" style={{ color: 'var(--accent)', fontSize: '0.875rem' }}>← Back to login</a>
  </div>
);

function App() {
  return (
    <Routes>
      {/* ── Public Routes ─────────────────────────────────────── */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/register/student" element={<StudentRegister />} />

      {/* ── ADMIN Route Tree ─────────────────────────────────── */}
      <Route element={<ProtectedRoute allowedRoles={['admin', 'superadmin']}><MainLayout /></ProtectedRoute>}>
        <Route path="/dashboard/admin" element={<AdminDashboard />} />
        <Route path="/dashboard/admin/analytics" element={<Analytics />} />
        <Route path="/dashboard/admin/users"     element={<UserProvisioning />} />
        <Route path="/dashboard/admin/audit"     element={<AuditLog />} />
        <Route path="/dashboard/admin/settings"  element={<InstitutionSettings />} />
        <Route path="/academics"     element={<AcademicsManager />} />
        <Route path="/faculty"       element={<FacultyManager />} />
        <Route path="/students"      element={<StudentManager />} />
        <Route path="/substitutions" element={<SubstitutionDashboard />} />
      </Route>

      {/* ── FACULTY Route Tree ───────────────────────────────── */}
      <Route element={<ProtectedRoute allowedRoles={['faculty']}><MainLayout /></ProtectedRoute>}>
        <Route path="/dashboard/faculty" element={<FacultyDashboard />} />
        <Route path="/attendance"        element={<AttendanceDashboard />} />
        <Route path="/assessments"       element={<AssessmentDashboard />} />
        <Route path="/assessments/quiz/new"     element={<QuizBuilder />} />
        <Route path="/assessments/quiz/:quizId/manage" element={<QuizBuilder />} />
        <Route path="/assessments/assignment/new" element={<AssignmentBuilder />} />
        <Route path="/assessments/assignment/:id/submissions" element={<AssignmentSubmissions />} />
        <Route path="/gradebook"         element={<Gradebook />} />
        <Route path="/substitutions"     element={<SubstitutionDashboard />} />
        <Route path="/faculty/meetings"  element={<MeetingScheduler />} />
        <Route path="/faculty/leaves"    element={<HODLeaveApproval />} />
      </Route>

      {/* ── STUDENT Route Tree ───────────────────────────────── */}
      <Route element={<ProtectedRoute allowedRoles={['student']}><MainLayout /></ProtectedRoute>}>
        <Route path="/dashboard/student"     element={<StudentDashboard />} />
        <Route path="/student/attendance"    element={<StudentAttendance />} />
        <Route path="/student/assessments"   element={<AssessmentDashboard />} />
        <Route path="/assessments"           element={<AssessmentDashboard />} />
        <Route path="/assessments/quiz/:quizId" element={<QuizAttempt />} />
        <Route path="/assessments/quiz/:quizId/result" element={<QuizResult />} />
        <Route path="/assessments/assignment/:id" element={<AssignmentView />} />
        <Route path="/student/timetable"     element={<ComingSoon title="My Timetable" eta="Sprint 2" />} />
        <Route path="/student/leaves"        element={<StudentLeaveManager />} />
        <Route path="/student/meetings"      element={<MeetingScheduler />} />
      </Route>

      {/* ── SHARED Route Tree (All Roles) ──────────────────────── */}
      <Route element={<ProtectedRoute allowedRoles={['student', 'faculty', 'admin', 'superadmin']}><MainLayout /></ProtectedRoute>}>
        <Route path="/announcements"         element={<AnnouncementsPage />} />
        <Route path="/profile/password"      element={<ChangePassword />} />
        <Route path="/support"               element={<ComingSoon title="Support Tickets" eta="Sprint 2" />} />
      </Route>

      {/* ── Root redirect — sends to correct role tree ─────── */}
      <Route path="/dashboard" element={<ProtectedRoute><RootDashboardRedirect /></ProtectedRoute>} />

      {/* ── 404 ─────────────────────────────────────────────── */}
      <Route path="*" element={
        <div style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: 'var(--bg-primary)', color: 'var(--text-primary)',
        }}>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '3rem', color: 'var(--accent)' }}>404</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 1rem' }}>Page not found</p>
          <a href="/" style={{ color: 'var(--accent)', fontSize: '0.875rem' }}>← Go home</a>
        </div>
      } />
    </Routes>
  );
}

/** Reads role from auth and redirects to the correct dashboard tree */
const RootDashboardRedirect = () => {
  const { user } = useAuth();
  const ROLE_HOME = {
    student:    '/dashboard/student',
    faculty:    '/dashboard/faculty',
    admin:      '/dashboard/admin',
    superadmin: '/dashboard/admin',
  };
  return <Navigate to={ROLE_HOME[user?.role] || '/login'} replace />;
};

export default App;
