/* PERFIL — dados da conta, edição, troca de senha e foto. */
import React, { useEffect, useState } from 'react';
import { Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import {
  Avatar, Brand, Button, Card, Display, Field, Grid, Headline, Input, Kicker, LinkText, Muted, Row, T, useBreakpoint,
} from '../ui/components';
import { colors } from '../theme';
import { useRouter } from '../navigation/router';
import { ROLE_INFO, useSession } from '../state/session';
import { put } from '../api/client';
import { useToast } from '../ui/Toast';
import { iniciais, mascaraTelefone, soDigitos, telefone } from '../utils/format';

export default function ProfileScreen({ role }) {
  const { usuario, atualizar } = useSession();
  const { navigate, back } = useRouter();
  const toast = useToast();
  const { sm } = useBreakpoint();
  const insets = useSafeAreaInsets();
  const [screen, setScreen] = useState('view');
  const [saved, setSaved] = useState(false);
  const [f, setF] = useState({});
  const [erros, setErros] = useState({});
  const [erro, setErro] = useState('');
  const [busy, setBusy] = useState(false);
  const label = ROLE_INFO[role].label;

  const abrir = (tela) => {
    setErros({}); setErro('');
    if (tela === 'edit') setF({ nomeUsuario: usuario.nomeUsuario, emailUsuario: usuario.emailUsuario, telefoneUsuario: mascaraTelefone(usuario.telefoneUsuario), loginUsuario: usuario.loginUsuario });
    if (tela === 'password') setF({ senhaAtual: '', novaSenha: '', confirmar: '' });
    setScreen(tela);
  };

  useEffect(() => {
    if (!saved) return undefined;
    const t = setTimeout(() => setSaved(false), 4000);
    return () => clearTimeout(t);
  }, [saved]);

  const set = (k) => (v) => { setF((s) => ({ ...s, [k]: k === 'telefoneUsuario' ? mascaraTelefone(v) : v })); setErros((e) => ({ ...e, [k]: undefined })); };

  const salvar = async () => {
    setBusy(true); setErro(''); setErros({});
    try {
      if (screen === 'edit') await put('/api/usuarios/me', { ...f, telefoneUsuario: soDigitos(f.telefoneUsuario) });
      else {
        if (f.novaSenha !== f.confirmar) throw new Error('As senhas não coincidem.');
        await put('/api/usuarios/me/senha', { senhaAtual: f.senhaAtual, novaSenha: f.novaSenha });
      }
      await atualizar();
      setScreen('view');
      setSaved(true);
    } catch (e) {
      if (e.campos) setErros(e.campos);
      setErro(e.campos ? 'Revise os campos destacados.' : e.message);
    } finally { setBusy(false); }
  };

  const escolherFoto = async () => {
    try {
      if (Platform.OS !== 'web') {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) { toast('Permita o acesso às fotos para alterar a imagem.', { error: true }); return; }
      }
      const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.4, base64: true });
      if (r.canceled || !r.assets || !r.assets[0]) return;
      const a = r.assets[0];
      const uri = a.base64 ? `data:${a.mimeType || 'image/jpeg'};base64,${a.base64}` : a.uri;
      await put('/api/usuarios/me/foto', { fotoUsuario: uri });
      await atualizar();
      setSaved(true);
    } catch (e) { toast(e.message, { error: true }); }
  };

  const removerFoto = async () => {
    try { await put('/api/usuarios/me/foto', { fotoUsuario: null }); await atualizar(); setSaved(true); } catch (e) { toast(e.message, { error: true }); }
  };

  const title = screen === 'edit' ? 'Editar perfil' : screen === 'password' ? 'Alterar senha' : 'Meu perfil';
  const ini = iniciais(usuario.nomeUsuario);
  let body;
  if (screen === 'view') {
    const info = [['Nome', usuario.nomeUsuario], ['E-mail', usuario.emailUsuario], ['Telefone', telefone(usuario.telefoneUsuario)], ['Login', usuario.loginUsuario], ['Tipo de usuário', label]];
    if (role === 'aluno') info.push(['Matrícula', String(usuario.numeroMatricula)], ['Período', usuario.periodo]);
    if (role === 'motorista') info.push(['CNH', `${usuario.numeroCnh} · categoria ${usuario.categoriaCnh}`]);
    body = (
      <View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, paddingBottom: 24, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <Avatar initials={ini} uri={usuario.fotoUsuario} lg />
          <View style={{ flexShrink: 1 }}><Display>{usuario.nomeUsuario}</Display><Muted>{label}</Muted></View>
        </View>
        <View style={{ paddingVertical: 24 }}>
          <Grid cols={sm ? 2 : 1} gap={20}>
            {info.map(([a, b]) => <View key={a}><Kicker style={{ marginBottom: 4 }}>{a}</Kicker><T style={{ fontSize: 14, fontWeight: 600 }}>{b}</T></View>)}
          </Grid>
        </View>
        <Row gap={8} style={{ paddingTop: 20, borderTopWidth: 1, borderTopColor: colors.border }}>
          <Button icon="square-pen" title="Editar perfil" onPress={() => abrir('edit')} />
          <Button variant="outline" icon="lock-keyhole" title="Alterar senha" onPress={() => abrir('password')} />
        </Row>
      </View>
    );
  } else {
    const campos = screen === 'edit'
      ? [['Nome', 'nomeUsuario'], ['E-mail', 'emailUsuario', 'email'], ['Telefone', 'telefoneUsuario', 'tel'], ['Login', 'loginUsuario', 'login']]
      : [['Senha atual', 'senhaAtual', 'password'], ['Nova senha', 'novaSenha', 'password'], ['Confirmar nova senha', 'confirmar', 'password']];
    body = (
      <View>
        <Grid cols={sm ? 2 : 1} gap={20}>
          {campos.map(([l, k, t]) => <Field key={k} label={l} error={erros[k]}><Input value={f[k]} onChangeText={set(k)} type={t || 'text'} placeholder={`Digite ${l.toLowerCase()}`} label={l} /></Field>)}
        </Grid>
        {screen === 'password' ? <Muted style={{ fontSize: 12, marginTop: 12 }}>Use no mínimo 8 caracteres, com letras e números.</Muted> : null}
        {screen === 'edit' ? (
          <View style={{ marginTop: 20 }}>
            <T style={{ fontSize: 12, fontWeight: 700, marginBottom: 7 }}>Foto do perfil</T>
            <Row>
              <Avatar initials={ini} uri={usuario.fotoUsuario} lg />
              <Button variant="outline" title="Alterar foto" onPress={escolherFoto} />
              {usuario.fotoUsuario ? <Button variant="ghost" title="Remover" onPress={removerFoto} /> : null}
            </Row>
          </View>
        ) : null}
        {erro ? <T accessibilityRole="alert" style={{ marginTop: 16, fontSize: 13, color: colors.destructive }}>{erro}</T> : null}
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 8, marginTop: 24 }}>
          <Button variant="outline" title="Cancelar" onPress={() => abrir('view')} />
          <Button title="Salvar alterações" loading={busy} onPress={salvar} />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border, paddingTop: insets.top }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 64, maxWidth: 896, width: '100%', alignSelf: 'center', paddingHorizontal: 20 }}>
          <Brand light />
          <LinkText title="Voltar" icon="arrow-left" size={14} weight={600} onPress={() => (back() ? null : navigate(ROLE_INFO[role].home))} />
        </View>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 40, paddingBottom: 120 + insets.bottom }} keyboardShouldPersistTaps="handled">
        <View style={{ maxWidth: 768, width: '100%', alignSelf: 'center' }}>
          <Headline eyebrow="CONTA / DADOS PESSOAIS" title={title} description="Gerencie seus dados de acesso e contato." />
          <Card pad="lg">{body}</Card>
          {saved ? <T accessibilityRole="alert" style={{ marginTop: 16, fontSize: 14, fontWeight: 600, color: colors.success }}>Alterações salvas com sucesso.</T> : null}
        </View>
      </ScrollView>
    </View>
  );
}
