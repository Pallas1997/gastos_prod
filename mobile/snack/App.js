// Mis gastos — versión de un solo archivo para Expo Snack (generada desde mobile/)
import React, { createContext, useContext, useEffect, useReducer, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, Animated, AppState, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Switch, Text, TextInput, View, useColorScheme } from 'react-native';
import Svg, { Circle, ClipPath, Defs, G, Rect } from 'react-native-svg';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

// ===== src/config.js
// URL del backend (el mismo que usa la versión web)
const API_URL = 'https://gastos-prod-api.onrender.com';

// ===== src/lib/format.js
// Formato de números y fechas al estilo argentino ($1.578.153,71)

const p2 = n => String(n).padStart(2, '0');

const fmtN = n => {
  n = +n || 0;
  const [i, d] = Math.abs(n).toFixed(2).split('.');
  return (n < 0 ? '-' : '') + i.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + d;
};
const fmt = n => '$' + fmtN(n);

// Valor para mostrar dentro de un campo (sin ",00")
const mv = n => (n ? fmtN(n).replace(/,00$/, '') : '');

function parseMoney(t) {
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
function maskStr(raw) {
  let t = String(raw).replace(/[^\d,]/g, '');
  const k = t.indexOf(',');
  let i = k > -1 ? t.slice(0, k) : t;
  const d = k > -1 ? t.slice(k + 1).replace(/,/g, '').slice(0, 2) : null;
  i = i.replace(/^0+(?=\d)/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return d === null ? i : i + ',' + d;
}

const today = () => {
  const d = new Date();
  return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
};
const ym = () => today().slice(0, 7);

// '2026-11-06' -> '06/11/2026'
const fd = d => (d || '').split('-').reverse().join('/');

// '06/11/2026' -> '2026-11-06' (o null si no es válida)
function parseDate(s) {
  const m = String(s || '').trim().match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (!m) return null;
  let y = +m[3]; if (y < 100) y += 2000;
  const mo = +m[2], da = +m[1];
  if (mo < 1 || mo > 12 || da < 1 || da > 31) return null;
  return y + '-' + p2(mo) + '-' + p2(da);
}

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const monthTitle = (d = new Date()) => MESES[d.getMonth()] + ' de ' + d.getFullYear();

const fdt = iso => {
  const d = new Date(iso);
  if (isNaN(d)) return '';
  return p2(d.getDate()) + '/' + p2(d.getMonth() + 1) + ' ' + p2(d.getHours()) + ':' + p2(d.getMinutes());
};

// ===== src/lib/store.js
// Estado de la app. Usa el mismo formato de datos que la versión web,
// así una copia de seguridad o la cuenta sirven en las dos.



const CATS = [
  { id: 'cafe', n: 'Café', e: '☕', h: 1 }, { id: 'kiosco', n: 'Kiosco', e: '🍫', h: 1 },
  { id: 'delivery', n: 'Delivery', e: '🛵', h: 1 }, { id: 'subs', n: 'Suscripciones', e: '📺', h: 1 },
  { id: 'salidas', n: 'Salidas', e: '🍻', h: 1 }, { id: 'comida', n: 'Comida', e: '🍔', h: 0 },
  { id: 'super', n: 'Súper', e: '🛒', h: 0 }, { id: 'transp', n: 'Transporte', e: '🚌', h: 0 },
  { id: 'hogar', n: 'Hogar', e: '🏠', h: 0 }, { id: 'servicios', n: 'Servicios', e: '💡', h: 0 },
  { id: 'salud', n: 'Salud', e: '💊', h: 0 }, { id: 'ropa', n: 'Ropa', e: '👕', h: 0 },
  { id: 'ocio', n: 'Ocio', e: '🎮', h: 0 }, { id: 'otros', n: 'Otros', e: '📦', h: 0 },
];
const cat$ = id => CATS.find(c => c.id === id) || CATS[CATS.length - 1];

const DEFS = () => ({ exp: [], budget: 0, pct: 30, bank: [], income: {}, goal: 0, goalM: 0, fixed: [], lastPay: 'dig', inc: [], goalP: 0, bal: {} });

const FXN = { blue: 'Blue', oficial: 'Oficial', bolsa: 'MEP', contadoconliqui: 'CCL', tarjeta: 'Tarjeta' };
const FX0 = { sel: 'blue', manual: 0, live: false, got: 0, at: '2026-11-03T11:57:00.000Z', r: { blue: [1545, 1565], oficial: [1515, 1565], bolsa: [1556.2, 1579.9], contadoconliqui: [1663.2, 1670], tarjeta: [1969.5, 2034.5] } };

const pk = id => 'gastos-p-' + id;

// st.S = perfil actual, st.M = perfiles/tema/dólar, st.P = todos los perfiles en memoria
const st = {
  ready: false,
  S: DEFS(),
  M: { cur: 'p1', list: [{ id: 'p1', name: 'Perfil 1' }], theme: '', fx: { ...FX0 } },
  P: {},
  ok: false, // ya aceptó el aviso de privacidad
};

const subs = new Set();
const emit = () => subs.forEach(f => f());
const hooks = { onSaved: null };

function useStore() {
  const [, force] = useReducer(x => x + 1, 0);
  useEffect(() => { subs.add(force); return () => subs.delete(force); }, []);
  return st;
}

async function load() {
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
function save(silent) {
  st.P[st.M.cur] = st.S;
  clearTimeout(timer);
  timer = setTimeout(() => {
    AsyncStorage.multiSet([[pk(st.M.cur), JSON.stringify(st.S)], ['gastos-meta', JSON.stringify(st.M)]]).catch(() => {});
  }, 150);
  if (!silent && hooks.onSaved) hooks.onSaved();
}

// Cambia algo, guarda y redibuja
function commit(fn) { if (fn) fn(st); save(); emit(); }
const refresh = emit;

async function acceptPrivacy() { st.ok = true; emit(); try { await AsyncStorage.setItem('gastos-ok', '1'); } catch (e) {} }

// ---- Perfiles
function switchP(id) {
  if (id === st.M.cur) return;
  save(); st.M.cur = id; st.S = st.P[id] || (st.P[id] = DEFS()); save(); emit();
}
function addP(name) {
  save();
  const id = 'p' + Date.now();
  st.M.list.push({ id, name: name || 'Perfil ' + (st.M.list.length + 1) });
  st.M.cur = id; st.S = st.P[id] = DEFS(); save(); emit();
}
function renameP(id, name) { const p = st.M.list.find(x => x.id === id); if (p && name) { p.name = name; save(); emit(); } }
function delP(id) {
  if (st.M.list.length < 2) return;
  st.M.list = st.M.list.filter(x => x.id !== id);
  delete st.P[id];
  AsyncStorage.removeItem(pk(id)).catch(() => {});
  if (st.M.cur === id) { st.M.cur = st.M.list[0].id; st.S = st.P[st.M.cur] || DEFS(); }
  save(); emit();
}

// ---- Copia completa (mismo formato que la web: v:2)
function snapshot() {
  save(true);
  const profiles = {};
  st.M.list.forEach(p => { profiles[p.id] = st.P[p.id] || DEFS(); });
  return { meta: { cur: st.M.cur, list: st.M.list, theme: st.M.theme || '' }, profiles };
}
async function applySnapshot(d, keepTheme) {
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
const sum = a => a.reduce((t, e) => t + (+e.amt || 0), 0);
const monthExp = () => { const m = ym(); return st.S.exp.filter(e => e.date.startsWith(m)); };
const monthInc = () => { const m = ym(); return st.S.inc.filter(i => i.date.startsWith(m)); };
const salary = () => st.S.income[ym()] || 0;
const fixedTotal = () => sum(st.S.fixed);
const cartS = () => { if (!st.S.cart) st.S.cart = { goal: 0, items: [] }; return st.S.cart; };
const cartTotal = () => cartS().items.reduce((t, i) => t + i.p * i.q, 0);

// ===== src/lib/fx.js
// Cotización del dólar en vivo (DolarApi)

const fxRate = () => st.M.fx.manual || (st.M.fx.r[st.M.fx.sel] || st.M.fx.r.blue)[1];

async function fetchFx() {
  const c = new AbortController(), t = setTimeout(() => c.abort(), 8000);
  try {
    const r = await fetch('https://dolarapi.com/v1/dolares', { signal: c.signal });
    if (!r.ok) throw 0;
    const a = await r.json(), o = {};
    let at = '';
    a.forEach(x => { if (FXN[x.casa] && x.venta) { o[x.casa] = [x.compra, x.venta]; if (String(x.fechaActualizacion) > at) at = x.fechaActualizacion; } });
    if (!o.blue) throw 0;
    st.M.fx.r = Object.assign(st.M.fx.r, o);
    st.M.fx.at = at || st.M.fx.at;
    st.M.fx.live = true;
    st.M.fx.got = Date.now();
    save(true);
  } catch (e) {
    st.M.fx.live = false;
  } finally {
    clearTimeout(t);
    refresh();
  }
}

// ===== src/lib/sync.js
// Cuenta y sincronización con el backend (el mismo que usa la web)



const API = (API_URL || '').replace(/\/$/, '');
const K = { tok: 'gastos-token', mail: 'gastos-email', at: 'gastos-sync-at' };

const acct = { tok: null, mail: null, at: null, status: '', busy: false };
let pushTimer = null;

async function initSync() {
  try {
    const v = await AsyncStorage.multiGet([K.tok, K.mail, K.at]);
    acct.tok = v[0][1]; acct.mail = v[1][1]; acct.at = v[2][1];
  } catch (e) {}
  hooks.onSaved = () => { if (!acct.tok) return; clearTimeout(pushTimer); pushTimer = setTimeout(push, 2000); };
  refresh();
}

const setK = (k, v) => (v == null ? AsyncStorage.removeItem(k) : AsyncStorage.setItem(k, String(v))).catch(() => {});

async function api(path, opt = {}) {
  const h = { 'Content-Type': 'application/json' };
  if (acct.tok) h.Authorization = 'Bearer ' + acct.tok;
  const c = new AbortController(), to = setTimeout(() => c.abort(), 60000); // Render gratis tarda en despertar
  try {
    const r = await fetch(API + path, { ...opt, headers: h, signal: c.signal });
    const j = await r.json().catch(() => ({}));
    if (r.status === 401 && acct.tok) { await logout(true); throw new Error('Tu sesión venció, volvé a entrar'); }
    if (!r.ok) throw new Error(j.error || 'Error del servidor (' + r.status + ')');
    return j;
  } catch (e) {
    if (e.name === 'AbortError') throw new Error('El servidor no respondió');
    if (e instanceof TypeError) throw new Error('No hay conexión con el servidor');
    throw e;
  } finally { clearTimeout(to); }
}

async function push() {
  if (!acct.tok || acct.busy) return;
  acct.busy = true; refresh();
  try {
    const r = await api('/api/data', { method: 'PUT', body: JSON.stringify({ data: snapshot() }) });
    acct.at = r.updatedAt || new Date().toISOString(); setK(K.at, acct.at); acct.status = '';
  } catch (e) { acct.status = e.message; }
  finally { acct.busy = false; refresh(); }
}

// ask(): devuelve true para usar los datos de la cuenta, false para subir los del celu
async function auth(kind, email, password, ask) {
  email = (email || '').trim();
  if (!email || (password || '').length < 6) { acct.status = 'Poné tu email y una contraseña de al menos 6 caracteres'; refresh(); return; }
  acct.status = kind === 'register' ? 'Creando cuenta…' : 'Entrando… (la primera vez puede tardar hasta un minuto)'; refresh();
  try {
    const r = await api('/api/auth/' + kind, { method: 'POST', body: JSON.stringify({ email, password }) });
    acct.tok = r.token; acct.mail = r.email; acct.status = '';
    setK(K.tok, r.token); setK(K.mail, r.email);
    const d = await api('/api/data');
    const has = d.data && d.data.meta && d.data.meta.list && d.data.meta.list.length;
    if (!has) await push();
    else if (await ask()) { await applySnapshot(d.data, true); acct.at = d.updatedAt; setK(K.at, d.updatedAt); }
    else await push();
  } catch (e) { acct.status = e.message; }
  refresh();
}

async function pull() {
  acct.status = 'Trayendo datos…'; refresh();
  try {
    const r = await api('/api/data');
    if (r.data) { await applySnapshot(r.data, true); acct.at = r.updatedAt; setK(K.at, r.updatedAt); }
    acct.status = '';
  } catch (e) { acct.status = e.message; }
  refresh();
}

async function logout(expired) {
  acct.tok = null; acct.mail = null; acct.at = null;
  acct.status = expired ? 'Tu sesión venció, volvé a entrar' : '';
  await Promise.all([setK(K.tok, null), setK(K.mail, null), setK(K.at, null)]);
  refresh();
}

// ===== src/lib/files.js
// Exportar a Excel/CSV, guardar y cargar copias de seguridad
// Los módulos de archivos se cargan recién cuando se usan (así la vista previa web de Snack no falla)
const FS = () => require('expo-file-system');
const Sharing = { isAvailableAsync: (...a) => require('expo-sharing').isAvailableAsync(...a), shareAsync: (...a) => require('expo-sharing').shareAsync(...a) };
const pickDoc = o => require('expo-document-picker').getDocumentAsync(o);
const XL = () => require('xlsx');


// data: texto o Uint8Array
async function share(name, data, mime) {
  const { File, Paths } = FS();
  const f = new File(Paths.cache, name);
  if (f.exists) f.delete();
  f.create();
  f.write(data);
  if (!(await Sharing.isAvailableAsync())) throw new Error('Compartir no está disponible en este dispositivo');
  await Sharing.shareAsync(f.uri, { mimeType: mime, dialogTitle: name });
}

function rows() {
  const S = st.S;
  const g = [...S.exp].sort((a, b) => a.date.localeCompare(b.date)).map(e => ({ Fecha: fd(e.date), Categoría: cat$(e.cat).n, Comentario: e.note || '', Pago: e.pay === 'dig' ? 'Digital' : e.pay === 'efe' ? 'Efectivo' : '', 'USD original': e.usd || '', 'Cotización USD': e.rate || '', Hormiga: e.h ? 'Sí' : 'No', 'A revisar': e.rev ? 'Sí' : 'No', Monto: e.amt }));
  const i = [...S.inc].sort((a, b) => a.date.localeCompare(b.date)).map(x => ({ Fecha: fd(x.date), Concepto: x.note || '', Monto: x.amt }));
  const f = [...S.fixed].sort((a, b) => (a.day || 32) - (b.day || 32)).map(x => ({ Servicio: x.name, 'Día de vencimiento': x.day || '', Comentario: x.note || '', Monto: x.amt }));
  const sl = Object.keys(S.income).sort().map(k => ({ Mes: k, Sueldo: S.income[k] }));
  return { g, i, f, sl };
}

async function exportXlsx() {
  const XLSX = XL();
  const { g, i, f, sl } = rows(), wb = XLSX.utils.book_new();
  const add = (r, n, h) => XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(r.length ? r : [h]), n);
  add(g, 'Gastos', { Fecha: '', Categoría: '', Comentario: '', Pago: '', Hormiga: '', 'A revisar': '', Monto: '' });
  add(i, 'Ingresos', { Fecha: '', Concepto: '', Monto: '' });
  add(f, 'Servicios', { Servicio: '', 'Día de vencimiento': '', Comentario: '', Monto: '' });
  add(sl, 'Sueldos', { Mes: '', Sueldo: '' });
  const buf = new Uint8Array(XLSX.write(wb, { bookType: 'xlsx', type: 'array' }));
  await share('mis-gastos-' + today() + '.xlsx', buf, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
}

async function exportCsv() {
  const { g, i, f } = rows();
  const q = v => { v = String(v); return /[";\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
  const n = v => String(v).replace('.', ',');
  const L = [['Tipo', 'Fecha', 'Categoría / Concepto', 'Comentario', 'Pago', 'Hormiga', 'A revisar', 'Monto']];
  g.forEach(r => L.push(['Gasto', r.Fecha, r.Categoría, r.Comentario, r.Pago, r.Hormiga, r['A revisar'], n(r.Monto)]));
  i.forEach(r => L.push(['Ingreso', r.Fecha, r.Concepto, '', '', '', '', n(r.Monto)]));
  f.forEach(r => L.push(['Fijo mensual', '', r.Servicio, r.Comentario, '', '', '', n(r.Monto)]));
  await share('mis-gastos-' + today() + '.csv', '﻿' + L.map(r => r.map(q).join(';')).join('\r\n'), 'text/csv');
}

async function exportBackup() {
  const s = snapshot();
  await share('mis-gastos-copia-' + today() + '.json', JSON.stringify({ app: 'mis-gastos', v: 2, fecha: today(), meta: { cur: s.meta.cur, list: s.meta.list }, profiles: s.profiles }, null, 1), 'application/json');
}

// confirm(msg) -> Promise<boolean>. Devuelve un texto con el resultado, o null si se canceló.
async function importBackup(confirm) {
  const res = await pickDoc({ type: ['application/json', 'text/plain', '*/*'], copyToCacheDirectory: true });
  if (res.canceled || !res.assets || !res.assets[0]) return null;
  let j;
  try { j = JSON.parse(await new (FS().File)(res.assets[0].uri).text()); } catch (e) { throw new Error('Tiene que ser una copia guardada desde esta app (.json).'); }
  if (j && j.v === 2 && j.profiles && j.meta && Array.isArray(j.meta.list) && j.meta.list.length) {
    if (!(await confirm('Esto reemplaza TODOS los perfiles de este dispositivo por los de la copia (' + j.meta.list.map(p => p.name).join(', ') + ').'))) return null;
    await applySnapshot({ meta: j.meta, profiles: j.profiles }, true);
    save();
    return 'Copia cargada';
  }
  const d = j && j.app === 'mis-gastos' ? j.data : j;
  if (!d || !Array.isArray(d.exp)) throw new Error('Tiene que ser una copia guardada desde esta app (.json).');
  if (!(await confirm('Esto reemplaza los datos del perfil actual por los de la copia (' + d.exp.length + ' gastos).'))) return null;
  st.S = Object.assign(DEFS(), d);
  save(); refresh();
  return 'Copia cargada';
}

// ===== src/ui.js
// Componentes visuales compartidos y colores (mismos que la web)



const LIGHT = { bg: '#f2f5f3', card: '#fff', ink: '#14201c', mute: '#667570', line: '#dfe6e2', ok: '#0f8f6b', warn: '#d98a00', bad: '#d64545', ant: '#6b4fd8', ring: '#e3eae6', dark: false };
const DARK = { bg: '#0e1512', card: '#17211d', ink: '#eef4f1', mute: '#93a39c', line: '#26332e', ok: '#2fc79b', warn: '#f0b13a', bad: '#ff7070', ant: '#a898ff', ring: '#26332e', dark: true };

const ThemeCtx = createContext(LIGHT);
const useT = () => useContext(ThemeCtx);

function Card({ children, style, onPress }) {
  const t = useT();
  const s = [{ backgroundColor: t.card, borderColor: t.line, borderWidth: 1, borderRadius: 18, padding: 16, marginBottom: 12 }, style];
  return onPress ? <Pressable onPress={onPress} style={s}>{children}</Pressable> : <View style={s}>{children}</View>;
}

function T({ children, style, sm, b, mute, color, big, center, ...p }) {
  const t = useT();
  return (
    <Text
      style={[
        { color: color || (mute || sm ? t.mute : t.ink), fontSize: big ? 32 : sm ? 13 : 15, fontVariant: ['tabular-nums'] },
        b && { fontWeight: '700' }, big && { fontWeight: '700', letterSpacing: -0.5 }, center && { textAlign: 'center' }, style,
      ]}
      {...p}>
      {children}
    </Text>
  );
}

const H1 = ({ children }) => <T style={{ fontSize: 15, fontWeight: '600', marginBottom: 14 }} mute>{children}</T>;
const Title = ({ children, style }) => <T b style={[{ marginBottom: 8 }, style]}>{children}</T>;

function Row({ label, value, color, bold, children, style }) {
  return (
    <View style={[{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginTop: 10 }, style]}>
      {typeof label === 'string' ? <T mute={!bold} b={bold} style={{ flex: 1, fontSize: 14 }}>{label}</T> : label}
      {children || <T b color={color}>{value}</T>}
    </View>
  );
}

function Chip({ on, onPress, children, small, style }) {
  const t = useT();
  return (
    <Pressable onPress={onPress} style={[{ borderWidth: 1, borderColor: on ? t.ink : t.line, backgroundColor: on ? t.ink : t.bg, borderRadius: 20, paddingVertical: small ? 6 : 8, paddingHorizontal: small ? 11 : 12 }, style]}>
      <Text style={{ color: on ? t.bg : t.ink, fontSize: small ? 13 : 14 }}>{children}</Text>
    </Pressable>
  );
}
const Chips = ({ children, style }) => <View style={[{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, style]}>{children}</View>;

function Btn({ children, onPress, kind, small, style, disabled }) {
  const t = useT();
  const bg = kind === 'ok' ? t.ok : kind === 'ghost' ? t.bg : t.ink;
  const fg = kind === 'ok' ? '#fff' : kind === 'ghost' ? t.ink : t.bg;
  return (
    <Pressable disabled={disabled} onPress={onPress} style={({ pressed }) => [{ backgroundColor: bg, borderRadius: 14, paddingVertical: small ? 10 : 13, paddingHorizontal: small ? 16 : 13, alignItems: 'center', marginTop: small ? 0 : 12, opacity: pressed || disabled ? 0.7 : 1 }, kind === 'ghost' && { borderWidth: 1, borderColor: t.line }, style]}>
      <Text style={{ color: fg, fontWeight: '600', fontSize: 15 }}>{children}</Text>
    </Pressable>
  );
}

function Input({ style, ...p }) {
  const t = useT();
  return <TextInput placeholderTextColor={t.mute} style={[{ fontSize: 16, color: t.ink, backgroundColor: t.bg, borderWidth: 1, borderColor: t.line, borderRadius: 12, paddingVertical: 11, paddingHorizontal: 12 }, style]} {...p} />;
}

// Campo de plata: pone los puntos de miles mientras escribís y acepta pegar montos.
// onValue recibe el número cada vez que cambia.
function Money({ value, onValue, style, ...p }) {
  const [txt, setTxt] = useState(mv(value));
  // Si el valor cambia desde afuera (por ejemplo, se vació el formulario), actualizamos el texto
  useEffect(() => { if (Math.abs(parseMoney(txt) - (+value || 0)) > 0.001) setTxt(mv(value)); }, [value]);
  const onChange = raw => {
    let s = raw;
    // El teclado del iPhone puede mostrar "." como separador decimal: lo tomamos como coma
    if (s.length === txt.length + 1 && s.endsWith('.')) s = s.slice(0, -1) + ',';
    // Si pegaron un monto completo, lo interpretamos
    else if (s.length > txt.length + 1) { const n = parseMoney(s); s = n ? mv(n) : ''; }
    const m = maskStr(s);
    setTxt(m);
    onValue && onValue(parseMoney(m), m);
  };
  return <Input keyboardType="decimal-pad" value={txt} onChangeText={onChange} style={style} {...p} />;
}

const Empty = ({ children }) => <T mute center style={{ paddingVertical: 24, paddingHorizontal: 10, fontSize: 14, lineHeight: 20 }}>{children}</T>;

function Bar({ ratio, color }) {
  const t = useT();
  return (
    <View style={{ height: 8, borderRadius: 6, backgroundColor: t.ring, overflow: 'hidden', marginTop: 6 }}>
      <View style={{ width: Math.max(0, Math.min(1, ratio)) * 100 + '%', height: '100%', backgroundColor: color || t.ant, borderRadius: 6 }} />
    </View>
  );
}

const Sep = () => { const t = useT(); return <View style={{ borderTopWidth: 1, borderColor: t.line, marginTop: 12, paddingTop: 2 }} />; };

// ---------- Diálogos (reemplazan alert/prompt, con promesa)
let showDlg = null;
function dlg(o) { return new Promise(res => (showDlg ? showDlg({ ...o, res }) : res(o.input ? null : false))); }
const confirm = (title, msg, ok) => dlg({ title, msg, ok });
const notify = (title, msg) => dlg({ title, msg, cancel: false });

function DialogHost() {
  const t = useT();
  const [o, setO] = useState(null);
  const [val, setVal] = useState('');
  useEffect(() => { showDlg = x => { setVal(x.def || ''); setO(x); }; return () => { showDlg = null; }; }, []);
  if (!o) return null;
  const done = v => { const r = o.res; setO(null); r(v); };
  return (
    <Modal transparent animationType="fade" visible onRequestClose={() => done(o.input ? null : false)}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,.5)', justifyContent: 'center', padding: 16 }}>
        <View style={{ backgroundColor: t.card, borderColor: t.line, borderWidth: 1, borderRadius: 18, padding: 18, alignSelf: 'center', width: '100%', maxWidth: 360 }}>
          <T b style={{ marginBottom: 8 }}>{o.title}</T>
          {o.msg ? <T sm style={{ marginBottom: 10, lineHeight: 19 }}>{o.msg}</T> : null}
          {o.input ? (o.money ? <Money autoFocus value={parseMoney(val)} onValue={n => setVal(mv(n))} /> : <Input autoFocus value={val} onChangeText={setVal} onSubmitEditing={() => done(val)} />) : null}
          <Chips style={{ marginTop: 14, justifyContent: 'flex-end' }}>
            {o.cancel === false ? null : <Chip onPress={() => done(o.input ? null : false)}>{typeof o.cancel === 'string' ? o.cancel : 'Cancelar'}</Chip>}
            <Chip on onPress={() => done(o.input ? val : true)}>{o.ok || 'Aceptar'}</Chip>
          </Chips>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ===== src/graphics.js
// Gráficos: anillo del mes, carrito pixel art y barra de reparto




function Ring({ ratio, color, children }) {
  const t = useT();
  const C = 2 * Math.PI * 84, dash = C * Math.min(Math.max(ratio, 0), 1);
  return (
    <View style={{ width: 200, height: 200 }}>
      <Svg width={200} height={200}>
        <G rotation={-90} origin="100,100">
          <Circle cx={100} cy={100} r={84} fill="none" stroke={t.ring} strokeWidth={16} />
          {dash > 0 ? <Circle cx={100} cy={100} r={84} fill="none" stroke={color} strokeWidth={16} strokeLinecap="round" strokeDasharray={`${dash} ${C}`} /> : null}
        </G>
      </Svg>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>{children}</View>
    </View>
  );
}

const CART_PX = ['RR................', '.R................', '.RMMMMMMMMMMMMMMMM', '..MggloOyyrRgloyM.', '..MsMsMsMsMsMsMsM.', '..MMMMMMMMMMMMMMM.', '...MsMsMsMsMsMsM..', '...MMMMMMMMMMMMM..', '....MsMsMsMsMsM...', '....MMMMMMMMMMM...', '.....M.......M....', '....MMMMMMMMMMMM..', '.....KK.....KK....', '.....KK.....KK....'];
const CART_C = { R: '#d83a3a', M: '#7d8a97', s: '#d5dde4', K: '#222', g: '#3fae4a', l: '#8fd16a', o: '#f08a24', O: '#d9661a', y: '#f5c518', r: '#e04848' };
const PIX = [];
CART_PX.forEach((row, y) => [...row].forEach((ch, x) => { if (ch !== '.') PIX.push({ x, y, ch }); }));

// Carrito gris que se llena de color de abajo hacia arriba según ratio (0 a 1)
function Cart({ ratio, over }) {
  const t = useT();
  const W = 18, H = CART_PX.length, r = Math.max(0, Math.min(1, ratio)), h = H * r;
  const op = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!over) { op.setValue(1); return; }
    const a = Animated.loop(Animated.sequence([Animated.timing(op, { toValue: 0.55, duration: 500, useNativeDriver: true }), Animated.timing(op, { toValue: 1, duration: 500, useNativeDriver: true })]));
    a.start();
    return () => a.stop();
  }, [over]);
  const dark = c => c === 'M' || c === 'R' || c === 'K';
  return (
    <Animated.View style={{ opacity: op }}>
      <Svg width={220} height={220 * H / W} viewBox={`0 0 ${W} ${H}`}>
        <Defs>
          <ClipPath id="cfill"><Rect x={0} y={H - h} width={W} height={h} /></ClipPath>
        </Defs>
        <G>{PIX.map(p => <Rect key={'g' + p.x + '-' + p.y} x={p.x} y={p.y} width={1.02} height={1.02} fill={dark(p.ch) ? t.mute : t.ring} opacity={dark(p.ch) ? 0.45 : 1} />)}</G>
        {h > 0 ? <G clipPath="url(#cfill)">{PIX.map(p => <Rect key={'c' + p.x + '-' + p.y} x={p.x} y={p.y} width={1.02} height={1.02} fill={CART_C[p.ch]} />)}</G> : null}
      </Svg>
    </Animated.View>
  );
}

// Barra horizontal con segmentos de colores
function StackBar({ items, base }) {
  const t = useT();
  return (
    <View style={{ flexDirection: 'row', height: 14, borderRadius: 8, overflow: 'hidden', marginTop: 10, marginBottom: 6, backgroundColor: t.ring }}>
      {items.map((x, i) => <View key={i} style={{ width: (x.v / base) * 100 + '%', backgroundColor: x.c }} />)}
    </View>
  );
}

// ===== src/screens/Income.js
function Income() {
  const t = useT(), S = st.S;
  const Bs = salary(), xi = sum(monthInc()), ti = Bs + xi, gs = sum(monthExp()) + fixedTotal(), bal = ti - gs;
  const [note, setNote] = useState(''), [amt, setAmt] = useState(0), [date, setDate] = useState(fd(today()));
  const l = [...S.inc].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  const add = () => {
    if (!amt) return;
    commit(() => S.inc.push({ id: Date.now(), amt, note: note.trim(), date: parseDate(date) || today() }));
    setNote(''); setAmt(0); setDate(fd(today()));
  };
  return (
    <View>
      <H1>Ingresos</H1>
      <Card>
        <Row label="Sueldo del mes" value={fmt(Bs)} style={{ marginTop: 0 }} />
        <Row label="Ingresos extra" value={(xi ? '+' : '') + fmt(xi)} color={t.ok} />
        <Row label="Total ingresos" value={fmt(ti)} />
        <Row label="Gastos + fijos" value={'−' + fmt(gs)} />
        <Row label="Balance del mes" bold value={(bal >= 0 ? '+' : '−') + fmt(Math.abs(bal))} color={bal >= 0 ? t.ok : t.bad} />
      </Card>
      <Card>
        <T mute style={{ marginBottom: 10, fontSize: 14 }}>Agregar ingreso extra</T>
        <Input placeholder="Concepto (ej: service heladera)" value={note} onChangeText={setNote} />
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
          <Money style={{ flex: 1 }} placeholder="$ Monto" value={amt} onValue={setAmt} />
          <Input style={{ flex: 1 }} placeholder="DD/MM/AAAA" value={date} onChangeText={setDate} keyboardType="numbers-and-punctuation" />
        </View>
        <Btn onPress={add}>Agregar ingreso</Btn>
      </Card>
      <Card>
        {l.length ? l.map(i => (
          <Item key={i.id} em="💰" title={i.note || 'Ingreso'} sub={fd(i.date)} val={'+' + fmt(i.amt)} color={t.ok} onDel={() => commit(() => { S.inc = S.inc.filter(x => x.id !== i.id); })} />
        )) : <Empty>Acá van los cobros extra: services, changas, devoluciones…</Empty>}
      </Card>
    </View>
  );
}

// Fila de lista reutilizable
function Item({ em, title, sub, val, color, onDel, children, mark, last }) {
  const t = useT();
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11, borderBottomWidth: 1, borderColor: t.line }, mark && { backgroundColor: t.warn + '24', marginHorizontal: -8, paddingHorizontal: 8, borderRadius: 10 }]}>
      {em ? <T style={{ fontSize: 22, width: 32, textAlign: 'center' }}>{em}</T> : null}
      <View style={{ flex: 1, minWidth: 0 }}>
        {typeof title === 'string' ? <T b numberOfLines={1}>{title}</T> : title}
        {sub ? <T sm numberOfLines={2} style={{ fontSize: 12 }}>{sub}</T> : null}
      </View>
      <T b color={color}>{val}</T>
      {children}
      {onDel ? <T mute onPress={onDel} style={{ fontSize: 18, padding: 6 }} accessibilityLabel="Borrar">✕</T> : null}
    </View>
  );
}

// ===== src/screens/Home.js
function Home({ go }) {
  const t = useT(), S = st.S;
  const ex = monthExp(), tot = sum(ex), hor = sum(ex.filter(e => e.h));
  const now = new Date(), day = now.getDate(), dim = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const fx = fixedTotal(), Bs = salary(), xi = sum(monthInc()), B = Bs + xi;
  const proj = (tot / day) * dim, used = B ? (tot + fx) / B : 0, uv = B > fx ? tot / (B - fx) : 2, elapsed = day / dim;
  let col = t.ok, msg = 'Cargá tus gastos para empezar';
  if (B && ex.length) {
    if (used > 1) { col = t.bad; msg = 'Te pasaste del presupuesto'; }
    else if (uv > elapsed * 1.15) { col = t.bad; msg = 'Vas rápido: cuidado con el ritmo'; }
    else if (uv > elapsed) { col = t.warn; msg = 'Atención: vas un poco arriba'; }
    else { col = t.ok; msg = 'Vas bien este mes'; }
  } else if (!B && ex.length) msg = 'Cargá tu sueldo para ver cuánto te queda';

  return (
    <View>
      <H1>{monthTitle()}</H1>
      <Card>
        <Title>{Bs ? 'Sueldo del mes' : '¿Cuánto cobraste este mes?'}</Title>
        <Money placeholder="$ 0" value={Bs} onValue={n => commit(() => { S.income[ym()] = Math.max(0, n); })} />
        {Bs ? null : <T sm style={{ marginTop: 8 }}>Lo uso para ir restando tus gastos.</T>}
      </Card>

      <Card style={{ alignItems: 'center', paddingVertical: 22 }}>
        <Ring ratio={used} color={col}>
          <T big>{fmt(B ? Math.max(B - tot - fx, 0) : tot)}</T>
          <T sm>{B ? 'te quedan' : 'gastado en el mes'}</T>
        </Ring>
        <T b color={col} style={{ marginTop: 14 }}>{msg}</T>
      </Card>

      <Card>
        <Row label="Gastado" value={fmt(tot)} style={{ marginTop: 0 }} />
        {xi ? <Row label="Ingresos extra" value={'+' + fmt(xi)} color={t.ok} /> : null}
        {fx ? <Row label="Gastos fijos (Servicios)" value={fmt(fx)} /> : null}
        <Row label="Proyección a fin de mes" value={fmt(proj)} />
      </Card>

      <FxCard B={B} tot={tot} fx={fx} />

      <Card onPress={() => go('list')}>
        <Row label="🐜 Gastos hormiga" value={fmt(hor)} color={t.ant} style={{ marginTop: 0 }} />
        <Row label={(tot ? Math.round((hor / tot) * 100) : 0) + '% de lo que gastaste'}>
          <T sm>{hor ? 'Podrías ahorrar ' + fmt((hor * S.pct) / 100) + '/mes' : ''}</T>
        </Row>
      </Card>

      <Where B={B} tot={tot} fx={fx} />
      <Recon />
      <Plan B={B} />
    </View>
  );
}

function FxCard({ B, tot, fx }) {
  const t = useT(), F = st.M.fx, R = fxRate();
  const [p, setP] = useState(0), [u, setU] = useState(0);
  const sel = F.manual ? 'manual' : F.sel, usd = n => 'US$ ' + fmtN(n / R), disp = B ? B - tot - fx : 0;
  return (
    <Card>
      <Title>💵 Dólar</Title>
      <Chips style={{ marginBottom: 6 }}>
        {Object.keys(FXN).map(k => <Chip small key={k} on={sel === k} onPress={() => commit(() => { F.sel = k; F.manual = 0; })}>{FXN[k]}</Chip>)}
      </Chips>
      <Row label="1 USD =" value={fmt(R)} />
      <T sm style={{ marginTop: 2, marginBottom: 6 }}>
        <Text style={{ color: F.live ? t.ok : t.warn }}>● {F.live ? 'En vivo' : 'Sin conexión en vivo'}</Text>
        {F.live ? ' · actualizada ' : ' · valor guardado del '}{fdt(F.at)}{F.manual ? ' · valor manual' : ''}
      </T>
      <Row label="Pesos"><Money style={{ width: 160, textAlign: 'right' }} placeholder="$ 0" value={p} onValue={n => { setP(n); setU(n ? n / R : 0); }} /></Row>
      <Row label="Dólares"><Money style={{ width: 160, textAlign: 'right' }} placeholder="US$ 0" value={u} onValue={n => { setU(n); setP(n ? n * R : 0); }} /></Row>
      <Row label="Usar otro valor"><Money style={{ width: 160, textAlign: 'right' }} placeholder="$ manual" value={F.manual} onValue={n => commit(() => { F.manual = n || 0; })} /></Row>
      <Sep />
      {B ? <><Row label="Te quedan" value={'≈ ' + usd(Math.max(disp, 0))} /><Row label="Ingresos del mes" value={'≈ ' + usd(B)} /></> : null}
      <Row label="Gastado (con fijos)" value={'≈ ' + usd(tot + fx)} />
      <T sm style={{ marginTop: 8 }}>Cotización de venta. Fuente: DolarApi, que toma los mismos valores que muestran los sitios como dolarhoy.com.</T>
    </Card>
  );
}

function Where({ B, tot, fx }) {
  const t = useT();
  const by = {};
  monthExp().forEach(e => { by[e.cat] = (by[e.cat] || 0) + e.amt; });
  const it = Object.entries(by).map(([id, v]) => ({ n: cat$(id).e + ' ' + cat$(id).n, v }));
  if (fx) it.push({ n: '📌 Gastos fijos', v: fx });
  if (!it.length) return null;
  it.sort((a, b) => b.v - a.v);
  const disp = B ? B - tot - fx : 0, base = B ? Math.max(B, tot + fx) : tot + fx;
  if (disp > 0) it.push({ n: '✅ Te queda', v: disp, ok: 1 });
  it.forEach((x, i) => { x.c = x.ok ? t.ok : `hsl(${(i * 47 + 210) % 360}, 55%, ${t.dark ? 62 : 52}%)`; });
  const pc = v => { const p = (v / base) * 100; return p >= 10 ? Math.round(p) + '%' : p.toFixed(1).replace('.', ',') + '%'; };
  return (
    <Card>
      <Title style={{ marginBottom: 4 }}>¿A dónde se va tu sueldo?</Title>
      {B ? null : <T sm>Porcentaje sobre lo que gastaste (cargá tu sueldo para verlo sobre tus ingresos).</T>}
      <StackBar items={it} base={base} />
      {it.map((x, i) => (
        <Row key={i} label={<View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}><View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: x.c, marginRight: 8 }} /><T style={{ fontSize: 14 }}>{x.n}</T></View>}>
          <T b>{pc(x.v)} <T sm>· {fmt(x.v)}</T></T>
        </Row>
      ))}
      {B && tot + fx > B ? <T sm color={t.bad} style={{ marginTop: 8 }}>Gastaste más de lo que ingresó este mes.</T> : null}
    </Card>
  );
}

