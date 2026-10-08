/* RegistroTransporteService — embarques e desembarques */
import { RecursoNaoEncontradoException, RegraNegocioException } from '../errors.js';
import { validar } from '../validation.js';
import { agoraDataHora } from '../clock.js';
import { contarAtivos } from './viagens.js';

export const TIPOS = ['EMBARQUE', 'DESEMBARQUE'];

// RegistroTransporteResponseDTO
export const registroResponse = (db, r) => {
  const aluno = db.tabela('usuario').find((u) => u.idUsuario === r.idAluno) || {};
  const viagem = db.tabela('viagem').find((v) => v.idViagem === r.idViagem) || {};
  const rota = db.tabela('rota').find((x) => x.idRota === viagem.idRota) || {};
  return {
    idAluno: r.idAluno,
    nomeAluno: aluno.nomeUsuario,
    idViagem: r.idViagem,
    idRota: viagem.idRota,
    nomeRota: rota.nomeRota,
    tipoRegistro: r.tipoRegistro,
    dataHora: r.dataHora,
    justificativa: r.justificativa,
    status: r.status,
  };
};

const ativo = (db, idAluno, idViagem, tipo) => db.tabela('registro_transporte')
  .some((r) => r.idAluno === idAluno && r.idViagem === idViagem && r.tipoRegistro === tipo && r.status);

// Verifica se o aluno está embarcado em outra viagem (embarque sem desembarque)
const estaEmbarcadoEmOutraViagem = (db, idAluno, idViagemAtual) => db.tabela('registro_transporte')
  .filter((r) => r.idAluno === idAluno && r.tipoRegistro === 'EMBARQUE' && r.status && r.idViagem !== idViagemAtual)
  .some((r) => !ativo(db, idAluno, r.idViagem, 'DESEMBARQUE'));

export const registroTransporteService = {
  cadastrar(db, body) {
    const dto = validar(body, {
      idAluno: { notNull: true, type: 'long', message: 'O aluno é obrigatório' },
      idViagem: { notNull: true, type: 'long', message: 'A viagem é obrigatória' },
      tipoRegistro: { notNull: true, type: 'enum', values: TIPOS, message: 'O tipo do registro é obrigatório' },
      justificativa: { max: 255, sizeMessage: 'A justificativa deve possuir no máximo 255 caracteres' },
    });
    if (!db.tabela('aluno').some((a) => a.idUsuario === dto.idAluno)) throw new RecursoNaoEncontradoException('Aluno não encontrado');
    const viagem = db.tabela('viagem').find((v) => v.idViagem === dto.idViagem);
    if (!viagem) throw new RecursoNaoEncontradoException('Viagem não encontrada');
    if (viagem.status !== 'EM_ANDAMENTO') throw new RegraNegocioException('A viagem precisa estar em andamento');

    const possuiMatricula = db.tabela('matricula').some((m) => m.idAluno === dto.idAluno && m.idRota === viagem.idRota && m.statusMatricula);
    if (!possuiMatricula) throw new RegraNegocioException('O aluno não possui matrícula ativa nesta rota');

    if (ativo(db, dto.idAluno, dto.idViagem, dto.tipoRegistro)) throw new RegraNegocioException('Este registro de transporte já existe');

    if (dto.tipoRegistro === 'EMBARQUE') {
      if (estaEmbarcadoEmOutraViagem(db, dto.idAluno, dto.idViagem)) throw new RegraNegocioException('O aluno já está embarcado em outra viagem');
      const alunosABordo = contarAtivos(db, dto.idViagem, 'EMBARQUE') - contarAtivos(db, dto.idViagem, 'DESEMBARQUE');
      const onibus = db.tabela('onibus').find((o) => o.idOnibus === viagem.idOnibus);
      if (alunosABordo >= onibus.capacidadeOnibus) throw new RegraNegocioException('O ônibus atingiu sua capacidade máxima');
    }
    if (dto.tipoRegistro === 'DESEMBARQUE' && !ativo(db, dto.idAluno, dto.idViagem, 'EMBARQUE')) {
      throw new RegraNegocioException('O desembarque não pode ser registrado sem um embarque');
    }

    // Chave composta (aluno, viagem, tipo): um registro invalidado é sobrescrito (save = merge)
    const lista = db.tabela('registro_transporte');
    const existente = lista.find((r) => r.idAluno === dto.idAluno && r.idViagem === dto.idViagem && r.tipoRegistro === dto.tipoRegistro);
    const registro = existente || { idAluno: dto.idAluno, idViagem: dto.idViagem, tipoRegistro: dto.tipoRegistro };
    Object.assign(registro, { dataHora: agoraDataHora(), justificativa: dto.justificativa, status: true });
    if (!existente) lista.push(registro);
    return registroResponse(db, registro);
  },

  invalidar(db, idAluno, idViagem, tipoRegistro, body) {
    const dto = validar(body, { justificativa: { notBlank: true, max: 255, message: 'A justificativa é obrigatória', sizeMessage: 'A justificativa deve possuir no máximo 255 caracteres' } });
    const registro = db.tabela('registro_transporte').find((r) => r.idAluno === idAluno && r.idViagem === idViagem && r.tipoRegistro === tipoRegistro);
    if (!registro) throw new RecursoNaoEncontradoException('Registro de transporte não encontrado');
    if (!registro.status) throw new RegraNegocioException('O registro de transporte já está invalidado');
    // Impede desembarque ativo sem embarque ativo
    if (tipoRegistro === 'EMBARQUE' && ativo(db, idAluno, idViagem, 'DESEMBARQUE')) {
      throw new RegraNegocioException('Invalide o desembarque antes de invalidar o embarque');
    }
    registro.status = false;
    registro.justificativa = dto.justificativa;
    return registroResponse(db, registro);
  },

  listarTodos: (db) => db.tabela('registro_transporte').map((r) => registroResponse(db, r)),

  listarPorAluno: (db, idAluno) => db.tabela('registro_transporte').filter((r) => r.idAluno === idAluno).map((r) => registroResponse(db, r)),

  listarPorViagem: (db, idViagem) => db.tabela('registro_transporte').filter((r) => r.idViagem === idViagem).map((r) => registroResponse(db, r)),
};
