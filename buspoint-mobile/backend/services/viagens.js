/* ViagemService */
import { RecursoNaoEncontradoException, RegraNegocioException } from '../errors.js';
import { validar } from '../validation.js';
import { agoraHora } from '../clock.js';

export const STATUS_VIAGEM = ['PENDENTE', 'EM_ANDAMENTO', 'FINALIZADA'];

// ViagemResponseDTO
export const viagemResponse = (db, v) => {
  const rota = db.tabela('rota').find((r) => r.idRota === v.idRota) || {};
  const mot = db.tabela('usuario').find((u) => u.idUsuario === v.idMotorista) || {};
  const oni = db.tabela('onibus').find((o) => o.idOnibus === v.idOnibus) || {};
  return {
    idViagem: v.idViagem,
    dataViagem: v.dataViagem,
    horaInicio: v.horaInicio,
    horaFim: v.horaFim,
    status: v.status,
    observacaoFinalizacao: v.observacaoFinalizacao,
    idRota: v.idRota,
    nomeRota: rota.nomeRota,
    idMotorista: v.idMotorista,
    nomeMotorista: mot.nomeUsuario,
    idOnibus: v.idOnibus,
    placaOnibus: oni.placaOnibus,
  };
};

const buscar = (db, id) => {
  const v = db.tabela('viagem').find((x) => x.idViagem === id);
  if (!v) throw new RecursoNaoEncontradoException('Viagem não encontrada.');
  return v;
};

export const contarAtivos = (db, idViagem, tipo) => db.tabela('registro_transporte')
  .filter((r) => r.idViagem === idViagem && r.tipoRegistro === tipo && r.status).length;

export const viagemService = {
  buscarEntidade: buscar,

  cadastrar(db, body) {
    const dto = validar(body, {
      dataViagem: { notNull: true, type: 'date', message: 'A data da viagem é obrigatória' },
      horaInicio: { notNull: true, type: 'time', message: 'O horário de início é obrigatório' },
      idRota: { notNull: true, type: 'long', message: 'A rota é obrigatória' },
      idMotorista: { notNull: true, type: 'long', message: 'O motorista é obrigatório' },
      idOnibus: { notNull: true, type: 'long', message: 'O ônibus é obrigatório' },
    });
    if (!db.tabela('rota').some((r) => r.idRota === dto.idRota)) throw new RecursoNaoEncontradoException('Rota não encontrada.');
    if (!db.tabela('motorista').some((m) => m.idUsuario === dto.idMotorista)) throw new RecursoNaoEncontradoException('Motorista não encontrado.');
    if (!db.tabela('onibus').some((o) => o.idOnibus === dto.idOnibus)) throw new RecursoNaoEncontradoException('Ônibus não encontrado.');
    const viagem = {
      idViagem: db.proximoId('viagem'),
      dataViagem: dto.dataViagem,
      horaInicio: dto.horaInicio,
      horaFim: null,
      status: 'PENDENTE', // toda viagem começa como pendente
      observacaoFinalizacao: null,
      idRota: dto.idRota,
      idMotorista: dto.idMotorista,
      idOnibus: dto.idOnibus,
    };
    db.tabela('viagem').push(viagem);
    return viagemResponse(db, viagem);
  },

  // Lista com filtros opcionais (ViagemRepository: findByDataViagem, findByRotaIdRota,
  // findByMotoristaIdUsuario, findByOnibusIdOnibus)
  listarTodas(db, filtros = {}) {
    return db.tabela('viagem')
      .filter((v) => (filtros.data == null || v.dataViagem === filtros.data)
        && (filtros.idRota == null || v.idRota === filtros.idRota)
        && (filtros.idMotorista == null || v.idMotorista === filtros.idMotorista)
        && (filtros.idOnibus == null || v.idOnibus === filtros.idOnibus)
        && (filtros.status == null || v.status === filtros.status))
      .map((v) => viagemResponse(db, v));
  },

  buscarPorId: (db, id) => viagemResponse(db, buscar(db, id)),

  iniciarViagem(db, id) {
    const v = buscar(db, id);
    if (v.status !== 'PENDENTE') throw new RegraNegocioException('Apenas viagens pendentes podem ser iniciadas.');
    v.status = 'EM_ANDAMENTO';
    return viagemResponse(db, v);
  },

  finalizarViagem(db, id, body) {
    const dto = validar(body || {}, { observacaoFinalizacao: { max: 255, sizeMessage: 'A observação deve possuir no máximo 255 caracteres' } });
    const obs = dto.observacaoFinalizacao;
    const v = buscar(db, id);
    if (v.status !== 'EM_ANDAMENTO') throw new RegraNegocioException('Apenas viagens em andamento podem ser finalizadas.');
    const alunosABordo = contarAtivos(db, id, 'EMBARQUE') - contarAtivos(db, id, 'DESEMBARQUE');
    // Exige observação quando ainda existem alunos embarcados
    if (alunosABordo > 0 && (obs == null || obs.trim() === '')) {
      throw new RegraNegocioException('Informe uma observação para finalizar com alunos embarcados');
    }
    v.status = 'FINALIZADA';
    v.observacaoFinalizacao = obs;
    v.horaFim = agoraHora();
    return viagemResponse(db, v);
  },
};