function Recon() {
  const t = useT(), S = st.S, m = ym(), day = new Date().getDate();
  S.bal = S.bal || {};
  const b = S.bal[m] || {};
  const mx = monthExp(), Bs = salary(), xi = sum(monthInc());
  const gs = sum(mx.filter(e => e.pay !== 'efe')), ef = sum(mx.filter(e => e.pay === 'efe')), fx = sum(S.fixed.filter(x => !x.day || x.day <= day));
  const ini = b.ini || 0, exp = ini + Bs + xi - gs - fx, has = b.real != null, diff = has ? b.real - exp : 0;
  const setB = (k, n, empty) => commit(() => { const o = (S.bal[m] = S.bal[m] || {}); o[k] = empty ? null : n; });
  const adj = async () => {
    const ok = await confirm(diff < 0 ? 'Cargar la fuga como gasto' : 'Cargar la diferencia como ingreso', diff < 0 ? `Se carga un gasto de ${fmt(-diff)} en "Otros", marcado para revisar, así las cuentas cuadran.` : `Se carga un ingreso extra de ${fmt(diff)} para que las cuentas cuadren.`, 'Cargar');
    if (!ok) return;
    commit(() => {
      if (diff < 0) S.exp.push({ id: Date.now(), amt: -diff, cat: 'otros', note: 'Ajuste: diferencia con el banco', date: today(), h: 0, pay: 'dig', rev: 1 });
      else S.inc.push({ id: Date.now(), amt: diff, note: 'Ajuste: diferencia con el banco', date: today() });
    });
  };
  const c = diff < 0 ? t.bad : t.ok;
  return (
    <Card>
      <Title style={{ marginBottom: 4 }}>🏦 ¿Te cuadran las cuentas?</Title>
      <T sm>Poné cuánto tenés hoy en el banco y lo comparo con lo que debería haber según lo que cargaste.</T>
      <Row label="Plata al empezar el mes"><Money style={{ width: 150, textAlign: 'right' }} placeholder="$ 0" value={ini} onValue={n => setB('ini', n)} /></Row>
      <Row label="Ingresos del mes" value={'+' + fmt(Bs + xi)} />
      <Row label="Gastos digitales" value={'−' + fmt(gs)} />
      <Row label="Fijos ya vencidos" value={'−' + fmt(fx)} />
      <Row label="Debería haber" bold value={(exp < 0 ? '−' : '') + fmt(Math.abs(exp))} />
      <Row label="Tengo hoy en el banco"><Money style={{ width: 150, textAlign: 'right' }} placeholder="$ 0" value={b.real || 0} onValue={(n, txt) => setB('real', n, txt === '')} /></Row>
      {has ? (Math.abs(diff) < 1 ? <T b color={t.ok} style={{ marginTop: 12 }}>✅ Las cuentas cuadran</T> : (
        <View style={{ marginTop: 14, padding: 12, borderRadius: 12, backgroundColor: c + '24' }}>
          <T sm>{diff < 0 ? 'Fuga: te falta plata' : 'Te sobra plata'}</T>
          <T big color={c} style={{ fontSize: 28 }}>{(diff < 0 ? '−' : '+') + fmt(Math.abs(diff))}</T>
          <T sm style={{ marginTop: 4 }}>{diff < 0 ? 'Tenés menos de lo esperado: puede haber gastos sin cargar, o cargos del banco que no registraste.' : 'Tenés más de lo esperado: puede haber ingresos o devoluciones sin cargar, o gastos que cargaste de más.'}</T>
          <Chip style={{ marginTop: 10, alignSelf: 'flex-start' }} onPress={adj}>{diff < 0 ? 'Cargar como gasto' : 'Cargar como ingreso'}</Chip>
        </View>
      )) : null}
      {ef ? <T sm style={{ marginTop: 10 }}>Los gastos en efectivo ({fmt(ef)}) no se descuentan del banco.</T> : null}
    </Card>
  );
}

