import axios from 'axios';

// Ensure cookies (httpOnly auth) are sent
axios.defaults.withCredentials = true;

// Attach CSRF token from sessionStorage
axios.interceptors.request.use(cfg => {
  try {
    const csrfToken = sessionStorage.getItem('csrfToken');
    if (csrfToken) {
      cfg.headers = { ...(cfg.headers || {}), 'X-CSRF-Token': csrfToken };
    }
  } catch {
    // ignore
  }
  return cfg;
});

// Global error toast hook (optional)
axios.interceptors.response.use(
  res => res,
  err => {
    try {
      const message = err.response?.data?.error || err.message || 'Error de red';
      const detail = { message, type: 'error' };
      window.dispatchEvent(new CustomEvent('app:toast', { detail }));
    } catch {
      // ignore
    }
    return Promise.reject(err);
  }
);
