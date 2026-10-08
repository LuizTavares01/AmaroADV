/* MOTORISTA E ALUNO — layout mobile-first com barra de navegação inferior
   (no tablet/web aparece o menu lateral, como no protótipo). */
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '../../ui/Icon';
import {
  AppModal, Avatar, Badge, Brand, Button, Card, Display, Divide, Empty, ErrorBox, Field, IconTile, Input, Kicker,
  KvRow, Loading, ModalActions, Muted, Row, SectionTitle, Select, StopList, T, useBreakpoint,
} from '../../ui/components';
import { colors, radius } from '../../theme';
import { h, useRouter } from '../../navigation/router';
import { useSession } from '../../state/session';
import { useToast } from '../../ui/Toast';
import { useQuery } from '../../data/useQuery';
import { carregarAluno, carregarMotorista } from '../../data/loaders';
import { patch, post } from '../../api/client';
import {
  STATUS_VIAGEM, codigoViagem, dataBR, dataPorExtenso, hora, horaDe, iniciais, isoParaData, mascaraHora, periodoDoHorario, saudacao,
} from '../../utils/format';

const DRIVER_NAV = [['Início', 'inicio', 'layout-dashboard'], ['Minha rota', 'minha-rota', 'route'], ['Meus horários', 'horarios', 'clock-3'], ['Meus alunos', 'alunos', 'graduation-cap'], ['Meu ônibus', 'onibus', 'bus-front'], ['Viagem atual', 'viagem', 'map-pin']];
const STUDENT_NAV = [['Início', 'inicio', 'layout-dashboard'], ['Minha matrícula', 'matricula', 'book-open'], ['Minha rota', 'minha-rota', 'route'], ['Meus horários', 'horarios', 'clock-3'], ['Meu ônibus', 'onibus', 'bus-front'], ['Histórico', 'historico', 'file-clock'], ['Alterar horário', 'solicitacao', 'calendar-days']];
const TITLES = { inicio: 'Início', 'minha-rota': 'Minha rota', horarios: 'Meus horários', alunos: 'Meus alunos', onibus: 'Meu ônibus', viagem: 'Viagem atual', matricula: 'Minha matrícula', historico: 'Histórico de transporte', solicitacao: 'Alterar horário' };

const Mini = ({ label, value, icon }) => (
  <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, flex: 1 }}>
    <IconTile name={icon} />
    <View style={{ flexShrink: 1 }}><Muted style={{ fontSize: 11 }}>{label}</Muted><T style={{ fontSize: 14, fontWeight: 700 }} numberOfLines={1}>{value}</T></View>
  </Card>
);

const Facts = ({ items }) => (
  <View style={styles.facts}>
    {items.map(([a, b]) => (
      <View key={a} style={{ width: '50%', paddingRight: 8, marginBottom: 12 }}>
        <Muted style={{ fontSize: 11 }}>{a}</Muted>
        <T style={{ marginTop: 4, fontSize: 14, fontWeight: 700 }} numberOfLines={2}>{b || '—'}</T>
      </View>
    ))}
  </View>
);

function Hero({ dateLabel, title, sub, routeLabel, routeName, meta }) {
  return (
    <View style={styles.hero}>
      <T style={{ fontSize: 12, fontWeight: 600, color: colors.white65 }}>{dateLabel}</T>
      <T display style={{ marginTop: 12, fontSize: 24, fontWeight: 700, color: colors.primaryForeground }}>{title}</T>
      <T style={{ marginTop: 8, fontSize: 14, color: colors.white70 }}>{sub}</T>
      <View style={styles.heroRoute}>
        <T style={{ fontSize: 12, color: colors.white60 }}>{routeLabel}</T>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
          <View style={{ flexShrink: 1 }}>
            <T display style={{ fontSize: 20, fontWeight: 700, color: colors.primaryForeground }}>{routeName}</T>
            <T style={{ marginTop: 4, fontSize: 12, color: colors.white70 }}>{meta}</T>
          </View>
          <View style={{ padding: 12, borderRadius: radius.md, backgroundColor: colors.white10 }}><Icon name="route" size={24} color={colors.primaryForeground} /></View>
        </View>
      </View>
    </View>
  );
}

