// Formato de números y fechas al estilo argentino ($1.578.153,71)

export const p2 = n => String(n).padStart(2, '0');

export const fmtN = n => {
  n = +n || 0;
  const [i, d] = Math.abs(n).toFixed(2).split('.');
  return (n < 0 ? '-' : '') + i.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + d;
};
export const fmt = n => '$' + fmtN(n);

// Valor para mostrar dentro de un campo (sin ",00")
export const mv = n => (n ? fmtN(n).replace(/,00$/, '') : '');

export function parseMoney(t) {
  let s = String(t == null ? '' : t).replace(/[^\d.,-]/g, '');
  if (!s) return 0;
  const c = s.lastIndexOf(','), p = s.lastIndexOf('.');
  if (c > -1 && p > -1) { if (c > p) s = s.replace(/\./g, '').replace(',', '.'); else s = s.replace(/,/g, ''); }
  else if (c > -1) { s = s.replace(/\./g, ''); s = s.replace(',', '.'); }
  else if (p > -1) { if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, ''); }
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

// Mientras se escribe: agrega los puntos de miles y deja hasta 2 decimales con coma
export function maskStr(raw) {
  let t = String(raw).replace(/[^\d,]/g, '');
  const k = t.indexOf(',');
  let i = k > -1 ? t.slice(0, k) : t;
  const d = k > -1 ? t.slice(k + 1).replace(/,/g, '').slice(0, 2) : null;
  i = i.replace(/^0+(?=\d)/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return d === null ? i : i + ',' + d;
}

export const today = () => {
  const d = new Date();
  return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
};
export const ym = () => today().slice(0, 7);

// '2026-11-06' -> '06/11/2026'
export const fd = d => (d || '').split('-').reverse().join('/');

// '06/11/2026' -> '2026-11-06' (o null si no es válida)
export function parseDate(s) {
  const m = String(s || '').trim().match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (!m) return null;
  let y = +m[3]; if (y < 100) y += 2000;
  const mo = +m[2], da = +m[1];
  if (mo < 1 || mo > 12 || da < 1 || da > 31) return null;
  return y + '-' + p2(mo) + '-' + p2(da);
}

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
export const monthTitle = (d = new Date()) => MESES[d.getMonth()] + ' de ' + d.getFullYear();

export const fdt = iso => {
  const d = new Date(iso);
  if (isNaN(d)) return '';
  return p2(d.getDate()) + '/' + p2(d.getMonth() + 1) + ' ' + p2(d.getHours()) + ':' + p2(d.getMinutes());
};
