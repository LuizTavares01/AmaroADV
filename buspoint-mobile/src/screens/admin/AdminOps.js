/* Visão geral (dashboard) e monitoramento de embarques/desembarques em tempo real. */
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import Icon from '../../ui/Icon';
import {
  Avatar, Badge, Button, Card, Display, Divide, Dot, Empty, Grid, Headline, IconTile, Kicker, KvRow,
  LinkText, Muted, Row, Section, Split, T, Table, useBreakpoint,
} from '../../ui/components';
import { colors, radius } from '../../theme';
import { h, useRouter } from '../../navigation/router';
import { patch } from '../../api/client';
import { useToast } from '../../ui/Toast';
import { situacaoNaViagem } from '../../data/loaders';
import {
  dataBR, dataCurta, dataPorExtenso, hora, horaDe, iniciais, saudacao,
} from '../../utils/format';

const pad2 = (n) => String(n).padStart(2, '0');

function Solicitacoes({ lista }) {
  const toast = useToast();
  const pendentes = lista.filter((s) => s.status === 'PENDENTE');
  if (!pendentes.length) return null;
  const decidir = async (s, acao) => {
    try { await patch(`/api/solicitacoes-horario/${s.idSolicitacao}/${acao}`); toast(acao === 'aprovar' ? 'Solicitação aprovada.' : 'Solicitação recusada.'); } catch (e) { toast(e.message, { error: true }); }
  };
  return (
    <Section title="Solicitações de alteração de horário" style={{ marginTop: 20 }} aside={<Badge value={`${pendentes.length} Pendente${pendentes.length > 1 ? 's' : ''}`} />}>
      <Divide>
        {pendentes.map((s) => (
          <View key={s.idSolicitacao} style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 12 }}>
            <Avatar initials={iniciais(s.nomeAluno)} />
            <View style={{ flex: 1, minWidth: 180 }}>
              <T style={{ fontSize: 14, fontWeight: 600 }}>{s.nomeAluno}{s.nomeRota ? ` · ${s.nomeRota}` : ''}</T>
              <Muted style={{ fontSize: 12 }}>{hora(s.horarioAtual)} → {hora(s.horarioDesejado)} · {s.motivo}</Muted>
            </View>
            <Row gap={8}>
              <Button size="sm" variant="outline" title="Recusar" onPress={() => decidir(s, 'recusar')} />
              <Button size="sm" title="Aprovar" onPress={() => decidir(s, 'aprovar')} />
            </Row>
          </View>
        ))}
      </Divide>
    </Section>
  );
}

