// Cuenta y sincronización con el backend (el mismo que usa la web)
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config';
import { snapshot, applySnapshot, hooks, refresh } from './store';

const API = (API_URL || '').replace(/\/$/, '');
const K = { tok: 'gastos-token', mail: 'gastos-email', at: 'gastos-sync-at' };

export const acct = { tok: null, mail: null, at: null, status: '', busy: false };
let timer = null;

export async function initSync() {
  try {
    const v = await AsyncStorage.multiGet([K.tok, K.mail, K.at]);
    acct.tok = v[0][1]; acct.mail = v[1][1]; acct.at = v[2][1];
  } catch (e) {}
  hooks.onSaved = () => { if (!acct.tok) return; clearTimeout(timer); timer = setTimeout(push, 2000); };
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

export async function push() {
  if (!acct.tok || acct.busy) return;
  acct.busy = true; refresh();
  try {
    const r = await api('/api/data', { method: 'PUT', body: JSON.stringify({ data: snapshot() }) });
    acct.at = r.updatedAt || new Date().toISOString(); setK(K.at, acct.at); acct.status = '';
  } catch (e) { acct.status = e.message; }
  finally { acct.busy = false; refresh(); }
}

// ask(): devuelve true para usar los datos de la cuenta, false para subir los del celu
export async function auth(kind, email, password, ask) {
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

export async function pull() {
  acct.status = 'Trayendo datos…'; refresh();
  try {
    const r = await api('/api/data');
    if (r.data) { await applySnapshot(r.data, true); acct.at = r.updatedAt; setK(K.at, r.updatedAt); }
    acct.status = '';
  } catch (e) { acct.status = e.message; }
  refresh();
}

export async function logout(expired) {
  acct.tok = null; acct.mail = null; acct.at = null;
  acct.status = expired ? 'Tu sesión venció, volvé a entrar' : '';
  await Promise.all([setK(K.tok, null), setK(K.mail, null), setK(K.at, null)]);
  refresh();
}
