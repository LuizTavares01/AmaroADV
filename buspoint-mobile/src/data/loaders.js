/* Busca dados na API e monta os "modelos de tela" usados pelas telas (nomes, rótulos e vínculos). */
import { get } from '../api/client';
import {
  STATUS_VIAGEM, ativoLabel, codigoViagem, dataBR, hojeISO, hora, iniciais, telefone,
} from '../utils/format';

const porId = (lista, campo) => Object.fromEntries(lista.map((x) => [x[campo], x]));

export function viagemVM(v) {
  return {
    id: v.idViagem,
    code: codigoViagem(v.idViagem),
    date: dataBR(v.dataViagem),
    dateIso: v.dataViagem,
    route: v.nomeRota,
    driver: v.nomeMotorista,
    bus: v.placaOnibus,
    start: hora(v.horaInicio),
    end: v.horaFim ? hora(v.horaFim) : '—',
    status: STATUS_VIAGEM[v.status] || v.status,
    statusRaw: v.status,
    raw: v,
  };
}

// Ordena viagens: mais recentes primeiro
export const ordenarViagens = (lista) => [...lista].sort((a, b) => (b.dataViagem + b.horaInicio).localeCompare(a.dataViagem + a.horaInicio));

/** Dados completos para o painel administrativo. */
export async function carregarCadastros() {
  const [alunos, motoristas, onibus, rotas, viagens, matriculas, atribuicoes, registros] = await Promise.all([
    get('/api/alunos'), get('/api/motoristas'), get('/api/onibus'), get('/api/rotas'),
    get('/api/viagens'), get('/api/matriculas'), get('/api/rotas/atribuicoes'), get('/api/registros-transporte'),
  ]);
  const pontosPorRota = Object.fromEntries(await Promise.all(rotas.map(async (r) => [r.idRota, await get(`/api/rotas/${r.idRota}/pontos`)])));

  const motPorId = porId(motoristas, 'idUsuario');
  const oniPorId = porId(onibus, 'idOnibus');
  const atrPorRota = porId(atribuicoes, 'idRota');
  const matAtivas = matriculas.filter((m) => m.statusMatricula);

  const rotasVM = rotas.map((r) => {
    const a = atrPorRota[r.idRota] || {};
    const mot = a.idMotorista ? motPorId[a.idMotorista] : null;
    const oni = a.idOnibus ? oniPorId[a.idOnibus] : null;
    const pontos = pontosPorRota[r.idRota] || [];
    return {
      id: r.idRota,
      name: r.nomeRota,
      type: r.tipo,
      start: hora(r.horarioInicio),
      end: hora(r.horarioFim),
      status: ativoLabel(r.statusRota, true),
      active: r.statusRota,
      driver: mot ? mot.nomeUsuario : '—',
      bus: oni ? oni.placaOnibus : '—',
      idMotorista: a.idMotorista || null,
      idOnibus: a.idOnibus || null,
      students: matAtivas.filter((m) => m.idRota === r.idRota).length,
      stops: pontos.map((p) => p.nomePonto),
      pontos,
      raw: r,
    };
  });
  const rotaPorId = porId(rotasVM, 'id');

  const alunosVM = alunos.map((a) => {
    const mats = matriculas.filter((m) => m.idAluno === a.idUsuario);
    const ativas = mats.filter((m) => m.statusMatricula);
    return {
      id: a.idUsuario,
      name: a.nomeUsuario,
      enrollment: String(a.numeroMatricula),
      period: a.periodo,
      route: ativas.map((m) => m.nomeRota).join(', ') || '—',
      stop: (ativas[0] && ativas[0].nomePontoEmbarque) || '—',
      status: ativoLabel(a.statusUsuario),
      active: a.statusUsuario,
      email: a.emailUsuario,
      phone: telefone(a.telefoneUsuario),
      login: a.loginUsuario,
      initials: iniciais(a.nomeUsuario),
      foto: a.fotoUsuario,
      matriculas: mats,
      raw: a,
    };
  });

  const rotasDoMotorista = (id) => rotasVM.filter((r) => r.idMotorista === id).map((r) => r.name);
  const motoristasVM = motoristas.map((m) => ({
    id: m.idUsuario,
    name: m.nomeUsuario,
    license: m.numeroCnh,
    category: m.categoriaCnh,
    validity: dataBR(m.validadeCnh),
    route: rotasDoMotorista(m.idUsuario).join(', ') || '—',
    status: ativoLabel(m.statusUsuario),
    active: m.statusUsuario,
    email: m.emailUsuario,
    phone: telefone(m.telefoneUsuario),
    login: m.loginUsuario,
    initials: iniciais(m.nomeUsuario),
    foto: m.fotoUsuario,
    raw: m,
  }));

  const onibusVM = onibus.map((o) => {
    const rs = rotasVM.filter((r) => r.idOnibus === o.idOnibus);
    return {
      id: o.idOnibus,
      plate: o.placaOnibus,
      capacity: o.capacidadeOnibus,
      driver: rs.map((r) => r.driver).filter((d) => d !== '—').join(', ') || '—',
      route: rs.map((r) => r.name).join(', ') || '—',
      status: ativoLabel(o.statusOnibus),
      active: o.statusOnibus,
      initials: 'ON',
      raw: o,
    };
  });

  const viagensVM = ordenarViagens(viagens).map(viagemVM);

  return {
    alunos: alunosVM,
    motoristas: motoristasVM,
    onibus: onibusVM,
    rotas: rotasVM,
    viagens: viagensVM,
    matriculas,
    registros,
    rotaPorId,
    hoje: hojeISO(),
  };
}

