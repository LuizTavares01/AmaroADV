/* Usuários: AlunoService, MotoristaService, AdministradorService.
   Herança JOINED: dados comuns em "usuario" + tabela específica de cada perfil. */
import bcrypt from 'bcryptjs';
import { RecursoNaoEncontradoException, RegraNegocioException } from '../errors.js';
import { validar } from '../validation.js';

const ROUNDS = 8;

const REGRAS_USUARIO = {
  nomeUsuario: { notBlank: true, max: 50 },
  emailUsuario: { notBlank: true, email: true, max: 100 },
  telefoneUsuario: { notBlank: true, max: 13 },
  loginUsuario: { notBlank: true, max: 40 },
};

export const PERFIS = {
  aluno: {
    tabela: 'aluno',
    regras: { numeroMatricula: { notNull: true, type: 'integer' }, periodo: { notBlank: true, max: 50 } },
    campos: ['numeroMatricula', 'periodo'],
    identificador: { campo: 'numeroMatricula', erro: 'NumeroMatricula ja cadastrado' },
    aoCadastrar: (e) => { e.statusMatricula = true; },
  },
  motorista: {
    tabela: 'motorista',
    regras: { numeroCnh: { notBlank: true, max: 20 }, categoriaCnh: { notBlank: true, max: 10 }, validadeCnh: { notNull: true, type: 'date' } },
    campos: ['numeroCnh', 'categoriaCnh', 'validadeCnh'],
    identificador: { campo: 'numeroCnh', erro: 'NumeroCnh ja cadastrado' },
  },
  administrador: { tabela: 'administrador', regras: {}, campos: [] },
};

const bytesUtf8 = (s) => {
  let n = 0;
  for (const ch of s) {
    const c = ch.codePointAt(0);
    n += c < 0x80 ? 1 : c < 0x800 ? 2 : c < 0x10000 ? 3 : 4;
  }
  return n;
};

export const hashSenha = (senha) => bcrypt.hash(senha, ROUNDS);
export const conferirSenha = (senha, hash) => bcrypt.compare(String(senha || ''), hash || '');

export function validarSenhaNova(senha) {
  if (senha === undefined || senha === null || String(senha).trim() === '') throw new RegraNegocioException('Informe a senha');
  // O limite do BCrypt é medido em bytes, não em caracteres.
  if (bytesUtf8(String(senha)) > 72) throw new RegraNegocioException('A senha excede 72 bytes');
}

// Junta usuario + tabela específica e remove a senha (JsonProperty WRITE_ONLY)
export function montar(db, perfil, idUsuario) {
  const u = db.tabela('usuario').find((x) => x.idUsuario === idUsuario);
  const e = db.tabela(PERFIS[perfil].tabela).find((x) => x.idUsuario === idUsuario);
  if (!u || !e) return null;
  const { senhaUsuario, ...pub } = u;
  void senhaUsuario;
  return { ...pub, ...e };
}

export function perfilDe(db, idUsuario) {
  if (db.tabela('administrador').some((x) => x.idUsuario === idUsuario)) return 'ADMINISTRADOR';
  if (db.tabela('motorista').some((x) => x.idUsuario === idUsuario)) return 'MOTORISTA';
  if (db.tabela('aluno').some((x) => x.idUsuario === idUsuario)) return 'ALUNO';
  return null;
}

export function validarDuplicidade(db, dados, id) {
  const outros = db.tabela('usuario').filter((u) => id == null || u.idUsuario !== id);
  const emailEmUso = outros.some((u) => u.emailUsuario.toLowerCase() === String(dados.emailUsuario).toLowerCase());
  const loginEmUso = outros.some((u) => u.loginUsuario.toLowerCase() === String(dados.loginUsuario).toLowerCase());
  if (emailEmUso || loginEmUso) throw new RegraNegocioException('Email ou login ja cadastrado');
}

export function criarServicoUsuario(perfil) {
  const cfg = PERFIS[perfil];

  const buscarPorId = (db, id) => {
    const r = montar(db, perfil, id);
    if (!r) throw new RecursoNaoEncontradoException('Usuario nao encontrado');
    return r;
  };

  const validarIdentificador = (db, dados, id) => {
    if (!cfg.identificador) return;
    const { campo, erro } = cfg.identificador;
    const emUso = db.tabela(cfg.tabela).some((x) => (id == null || x.idUsuario !== id) && String(x[campo]) === String(dados[campo]));
    if (emUso) throw new RegraNegocioException(erro);
  };

  return {
    buscarTodos: (db) => db.tabela(cfg.tabela).map((e) => montar(db, perfil, e.idUsuario)).filter(Boolean),

    buscarPorId,

    async cadastrar(db, body) {
      const dados = validar(body, { ...REGRAS_USUARIO, ...cfg.regras });
      validarDuplicidade(db, dados, null);
      validarIdentificador(db, dados, null);
      const senha = body && body.senhaUsuario;
      validarSenhaNova(senha);
      const idUsuario = db.proximoId('usuario');
      db.tabela('usuario').push({
        idUsuario,
        nomeUsuario: dados.nomeUsuario,
        emailUsuario: dados.emailUsuario,
        telefoneUsuario: dados.telefoneUsuario,
        loginUsuario: dados.loginUsuario,
        senhaUsuario: await hashSenha(String(senha)),
        statusUsuario: true,
        fotoUsuario: null,
      });
      const especifico = { idUsuario };
      cfg.campos.forEach((c) => { especifico[c] = dados[c]; });
      if (cfg.aoCadastrar) cfg.aoCadastrar(especifico);
      db.tabela(cfg.tabela).push(especifico);
      return buscarPorId(db, idUsuario);
    },

    atualizar(db, id, body) {
      buscarPorId(db, id);
      if (body && body.senhaUsuario !== undefined && body.senhaUsuario !== null) {
        throw new RegraNegocioException('A edicao cadastral nao altera senhas. Omita senhaUsuario');
      }
      const dados = validar(body, { ...REGRAS_USUARIO, ...cfg.regras });
      validarDuplicidade(db, dados, id);
      validarIdentificador(db, dados, id);
      // Alteramos somente os campos cadastrais permitidos.
      const u = db.tabela('usuario').find((x) => x.idUsuario === id);
      Object.assign(u, {
        nomeUsuario: dados.nomeUsuario,
        emailUsuario: dados.emailUsuario,
        telefoneUsuario: dados.telefoneUsuario,
        loginUsuario: dados.loginUsuario,
      });
      const e = db.tabela(cfg.tabela).find((x) => x.idUsuario === id);
      cfg.campos.forEach((c) => { e[c] = dados[c]; });
      return buscarPorId(db, id);
    },

    desativar(db, id) {
      buscarPorId(db, id);
      db.tabela('usuario').find((x) => x.idUsuario === id).statusUsuario = false;
    },

    // extensão: reverte a inativação
    ativar(db, id) {
      buscarPorId(db, id);
      db.tabela('usuario').find((x) => x.idUsuario === id).statusUsuario = true;
    },
  };
}

export const alunoService = criarServicoUsuario('aluno');
export const motoristaService = criarServicoUsuario('motorista');
export const administradorService = criarServicoUsuario('administrador');
