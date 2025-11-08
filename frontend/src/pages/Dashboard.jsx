import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Renderizar Dashboard para PROFESOR
  if (user?.role === 'teacher' || user?.role === 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Header */}
        <header className="bg-white shadow-lg">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-gray-800">SMARTSTUDIO LMS</h1>
              <div className="flex items-center space-x-4">
                <span className="text-gray-700 font-medium">{user?.email}</span>
                <span className="px-4 py-2 bg-green-500 text-white rounded-full text-sm font-bold">
                  {user?.role === 'teacher' ? 'Profesor' : 'Administrador'}
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition duration-200"
                >
                  Cerrar Sesión
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content - PROFESOR */}
        <main className="max-w-7xl mx-auto px-6 py-8">
          {/* Welcome Section */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Panel del Instructor</h2>
            <p className="text-xl text-gray-600">Gestiona tus cursos y estudiantes</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center transform hover:scale-105 transition duration-300">
              <div className="text-5xl mb-4">📚</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Cursos Activos</h3>
              <p className="text-4xl font-bold text-blue-600">5</p>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8 text-center transform hover:scale-105 transition duration-300">
              <div className="text-5xl mb-4">👥</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Estudiantes</h3>
              <p className="text-4xl font-bold text-green-600">42</p>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8 text-center transform hover:scale-105 transition duration-300">
              <div className="text-5xl mb-4">📝</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Tareas por Revisar</h3>
              <p className="text-4xl font-bold text-orange-600">7</p>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Left Column - Course Management */}
            <div className="space-y-8">
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-3">Gestión de Cursos</h3>
                <div className="space-y-4">
                  <button 
                    onClick={() => navigate('/create-course')}
                    className="w-full text-left p-6 bg-blue-50 hover:bg-blue-100 rounded-xl border-2 border-blue-200 transition duration-200 group"
                  >
                    <div className="flex items-center">
                      <span className="text-2xl mr-4 group-hover:scale-110 transition">➕</span>
                      <span className="text-xl font-semibold text-blue-700">Crear Nuevo Curso</span>
                    </div>
                  </button>
                  <button className="w-full text-left p-6 bg-green-50 hover:bg-green-100 rounded-xl border-2 border-green-200 transition duration-200 group">
                    <div className="flex items-center">
                      <span className="text-2xl mr-4 group-hover:scale-110 transition">⚙️</span>
                      <span className="text-xl font-semibold text-green-700">Gestionar Cursos Existentes</span>
                    </div>
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-3">Reportes y Análisis</h3>
                <div className="space-y-4">
                  <button className="w-full text-left p-6 bg-purple-50 hover:bg-purple-100 rounded-xl border-2 border-purple-200 transition duration-200 group">
                    <div className="flex items-center">
                      <span className="text-2xl mr-4 group-hover:scale-110 transition">📊</span>
                      <span className="text-xl font-semibold text-purple-700">Ver Reportes de Progreso</span>
                    </div>
                  </button>
                  <button className="w-full text-left p-6 bg-indigo-50 hover:bg-indigo-100 rounded-xl border-2 border-indigo-200 transition duration-200 group">
                    <div className="flex items-center">
                      <span className="text-2xl mr-4 group-hover:scale-110 transition">📈</span>
                      <span className="text-xl font-semibold text-indigo-700">Progreso de Estudiantes</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column - My Courses */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-3">Mis Cursos</h3>
              <div className="text-center py-12">
                <div className="text-6xl mb-6">📚</div>
                <p className="text-xl text-gray-600 mb-8">Aún no has creado ningún curso.</p>
                <button 
                  onClick={() => navigate('/create-course')}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-xl font-bold py-4 px-8 rounded-2xl shadow-lg transform hover:scale-105 transition duration-300"
                >
                  Crear Primer Curso
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Renderizar Dashboard para ESTUDIANTE
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100">
      {/* Header */}
      <header className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-800">SMARTSTUDIO LMS</h1>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700 font-medium">{user?.name || user?.email}</span>
              <span className="px-4 py-2 bg-blue-500 text-white rounded-full text-sm font-bold">
                Estudiante
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition duration-200"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - ESTUDIANTE */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">¡Bienvenido, {user?.name}!</h2>
          <p className="text-xl text-gray-600">Continúa tu journey de aprendizaje</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center transform hover:scale-105 transition duration-300">
            <div className="text-5xl mb-4">📚</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Cursos Inscritos</h3>
            <p className="text-4xl font-bold text-blue-600">3</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 text-center transform hover:scale-105 transition duration-300">
            <div className="text-5xl mb-4">✅</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Mi Progreso</h3>
            <p className="text-4xl font-bold text-green-600">25%</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 text-center transform hover:scale-105 transition duration-300">
            <div className="text-5xl mb-4">🎯</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Mi Rol</h3>
            <p className="text-2xl font-bold text-purple-600">Estudiante</p>
          </div>
        </div>

        {/* Student Actions */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-3">Mis Cursos Activos</h3>
          <div className="text-center py-12">
            <div className="text-6xl mb-6">🎓</div>
            <p className="text-xl text-gray-600 mb-8">Aún no te has inscrito en ningún curso.</p>
            <button 
              onClick={() => navigate('/courses')}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-xl font-bold py-4 px-8 rounded-2xl shadow-lg transform hover:scale-105 transition duration-300"
            >
              Explorar Cursos Disponibles
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-3">Aprendizaje</h3>
            <div className="space-y-4">
              <button className="w-full text-left p-6 bg-green-50 hover:bg-green-100 rounded-xl border-2 border-green-200 transition duration-200 group">
                <div className="flex items-center">
                  <span className="text-2xl mr-4 group-hover:scale-110 transition">📖</span>
                  <span className="text-xl font-semibold text-green-700">Continuar Aprendizaje</span>
                </div>
              </button>
              <button className="w-full text-left p-6 bg-purple-50 hover:bg-purple-100 rounded-xl border-2 border-purple-200 transition duration-200 group">
                <div className="flex items-center">
                  <span className="text-2xl mr-4 group-hover:scale-110 transition">📋</span>
                  <span className="text-xl font-semibold text-purple-700">Mis Tareas</span>
                </div>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-3">Recursos</h3>
            <div className="space-y-4">
              <button className="w-full text-left p-6 bg-orange-50 hover:bg-orange-100 rounded-xl border-2 border-orange-200 transition duration-200 group">
                <div className="flex items-center">
                  <span className="text-2xl mr-4 group-hover:scale-110 transition">📚</span>
                  <span className="text-xl font-semibold text-orange-700">Biblioteca de Recursos</span>
                </div>
              </button>
              <button className="w-full text-left p-6 bg-indigo-50 hover:bg-indigo-100 rounded-xl border-2 border-indigo-200 transition duration-200 group">
                <div className="flex items-center">
                  <span className="text-2xl mr-4 group-hover:scale-110 transition">🏆</span>
                  <span className="text-xl font-semibold text-indigo-700">Mis Certificados</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;