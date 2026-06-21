// Thin fetch wrapper. Token is injected from auth context.

// In development, leave VITE_API_URL unset — Vite proxies /api to the backend.
// In production (separate frontend/backend hosts), set VITE_API_URL to the
// backend's public origin, e.g. https://aviva-persona-api.up.railway.app
const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const TOKEN_KEY = 'aviva_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const t = getToken();
    if (t) headers.Authorization = `Bearer ${t}`;
  }
  const res = await fetch(`${API_BASE}/api${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  // auth
  register: (payload) => request('/auth/register', { method: 'POST', body: payload, auth: false }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload, auth: false }),
  me: () => request('/auth/me'),
  // quiz
  getQuestions: () => request('/quiz/questions', { auth: false }),
  getPersonas: () => request('/quiz/personas', { auth: false }),
  // results
  scorePreview: (answers) => request('/results/score', { method: 'POST', body: { answers }, auth: false }),
  saveResult: (answers) => request('/results', { method: 'POST', body: { answers } }),
  myResults: () => request('/results/mine'),
  // admin
  adminOverview: () => request('/admin/overview'),
  adminDistribution: () => request('/admin/distribution'),
  adminHeatmap: () => request('/admin/heatmap'),
  adminChampions: () => request('/admin/champions'),
};
