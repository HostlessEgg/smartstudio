const jwt = require('jsonwebtoken');

const secret = process.env.JWT_SECRET || 'smartstudio_secret_key_2023';
const payload = { userId: 1, email: 'admin@local', role: 'admin' };
const token = jwt.sign(payload, secret, { expiresIn: '1h' });
console.log(token);
