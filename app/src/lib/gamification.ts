export function parseWeightKg(raw: string): number | null {
  if (!raw || raw.trim() === '') return null;
  const normalized = raw.trim().toLowerCase();
  if (['bw', 'bodyweight', 'body weight', 'body', '-'].includes(normalized)) return null;
  const match = normalized.match(/^([\d.]+)\s*(kg|lbs?|lb)?$/);
  if (!match) return null;
  const value = parseFloat(match[1]);
  if (isNaN(value) || value <= 0) return null;
  const unit = match[2] ?? 'kg';
  if (unit === 'lbs' || unit === 'lb') {
    return Math.round(value * 0.453592 * 100) / 100;
  }
  return value;
}