function Schedule({ rota, pontos }) {
  if (!rota) return <Card pad><Empty text="Nenhuma rota vinculada." icon="route" /></Card>;
  const primeiro = pontos[0] ? pontos[0].nomePonto : 'Origem';
  const ultimo = pontos[pontos.length - 1] ? pontos[pontos.length - 1].nomePonto : 'Destino';
  const ida = /volta/i.test(rota.tipo) && !/ida/i.test(rota.tipo) ? null : ['Saída', rota.horarioInicio, `Ida · ${primeiro} → ${ultimo}`];
  const volta = /volta/i.test(rota.tipo) ? ['Retorno', rota.horarioFim, `Volta · ${ultimo} → ${primeiro}`] : ['Chegada prevista', rota.horarioFim, `Encerramento em ${ultimo}`];
  return (
    <Card pad>
      <SectionTitle style={{ marginBottom: 4 }}>Programação semanal</SectionTitle>
      <Muted style={{ fontSize: 12 }}>Segunda a sexta-feira · {rota.nomeRota}</Muted>
      <View style={{ marginTop: 20, gap: 12 }}>
        {[ida, volta].filter(Boolean).map(([a, b, c]) => (
          <View key={a} style={styles.schedule}>
            <T display style={{ fontSize: 18, fontWeight: 700, color: colors.primary }}>{hora(b)}</T>
            <View style={{ flexShrink: 1 }}><T style={{ fontSize: 14, fontWeight: 700 }}>{a}</T><Muted style={{ fontSize: 12 }}>{c}</Muted></View>
          </View>
        ))}
      </View>
    </Card>
  );
}

