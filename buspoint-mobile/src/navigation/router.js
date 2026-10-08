/* Navegação por caminhos — os mesmos endereços do protótipo web (#/admin/alunos, #/motorista/viagem ...).
   Mantém uma pilha de histórico e integra o botão "voltar" do Android. */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, Platform } from 'react-native';

const RouterCtx = createContext(null);
export const useRouter = () => useContext(RouterCtx);

export const h = (...parts) => `/${parts.filter((p) => p !== undefined && p !== null && p !== '').join('/')}`;

export function RouterProvider({ initial = '/acesso/splash', children }) {
  const [stack, setStack] = useState([initial]);
  const stackRef = useRef(stack);
  useEffect(() => { stackRef.current = stack; }, [stack]);

  const navigate = useCallback((path) => setStack((s) => (s[s.length - 1] === path ? [...s] : [...s, path].slice(-50))), []);
  const replace = useCallback((path) => setStack((s) => [...s.slice(0, -1), path]), []);
  const reset = useCallback((path) => setStack([path]), []);
  const back = useCallback(() => {
    if (stackRef.current.length <= 1) return false;
    setStack((s) => s.slice(0, -1));
    return true;
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android') return undefined;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => back());
    return () => sub.remove();
  }, [back]);

  const path = stack[stack.length - 1];
  const value = useMemo(() => ({ path, navigate, replace, reset, back, canGoBack: stack.length > 1 }), [path, navigate, replace, reset, back, stack.length]);
  return <RouterCtx.Provider value={value}>{children}</RouterCtx.Provider>;
}
