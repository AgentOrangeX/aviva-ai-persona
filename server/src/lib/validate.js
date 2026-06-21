// Minimal validation without extra dependencies.

export function isEmail(v) {
  return typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) && v.length <= 254;
}

export function isNonEmptyString(v, max = 200) {
  return typeof v === 'string' && v.trim().length > 0 && v.length <= max;
}

export function isStrongEnoughPassword(v) {
  // pragmatic floor: 8+ chars. Tighten for production policy as needed.
  return typeof v === 'string' && v.length >= 8 && v.length <= 200;
}

export function sanitiseString(v, max = 200) {
  if (typeof v !== 'string') return '';
  return v.trim().slice(0, max);
}
