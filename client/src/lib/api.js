// Thin fetch wrapper. Token is injected from auth context.

// In development, leave VITE_API_URL unset — Vite proxies /api to the backend.
// In production (separate frontend/backend hosts), set VITE_API_URL to the
// backend's public origin, e.g. https://aviva-persona-api.up.railway.app
export const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

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
  updateProfile: (payload) => request('/auth/profile', { method: 'PATCH', body: payload }),
  changePassword: (payload) => request('/auth/change-password', { method: 'POST', body: payload }),
  // quiz
  getQuestions: () => request('/quiz/questions', { auth: false }),
  getPersonas: () => request('/quiz/personas', { auth: false }),
  // results
  scorePreview: (answers) => request('/results/score', { method: 'POST', body: { answers }, auth: false }),
  saveResult: (answers) => request('/results', { method: 'POST', body: { answers } }),
  myResults: () => request('/results/mine'),
  leaderboard: () => request('/results/leaderboard'),
  // admin
  adminOverview: () => request('/admin/overview'),
  adminDistribution: () => request('/admin/distribution'),
  adminHeatmap: () => request('/admin/heatmap'),
  adminChampions: () => request('/admin/champions'),
  adminUsers: () => request('/admin/users'),
  adminAnalytics: (businessArea) =>
    request(`/admin/analytics${businessArea ? `?businessArea=${encodeURIComponent(businessArea)}` : ''}`),
  adminAuditLog: () => request('/admin/audit-log'),
  adminLearningResources: () => request('/admin/learning-resources'),
  adminCreateLearningResource: (payload) => request('/admin/learning-resources', { method: 'POST', body: payload }),
  adminUpdateLearningResource: (id, payload) => request(`/admin/learning-resources/${id}`, { method: 'PATCH', body: payload }),
  adminSetLearningResourceStatus: (id, status) =>
    request(`/admin/learning-resources/${id}/status`, { method: 'PATCH', body: { status } }),
  adminDeleteLearningResource: (id) => request(`/admin/learning-resources/${id}`, { method: 'DELETE' }),
  // learning journey progress (PER-005)
  getProgress: () => request('/progress'),
  toggleProgress: (personaKey, stepIndex) => request('/progress/toggle', { method: 'POST', body: { personaKey, stepIndex } }),
  // CSV export needs the auth header, so it can't be a plain <a href> link
  // (the browser wouldn't attach the token) or a URL with the token in the
  // query string (tokens shouldn't sit in browser history/server logs).
  // Fetch it as an authenticated request and trigger a blob download instead.
  adminExportDataset: async (dataset, filename) => {
    const t = getToken();
    const res = await fetch(`${API_BASE}/api/admin/export?dataset=${encodeURIComponent(dataset)}`, {
      headers: t ? { Authorization: `Bearer ${t}` } : {},
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `Export failed (${res.status})`);
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
  adminDeleteFirstResult: (userId) =>
    request(`/admin/users/${userId}/first-result`, { method: 'DELETE' }),
  adminSetUserRole: (userId, role) =>
    request(`/admin/users/${userId}/role`, { method: 'PATCH', body: { role } }),
};
