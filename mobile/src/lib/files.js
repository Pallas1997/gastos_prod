// Exportar a Excel/CSV, guardar y cargar copias de seguridad
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import * as XLSX from 'xlsx';
import { st, cat$, snapshot, applySnapshot, DEFS, save, refresh } from './store';
import { fd, today } from './format';

async function share(name, data, base64, mime) {
  const uri = FileSystem.cacheDirectory + name;
  await FileSystem.writeAsStringAsync(uri, data, { encoding: base64 ? FileSystem.EncodingType.Base64 : FileSystem.EncodingType.UTF8 });
  if (!(await Sharing.isAvailableAsync())) throw new Error('Compartir no está disponible en este dispositivo');
  await Sharing.shareAsync(uri, { mimeType: mime, dialogTitle: name });
}

function rows() {
  const S = st.S;
  const g = [...S.exp].sort((a, b) => a.date.localeCompare(b.date)).map(e => ({ Fecha: fd(e.date), Categoría: cat$(e.cat).n, Comentario: e.note || '', Pago: e.pay === 'dig' ? 'Digital' : e.pay === 'efe' ? 'Efectivo' : '', 'USD original': e.usd || '', 'Cotización USD': e.rate || '', Hormiga: e.h ? 'Sí' : 'No', 'A revisar': e.rev ? 'Sí' : 'No', Monto: e.amt }));
  const i = [...S.inc].sort((a, b) => a.date.localeCompare(b.date)).map(x => ({ Fecha: fd(x.date), Concepto: x.note || '', Monto: x.amt }));
  const f = [...S.fixed].sort((a, b) => (a.day || 32) - (b.day || 32)).map(x => ({ Servicio: x.name, 'Día de vencimiento': x.day || '', Comentario: x.note || '', Monto: x.amt }));
  const sl = Object.keys(S.income).sort().map(k => ({ Mes: k, Sueldo: S.income[k] }));
  return { g, i, f, sl };
}

export async function exportXlsx() {
  const { g, i, f, sl } = rows(), wb = XLSX.utils.book_new();
  const add = (r, n, h) => XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(r.length ? r : [h]), n);
  add(g, 'Gastos', { Fecha: '', Categoría: '', Comentario: '', Pago: '', Hormiga: '', 'A revisar': '', Monto: '' });
  add(i, 'Ingresos', { Fecha: '', Concepto: '', Monto: '' });
  add(f, 'Servicios', { Servicio: '', 'Día de vencimiento': '', Comentario: '', Monto: '' });
  add(sl, 'Sueldos', { Mes: '', Sueldo: '' });
  const b64 = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
  await share('mis-gastos-' + today() + '.xlsx', b64, true, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
}

export async function exportCsv() {
  const { g, i, f } = rows();
  const q = v => { v = String(v); return /[";\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
  const n = v => String(v).replace('.', ',');
  const L = [['Tipo', 'Fecha', 'Categoría / Concepto', 'Comentario', 'Pago', 'Hormiga', 'A revisar', 'Monto']];
  g.forEach(r => L.push(['Gasto', r.Fecha, r.Categoría, r.Comentario, r.Pago, r.Hormiga, r['A revisar'], n(r.Monto)]));
  i.forEach(r => L.push(['Ingreso', r.Fecha, r.Concepto, '', '', '', '', n(r.Monto)]));
  f.forEach(r => L.push(['Fijo mensual', '', r.Servicio, r.Comentario, '', '', '', n(r.Monto)]));
  await share('mis-gastos-' + today() + '.csv', '﻿' + L.map(r => r.map(q).join(';')).join('\r\n'), false, 'text/csv');
}

export async function exportBackup() {
  const s = snapshot();
  await share('mis-gastos-copia-' + today() + '.json', JSON.stringify({ app: 'mis-gastos', v: 2, fecha: today(), meta: { cur: s.meta.cur, list: s.meta.list }, profiles: s.profiles }, null, 1), false, 'application/json');
}

// confirm(msg) -> Promise<boolean>. Devuelve un texto con el resultado, o null si se canceló.
export async function importBackup(confirm) {
  const res = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'text/plain', '*/*'], copyToCacheDirectory: true });
  if (res.canceled || !res.assets || !res.assets[0]) return null;
  let j;
  try { j = JSON.parse(await FileSystem.readAsStringAsync(res.assets[0].uri)); } catch (e) { throw new Error('Tiene que ser una copia guardada desde esta app (.json).'); }
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
