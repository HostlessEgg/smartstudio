import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, NavLink, Link, useLocation } from 'react-router-dom';
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
import CoursesPage from './pages/CoursesPage';
import GradesPage from './pages/GradesPage';
import AttendancePage from './pages/AttendancePage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import ResourcesPage from './pages/ResourcesPage';
import LibraryPage from './pages/LibraryPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import NotificationsPage from './pages/NotificationsPage';
import ForumsPage from './pages/ForumsPage';
import ProfileModal from './components/ProfileModal';
import NewMessageModal from './components/NewMessageModal';
import Button from './components/ui/Button';
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
            <AppLayout>
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
            <Route path="/courses" element={
              <ProtectedRoute>
                <CoursesPage />
              </ProtectedRoute>
            } />
            <Route path="/grades" element={
              <ProtectedRoute>
                <GradesPage />
              </ProtectedRoute>
            } />
            <Route path="/attendance" element={
              <ProtectedRoute>
                <AttendancePage />
              </ProtectedRoute>
            } />
            <Route path="/announcements" element={
              <ProtectedRoute>
                <AnnouncementsPage />
              </ProtectedRoute>
            } />
            <Route path="/resources" element={
              <ProtectedRoute>
                <ResourcesPage />
              </ProtectedRoute>
            } />
            <Route path="/library" element={
              <ProtectedRoute>
                <LibraryPage />
              </ProtectedRoute>
            } />
            <Route path="/reports" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <ReportsPage />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <SettingsPage />
              </ProtectedRoute>
            } />
            <Route path="/notifications" element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            } />
            <Route path="/forums" element={
              <ProtectedRoute>
                <ForumsPage />
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
            </AppLayout>
          </div>
          <ToastContainer />
        </Router>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;

function AppLayout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);
  const [newMessageOpen, setNewMessageOpen] = useState(false);

  if (!user || location.pathname === '/login') {
    return <>{children}</>;
  }

  const pageTitles = {
    '/dashboard': 'Panel principal',
    '/calendar': 'Calendario',
    '/courses': 'Cursos',
    '/grades': 'Calificaciones',
    '/attendance': 'Asistencia',
    '/announcements': 'Anuncios',
    '/resources': 'Recursos',
    '/library': 'Biblioteca',
    '/reports': 'Reportes',
    '/settings': 'Configuración',
    '/notifications': 'Notificaciones',
    '/forums': 'Foros',
    '/admin': 'Panel administrador',
    '/admin/users': 'Usuarios',
    '/admin/subjects': 'Materias',
    '/admin/audits': 'Auditoría',
    '/teacher/courses': 'Mis cursos',
    '/teacher/subjects': 'Mis materias',
    '/student/assignments': 'Mis tareas',
    '/student/subjects': 'Mis materias',
    '/my/submissions': 'Mis entregas',
    '/my/progress': 'Mi progreso'
  };
  const pageTitle = pageTitles[location.pathname] || 'Panel';

  const navSections = buildNavSections(user);

  return (
    <div className="app-container">
      <aside className="sidebar" aria-label="Navegación principal">
        <div className="logo">
          <i className="ri-graduation-cap-line" aria-hidden="true"></i>
          <h1>SmartStudio</h1>
        </div>
        {navSections.map(section => (
          <div key={section.title} className="nav-section">
            <div className="nav-title">{section.title}</div>
            {section.items.map(item => (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                aria-label={item.label}
              >
                <i className={item.icon} aria-hidden="true"></i>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
        <div className="nav-section">
          <div className="nav-title">Cuenta</div>
          <button onClick={logout} className="nav-item" aria-label="Cerrar sesión">
            <i className="ri-logout-box-r-line" aria-hidden="true"></i>
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      <main className="main-content">
        <div className="topbar">
          <div>
            <div className="page-title">{pageTitle}</div>
            <div className="muted" style={{ fontSize: 13 }}>{user.role ? user.role.toUpperCase() : ''}</div>
          </div>
          <div className="header-actions">
            <div className="search-box">
              <i className="ri-search-line search-icon" aria-hidden="true"></i>
              <input className="search-input" placeholder="Buscar..." aria-label="Buscar" />
            </div>
            <Button variant="ghost" onClick={() => setNewMessageOpen(true)} icon={<i className="ri-mail-add-line" />}>
              Nuevo mensaje
            </Button>
            <div className="user-menu">
              <div className="notification-badge" aria-label="Notificaciones">
                <i className="ri-notification-3-line" aria-hidden="true"></i>
                <span className="notif-dot">3</span>
              </div>
              <div className="user-avatar" aria-label="Usuario" role="button" tabIndex={0} onClick={() => setProfileOpen(true)} onKeyDown={(e) => { if (e.key === 'Enter') setProfileOpen(true); }}>
                {(user.name || user.email || 'U').slice(0,1).toUpperCase()}
              </div>
            </div>
          </div>
        </div>
        {children}
      </main>

      <nav className="bottom-nav" aria-label="Navegación inferior">
        <NavLink to="/dashboard" className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}> 
          <i className="ri-dashboard-3-line" aria-hidden="true"></i>
          <span>Inicio</span>
        </NavLink>
        <NavLink to="/calendar" className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}> 
          <i className="ri-calendar-event-line" aria-hidden="true"></i>
          <span>Calendario</span>
        </NavLink>
        <NavLink to="/messaging" className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}> 
          <i className="ri-chat-1-line" aria-hidden="true"></i>
          <span>Mensajes</span>
        </NavLink>
        <NavLink to="/notifications" className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}> 
          <i className="ri-notification-3-line" aria-hidden="true"></i>
          <span>Alertas</span>
        </NavLink>
        <button className="bottom-nav-item" onClick={() => setProfileOpen(true)} aria-label="Perfil">
          <i className="ri-user-3-line" aria-hidden="true"></i>
          <span>Perfil</span>
        </button>
      </nav>

      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} user={user} />
      <NewMessageModal open={newMessageOpen} onClose={() => setNewMessageOpen(false)} />
    </div>
  );
}

