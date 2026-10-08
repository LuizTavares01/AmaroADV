/* Carrega dados da API e recarrega automaticamente quando algo é alterado. */
import { useCallback, useEffect, useRef, useState } from 'react';
import { aoAlterar } from '../api/client';

export function useQuery(fn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const ref = useRef(fn);
  ref.current = fn;
  const vivo = useRef(true);

  const load = useCallback(async (silencioso) => {
    if (!silencioso) setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await ref.current();
      if (vivo.current) setState({ data, loading: false, error: null });
    } catch (e) {
      if (vivo.current) setState((s) => ({ data: s.data, loading: false, error: e.message || 'Erro ao carregar dados.' }));
    }
  }, []);

  useEffect(() => {
    vivo.current = true;
    load(false);
    const off = aoAlterar(() => load(true));
    return () => { vivo.current = false; off(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { ...state, reload: () => load(false) };
}
