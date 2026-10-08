/* PontoParadaService */
import { RecursoNaoEncontradoException } from '../errors.js';
import { validar } from '../validation.js';

const REGRAS = {
  nomePonto: { notBlank: true, max: 100 },
  endereco: { notBlank: true, max: 255 },
  latitude: { notNull: true, type: 'number' },
  longitude: { notNull: true, type: 'number' },
};

export const pontoParadaService = {
  cadastrar(db, body) {
    const dados = validar(body, REGRAS);
    const ponto = { idPonto: db.proximoId('ponto_parada'), ...dados };
    db.tabela('ponto_parada').push(ponto);
    return { ...ponto };
  },

  listarTodos: (db) => db.tabela('ponto_parada').map((p) => ({ ...p })),

  buscarPorId(db, id) {
    const p = db.tabela('ponto_parada').find((x) => x.idPonto === id);
    if (!p) throw new RecursoNaoEncontradoException('Ponto de parada não encontrado.');
    return p;
  },

  atualizar(db, id, body) {
    const ponto = this.buscarPorId(db, id);
    Object.assign(ponto, validar(body, REGRAS));
    return { ...ponto };
  },

  excluir(db, id) {
    this.buscarPorId(db, id);
    const t = db.data.tabelas;
    t.ponto_parada = t.ponto_parada.filter((p) => p.idPonto !== id);
    // ON DELETE CASCADE em rota_ponto_parada
    t.rota_ponto_parada = t.rota_ponto_parada.filter((rp) => rp.idPonto !== id);
    t.matricula.forEach((m) => { if (m.idPontoEmbarque === id) m.idPontoEmbarque = null; });
  },
};
