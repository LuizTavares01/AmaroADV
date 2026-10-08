/* Rotas REST da API BusPoint — mesmos caminhos dos controllers Spring (/api/...).
   Recebe { method, path, body, headers } e devolve { status, body }.
   Usado tanto pelo app (modo local, sem rede) quanto pelo servidor Node (server.js). */
import {
  AcessoNegadoException, ConflitoException, NaoAutenticadoException,
  RecursoNaoEncontradoException, RegraNegocioException, ValidacaoException,
} from './errors.js';
import { pathLong, parseDate } from './validation.js';
import { agoraDataHora } from './clock.js';
import { alunoService, motoristaService, administradorService } from './services/usuarios.js';
import { onibusService } from './services/onibus.js';
import { pontoParadaService } from './services/pontosParada.js';
import { rotaService, rotaPontoParadaService, atribuicaoService } from './services/rotas.js';
import { matriculaService } from './services/matriculas.js';
import { viagemService, STATUS_VIAGEM } from './services/viagens.js';
import { registroTransporteService, TIPOS } from './services/registros.js';
import { solicitacaoService } from './services/solicitacoes.js';
import { authService } from './services/auth.js';

const ADMIN = 'ADMINISTRADOR';
const MOTORISTA = 'MOTORISTA';
const ALUNO = 'ALUNO';
const PUBLICO = 'PUBLICO';
const LOGADO = [ADMIN, MOTORISTA, ALUNO];

const ok = (body) => ({ status: 200, body });
const criado = (body) => ({ status: 201, body });
const semConteudo = () => ({ status: 204, body: null });

const tipoRegistro = (v) => {
  if (!TIPOS.includes(v)) throw new ValidacaoException({ tipoRegistro: `deve ser um dos valores: ${TIPOS.join(', ')}` });
  return v;
};

// Motorista só opera as próprias viagens
const exigirDonoDaViagem = ({ db, auth }, idViagem) => {
  if (auth.perfil !== MOTORISTA) return;
  const v = viagemService.buscarEntidade(db, idViagem);
  if (v.idMotorista !== auth.idUsuario) throw new AcessoNegadoException('Esta viagem pertence a outro motorista.');
};

// Aluno só consulta os próprios dados
const exigirProprioAluno = ({ auth }, idAluno) => {
  if (auth.perfil === ALUNO && auth.idUsuario !== idAluno) throw new AcessoNegadoException();
};

const usuarios = (base, service, leitura) => [
  ['GET', base, ({ db }) => ok(service.buscarTodos(db)), leitura],
  ['GET', `${base}/:id`, ({ db, p }) => ok(service.buscarPorId(db, pathLong(p.id))), leitura],
  ['POST', base, async ({ db, body }) => criado(await service.cadastrar(db, body)), [ADMIN]],
  ['PUT', `${base}/:id`, ({ db, p, body }) => ok(service.atualizar(db, pathLong(p.id), body)), [ADMIN]],
  ['PATCH', `${base}/:id/desativar`, ({ db, p }) => { service.desativar(db, pathLong(p.id)); return semConteudo(); }, [ADMIN]],
  ['PATCH', `${base}/:id/ativar`, ({ db, p }) => { service.ativar(db, pathLong(p.id)); return semConteudo(); }, [ADMIN]],
];

