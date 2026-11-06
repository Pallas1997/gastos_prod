import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { st, commit, sum, monthExp, cat$ } from '../lib/store';
import { fmt, fmtN, fd, fdt } from '../lib/format';
import { exportXlsx, exportCsv, exportBackup, importBackup } from '../lib/files';
import { acct, auth, push, pull, logout } from '../lib/sync';
import { API_URL } from '../config';
import { Card, T, H1, Title, Row, Chip, Chips, Btn, Input, Empty, Bar, useT, dlg, confirm, notify } from '../ui';
import { Item } from './Income';

let filter = 'all', antOpen = false;

export default function Expenses() {
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