/** Situação de cada aluno numa viagem, a partir dos registros ativos. */
export function situacaoNaViagem(registros, idViagem, idAluno) {
  const regs = registros.filter((r) => r.idViagem === idViagem && r.idAluno === idAluno && r.status);
  const emb = regs.find((r) => r.tipoRegistro === 'EMBARQUE');
  const des = regs.find((r) => r.tipoRegistro === 'DESEMBARQUE');
  if (des) return { status: 'Desembarcado', embarque: emb, desembarque: des };
  if (emb) return { status: 'Embarcado', embarque: emb, desembarque: null };
  return { status: 'Aguardando', embarque: null, desembarque: null };
}

/** Viagem "atual": em andamento > pendente de hoje > finalizada de hoje > próxima pendente. */
export function escolherViagemAtual(viagens, hoje = hojeISO()) {
  const asc = [...viagens].sort((a, b) => (a.dataViagem + a.horaInicio).localeCompare(b.dataViagem + b.horaInicio));
  return asc.find((v) => v.status === 'EM_ANDAMENTO')
    || asc.find((v) => v.status === 'PENDENTE' && v.dataViagem === hoje)
    || [...asc].reverse().find((v) => v.status === 'FINALIZADA' && v.dataViagem === hoje)
    || asc.find((v) => v.status === 'PENDENTE' && v.dataViagem > hoje)
    || null;
}

