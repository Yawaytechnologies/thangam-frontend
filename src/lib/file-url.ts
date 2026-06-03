const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function resolveFileUrl(path?: unknown): string {
  if (typeof path !== 'string') return '';

  const trimmed = path.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  const base = API_BASE_URL.replace(/\/api\/?$/, '').replace(/\/$/, '');
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;

  return `${base}${cleanPath}`;
}
