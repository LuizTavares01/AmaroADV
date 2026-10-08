/* RotaService e RotaPontoParadaService */
import { RecursoNaoEncontradoException, RegraNegocioException } from '../errors.js';
import { validar } from '../validation.js';

const REGRAS_ROTA = {
  nomeRota: { notBlank: true, max: 100, message: 'O nome da rota é obrigatório', sizeMessage: 'O nome da rota deve possuir no máximo 100 caracteres' },
  horarioInicio: { notNull: true, type: 'time', message: 'O horário de início é obrigatório' },
  horarioFim: { notNull: true, type: 'time', message: 'O horário de fim é obrigatório' },
  tipo: { notBlank: true, max: 50, message: 'O tipo da rota é obrigatório', sizeMessage: 'O tipo da rota deve possuir no máximo 50 caracteres' },
};

export const rotaResponse = (r) => ({
  idRota: r.idRota,
  nomeRota: r.nomeRota,
  horarioInicio: r.horarioInicio,
  horarioFim: r.horarioFim,
  statusRota: r.statusRota,
  tipo: r.tipo,
});

const buscar = (db, id) => {
  const r = db.tabela('rota').find((x) => x.idRota === id);
  if (!r) throw new RecursoNaoEncontradoException('Rota não encontrada');
  return r;
};

export const rotaService = {
  buscarEntidade: buscar,

  cadastrar(db, body) {
    const dados = validar(body, REGRAS_ROTA);
    const rota = { idRota: db.proximoId('rota'), ...dados, statusRota: true };
    db.tabela('rota').push(rota);
    return rotaResponse(rota);
  },

  listarTodas: (db) => db.tabela('rota').map(rotaResponse),

  listarAtivas: (db) => db.tabela('rota').filter((r) => r.statusRota).map(rotaResponse),

  buscarPorId: (db, id) => rotaResponse(buscar(db, id)),

  atualizar(db, id, body) {
    const rota = buscar(db, id);
    Object.assign(rota, validar(body, REGRAS_ROTA));
    return rotaResponse(rota);
  },

  desativar(db, id) { buscar(db, id).statusRota = false; },

  // extensão: reverte a inativação
  ativar(db, id) { buscar(db, id).statusRota = true; },
};

// RotaPontoParadaResponseDTO
const pontoDaRota = (db, rp) => {
  const p = db.tabela('ponto_parada').find((x) => x.idPonto === rp.idPonto);
  return { idPonto: p.idPonto, nomePonto: p.nomePonto, endereco: p.endereco, latitude: p.latitude, longitude: p.longitude, ordem: rp.ordem };
};

export const rotaPontoParadaService = {
  adicionarPonto(db, idRota, body) {
    const dto = validar(body, {
      idPonto: { notNull: true, type: 'long', message: 'O ponto de parada é obrigatório' },
      ordem: { notNull: true, type: 'integer', min: 1, message: 'A ordem é obrigatória', minMessage: 'A ordem deve iniciar em 1' },
    });
    if (!db.tabela('rota').some((r) => r.idRota === idRota)) throw new RecursoNaoEncontradoException('Rota não encontrada.');
    if (!db.tabela('ponto_parada').some((p) => p.idPonto === dto.idPonto)) throw new RecursoNaoEncontradoException('Ponto de parada não encontrado.');
    const lista = db.tabela('rota_ponto_parada');
    if (lista.some((x) => x.idRota === idRota && x.idPonto === dto.idPonto)) throw new RegraNegocioException('Este ponto já pertence à rota.');
    if (lista.some((x) => x.idRota === idRota && x.ordem === dto.ordem)) throw new RegraNegocioException('Já existe um ponto nesta posição da rota.');
    const rp = { idRota, idPonto: dto.idPonto, ordem: dto.ordem };
    lista.push(rp);
    return pontoDaRota(db, rp);
  },

  listarPontosDaRota(db, idRota) {
    if (!db.tabela('rota').some((r) => r.idRota === idRota)) throw new RecursoNaoEncontradoException('Rota não encontrada.');
    return db.tabela('rota_ponto_parada')
      .filter((x) => x.idRota === idRota)
      .sort((a, b) => a.ordem - b.ordem)
      .map((rp) => pontoDaRota(db, rp));
  },

  removerPonto(db, idRota, idPonto) {
    const lista = db.tabela('rota_ponto_parada');
    const i = lista.findIndex((x) => x.idRota === idRota && x.idPonto === idPonto);
    if (i < 0) throw new RegraNegocioException('O ponto não pertence a esta rota.');
    lista.splice(i, 1);
  },
};

// Extensão: motorista e ônibus padrão de cada rota (tabela rota_atribuicao)
export const atribuicaoService = {
  listar: (db) => db.tabela('rota_atribuicao').map((a) => ({ ...a })),

  buscar(db, idRota) {
    buscar(db, idRota);
    const a = db.tabela('rota_atribuicao').find((x) => x.idRota === idRota);
    return a ? { ...a } : { idRota, idMotorista: null, idOnibus: null };
  },

  definir(db, idRota, body) {
    buscar(db, idRota);
    const dados = validar(body, { idMotorista: { type: 'long' }, idOnibus: { type: 'long' } });
    const atual = this.buscar(db, idRota);
    const novo = {
      idRota,
      idMotorista: body && 'idMotorista' in body ? dados.idMotorista : atual.idMotorista,
      idOnibus: body && 'idOnibus' in body ? dados.idOnibus : atual.idOnibus,
    };
    if (novo.idMotorista != null && !db.tabela('motorista').some((m) => m.idUsuario === novo.idMotorista)) throw new RecursoNaoEncontradoException('Motorista não encontrado.');
    if (novo.idOnibus != null && !db.tabela('onibus').some((o) => o.idOnibus === novo.idOnibus)) throw new RecursoNaoEncontradoException('Ônibus não encontrado.');
    const t = db.data.tabelas;
    t.rota_atribuicao = t.rota_atribuicao.filter((x) => x.idRota !== idRota);
    t.rota_atribuicao.push(novo);
    return { ...novo };
  },
};
