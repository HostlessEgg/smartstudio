import api from '../lib/api';
import subjectsMock from '../mocks/subjects';

const STORAGE_KEY = 'smartstudio_subjects_v1';

function seedStorageIfNeeded() {
  const s = localStorage.getItem(STORAGE_KEY);
  if (!s) localStorage.setItem(STORAGE_KEY, JSON.stringify(subjectsMock));
}

export async function fetchSubjects() {
  try {
    const res = await api.get('/subjects');
    return res.data.subjects || res.data;
  } catch (err) {
    seedStorageIfNeeded();
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  }
}

export async function createSubject(payload) {
  try {
    const res = await api.post('/subjects', payload);
    return res.data;
  } catch (err) {
    seedStorageIfNeeded();
    const arr = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const id = Math.max(0, ...arr.map(s => s.id)) + 1;
    const newS = { ...payload, id };
    arr.push(newS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
    return newS;
  }
}

export async function updateSubject(id, payload) {
  try {
    const res = await api.put(`/subjects/${id}`, payload);
    return res.data;
  } catch (err) {
    seedStorageIfNeeded();
    const arr = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const idx = arr.findIndex(s => s.id === id);
    if (idx !== -1) arr[idx] = { ...arr[idx], ...payload, id };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
    return arr[idx];
  }
}

export async function deleteSubject(id) {
  try {
    const res = await api.delete(`/subjects/${id}`);
    return res.data;
  } catch (err) {
    seedStorageIfNeeded();
    let arr = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    arr = arr.filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
    return { success: true };
  }
}
