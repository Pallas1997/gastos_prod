import React, { useEffect, useRef, useState } from 'react';
import { View, ScrollView, Pressable, Text, Modal, AppState, useColorScheme, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore, load, st, commit, acceptPrivacy, switchP, addP, renameP, delP } from './src/lib/store';
import { fetchFx } from './src/lib/fx';
import { initSync } from './src/lib/sync';
import { ThemeCtx, LIGHT, DARK, DialogHost, dlg, confirm, T } from './src/ui';
import AddSheet from './src/AddSheet';
import Home from './src/screens/Home';
import Income from './src/screens/Income';
import Expenses from './src/screens/Expenses';
import Fixed from './src/screens/Fixed';
import Super from './src/screens/Super';

export default function App() {
  return (
    <SafeAreaProvider>
      <Main />
    </SafeAreaProvider>
  );
}

function Main() {
  useStore();
  const sys = useColorScheme();
  const [tab, setTab] = useState('home');
  const [sheet, setSheet] = useState({ open: false, cat: null });
  const [menu, setMenu] = useState(false);
  const scroll = useRef(null);
  const ins = useSafeAreaInsets();

  useEffect(() => {
    load().then(initSync).then(fetchFx);
    const iv = setInterval(fetchFx, 300000);
    const sub = AppState.addEventListener('change', s => { if (s === 'active') fetchFx(); });
    return () => { clearInterval(iv); sub.remove(); };
  }, []);

  const dark = (st.M.theme || sys) === 'dark';
  const t = dark ? DARK : LIGHT;

  useEffect(() => {
    if (st.ready && !st.ok) {
      dlg({ title: '🔒 Tus datos son tuyos', msg: 'Todo lo que cargás (gastos, sueldo, ingresos) se guarda solo en este celular. Solo se sube a tu servidor si entrás con tu cuenta en "Gastos → Mi cuenta" para sincronizar.\n\nLa app únicamente consulta la cotización del dólar, sin enviar ningún dato tuyo.\n\nTip: usá "Guardar copia" de vez en cuando para tener un respaldo.', ok: 'Aceptar y empezar', cancel: false }).then(acceptPrivacy);
    }
  }, [st.ready]);

  const go = k => { setTab(k); scroll.current && scroll.current.scrollTo({ y: 0, animated: false }); };
  const openSheet = cat => setSheet({ open: true, cat: cat || null });
  const cur = st.M.list.find(p => p.id === st.M.cur) || st.M.list[0];

  if (!st.ready) return <View style={{ flex: 1, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={t.ok} /></View>;

  const Screen = { home: Home, inc: Income, list: Expenses, fix: Fixed, sup: Super }[tab];

  return (
    <ThemeCtx.Provider value={t}>
      <View style={{ flex: 1, backgroundColor: t.bg }}>
        <StatusBar style={dark ? 'light' : 'dark'} />
        {/* Barra superior: perfil y tema */}
        <View style={{ paddingTop: ins.top + 8, paddingHorizontal: 14, paddingBottom: 6, flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
          <Pressable onPress={() => setMenu(true)} style={{ height: 36, borderRadius: 18, borderWidth: 1, borderColor: t.line, backgroundColor: t.card, paddingHorizontal: 14, justifyContent: 'center', maxWidth: '65%' }}>
            <Text numberOfLines={1} style={{ color: t.ink, fontWeight: '600', fontSize: 14 }}>👤 {cur.name} ▾</Text>
          </Pressable>
          <Pressable onPress={() => commit(() => { st.M.theme = dark ? 'light' : 'dark'; })} style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: t.line, backgroundColor: t.card, alignItems: 'center', justifyContent: 'center' }} accessibilityLabel="Cambiar tema">
            <Text style={{ fontSize: 17 }}>{dark ? '☀️' : '🌙'}</Text>
          </Pressable>
        </View>

        <ScrollView ref={scroll} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 6, paddingBottom: 120 }}>
          <Screen go={go} openSheet={openSheet} />
        </ScrollView>

        {/* Barra de pestañas */}
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: t.card, borderTopWidth: 1, borderColor: t.line, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-start', paddingTop: 8, paddingBottom: 8 + ins.bottom, paddingHorizontal: 4 }}>
          <TabBtn t={t} on={tab === 'home'} icon="◔" label="Inicio" onPress={() => go('home')} />
          <TabBtn t={t} on={tab === 'inc'} icon="💰" label="Ingresos" onPress={() => go('inc')} />
          <Pressable onPress={() => openSheet()} accessibilityLabel="Cargar gasto" style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: t.ok, marginTop: -26, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 7, shadowOffset: { width: 0, height: 4 }, elevation: 6 }}>
            <Text style={{ color: '#fff', fontSize: 30, lineHeight: 34 }}>+</Text>
          </Pressable>
          <TabBtn t={t} on={tab === 'list'} icon="☰" label="Gastos" onPress={() => go('list')} />
          <TabBtn t={t} on={tab === 'fix'} icon="📌" label="Servicios" onPress={() => go('fix')} />
          <TabBtn t={t} on={tab === 'sup'} icon="🛒" label="Súper" onPress={() => go('sup')} />
        </View>

        <AddSheet open={sheet.open} initialCat={sheet.cat} onClose={() => setSheet({ open: false, cat: null })} />
        <ProfileMenu open={menu} onClose={() => setMenu(false)} t={t} ins={ins} />
        <DialogHost />
      </View>
    </ThemeCtx.Provider>
  );
}