/** Dados da área do motorista logado. */
export async function carregarMotorista(idMotorista) {
  const [viagens, atribuicoes, rotas, onibus] = await Promise.all([
    get(`/api/viagens?idMotorista=${idMotorista}`), get('/api/rotas/atribuicoes'), get('/api/rotas'), get('/api/onibus'),
  ]);
  const atual = escolherViagemAtual(viagens);
  const atr = atribuicoes.find((a) => a.idMotorista === idMotorista);
  const idRota = atual ? atual.idRota : atr ? atr.idRota : null;
  const idOnibus = atual ? atual.idOnibus : atr ? atr.idOnibus : null;
  const rota = rotas.find((r) => r.idRota === idRota) || null;
  const bus = onibus.find((o) => o.idOnibus === idOnibus) || null;
  const [pontos, matriculas, alunos, registros] = rota ? await Promise.all([
    get(`/api/rotas/${rota.idRota}/pontos`),
    get(`/api/rotas/${rota.idRota}/matriculas`),
    get('/api/alunos'),
    atual ? get(`/api/registros-transporte/viagem/${atual.idViagem}`) : Promise.resolve([]),
  ]) : [[], [], [], []];
  const alunoPorId = porId(alunos, 'idUsuario');
  const passageiros = matriculas
    .filter((m) => m.statusMatricula && alunoPorId[m.idAluno] && alunoPorId[m.idAluno].statusUsuario)
    .map((m) => {
      const a = alunoPorId[m.idAluno];
      const sit = atual ? situacaoNaViagem(registros, atual.idViagem, a.idUsuario) : { status: 'Aguardando' };
      return {
        id: a.idUsuario, name: a.nomeUsuario, initials: iniciais(a.nomeUsuario), foto: a.fotoUsuario,
        enrollment: String(a.numeroMatricula), stop: m.nomePontoEmbarque || '—', idPonto: m.idPontoEmbarque, ...sit,
      };
    })
    .sort((x, y) => {
      const ox = pontos.findIndex((p) => p.idPonto === x.idPonto);
      const oy = pontos.findIndex((p) => p.idPonto === y.idPonto);
      return (ox < 0 ? 99 : ox) - (oy < 0 ? 99 : oy) || x.name.localeCompare(y.name);
    });

  // Próximo ponto: primeiro ponto com aluno ainda aguardando
  let proximo = 0;
  if (atual && atual.status === 'EM_ANDAMENTO') {
    const aguardando = new Set(passageiros.filter((p) => p.status === 'Aguardando').map((p) => p.idPonto));
    const i = pontos.findIndex((p) => aguardando.has(p.idPonto));
    proximo = i >= 0 ? i : pontos.length - 1;
  }
  const hoje = hojeISO();
  const proximas = [...viagens].filter((v) => v.status === 'PENDENTE' && v.dataViagem >= hoje)
    .sort((a, b) => (a.dataViagem + a.horaInicio).localeCompare(b.dataViagem + b.horaInicio));
  return { viagens, atual, rota, bus, pontos, passageiros, proximo, proximas };
}

/** Dados da área do aluno logado. */
export async function carregarAluno(idAluno) {
  const [matriculas, registros, rotas, atribuicoes, onibus, solicitacoes] = await Promise.all([
    get(`/api/matriculas/aluno/${idAluno}`), get(`/api/registros-transporte/aluno/${idAluno}`), get('/api/rotas'),
    get('/api/rotas/atribuicoes'), get('/api/onibus'), get('/api/solicitacoes-horario'),
  ]);
  const ativa = matriculas.find((m) => m.statusMatricula) || null;
  const rota = ativa ? rotas.find((r) => r.idRota === ativa.idRota) : null;
  const [pontos, viagensRota] = rota
    ? await Promise.all([get(`/api/rotas/${rota.idRota}/pontos`), get(`/api/viagens?idRota=${rota.idRota}`)])
    : [[], []];
  const atual = escolherViagemAtual(viagensRota);
  const atr = rota ? atribuicoes.find((a) => a.idRota === rota.idRota) : null;
  const idOnibus = atual ? atual.idOnibus : atr ? atr.idOnibus : null;
  const bus = onibus.find((o) => o.idOnibus === idOnibus) || null;
  let motorista = atual ? atual.nomeMotorista : null;
  if (!motorista && atr && atr.idMotorista) {
    const v = viagensRota.find((x) => x.idMotorista === atr.idMotorista);
    motorista = v ? v.nomeMotorista : null;
  }

  // Histórico: viagens em que o aluno tem registro (agrupa embarque e desembarque)
  const ids = [...new Set(registros.map((r) => r.idViagem))];
  const viagens = await Promise.all(ids.map((id) => get(`/api/viagens/${id}`)));
  const historico = ordenarViagens(viagens).map((v) => ({
    ...viagemVM(v),
    situacao: situacaoNaViagem(registros, v.idViagem, idAluno),
  }));
  return { matriculas, ativa, rota, pontos, atual, bus, motorista, historico, solicitacoes };
}
