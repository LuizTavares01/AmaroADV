/* ESTADOS DO SISTEMA — 403, 404, 500, carregando, vazio, sucesso, erro. */
import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '../ui/Icon';
import { Brand, Button, LinkText, Muted, T } from '../ui/components';
import { colors } from '../theme';
import { useRouter } from '../navigation/router';
import { ROLE_INFO, useSession } from '../state/session';

const CONTENT = {
  403: ['403', 'Acesso não autorizado', 'Você não possui permissão para acessar esta página.'],
  404: ['404', 'Página não encontrada', 'A página que você procura não existe ou foi movida.'],
  500: ['500', 'Erro interno', 'Algo deu errado. Tente novamente em instantes.'],
  carregando: ['...', 'Carregando', 'Preparando suas informações.'],
  vazio: ['0', 'Nenhum resultado', 'Nenhum aluno encontrado para esta busca.'],
  sucesso: ['✓', 'Tudo certo!', 'Operação realizada com sucesso.'],
  erro: ['!', 'Revise os dados', 'Este e-mail já está cadastrado.'],
};

export default function SystemScreen({ slug }) {
  const { reset } = useRouter();
  const { role } = useSession();
  const insets = useSafeAreaInsets();
  const [code, title, desc] = CONTENT[slug] || CONTENT[404];
  const home = role ? ROLE_INFO[role].home : '/acesso/login';
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingHorizontal: 24, paddingBottom: 16, paddingTop: 16 + insets.top, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border }}><Brand light /></View>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
        <T display style={{ fontSize: 72, lineHeight: 80, fontWeight: 700, color: colors.primary }}>{code}</T>
        <T display style={{ marginTop: 20, fontSize: 24, fontWeight: 700, textAlign: 'center' }}>{title}</T>
        <Muted style={{ maxWidth: 448, marginTop: 8, textAlign: 'center' }}>{desc}</Muted>
        <LinkText title="Voltar ao início" icon="arrow-left" size={14} style={{ marginTop: 28 }} onPress={() => reset(home)} />
      </View>
    </View>
  );
}

/** Tela 403 exibida quando o perfil logado tenta abrir a área de outro perfil. */
export function Forbidden({ allow }) {
  const { reset } = useRouter();
  const { role } = useSession();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, backgroundColor: colors.background }}>
      <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.surfaceBlue, alignItems: 'center', justifyContent: 'center' }}><Icon name="lock" size={24} color={colors.primary} /></View>
      <T display style={{ marginTop: 20, fontSize: 60, lineHeight: 66, fontWeight: 700, color: colors.primary }}>403</T>
      <T display style={{ marginTop: 20, fontSize: 24, fontWeight: 700, textAlign: 'center' }}>Acesso não autorizado</T>
      <Muted style={{ maxWidth: 448, marginTop: 8, textAlign: 'center' }}>
        Esta área é exclusiva do perfil <T style={{ fontSize: 14, fontWeight: 700 }}>{ROLE_INFO[allow].label}</T>. Você está conectado como <T style={{ fontSize: 14, fontWeight: 700 }}>{ROLE_INFO[role].label}</T>.
      </Muted>
      <Button title="Ir para minha área" size="tall" style={{ marginTop: 28 }} onPress={() => reset(ROLE_INFO[role].home)} />
    </View>
  );
}