function BusCard({ bus, motorista, rota }) {
  if (!bus) return <Card pad><Empty text="Nenhum ônibus vinculado." icon="bus-front" /></Card>;
  return (
    <Card pad="lg">
      <View style={{ marginBottom: 20 }}><IconTile name="bus-front" size="xl" /></View>
      <Kicker>VEÍCULO VINCULADO</Kicker>
      <Display size={24} style={{ marginTop: 8 }}>{bus.placaOnibus}</Display>
      <View style={{ marginTop: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
        {[['Capacidade', `${bus.capacidadeOnibus} passageiros`], ['Status', bus.statusOnibus ? 'Ativo' : 'Inativo'], ['Motorista', motorista || '—'], ['Rota', rota ? rota.nomeRota : '—']].map(([a, b]) => (
          <KvRow key={a} k={a} v={b} style={{ paddingVertical: 8 }} />
        ))}
      </View>
    </Card>
  );
}

/* ================= MOTORISTA ================= */
function DriverContent({ slug, usuario, d, abrirConfirmacao, setPassageiro }) {
  const { navigate } = useRouter();
  const { atual, rota, bus, pontos, passageiros, proximo } = d;
  const tripState = atual ? STATUS_VIAGEM[atual.status] : null;
  const nome = String(usuario.nomeUsuario).split(' ')[0];
  const agora = new Date();

  switch (slug) {
    case 'inicio': {
      const label = !atual ? 'Nenhuma viagem programada' : atual.status === 'PENDENTE' ? 'Iniciar viagem' : atual.status === 'EM_ANDAMENTO' ? 'Viagem em andamento' : 'Viagem finalizada';
      return (
        <>
          <Hero
            dateLabel={dataPorExtenso(agora, false).toUpperCase()} title={`${saudacao(agora)}, ${nome}!`}
            sub={atual && atual.status === 'PENDENTE' ? 'Sua próxima viagem está programada.' : atual && atual.status === 'EM_ANDAMENTO' ? 'Você está em viagem agora.' : 'Bom trabalho hoje.'}
            routeLabel="SUA ROTA DE HOJE" routeName={rota ? rota.nomeRota : 'Sem rota vinculada'}
            meta={atual ? `${hora(atual.horaInicio)} · ${atual.placaOnibus}${atual.dataViagem !== d.hoje ? ` · ${dataBR(atual.dataViagem)}` : ''}` : bus ? bus.placaOnibus : '—'}
          />
          <Button size="xl" block title={label} iconRight="arrow-right" disabled={!atual || atual.status !== 'PENDENTE'} onPress={() => abrirConfirmacao('start')} />
          {atual && atual.status === 'EM_ANDAMENTO' ? <Button variant="outline" block title="Abrir controle de passageiros" onPress={() => navigate(h('motorista', 'viagem'))} /> : null}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Mini label="Próximo horário" value={d.proximas[0] ? hora(d.proximas[0].horaInicio) : '—'} icon="clock-3" />
            <Mini label="Meu ônibus" value={bus ? bus.placaOnibus : '—'} icon="bus-front" />
          </View>
          <Card pad>
            <SectionTitle style={{ marginBottom: 12 }}>Visão rápida</SectionTitle>
            <KvRow k="Alunos na rota" v={`${passageiros.length} aluno${passageiros.length === 1 ? '' : 's'}`} />
            <KvRow k="Pontos de parada" v={`${pontos.length} ponto${pontos.length === 1 ? '' : 's'}`} style={{ marginTop: 12 }} />
            {atual && atual.status !== 'PENDENTE' ? <KvRow k="Embarcados agora" v={String(passageiros.filter((p) => p.status === 'Embarcado').length)} style={{ marginTop: 12 }} /> : null}
          </Card>
        </>
      );
    }
    case 'minha-rota':
      if (!rota) return <Card pad><Empty text="Nenhuma rota vinculada." icon="route" /></Card>;
      return (
        <>
          <Card pad>
            <View style={styles.splitTop}>
              <View style={{ flexShrink: 1 }}><Kicker style={{ marginBottom: 8 }}>ROTA VINCULADA</Kicker><Display size={20}>{rota.nomeRota}</Display><Muted style={{ marginTop: 4 }}>{rota.tipo} · Período da {periodoDoHorario(rota.horarioInicio)}</Muted></View>
              <Badge value={rota.statusRota ? 'Ativa' : 'Inativa'} />
            </View>
            <Facts items={[['Saída', hora(rota.horarioInicio)], ['Retorno', hora(rota.horarioFim)], ['Motorista', usuario.nomeUsuario], ['Ônibus', bus ? bus.placaOnibus : '—']]} />
          </Card>
          <Card pad><SectionTitle style={{ marginBottom: 20 }}>Pontos de parada</SectionTitle><StopList stops={pontos.map((p) => p.nomePonto)} active={atual && atual.status === 'EM_ANDAMENTO' ? proximo : -1} /></Card>
        </>
      );
    case 'horarios':
      return (
        <>
          <Schedule rota={rota} pontos={pontos} />
          <Card pad>
            <Row gap={8}><Icon name="calendar-days" size={16} color={colors.primary} /><T style={{ fontSize: 14, fontWeight: 600 }}>Próximas viagens</T></Row>
            {d.proximas.length ? d.proximas.slice(0, 5).map((v) => (
              <KvRow key={v.idViagem} style={{ marginTop: 12 }} k={<Muted>{dataPorExtenso(isoParaData(v.dataViagem), false)}</Muted>} v={`${hora(v.horaInicio)} · ${v.nomeRota}`} />
            )) : <Muted style={{ fontSize: 12, marginTop: 8 }}>Nenhuma viagem pendente.</Muted>}
          </Card>
        </>
      );
    case 'alunos':
      return (
        <Card>
          {passageiros.length ? (
            <Divide>
              {passageiros.map((s) => (
                <View key={s.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 }}>
                  <Avatar initials={s.initials} uri={s.foto} />
                  <View style={{ flex: 1 }}><T style={{ fontSize: 14, fontWeight: 700 }}>{s.name}</T><Muted style={{ fontSize: 12 }}>{s.enrollment} · {s.stop}</Muted></View>
                  <Badge value={s.status} />
                </View>
              ))}
            </Divide>
          ) : <Empty text="Nenhum aluno matriculado na rota." />}
        </Card>
      );
    case 'onibus':
      return <BusCard bus={bus} motorista={usuario.nomeUsuario} rota={rota} />;
    case 'viagem': {
      if (!atual) return <Card pad><Empty text="Nenhuma viagem programada para você." icon="calendar-days" /></Card>;
      const head = (
        <Card pad>
          <View style={styles.splitTop}>
            <View><Kicker style={{ marginBottom: 8 }}>VIAGEM {codigoViagem(atual.idViagem)}</Kicker><Display size={20}>{atual.nomeRota}</Display></View>
            <Badge value={tripState} />
          </View>
          <Facts items={[['Próximo ponto', pontos[proximo] ? pontos[proximo].nomePonto : '—'], ['Ônibus', atual.placaOnibus], ['Horário', `${hora(atual.horaInicio)}${atual.dataViagem !== d.hoje ? ` · ${dataBR(atual.dataViagem)}` : ''}`], ['Motorista', atual.nomeMotorista]]} />
        </Card>
      );
      if (atual.status === 'PENDENTE') return <>{head}<Button size="xl" block title="Iniciar viagem" iconRight="arrow-right" onPress={() => abrirConfirmacao('start')} /></>;
      const running = atual.status === 'EM_ANDAMENTO';
      const transportados = passageiros.filter((p) => p.status !== 'Aguardando').length;
      return (
        <>
          {head}
          <Card>
            <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <SectionTitle>Controle de passageiros</SectionTitle>
              <Muted style={{ fontSize: 12, marginTop: 4 }}>Registre embarques e desembarques durante o percurso.</Muted>
            </View>
            {passageiros.length ? (
              <Divide>
                {passageiros.map((s) => (
                  <View key={s.id} style={{ padding: 16 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <Avatar initials={s.initials} uri={s.foto} />
                      <View style={{ flex: 1 }}>
                        <T style={{ fontSize: 14, fontWeight: 700 }}>{s.name}</T>
                        <Muted style={{ fontSize: 12 }}>{s.stop}{s.embarque ? ` · ↑ ${horaDe(s.embarque.dataHora)}` : ''}{s.desembarque ? ` · ↓ ${horaDe(s.desembarque.dataHora)}` : ''}</Muted>
                      </View>
                      <Badge value={s.status} />
                    </View>
                    {running ? (
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12, paddingLeft: 48 }}>
                        <Button size="sm" variant={s.status === 'Embarcado' ? 'secondary' : 'outline'} title="Embarcou" disabled={s.status !== 'Aguardando'} onPress={() => setPassageiro(s, 'EMBARQUE')} />
                        <Button size="sm" variant={s.status === 'Desembarcado' ? 'secondary' : 'outline'} title="Desembarcou" disabled={s.status !== 'Embarcado'} onPress={() => setPassageiro(s, 'DESEMBARQUE')} />
                        {s.status !== 'Aguardando' ? <Button size="sm" variant="ghost" icon="rotate-ccw" title="Desfazer" onPress={() => setPassageiro(s, 'INVALIDAR')} /> : null}
                      </View>
                    ) : null}
                  </View>
                ))}
              </Divide>
            ) : <Empty text="Nenhum aluno matriculado nesta rota." />}
          </Card>
          {running ? (
            <Button variant="outline" block size="field" title="Encerrar viagem" onPress={() => abrirConfirmacao('end')} />
          ) : (
            <Card pad>
              <Row gap={8}><Icon name="circle-check" size={16} color={colors.success} /><T style={{ fontWeight: 700, color: colors.success }}>Viagem finalizada</T></Row>
              <Muted style={{ marginTop: 8 }}>{atual.nomeRota} · {dataBR(atual.dataViagem)} · {hora(atual.horaInicio)}–{hora(atual.horaFim)}</Muted>
              <T style={{ marginTop: 8, fontSize: 14 }}>{transportados} aluno{transportados === 1 ? '' : 's'} transportado{transportados === 1 ? '' : 's'}</T>
              {atual.observacaoFinalizacao ? <Muted style={{ marginTop: 8, fontSize: 12 }}>Observação: {atual.observacaoFinalizacao}</Muted> : null}
            </Card>
          )}
        </>
      );
    }
    default:
      return <Empty />;
  }
}

/* ================= ALUNO ================= */
function StudentRequest({ d }) {
  const toast = useToast();
  const [form, setForm] = useState({ atual: d.rota ? hora(d.rota.horarioInicio) : '', novo: '', motivo: '' });
  const [enviada, setEnviada] = useState(null);
  const [erro, setErro] = useState('');
  const [busy, setBusy] = useState(false);
  const enviar = async () => {
    setBusy(true); setErro('');
    try {
      const r = await post('/api/solicitacoes-horario', { horarioAtual: form.atual, horarioDesejado: form.novo, motivo: form.motivo, idRota: d.rota ? d.rota.idRota : null });
      setEnviada(r);
      toast('Solicitação enviada.', { mobile: true });
    } catch (e) { setErro(e.campos ? Object.values(e.campos).join(' · ') : e.message); } finally { setBusy(false); }
  };
  if (enviada) {
    return (
      <Card pad="lg" style={{ alignItems: 'center' }}>
        <View style={styles.successCircle}><Icon name="check" size={28} color={colors.success} /></View>
        <Display style={{ marginTop: 16 }}>Solicitação enviada!</Display>
        <Muted style={{ marginTop: 8, textAlign: 'center' }}>Sua solicitação de alteração de horário foi registrada.</Muted>
        <View style={styles.note}>
          <T style={{ fontSize: 14 }}>Data: {dataBR(enviada.dataHora)}</T>
          <Row gap={8} style={{ marginTop: 8 }}><T style={{ fontSize: 14 }}>Status:</T><Badge value="Pendente" /></Row>
        </View>
        <Button variant="outline" title="Nova solicitação" style={{ marginTop: 24 }} onPress={() => { setEnviada(null); setForm((f) => ({ ...f, novo: '', motivo: '' })); }} />
      </Card>
    );
  }
  return (
    <>
      <Card pad style={{ gap: 16 }}>
        <Muted>Solicite uma mudança na programação da sua rota.</Muted>
        <Field label="Horário atual"><Input type="time" value={form.atual} onChangeText={(v) => setForm({ ...form, atual: mascaraHora(v) })} placeholder="HH:MM" /></Field>
        <Field label="Novo horário desejado"><Input type="time" value={form.novo} onChangeText={(v) => setForm({ ...form, novo: mascaraHora(v) })} placeholder="HH:MM" /></Field>
        <Field label="Motivo"><Input multiline value={form.motivo} onChangeText={(v) => setForm({ ...form, motivo: v })} placeholder="Conte por que precisa alterar o horário" maxLength={255} /></Field>
        {erro ? <T style={{ fontSize: 12, color: colors.destructive }}>{erro}</T> : null}
        <Button block title="Enviar solicitação" iconRight="arrow-right" loading={busy} onPress={enviar} />
      </Card>
      {d.solicitacoes.length ? (
        <Card>
          <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}><SectionTitle>Minhas solicitações</SectionTitle></View>
          <Divide>
            {[...d.solicitacoes].reverse().map((s) => (
              <View key={s.idSolicitacao} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 }}>
                <View style={{ flex: 1 }}><T style={{ fontSize: 14, fontWeight: 700 }}>{hora(s.horarioAtual)} → {hora(s.horarioDesejado)}</T><Muted style={{ fontSize: 12 }} numberOfLines={1}>{dataBR(s.dataHora)} · {s.motivo}</Muted></View>
                <Badge value={{ PENDENTE: 'Pendente', APROVADA: 'Aprovada', RECUSADA: 'Recusada' }[s.status]} />
              </View>
            ))}
          </Divide>
        </Card>
      ) : null}
    </>
  );
}

