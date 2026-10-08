/* MatriculaService */
import { RecursoNaoEncontradoException, RegraNegocioException } from '../errors.js';
import { validar, timeToMinutes } from '../validation.js';
import { hoje } from '../clock.js';

const nome = (db, idUsuario) => (db.tabela('usuario').find((u) => u.idUsuario === idUsuario) || {}).nomeUsuario;

// MatriculaResponseDTO (+ ponto de embarque, extensão)
export const matriculaResponse = (db, m) => {
  const rota = db.tabela('rota').find((r) => r.idRota === m.idRota) || {};
  const ponto = m.idPontoEmbarque ? db.tabela('ponto_parada').find((p) => p.idPonto === m.idPontoEmbarque) : null;
  return {
    idMatricula: m.idMatricula,
    idAluno: m.idAluno,
    nomeAluno: nome(db, m.idAluno),
    idRota: m.idRota,
    nomeRota: rota.nomeRota,
    statusMatricula: m.statusMatricula,
    dataMatricula: m.dataMatricula,
    idPontoEmbarque: ponto ? ponto.idPonto : null,
    nomePontoEmbarque: ponto ? ponto.nomePonto : null,
  };
};

const buscar = (db, id) => {
  const m = db.tabela('matricula').find((x) => x.idMatricula === id);
  if (!m) throw new RecursoNaoEncontradoException('Matrícula não encontrada.');
  return m;
};

// Duas rotas conflitam quando os intervalos de horário se sobrepõem
const conflita = (a, b) => timeToMinutes(a.horarioInicio) < timeToMinutes(b.horarioFim)
  && timeToMinutes(a.horarioFim) > timeToMinutes(b.horarioInicio);

export const matriculaService = {
  cadastrar(db, body) {
    const dto = validar(body, {
      idAluno: { notNull: true, type: 'long', message: 'O aluno é obrigatório' },
      idRota: { notNull: true, type: 'long', message: 'A rota é obrigatória' },
      idPontoEmbarque: { type: 'long' },
    });
    if (!db.tabela('aluno').some((a) => a.idUsuario === dto.idAluno)) throw new RecursoNaoEncontradoException('Aluno não encontrado.');
    const rota = db.tabela('rota').find((r) => r.idRota === dto.idRota);
    if (!rota) throw new RecursoNaoEncontradoException('Rota não encontrada.');

    // Verifica conflito de horário com as matrículas ativas do aluno
    const ativas = db.tabela('matricula').filter((m) => m.idAluno === dto.idAluno && m.statusMatricula);
    for (const m of ativas) {
      const rotaAtual = db.tabela('rota').find((r) => r.idRota === m.idRota);
      if (rotaAtual && conflita(rota, rotaAtual)) throw new RegraNegocioException('O aluno já possui uma rota ativa neste horário.');
    }
    if (db.tabela('matricula').some((m) => m.idAluno === dto.idAluno && m.idRota === dto.idRota)) {
      throw new RegraNegocioException('O aluno já possui matrícula nesta rota.');
    }
    if (dto.idPontoEmbarque != null) this.validarPonto(db, dto.idRota, dto.idPontoEmbarque);

    const matricula = {
      idMatricula: db.proximoId('matricula'),
      idAluno: dto.idAluno,
      idRota: dto.idRota,
      statusMatricula: true, // toda nova matrícula começa ativa
      dataMatricula: hoje(),
      idPontoEmbarque: dto.idPontoEmbarque ?? null,
    };
    db.tabela('matricula').push(matricula);
    return matriculaResponse(db, matricula);
  },

  listarTodas: (db) => db.tabela('matricula').map((m) => matriculaResponse(db, m)),

  buscarPorId: (db, id) => matriculaResponse(db, buscar(db, id)),

  listarPorAluno: (db, idAluno) => db.tabela('matricula').filter((m) => m.idAluno === idAluno).map((m) => matriculaResponse(db, m)),

  listarPorRota: (db, idRota) => db.tabela('matricula').filter((m) => m.idRota === idRota).map((m) => matriculaResponse(db, m)),

  desativar(db, id) {
    const m = buscar(db, id);
    if (!m.statusMatricula) throw new RegraNegocioException('A matrícula já está desativada.');
    m.statusMatricula = false;
    return matriculaResponse(db, m);
  },

  ativar(db, id) {
    const m = buscar(db, id);
    if (m.statusMatricula) throw new RegraNegocioException('A matrícula já está ativa.');
    // Reativar respeita a mesma regra de conflito de horário do cadastro
    const rota = db.tabela('rota').find((r) => r.idRota === m.idRota);
    const outras = db.tabela('matricula').filter((x) => x.idAluno === m.idAluno && x.statusMatricula && x.idMatricula !== m.idMatricula);
    for (const o of outras) {
      const r = db.tabela('rota').find((x) => x.idRota === o.idRota);
      if (r && rota && conflita(rota, r)) throw new RegraNegocioException('O aluno já possui uma rota ativa neste horário.');
    }
    m.statusMatricula = true;
    return matriculaResponse(db, m);
  },

  validarPonto(db, idRota, idPonto) {
    if (!db.tabela('rota_ponto_parada').some((rp) => rp.idRota === idRota && rp.idPonto === idPonto)) {
      throw new RegraNegocioException('O ponto não pertence a esta rota.');
    }
  },

  // extensão: define o ponto de embarque do aluno na rota
  definirPonto(db, id, body) {
    const m = buscar(db, id);
    const dto = validar(body, { idPontoEmbarque: { type: 'long' } });
    if (dto.idPontoEmbarque != null) this.validarPonto(db, m.idRota, dto.idPontoEmbarque);
    m.idPontoEmbarque = dto.idPontoEmbarque ?? null;
    return matriculaResponse(db, m);
  },
};
