/* OnibusService */
import { RecursoNaoEncontradoException, RegraNegocioException } from '../errors.js';
import { validar } from '../validation.js';

const REGRAS = {
  placaOnibus: { notBlank: true, max: 10, message: 'A placa do ônibus é obrigatória' },
  capacidadeOnibus: { notNull: true, type: 'integer', min: 1, message: 'A capacidade do ônibus é obrigatória', minMessage: 'A capacidade deve ser maior que zero' },
};

const existePlaca = (db, placa) => db.tabela('onibus').some((o) => o.placaOnibus === placa);

export const onibusService = {
  cadastrar(db, body) {
    const dados = validar(body, REGRAS);
    const placa = dados.placaOnibus.trim().toUpperCase();
    if (existePlaca(db, placa)) throw new RegraNegocioException('Já existe um ônibus cadastrado com essa placa.');
    const onibus = { idOnibus: db.proximoId('onibus'), placaOnibus: placa, capacidadeOnibus: dados.capacidadeOnibus, statusOnibus: true };
    db.tabela('onibus').push(onibus);
    return { ...onibus };
  },

  listarTodos: (db) => db.tabela('onibus').map((o) => ({ ...o })),

  listarAtivos: (db) => db.tabela('onibus').filter((o) => o.statusOnibus).map((o) => ({ ...o })),

  buscarPorId(db, id) {
    const o = db.tabela('onibus').find((x) => x.idOnibus === id);
    if (!o) throw new RecursoNaoEncontradoException('Ônibus não encontrado.');
    return o;
  },

  atualizar(db, id, body) {
    const onibus = this.buscarPorId(db, id);
    const dados = validar(body, REGRAS);
    const novaPlaca = dados.placaOnibus.trim().toUpperCase();
    if (onibus.placaOnibus.toUpperCase() !== novaPlaca && existePlaca(db, novaPlaca)) {
      throw new RegraNegocioException('Já existe um ônibus cadastrado com essa placa.');
    }
    onibus.placaOnibus = novaPlaca;
    onibus.capacidadeOnibus = dados.capacidadeOnibus;
    return { ...onibus };
  },

  desativar(db, id) { this.buscarPorId(db, id).statusOnibus = false; },

  ativar(db, id) { this.buscarPorId(db, id).statusOnibus = true; },
};
