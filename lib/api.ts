// Leave NEXT_PUBLIC_API_URL empty when the dashboard + API live in this same repo.
export const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export const imgUrl = (src?: string): string => {
  if (!src) return '';
  return src.startsWith('/api/') ? `${API_BASE}${src}` : src;
};
