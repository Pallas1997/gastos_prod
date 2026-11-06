// Cuenta y sincronización con el backend.
// La app sigue guardando todo en el celular (localStorage); esto suma una copia en el servidor.
(function () {
  const API = (window.API_URL || '').replace(/\/$/, '');
  const K = { tok: 'gastos-token', mail: 'gastos-email', at: 'gastos-sync-at' };
  const ls = {
    get: k => { try { return localStorage.getItem(k) } catch (e) { return null } },
    set: (k, v) => { try { localStorage.setItem(k, v) } catch (e) {} },
    del: k => { try { localStorage.removeItem(k) } catch (e) {} }
  };
  let status = '', timer = null, busy = false;

  async function api(path, opt = {}) {
    const h = { 'Content-Type': 'application/json' };
    const t = ls.get(K.tok); if (t) h.Authorization = 'Bearer ' + t;
    const c = new AbortController(), to = setTimeout(() => c.abort(), 60000); // Render gratis tarda en despertar
    try {
      const r = await fetch(API + path, { ...opt, headers: h, signal: c.signal });
      const j = await r.json().catch(() => ({}));
      if (r.status === 401 && t) { logout(true); throw new Error('Tu sesión venció, volvé a entrar') }
      if (!r.ok) throw new Error(j.error || 'Error del servidor (' + r.status + ')');
      return j;
    } catch (e) {
      if (e.name === 'AbortError') throw new Error('El servidor no respondió');
      if (e instanceof TypeError) throw new Error('No hay conexión con el servidor');
      throw e;
    } finally { clearTimeout(to) }
  }

  function snapshot() {
    const profiles = {};
    M.list.forEach(p => { profiles[p.id] = p.id === M.cur ? S : loadP(p.id) });
    return { meta: { cur: M.cur, list: M.list, theme: M.theme || '' }, profiles };
  }
  function apply(d) {
    if (!d || !d.meta || !Array.isArray(d.meta.list) || !d.meta.list.length) return;
    Object.keys(d.profiles || {}).forEach(id => ls.set(pk(id), JSON.stringify(d.profiles[id])));
    M = Object.assign(M, { cur: d.meta.list.some(p => p.id === d.meta.cur) ? d.meta.cur : d.meta.list[0].id, list: d.meta.list, theme: d.meta.theme || M.theme });
    S = loadP(M.cur);
    window.onSaved = null; save(); window.onSaved = onSaved;
    applyTheme(); render();
  }

  async function push() {
    if (!ls.get(K.tok) || busy) return;
    busy = true;
    try {
      const r = await api('/api/data', { method: 'PUT', body: JSON.stringify({ data: snapshot() }) });
      ls.set(K.at, r.updatedAt || new Date().toISOString()); status = '';
    } catch (e) { status = e.message }
    finally { busy = false; refresh() }
  }
  function onSaved() { if (!ls.get(K.tok)) return; clearTimeout(timer); timer = setTimeout(push, 2000) }
  window.onSaved = onSaved;

  async function afterLogin() {
    const r = await api('/api/data');
    const has = r.data && r.data.meta && r.data.meta.list && r.data.meta.list.length;
    if (!has) return push();
    const useCloud = await dlg({ title: 'Ya tenés datos guardados en tu cuenta', msg: '¿Querés usar los de la cuenta (reemplazan los de este dispositivo) o subir los de este dispositivo (reemplazan los de la cuenta)?', ok: 'Usar los de la cuenta', cancel: 'Subir los de acá' });
    if (useCloud) { apply(r.data); ls.set(K.at, r.updatedAt) } else await push();
  }

  async function auth(kind) {
    const email = ($('#se').value || '').trim(), password = $('#sp').value || '';
    if (!email || password.length < 6) { status = 'Poné tu email y una contraseña de al menos 6 caracteres'; return refresh() }
    status = kind === 'register' ? 'Creando cuenta…' : 'Entrando…'; refresh();
    try {
      const r = await api('/api/auth/' + kind, { method: 'POST', body: JSON.stringify({ email, password }) });
      ls.set(K.tok, r.token); ls.set(K.mail, r.email); status = '';
      await afterLogin();
    } catch (e) { status = e.message }
    refresh();
  }
  function logout(silent) {
    ls.del(K.tok); ls.del(K.mail); ls.del(K.at);
    status = silent ? 'Tu sesión venció, volvé a entrar' : ''; refresh();
  }
  async function pull() {
    status = 'Trayendo datos…'; refresh();
    try { const r = await api('/api/data'); if (r.data) { apply(r.data); ls.set(K.at, r.updatedAt) } status = '' }
    catch (e) { status = e.message }
    refresh();
  }
  function refresh() { if (typeof tab !== 'undefined' && tab === 'list') keep(() => {}) }

  window.syncCard = function () {
    if (!API) return '';
    const mail = ls.get(K.mail), at = ls.get(K.at);
    const st = status ? `<div class="sm" style="margin-top:8px;color:var(--warn)">${esc(status)}</div>` : '';
    if (!ls.get(K.tok)) return `<div class="card"><div style="font-weight:700;margin-bottom:6px">☁️ Mi cuenta</div>
      <div class="sm" style="margin-bottom:10px">Creá una cuenta para tener tus datos en el celu y en la compu, y no perderlos si cambiás de teléfono.</div>
      <input id="se" type="email" placeholder="Email" autocomplete="email" autocapitalize="off">
      <input id="sp" type="password" placeholder="Contraseña (mínimo 6)" autocomplete="current-password" style="margin-top:8px">
      <div class="row" style="margin-top:10px;gap:8px"><button class="btn s" style="flex:1" onclick="syncAuth('login')">Entrar</button><button class="btn s" style="flex:1;background:var(--bg);color:var(--ink);border:1px solid var(--line)" onclick="syncAuth('register')">Crear cuenta</button></div>${st}</div>`;
    const d = at ? new Date(at) : null;
    return `<div class="card"><div style="font-weight:700;margin-bottom:6px">☁️ Mi cuenta</div>
      <div class="row"><span class="lbl">${esc(mail || '')}</span><span class="sm">${busy ? 'Sincronizando…' : d ? 'Sincronizado ' + d.toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''}</span></div>
      <div class="flt" style="margin:10px 0 0"><button class="chip" onclick="syncPush()">⬆️ Subir ahora</button><button class="chip" onclick="syncPull()">⬇️ Traer de la cuenta</button><button class="chip" onclick="syncLogout()">Salir</button></div>${st}</div>`;
  };
  window.syncAuth = auth;
  window.syncPush = () => { status = ''; push() };
  window.syncPull = pull;
  window.syncLogout = () => logout(false);
})();