function Plan({ B }) {
  const t = useT(), S = st.S, P = S.goalP || 0, ex = monthExp(), tot = sum(ex), fx = fixedTotal();
  const n = new Date(), d = n.getDate(), dim = new Date(n.getFullYear(), n.getMonth() + 1, 0).getDate();
  const proj = (tot / d) * dim + fx, extra = (((sum(ex.filter(e => e.h)) / d) * dim) * S.pct) / 100;
  const disp = B - tot - fx, fin = B - proj;
  return (
    <Card>
      <Title style={{ marginBottom: 2 }}>🎯 Meta de ahorro</Title>
      <Row label="Quiero ahorrar un">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Money style={{ width: 80, textAlign: 'right' }} placeholder="0" value={P} onValue={v => commit(() => { S.goalP = Math.min(100, Math.max(0, Math.round(v))); })} />
          <T b>%</T>
        </View>
      </Row>
      <Chips style={{ marginTop: 10 }}>{[5, 10, 20].map(p => <Chip small key={p} on={P === p} onPress={() => commit(() => { S.goalP = p; })}>{p + '%'}</Chip>)}</Chips>
      <T sm style={{ marginTop: 8 }}>Porcentaje del sueldo que te va quedando.</T>
      {P ? (!B ? <T sm style={{ marginTop: 12 }}>Cargá tu sueldo para calcular cuánto ahorrar.</T> : (
        <View>
          <Row label="Hoy te quedan" value={fmt(Math.max(disp, 0))} style={{ marginTop: 14 }} />
          {disp > 0 ? <><Row label={`Guardá hoy (${P}%)`} value={fmt((disp * P) / 100)} color={t.ok} /><Row label="Y gastá como máximo" value={fmt(disp * (1 - P / 100))} /></> : <T sm color={t.bad} style={{ marginTop: 8 }}>Hoy no te queda plata para ahorrar este mes.</T>}
          {ex.length ? (
            <View>
              {fin > 0 ? (
                <>
                  <Row label={<View style={{ flex: 1 }}><T sm>A fin de mes, con tu ritmo, te sobrarían {fmt(fin)}</T><T b>Ahorro estimado ({P}%)</T></View>} value={fmt((fin * P) / 100)} color={t.ok} style={{ marginTop: 12 }} />
                  {extra > 0 ? <Row label={`Recortando hormiga un ${S.pct}%`} value={fmt(((fin + extra) * P) / 100)} color={t.ok} /> : null}
                </>
              ) : <T sm color={t.bad} style={{ marginTop: 12 }}>Con tu ritmo actual gastás más de lo que ingresa, así que a fin de mes no sobraría para ahorrar.</T>}
              <T sm style={{ marginTop: 10 }}>Es una estimación: mejora a medida que cargás gastos.</T>
            </View>
          ) : null}
        </View>
      )) : null}
    </Card>
  );
}