function TripItem({ t, i }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ padding: 16 }}>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen(!open)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <IconTile name="bus-front" />
        <View style={{ flex: 1 }}><T style={{ fontSize: 14, fontWeight: 700 }}>{t.route}</T><Muted style={{ fontSize: 12 }}>{t.date} · Viagem {String(i + 1).padStart(2, '0')}</Muted></View>
        <Icon name="chevron-down" size={16} color={colors.mutedForeground} style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }} />
      </Pressable>
      {open ? (
        <View style={styles.tripBody}>
          {[['Horário', `${t.start} – ${t.end}`], ['Motorista', t.driver], ['Ônibus', t.bus], ['Status', t.status], ['Embarque', t.situacao.embarque ? horaDe(t.situacao.embarque.dataHora) : '—'], ['Desembarque', t.situacao.desembarque ? horaDe(t.situacao.desembarque.dataHora) : '—']].map(([a, b]) => (
            <View key={a} style={{ width: '50%', marginBottom: 12, paddingRight: 8 }}><Muted style={{ fontSize: 12 }}>{a}</Muted><T style={{ fontSize: 12, fontWeight: 700, marginTop: 4 }}>{b}</T></View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function StudentContent({ slug, usuario, d }) {
  const { navigate } = useRouter();
  const { rota, ativa, pontos, atual, bus, motorista } = d;
  const agora = new Date();
  const nome = String(usuario.nomeUsuario).split(' ')[0];
  switch (slug) {
    case 'inicio': {
      const prox = atual ? (atual.status === 'EM_ANDAMENTO' ? 'Viagem em andamento agora' : atual.status === 'PENDENTE' ? `Próxima viagem às ${hora(atual.horaInicio)}${atual.dataViagem !== d.hoje ? ` (${dataBR(atual.dataViagem).slice(0, 5)})` : ''}` : 'Viagem de hoje finalizada') : rota ? `Saída às ${hora(rota.horarioInicio)}` : 'Sem viagens programadas';
      return (
        <>
          <Hero dateLabel={dataPorExtenso(agora, false).toUpperCase()} title={`Olá, ${nome}!`} sub="Sua jornada começa aqui." routeLabel="MINHA ROTA" routeName={rota ? rota.nomeRota : 'Sem rota vinculada'} meta={prox} />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Mini label="Meu ônibus" value={bus ? bus.placaOnibus : '—'} icon="bus-front" />
            <Mini label="Motorista" value={motorista || '—'} icon="user-round" />
          </View>
          <Card pad style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <IconTile name="map-pin" />
            <View><Muted style={{ fontSize: 11 }}>Ponto de embarque</Muted><T style={{ fontSize: 14, fontWeight: 700 }}>{(ativa && ativa.nomePontoEmbarque) || 'Não definido'}</T></View>
          </Card>
          <Pressable onPress={() => navigate(h('aluno', 'minha-rota'))} style={({ pressed }) => [styles.linkCard, pressed && { backgroundColor: colors.muted }]}>
            <T style={{ fontSize: 14, fontWeight: 700 }}>Ver detalhes da minha rota</T>
            <Icon name="chevron-right" size={16} color={colors.primary} />
          </Pressable>
        </>
      );
    }
    case 'matricula':
      return (
        <Card pad>
          <View style={styles.profileHead}>
            <Avatar initials={iniciais(usuario.nomeUsuario)} uri={usuario.fotoUsuario} lg />
            <View><Display>{usuario.nomeUsuario}</Display><Muted style={{ fontSize: 12 }}>Aluno · {usuario.periodo}</Muted></View>
          </View>
          <View style={{ marginTop: 16, gap: 16 }}>
            <KvRow k="Número da matrícula" v={String(usuario.numeroMatricula)} />
            <KvRow k="Período" v={usuario.periodo} />
            <KvRow k="Rota vinculada" v={rota ? rota.nomeRota : '—'} />
            <KvRow k="Situação" v={ativa ? 'Ativa' : 'Sem matrícula ativa'} />
            {ativa ? <KvRow k="Matriculado em" v={dataBR(ativa.dataMatricula)} /> : null}
          </View>
          {d.matriculas.length > 1 ? (
            <View style={{ marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border, gap: 10 }}>
              <Kicker>TODAS AS MATRÍCULAS</Kicker>
              {d.matriculas.map((m) => <KvRow key={m.idMatricula} k={m.nomeRota}><Badge value={m.statusMatricula ? 'Ativa' : 'Inativa'} /></KvRow>)}
            </View>
          ) : null}
        </Card>
      );
    case 'minha-rota':
      if (!rota) return <Card pad><Empty text="Você ainda não está matriculado em uma rota." icon="route" /></Card>;
      return (
        <>
          <Card pad>
            <View style={styles.splitTop}>
              <View style={{ flexShrink: 1 }}><Kicker style={{ marginBottom: 8 }}>ROTA VINCULADA</Kicker><Display size={20}>{rota.nomeRota}</Display><Muted style={{ marginTop: 4 }}>{rota.tipo} · Período da {periodoDoHorario(rota.horarioInicio)}</Muted></View>
              <Badge value={rota.statusRota ? 'Ativa' : 'Inativa'} />
            </View>
            <Facts items={[['Saída', hora(rota.horarioInicio)], ['Retorno', hora(rota.horarioFim)], ['Motorista', motorista], ['Ônibus', bus ? bus.placaOnibus : '—']]} />
          </Card>
          <Card pad>
            <SectionTitle style={{ marginBottom: 20 }}>Pontos de parada</SectionTitle>
            <StopList stops={pontos.map((p) => p.nomePonto)} active={ativa ? pontos.findIndex((p) => p.idPonto === ativa.idPontoEmbarque) : -1} activeLabel="Seu ponto de embarque" />
          </Card>
        </>
      );
    case 'horarios':
      return (
        <>
          <Schedule rota={rota} pontos={pontos} />
          <Card pad>
            <Row gap={8}><Icon name="calendar-days" size={16} color={colors.primary} /><T style={{ fontSize: 14, fontWeight: 600 }}>Próxima viagem</T></Row>
            <Muted style={{ fontSize: 12, marginTop: 8 }}>{atual ? `${dataPorExtenso(isoParaData(atual.dataViagem), false)} · ${hora(atual.horaInicio)} · ${STATUS_VIAGEM[atual.status]}` : 'Nenhuma viagem programada.'}</Muted>
          </Card>
        </>
      );
    case 'onibus':
      return <BusCard bus={bus} motorista={motorista} rota={rota} />;
    case 'historico':
      return (
        <Card>
          <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <SectionTitle>Viagens realizadas</SectionTitle>
            <Muted style={{ fontSize: 12, marginTop: 4 }}>Seu registro de transporte{rota ? ` na ${rota.nomeRota}` : ''}.</Muted>
          </View>
          {d.historico.length ? <Divide>{d.historico.map((t, i) => <TripItem key={t.id} t={t} i={d.historico.length - 1 - i} />)}</Divide> : <Empty text="Nenhuma viagem registrada ainda." icon="file-clock" />}
        </Card>
      );
    case 'solicitacao':
      return <StudentRequest d={d} />;
    default:
      return <Empty />;
  }
}

/* ================= Shell ================= */
export default function MobileScreen({ role, slug: slugIn }) {
  const isDriver = role === 'motorista';
  const items = isDriver ? DRIVER_NAV : STUDENT_NAV;
  const slug = items.some(([, p]) => p === slugIn) ? slugIn : 'inicio';
  const { navigate, reset } = useRouter();
  const { usuario, logout } = useSession();
  const toast = useToast();
  const { md } = useBreakpoint();
  const insets = useSafeAreaInsets();
  const [confirm, setConfirm] = useState('');
  const [obs, setObs] = useState('');
  const [desfazer, setDesfazer] = useState(null);
  const [motivo, setMotivo] = useState('');
  const [busy, setBusy] = useState(false);

  const q = useQuery(async () => {
    const r = isDriver ? await carregarMotorista(usuario.idUsuario) : await carregarAluno(usuario.idUsuario);
    const n = new Date();
    return { ...r, hoje: `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}` };
  }, [role, usuario.idUsuario]);

  const d = q.data;
  const exec = async (fn, ok) => {
    setBusy(true);
    try { await fn(); if (ok) toast(ok, { mobile: true }); return true; } catch (e) { toast(e.message, { mobile: true, error: true }); return false; } finally { setBusy(false); }
  };

  const setPassageiro = (s, tipo) => {
    if (tipo === 'INVALIDAR') { setMotivo(''); setDesfazer(s); return; }
    exec(() => post('/api/registros-transporte', { idAluno: s.id, idViagem: d.atual.idViagem, tipoRegistro: tipo }), `${tipo === 'EMBARQUE' ? 'Embarque' : 'Desembarque'} de ${s.name} registrado.`);
  };

  const aBordo = d && d.passageiros ? d.passageiros.filter((p) => p.status === 'Embarcado').length : 0;
  const bottom = [items[0], items[1], items[2], items[5]];

  let content;
  if (!d && q.loading) content = <Loading />;
  else if (!d) content = <ErrorBox error={q.error} onRetry={q.reload} />;
  else if (isDriver) content = <DriverContent slug={slug} usuario={usuario} d={d} abrirConfirmacao={(k) => { setObs(''); setConfirm(k); }} setPassageiro={setPassageiro} />;
  else content = <StudentContent slug={slug} usuario={usuario} d={d} />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.appbar, { paddingTop: insets.top }]}>
        <View style={[styles.appbarInner, { paddingHorizontal: md ? 32 : 16 }]}>
          <Brand light />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {md ? <T style={{ fontSize: 12, fontWeight: 600, color: colors.mutedForeground }}>{isDriver ? 'Motorista' : 'Aluno'}</T> : null}
            <Pressable onPress={() => navigate(h('perfil', role))} accessibilityLabel="Meu perfil"><Avatar initials={iniciais(usuario.nomeUsuario)} uri={usuario.fotoUsuario} /></Pressable>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: (md ? 32 : 96) + insets.bottom }} keyboardShouldPersistTaps="handled">
        <View style={[{ width: '100%', maxWidth: 1024, alignSelf: 'center' }, md && { flexDirection: 'row', gap: 32, paddingHorizontal: 32, paddingTop: 36 }]}>
          {md ? (
            <View style={{ width: 224 }}>
              <Kicker style={{ marginBottom: 16 }}>MENU PRINCIPAL</Kicker>
              <View style={{ gap: 4 }}>
                {items.map(([l, p, ic]) => (
                  <Pressable key={p} onPress={() => navigate(h(role, p))} style={({ pressed }) => [styles.sideLink, slug === p && { backgroundColor: colors.surfaceBlue }, pressed && slug !== p && { backgroundColor: colors.card }]}>
                    <Icon name={ic} size={16} color={slug === p ? colors.primary : colors.mutedForeground} />
                    <T style={{ fontSize: 14, fontWeight: 600, color: slug === p ? colors.primary : colors.mutedForeground }}>{l}</T>
                  </Pressable>
                ))}
                <Pressable onPress={() => navigate(h('perfil', role))} style={styles.sideLink}><Icon name="user-round" size={16} color={colors.mutedForeground} /><T style={{ fontSize: 14, color: colors.mutedForeground }}>Meu perfil</T></Pressable>
                <Pressable onPress={async () => { await logout(); reset(h('acesso', 'login')); }} style={styles.sideLink}><Icon name="log-out" size={16} color={colors.mutedForeground} /><T style={{ fontSize: 14, color: colors.mutedForeground }}>Sair</T></Pressable>
              </View>
            </View>
          ) : null}
          <View style={[{ flex: 1, minWidth: 0 }, !md && { paddingHorizontal: 16, paddingTop: 24 }]}>
            <View style={{ marginBottom: 24 }}>
              <Kicker style={{ marginBottom: 8 }}>{isDriver ? 'ÁREA DO MOTORISTA' : 'ÁREA DO ALUNO'}</Kicker>
              {slug !== 'inicio' ? <Display size={24}>{TITLES[slug]}</Display> : null}
            </View>
            <View style={{ gap: 16 }}>{content}</View>
          </View>
        </View>
      </ScrollView>

      {!md ? (
        <View style={[styles.bottomNav, { paddingBottom: insets.bottom }]}>
          {[...bottom, ['Perfil', '__perfil', 'user-round']].map(([l, p, ic]) => {
            const on = slug === p;
            return (
              <Pressable key={p} accessibilityRole="tab" accessibilityState={{ selected: on }} onPress={() => navigate(p === '__perfil' ? h('perfil', role) : h(role, p))} style={styles.bottomItem}>
                <Icon name={ic} size={20} color={on ? colors.primary : colors.mutedForeground} />
                <T style={{ fontSize: 10, color: on ? colors.primary : colors.mutedForeground, textAlign: 'center' }} numberOfLines={1}>{l}</T>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <AppModal visible={!!confirm} onClose={() => setConfirm('')}>
        <T display style={{ fontSize: 18, fontWeight: 700 }}>{confirm === 'start' ? 'Iniciar viagem?' : 'Encerrar viagem?'}</T>
        {d && d.atual ? (
          <Muted style={{ marginTop: 8 }}>
            {confirm === 'start'
              ? `Você está iniciando a viagem da ${d.atual.nomeRota} com o ônibus ${d.atual.placaOnibus} às ${hora(d.atual.horaInicio)}.`
              : `A viagem começou às ${hora(d.atual.horaInicio)}. ${aBordo} aluno${aBordo === 1 ? ' está embarcado' : 's estão embarcados'}.`}
          </Muted>
        ) : null}
        {confirm === 'end' ? (
          <Field label={aBordo ? 'Observação (obrigatória com alunos a bordo)' : 'Observação (opcional)'} style={{ marginTop: 16 }}>
            <Input multiline value={obs} onChangeText={setObs} placeholder="Ex.: todos os alunos desembarcaram na escola" maxLength={255} />
          </Field>
        ) : null}
        <ModalActions>
          <Button variant="outline" title="Cancelar" onPress={() => setConfirm('')} />
          <Button
            title={confirm === 'start' ? 'Iniciar viagem' : 'Encerrar viagem'} loading={busy}
            onPress={async () => {
              const start = confirm === 'start';
              const ok = await exec(() => (start ? patch(`/api/viagens/${d.atual.idViagem}/iniciar`) : patch(`/api/viagens/${d.atual.idViagem}/finalizar`, { observacaoFinalizacao: obs.trim() || null })), start ? 'Viagem iniciada.' : 'Viagem finalizada.');
              if (ok) { setConfirm(''); if (start) navigate(h('motorista', 'viagem')); }
            }}
          />
        </ModalActions>
      </AppModal>

      <AppModal visible={!!desfazer} onClose={() => setDesfazer(null)}>
        <T display style={{ fontSize: 18, fontWeight: 700 }}>Desfazer registro</T>
        <Muted style={{ marginTop: 8 }}>{desfazer ? `O ${desfazer.status === 'Desembarcado' ? 'desembarque' : 'embarque'} de ${desfazer.name} será invalidado.` : ''}</Muted>
        <Field label="Justificativa" style={{ marginTop: 16 }}><Select value={motivo} onChange={setMotivo} label="Justificativa" options={['Registro feito por engano', 'Aluno selecionado incorretamente', 'Aluno não compareceu']} placeholder="Selecione a justificativa" /></Field>
        <ModalActions>
          <Button variant="outline" title="Cancelar" onPress={() => setDesfazer(null)} />
          <Button
            variant="destructive" title="Invalidar" loading={busy} disabled={!motivo}
            onPress={async () => {
              const tipo = desfazer.status === 'Desembarcado' ? 'DESEMBARQUE' : 'EMBARQUE';
              const ok = await exec(() => patch(`/api/registros-transporte/${desfazer.id}/${d.atual.idViagem}/${tipo}/invalidar`, { justificativa: motivo }), 'Registro invalidado.');
              if (ok) setDesfazer(null);
            }}
          />
        </ModalActions>
      </AppModal>
    </View>
  );
}

const styles = StyleSheet.create({
  appbar: { backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },
  appbarInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 64, width: '100%', maxWidth: 1024, alignSelf: 'center' },
  sideLink: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: radius.md },
  bottomNav: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', paddingHorizontal: 4, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border },
  bottomItem: { flex: 1, height: 64, alignItems: 'center', justifyContent: 'center', gap: 4 },
  hero: { borderRadius: radius.lg, backgroundColor: colors.navy, padding: 24 },
  heroRoute: { marginTop: 24, paddingTop: 20, borderTopWidth: 1, borderTopColor: colors.white15 },
  splitTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  facts: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: colors.border, marginBottom: -12 },
  schedule: { flexDirection: 'row', gap: 16, padding: 16, borderRadius: radius.md, backgroundColor: colors.muted },
  tripBody: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 16, padding: 16, paddingBottom: 4, borderRadius: radius.md, backgroundColor: colors.muted },
  successCircle: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.softGreen },
  note: { marginTop: 20, padding: 16, borderRadius: radius.md, backgroundColor: colors.muted, alignSelf: 'stretch' },
  linkCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.card },
  profileHead: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: colors.border },
});
