/* Cadastros do administrador: listagem com busca/filtro, formulário, detalhes e vinculações. */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import Icon from '../../ui/Icon';
import {
  AppModal, Avatar, Badge, Button, Display, Divide, Empty, Field, Grid, Headline, Input, Kicker, KvRow,
  LinkText, ModalActions, Muted, Row, Section, Select, Split, StopList, T, Table, useBreakpoint,
} from '../../ui/components';
import { colors, radius } from '../../theme';
import { h, useRouter } from '../../navigation/router';
import { del, get, patch, post, put } from '../../api/client';
import { useToast } from '../../ui/Toast';
import { situacaoNaViagem } from '../../data/loaders';
import {
  dataBR, dataISO, hojeISO, horaDe, mascaraData, mascaraHora, mascaraTelefone, soDigitos,
} from '../../utils/format';
import { COLUMNS, ENDPOINT, FILTERS, FORM_FIELDS, LABELS, NAMES } from './config';

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const FEM = ['rotas', 'viagens'];
const flex = (sec, palavra) => (FEM.includes(sec) ? palavra.replace(/o$/, 'a') : palavra);

/* ---------------- Inativar / reativar ---------------- */
export function useStatusToggle(sec) {
  const toast = useToast();
  const [alvo, setAlvo] = useState(null);
  const [busy, setBusy] = useState(false);
  const label = LABELS[sec] || 'registro';

  const reativar = async (row) => {
    try {
      await patch(`${ENDPOINT[sec]}/${row.id}/ativar`);
      toast(`${cap(label)} ${flex(sec, 'reativado')} com sucesso.`);
    } catch (e) { toast(e.message, { error: true }); }
  };

  const modal = (
    <AppModal visible={!!alvo} onClose={() => setAlvo(null)}>
      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.softRed, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
        <Icon name="trash-2" size={20} color={colors.destructive} />
      </View>
      <T display style={{ fontSize: 18, fontWeight: 700 }}>Confirmar inativação</T>
      <Muted style={{ marginTop: 8 }}>Deseja realmente inativar {alvo ? <T style={{ fontSize: 14, fontWeight: 700 }}>{alvo.name || alvo.plate}</T> : `${FEM.includes(sec) ? 'esta' : 'este'} ${label}`}? Esta ação pode ser revertida posteriormente.</Muted>
      <ModalActions>
        <Button variant="outline" title="Cancelar" onPress={() => setAlvo(null)} />
        <Button
          variant="destructive" title="Inativar" loading={busy}
          onPress={async () => {
            setBusy(true);
            try {
              await patch(`${ENDPOINT[sec]}/${alvo.id}/desativar`);
              toast('Registro inativado com sucesso.');
              setAlvo(null);
            } catch (e) { toast(e.message, { error: true }); } finally { setBusy(false); }
          }}
        />
      </ModalActions>
    </AppModal>
  );
  return { pedir: setAlvo, reativar, modal };
}