// ===== src/screens/Fixed.js
function Fixed() {
  const S = st.S, f = [...S.fixed].sort((a, b) => (a.day || 32) - (b.day || 32)), tot = sum(f), B = salary(), hoy = new Date().getDate();
  const [name, setName] = useState(''), [amt, setAmt] = useState(0), [day, setDay] = useState(''), [note, setNote] = useState('');
  const due = x => { if (!x.day) return ''; const df = x.day - hoy; return 'Vence el día ' + x.day + (df === 0 ? ' · hoy' : df > 0 && df <= 7 ? ' · en ' + df + ' días' : ''); };
  const add = () => {
    if (!name.trim() || !amt) return;
    commit(() => S.fixed.push({ id: Date.now(), name: name.trim(), amt, day: Math.min(31, Math.max(0, parseInt(day) || 0)), note: note.trim() }));
    setName(''); setAmt(0); setDay(''); setNote('');
  };
  const edit = async x => {
    const v = await dlg({ title: 'Nuevo monto para ' + x.name, input: 1, money: 1, def: mv(x.amt) });
    if (v === null) return;
    const n = parseMoney(v);
    if (n > 0) commit(() => { x.amt = n; });
  };
  return (
    <View>
      <H1>Servicios y gastos fijos</H1>
      <Card>
        <Row label="Total fijo por mes" value={fmt(tot)} style={{ marginTop: 0 }} />
        {B && tot ? <><Row label="Del sueldo del mes" value={Math.round((tot / B) * 100) + '%'} /><Row label="Te queda para el resto" value={fmt(B - tot)} /></> : null}
      </Card>
      <Card>
        <T mute style={{ marginBottom: 10, fontSize: 14 }}>Agregar gasto fijo</T>
        <Input placeholder="Nombre (Alquiler, Luz, Internet…)" value={name} onChangeText={setName} />
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
          <Money style={{ flex: 1 }} placeholder="$ Monto" value={amt} onValue={setAmt} />
          <Input style={{ flex: 1 }} placeholder="Día de vencimiento" value={day} onChangeText={v => setDay(v.replace(/\D/g, '').slice(0, 2))} keyboardType="number-pad" />
        </View>
        <Input style={{ marginTop: 10 }} placeholder="Comentario (opcional)" value={note} onChangeText={setNote} />
        <Btn onPress={add}>Agregar</Btn>
      </Card>
      <Card>
        {f.length ? f.map(x => (
          <Item key={x.id} em="📌" title={x.name} sub={[due(x), x.note].filter(Boolean).join(' · ') || 'Sin vencimiento'} val={fmt(x.amt)} onDel={() => commit(() => { S.fixed = S.fixed.filter(y => y.id !== x.id); })}>
            <T mute onPress={() => edit(x)} style={{ fontSize: 18, padding: 6 }} accessibilityLabel="Cambiar monto">✎</T>
          </Item>
        )) : <Empty>Todavía no cargaste gastos fijos.{'\n'}Alquiler, luz, internet, celular, suscripciones…</Empty>}
      </Card>
    </View>
  );
}

