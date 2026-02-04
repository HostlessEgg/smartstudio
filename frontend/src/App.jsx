import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import ToastContainer from './components/ToastContainer';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CourseView from './pages/CourseView';
import CourseCreator from './pages/CourseCreator';
import QuizCreate from './pages/QuizCreate';
import QuizTake from './pages/QuizTake';
import ForumList from './pages/ForumList';
import ForumThread from './pages/ForumThread';
import CalendarPage from './pages/Calendar';
import AssignmentView from './pages/AssignmentView';
import RepresentativeDashboard from './pages/RepresentativeDashboard';
import AdminSubjects from './pages/AdminSubjects';
import BulkImportPage from './pages/BulkImportPage';
import AuditLogPage from './pages/AuditLogPage';
import SubmissionInbox from './pages/SubmissionInbox';
import MyProgressPage from './pages/MyProgressPage';
import SubmissionReview from './pages/SubmissionReview';
import RepresentativeSettings from './pages/RepresentativeSettings';
import CalendarIcalExport from './pages/CalendarIcalExport';
import UserAdminPage from './pages/UserAdminPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminAudits from './pages/AdminAudits';
import CourseStructureEditor from './pages/CourseStructureEditor';
import ConsentAuditView from './pages/ConsentAuditView';
import MessagingComponent from './components/MessagingComponent';
import CohortManagement from './pages/CohortManagement';
import CalendarAdmin from './pages/CalendarAdmin';
import MySubmissionsPage from './pages/MySubmissionsPage';
import CertificateView from './pages/CertificateView';
import TeacherSubjects from './pages/TeacherSubjects';
import TeacherCourses from './pages/TeacherCourses';
import StudentSubjects from './pages/StudentSubjects';
import StudentAssignments from './pages/StudentAssignments';
import './App.css';

function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading">Cargando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" />;
  }

  return children;
}

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Router>
          <div className="App app-bg" style={{ minHeight: '100vh' }}>
            <AppHeader />
            <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/dashboard" />} />
            
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/course/:id" element={
              <ProtectedRoute>
                <CourseView />
              </ProtectedRoute>
            } />
            
            <Route path="/create-course" element={
              <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                <CourseCreator />
              </ProtectedRoute>
            } />

            <Route path="/quiz/create" element={
              <ProtectedRoute allowedRoles={["teacher","admin"]}>
                <QuizCreate />
              </ProtectedRoute>
            } />

            <Route path="/quiz/take/:lessonId" element={
              <ProtectedRoute>
                <QuizTake />
              </ProtectedRoute>
            } />

            <Route path="/forums/course/:courseId" element={
              <ProtectedRoute>
                <ForumList />
              </ProtectedRoute>
            } />

            <Route path="/forums/thread/:threadId" element={
              <ProtectedRoute>
                <ForumThread />
              </ProtectedRoute>
            } />
            <Route path="/calendar" element={
              <ProtectedRoute>
                <CalendarPage />
              </ProtectedRoute>
            } />
            <Route path="/assignments/:id" element={
              <ProtectedRoute>
                <AssignmentView />
              </ProtectedRoute>
            } />
            <Route path="/representative" element={
              <ProtectedRoute>
                <RepresentativeDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <UserAdminPage />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/audits" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminAudits />
              </ProtectedRoute>
            } />
            <Route path="/admin/import" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <BulkImportPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/audit" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AuditLogPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/import/preview" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                {/* placeholder: preview modal route (mock) */}
                <BulkImportPage />
              </ProtectedRoute>
            } />
            <Route path="/course-structure" element={
              <ProtectedRoute allowedRoles={["teacher","admin"]}>
                <CourseStructureEditor />
              </ProtectedRoute>
            } />
            <Route path="/consent-audit" element={
              <ProtectedRoute allowedRoles={["admin","representative"]}>
                <ConsentAuditView />
              </ProtectedRoute>
            } />
            <Route path="/admin/subjects" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminSubjects />
              </ProtectedRoute>
            } />
            <Route path="/messaging" element={
              <ProtectedRoute>
                <MessagingComponent />
              </ProtectedRoute>
            } />
            <Route path="/cohorts" element={
              <ProtectedRoute allowedRoles={["teacher","admin"]}>
                <CohortManagement />
              </ProtectedRoute>
            } />
            <Route path="/admin/calendar" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <CalendarAdmin />
              </ProtectedRoute>
            } />
            <Route path="/teacher/subjects" element={
              <ProtectedRoute allowedRoles={["teacher"]}>
                <TeacherSubjects />
              </ProtectedRoute>
            } />
            <Route path="/teacher/courses" element={
              <ProtectedRoute allowedRoles={["teacher"]}>
                <TeacherCourses />
              </ProtectedRoute>
            } />
            <Route path="/teacher/submissions" element={
              <ProtectedRoute allowedRoles={["teacher"]}>
                <SubmissionInbox />
              </ProtectedRoute>
            } />
            <Route path="/teacher/submissions/:id" element={
              <ProtectedRoute allowedRoles={["teacher"]}>
                <SubmissionReview />
              </ProtectedRoute>
            } />
            <Route path="/student/subjects" element={
              <ProtectedRoute allowedRoles={["student"]}>
                <StudentSubjects />
              </ProtectedRoute>
            } />
            <Route path="/student/assignments" element={
              <ProtectedRoute allowedRoles={["student"]}>
                <StudentAssignments />
              </ProtectedRoute>
            } />
            <Route path="/my/progress" element={
              <ProtectedRoute allowedRoles={["student"]}>
                <MyProgressPage />
              </ProtectedRoute>
            } />
            <Route path="/my/submissions" element={
              <ProtectedRoute allowedRoles={["student"]}>
                <MySubmissionsPage />
              </ProtectedRoute>
            } />
            <Route path="/certificate" element={
              <ProtectedRoute>
                <CertificateView />
              </ProtectedRoute>
            } />
            <Route path="/representative/settings" element={
              <ProtectedRoute allowedRoles={["representative"]}>
                <RepresentativeSettings />
              </ProtectedRoute>
            } />
            <Route path="/calendar/ical" element={
              <ProtectedRoute>
                <CalendarIcalExport />
              </ProtectedRoute>
            } />
            </Routes>
          </div>
          <ToastContainer />
        </Router>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;

