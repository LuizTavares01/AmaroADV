/* Autenticação: login, primeiro acesso / recuperação de senha e dados da própria conta. */
import { NaoAutenticadoException, RegraNegocioException } from '../errors.js';
import { validar } from '../validation.js';
import {
  conferirSenha, hashSenha, montar, perfilDe, validarDuplicidade, validarSenhaNova,
} from './usuarios.js';

let gerarBytes = (n) => {
  const out = new Uint8Array(n);
  for (let i = 0; i < n; i += 1) out[i] = Math.floor(Math.random() * 256);
  return out;
};

/** Permite injetar um gerador seguro (expo-crypto no app, node:crypto no servidor). */
export function configurarAleatorio(fn) { gerarBytes = fn; }

const token = () => Array.from(gerarBytes(24), (b) => b.toString(16).padStart(2, '0')).join('');

const TABELA_PERFIL = { ADMINISTRADOR: 'administrador', MOTORISTA: 'motorista', ALUNO: 'aluno' };

export function usuarioLogado(db, idUsuario) {
  const perfil = perfilDe(db, idUsuario);
  if (!perfil) return null;
  return { perfil, usuario: montar(db, TABELA_PERFIL[perfil], idUsuario) };
}

const encontrarPorLogin = (db, login) => {
  const l = String(login || '').trim().toLowerCase();
  return db.tabela('usuario').find((u) => u.loginUsuario.toLowerCase() === l || u.emailUsuario.toLowerCase() === l);
};

const soDigitos = (s) => String(s || '').replace(/\D/g, '');

const regrasSenha = (senha) => {
  validarSenhaNova(senha);
  const s = String(senha);
  if (s.length < 8 || !/[A-Za-z]/.test(s) || !/\d/.test(s)) {
    throw new RegraNegocioException('Use no mínimo 8 caracteres, com letras e números.');
  }
};

const abrirSessao = (db, idUsuario) => {
  const t = token();
  db.data.sessoes[t] = { idUsuario, criadaEm: Date.now() };
  return { token: t, ...usuarioLogado(db, idUsuario) };
};

export const authService = {
  async login(db, body) {
    const dto = validar(body, { login: { notBlank: true }, senha: { notBlank: true, trim: false } });
    const u = encontrarPorLogin(db, dto.login);
    if (!u || !(await conferirSenha(dto.senha, u.senhaUsuario))) throw new NaoAutenticadoException('Login ou senha inválidos.');
    if (!u.statusUsuario) throw new NaoAutenticadoException('Usuário inativo. Procure a administração.');
    return abrirSessao(db, u.idUsuario);
  },

  // Troca rápida de perfil usada no modo demonstração
  entrarComoDemo(db, perfil) {
    const tabela = TABELA_PERFIL[String(perfil || '').toUpperCase()];
    if (!tabela) throw new RegraNegocioException('Perfil inválido.');
    const e = db.tabela(tabela).find((x) => (db.tabela('usuario').find((u) => u.idUsuario === x.idUsuario) || {}).statusUsuario);
    if (!e) throw new RegraNegocioException('Nenhum usuário ativo com este perfil.');
    return abrirSessao(db, e.idUsuario);
  },

  sessao(db, t) {
    const s = t && db.data.sessoes[t];
    if (!s) return null;
    const u = db.tabela('usuario').find((x) => x.idUsuario === s.idUsuario);
    if (!u || !u.statusUsuario) return null;
    return { idUsuario: u.idUsuario, perfil: perfilDe(db, u.idUsuario) };
  },

  logout(db, t) { if (t) delete db.data.sessoes[t]; },

  // Primeiro acesso / recuperação: confirma login (ou e-mail) + telefone cadastrado
  verificarIdentidade(db, body) {
    const dto = validar(body, { login: { notBlank: true }, telefone: { notBlank: true } });
    const u = encontrarPorLogin(db, dto.login);
    if (!u || soDigitos(u.telefoneUsuario) !== soDigitos(dto.telefone)) {
      throw new RegraNegocioException('Não encontramos uma conta com esses dados.');
    }
    if (!u.statusUsuario) throw new RegraNegocioException('Usuário inativo. Procure a administração.');
    const t = token();
    db.data.redefinicoes[t] = { idUsuario: u.idUsuario, expiraEm: Date.now() + 15 * 60 * 1000 };
    return { tokenRedefinicao: t, nomeUsuario: u.nomeUsuario };
  },

  async definirSenha(db, body) {
    const dto = validar(body, { tokenRedefinicao: { notBlank: true }, novaSenha: { notBlank: true, trim: false } });
    const r = db.data.redefinicoes[dto.tokenRedefinicao];
    if (!r || r.expiraEm < Date.now()) throw new RegraNegocioException('A verificação expirou. Confirme seus dados novamente.');
    regrasSenha(dto.novaSenha);
    const u = db.tabela('usuario').find((x) => x.idUsuario === r.idUsuario);
    u.senhaUsuario = await hashSenha(dto.novaSenha);
    delete db.data.redefinicoes[dto.tokenRedefinicao];
    // encerra sessões antigas do usuário
    for (const [k, s] of Object.entries(db.data.sessoes)) if (s.idUsuario === u.idUsuario) delete db.data.sessoes[k];
    return { mensagem: 'Senha definida com sucesso.' };
  },

  me(db, idUsuario) { return usuarioLogado(db, idUsuario); },

  // Edição dos próprios dados de contato (tela Meu perfil)
  atualizarMe(db, idUsuario, body) {
    const dados = validar(body, {
      nomeUsuario: { notBlank: true, max: 50 },
      emailUsuario: { notBlank: true, email: true, max: 100 },
      telefoneUsuario: { notBlank: true, max: 13 },
      loginUsuario: { notBlank: true, max: 40 },
    });
    validarDuplicidade(db, dados, idUsuario);
    Object.assign(db.tabela('usuario').find((u) => u.idUsuario === idUsuario), dados);
    return usuarioLogado(db, idUsuario);
  },

  async alterarSenha(db, idUsuario, body) {
    const dto = validar(body, { senhaAtual: { notBlank: true, trim: false }, novaSenha: { notBlank: true, trim: false } });
    const u = db.tabela('usuario').find((x) => x.idUsuario === idUsuario);
    if (!(await conferirSenha(dto.senhaAtual, u.senhaUsuario))) throw new RegraNegocioException('A senha atual está incorreta.');
    regrasSenha(dto.novaSenha);
    u.senhaUsuario = await hashSenha(dto.novaSenha);
    return { mensagem: 'Senha alterada com sucesso.' };
  },

  alterarFoto(db, idUsuario, body) {
    const foto = body && body.fotoUsuario ? String(body.fotoUsuario) : null;
    if (foto && foto.length > 3 * 1024 * 1024) throw new RegraNegocioException('A foto excede o tamanho máximo de 2 MB.');
    db.tabela('usuario').find((u) => u.idUsuario === idUsuario).fotoUsuario = foto;
    return usuarioLogado(db, idUsuario);
  },
};
