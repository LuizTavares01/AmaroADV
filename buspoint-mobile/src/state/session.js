/* Sessão do usuário logado (substitui o "perfil simulado" do protótipo). */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { definirToken, get, iniciarCliente, obterConfig, post, salvarConfig } from '../api/client';

export const ROLE_INFO = {
  admin: { label: 'Administrador', home: '/admin/dashboard', icon: 'shield-check', perfil: 'ADMINISTRADOR' },
  motorista: { label: 'Motorista', home: '/motorista/inicio', icon: 'bus', perfil: 'MOTORISTA' },
  aluno: { label: 'Aluno', home: '/aluno/inicio', icon: 'graduation-cap', perfil: 'ALUNO' },
};

const roleDoPerfil = (perfil) => ({ ADMINISTRADOR: 'admin', MOTORISTA: 'motorista', ALUNO: 'aluno' }[perfil] || null);

const SessionCtx = createContext(null);
export const useSession = () => useContext(SessionCtx);

export function SessionProvider({ children }) {
  const [state, setState] = useState({ pronto: false, usuario: null, role: null, config: obterConfig() });

  const aplicar = useCallback((r) => {
    setState((s) => ({ ...s, pronto: true, usuario: r ? r.usuario : null, role: r ? roleDoPerfil(r.perfil) : null }));
  }, []);

  useEffect(() => {
    (async () => {
      const { config, token } = await iniciarCliente();
      setState((s) => ({ ...s, config }));
      if (!token) { aplicar(null); return; }
      try { aplicar(await get('/api/auth/me')); } catch { await definirToken(null); aplicar(null); }
    })();
  }, [aplicar]);

  const entrar = useCallback(async (r) => {
    await definirToken(r.token);
    aplicar(r);
    return roleDoPerfil(r.perfil);
  }, [aplicar]);

  const value = useMemo(() => ({
    ...state,
    async login(login, senha) { return entrar(await post('/api/auth/login', { login, senha })); },
    async entrarComo(role) { return entrar(await post(`/api/auth/demo/${ROLE_INFO[role].perfil.toLowerCase()}`)); },
    async logout() {
      try { await post('/api/auth/logout'); } catch { /* sessão já expirada */ }
      await definirToken(null);
      aplicar(null);
    },
    async atualizar() { aplicar(await get('/api/auth/me')); },
    async restaurarDemo() {
      await post('/api/dev/restaurar');
      await definirToken(null);
      aplicar(null);
    },
    async configurar(cfg) {
      await salvarConfig(cfg);
      await iniciarCliente();
      setState((s) => ({ ...s, config: obterConfig(), usuario: null, role: null }));
    },
  }), [state, entrar, aplicar]);

  return <SessionCtx.Provider value={value}>{children}</SessionCtx.Provider>;
}
