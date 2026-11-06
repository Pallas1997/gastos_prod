// Gráficos: anillo del mes, carrito pixel art y barra de reparto
import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';
import Svg, { Circle, G, Rect, Defs, ClipPath } from 'react-native-svg';
import { useT } from './ui';

export function Ring({ ratio, color, children }) {
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
export function Cart({ ratio, over }) {
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
export function StackBar({ items, base }) {
  const t = useT();
  return (
    <View style={{ flexDirection: 'row', height: 14, borderRadius: 8, overflow: 'hidden', marginTop: 10, marginBottom: 6, backgroundColor: t.ring }}>
      {items.map((x, i) => <View key={i} style={{ width: (x.v / base) * 100 + '%', backgroundColor: x.c }} />)}
    </View>
  );
}
