/* "Trocar usuário" — botão flutuante para alternar entre Administrador, Motorista e Aluno (modo demonstração). */
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '../ui/Icon';
import { Kicker, T, useBreakpoint } from '../ui/components';
import { colors, radius, shadow } from '../theme';
import { useRouter } from '../navigation/router';
import { ROLE_INFO, useSession } from '../state/session';
import { useToast } from '../ui/Toast';

export default function UserSwitcher() {
  const [open, setOpen] = useState(false);
  const session = useSession();
  const { reset } = useRouter();
  const toast = useToast();
  const { md } = useBreakpoint();
  const insets = useSafeAreaInsets();
  if (!session.role) return null;

  const pick = async (r) => {
    setOpen(false);
    try {
      const role = await session.entrarComo(r);
      reset(ROLE_INFO[role].home);
    } catch (e) { toast(e.message, { error: true }); }
  };

  const restaurar = async () => {
    setOpen(false);
    try {
      await session.restaurarDemo();
      reset('/acesso/login');
      toast('Dados de demonstração restaurados.');
    } catch (e) { toast(e.message, { error: true }); }
  };

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { right: md ? 20 : 16, bottom: (md ? 20 : 80) + insets.bottom }]}>
      {open ? (
        <View style={styles.panel}>
          <Kicker style={{ paddingHorizontal: 8, paddingVertical: 6 }}>TROCAR USUÁRIO</Kicker>
          {Object.entries(ROLE_INFO).map(([r, info]) => {
            const on = r === session.role;
            return (
              <Pressable key={r} onPress={() => pick(r)} style={({ pressed }) => [styles.opt, on && { backgroundColor: colors.surfaceBlue }, pressed && !on && { backgroundColor: colors.muted }]}>
                <Icon name={info.icon} size={16} color={on ? colors.primary : colors.foreground} />
                <View style={{ flex: 1 }}>
                  <T style={{ fontSize: 14, fontWeight: 700, color: on ? colors.primary : colors.foreground }}>{info.label}</T>
                  <T style={{ fontSize: 11, color: colors.mutedForeground }} numberOfLines={1}>{on ? session.usuario.nomeUsuario : 'Entrar como demonstração'}</T>
                </View>
                {on ? <T style={{ fontSize: 10, fontWeight: 700, color: colors.primary }}>ATIVO</T> : null}
              </Pressable>
            );
          })}
          <Pressable onPress={restaurar} style={({ pressed }) => [styles.opt, { borderTopWidth: 1, borderTopColor: colors.border, marginTop: 4 }, pressed && { backgroundColor: colors.muted }]}>
            <Icon name="rotate-ccw" size={16} color={colors.mutedForeground} />
            <T style={{ fontSize: 12, color: colors.mutedForeground }}>Restaurar dados de demonstração</T>
          </Pressable>
        </View>
      ) : null}
      <Pressable accessibilityRole="button" accessibilityLabel="Trocar usuário" onPress={() => setOpen(!open)} style={styles.btn}>
        <Icon name="users" size={16} color={colors.primaryForeground} />
        <T style={{ fontSize: 12, fontWeight: 700, color: colors.primaryForeground }}>{ROLE_INFO[session.role].label}</T>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', zIndex: 60, alignItems: 'flex-end' },
  panel: { width: 256, marginBottom: 8, padding: 8, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.card, ...shadow.lg },
  opt: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 8, paddingVertical: 10, borderRadius: radius.md },
  btn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, backgroundColor: colors.navy, ...shadow.lg },
});
