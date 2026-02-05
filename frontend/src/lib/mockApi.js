const BASE = 'http://localhost:4000/api/mock';

async function call(path, opts = {}){
  try {
    const res = await fetch(`${BASE}${path}`, opts);
    if (!res.ok) throw new Error('Network error');
    return res.json();
  } catch (e) {
    // fallback to empty data
    console.warn('mockApi fallback:', e.message || e);
    return null;
  }
}

export async function getUsers(){
  const r = await call('/users');
  if (!r) return null;
  // normalize nested shape: some files store { users: [...] } or { users: { users: [...] } }
  if (Array.isArray(r.users)) return r.users;
  if (r.users && Array.isArray(r.users.users)) return r.users.users;
  return null;
}

export async function createUser(data){
  return call('/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
}

export async function updateUser(id, data){
  return call(`/users/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
}

export async function deleteUser(id){
  return call(`/users/${id}`, { method: 'DELETE' });
}

export async function importData(payload){
  return call('/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
}

export async function getAudit(){
  const r = await call('/audit');
  return r ? r.audit : null;
}

export async function getSubmissions(){
  const r = await call('/submissions');
  return r ? (r.submissions || r.submissions) : null;
}

export async function getSubmission(id){
  return call(`/submissions/${id}`);
}

export async function getConsents(){
  const r = await call('/consents');
  return r ? r.consents : null;
}

export async function postConsent(payload){
  return call('/consents', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
}

export async function getSettings(){
  const r = await call('/settings');
  return r ? r.settings : null;
}

export async function postSettings(payload){
  return call('/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
}

export async function getCourseStructure(){
  const r = await call('/course_structure');
  return r ? r.course : null;
}

export async function updateCourseStructure(body){
  return call('/course_structure', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
}

export async function getConsentsAudit(){
  const r = await call('/consents_audit');
  return r ? r : null;
}

export default { getUsers, createUser, updateUser, deleteUser, importData, getAudit, getSubmissions, getSubmission, getConsents, postConsent, getSettings, postSettings, getCourseStructure, updateCourseStructure, getConsentsAudit };