// ===== src/screens/Expenses.js
let filter = 'all', antOpen = false;

function Expenses() {
  const t = useT(), S = st.S;
  const [, setF] = useState(filter), [open, setOpen] = useState(antOpen);
  const ex = [...S.exp].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  if (!ex.length) return (<View><H1>Gastos</H1><Card><Empty>Acá vas a ver tus gastos.{'\n'}Tocá + para cargar el primero.</Empty></Card><Account /><Export /></View>);
  const sd = sum(ex.filter(e => e.pay === 'dig')), se = sum(ex.filter(e => e.pay === 'efe')), nr = ex.filter(e => e.rev).length;
  const F = [['all', 'Todos'], ['dig', '💳 Digital'], ['efe', '💵 Efectivo'], ['rev', '🚩 A revisar' + (nr ? ' (' + nr + ')' : '')]];
  const vis = ex.filter(e => filter === 'all' || (filter === 'rev' ? e.rev : e.pay === filter));
  const setFilter = f => { filter = f; setF(f); };
  const togAnt = () => { antOpen = !open; setOpen(antOpen); };
  return (
    <View>
      <H1>Gastos</H1>
      <Card>
        <Row label="💳 Digital" value={fmt(sd)} style={{ marginTop: 0 }} />
        <Row label="💵 Efectivo" value={fmt(se)} />
      </Card>
      <Chips style={{ marginBottom: 12 }}>{F.map(f => <Chip small key={f[0]} on={filter === f[0]} onPress={() => setFilter(f[0])}>{f[1]}</Chip>)}</Chips>

      <Pressable onPress={togAnt} style={{ paddingVertical: 12, paddingHorizontal: 4 }}>
        <T b>{open ? '▾' : '▸'} 🐜 Gastos hormiga · {fmt(sum(monthExp().filter(e => e.h)))} este mes</T>
      </Pressable>
      {open ? <Ants /> : null}

      <Card>
        {vis.length ? vis.map(e => {
          const c = cat$(e.cat);
          return (
            <Item key={e.id} em={c.e} mark={e.rev}
              title={<T b numberOfLines={1}>{c.n}{e.h ? <T color={t.ant}> 🐜</T> : null}{e.pay ? <T style={{ fontSize: 12 }}> {e.pay === 'dig' ? '💳' : '💵'}</T> : null}</T>}
              sub={fd(e.date) + (e.usd ? ' · US$ ' + fmtN(e.usd) + ' a ' + fmt(e.rate) : '') + (e.note ? ' · ' + e.note : '')}
              val={fmt(e.amt)}
              onDel={() => commit(() => { S.exp = S.exp.filter(x => x.id !== e.id); })}>
              <T onPress={() => commit(() => { e.rev = e.rev ? 0 : 1; })} style={{ fontSize: 18, padding: 6, opacity: e.rev ? 1 : 0.35 }} accessibilityLabel="Marcar para revisar">🚩</T>
            </Item>
          );
        }) : <Empty>No hay gastos en este filtro.</Empty>}
      </Card>
      <Account />
      <Export />
    </View>
  );
}

