// Lightweight mock server for demo offline. Copy of mock-server.js but forced CommonJS via .cjs
const http = require('http');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'mock-data');
const DATA_FILE = path.join(DATA_DIR, 'subjects.json');

const FILES = {
  users: path.join(DATA_DIR, 'users.json'),
  audit: path.join(DATA_DIR, 'audit.json'),
  submissions: path.join(DATA_DIR, 'submissions.json'),
  consents: path.join(DATA_DIR, 'consents.json'),
  settings: path.join(DATA_DIR, 'settings.json')
};
const PORT = process.env.MOCK_PORT || 4000;

function readData() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch (e) { return []; }
}

function writeData(arr) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(arr, null, 2));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); } catch (e) { resolve({}); }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  // enable CORS for browser-based E2E tests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const parts = url.pathname.split('/').filter(Boolean);

  if (req.method === 'GET' && url.pathname === '/api/subjects') {
    const data = readData();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ subjects: data }));
  }

  // Mock users API
  if (parts[0] === 'api' && parts[1] === 'mock' && parts[2] === 'users') {
    // ensure file exists
    if (!fs.existsSync(FILES.users)) fs.writeFileSync(FILES.users, JSON.stringify({ users: [] }, null, 2));
    const rawUsers = JSON.parse(fs.readFileSync(FILES.users, 'utf8'));
    const users = Array.isArray(rawUsers) ? rawUsers : (Array.isArray(rawUsers.users) ? rawUsers.users : []);
    if (req.method === 'GET' && parts.length === 3) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ users }));
    }

    if (req.method === 'POST' && parts.length === 3) {
      const body = await parseBody(req);
      const id = Math.max(0, ...users.map(u => u.id)) + 1;
      const newU = { id, ...body };
      users.push(newU);
      fs.writeFileSync(FILES.users, JSON.stringify({ users }, null, 2));
      res.writeHead(201, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(newU));
    }

    if ((req.method === 'PUT' || req.method === 'PATCH') && parts.length === 4) {
      const id = Number(parts[3]);
      const body = await parseBody(req);
      const idx = users.findIndex(u => u.id === id);
      if (idx === -1) { res.writeHead(404); return res.end(); }
      users[idx] = { ...users[idx], ...body };
      fs.writeFileSync(FILES.users, JSON.stringify({ users }, null, 2));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(users[idx]));
    }

    if (req.method === 'DELETE' && parts.length === 4) {
      const id = Number(parts[3]);
      const remaining = users.filter(u => u.id !== id);
      fs.writeFileSync(FILES.users, JSON.stringify({ users: remaining }, null, 2));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true }));
    }
  }

  // Mock import endpoint
  if (req.method === 'POST' && parts[0] === 'api' && parts[1] === 'mock' && parts[2] === 'import') {
    // read body and just echo a summary
    const body = await parseBody(req);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ message: 'Import processed (mock)', received: Array.isArray(body) ? body.length : 1 }));
  }

  // Mock audit
  if (parts[0] === 'api' && parts[1] === 'mock' && parts[2] === 'audit') {
    if (!fs.existsSync(FILES.audit)) fs.writeFileSync(FILES.audit, JSON.stringify([], null, 2));
    const audit = JSON.parse(fs.readFileSync(FILES.audit, 'utf8'));
    if (req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ audit }));
    }
  }

  // Mock submissions
  if (parts[0] === 'api' && parts[1] === 'mock' && parts[2] === 'submissions') {
    if (!fs.existsSync(FILES.submissions)) fs.writeFileSync(FILES.submissions, JSON.stringify([], null, 2));
    let subs = JSON.parse(fs.readFileSync(FILES.submissions, 'utf8'));
    if (req.method === 'GET' && parts.length === 3) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ submissions: subs }));
    }
    if (req.method === 'GET' && parts.length === 4) {
      const id = Number(parts[3]);
      const s = subs.find(x => x.id === id);
      if (!s) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(s));
    }
  }

  // Mock consents/settings
  if (parts[0] === 'api' && parts[1] === 'mock' && parts[2] === 'consents') {
    if (!fs.existsSync(FILES.consents)) fs.writeFileSync(FILES.consents, JSON.stringify([], null, 2));
    const consents = JSON.parse(fs.readFileSync(FILES.consents, 'utf8'));
    if (req.method === 'GET') { res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ consents })); }
    if (req.method === 'POST') { const body = await parseBody(req); consents.push(body); fs.writeFileSync(FILES.consents, JSON.stringify(consents, null, 2)); res.writeHead(201, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify(body)); }
  }

  // Serve course structure from mock-data/course_structure.json
  if (parts[0] === 'api' && parts[1] === 'mock' && parts[2] === 'course_structure') {
    const csPath = path.join(DATA_DIR, 'course_structure.json');
    if (!fs.existsSync(csPath)) fs.writeFileSync(csPath, JSON.stringify({}, null, 2));
    const cs = JSON.parse(fs.readFileSync(csPath, 'utf8'));
    if (req.method === 'GET') { res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ course: cs })); }
    if (req.method === 'POST' || req.method === 'PUT') { const body = await parseBody(req); fs.writeFileSync(csPath, JSON.stringify(body, null, 2)); res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ course: body })); }
  }

  // Serve consents audit if present
  if (parts[0] === 'api' && parts[1] === 'mock' && parts[2] === 'consents_audit') {
    const caPath = path.join(DATA_DIR, 'consents_audit.json');
    if (!fs.existsSync(caPath)) fs.writeFileSync(caPath, JSON.stringify({ consents: [] }, null, 2));
    const ca = JSON.parse(fs.readFileSync(caPath, 'utf8'));
    if (req.method === 'GET') { res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify(ca)); }
  }

  if (parts[0] === 'api' && parts[1] === 'mock' && parts[2] === 'settings') {
    if (!fs.existsSync(FILES.settings)) fs.writeFileSync(FILES.settings, JSON.stringify({}, null, 2));
    const settings = JSON.parse(fs.readFileSync(FILES.settings, 'utf8'));
    if (req.method === 'GET') { res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ settings })); }
    if (req.method === 'POST') { const body = await parseBody(req); const merged = { ...settings, ...body }; fs.writeFileSync(FILES.settings, JSON.stringify(merged, null, 2)); res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ settings: merged })); }
  }

  if (req.method === 'POST' && url.pathname === '/api/subjects') {
    const body = await parseBody(req);
    const data = readData();
    const id = Math.max(0, ...data.map(s => s.id)) + 1;
    const newS = { id, ...body };
    data.push(newS);
    writeData(data);
    res.writeHead(201, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(newS));
  }

  if ((req.method === 'PUT' || req.method === 'PATCH') && parts[0] === 'api' && parts[1] === 'subjects' && parts[2]) {
    const id = Number(parts[2]);
    const body = await parseBody(req);
    const data = readData();
    const idx = data.findIndex(s => s.id === id);
    if (idx === -1) { res.writeHead(404); return res.end(); }
    data[idx] = { ...data[idx], ...body, id };
    writeData(data);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(data[idx]));
  }

  if (req.method === 'DELETE' && parts[0] === 'api' && parts[1] === 'subjects' && parts[2]) {
    const id = Number(parts[2]);
    let data = readData();
    data = data.filter(s => s.id !== id);
    writeData(data);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ success: true }));
  }

  // fallback
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'not found' }));
});

server.listen(PORT, () => console.log(`Mock server running at http://localhost:${PORT}`));
