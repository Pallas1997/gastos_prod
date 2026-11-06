// Cotización del dólar en vivo (DolarApi)
import { st, FXN, save, refresh } from './store';

export const fxRate = () => st.M.fx.manual || (st.M.fx.r[st.M.fx.sel] || st.M.fx.r.blue)[1];

export async function fetchFx() {
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
