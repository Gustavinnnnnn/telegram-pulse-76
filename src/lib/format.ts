// BR-locale number/currency formatters used across the app.

const compactFmt = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 });
const intFmt = new Intl.NumberFormat("pt-BR");

export function compactNumber(n: number): string {
  if (n < 1000) return intFmt.format(Math.round(n));
  return compactFmt.format(n);
}

export function fullNumber(n: number): string {
  return intFmt.format(Math.round(n));
}

export function currency(n: number, opts: { compact?: boolean } = {}): string {
  if (opts.compact && Math.abs(n) >= 1000) {
    return `R$ ${compactFmt.format(n)}`;
  }
  return `R$ ${n.toFixed(2).replace(".", ",")}`;
}

export function percent(n: number, digits = 2): string {
  return `${n.toFixed(digits).replace(".", ",")}%`;
}

export function shortId(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

// Color hash for avatars
export function gradientForName(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  const a = h % 360;
  const b = (a + 60) % 360;
  return `linear-gradient(135deg, hsl(${a} 70% 55%), hsl(${b} 70% 45%))`;
}
