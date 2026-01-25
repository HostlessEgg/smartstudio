import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({ baseURL });

// Attach token from localStorage on each request
api.interceptors.request.use(cfg => {
  try {
    const token = localStorage.getItem('token');
    if (token) cfg.headers = { ...(cfg.headers || {}), Authorization: `Bearer ${token}` };
  } catch (err) {
    // ignore
  }
  return cfg;
});

// On error, dispatch a global toast event so the React ToastProvider can surface it
api.interceptors.response.use(
  res => res,
  err => {
    try {
      const message = err.response?.data?.error || err.message || 'Error de red';
      const detail = { message, type: 'error' };
      window.dispatchEvent(new CustomEvent('app:toast', { detail }));
    } catch (e) {
      // ignore
    }
    return Promise.reject(err);
  }
);

export default api;
