/* Painel do administrador — despacha /admin/<seção>/<modo>/<id> para a tela certa. */
import React from 'react';
import { View } from 'react-native';
import { Empty, ErrorBox, Headline, Loading, Section } from '../../ui/components';
import { useQuery } from '../../data/useQuery';
import { carregarCadastros } from '../../data/loaders';
import { get } from '../../api/client';
import { useSession } from '../../state/session';
import AdminShell from './AdminShell';
import {
  AdminDetails, AdminForm, AdminLinking, AdminList, NovoBotao,
} from './AdminCrud';
import { AdminDashboard, AdminMonitoring } from './AdminOps';
import { LABELS, NAMES } from './config';

const SECOES = ['alunos', 'motoristas', 'onibus', 'rotas', 'viagens'];

export default function AdminScreen({ slug }) {
  const { usuario } = useSession();
  const parts = String(slug || 'dashboard').split('/');
  const sec = parts[0] || 'dashboard';
  const mode = parts[1] || 'list';
  const id = parts[2] ? Number(parts[2]) : null;
  const q = useQuery(async () => {
    const [cad, solicitacoes] = await Promise.all([carregarCadastros(), get('/api/solicitacoes-horario')]);
    return { ...cad, solicitacoes };
  }, []);

  let content;
  if (!q.data && q.loading) content = <Loading />;
  else if (!q.data) content = <ErrorBox error={q.error} onRetry={q.reload} />;
  else {
    const data = q.data;
    const rows = data[sec] || [];
    const entity = id != null ? rows.find((r) => r.id === id) : null;
    if (sec === 'dashboard') content = <AdminDashboard data={data} solicitacoes={data.solicitacoes} usuario={usuario} />;
    else if (sec === 'embarques' || sec === 'desembarques') content = <AdminMonitoring key={sec} sec={sec} data={data} />;
    else if (sec === 'historico') {
      content = (
        <View>
          <Headline eyebrow="OPERAÇÃO / CONSULTA" title="Histórico de viagens" description="Consulte as viagens finalizadas e seus registros." />
          <Section title="Viagens finalizadas"><AdminList sec="historico" tableSection="viagens" type="viagem" rows={data.viagens.filter((t) => t.statusRaw === 'FINALIZADA')} /></Section>
        </View>
      );
    } else if (!SECOES.includes(sec)) content = <Empty text="Seção não encontrada." />;
    else if (mode.startsWith('vincular-')) content = <AdminLinking key={slug} mode={mode} id={id} data={data} />;
    else if (mode === 'novo' || mode === 'editar') {
      content = mode === 'editar' && !entity ? <Empty text="Registro não encontrado." /> : <AdminForm key={slug} sec={sec} mode={mode} entity={entity} data={data} />;
    } else if (mode === 'detalhes') content = <AdminDetails sec={sec} entity={entity} data={data} />;
    else {
      content = (
        <View>
          <Headline eyebrow="GESTÃO / CADASTROS" title={NAMES[sec]} description={`Gerencie ${NAMES[sec].toLowerCase()} do transporte escolar.`} action={<NovoBotao sec={sec} />} />
          <Section title={`${sec === 'rotas' || sec === 'viagens' ? 'Todas as' : 'Todos os'} ${NAMES[sec].toLowerCase()}`}><AdminList key={sec} sec={sec} type={LABELS[sec]} rows={rows} /></Section>
        </View>
      );
    }
  }
  return <AdminShell sec={sec}>{content}</AdminShell>;
}
