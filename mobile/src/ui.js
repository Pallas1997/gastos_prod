// Componentes visuales compartidos y colores (mismos que la web)
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { maskStr, parseMoney, mv } from './lib/format';

export const LIGHT = { bg: '#f2f5f3', card: '#fff', ink: '#14201c', mute: '#667570', line: '#dfe6e2', ok: '#0f8f6b', warn: '#d98a00', bad: '#d64545', ant: '#6b4fd8', ring: '#e3eae6', dark: false };
export const DARK = { bg: '#0e1512', card: '#17211d', ink: '#eef4f1', mute: '#93a39c', line: '#26332e', ok: '#2fc79b', warn: '#f0b13a', bad: '#ff7070', ant: '#a898ff', ring: '#26332e', dark: true };

export const ThemeCtx = createContext(LIGHT);
export const useT = () => useContext(ThemeCtx);

export function Card({ children, style, onPress }) {
  const t = useT();
  const s = [{ backgroundColor: t.card, borderColor: t.line, borderWidth: 1, borderRadius: 18, padding: 16, marginBottom: 12 }, style];
  return onPress ? <Pressable onPress={onPress} style={s}>{children}</Pressable> : <View style={s}>{children}</View>;
}

export function T({ children, style, sm, b, mute, color, big, center, ...p }) {
  const t = useT();
  return (
    <Text
      style={[
        { color: color || (mute || sm ? t.mute : t.ink), fontSize: big ? 32 : sm ? 13 : 15, fontVariant: ['tabular-nums'] },
        b && { fontWeight: '700' }, big && { fontWeight: '700', letterSpacing: -0.5 }, center && { textAlign: 'center' }, style,
      ]}
      {...p}>
      {children}
    </Text>
  );
}

export const H1 = ({ children }) => <T style={{ fontSize: 15, fontWeight: '600', marginBottom: 14 }} mute>{children}</T>;
export const Title = ({ children, style }) => <T b style={[{ marginBottom: 8 }, style]}>{children}</T>;

export function Row({ label, value, color, bold, children, style }) {
  return (
    <View style={[{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginTop: 10 }, style]}>
      {typeof label === 'string' ? <T mute={!bold} b={bold} style={{ flex: 1, fontSize: 14 }}>{label}</T> : label}
      {children || <T b color={color}>{value}</T>}
    </View>
  );
}

