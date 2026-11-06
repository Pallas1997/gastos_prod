// Estado de la app. Usa el mismo formato de datos que la versión web,
// así una copia de seguridad o la cuenta sirven en las dos.
import { useEffect, useReducer } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ym } from './format';

export const CATS = [
  { id: 'cafe', n: 'Café', e: '☕', h: 1 }, { id: 'kiosco', n: 'Kiosco', e: '🍫', h: 1 },
  { id: 'delivery', n: 'Delivery', e: '🛵', h: 1 }, { id: 'subs', n: 'Suscripciones', e: '📺', h: 1 },
  { id: 'salidas', n: 'Salidas', e: '🍻', h: 1 }, { id: 'comida', n: 'Comida', e: '🍔', h: 0 },
  { id: 'super', n: 'Súper', e: '🛒', h: 0 }, { id: 'transp', n: 'Transporte', e: '🚌', h: 0 },
  { id: 'hogar', n: 'Hogar', e: '🏠', h: 0 }, { id: 'servicios', n: 'Servicios', e: '💡', h: 0 },
  { id: 'salud', n: 'Salud', e: '💊', h: 0 }, { id: 'ropa', n: 'Ropa', e: '👕', h: 0 },
  { id: 'ocio', n: 'Ocio', e: '🎮', h: 0 }, { id: 'otros', n: 'Otros', e: '📦', h: 0 },
];
export const cat$ = id => CATS.find(c => c.id === id) || CATS[CATS.length - 1];

export const DEFS = () => ({ exp: [], budget: 0, pct: 30, bank: [], income: {}, goal: 0, goalM: 0, fixed: [], lastPay: 'dig', inc: [], goalP: 0, bal: {} });

export const FXN = { blue: 'Blue', oficial: 'Oficial', bolsa: 'MEP', contadoconliqui: 'CCL', tarjeta: 'Tarjeta' };
const FX0 = { sel: 'blue', manual: 0, live: false, got: 0, at: '2026-11-03T11:57:00.000Z', r: { blue: [1545, 1565], oficial: [1515, 1565], bolsa: [1556.2, 1579.9], contadoconliqui: [1663.2, 1670], tarjeta: [1969.5, 2034.5] } };

const pk = id => 'gastos-p-' + id;

// st.S = perfil actual, st.M = perfiles/tema/dólar, st.P = todos los perfiles en memoria
export const st = {
  ready: false,
  S: DEFS(),
  M: { cur: 'p1', list: [{ id: 'p1', name: 'Perfil 1' }], theme: '', fx: { ...FX0 } },
  P: {},
  ok: false, // ya aceptó el aviso de privacidad
};

const subs = new Set();
const emit = () => subs.forEach(f => f());
export const hooks = { onSaved: null };

export function useStore() {
  const [, force] = useReducer(x => x + 1, 0);
  useEffect(() => { subs.add(force); return () => subs.delete(force); }, []);
  return st;
}

export async function load() {
  try {
    const [m, ok] = await Promise.all([AsyncStorage.getItem('gastos-meta'), AsyncStorage.getItem('gastos-ok')]);
    if (m) st.M = JSON.parse(m);
    st.ok = !!ok;
    const keys = st.M.list.map(p => pk(p.id));
    const vals = await AsyncStorage.multiGet(keys);
    vals.forEach(([k, v]) => { const id = k.slice(9); st.P[id] = Object.assign(DEFS(), v ? JSON.parse(v) : {}); });
  } catch (e) {}
  st.M.fx = Object.assign({}, FX0, st.M.fx || {});
  st.M.fx.r = Object.assign({}, FX0.r, st.M.fx.r || {});
  st.M.fx.live = false;
  if (!st.M.list.some(p => p.id === st.M.cur)) st.M.cur = st.M.list[0].id;
  st.S = st.P[st.M.cur] || (st.P[st.M.cur] = DEFS());
  st.ready = true;
  emit();
}

let timer = null;
export function save(silent) {
  st.P[st.M.cur] = st.S;
  clearTimeout(timer);
  timer = setTimeout(() => {
    AsyncStorage.multiSet([[pk(st.M.cur), JSON.stringify(st.S)], ['gastos-meta', JSON.stringify(st.M)]]).catch(() => {});
  }, 150);
  if (!silent && hooks.onSaved) hooks.onSaved();
}

// Cambia algo, guarda y redibuja
export function commit(fn) { if (fn) fn(st); save(); emit(); }
export const refresh = emit;

export async function acceptPrivacy() { st.ok = true; emit(); try { await AsyncStorage.setItem('gastos-ok', '1'); } catch (e) {} }

// ---- Perfiles
export function switchP(id) {
  if (id === st.M.cur) return;
  save(); st.M.cur = id; st.S = st.P[id] || (st.P[id] = DEFS()); save(); emit();
}
export function addP(name) {
  save();
  const id = 'p' + Date.now();
  st.M.list.push({ id, name: name || 'Perfil ' + (st.M.list.length + 1) });
  st.M.cur = id; st.S = st.P[id] = DEFS(); save(); emit();
}
export function renameP(id, name) { const p = st.M.list.find(x => x.id === id); if (p && name) { p.name = name; save(); emit(); } }
export function delP(id) {
  if (st.M.list.length < 2) return;
  st.M.list = st.M.list.filter(x => x.id !== id);
  delete st.P[id];
  AsyncStorage.removeItem(pk(id)).catch(() => {});
  if (st.M.cur === id) { st.M.cur = st.M.list[0].id; st.S = st.P[st.M.cur] || DEFS(); }
  save(); emit();
}

// ---- Copia completa (mismo formato que la web: v:2)
export function snapshot() {
  save(true);
  const profiles = {};
  st.M.list.forEach(p => { profiles[p.id] = st.P[p.id] || DEFS(); });
  return { meta: { cur: st.M.cur, list: st.M.list, theme: st.M.theme || '' }, profiles };
}
export async function applySnapshot(d, keepTheme) {
  if (!d || !d.meta || !Array.isArray(d.meta.list) || !d.meta.list.length) return false;
  const old = st.M.list.map(p => pk(p.id));
  st.P = {};
  Object.keys(d.profiles || {}).forEach(id => { st.P[id] = Object.assign(DEFS(), d.profiles[id]); });
  st.M = { ...st.M, cur: d.meta.list.some(p => p.id === d.meta.cur) ? d.meta.cur : d.meta.list[0].id, list: d.meta.list, theme: keepTheme ? st.M.theme : (d.meta.theme || st.M.theme) };
  st.S = st.P[st.M.cur] || (st.P[st.M.cur] = DEFS());
  try {
    await AsyncStorage.multiRemove(old);
    await AsyncStorage.multiSet([...Object.keys(st.P).map(id => [pk(id), JSON.stringify(st.P[id])]), ['gastos-meta', JSON.stringify(st.M)]]);
  } catch (e) {}
  emit();
  return true;
}

// ---- Cálculos comunes
export const sum = a => a.reduce((t, e) => t + (+e.amt || 0), 0);
export const monthExp = () => { const m = ym(); return st.S.exp.filter(e => e.date.startsWith(m)); };
export const monthInc = () => { const m = ym(); return st.S.inc.filter(i => i.date.startsWith(m)); };
export const salary = () => st.S.income[ym()] || 0;
export const fixedTotal = () => sum(st.S.fixed);
export const cartS = () => { if (!st.S.cart) st.S.cart = { goal: 0, items: [] }; return st.S.cart; };
export const cartTotal = () => cartS().items.reduce((t, i) => t + i.p * i.q, 0);
