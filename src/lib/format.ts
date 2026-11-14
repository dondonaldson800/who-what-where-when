export function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 11);
  const core = d.length === 11 && d.startsWith('1') ? d.slice(1) : d.slice(0, 10);
  const prefix = d.length === 11 && d.startsWith('1') ? '+1 ' : '';
  if (core.length <= 3) return prefix + core;
  if (core.length <= 6) return `${prefix}(${core.slice(0, 3)}) ${core.slice(3)}`;
  return `${prefix}(${core.slice(0, 3)}) ${core.slice(3, 6)}-${core.slice(6)}`;
}

export function formatCurrencyInput(raw: string): string {
  const d = raw.replace(/[^\d]/g, '').slice(0, 10);
  return d ? Number(d).toLocaleString('en-US') : '';
}

export function money(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

export const WEIGHTS: Record<string, number> = { High: 0.7, Medium: 0.4, Low: 0.15 };
export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