export function Chip({ on, onPress, children, small, style }) {
  const t = useT();
  return (
    <Pressable onPress={onPress} style={[{ borderWidth: 1, borderColor: on ? t.ink : t.line, backgroundColor: on ? t.ink : t.bg, borderRadius: 20, paddingVertical: small ? 6 : 8, paddingHorizontal: small ? 11 : 12 }, style]}>
      <Text style={{ color: on ? t.bg : t.ink, fontSize: small ? 13 : 14 }}>{children}</Text>
    </Pressable>
  );
}
export const Chips = ({ children, style }) => <View style={[{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, style]}>{children}</View>;

export function Btn({ children, onPress, kind, small, style, disabled }) {
  const t = useT();
  const bg = kind === 'ok' ? t.ok : kind === 'ghost' ? t.bg : t.ink;
  const fg = kind === 'ok' ? '#fff' : kind === 'ghost' ? t.ink : t.bg;
  return (
    <Pressable disabled={disabled} onPress={onPress} style={({ pressed }) => [{ backgroundColor: bg, borderRadius: 14, paddingVertical: small ? 10 : 13, paddingHorizontal: small ? 16 : 13, alignItems: 'center', marginTop: small ? 0 : 12, opacity: pressed || disabled ? 0.7 : 1 }, kind === 'ghost' && { borderWidth: 1, borderColor: t.line }, style]}>
      <Text style={{ color: fg, fontWeight: '600', fontSize: 15 }}>{children}</Text>
    </Pressable>
  );
}

export function Input({ style, ...p }) {
  const t = useT();
  return <TextInput placeholderTextColor={t.mute} style={[{ fontSize: 16, color: t.ink, backgroundColor: t.bg, borderWidth: 1, borderColor: t.line, borderRadius: 12, paddingVertical: 11, paddingHorizontal: 12 }, style]} {...p} />;
}

// Campo de plata: pone los puntos de miles mientras escribís y acepta pegar montos.
// onValue recibe el número cada vez que cambia.
export function Money({ value, onValue, style, ...p }) {
  const [txt, setTxt] = useState(mv(value));
  // Si el valor cambia desde afuera (por ejemplo, se vació el formulario), actualizamos el texto
  useEffect(() => { if (Math.abs(parseMoney(txt) - (+value || 0)) > 0.001) setTxt(mv(value)); }, [value]);
  const onChange = raw => {
    let s = raw;
    // El teclado del iPhone puede mostrar "." como separador decimal: lo tomamos como coma
    if (s.length === txt.length + 1 && s.endsWith('.')) s = s.slice(0, -1) + ',';
    // Si pegaron un monto completo, lo interpretamos
    else if (s.length > txt.length + 1) { const n = parseMoney(s); s = n ? mv(n) : ''; }
    const m = maskStr(s);
    setTxt(m);
    onValue && onValue(parseMoney(m), m);
  };
  return <Input keyboardType="decimal-pad" value={txt} onChangeText={onChange} style={style} {...p} />;
}

export const Empty = ({ children }) => <T mute center style={{ paddingVertical: 24, paddingHorizontal: 10, fontSize: 14, lineHeight: 20 }}>{children}</T>;

export function Bar({ ratio, color }) {
  const t = useT();
  return (
    <View style={{ height: 8, borderRadius: 6, backgroundColor: t.ring, overflow: 'hidden', marginTop: 6 }}>
      <View style={{ width: Math.max(0, Math.min(1, ratio)) * 100 + '%', height: '100%', backgroundColor: color || t.ant, borderRadius: 6 }} />
    </View>
  );
}

export const Sep = () => { const t = useT(); return <View style={{ borderTopWidth: 1, borderColor: t.line, marginTop: 12, paddingTop: 2 }} />; };

// ---------- Diálogos (reemplazan alert/prompt, con promesa)
let showDlg = null;
export function dlg(o) { return new Promise(res => (showDlg ? showDlg({ ...o, res }) : res(o.input ? null : false))); }
export const confirm = (title, msg, ok) => dlg({ title, msg, ok });
export const notify = (title, msg) => dlg({ title, msg, cancel: false });

export function DialogHost() {
  const t = useT();
  const [o, setO] = useState(null);
  const [val, setVal] = useState('');
  useEffect(() => { showDlg = x => { setVal(x.def || ''); setO(x); }; return () => { showDlg = null; }; }, []);
  if (!o) return null;
  const done = v => { const r = o.res; setO(null); r(v); };
  return (
    <Modal transparent animationType="fade" visible onRequestClose={() => done(o.input ? null : false)}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,.5)', justifyContent: 'center', padding: 16 }}>
        <View style={{ backgroundColor: t.card, borderColor: t.line, borderWidth: 1, borderRadius: 18, padding: 18, alignSelf: 'center', width: '100%', maxWidth: 360 }}>
          <T b style={{ marginBottom: 8 }}>{o.title}</T>
          {o.msg ? <T sm style={{ marginBottom: 10, lineHeight: 19 }}>{o.msg}</T> : null}
          {o.input ? (o.money ? <Money autoFocus value={parseMoney(val)} onValue={n => setVal(mv(n))} /> : <Input autoFocus value={val} onChangeText={setVal} onSubmitEditing={() => done(val)} />) : null}
          <Chips style={{ marginTop: 14, justifyContent: 'flex-end' }}>
            {o.cancel === false ? null : <Chip onPress={() => done(o.input ? null : false)}>{typeof o.cancel === 'string' ? o.cancel : 'Cancelar'}</Chip>}
            <Chip on onPress={() => done(o.input ? val : true)}>{o.ok || 'Aceptar'}</Chip>
          </Chips>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export const st = StyleSheet.create({ hero: { alignItems: 'center', paddingVertical: 22 } });
