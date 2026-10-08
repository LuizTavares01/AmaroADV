/* ACESSO — login, primeiro acesso, verificação de identidade, definir/recuperar senha, sucesso e splash. */
import React, { useEffect, useState } from 'react';
import { Animated, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '../ui/Icon';
import {
  AppModal, Brand, Button, Field, Input, Kicker, ModalActions, Muted, Row, T, useBreakpoint,
} from '../ui/components';
import { colors, radius } from '../theme';
import { h, useRouter } from '../navigation/router';
import { ROLE_INFO, useSession } from '../state/session';
import { post } from '../api/client';
import { mascaraTelefone } from '../utils/format';
import { useToast } from '../ui/Toast';

const HEADINGS = {
  login: ['Bem-vindo de volta', 'Acesse sua conta para continuar.'],
  primeiro: ['Primeiro acesso', 'Vamos configurar seu acesso ao BusPoint.'],
  verificar: ['Verificar identidade', 'Confirme seus dados para continuar.'],
  definir: ['Definir senha', 'Crie uma senha segura para sua conta.'],
  resetar: ['Recuperar senha', 'Confirme seus dados e defina uma nova senha.'],
  sucesso: ['Tudo pronto!', 'Sua senha foi definida com sucesso.'],
  splash: ['BusPoint', 'Preparando sua experiência.'],
};

// Estado compartilhado entre as etapas do primeiro acesso
const fluxo = { token: null, nome: null };

function PasswordInput({ value, onChangeText, placeholder, label, onSubmitEditing }) {
  const [show, setShow] = useState(false);
  return (
    <Input
      value={value} onChangeText={onChangeText} placeholder={placeholder} label={label}
      type={show ? 'login' : 'password'} onSubmitEditing={onSubmitEditing}
      right={<Button variant="ghost" iconOnly icon={show ? 'eye-off' : 'eye'} label={show ? 'Ocultar senha' : 'Mostrar senha'} onPress={() => setShow(!show)} />}
    />
  );
}

function Loader() {
  const [o] = useState(() => new Animated.Value(1));
  useEffect(() => {
    const a = Animated.loop(Animated.sequence([
      Animated.timing(o, { toValue: 0.5, duration: 1000, useNativeDriver: true }),
      Animated.timing(o, { toValue: 1, duration: 1000, useNativeDriver: true }),
    ]));
    a.start();
    return () => a.stop();
  }, [o]);
  return (
    <View style={styles.loader}><Animated.View style={{ width: '66%', height: '100%', backgroundColor: colors.primary, opacity: o }} /></View>
  );
}

function ConnectionModal({ visible, onClose }) {
  const session = useSession();
  const toast = useToast();
  const [modo, setModo] = useState(session.config.modo);
  const [url, setUrl] = useState(session.config.url);
  const opcoes = [
    ['local', 'No aparelho', 'O back-end roda dentro do app. Funciona sem internet.'],
    ['servidor', 'Servidor da API', 'Conecta ao servidor Node (backend/server.js).'],
  ];
  return (
    <AppModal visible={visible} onClose={onClose}>
      <T display style={{ fontSize: 18, fontWeight: 700 }}>Conexão com a API</T>
      <Muted style={{ marginTop: 8 }}>Escolha onde os dados do BusPoint ficam armazenados.</Muted>
      <View style={{ gap: 8, marginTop: 16 }}>
        {opcoes.map(([v, t, s]) => (
          <Pressable key={v} onPress={() => setModo(v)} style={[styles.connOpt, modo === v && { borderColor: colors.primary, backgroundColor: colors.surfaceBlue }]}>
            <Icon name={v === 'local' ? 'bus-front' : 'server'} size={18} color={modo === v ? colors.primary : colors.mutedForeground} />
            <View style={{ flex: 1 }}>
              <T style={{ fontSize: 14, fontWeight: 700, color: modo === v ? colors.primary : colors.foreground }}>{t}</T>
              <Muted style={{ fontSize: 11 }}>{s}</Muted>
            </View>
          </Pressable>
        ))}
      </View>
      {modo === 'servidor' ? (
        <Field label="Endereço do servidor" style={{ marginTop: 16 }}>
          <Input value={url} onChangeText={setUrl} type="login" placeholder="http://192.168.0.10:8080" />
        </Field>
      ) : null}
      <ModalActions>
        <Button variant="outline" title="Cancelar" onPress={onClose} />
        <Button
          title="Salvar"
          onPress={async () => {
            await session.configurar({ modo, url: url.trim() });
            onClose();
            toast(modo === 'local' ? 'Usando o back-end no aparelho.' : `Conectado a ${url.trim()}.`);
          }}
        />
      </ModalActions>
    </AppModal>
  );
}

export default function AccessScreen({ slug: slugIn }) {
  const slug = HEADINGS[slugIn] ? slugIn : 'login';
  const [title, sub] = HEADINGS[slug];
  const { navigate, reset } = useRouter();
  const session = useSession();
  const { lg } = useBreakpoint();
  const insets = useSafeAreaInsets();
  const [f, setF] = useState({ login: '', senha: '', telefone: '', nova: '', confirma: '' });
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [conn, setConn] = useState(false);
  const set = (k) => (v) => { setF((s) => ({ ...s, [k]: v })); setErro(''); };

  const exec = async (fn) => {
    setEnviando(true);
    setErro('');
    try { await fn(); } catch (e) { setErro(e.message); } finally { setEnviando(false); }
  };

  const conferirSenhas = () => {
    if (f.nova.length < 8) throw new Error('A senha precisa ter no mínimo 8 caracteres.');
    if (f.nova !== f.confirma) throw new Error('As senhas não coincidem.');
  };

  const submit = () => exec(async () => {
    if (slug === 'login') {
      if (!f.login.trim() || !f.senha) throw new Error('Informe login e senha.');
      const role = await session.login(f.login.trim(), f.senha);
      reset(ROLE_INFO[role].home);
    } else if (slug === 'primeiro') {
      if (!f.login.trim() || !f.telefone.trim()) throw new Error('Preencha login e telefone.');
      const r = await post('/api/auth/verificar-identidade', { login: f.login.trim(), telefone: f.telefone });
      Object.assign(fluxo, { token: r.tokenRedefinicao, nome: r.nomeUsuario });
      navigate(h('acesso', 'verificar'));
    } else if (slug === 'verificar') {
      if (!fluxo.token) { navigate(h('acesso', 'primeiro')); return; }
      navigate(h('acesso', 'definir'));
    } else if (slug === 'definir') {
      conferirSenhas();
      if (!fluxo.token) throw new Error('Confirme seus dados em "Primeiro acesso" antes de definir a senha.');
      await post('/api/auth/definir-senha', { tokenRedefinicao: fluxo.token, novaSenha: f.nova });
      fluxo.token = null;
      navigate(h('acesso', 'sucesso'));
    } else if (slug === 'resetar') {
      if (!f.login.trim() || !f.telefone.trim()) throw new Error('Preencha login e telefone.');
      conferirSenhas();
      const r = await post('/api/auth/verificar-identidade', { login: f.login.trim(), telefone: f.telefone });
      await post('/api/auth/definir-senha', { tokenRedefinicao: r.tokenRedefinicao, novaSenha: f.nova });
      navigate(h('acesso', 'sucesso'));
    }
  });

  let box;
  if (slug === 'sucesso') {
    box = (
      <View style={{ alignItems: 'center' }}>
        <View style={[styles.successCircle, { width: 64, height: 64, borderRadius: 32 }]}><Icon name="circle-check" size={32} color={colors.success} /></View>
        <T display style={{ marginTop: 20, fontSize: 24, fontWeight: 700 }}>{title}</T>
        <Muted style={{ marginTop: 8, textAlign: 'center' }}>{sub}</Muted>
        <Button title="Ir para login" iconRight="arrow-right" block size="tall" style={{ marginTop: 32 }} onPress={() => reset(h('acesso', 'login'))} />
      </View>
    );
  } else if (slug === 'splash') {
    box = (
      <View style={{ alignItems: 'center' }}>
        <View style={{ marginBottom: 20 }}><Brand light /></View>
        <Muted>Carregando...</Muted>
        <Loader />
        {session.pronto ? <Button variant="outline" title="Continuar" style={{ marginTop: 32 }} onPress={() => reset(session.role ? ROLE_INFO[session.role].home : h('acesso', 'login'))} /> : null}
      </View>
    );
  } else {
    const submitLabel = { login: 'Entrar', primeiro: 'Verificar identidade', verificar: 'Continuar', resetar: 'Confirmar nova senha' }[slug] || 'Definir senha';
    box = (
      <View>
        <Kicker primary style={{ marginBottom: 12 }}>ACESSO AO SISTEMA</Kicker>
        <T display style={{ fontSize: 27, fontWeight: 700 }}>{title}</T>
        <Muted style={{ marginTop: 8 }}>{sub}</Muted>
        <View style={{ marginTop: 36, gap: 20 }}>
          {slug === 'login' ? (
            <>
              <Field label="Login ou e-mail"><Input value={f.login} onChangeText={set('login')} type="email" placeholder="seu.email@exemplo.com" /></Field>
              <Field label="Senha"><PasswordInput value={f.senha} onChangeText={set('senha')} placeholder="Digite sua senha" label="Senha" onSubmitEditing={submit} /></Field>
              <View style={{ alignItems: 'flex-end' }}>
                <Pressable onPress={() => navigate(h('acesso', 'resetar'))} hitSlop={8}><T style={{ fontSize: 12, fontWeight: 700, color: colors.primary }}>Esqueci minha senha</T></Pressable>
              </View>
            </>
          ) : null}
          {slug === 'primeiro' || slug === 'resetar' ? (
            <>
              <Field label="Login ou e-mail"><Input value={f.login} onChangeText={set('login')} type="email" placeholder="Seu login ou e-mail" /></Field>
              <Field label="Telefone cadastrado"><Input value={f.telefone} onChangeText={(v) => set('telefone')(mascaraTelefone(v))} type="tel" placeholder="(00) 00000-0000" /></Field>
            </>
          ) : null}
          {slug === 'verificar' ? (
            fluxo.token
              ? <View style={styles.infoBox}><T style={{ fontSize: 12, color: colors.primary }}>Conta encontrada: <T style={{ fontSize: 12, fontWeight: 700, color: colors.primary }}>{fluxo.nome}</T>. Confirme os dados vinculados à conta para prosseguir.</T></View>
              : <View style={styles.infoBox}><T style={{ fontSize: 12, color: colors.primary }}>Informe primeiro seu login e telefone para localizarmos a conta.</T></View>
          ) : null}
          {slug === 'resetar' || slug === 'definir' ? (
            <>
              <Field label="Nova senha"><PasswordInput value={f.nova} onChangeText={set('nova')} label="Nova senha" /></Field>
              <Field label={slug === 'definir' ? 'Confirmar senha' : 'Confirmar nova senha'}><PasswordInput value={f.confirma} onChangeText={set('confirma')} label="Confirmar senha" onSubmitEditing={submit} /></Field>
              <Muted style={{ fontSize: 12 }}>Use no mínimo 8 caracteres, com letras e números.</Muted>
            </>
          ) : null}
          {erro ? <T accessibilityRole="alert" style={{ fontSize: 12, color: colors.destructive }}>{erro}</T> : null}
          <Button title={submitLabel} iconRight="arrow-right" block size="tall" loading={enviando} onPress={submit} />
        </View>

        {slug === 'login' ? (
          <View style={styles.demoBox}>
            <Kicker style={{ marginBottom: 10 }}>ENTRAR COMO (DEMONSTRAÇÃO)</Kicker>
            <Row gap={8}>
              {Object.entries(ROLE_INFO).map(([r, info]) => (
                <Button key={r} variant="outline" size="sm" icon={info.icon} title={info.label} onPress={() => exec(async () => { const role = await session.entrarComo(r); reset(ROLE_INFO[role].home); })} />
              ))}
            </Row>
            <Muted style={{ fontSize: 11, marginTop: 10 }}>Logins: admin / admin123 · carlos.mendes / motorista123 · joao.silva / aluno123</Muted>
          </View>
        ) : null}

        <View style={{ marginTop: 24, alignItems: 'center' }}>
          {slug === 'login' ? (
            <T style={{ fontSize: 14 }}>Ainda não configurou sua senha?{' '}
              <T style={{ fontSize: 14, fontWeight: 700, color: colors.primary }} onPress={() => navigate(h('acesso', 'primeiro'))}>Primeiro acesso</T>
            </T>
          ) : (
            <Pressable onPress={() => reset(h('acesso', 'login'))} hitSlop={8}><T style={{ fontSize: 14, fontWeight: 700, color: colors.primary }}>← Voltar para o login</T></Pressable>
          )}
        </View>
        <Pressable onPress={() => setConn(true)} style={styles.connLink} hitSlop={6}>
          <Icon name="server" size={12} color={colors.mutedForeground} />
          <Muted style={{ fontSize: 12 }}>Conexão: {session.config.modo === 'local' ? 'no aparelho' : session.config.url} · <T style={{ fontSize: 12, color: colors.primary, fontWeight: 700 }}>Alterar</T></Muted>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: colors.background }}>
      {lg ? (
        <View style={[styles.aside, { paddingTop: 48 + insets.top }]}>
          <Brand />
          <View>
            <View style={styles.art}><Icon name="bus-front" size={48} color={colors.primaryForeground} /></View>
            <T display style={{ maxWidth: 448, fontSize: 42, lineHeight: 50, fontWeight: 700, color: colors.primaryForeground }}>O transporte escolar em movimento.</T>
            <T style={{ maxWidth: 448, marginTop: 20, fontSize: 16, lineHeight: 26, color: colors.white65 }}>Uma experiência conectada para quem organiza, conduz e vive cada trajeto.</T>
          </View>
          <T style={{ fontSize: 12, color: colors.white40 }}>© {new Date().getFullYear()} BusPoint</T>
        </View>
      ) : null}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={[styles.main, { paddingTop: 40 + insets.top, paddingBottom: 40 + insets.bottom }]} keyboardShouldPersistTaps="handled">
          <View style={styles.box}>
            {!lg && slug !== 'splash' ? <View style={{ marginBottom: 48 }}><Brand light /></View> : null}
            {box}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      {conn ? <ConnectionModal visible onClose={() => setConn(false)} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  aside: { width: '47%', justifyContent: 'space-between', padding: 48, backgroundColor: colors.navy },
  art: { width: 80, height: 80, marginBottom: 32, borderRadius: radius.lg, backgroundColor: 'rgba(17, 98, 196, 0.3)', alignItems: 'center', justifyContent: 'center' },
  main: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  box: { width: '100%', maxWidth: 390 },
  infoBox: { padding: 12, borderRadius: radius.md, backgroundColor: colors.surfaceBlue },
  loader: { width: 128, height: 4, marginTop: 20, overflow: 'hidden', borderRadius: 999, backgroundColor: colors.secondary },
  successCircle: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.softGreen },
  demoBox: { marginTop: 28, padding: 16, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  connLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 40 },
  connOpt: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
});
