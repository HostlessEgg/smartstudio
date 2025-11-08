export function errorHandler(err, _req, res, _next) {
  console.error('ERROR:', err);
  if (res.headersSent) return;
  res.status(500).json({ error: 'Error interno', details: err.message });
}