const ROTAS = [
  // ---------- Autenticação (extensão) ----------
  ['GET', '/api/status', () => ok({ status: 'UP', aplicacao: 'buspoint' }), PUBLICO],
  ['POST', '/api/auth/login', async ({ db, body }) => ok(await authService.login(db, body)), PUBLICO],
  ['POST', '/api/auth/demo/:perfil', ({ db, p, opcoes }) => {
    if (!opcoes.demo) throw new AcessoNegadoException('O modo demonstração está desativado neste servidor.');
    return ok(authService.entrarComoDemo(db, p.perfil));
  }, PUBLICO],
  ['POST', '/api/auth/verificar-identidade', ({ db, body }) => ok(authService.verificarIdentidade(db, body)), PUBLICO],
  ['POST', '/api/auth/definir-senha', async ({ db, body }) => ok(await authService.definirSenha(db, body)), PUBLICO],
  ['POST', '/api/auth/logout', ({ db, token }) => { authService.logout(db, token); return semConteudo(); }, LOGADO],
  ['GET', '/api/auth/me', ({ db, auth }) => ok(authService.me(db, auth.idUsuario)), LOGADO],
  ['PUT', '/api/usuarios/me', ({ db, auth, body }) => ok(authService.atualizarMe(db, auth.idUsuario, body)), LOGADO],
  ['PUT', '/api/usuarios/me/senha', async ({ db, auth, body }) => ok(await authService.alterarSenha(db, auth.idUsuario, body)), LOGADO],
  ['PUT', '/api/usuarios/me/foto', ({ db, auth, body }) => ok(authService.alterarFoto(db, auth.idUsuario, body)), LOGADO],
  ['POST', '/api/dev/restaurar', async ({ db, opcoes }) => {
    if (!opcoes.demo) throw new AcessoNegadoException('O modo demonstração está desativado neste servidor.');
    await db.restaurar();
    return semConteudo();
  }, PUBLICO],

  // ---------- Usuários ----------
  ...usuarios('/api/alunos', alunoService, [ADMIN, MOTORISTA]),
  ...usuarios('/api/motoristas', motoristaService, [ADMIN, MOTORISTA]),
  ...usuarios('/api/administradores', administradorService, [ADMIN]),

  // ---------- Ônibus ----------
  ['POST', '/api/onibus', ({ db, body }) => criado(onibusService.cadastrar(db, body)), [ADMIN]],
  ['GET', '/api/onibus', ({ db }) => ok(onibusService.listarTodos(db)), LOGADO],
  ['GET', '/api/onibus/ativos', ({ db }) => ok(onibusService.listarAtivos(db)), LOGADO],
  ['GET', '/api/onibus/:id', ({ db, p }) => ok({ ...onibusService.buscarPorId(db, pathLong(p.id)) }), LOGADO],
  ['PUT', '/api/onibus/:id', ({ db, p, body }) => ok(onibusService.atualizar(db, pathLong(p.id), body)), [ADMIN]],
  ['PATCH', '/api/onibus/:id/desativar', ({ db, p }) => { onibusService.desativar(db, pathLong(p.id)); return semConteudo(); }, [ADMIN]],
  ['PATCH', '/api/onibus/:id/ativar', ({ db, p }) => { onibusService.ativar(db, pathLong(p.id)); return semConteudo(); }, [ADMIN]],

  // ---------- Pontos de parada ----------
  ['POST', '/api/pontos-parada', ({ db, body }) => criado(pontoParadaService.cadastrar(db, body)), [ADMIN]],
  ['GET', '/api/pontos-parada', ({ db }) => ok(pontoParadaService.listarTodos(db)), LOGADO],
  ['GET', '/api/pontos-parada/:id', ({ db, p }) => ok({ ...pontoParadaService.buscarPorId(db, pathLong(p.id)) }), LOGADO],
  ['PUT', '/api/pontos-parada/:id', ({ db, p, body }) => ok(pontoParadaService.atualizar(db, pathLong(p.id), body)), [ADMIN]],
  ['DELETE', '/api/pontos-parada/:id', ({ db, p }) => { pontoParadaService.excluir(db, pathLong(p.id)); return semConteudo(); }, [ADMIN]],

  // ---------- Rotas ----------
  ['POST', '/api/rotas', ({ db, body }) => criado(rotaService.cadastrar(db, body)), [ADMIN]],
  ['GET', '/api/rotas', ({ db }) => ok(rotaService.listarTodas(db)), LOGADO],
  ['GET', '/api/rotas/ativas', ({ db }) => ok(rotaService.listarAtivas(db)), LOGADO],
  ['GET', '/api/rotas/atribuicoes', ({ db }) => ok(atribuicaoService.listar(db)), LOGADO],
  ['GET', '/api/rotas/:id', ({ db, p }) => ok(rotaService.buscarPorId(db, pathLong(p.id))), LOGADO],
  ['PUT', '/api/rotas/:id', ({ db, p, body }) => ok(rotaService.atualizar(db, pathLong(p.id), body)), [ADMIN]],
  ['PATCH', '/api/rotas/:id/desativar', ({ db, p }) => { rotaService.desativar(db, pathLong(p.id)); return semConteudo(); }, [ADMIN]],
  ['PATCH', '/api/rotas/:id/ativar', ({ db, p }) => { rotaService.ativar(db, pathLong(p.id)); return semConteudo(); }, [ADMIN]],
  ['GET', '/api/rotas/:id/atribuicao', ({ db, p }) => ok(atribuicaoService.buscar(db, pathLong(p.id))), LOGADO],
  ['PUT', '/api/rotas/:id/atribuicao', ({ db, p, body }) => ok(atribuicaoService.definir(db, pathLong(p.id), body)), [ADMIN]],
  ['GET', '/api/rotas/:id/matriculas', ({ db, p }) => ok(matriculaService.listarPorRota(db, pathLong(p.id))), [ADMIN, MOTORISTA]],

  // ---------- Pontos da rota ----------
  ['POST', '/api/rotas/:idRota/pontos', ({ db, p, body }) => criado(rotaPontoParadaService.adicionarPonto(db, pathLong(p.idRota, 'idRota'), body)), [ADMIN]],
  ['GET', '/api/rotas/:idRota/pontos', ({ db, p }) => ok(rotaPontoParadaService.listarPontosDaRota(db, pathLong(p.idRota, 'idRota'))), LOGADO],
  ['DELETE', '/api/rotas/:idRota/pontos/:idPonto', ({ db, p }) => {
    rotaPontoParadaService.removerPonto(db, pathLong(p.idRota, 'idRota'), pathLong(p.idPonto, 'idPonto'));
    return semConteudo();
  }, [ADMIN]],

  // ---------- Matrículas ----------
  ['POST', '/api/matriculas', ({ db, body }) => criado(matriculaService.cadastrar(db, body)), [ADMIN]],
  ['GET', '/api/matriculas', ({ db }) => ok(matriculaService.listarTodas(db)), [ADMIN, MOTORISTA]],
  ['GET', '/api/matriculas/aluno/:idAluno', (c) => {
    const id = pathLong(c.p.idAluno, 'idAluno');
    exigirProprioAluno(c, id);
    return ok(matriculaService.listarPorAluno(c.db, id));
  }, LOGADO],
  ['GET', '/api/matriculas/:idMatricula', ({ db, p }) => ok(matriculaService.buscarPorId(db, pathLong(p.idMatricula, 'idMatricula'))), [ADMIN, MOTORISTA]],
  ['PATCH', '/api/matriculas/:idMatricula/desativar', ({ db, p }) => ok(matriculaService.desativar(db, pathLong(p.idMatricula, 'idMatricula'))), [ADMIN]],
  ['PATCH', '/api/matriculas/:idMatricula/ativar', ({ db, p }) => ok(matriculaService.ativar(db, pathLong(p.idMatricula, 'idMatricula'))), [ADMIN]],
  ['PATCH', '/api/matriculas/:idMatricula/ponto', ({ db, p, body }) => ok(matriculaService.definirPonto(db, pathLong(p.idMatricula, 'idMatricula'), body)), [ADMIN]],

  // ---------- Viagens ----------
  ['POST', '/api/viagens', ({ db, body }) => criado(viagemService.cadastrar(db, body)), [ADMIN]],
  ['GET', '/api/viagens', ({ db, q }) => {
    const filtros = {};
    if (q.data) { const d = parseDate(q.data); if (!d) throw new ValidacaoException({ data: 'deve ser uma data válida (aaaa-mm-dd)' }); filtros.data = d; }
    if (q.idRota) filtros.idRota = pathLong(q.idRota, 'idRota');
    if (q.idMotorista) filtros.idMotorista = pathLong(q.idMotorista, 'idMotorista');
    if (q.idOnibus) filtros.idOnibus = pathLong(q.idOnibus, 'idOnibus');
    if (q.status) { if (!STATUS_VIAGEM.includes(q.status)) throw new ValidacaoException({ status: `deve ser um dos valores: ${STATUS_VIAGEM.join(', ')}` }); filtros.status = q.status; }
    return ok(viagemService.listarTodas(db, filtros));
  }, LOGADO],
  ['GET', '/api/viagens/:idViagem', ({ db, p }) => ok(viagemService.buscarPorId(db, pathLong(p.idViagem, 'idViagem'))), LOGADO],
  ['PATCH', '/api/viagens/:idViagem/iniciar', (c) => {
    const id = pathLong(c.p.idViagem, 'idViagem');
    exigirDonoDaViagem(c, id);
    return ok(viagemService.iniciarViagem(c.db, id));
  }, [ADMIN, MOTORISTA]],
  ['PATCH', '/api/viagens/:idViagem/finalizar', (c) => {
    const id = pathLong(c.p.idViagem, 'idViagem');
    exigirDonoDaViagem(c, id);
    return ok(viagemService.finalizarViagem(c.db, id, c.body));
  }, [ADMIN, MOTORISTA]],

  // ---------- Registros de transporte ----------
  ['POST', '/api/registros-transporte', (c) => {
    if (c.body && c.body.idViagem != null && Number.isSafeInteger(Number(c.body.idViagem))) exigirDonoDaViagem(c, Number(c.body.idViagem));
    return criado(registroTransporteService.cadastrar(c.db, c.body));
  }, [ADMIN, MOTORISTA]],
  ['PATCH', '/api/registros-transporte/:idAluno/:idViagem/:tipoRegistro/invalidar', (c) => {
    const idViagem = pathLong(c.p.idViagem, 'idViagem');
    exigirDonoDaViagem(c, idViagem);
    return ok(registroTransporteService.invalidar(c.db, pathLong(c.p.idAluno, 'idAluno'), idViagem, tipoRegistro(c.p.tipoRegistro), c.body));
  }, [ADMIN, MOTORISTA]],
  ['GET', '/api/registros-transporte', ({ db }) => ok(registroTransporteService.listarTodos(db)), [ADMIN, MOTORISTA]],
  ['GET', '/api/registros-transporte/aluno/:idAluno', (c) => {
    const id = pathLong(c.p.idAluno, 'idAluno');
    exigirProprioAluno(c, id);
    return ok(registroTransporteService.listarPorAluno(c.db, id));
  }, LOGADO],
  ['GET', '/api/registros-transporte/viagem/:idViagem', ({ db, p }) => ok(registroTransporteService.listarPorViagem(db, pathLong(p.idViagem, 'idViagem'))), [ADMIN, MOTORISTA]],

  // ---------- Solicitações de alteração de horário (extensão) ----------
  ['POST', '/api/solicitacoes-horario', ({ db, auth, body }) => criado(solicitacaoService.cadastrar(db, auth.idUsuario, body)), [ALUNO]],
  ['GET', '/api/solicitacoes-horario', ({ db, auth }) => ok(solicitacaoService.listar(db, auth.perfil === ALUNO ? auth.idUsuario : null)), [ADMIN, ALUNO]],
  ['PATCH', '/api/solicitacoes-horario/:id/aprovar', ({ db, p }) => ok(solicitacaoService.decidir(db, pathLong(p.id), 'APROVADA')), [ADMIN]],
  ['PATCH', '/api/solicitacoes-horario/:id/recusar', ({ db, p }) => ok(solicitacaoService.decidir(db, pathLong(p.id), 'RECUSADA')), [ADMIN]],
];