function Ants() {
  const t = useT(), S = st.S;
  const ex = monthExp().filter(e => e.h), tot = sum(ex), by = {};
  ex.forEach(e => { (by[e.cat] = by[e.cat] || { t: 0, n: 0 }).t += e.amt; by[e.cat].n++; });
  const rows = Object.entries(by).sort((a, b) => b[1].t - a[1].t);
  if (!rows.length) return <Card><Empty>Todavía no hay gastos hormiga este mes.{'\n'}Marcá como hormiga los cafés, kioscos, delivery y suscripciones chicas.</Empty></Card>;
  const top = cat$(rows[0][0]), max = rows[0][1].t, m = (tot * S.pct) / 100;
  const step = d => commit(() => { S.pct = Math.min(80, Math.max(10, S.pct + d)); });
  return (
    <View>
      <Card>
        <T sm>Tu mayor fuga</T>
        <T big style={{ fontSize: 26 }}>{top.e} {top.n}</T>
        <T sm>{fmt(rows[0][1].t)} en {rows[0][1].n} compras este mes</T>
      </Card>
      <Card>
        {rows.map(([id, v]) => { const c = cat$(id); return (
          <View key={id} style={{ marginBottom: 14 }}>
            <Row label={c.e + ' ' + c.n + ' · ' + v.n + 'x'} value={fmt(v.t)} style={{ marginTop: 0 }} />
            <Bar ratio={v.t / max} />
          </View>
        ); })}
        <Row label="Total hormiga" value={fmt(tot)} color={t.ant} style={{ marginTop: 0 }} />
      </Card>
      <Card>
        <Row label="Si los reducís un" style={{ marginTop: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Chip small onPress={() => step(-5)}>−</Chip><T b>{S.pct}%</T><Chip small onPress={() => step(5)}>+</Chip>
          </View>
        </Row>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 }}>
          <View><T sm>Ahorro por mes</T><T big color={t.ant} style={{ fontSize: 26 }}>{fmt(m)}</T></View>
          <View style={{ alignItems: 'flex-end' }}><T sm>Ahorro por año</T><T big color={t.ant} style={{ fontSize: 26 }}>{fmt(m * 12)}</T></View>
        </View>
      </Card>
    </View>
  );
}

function Account() {
  const t = useT();
  const [email, setEmail] = useState(''), [pass, setPass] = useState('');
  if (!API_URL) return null;
  const st_ = acct.status ? <T sm color={t.warn} style={{ marginTop: 8 }}>{acct.status}</T> : null;
  const ask = () => dlg({ title: 'Ya tenés datos guardados en tu cuenta', msg: '¿Querés usar los de la cuenta (reemplazan los de este dispositivo) o subir los de este dispositivo (reemplazan los de la cuenta)?', ok: 'Usar los de la cuenta', cancel: 'Subir los de acá' });
  if (!acct.tok) return (
    <Card>
      <Title style={{ marginBottom: 6 }}>☁️ Mi cuenta</Title>
      <T sm style={{ marginBottom: 10 }}>Usá la misma cuenta que en la web para tener tus datos en el celu y en la compu.</T>
      <Input placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" textContentType="emailAddress" />
      <Input style={{ marginTop: 8 }} placeholder="Contraseña (mínimo 6)" value={pass} onChangeText={setPass} secureTextEntry textContentType="password" />
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
        <Btn small style={{ flex: 1 }} onPress={() => auth('login', email, pass, ask).then(() => setPass(''))}>Entrar</Btn>
        <Btn small kind="ghost" style={{ flex: 1 }} onPress={() => auth('register', email, pass, ask).then(() => setPass(''))}>Crear cuenta</Btn>
      </View>
      {st_}
    </Card>
  );
  return (
    <Card>
      <Title style={{ marginBottom: 6 }}>☁️ Mi cuenta</Title>
      <Row label={acct.mail || ''} style={{ marginTop: 0 }}><T sm>{acct.busy ? 'Sincronizando…' : acct.at ? 'Sincronizado ' + fdt(acct.at) : ''}</T></Row>
      <Chips style={{ marginTop: 10 }}>
        <Chip small onPress={() => { acct.status = ''; push(); }}>⬆️ Subir ahora</Chip>
        <Chip small onPress={pull}>⬇️ Traer de la cuenta</Chip>
        <Chip small onPress={() => logout(false)}>Salir</Chip>
      </Chips>
      {st_}
    </Card>
  );
}

function Export() {
  const run = fn => async () => { try { await fn(); } catch (e) { notify('No se pudo completar', e.message || 'Probá de nuevo.'); } };
  const load = run(async () => { const r = await importBackup(msg => confirm('Cargar copia', msg, 'Reemplazar')); if (r) notify(r); });
  return (
    <Card>
      <T mute style={{ marginBottom: 10, fontSize: 14 }}>Exportar mis datos</T>
      <Chips><Chip small onPress={run(exportXlsx)}>📊 Excel (.xlsx)</Chip><Chip small onPress={run(exportCsv)}>📄 CSV</Chip></Chips>
      <T mute style={{ marginTop: 14, marginBottom: 10, fontSize: 14 }}>Copia de seguridad</T>
      <Chips><Chip small onPress={run(exportBackup)}>💾 Guardar copia</Chip><Chip small onPress={load}>📥 Cargar copia</Chip></Chips>
      <T sm style={{ marginTop: 8 }}>La copia guarda todos los perfiles (gastos, ingresos, servicios, sueldo y metas) para cargarlo en otro dispositivo o en la web.</T>
    </Card>
  );
}

