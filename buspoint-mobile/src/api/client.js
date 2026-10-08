/* Cliente da API BusPoint.
   - Modo "local" (padrão): o back-end roda dentro do próprio app, com dados salvos no aparelho (AsyncStorage).
   - Modo "servidor": as mesmas chamadas vão por HTTP para o servidor Node (backend/server.js). */
import AsyncStorage from '@react-native-async-storage/async-storage';
import bcrypt from 'bcryptjs';
import { getRandomBytes } from 'expo-crypto';
import { criarBackend, configurarAleatorio } from '../../backend/index.js';

const DB_KEY = 'buspoint-db';
const CONFIG_KEY = 'buspoint-config';
const TOKEN_KEY = 'buspoint-token';

// Gerador seguro para tokens e para o salt do bcrypt
configurarAleatorio((n) => getRandomBytes(n));
bcrypt.setRandomFallback((n) => Array.from(getRandomBytes(n)));

let local = null;
let config = { modo: 'local', url: 'http://localhost:8080' };
let token = null;
const ouvintes = new Set();

export class ApiError extends Error {
  constructor(status, body) {
    const campos = body && body.campos ? Object.entries(body.campos).map(([k, v]) => `${k}: ${v}`).join(' · ') : null;
    super((body && body.mensagem) || campos || (body && body.erro) || `Erro ${status}`);
    this.status = status;
    this.body = body;
    this.campos = (body && body.campos) || null;
  }
}

async function backendLocal() {
  if (!local) {
    local = criarBackend({
      load: () => AsyncStorage.getItem(DB_KEY),
      save: (json) => AsyncStorage.setItem(DB_KEY, json),
    }, { demo: true });
  }
  return local;
}

export async function iniciarCliente() {
  try {
    const c = await AsyncStorage.getItem(CONFIG_KEY);
    if (c) config = { ...config, ...JSON.parse(c) };
    token = await AsyncStorage.getItem(TOKEN_KEY);
  } catch { /* sem armazenamento: segue com o padrão */ }
  if (config.modo === 'local') await backendLocal();
  return { config: { ...config }, token };
}

export const obterConfig = () => ({ ...config });

export async function salvarConfig(nova) {
  config = { ...config, ...nova };
  await AsyncStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  await definirToken(null);
}

export async function definirToken(t) {
  token = t;
  if (t) await AsyncStorage.setItem(TOKEN_KEY, t);
  else await AsyncStorage.removeItem(TOKEN_KEY);
}

/** Notifica telas abertas para recarregarem os dados após uma alteração. */
export const aoAlterar = (fn) => { ouvintes.add(fn); return () => ouvintes.delete(fn); };
const notificar = () => ouvintes.forEach((fn) => fn());

export async function api(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  let res;
  if (config.modo === 'servidor') {
    const base = String(config.url || '').replace(/\/+$/, '');
    let r;
    try {
      r = await fetch(`${base}${path}`, { method, headers, body: body == null ? undefined : JSON.stringify(body) });
    } catch {
      throw new ApiError(0, { mensagem: `Não foi possível conectar ao servidor (${base}).` });
    }
    const txt = await r.text();
    let json = null;
    try { json = txt ? JSON.parse(txt) : null; } catch { json = { mensagem: txt }; }
    res = { status: r.status, body: json };
  } else {
    const { router } = await backendLocal();
    // cópia profunda: a tela nunca altera os dados do banco por referência
    res = await router.handle({ method, path, body: body == null ? null : JSON.parse(JSON.stringify(body)), headers });
    res = { status: res.status, body: res.body == null ? null : JSON.parse(JSON.stringify(res.body)) };
  }
  if (res.status >= 400) throw new ApiError(res.status, res.body);
  if (method !== 'GET') notificar();
  return res.body;
}

export const get = (p) => api('GET', p);
export const post = (p, b) => api('POST', p, b);
export const put = (p, b) => api('PUT', p, b);
export const patch = (p, b) => api('PATCH', p, b);
export const del = (p) => api('DELETE', p);
