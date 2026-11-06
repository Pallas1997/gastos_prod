import React, { useState } from 'react';
import { View } from 'react-native';
import { st, commit, sum, monthExp, monthInc, salary, fixedTotal, cartS, cartTotal } from '../lib/store';
import { fmt, fd, today } from '../lib/format';
import { Card, T, H1, Title, Row, Chip, Chips, Btn, Input, Money, Empty, Sep, useT, confirm } from '../ui';
import { Cart } from '../graphics';
import { Item } from './Income';

export default function Super({ openSheet }) {
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