// ===== src/screens/Super.js
function Super({ openSheet }) {
  const t = useT(), S = st.S;
  const d = new Date(), dim = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(), day = d.getDate();
  const B = salary() + sum(monthInc()), fx = fixedTotal(), ex = monthExp(), tot = sum(ex);
  const sp = ex.filter(e => e.cat === 'super'), ss = sum(sp), disp = B - tot - fx;

  const list = (
    <Card>
      <Row label={<T b style={{ flex: 1 }}>Compras del mes</T>} style={{ marginTop: 0, marginBottom: 6 }}>
        <Chip small onPress={() => openSheet('super')}>+ Cargar compra</Chip>
      </Row>
      {sp.length ? [...sp].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id).map(e => (
        <Item key={e.id} em="🛒" title={fd(e.date)} sub={(e.note || 'Sin comentario') + (e.pay ? ' · ' + (e.pay === 'dig' ? '💳 Digital' : '💵 Efectivo') : '')} val={fmt(e.amt)} onDel={() => commit(() => { S.exp = S.exp.filter(x => x.id !== e.id); })} />
      )) : <Empty>Todavía no cargaste compras de súper este mes.</Empty>}
    </Card>
  );

  if (!B) return (
    <View>
      <H1>Supermercado</H1>
      <CartCard />
      <Card><Empty>Cargá tu sueldo en Inicio (o un ingreso en Ingresos) para que te recomiende cuánto gastar en el súper.</Empty></Card>
      {list}
    </View>
  );

  const need = sum(ex.filter(e => ['transp', 'hogar', 'salud', 'servicios'].includes(e.cat)));
  const rec = Math.max(0, B - fx - (tot - ss) - (B * (S.supSave || 0)) / 100);
  const left = rec - ss, rest = dim - day + 1, wk = Math.max(1, rest / 7);
  const col = disp < 0 ? t.bad : left < 0 ? t.warn : t.ok;
  const msg = disp < 0 ? 'Ya gastaste más de lo que ingresó este mes' : left < 0 ? 'Te pasaste de lo disponible para el súper' : rec <= 0 ? 'Ya no queda margen este mes, cargá un ingreso o revisá los gastos' : 'Hay plata para el súper este mes';
  return (
    <View>
      <H1>Supermercado</H1>
      <CartCard />
      <Card style={{ alignItems: 'center', paddingVertical: 22 }}>
        <T sm>Sueldo disponible</T>
        <T big color={col}>{(disp < 0 ? '−' : '') + fmt(Math.abs(disp))}</T>
        <T sm>después de gastos y fijos</T>
        <T b color={col} style={{ marginTop: 14, textAlign: 'center' }}>{msg}</T>
      </Card>
      <Card>
        <Title>🛒 Recomendación para el súper</Title>
        <Row label="Disponible para el súper (todo el mes)" value={fmt(rec)} />
        <Row label="Gastado en súper" value={fmt(ss)} />
        <Row label={left >= 0 ? 'Te queda para el súper' : 'Te pasaste por'} bold value={fmt(Math.abs(left))} color={left >= 0 ? t.ok : t.bad} />
        {left > 0 ? <><Row label={`Por semana (${rest} días que quedan)`} value={fmt(left / wk)} /><Row label="Por día" value={fmt(left / rest)} /></> : null}
        <T sm style={{ marginTop: 10 }}>El súper va primero: es lo que queda de tus ingresos después de los fijos y de los demás gastos. Si querés, reservá una parte para ahorrar:</T>
        <Chips style={{ marginTop: 10 }}>{[0, 10, 20].map(p => <Chip small key={p} on={(S.supSave || 0) === p} onPress={() => commit(() => { S.supSave = p; })}>{p ? 'Ahorrar ' + p + '%' : 'No ahorrar por ahora'}</Chip>)}</Chips>
      </Card>
      <Card>
        <Title>Cómo se reparte tu mes</Title>
        <T sm style={{ marginBottom: 6 }}>De referencia: 50% esenciales, 30% gustos, 20% ahorro. No es una obligación.</T>
        <Row label="Esenciales (fijos + súper + otros)"><T b>{Math.round(((fx + ss + need) / B) * 100)}% <T sm>/ 50%</T></T></Row>
        <Row label="Gustos (el resto de lo gastado)"><T b>{Math.round((Math.max(0, tot - ss - need) / B) * 100)}% <T sm>/ 30%</T></T></Row>
        <Row label="Ahorro (lo que queda)"><T b color={disp >= B * 0.2 ? t.ok : t.warn}>{Math.round((Math.max(0, disp) / B) * 100)}% <T sm>/ 20%</T></T></Row>
      </Card>
      <Card>
        <Title>Para gastar menos en el súper</Title>
        <T sm style={{ lineHeight: 21 }}>• Armá la lista antes y andá con el presupuesto por semana.{'\n'}• Hacé una compra grande por semana en vez de muchas chicas.{'\n'}• Compará el precio por kilo o litro, no por paquete.{'\n'}• Las marcas propias suelen salir bastante menos.{'\n'}• Evitá ir con hambre.</T>
      </Card>
      {list}
    </View>
  );
}

function CartCard() {
  const t = useT(), S = st.S, c = cartS();
  const [goal, setGoal] = useState(c.goal), [n, setN] = useState(''), [p, setP] = useState(0), [q, setQ] = useState('1');
  const tot = cartTotal(), g = c.goal, r = g ? tot / g : 0, left = g - tot;
  const col = !g ? t.mute : r > 1 ? t.bad : r >= 0.85 ? t.warn : t.ok;
  const msg = !g ? 'Poné cuánto querés gastar para ver cómo se llena' : r > 1 ? 'Te pasaste por ' + fmt(-left) : r >= 0.85 ? 'Casi llegás: te quedan ' + fmt(left) : 'Te quedan ' + fmt(left);
  const add = () => {
    if (!p) return;
    commit(() => cartS().items.push({ id: Date.now(), n: n.trim() || 'Producto', p, q: Math.max(1, parseInt(q) || 1) }));
    setN(''); setP(0); setQ('1');
  };
  const qty = (id, d) => commit(() => { const it = c.items.find(i => i.id === id); if (!it) return; it.q += d; if (it.q < 1) c.items = c.items.filter(i => i.id !== id); });
  const clear = async () => { if (await confirm('¿Vaciar el carrito?', 'Se borran los productos cargados. No se guarda como gasto.', 'Vaciar')) commit(() => { c.items = []; }); };
  const done = async () => {
    if (!tot) return;
    if (!(await confirm('¿Terminar la compra?', 'Se guarda ' + fmt(tot) + ' como gasto de Súper con fecha de hoy y se vacía el carrito.', 'Guardar gasto'))) return;
    commit(() => {
      S.exp.push({ id: Date.now(), amt: Math.round(tot * 100) / 100, cat: 'super', note: c.items.map(i => (i.q > 1 ? i.q + '× ' : '') + i.n).join(', ').slice(0, 200), date: today(), h: 0, pay: S.lastPay || 'dig', rev: 0 });
      c.items = [];
    });
  };
  return (
    <Card>
      <Title>🛒 Estoy en el súper</Title>
      <T mute style={{ marginBottom: 6, fontSize: 14 }}>Monto deseado para gastar</T>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Money style={{ flex: 1 }} placeholder="$ 0" value={goal} onValue={setGoal} />
        <Btn small onPress={() => commit(() => { cartS().goal = goal; })}>{g ? 'Actualizar' : 'Listo'}</Btn>
      </View>
      <View style={{ alignItems: 'center', marginTop: 16, marginBottom: 6 }}>
        <Cart ratio={r} over={r > 1} />
        {g ? <T b color={col} style={{ fontSize: 13, marginTop: 6 }}>{Math.round(r * 100)}%</T> : null}
      </View>
      <View style={{ alignItems: 'center' }}>
        <T sm>Total gastado</T>
        <T big color={col}>{fmt(tot)}</T>
        <T b color={col} style={{ marginTop: 4, textAlign: 'center' }}>{msg}</T>
      </View>
      <Sep />
      <Input style={{ marginTop: 10 }} placeholder="Producto (ej: galletitas)" value={n} onChangeText={setN} />
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
        <Money style={{ flex: 2 }} placeholder="$ Precio c/u" value={p} onValue={setP} />
        <Input style={{ flex: 1, textAlign: 'center' }} value={q} onChangeText={v => setQ(v.replace(/\D/g, ''))} keyboardType="number-pad" accessibilityLabel="Cantidad" />
      </View>
      <Btn onPress={add}>+ Sumar al carrito</Btn>
      {c.items.length ? (
        <View style={{ marginTop: 12 }}>
          {[...c.items].reverse().map(i => (
            <View key={i.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 9, borderBottomWidth: 1, borderColor: t.line }}>
              <View style={{ flex: 1, minWidth: 0 }}><T b numberOfLines={1}>{i.n}</T><T sm style={{ fontSize: 12 }}>{fmt(i.p)} c/u</T></View>
              <Chip small onPress={() => qty(i.id, -1)}>−</Chip>
              <T b style={{ minWidth: 20, textAlign: 'center' }}>{i.q}</T>
              <Chip small onPress={() => qty(i.id, 1)}>+</Chip>
              <T b style={{ minWidth: 80, textAlign: 'right' }}>{fmt(i.p * i.q)}</T>
              <T mute onPress={() => commit(() => { c.items = c.items.filter(x => x.id !== i.id); })} style={{ fontSize: 18, padding: 4 }}>✕</T>
            </View>
          ))}
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            <Btn small kind="ok" style={{ flex: 1 }} onPress={done}>✓ Terminar compra</Btn>
            <Btn small kind="ghost" onPress={clear}>Vaciar</Btn>
          </View>
        </View>
      ) : null}
    </Card>
  );
}

// ===== src/AddSheet.js
// Hoja para cargar un gasto (en pesos o dólares)







const PAY = { dig: '💳 Digital', efe: '💵 Efectivo' };

