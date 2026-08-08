// Lightweight, privacy-conscious usage tracking for PER-003.
//
// visitorId: a random id persisted in localStorage so we can tell repeat
// visitors from new ones. It identifies a browser, not a person — it's
// never combined with name/email client-side, and the server only attaches
// a user id when someone happens to be logged in already.
// attemptId: a fresh random id generated each time the quiz is opened, so
// starts/steps/completions can be grouped into "one run through the quiz"
// without guessing from timestamps.

import { API_BASE, getToken } from './api.js';

const VISITOR_KEY = 'aviva_visitor_id';

function randomId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function getVisitorId() {
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = randomId();
    localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
}

export function newAttemptId() {
  return randomId();
}

/**
 * Fire-and-forget. Analytics must never surface an error to the user or
 * block the quiz flow — if the request fails (offline, ad blocker, etc.)
 * we just lose that one data point.
 */
export function trackEvent(attemptId, eventType, { questionIndex } = {}) {
  try {
    const token = getToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    fetch(`${API_BASE}/api/analytics/event`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        visitorId: getVisitorId(),
        attemptId,
        eventType,
        questionIndex: questionIndex ?? undefined,
      }),
      keepalive: true, // let the request outlive a page navigation
    }).catch(() => {});
  } catch {
    // localStorage or fetch unavailable — never let tracking break the app
  }
}