function AppHeader() {
  const { user, logout } = useAuth();
  return (
    <header style={{ background: 'rgba(255,255,255,0.9)', borderBottom: '1px solid var(--border)', backdropFilter: 'blur(8px)', position: 'sticky', top: 0, zIndex: 40 }}>
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <Link to="/dashboard" style={{ fontWeight: 600, fontSize: 16, letterSpacing: '-0.02em' }}>SMARTSTUDIO</Link>
          {user && (
            <>
              <Link to="/calendar" className="muted">Calendario</Link>
              <Link to="/forums/course/1" className="muted">Foros</Link>
            </>
          )}
          {user && user.role === 'admin' && (
            <>
              <Link to="/admin/subjects" className="muted">Materias</Link>
              <Link to="/admin/users" className="muted">Usuarios</Link>
            </>
          )}
          {user && user.role === 'teacher' && (
            <>
              <Link to="/teacher/subjects" className="muted">Mis Materias</Link>
              <Link to="/teacher/courses" className="muted">Mis Cursos</Link>
            </>
          )}
          {user && user.role === 'student' && (
            <>
              <Link to="/student/subjects" className="muted">Mis Materias</Link>
              <Link to="/student/assignments" className="muted">Mis Tareas</Link>
              <Link to="/my/submissions" className="muted">Mis Entregas</Link>
            </>
          )}
          {user && (user.role === 'teacher' || user.role === 'admin') && (
            <Link to="/course-structure" className="muted">Editor de Curso</Link>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {user ? (
            <>
              <span className="muted" style={{ fontSize: 13 }}>{user.name || user.email}</span>
              {user.role === 'admin' && (
                <Link to="/representative" className="muted">Representante</Link>
              )}
              <button onClick={logout} className="btn-ghost" style={{ padding: '6px 10px', fontSize: 13 }}>Cerrar sesión</button>
            </>
          ) : (
            <Link to="/login" className="btn-primary" style={{ padding: '8px 12px', fontSize: 13 }}>Iniciar sesión</Link>
          )}
        </div>
      </div>
    </header>
  );
}