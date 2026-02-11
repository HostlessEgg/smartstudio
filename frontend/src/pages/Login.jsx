import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Client-side validation before sending
    setError('');
    const email = formData.email.trim();
    const password = formData.password;
    const name = formData.name.trim();

    const passwordValid = (pw) => {
      if (!pw || pw.length < 8) return false;
      return /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])/.test(pw);
    };

    if (isLogin) {
      if (!email || !password) {
        setError('Email y contraseña son requeridos');
        return;
      }
    } else {
      if (!name) {
        setError('Nombre es requerido');
        return;
      }
      if (!email) {
        setError('Email es requerido');
        return;
      }
      if (!passwordValid(password)) {
        setError('Password mínimo 8 caracteres y debe incluir mayúscula, minúscula, número y símbolo');
        return;
      }
    }

    setLoading(true);
    try {
      let result;
      if (isLogin) {
        result = await login(email, password);
      } else {
        // ensure we send trimmed name/email
        result = await register({ ...formData, name, email });
      }

      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="card" style={{ padding: 28, maxWidth: 420, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <h1 className="section-title">SmartStudio</h1>
          <p className="section-subtitle">Sistema de gestión de aprendizaje</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
          <Button type="button" variant={isLogin ? 'primary' : 'ghost'} onClick={() => setIsLogin(true)}>
            Iniciar sesión
          </Button>
          <Button type="button" variant={!isLogin ? 'primary' : 'ghost'} onClick={() => setIsLogin(false)}>
            Registrarse
          </Button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
          {!isLogin && (
            <div>
              <label className="label">Nombre completo</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="input"
                required={!isLogin}
              />
            </div>
          )}

          <div>
            <label className="label">Correo electrónico</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="input"
              required
            />
          </div>

          <div>
            <label className="label">Contraseña</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="input"
              required
            />
          </div>

          {!isLogin && (
            <div>
              <label className="label">Rol</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="input"
              >
                <option value="student">Estudiante</option>
                <option value="teacher">Profesor</option>
              </select>
            </div>
          )}

          {error && (
            <div className="card" style={{ padding: 12, border: '1px solid var(--danger)', boxShadow: 'none', color: 'var(--danger)', background: 'rgba(255,59,48,0.08)' }}>
              {error}
            </div>
          )}

          <Button type="submit" disabled={loading}>
            {loading ? 'Cargando...' : (isLogin ? 'Ingresar' : 'Crear cuenta')}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Login;