import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
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
import CourseStructureEditor from './pages/CourseStructureEditor';
import ConsentAuditView from './pages/ConsentAuditView';
import MessagingComponent from './components/MessagingComponent';
import CohortManagement from './pages/CohortManagement';
import CalendarAdmin from './pages/CalendarAdmin';
import MySubmissionsPage from './pages/MySubmissionsPage';
import CertificateView from './pages/CertificateView';
import TeacherSubjects from './pages/TeacherSubjects';
import StudentSubjects from './pages/StudentSubjects';
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
    <AuthProvider>
      <Router>
        <div className="App">
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
      </Router>
    </AuthProvider>
  );
}

export default App;

function AppHeader() {
  const { user, logout } = useAuth();
  return (
    <header className="bg-white shadow p-3">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="font-bold text-lg">SMARTSTUDIO</Link>
          {user && (
            <>
              <Link to="/calendar" className="text-sm text-gray-600 hover:text-gray-900">Calendario</Link>
              <Link to="/forums/course/1" className="text-sm text-gray-600 hover:text-gray-900">Foros</Link>
            </>
          )}
          {user && user.role === 'admin' && (
            <>
              <Link to="/admin/subjects" className="text-sm text-gray-600 hover:text-gray-900">Materias</Link>
              <Link to="/admin/users" className="text-sm text-gray-600 hover:text-gray-900">Usuarios</Link>
            </>
          )}
          {user && user.role === 'teacher' && (
            <Link to="/teacher/subjects" className="text-sm text-gray-600 hover:text-gray-900">Mis Materias</Link>
          )}
          {user && user.role === 'student' && (
            <Link to="/student/subjects" className="text-sm text-gray-600 hover:text-gray-900">Mis Materias</Link>
          )}
          {user && (user.role === 'teacher' || user.role === 'admin') && (
            <Link to="/course-structure" className="text-sm text-gray-600 hover:text-gray-900">Editor de Curso</Link>
          )}
        </div>
        <div>
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-700">{user.name || user.email}</span>
              {user.role === 'admin' && (
                <Link to="/representative" className="text-sm text-gray-600 hover:text-gray-900">Representante</Link>
              )}
              <button onClick={logout} className="text-sm text-red-600">Cerrar sesión</button>
            </div>
          ) : (
            <Link to="/login" className="text-sm text-blue-600">Iniciar sesión</Link>
          )}
        </div>
      </div>
    </header>
  );
}