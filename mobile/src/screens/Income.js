import React, { useState } from 'react';
import { View } from 'react-native';
import { st, commit, sum, monthExp, monthInc, salary, fixedTotal } from '../lib/store';
import { fmt, today, fd, parseDate } from '../lib/format';
import { Card, T, H1, Row, Btn, Input, Money, Empty, useT } from '../ui';

export default function Income() {
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
export function Item({ em, title, sub, val, color, onDel, children, mark, last }) {
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
