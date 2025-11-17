import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="container mx-auto p-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-2">Bienvenido{user ? `, ${user.name || user.email}` : ''}</h2>
        <p className="text-gray-600 mb-4">Resumen rápido de tu actividad y accesos.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/calendar" className="block p-4 bg-purple-50 rounded hover:shadow">
            <h3 className="font-semibold">Calendario</h3>
            <p className="text-sm text-gray-600">Ver tareas y eventos</p>
          </Link>

          <Link to="/forums/course/1" className="block p-4 bg-green-50 rounded hover:shadow">
            <h3 className="font-semibold">Foros</h3>
            <p className="text-sm text-gray-600">Participar en discusiones</p>
          </Link>

          <Link to="/course/1" className="block p-4 bg-blue-50 rounded hover:shadow">
            <h3 className="font-semibold">Mis Cursos</h3>
            <p className="text-sm text-gray-600">Acceder a mi contenido</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;