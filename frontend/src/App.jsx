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
          <Link to="/calendar" className="text-sm text-gray-600 hover:text-gray-900">Calendario</Link>
          <Link to="/forums/course/1" className="text-sm text-gray-600 hover:text-gray-900">Foros</Link>
        </div>
        <div>
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-700">{user.name || user.email}</span>
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