/* ---------------- Listagem ---------------- */
export function AdminList({ sec, rows, type, tableSection = sec }) {
  const { navigate } = useRouter();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('Todos');
  const editable = tableSection !== 'viagens';
  const toggle = useStatusToggle(tableSection);

  const q = query.trim().toLowerCase();
  const filtered = rows.filter((r) => {
    const texto = COLUMNS[tableSection].map(([, k]) => r[k]).concat([r.email, r.login]).join(' ').toLowerCase();
    return (!q || texto.includes(q)) && (filter === 'Todos' || r.status === filter);
  });

  const columns = COLUMNS[tableSection].map(([label, key, width, strong]) => ({
    label, width, strong,
    render: (r) => {
      if (key === 'name') {
        return (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Avatar initials={r.initials} uri={r.foto} />
            <T style={{ fontSize: 13, fontWeight: 600, flexShrink: 1 }} numberOfLines={1}>{r.name}</T>
          </View>
        );
      }
      if (key === 'status') return <Badge value={r.status} />;
      if (key === 'capacity') return `${r.capacity} lugares`;
      return r[key] == null || r[key] === '' ? '—' : String(r[key]);
    },
  }));
  columns.push({
    label: 'Ações', width: 140,
    render: (r) => (
      <View style={{ flexDirection: 'row', gap: 4 }}>
        <Button variant="ghost" iconOnly icon="eye" label={`Ver detalhes de ${r.name || r.plate || r.code}`} onPress={() => navigate(h('admin', tableSection, 'detalhes', r.id))} />
        {editable ? <Button variant="ghost" iconOnly icon="square-pen" label={`Editar ${r.name || r.plate}`} onPress={() => navigate(h('admin', tableSection, 'editar', r.id))} /> : null}
        {editable ? (
          r.active
            ? <Button variant="ghost" iconOnly icon="ellipsis" label={`Inativar ${r.name || r.plate}`} onPress={() => toggle.pedir(r)} />
            : <Button variant="ghost" iconOnly icon="rotate-ccw" label={`Reativar ${r.name || r.plate}`} onPress={() => toggle.reativar(r)} />
        ) : null}
      </View>
    ),
  });

  return (
    <View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, padding: 20, justifyContent: 'space-between' }}>
        <Input icon="search" value={query} onChangeText={setQuery} placeholder={`Buscar ${type}...`} label="Pesquisar" style={{ flexGrow: 1, flexBasis: 210, maxWidth: 320 }} />
        <Select icon="filter" value={filter} options={FILTERS[tableSection]} onChange={setFilter} label="Filtrar status" style={{ minWidth: 170 }} />
      </View>
      {filtered.length ? <Table columns={columns} rows={filtered} keyOf={(r) => String(r.id)} /> : <Empty text={`Nenhum ${type} encontrado.`} />}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1, borderTopColor: colors.border }}>
        <Muted style={{ fontSize: 12 }}>Mostrando {filtered.length} de {rows.length} registros</Muted>
        <Muted style={{ fontSize: 12 }}>Página 1 de 1</Muted>
      </View>
      {toggle.modal}
    </View>
  );
}

/* ---------------- Formulário ---------------- */
function valoresIniciais(sec, entity, data) {
  const v = {};
  FORM_FIELDS[sec].forEach((f) => { v[f.key] = f.options ? f.options[0] : ''; });
  if (sec === 'viagens') {
    v.dataViagem = dataBR(hojeISO());
    const rota = data.rotas.find((r) => r.active);
    if (rota) Object.assign(v, { idRota: rota.id, horaInicio: rota.start, idMotorista: rota.idMotorista || '', idOnibus: rota.idOnibus || '' });
  }
  if (!entity) return v;
  const raw = entity.raw;
  FORM_FIELDS[sec].forEach((f) => { if (raw[f.key] !== undefined && raw[f.key] !== null) v[f.key] = String(raw[f.key]); });
  if (raw.telefoneUsuario) v.telefoneUsuario = mascaraTelefone(raw.telefoneUsuario);
  if (raw.validadeCnh) v.validadeCnh = dataBR(raw.validadeCnh);
  if (raw.horarioInicio) v.horarioInicio = raw.horarioInicio.slice(0, 5);
  if (raw.horarioFim) v.horarioFim = raw.horarioFim.slice(0, 5);
  v._status = entity.status;
  return v;
}

function corpo(sec, v) {
  const b = {};
  FORM_FIELDS[sec].forEach((f) => { if (!f.key.startsWith('_')) b[f.key] = v[f.key]; });
  if ('telefoneUsuario' in b) b.telefoneUsuario = soDigitos(b.telefoneUsuario);
  if ('validadeCnh' in b) b.validadeCnh = dataISO(b.validadeCnh);
  if ('dataViagem' in b) b.dataViagem = dataISO(b.dataViagem);
  return b;
}

async function sincronizarPontos(idRota, paradas, atuais) {
  for (const p of atuais) await del(`/api/rotas/${idRota}/pontos/${p.idPonto}`);
  const todos = await get('/api/pontos-parada');
  for (let i = 0; i < paradas.length; i += 1) {
    const s = paradas[i];
    let idPonto = s.idPonto;
    if (!idPonto) {
      const existente = todos.find((p) => p.nomePonto.trim().toLowerCase() === s.nome.trim().toLowerCase());
      idPonto = existente ? existente.idPonto : (await post('/api/pontos-parada', { nomePonto: s.nome.trim(), endereco: s.nome.trim(), latitude: 0, longitude: 0 })).idPonto;
    }
    await post(`/api/rotas/${idRota}/pontos`, { idPonto, ordem: i + 1 });
  }
}