export function AdminDashboard({ data, solicitacoes, usuario }) {
  const { navigate } = useRouter();
  const { sm, xl } = useBreakpoint();
  const agora = new Date();
  const hojeV = data.viagens.filter((v) => v.dateIso === data.hoje);
  const conta = (s) => hojeV.filter((v) => v.statusRaw === s).length;
  const emAndamento = data.viagens.filter((v) => v.statusRaw === 'EM_ANDAMENTO');
  const inativosOnibus = data.onibus.filter((o) => !o.active).length;
  const novosMes = data.matriculas.filter((m) => m.dataMatricula.slice(0, 7) === data.hoje.slice(0, 7)).length;
  const stats = [
    ['Alunos ativos', data.alunos.filter((a) => a.active).length, 'graduation-cap', novosMes ? `+${novosMes} este mês` : 'Sem novas matrículas'],
    ['Motoristas ativos', data.motoristas.filter((m) => m.active).length, 'users', 'Equipe cadastrada'],
    ['Ônibus ativos', data.onibus.filter((o) => o.active).length, 'bus-front', inativosOnibus ? `${inativosOnibus} inativo${inativosOnibus > 1 ? 's' : ''}` : 'Frota completa'],
    ['Rotas ativas', data.rotas.filter((r) => r.active).length, 'route', 'Em operação'],
    ['Viagens em andamento', emAndamento.length, 'activity', 'Agora mesmo'],
  ];
  const eventos = [...data.registros].filter((r) => r.status).sort((a, b) => b.dataHora.localeCompare(a.dataHora)).slice(0, 5);
  const pontoDo = (r) => {
    const m = data.matriculas.find((x) => x.idAluno === r.idAluno && x.idRota === r.idRota);
    return (m && m.nomePontoEmbarque) || 'Ponto não definido';
  };

  // Atividade recente: viagens iniciadas/finalizadas e novas matrículas
  const atividade = [
    ...data.viagens.filter((v) => v.statusRaw !== 'PENDENTE').map((v) => ({
      quando: `${v.dateIso}T${v.statusRaw === 'FINALIZADA' && v.raw.horaFim ? v.raw.horaFim : v.raw.horaInicio}`,
      titulo: v.statusRaw === 'FINALIZADA' ? 'Viagem finalizada' : 'Viagem iniciada',
      texto: `${v.driver} ${v.statusRaw === 'FINALIZADA' ? 'finalizou' : 'iniciou'} a ${v.route}.`,
      rotulo: v.dateIso === data.hoje ? (v.statusRaw === 'FINALIZADA' ? v.end : v.start) : v.date,
    })),
    ...data.matriculas.map((m) => ({ quando: `${m.dataMatricula}T00:00`, titulo: 'Aluno vinculado', texto: `${m.nomeAluno} adicionado(a) à ${m.nomeRota}.`, rotulo: m.dataMatricula === data.hoje ? 'Hoje' : dataBR(m.dataMatricula) })),
  ].sort((a, b) => b.quando.localeCompare(a.quando)).slice(0, 4);

  const viagensCols = [
    { label: 'Rota / viagem', width: 170, grow: true, render: (t) => <View><T style={{ fontSize: 13, fontWeight: 700 }}>{t.route}</T><Muted style={{ fontSize: 11 }}>{t.code}</Muted></View> },
    { label: 'Motorista', width: 160, render: (t) => <T style={{ fontSize: 13 }}>{t.driver}</T> },
    { label: 'Horário', width: 90, render: (t) => <T style={{ fontSize: 13 }}>{t.start}</T> },
    { label: 'Status', width: 140, render: (t) => <Badge value={t.status} /> },
  ];

  return (
    <View>
      <Headline
        eyebrow={dataPorExtenso(agora).toUpperCase()}
        title={`${saudacao(agora)}, ${String((usuario && usuario.nomeUsuario) || 'Administrador').split(' ')[0]}`}
        description="Acompanhe a operação do transporte escolar em tempo real."
        action={<View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.card }}><Icon name="calendar-days" size={16} color={colors.primary} /><T style={{ fontSize: 12, fontWeight: 600 }}>{dataCurta(agora)}</T></View>}
      />
      <Grid cols={xl ? 5 : sm ? 2 : 1} gap={16}>
        {stats.map(([l, n, ic, sub]) => (
          <Card key={l} pad>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <T style={{ fontSize: 12, fontWeight: 600, color: colors.mutedForeground, flexShrink: 1 }}>{l}</T>
              <IconTile name={ic} size="sm" />
            </View>
            <T display style={{ fontSize: 29, lineHeight: 35, fontWeight: 700, marginTop: 12 }}>{pad2(n)}</T>
            <T style={{ marginTop: 8, fontSize: 11, fontWeight: 600, color: colors.success }}>{sub}</T>
          </Card>
        ))}
      </Grid>

      <View style={{ marginTop: 24 }}>
        <Split wide={xl} ratio={[1.7, 1]}>
          <Section title="Viagens de hoje" aside={<LinkText title="Ver todas" iconRight="arrow-right" onPress={() => navigate(h('admin', 'viagens'))} />}>
            {hojeV.length ? <Table columns={viagensCols} rows={hojeV} keyOf={(t) => String(t.id)} onRowPress={(t) => navigate(h('admin', 'viagens', 'detalhes', t.id))} /> : <Empty text="Nenhuma viagem programada para hoje." icon="calendar-days" />}
          </Section>
          <Section title="Status da operação" aside={<Icon name="activity" size={16} color={colors.primary} />}>
            <View style={{ padding: 20, gap: 16 }}>
              <View style={{ borderRadius: radius.md, backgroundColor: colors.surfaceBlue, padding: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}><Dot /><T style={{ fontSize: 12, fontWeight: 700, color: colors.primary }}>{emAndamento.length ? 'OPERAÇÃO EM ANDAMENTO' : 'NENHUMA VIAGEM EM CURSO'}</T></View>
                <T style={{ fontSize: 14, fontWeight: 700 }}>{emAndamento.length} viage{emAndamento.length === 1 ? 'm' : 'ns'} em circulação</T>
                <Muted style={{ fontSize: 12, marginTop: 4 }}>{emAndamento.length ? emAndamento.map((v) => v.route).join(', ') : 'Inicie uma viagem pela área do motorista.'}</Muted>
              </View>
              {[['Em andamento', conta('EM_ANDAMENTO'), 'primary'], ['Finalizadas', conta('FINALIZADA'), 'success'], ['Pendentes', conta('PENDENTE'), 'warning']].map(([n, v, tone]) => (
                <KvRow key={n} k={<View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Dot tone={tone} /><T style={{ fontSize: 14 }}>{n}</T></View>} v={String(v)} />
              ))}
            </View>
          </Section>
        </Split>
      </View>

      <View style={{ marginTop: 20 }}>
        <Split wide={xl} ratio={[1.2, 1]}>
          <Section title="Últimos embarques e desembarques" aside={<LinkText title="Ver registros →" onPress={() => navigate(h('admin', 'embarques'))} />}>
            {eventos.length ? (
              <Divide>
                {eventos.map((e) => (
                  <View key={`${e.idAluno}-${e.idViagem}-${e.tipoRegistro}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 12 }}>
                    <Avatar initials={iniciais(e.nomeAluno)} />
                    <View style={{ flex: 1, minWidth: 0 }}><T style={{ fontSize: 14, fontWeight: 600 }} numberOfLines={1}>{e.nomeAluno}</T><Muted style={{ fontSize: 12 }} numberOfLines={1}>{pontoDo(e)} · {e.nomeRota}</Muted></View>
                    <Badge value={e.tipoRegistro === 'EMBARQUE' ? 'Embarque' : 'Desembarque'} />
                    <Muted style={{ fontSize: 12 }}>{e.dataHora.slice(0, 10) === data.hoje ? horaDe(e.dataHora) : dataBR(e.dataHora).slice(0, 5)}</Muted>
                  </View>
                ))}
              </Divide>
            ) : <Empty text="Nenhum registro ainda." />}
          </Section>
          <Section title="Atividade recente" aside={<Icon name="clock-3" size={16} color={colors.mutedForeground} />}>
            <View style={{ padding: 20, gap: 16 }}>
              {atividade.length ? atividade.map((a, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: 12 }}>
                  <Dot style={{ marginTop: 6 }} />
                  <View style={{ flex: 1 }}><T style={{ fontSize: 14, fontWeight: 600 }}>{a.titulo}</T><Muted style={{ fontSize: 12 }}>{a.texto}</Muted></View>
                  <Muted style={{ fontSize: 11 }}>{a.rotulo}</Muted>
                </View>
              )) : <Muted>Nenhuma atividade.</Muted>}
            </View>
          </Section>
        </Split>
      </View>
      <Solicitacoes lista={solicitacoes || []} />
    </View>
  );
}

export function AdminMonitoring({ sec, data }) {
  const emb = sec === 'embarques';
  const { sm } = useBreakpoint();
  const candidatas = data.viagens.filter((v) => v.statusRaw === 'EM_ANDAMENTO' || v.dateIso === data.hoje);
  const padrao = candidatas.find((v) => v.statusRaw === 'EM_ANDAMENTO') || candidatas[0] || data.viagens.find((v) => v.statusRaw === 'FINALIZADA') || null;
  const [sel, setSel] = useState(padrao ? padrao.id : null);
  const viagem = data.viagens.find((v) => v.id === sel) || padrao;

  const linhas = viagem ? data.matriculas
    .filter((m) => m.idRota === viagem.raw.idRota && (m.statusMatricula || data.registros.some((r) => r.idAluno === m.idAluno && r.idViagem === viagem.id)))
    .map((m) => {
      const s = situacaoNaViagem(data.registros, viagem.id, m.idAluno);
      const reg = emb ? s.embarque : s.desembarque;
      const situacao = emb ? (s.embarque ? 'Embarcado' : 'Aguardando') : (s.desembarque ? 'Desembarcado' : s.embarque ? 'A bordo' : 'Aguardando');
      return { id: m.idAluno, name: m.nomeAluno, stop: m.nomePontoEmbarque || '—', time: reg ? horaDe(reg.dataHora) : '—', situacao };
    }) : [];

  return (
    <View>
      <Headline eyebrow="OPERAÇÃO / TEMPO REAL" title={emb ? 'Monitoramento de embarques' : 'Monitoramento de desembarques'} description="Acompanhe os registros da viagem atual." />
      {candidatas.length > 1 ? (
        <Row gap={8} style={{ marginBottom: 20 }}>
          {candidatas.map((v) => (
            <Pressable key={v.id} onPress={() => setSel(v.id)} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: v.id === (viagem && viagem.id) ? colors.primary : colors.border, backgroundColor: v.id === (viagem && viagem.id) ? colors.surfaceBlue : colors.card }}>
              <T style={{ fontSize: 12, fontWeight: 600, color: v.id === (viagem && viagem.id) ? colors.primary : colors.foreground }}>{v.route} · {v.start} · {v.status}</T>
            </Pressable>
          ))}
        </Row>
      ) : null}
      {viagem ? (
        <>
          <Grid cols={sm ? 3 : 1} gap={16} style={{ marginBottom: 20 }}>
            {[['Viagem atual', `${viagem.route}`], ['Motorista', viagem.driver], ['Ônibus', viagem.bus]].map(([a, b]) => (
              <Card key={a} pad><Kicker>{a}</Kicker><Display size={16} style={{ marginTop: 8 }}>{b}</Display></Card>
            ))}
          </Grid>
          <Section title={emb ? 'Passageiros da viagem' : 'Registros de desembarque'} aside={<Badge value={viagem.status} />}>
            {linhas.length ? (
              <Table
                keyOf={(r) => String(r.id)}
                rows={linhas}
                columns={[
                  { label: 'Aluno', width: 200, grow: true, render: (r) => <T style={{ fontSize: 13, fontWeight: 600 }}>{r.name}</T> },
                  { label: 'Ponto de parada', width: 170, render: (r) => r.stop },
                  { label: 'Horário', width: 100, render: (r) => r.time },
                  { label: 'Situação', width: 150, render: (r) => <Badge value={r.situacao} /> },
                ]}
              />
            ) : <Empty text="Nenhum aluno matriculado nesta rota." />}
          </Section>
        </>
      ) : <Card><Empty text="Nenhuma viagem em andamento no momento." icon="bus-front" /></Card>}
    </View>
  );
}
