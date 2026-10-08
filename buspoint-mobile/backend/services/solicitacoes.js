/* Extensão: solicitações de alteração de horário feitas pelo aluno (tela "Alterar horário") */
import { RecursoNaoEncontradoException, RegraNegocioException } from '../errors.js';
import { validar } from '../validation.js';
import { agoraDataHora } from '../clock.js';

const resposta = (db, s) => {
  const aluno = db.tabela('usuario').find((u) => u.idUsuario === s.idAluno) || {};
  const rota = s.idRota ? db.tabela('rota').find((r) => r.idRota === s.idRota) : null;
  return { ...s, nomeAluno: aluno.nomeUsuario, nomeRota: rota ? rota.nomeRota : null };
};

export const solicitacaoService = {
  cadastrar(db, idAluno, body) {
    const dto = validar(body, {
      horarioAtual: { notNull: true, type: 'time', message: 'O horário atual é obrigatório' },
      horarioDesejado: { notNull: true, type: 'time', message: 'O novo horário é obrigatório' },
      motivo: { notBlank: true, max: 255, message: 'O motivo é obrigatório' },
      idRota: { type: 'long' },
    });
    if (!db.tabela('aluno').some((a) => a.idUsuario === idAluno)) throw new RecursoNaoEncontradoException('Aluno não encontrado.');
    const s = {
      idSolicitacao: db.proximoId('solicitacao_horario'),
      idAluno,
      idRota: dto.idRota ?? null,
      horarioAtual: dto.horarioAtual,
      horarioDesejado: dto.horarioDesejado,
      motivo: dto.motivo,
      status: 'PENDENTE',
      dataHora: agoraDataHora(),
    };
    db.tabela('solicitacao_horario').push(s);
    return resposta(db, s);
  },

  listar: (db, idAluno) => db.tabela('solicitacao_horario')
    .filter((s) => idAluno == null || s.idAluno === idAluno)
    .map((s) => resposta(db, s)),

  decidir(db, id, status) {
    const s = db.tabela('solicitacao_horario').find((x) => x.idSolicitacao === id);
    if (!s) throw new RecursoNaoEncontradoException('Solicitação não encontrada.');
    if (s.status !== 'PENDENTE') throw new RegraNegocioException('A solicitação já foi respondida.');
    s.status = status;
    return resposta(db, s);
  },
};
