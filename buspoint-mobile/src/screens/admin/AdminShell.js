/* Estrutura do painel administrativo: menu lateral (fixo no tablet/web, gaveta no celular) e barra superior. */
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '../../ui/Icon';
import { Avatar, Brand, Button, T, useBreakpoint } from '../../ui/components';
import { colors, radius } from '../../theme';
import { h, useRouter } from '../../navigation/router';
import { useSession } from '../../state/session';
import { useToast } from '../../ui/Toast';
import { iniciais } from '../../utils/format';
import { ADMIN_NAV, NAMES } from './config';

function NavLink({ label, icon, active, onPress }) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [styles.navlink, active && { backgroundColor: colors.navActiveBg }, pressed && !active && { backgroundColor: 'rgba(255,255,255,0.08)' }]}
    >
      <Icon name={icon} size={17} color={active ? colors.navActiveText : colors.navText} />
      <T style={{ fontSize: 13, fontWeight: 500, color: active ? colors.navActiveText : colors.navText }}>{label}</T>
    </Pressable>
  );
}

function Sidebar({ sec, onNavigate }) {
  const { usuario, logout } = useSession();
  const { reset } = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView style={styles.sidebar} contentContainerStyle={{ flexGrow: 1, paddingTop: 24 + insets.top, paddingBottom: 24 + insets.bottom, paddingHorizontal: 16 }}>
      <View style={{ marginBottom: 44, paddingHorizontal: 12 }}><Brand /></View>
      <T style={styles.sidebarLabel}>MENU PRINCIPAL</T>
      <View style={{ flex: 1, gap: 4 }}>
        {ADMIN_NAV.map(([l, p, ic]) => <NavLink key={p} label={l} icon={ic} active={sec === p} onPress={() => onNavigate(h('admin', p))} />)}
      </View>
      <View style={styles.sidebarFoot}>
        <NavLink label="Meu perfil" icon="user-round" onPress={() => onNavigate(h('perfil', 'admin'))} />
        <NavLink label="Sair" icon="log-out" onPress={async () => { await logout(); reset(h('acesso', 'login')); }} />
      </View>
      <View style={styles.sidebarUser}>
        <Avatar initials={iniciais(usuario && usuario.nomeUsuario)} uri={usuario && usuario.fotoUsuario} />
        <View style={{ flex: 1 }}>
          <T style={{ fontSize: 12, fontWeight: 700, color: colors.primaryForeground }} numberOfLines={1}>{(usuario && usuario.nomeUsuario) || 'Administrador'}</T>
          <T style={{ fontSize: 11, color: colors.mutedForeground }}>Gestão BusPoint</T>
        </View>
      </View>
    </ScrollView>
  );
}

export default function AdminShell({ sec, children, modal }) {
  const { lg, md, sm } = useBreakpoint();
  const { navigate, path } = useRouter();
  const { usuario } = useSession();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const [menu, setMenu] = useState(false);
  const [slide] = useState(() => new Animated.Value(0));
  const scroll = useRef(null);

  useEffect(() => { if (scroll.current) scroll.current.scrollTo({ y: 0, animated: false }); }, [path]);
  useEffect(() => { Animated.timing(slide, { toValue: menu ? 1 : 0, duration: 200, useNativeDriver: true }).start(); }, [menu, slide]);

  const go = (p) => { setMenu(false); navigate(p); };

  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: colors.background }}>
      {lg ? <View style={{ width: 240 }}><Sidebar sec={sec} onNavigate={go} /></View> : null}
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={[styles.topbar, { paddingTop: insets.top, height: 70 + insets.top, paddingHorizontal: md ? 32 : 20 }]}>
          <View style={styles.topLeft}>
            {!lg ? <Button variant="ghost" iconOnly icon="menu" label="Abrir menu" onPress={() => setMenu(true)} /> : null}
            <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1 }}>
              {sm ? <><T style={styles.crumb}>Painel administrativo</T><Icon name="chevron-right" size={12} color={colors.mutedForeground} style={{ marginHorizontal: 4 }} /></> : null}
              <T style={[styles.crumb, { color: colors.foreground }]} numberOfLines={1}>{NAMES[sec] || sec}</T>
            </View>
          </View>
          <View style={styles.topRight}>
            {sm ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><View style={styles.dotOk} /><T style={{ fontSize: 12, color: colors.mutedForeground }}>Sistema operacional</T></View> : null}
            <Button variant="ghost" iconOnly icon="bell" label="Notificações" onPress={() => toast('Nenhuma nova notificação.')} />
            <View style={{ width: 1, height: 24, backgroundColor: colors.border }} />
            <Pressable onPress={() => navigate(h('perfil', 'admin'))} accessibilityLabel="Meu perfil">
              <Avatar initials={iniciais(usuario && usuario.nomeUsuario)} uri={usuario && usuario.fotoUsuario} />
            </Pressable>
          </View>
        </View>
        <ScrollView ref={scroll} contentContainerStyle={{ paddingHorizontal: md ? 32 : 20, paddingTop: md ? 36 : 28, paddingBottom: 120 + insets.bottom }} keyboardShouldPersistTaps="handled">
          <View style={{ width: '100%', maxWidth: 1530, alignSelf: 'center' }}>{children}</View>
        </ScrollView>
      </View>

      {!lg ? (
        <View pointerEvents={menu ? 'auto' : 'none'} style={StyleSheet.absoluteFill}>
          <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay, opacity: slide }]}>
            <Pressable style={{ flex: 1 }} onPress={() => setMenu(false)} accessibilityLabel="Fechar menu" />
          </Animated.View>
          <Animated.View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 240, transform: [{ translateX: slide.interpolate({ inputRange: [0, 1], outputRange: [-240, 0] }) }] }}>
            <Sidebar sec={sec} onNavigate={go} />
          </Animated.View>
        </View>
      ) : null}
      {modal}
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: { flex: 1, backgroundColor: colors.navy },
  sidebarLabel: { marginBottom: 12, paddingHorizontal: 12, fontSize: 10, fontWeight: 700, letterSpacing: 1, color: colors.mutedForeground },
  sidebarFoot: { borderTopWidth: 1, borderTopColor: colors.white10, paddingTop: 16, marginTop: 16, gap: 4 },
  sidebarUser: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16, padding: 12, borderRadius: radius.md, backgroundColor: colors.white5 },
  navlink: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 42, paddingHorizontal: 12, borderRadius: radius.md },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },
  topLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 1 },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  crumb: { fontSize: 14, fontWeight: 600, color: colors.mutedForeground },
  dotOk: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success },
});