function TabBtn({ t, on, icon, label, onPress }) {
  return (
    <Pressable onPress={onPress} style={{ alignItems: 'center', paddingHorizontal: 4, paddingVertical: 2, minWidth: 54 }}>
      <Text style={{ fontSize: 20, color: on ? t.ink : t.mute }}>{icon}</Text>
      <Text style={{ fontSize: 10, color: on ? t.ink : t.mute, fontWeight: on ? '700' : '400' }}>{label}</Text>
    </Pressable>
  );
}

function ProfileMenu({ open, onClose, t, ins }) {
  // En iPhone no se puede abrir un diálogo mientras se cierra otro: esperamos un instante
  const close = () => { onClose(); return new Promise(r => setTimeout(r, 400)); };
  const ask = async (title, def) => { const v = await dlg({ title, input: 1, def, ok: 'Guardar' }); return v === null ? null : v.trim(); };
  const add = async () => { await close(); const n = await ask('Nombre del perfil nuevo', 'Perfil ' + (st.M.list.length + 1)); if (n !== null) addP(n); };
  const ren = async p => { await close(); const n = await ask('Nuevo nombre', p.name); if (n) renameP(p.id, n); };
  const del = async p => { await close(); if (await confirm('¿Borrar "' + p.name + '"?', 'Se borran todos sus gastos. No se puede deshacer.', 'Borrar')) delP(p.id); };
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={{ flex: 1 }} onPress={onClose}>
        <View style={{ position: 'absolute', top: ins.top + 52, right: 14, width: 290, backgroundColor: t.card, borderWidth: 1, borderColor: t.line, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 15, elevation: 8 }}>
          {st.M.list.map(p => (
            <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, borderBottomWidth: 1, borderColor: t.line }}>
              <Pressable style={{ flex: 1, paddingVertical: 6 }} onPress={() => { switchP(p.id); onClose(); }}>
                <T b={p.id === st.M.cur} color={p.id === st.M.cur ? t.ok : t.ink}>{p.id === st.M.cur ? '✓ ' : ''}{p.name}</T>
              </Pressable>
              <T mute onPress={() => ren(p)} style={{ fontSize: 18, padding: 6 }}>✎</T>
              {st.M.list.length > 1 ? <T mute onPress={() => del(p)} style={{ fontSize: 18, padding: 6 }}>✕</T> : null}
            </View>
          ))}
          <Pressable style={{ paddingVertical: 12 }} onPress={add}><T>＋ Agregar perfil</T></Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}
