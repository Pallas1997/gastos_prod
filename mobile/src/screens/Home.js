import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { st, commit, sum, monthExp, monthInc, salary, fixedTotal, cat$, FXN } from '../lib/store';
import { fmt, fmtN, mv, parseMoney, ym, today, monthTitle, fdt } from '../lib/format';
import { fxRate } from '../lib/fx';
import { Card, T, H1, Title, Row, Chip, Chips, Money, Sep, useT, confirm } from '../ui';
import { Ring, StackBar } from '../graphics';

export default function Home({ go }) {
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
