import React, { useState } from 'react';
import { View } from 'react-native';
import { st, commit, sum, salary } from '../lib/store';
import { fmt, mv, parseMoney } from '../lib/format';
import { Card, T, H1, Row, Btn, Input, Money, Empty, dlg } from '../ui';
import { Item } from './Income';

export default function Fixed() {
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
