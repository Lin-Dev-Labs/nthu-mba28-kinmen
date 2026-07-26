export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

export function withBasePath(p) {
  if (!p) return p;
  if (p.startsWith('http') || p.startsWith('data:')) return p;
  return `${BASE_PATH}${p}`;
}