// Pré-compila os padrões ("/api/rotas/:id" → regex). Rotas literais têm prioridade.
const TABELA = ROTAS.map(([method, pattern, handler, perfis]) => {
  const nomes = [];
  const re = new RegExp(`^${pattern.replace(/:([a-zA-Z]+)/g, (_, n) => { nomes.push(n); return '([^/]+)'; })}/?$`);
  return { method, pattern, re, nomes, handler, perfis, literais: pattern.split('/').filter((s) => s && !s.startsWith(':')).length };
}).sort((a, b) => b.literais - a.literais);

// GlobalExceptionHandler
const respostaErro = (status, erro, mensagem, caminho) => ({
  status,
  body: { dataHora: agoraDataHora(), status, erro, mensagem, caminho },
});

function tratarErro(e, caminho) {
  if (e instanceof RecursoNaoEncontradoException) return respostaErro(404, 'Recurso não encontrado', e.message, caminho);
  if (e instanceof RegraNegocioException) return respostaErro(400, 'Regra de negócio', e.message, caminho);
  if (e instanceof ValidacaoException) {
    return { status: 400, body: { dataHora: agoraDataHora(), status: 400, erro: 'Dados inválidos', campos: e.campos, caminho } };
  }
  if (e instanceof ConflitoException) return { status: 409, body: { mensagem: e.message } };
  if (e instanceof NaoAutenticadoException) return respostaErro(401, 'Não autenticado', e.message, caminho);
  if (e instanceof AcessoNegadoException) return respostaErro(403, 'Acesso negado', e.message, caminho);
  if (typeof console !== 'undefined') console.error('[buspoint] erro interno', e);
  return respostaErro(500, 'Erro interno', 'Ocorreu um erro inesperado', caminho);
}

