import crypto from 'crypto';
import jwt from 'jsonwebtoken';

export const isProd = process.env.NODE_ENV === 'production';

export const createCsrfToken = () => crypto.randomBytes(32).toString('hex');

export const setCsrfCookie = (res) => {
  const csrfToken = createCsrfToken();
  res.cookie('csrf_token', csrfToken, {
    httpOnly: false,
    sameSite: 'lax',
    secure: isProd,
    maxAge: 24 * 60 * 60 * 1000
  });
  return csrfToken;
};

export const setAuthCookies = (res, token) => {
  const baseOpts = {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
    maxAge: 24 * 60 * 60 * 1000
  };
  res.cookie('access_token', token, baseOpts);
  return setCsrfCookie(res);
};

export const clearAuthCookies = (res) => {
  const opts = { httpOnly: true, sameSite: 'lax', secure: isProd };
  res.clearCookie('access_token', opts);
  res.clearCookie('csrf_token', { httpOnly: false, sameSite: 'lax', secure: isProd });
};

export const csrfExemptPaths = new Set([
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/csrf',
  '/api/auth/logout',
  '/api/health'
]);

export const csrfProtection = (req, res, next) => {
  const method = req.method.toUpperCase();
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) return next();

  if (csrfExemptPaths.has(req.path)) return next();

  const authHeader = req.headers['authorization'] || '';
  if (authHeader.startsWith('Bearer ')) return next();

  const accessToken = req.cookies?.access_token;
  if (!accessToken) return next();

  const csrfCookie = req.cookies?.csrf_token;
  const csrfHeader = req.headers['x-csrf-token'];
  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
    return res.status(403).json({ error: 'CSRF token inválido' });
  }
  return next();
};

export const verifyJwt = (token) => jwt.verify(token, process.env.JWT_SECRET);