export function AdminForm({ sec, mode, entity, data }) {
  const { navigate, back } = useRouter();
  const toast = useToast();
  const { sm } = useBreakpoint();
  const edit = mode === 'editar';
  const label = LABELS[sec] || 'registro';
  const [v, setV] = useState(() => valoresIniciais(sec, edit ? entity : null, data));
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [paradas, setParadas] = useState(() => (edit && entity && entity.pontos ? entity.pontos.map((p) => ({ idPonto: p.idPonto, nome: p.nomePonto })) : []));
  const [novaParada, setNovaParada] = useState('');

  const set = (k, val) => {
    setV((s) => {
      const n = { ...s, [k]: val };
      // Na nova viagem, ao trocar a rota sugere motorista, ônibus e horário vinculados
      if (sec === 'viagens' && k === 'idRota') {
        const r = data.rotas.find((x) => x.id === val);
        if (r) Object.assign(n, { horaInicio: r.start, idMotorista: r.idMotorista || n.idMotorista, idOnibus: r.idOnibus || n.idOnibus });
      }
      return n;
    });
    setErros((e) => ({ ...e, [k]: undefined }));
  };

  const mascara = (f, val) => (f.type === 'time' ? mascaraHora(val) : f.type === 'date' ? mascaraData(val) : f.type === 'tel' ? mascaraTelefone(val) : f.type === 'plate' ? val.toUpperCase() : f.type === 'number' ? soDigitos(val) : val);

  const salvar = async () => {
    setSalvando(true);
    setErros({});
    setErroGeral('');
    try {
      const body = corpo(sec, v);
      let id = entity && edit ? entity.id : null;
      if (edit) await put(`${ENDPOINT[sec]}/${id}`, body);
      else id = (await post(ENDPOINT[sec], body))[{ alunos: 'idUsuario', motoristas: 'idUsuario', onibus: 'idOnibus', rotas: 'idRota', viagens: 'idViagem' }[sec]];
      if (sec === 'rotas') await sincronizarPontos(id, paradas, edit && entity ? entity.pontos : []);
      if (v._status) {
        const ativo = v._status === 'Ativo' || v._status === 'Ativa';
        const eraAtivo = edit && entity ? entity.active : true;
        if (ativo !== eraAtivo) await patch(`${ENDPOINT[sec]}/${id}/${ativo ? 'ativar' : 'desativar'}`);
      }
      toast(`${cap(label)} ${flex(sec, edit ? 'atualizado' : 'cadastrado')} com sucesso.`);
      navigate(h('admin', sec));
    } catch (e) {
      if (e.campos) setErros(e.campos);
      setErroGeral(e.campos ? 'Revise os campos destacados.' : e.message);
    } finally { setSalvando(false); }
  };

  const fields = FORM_FIELDS[sec].filter((f) => !(f.onlyNew && edit));
  const opcoesRef = (ref) => data[ref].filter((x) => x.active).map((x) => ({ value: x.id, label: x.name || x.plate, sub: ref === 'onibus' ? `${x.capacity} lugares` : ref === 'rotas' ? `${x.start} – ${x.end}` : undefined }));

  return (
    <View>
      <Headline eyebrow={`${NAMES[sec]} / ${edit ? 'EDITAR' : 'CADASTRAR'}`} title={`${edit ? 'Editar' : 'Cadastrar'} ${label}`} description={`Preencha as informações ${edit ? 'para atualizar o cadastro' : 'do novo cadastro'}.`} />
      <View style={{ maxWidth: 896 }}>
        <Section title="Informações gerais">
          <View style={{ padding: 24 }}>
            <Grid cols={sm ? 2 : 1} gap={20}>
              {fields.map((f) => (
                <Field key={f.key} label={f.label} error={erros[f.key]}>
                  {f.options ? (
                    <Select value={v[f.key]} options={f.options} onChange={(val) => set(f.key, val)} label={f.label} />
                  ) : f.ref ? (
                    <Select value={v[f.key]} options={opcoesRef(f.ref)} onChange={(val) => set(f.key, val)} label={f.label} placeholder={`Selecione ${f.label.toLowerCase()}`} />
                  ) : (
                    <Input
                      value={v[f.key]} onChangeText={(val) => set(f.key, mascara(f, val))} type={f.type === 'plate' ? 'login' : f.type || 'text'}
                      label={f.label} placeholder={f.placeholder || (f.type === 'time' ? 'HH:MM' : f.type === 'date' ? 'DD/MM/AAAA' : `Digite ${f.label.toLowerCase()}`)}
                    />
                  )}
                </Field>
              ))}
            </Grid>
          </View>
        </Section>

        {sec === 'rotas' ? (
          <Section title="Pontos de parada" style={{ marginTop: 20 }}>
            <View style={{ padding: 20 }}>
              <Muted style={{ fontSize: 12, marginBottom: 16 }}>Os pontos aparecem na ordem percorrida pelo ônibus.</Muted>
              <View style={{ gap: 8 }}>
                {paradas.map((s, i) => (
                  <View key={`${s.nome}-${i}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md }}>
                    <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.surfaceBlue, alignItems: 'center', justifyContent: 'center' }}><T style={{ fontSize: 12, fontWeight: 700, color: colors.primary }}>{i + 1}</T></View>
                    <T style={{ flex: 1, fontSize: 14 }}>{s.nome}</T>
                    {i > 0 ? <Button variant="ghost" iconOnly icon="arrow-up" label={`Subir ${s.nome}`} onPress={() => setParadas((p) => { const n = [...p]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; return n; })} /> : null}
                    <Button variant="ghost" iconOnly icon="x" label={`Remover ${s.nome}`} onPress={() => setParadas((p) => p.filter((_, j) => j !== i))} />
                  </View>
                ))}
                {!paradas.length ? <Muted style={{ fontSize: 12 }}>Nenhum ponto adicionado.</Muted> : null}
              </View>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
                <Input style={{ flex: 1 }} value={novaParada} onChangeText={setNovaParada} placeholder="Nome ou endereço do ponto" label="Nome do ponto"
                  onSubmitEditing={() => { if (novaParada.trim()) { setParadas((p) => [...p, { nome: novaParada.trim() }]); setNovaParada(''); } }} />
                <Button variant="outline" icon="plus" title={sm ? 'Adicionar ponto' : ''} iconOnly={!sm} label="Adicionar ponto" onPress={() => { if (novaParada.trim()) { setParadas((p) => [...p, { nome: novaParada.trim() }]); setNovaParada(''); } }} />
              </View>
            </View>
          </Section>
        ) : null}

        {erroGeral ? <T accessibilityRole="alert" style={{ marginTop: 16, fontSize: 13, color: colors.destructive }}>{erroGeral}</T> : null}
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 8, marginTop: 24 }}>
          <Button variant="outline" title="Cancelar" onPress={() => (back() ? null : navigate(h('admin', sec)))} />
          <Button title={edit ? 'Salvar alterações' : `Cadastrar ${label}`} loading={salvando} onPress={salvar} />
        </View>
      </View>
    </View>
  );
}

/* ---------------- Detalhes ---------------- */
function PassengerControl({ viagem, data }) {
  const toast = useToast();
  const [obs, setObs] = useState('');
  const [modal, setModal] = useState(false);
  const raw = viagem.raw;
  const alunos = data.matriculas.filter((m) => m.idRota === raw.idRota && m.statusMatricula);
  const regs = data.registros;
  const aBordo = alunos.filter((m) => situacaoNaViagem(regs, raw.idViagem, m.idAluno).status === 'Embarcado').length;
  const acao = async (fn, msg) => { try { await fn(); toast(msg); } catch (e) { toast(e.message, { error: true }); } };
  return (
    <View>
      <View style={{ gap: 16 }}>
        {alunos.length ? alunos.map((m) => {
          const s = situacaoNaViagem(regs, raw.idViagem, m.idAluno);
          return (
            <KvRow key={m.idMatricula} k={<View style={{ flexShrink: 1 }}><T style={{ fontSize: 14 }}>{m.nomeAluno}</T><Muted style={{ fontSize: 11 }}>{m.nomePontoEmbarque || 'Ponto não definido'}{s.embarque ? ` · embarque ${horaDe(s.embarque.dataHora)}` : ''}{s.desembarque ? ` · desembarque ${horaDe(s.desembarque.dataHora)}` : ''}</Muted></View>}>
              <Badge value={s.status} />
            </KvRow>
          );
        }) : <Muted style={{ fontSize: 12 }}>Nenhum aluno nesta rota.</Muted>}
      </View>
      {raw.observacaoFinalizacao ? <View style={{ marginTop: 16, padding: 12, borderRadius: radius.md, backgroundColor: colors.muted }}><Kicker style={{ marginBottom: 4 }}>Observação da finalização</Kicker><T style={{ fontSize: 13 }}>{raw.observacaoFinalizacao}</T></View> : null}
      <Row gap={8} style={{ marginTop: 20 }}>
        {raw.status === 'PENDENTE' ? <Button size="sm" icon="arrow-right" title="Iniciar viagem" onPress={() => acao(() => patch(`/api/viagens/${raw.idViagem}/iniciar`), 'Viagem iniciada.')} /> : null}
        {raw.status === 'EM_ANDAMENTO' ? <Button size="sm" variant="outline" title="Encerrar viagem" onPress={() => setModal(true)} /> : null}
      </Row>
      <AppModal visible={modal} onClose={() => setModal(false)}>
        <T display style={{ fontSize: 18, fontWeight: 700 }}>Encerrar viagem?</T>
        <Muted style={{ marginTop: 8 }}>{aBordo} aluno(s) ainda embarcado(s).{aBordo ? ' Informe uma observação para finalizar.' : ''}</Muted>
        <Field label="Observação" style={{ marginTop: 16 }}><Input multiline value={obs} onChangeText={setObs} placeholder="Opcional quando não há alunos a bordo" /></Field>
        <ModalActions>
          <Button variant="outline" title="Cancelar" onPress={() => setModal(false)} />
          <Button title="Encerrar viagem" onPress={() => acao(async () => { await patch(`/api/viagens/${raw.idViagem}/finalizar`, { observacaoFinalizacao: obs.trim() || null }); setModal(false); setObs(''); }, 'Viagem finalizada.')} />
        </ModalActions>
      </AppModal>
    </View>
  );
}

function ultimaAtividade(sec, entity, data) {
  if (sec === 'alunos') {
    const r = [...data.registros].filter((x) => x.idAluno === entity.id && x.status).sort((a, b) => b.dataHora.localeCompare(a.dataHora))[0];
    return r ? `${r.tipoRegistro === 'EMBARQUE' ? 'Embarque' : 'Desembarque'} · ${r.nomeRota} · ${dataBR(r.dataHora)} ${horaDe(r.dataHora)}` : 'Nenhum registro de transporte.';
  }
  const v = data.viagens.find((x) => (sec === 'motoristas' ? x.raw.idMotorista : x.raw.idOnibus) === entity.id && x.statusRaw !== 'PENDENTE');
  return v ? `Viagem da ${v.route} · ${v.date}` : 'Nenhuma viagem realizada.';
}

export function AdminDetails({ sec, entity, data }) {
  const { navigate } = useRouter();
  const { lg, sm } = useBreakpoint();
  const toggle = useStatusToggle(sec);
  if (!entity) return <Empty text="Registro não encontrado." />;
  const title = String(entity.name || entity.plate || entity.code);
  const keys = COLUMNS[sec].filter(([l, k]) => !['name', 'plate', 'code'].includes(k) && l !== 'Status');
  const person = ['alunos', 'motoristas'].includes(sec);

  let side;
  if (sec === 'rotas') {
    side = (
      <View>
        <StopList stops={entity.stops} />
        <Row gap={8} style={{ marginTop: 8 }}>
          {[['Vincular aluno', 'aluno'], ['Vincular motorista', 'motorista'], ['Vincular ônibus', 'onibus']].map(([l, k]) => (
            <Button key={k} variant="outline" size="sm" title={l} onPress={() => navigate(h('admin', 'rotas', `vincular-${k}`, entity.id))} />
          ))}
        </Row>
      </View>
    );
  } else if (sec === 'viagens') {
    side = <PassengerControl viagem={entity} data={data} />;
  } else {
    side = (
      <View>
        <Kicker style={{ marginBottom: 8 }}>{sec === 'alunos' ? 'Rota vinculada' : 'Rota atual'}</Kicker>
        <T style={{ fontSize: 14, fontWeight: 600 }}>{entity.route}</T>
        {sec === 'alunos' ? <><Kicker style={{ marginTop: 20, marginBottom: 8 }}>Ponto de embarque</Kicker><T style={{ fontSize: 14, fontWeight: 600 }}>{entity.stop}</T></> : null}
        <Kicker style={{ marginTop: 20, marginBottom: 8 }}>Última atividade</Kicker>
        <Muted>{ultimaAtividade(sec, entity, data)}</Muted>
      </View>
    );
  }
  const sideTitle = sec === 'rotas' ? 'Pontos de parada' : sec === 'viagens' ? 'Controle de passageiros' : 'Vínculos e atividade';
  const vinculados = sec === 'rotas' ? data.matriculas.filter((m) => m.idRota === entity.id && m.statusMatricula) : [];

  return (
    <View>
      <LinkText title={`Voltar para ${(NAMES[sec] || sec).toLowerCase()}`} icon="arrow-left" color={colors.mutedForeground} size={14} weight={400} style={{ marginBottom: 20 }} onPress={() => navigate(h('admin', sec))} />
      <Headline
        eyebrow={`${NAMES[sec]} / DETALHES`}
        title={title}
        action={sec !== 'viagens' ? (
          <Row gap={8}>
            <Button variant="outline" icon="square-pen" title="Editar" onPress={() => navigate(h('admin', sec, 'editar', entity.id))} />
            {entity.active ? <Button variant="outline" icon="trash-2" title="Inativar" color={colors.destructive} onPress={() => toggle.pedir(entity)} /> : <Button variant="outline" icon="rotate-ccw" title="Reativar" onPress={() => toggle.reativar(entity)} />}
          </Row>
        ) : null}
      />
      <Split wide={lg} ratio={[1.4, 1]}>
        <Section title="Informações gerais">
          <View style={{ padding: 24 }}>
            {person ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                <Avatar initials={entity.initials} uri={entity.foto} lg />
                <View style={{ flexShrink: 1 }}><Display>{title}</Display><Muted>{entity.email}</Muted></View>
              </View>
            ) : null}
            <Grid cols={sm ? 2 : 1} gap={24}>
              {keys.map(([l, k]) => (
                <View key={k}><Kicker style={{ marginBottom: 6 }}>{l}</Kicker><T style={{ fontSize: 14, fontWeight: 600 }}>{entity[k] == null || entity[k] === '' ? '—' : `${entity[k]}${k === 'capacity' ? ' lugares' : ''}`}</T></View>
              ))}
              {person ? <View><Kicker style={{ marginBottom: 6 }}>Telefone</Kicker><T style={{ fontSize: 14, fontWeight: 600 }}>{entity.phone}</T></View> : null}
              {person ? <View><Kicker style={{ marginBottom: 6 }}>Login</Kicker><T style={{ fontSize: 14, fontWeight: 600 }}>{entity.login}</T></View> : null}
              <View><Kicker style={{ marginBottom: 6 }}>Status</Kicker><Badge value={entity.status} /></View>
            </Grid>
          </View>
        </Section>
        <Section title={sideTitle}><View style={{ padding: 20 }}>{side}</View></Section>
      </Split>
      {sec === 'rotas' ? (
        <Section title="Alunos vinculados" style={{ marginTop: 20 }}>
          {vinculados.length ? (
            <Divide>
              {vinculados.map((m) => {
                const a = data.alunos.find((x) => x.id === m.idAluno) || {};
                return (
                  <View key={m.idMatricula} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 12 }}>
                    <Avatar initials={a.initials} uri={a.foto} />
                    <View style={{ flex: 1 }}><T style={{ fontSize: 14, fontWeight: 600 }}>{m.nomeAluno}</T><Muted style={{ fontSize: 12 }}>{m.nomePontoEmbarque || 'Ponto não definido'}</Muted></View>
                    <Muted style={{ fontSize: 12 }}>{a.enrollment}</Muted>
                  </View>
                );
              })}
            </Divide>
          ) : <Empty text="Nenhum aluno vinculado." />}
        </Section>
      ) : null}
      {toggle.modal}
    </View>
  );
}

/* ---------------- Vinculações da rota ---------------- */
export function AdminLinking({ mode, id, data }) {
  const { navigate } = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(null);
  const type = mode.replace('vincular-', '');
  const route = data.rotas.find((r) => r.id === id);
  const options = useMemo(() => (type === 'aluno' ? data.alunos : type === 'motorista' ? data.motoristas : data.onibus).filter((o) => o.active), [type, data]);
  if (!route) return <Empty text="Rota não encontrada." />;

  const exec = async (key, fn, msg) => {
    setBusy(key);
    try { await fn(); toast(msg); } catch (e) { toast(e.message, { error: true }); } finally { setBusy(null); }
  };

  const pontosRota = route.pontos.map((p) => ({ value: p.idPonto, label: `${p.ordem}. ${p.nomePonto}` }));

  return (
    <View>
      <LinkText title="Voltar à rota" icon="arrow-left" color={colors.mutedForeground} size={14} weight={400} style={{ marginBottom: 20 }} onPress={() => navigate(h('admin', 'rotas', 'detalhes', id))} />
      <Headline eyebrow="ROTAS / VINCULAÇÕES" title={`Vincular ${type === 'aluno' ? 'alunos' : type === 'motorista' ? 'motorista' : 'ônibus'} à ${route.name}`} description={type === 'aluno' ? 'Matricule alunos nesta rota e defina o ponto de embarque de cada um.' : 'Selecione o registro que atende esta rota.'} />
      <Section title="Registros disponíveis">
        {options.length ? (
          <Divide>
            {options.map((o) => {
              const name = o.name || o.plate;
              let on; let sub; let action; let extra = null;
              if (type === 'aluno') {
                const mat = data.matriculas.find((m) => m.idAluno === o.id && m.idRota === route.id);
                on = !!(mat && mat.statusMatricula);
                sub = `Matrícula ${o.enrollment} · ${o.period}`;
                action = () => exec(o.id, async () => {
                  if (!mat) await post('/api/matriculas', { idAluno: o.id, idRota: route.id, idPontoEmbarque: route.pontos[1] ? route.pontos[1].idPonto : null });
                  else await patch(`/api/matriculas/${mat.idMatricula}/${on ? 'desativar' : 'ativar'}`);
                }, on ? 'Vínculo removido.' : 'Vínculo realizado com sucesso.');
                if (on && pontosRota.length) {
                  extra = (
                    <View style={{ paddingLeft: 48, paddingRight: 20, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Icon name="map-pin" size={14} color={colors.mutedForeground} />
                      <Select style={{ flex: 1, maxWidth: 320, minHeight: 34 }} value={mat.idPontoEmbarque} options={pontosRota} placeholder="Definir ponto de embarque" label="Ponto de embarque"
                        onChange={(idPonto) => exec(o.id, () => patch(`/api/matriculas/${mat.idMatricula}/ponto`, { idPontoEmbarque: idPonto }), 'Ponto de embarque atualizado.')} />
                    </View>
                  );
                }
              } else {
                const campo = type === 'motorista' ? 'idMotorista' : 'idOnibus';
                on = route[campo] === o.id;
                sub = o.license ? `CNH ${o.license}` : `${o.capacity} lugares`;
                action = () => exec(o.id, () => put(`/api/rotas/${route.id}/atribuicao`, { [campo]: on ? null : o.id }), on ? 'Vínculo removido.' : 'Vínculo realizado com sucesso.');
              }
              return (
                <View key={o.id}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 12 }}>
                    <Avatar initials={o.initials || 'ON'} uri={o.foto} />
                    <View style={{ flex: 1 }}><T style={{ fontSize: 14, fontWeight: 600 }}>{name}</T><Muted style={{ fontSize: 12 }}>{sub}</Muted></View>
                    <Button size="sm" variant={on ? 'outline' : 'primary'} title={on ? 'Vinculado' : 'Vincular'} loading={busy === o.id} onPress={action} />
                  </View>
                  {extra}
                </View>
              );
            })}
          </Divide>
        ) : <Empty text="Nenhum registro ativo disponível." />}
      </Section>
    </View>
  );
}

export const NovoBotao = ({ sec }) => {
  const { navigate } = useRouter();
  return <Button icon="plus" title={`Nov${sec === 'rotas' || sec === 'viagens' ? 'a' : 'o'} ${LABELS[sec]}`} onPress={() => navigate(h('admin', sec, 'novo'))} />;
};