/**
 * Cria o roteador da API.
 * @param {import('./database.js').Database} db
 * @param {{ demo?: boolean }} opcoes
 */
export function criarRouter(db, opcoes = {}) {
  return {
    async handle({ method = 'GET', path = '/', body = null, headers = {} }) {
      const [caminho, qs = ''] = String(path).split('?');
      const q = {};
      qs.split('&').filter(Boolean).forEach((kv) => {
        const [k, v = ''] = kv.split('=');
        q[decodeURIComponent(k)] = decodeURIComponent(v.replace(/\+/g, ' '));
      });
      const m = String(method).toUpperCase();
      try {
        let rota = null;
        let params = null;
        let caminhoExiste = false;
        for (const r of TABELA) {
          const match = r.re.exec(caminho);
          if (!match) continue;
          caminhoExiste = true;
          if (r.method !== m) continue;
          rota = r;
          params = {};
          r.nomes.forEach((n, i) => { params[n] = decodeURIComponent(match[i + 1]); });
          break;
        }
        if (!rota) {
          if (caminhoExiste) return respostaErro(405, 'Método não permitido', `O método ${m} não é suportado neste endereço`, caminho);
          return respostaErro(404, 'Recurso não encontrado', 'Endereço não encontrado', caminho);
        }

        const h = Object.fromEntries(Object.entries(headers || {}).map(([k, v]) => [k.toLowerCase(), v]));
        const token = String(h.authorization || '').replace(/^Bearer\s+/i, '') || null;
        let auth = null;
        if (rota.perfis !== PUBLICO) {
          auth = authService.sessao(db, token);
          if (!auth) throw new NaoAutenticadoException();
          if (!rota.perfis.includes(auth.perfil)) throw new AcessoNegadoException();
        }

        const ctx = { db, p: params, q, body, auth, token, opcoes };
        // Escritas rodam em transação (serializadas, com rollback em caso de erro)
        if (m === 'GET') return await rota.handler(ctx);
        return await db.transacao(() => rota.handler(ctx));
      } catch (e) {
        return tratarErro(e, caminho);
      }
    },
  };
}