function buildNavSections(user) {
  const base = [
    { title: 'Principal', items: [
      { to: '/dashboard', label: 'Dashboard', icon: 'ri-dashboard-3-line' },
      { to: '/courses', label: 'Mis Cursos', icon: 'ri-book-open-line' },
      { to: '/grades', label: 'Calificaciones', icon: 'ri-medal-line' },
      { to: '/attendance', label: 'Asistencia', icon: 'ri-calendar-check-line' }
    ] },
    { title: 'Comunicación', items: [
      { to: '/messaging', label: 'Mensajes', icon: 'ri-chat-1-line' },
      { to: '/announcements', label: 'Anuncios', icon: 'ri-megaphone-line' },
      { to: '/forums', label: 'Foros', icon: 'ri-message-2-line' }
    ] },
    { title: 'Herramientas', items: [
      { to: '/calendar', label: 'Calendario', icon: 'ri-calendar-event-line' },
      { to: '/resources', label: 'Recursos', icon: 'ri-folder-download-line' },
      { to: '/library', label: 'Biblioteca', icon: 'ri-bookmark-3-line' }
    ] }
  ];

  if (user.role === 'admin') {
    return base.concat([
      { title: 'Administración', items: [
        { to: '/admin/users', label: 'Usuarios', icon: 'ri-user-3-line' },
        { to: '/admin/subjects', label: 'Materias', icon: 'ri-book-2-line' },
        { to: '/admin/audits', label: 'Auditoría', icon: 'ri-file-search-line' },
        { to: '/admin/import', label: 'Importaciones', icon: 'ri-upload-2-line' },
        { to: '/admin/calendar', label: 'Calendario', icon: 'ri-calendar-check-line' },
        { to: '/reports', label: 'Reportes', icon: 'ri-line-chart-line' },
        { to: '/settings', label: 'Configuración', icon: 'ri-settings-3-line' },
        { to: '/admin', label: 'Resumen', icon: 'ri-shield-star-line' }
      ] },
      { title: 'Gestión', items: [
        { to: '/cohorts', label: 'Cohortes', icon: 'ri-group-line' },
        { to: '/consent-audit', label: 'Consentimientos', icon: 'ri-shield-check-line' }
      ] }
    ]);
  }

  if (user.role === 'teacher') {
    return base.concat([
      { title: 'Docencia', items: [
        { to: '/teacher/courses', label: 'Mis cursos', icon: 'ri-folder-3-line' },
        { to: '/teacher/subjects', label: 'Mis materias', icon: 'ri-book-open-line' },
        { to: '/teacher/submissions', label: 'Entregas', icon: 'ri-inbox-archive-line' },
        { to: '/course-structure', label: 'Estructura', icon: 'ri-flow-chart' }
      ] }
    ]);
  }

  if (user.role === 'student') {
    return base.concat([
      { title: 'Estudiante', items: [
        { to: '/student/subjects', label: 'Mis materias', icon: 'ri-book-3-line' },
        { to: '/student/assignments', label: 'Mis tareas', icon: 'ri-todo-line' },
        { to: '/my/submissions', label: 'Mis entregas', icon: 'ri-send-plane-line' },
        { to: '/my/progress', label: 'Mi progreso', icon: 'ri-line-chart-line' }
      ] }
    ]);
  }

  if (user.role === 'representative') {
    return base.concat([
      { title: 'Representante', items: [
        { to: '/representative', label: 'Panel', icon: 'ri-team-line' },
        { to: '/representative/settings', label: 'Preferencias', icon: 'ri-settings-3-line' }
      ] }
    ]);
  }

  return base;
}