function AddSheet({ open, initialCat, onClose }) {
  const t = useT(), ins = useSafeAreaInsets(), S = st.S, F = st.M.fx;
  const [amt, setAmt] = useState(0), [cur, setCur] = useState('ars'), [cat, setCat] = useState('cafe');
  const [note, setNote] = useState(''), [pay, setPay] = useState('dig'), [h, setH] = useState(true), [date, setDate] = useState(fd(today()));

  useEffect(() => {
    if (!open) return;
    const c = initialCat || 'cafe';
    setAmt(0); setCur('ars'); setCat(c); setNote(''); setPay(S.lastPay || 'dig'); setH(!!cat$(c).h); setDate(fd(today()));
  }, [open]);

  const pick = id => { setCat(id); setH(!!cat$(id).h); };
  const R = fxRate();
  const saveExp = () => {
    if (!amt || amt <= 0) return;
    const usd = cur === 'usd' ? { usd: amt, rate: R } : {};
    const pesos = cur === 'usd' ? Math.round(amt * R * 100) / 100 : amt;
    commit(() => {
      S.exp.push({ ...usd, id: Date.now(), amt: pesos, cat, note: note.trim(), date: parseDate(date) || today(), h: h ? 1 : 0, pay, rev: 0 });
      S.lastPay = pay;
    });
    onClose();
  };

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,.4)' }} onPress={onClose} />
        <View style={{ backgroundColor: t.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' }}>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, paddingBottom: 20 + ins.bottom }}>
            <Chips style={{ marginBottom: 10 }}>
              <Chip small on={cur === 'ars'} onPress={() => setCur('ars')}>$ Pesos</Chip>
              <Chip small on={cur === 'usd'} onPress={() => setCur('usd')}>US$ Dólares</Chip>
              {cur === 'usd' ? Object.keys(FXN).map(k => <Chip small key={k} on={!F.manual && F.sel === k} onPress={() => commit(() => { F.sel = k; F.manual = 0; })}>{FXN[k]}</Chip>) : null}
            </Chips>
            <Money autoFocus value={amt} onValue={setAmt} placeholder={cur === 'usd' ? 'US$ 0' : '$ 0'} style={{ fontSize: 32, fontWeight: '700', textAlign: 'center' }} />
            {cur === 'usd' ? (
              <View style={{ marginTop: 6 }}>
                <T sm>Dólar {F.manual ? 'manual' : FXN[F.sel]}: {fmt(R)} · {F.live ? 'en vivo' : 'valor guardado'}</T>
                <T b>{amt ? '≈ ' + fmt(amt * R) + ' en pesos' : 'Escribí el monto en dólares'}</T>
              </View>
            ) : null}
            <Chips style={{ marginVertical: 14 }}>{CATS.map(c => <Chip key={c.id} on={c.id === cat} onPress={() => pick(c.id)}>{c.e} {c.n}</Chip>)}</Chips>
            <Input placeholder="¿Qué fue este gasto? (opcional)" value={note} onChangeText={setNote} />
            <Chips style={{ marginTop: 10 }}>{Object.keys(PAY).map(k => <Chip key={k} on={k === pay} onPress={() => setPay(k)}>{PAY[k]}</Chip>)}</Chips>
            <Pressable onPress={() => setH(!h)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 12 }}>
              <Switch value={h} onValueChange={setH} trackColor={{ true: t.ant }} />
              <T style={{ flex: 1, fontSize: 14 }}>Es un gasto hormiga (chico y repetido)</T>
            </Pressable>
            <Input placeholder="DD/MM/AAAA" value={date} onChangeText={setDate} keyboardType="numbers-and-punctuation" />
            <Btn onPress={saveExp}>Guardar gasto</Btn>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ===== App.js
export default function App() {
  return (
    <SafeAreaProvider>
      <Main />
    </SafeAreaProvider>
  );
}

function Main() {
  useStore();
  const sys = useColorScheme();
  const [tab, setTab] = useState('home');
  const [sheet, setSheet] = useState({ open: false, cat: null });
  const [menu, setMenu] = useState(false);
  const scroll = useRef(null);
  const ins = useSafeAreaInsets();

  useEffect(() => {
    load().then(initSync).then(fetchFx);
    const iv = setInterval(fetchFx, 300000);
    const sub = AppState.addEventListener('change', s => { if (s === 'active') fetchFx(); });
    return () => { clearInterval(iv); sub.remove(); };
  }, []);

  const dark = (st.M.theme || sys) === 'dark';
  const t = dark ? DARK : LIGHT;

  useEffect(() => {
    if (st.ready && !st.ok) {
      dlg({ title: '🔒 Tus datos son tuyos', msg: 'Todo lo que cargás (gastos, sueldo, ingresos) se guarda solo en este celular. Solo se sube a tu servidor si entrás con tu cuenta en "Gastos → Mi cuenta" para sincronizar.\n\nLa app únicamente consulta la cotización del dólar, sin enviar ningún dato tuyo.\n\nTip: usá "Guardar copia" de vez en cuando para tener un respaldo.', ok: 'Aceptar y empezar', cancel: false }).then(acceptPrivacy);
    }
  }, [st.ready]);

  const go = k => { setTab(k); scroll.current && scroll.current.scrollTo({ y: 0, animated: false }); };
  const openSheet = cat => setSheet({ open: true, cat: cat || null });
  const cur = st.M.list.find(p => p.id === st.M.cur) || st.M.list[0];

  if (!st.ready) return <View style={{ flex: 1, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={t.ok} /></View>;

  const Screen = { home: Home, inc: Income, list: Expenses, fix: Fixed, sup: Super }[tab];

  return (
    <ThemeCtx.Provider value={t}>
      <View style={{ flex: 1, backgroundColor: t.bg }}>
        <StatusBar style={dark ? 'light' : 'dark'} />
        {/* Barra superior: perfil y tema */}
        <View style={{ paddingTop: ins.top + 8, paddingHorizontal: 14, paddingBottom: 6, flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
          <Pressable onPress={() => setMenu(true)} style={{ height: 36, borderRadius: 18, borderWidth: 1, borderColor: t.line, backgroundColor: t.card, paddingHorizontal: 14, justifyContent: 'center', maxWidth: '65%' }}>
            <Text numberOfLines={1} style={{ color: t.ink, fontWeight: '600', fontSize: 14 }}>👤 {cur.name} ▾</Text>
          </Pressable>
          <Pressable onPress={() => commit(() => { st.M.theme = dark ? 'light' : 'dark'; })} style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: t.line, backgroundColor: t.card, alignItems: 'center', justifyContent: 'center' }} accessibilityLabel="Cambiar tema">
            <Text style={{ fontSize: 17 }}>{dark ? '☀️' : '🌙'}</Text>
          </Pressable>
        </View>

        <ScrollView ref={scroll} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 6, paddingBottom: 120 }}>
          <Screen go={go} openSheet={openSheet} />
        </ScrollView>

        {/* Barra de pestañas */}
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: t.card, borderTopWidth: 1, borderColor: t.line, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-start', paddingTop: 8, paddingBottom: 8 + ins.bottom, paddingHorizontal: 4 }}>
          <TabBtn t={t} on={tab === 'home'} icon="◔" label="Inicio" onPress={() => go('home')} />
          <TabBtn t={t} on={tab === 'inc'} icon="💰" label="Ingresos" onPress={() => go('inc')} />
          <Pressable onPress={() => openSheet()} accessibilityLabel="Cargar gasto" style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: t.ok, marginTop: -26, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 7, shadowOffset: { width: 0, height: 4 }, elevation: 6 }}>
            <Text style={{ color: '#fff', fontSize: 30, lineHeight: 34 }}>+</Text>
          </Pressable>
          <TabBtn t={t} on={tab === 'list'} icon="☰" label="Gastos" onPress={() => go('list')} />
          <TabBtn t={t} on={tab === 'fix'} icon="📌" label="Servicios" onPress={() => go('fix')} />
          <TabBtn t={t} on={tab === 'sup'} icon="🛒" label="Súper" onPress={() => go('sup')} />
        </View>

        <AddSheet open={sheet.open} initialCat={sheet.cat} onClose={() => setSheet({ open: false, cat: null })} />
        <ProfileMenu open={menu} onClose={() => setMenu(false)} t={t} ins={ins} />
        <DialogHost />
      </View>
    </ThemeCtx.Provider>
  );
}

function TabBtn({ t, on, icon, label, onPress }) {
  return (
    <Pressable onPress={onPress} style={{ alignItems: 'center', paddingHorizontal: 4, paddingVertical: 2, minWidth: 54 }}>
      <Text style={{ fontSize: 20, color: on ? t.ink : t.mute }}>{icon}</Text>
      <Text style={{ fontSize: 10, color: on ? t.ink : t.mute, fontWeight: on ? '700' : '400' }}>{label}</Text>
    </Pressable>
  );
}

function ProfileMenu({ open, onClose, t, ins }) {
  // En iPhone no se puede abrir un diálogo mientras se cierra otro: esperamos un instante
  const close = () => { onClose(); return new Promise(r => setTimeout(r, 400)); };
  const ask = async (title, def) => { const v = await dlg({ title, input: 1, def, ok: 'Guardar' }); return v === null ? null : v.trim(); };
  const add = async () => { await close(); const n = await ask('Nombre del perfil nuevo', 'Perfil ' + (st.M.list.length + 1)); if (n !== null) addP(n); };
  const ren = async p => { await close(); const n = await ask('Nuevo nombre', p.name); if (n) renameP(p.id, n); };
  const del = async p => { await close(); if (await confirm('¿Borrar "' + p.name + '"?', 'Se borran todos sus gastos. No se puede deshacer.', 'Borrar')) delP(p.id); };
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={{ flex: 1 }} onPress={onClose}>
        <View style={{ position: 'absolute', top: ins.top + 52, right: 14, width: 290, backgroundColor: t.card, borderWidth: 1, borderColor: t.line, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 15, elevation: 8 }}>
          {st.M.list.map(p => (
            <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, borderBottomWidth: 1, borderColor: t.line }}>
              <Pressable style={{ flex: 1, paddingVertical: 6 }} onPress={() => { switchP(p.id); onClose(); }}>
                <T b={p.id === st.M.cur} color={p.id === st.M.cur ? t.ok : t.ink}>{p.id === st.M.cur ? '✓ ' : ''}{p.name}</T>
              </Pressable>
              <T mute onPress={() => ren(p)} style={{ fontSize: 18, padding: 6 }}>✎</T>
              {st.M.list.length > 1 ? <T mute onPress={() => del(p)} style={{ fontSize: 18, padding: 6 }}>✕</T> : null}
            </View>
          ))}
          <Pressable style={{ paddingVertical: 12 }} onPress={add}><T>＋ Agregar perfil</T></Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}
