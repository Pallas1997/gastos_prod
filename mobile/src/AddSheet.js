// Hoja para cargar un gasto (en pesos o dólares)
import React, { useEffect, useState } from 'react';
import { View, Modal, Pressable, ScrollView, KeyboardAvoidingView, Platform, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { st, commit, CATS, cat$, FXN } from './lib/store';
import { fmt, today, fd, parseDate } from './lib/format';
import { fxRate } from './lib/fx';
import { T, Chip, Chips, Btn, Input, Money, useT } from './ui';

const PAY = { dig: '💳 Digital', efe: '💵 Efectivo' };

export default function AddSheet({ open, initialCat, onClose }) {
  const t = useT(), ins = useSafeAreaInsets(), S = st.S, F = st.M.fx;
  const [amt, setAmt] = useState(0), [cur, setCur] = useState('ars'), [cat, setCat] = useState('cafe');
  const [note, setNote] = useState(''), [pay, setPay] = useState('dig'), [h, setH] = useState(true), [date, setDate] = useState(fd(today()));

  useEffect(() => {
    if (!open) return;
    const c = initialCat || 'cafe';
    setAmt(0); setCur('ars'); setCat(c); setNote(''); setPay(S.lastPay || 'dig'); setH(!!cat$(c).h); setDate(fd(today()));
  }, [open]);

  const pick = id => { setCat(id); setH(!!cat$(id).h); };
  const R = fxRate();
  const saveExp = () => {
    if (!amt || amt <= 0) return;
    const usd = cur === 'usd' ? { usd: amt, rate: R } : {};
    const pesos = cur === 'usd' ? Math.round(amt * R * 100) / 100 : amt;
    commit(() => {
      S.exp.push({ ...usd, id: Date.now(), amt: pesos, cat, note: note.trim(), date: parseDate(date) || today(), h: h ? 1 : 0, pay, rev: 0 });
      S.lastPay = pay;
    });
    onClose();
  };

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,.4)' }} onPress={onClose} />
        <View style={{ backgroundColor: t.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' }}>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, paddingBottom: 20 + ins.bottom }}>
            <Chips style={{ marginBottom: 10 }}>
              <Chip small on={cur === 'ars'} onPress={() => setCur('ars')}>$ Pesos</Chip>
              <Chip small on={cur === 'usd'} onPress={() => setCur('usd')}>US$ Dólares</Chip>
              {cur === 'usd' ? Object.keys(FXN).map(k => <Chip small key={k} on={!F.manual && F.sel === k} onPress={() => commit(() => { F.sel = k; F.manual = 0; })}>{FXN[k]}</Chip>) : null}
            </Chips>
            <Money autoFocus value={amt} onValue={setAmt} placeholder={cur === 'usd' ? 'US$ 0' : '$ 0'} style={{ fontSize: 32, fontWeight: '700', textAlign: 'center' }} />
            {cur === 'usd' ? (
              <View style={{ marginTop: 6 }}>
                <T sm>Dólar {F.manual ? 'manual' : FXN[F.sel]}: {fmt(R)} · {F.live ? 'en vivo' : 'valor guardado'}</T>
                <T b>{amt ? '≈ ' + fmt(amt * R) + ' en pesos' : 'Escribí el monto en dólares'}</T>
              </View>
            ) : null}
            <Chips style={{ marginVertical: 14 }}>{CATS.map(c => <Chip key={c.id} on={c.id === cat} onPress={() => pick(c.id)}>{c.e} {c.n}</Chip>)}</Chips>
            <Input placeholder="¿Qué fue este gasto? (opcional)" value={note} onChangeText={setNote} />
            <Chips style={{ marginTop: 10 }}>{Object.keys(PAY).map(k => <Chip key={k} on={k === pay} onPress={() => setPay(k)}>{PAY[k]}</Chip>)}</Chips>
            <Pressable onPress={() => setH(!h)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 12 }}>
              <Switch value={h} onValueChange={setH} trackColor={{ true: t.ant }} />
              <T style={{ flex: 1, fontSize: 14 }}>Es un gasto hormiga (chico y repetido)</T>
            </Pressable>
            <Input placeholder="DD/MM/AAAA" value={date} onChangeText={setDate} keyboardType="numbers-and-punctuation" />
            <Btn onPress={saveExp}>Guardar gasto</Btn>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
