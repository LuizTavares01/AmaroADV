/* Servidor HTTP da API BusPoint (Node.js, sem dependências além do bcryptjs).
   Uso: node backend/server.js   (variáveis: PORT, BUSPOINT_DB, BUSPOINT_DEMO=1) */
import http from 'node:http';
import { Buffer } from 'node:buffer';
import { randomBytes } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { criarBackend, configurarAleatorio } from './index.js';

const dir = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 8080);
const ARQUIVO = process.env.BUSPOINT_DB || path.join(dir, 'data', 'buspoint-db.json');
const DEMO = ['1', 'true', 'sim'].includes(String(process.env.BUSPOINT_DEMO || '').toLowerCase());

configurarAleatorio((n) => new Uint8Array(randomBytes(n)));

const adapter = {
  async load() {
    try { return await fs.readFile(ARQUIVO, 'utf8'); } catch { return null; }
  },
  async save(json) {
    await fs.mkdir(path.dirname(ARQUIVO), { recursive: true });
    const tmp = `${ARQUIVO}.tmp`;
    await fs.writeFile(tmp, json);
    await fs.rename(tmp, ARQUIVO);
  },
};

const { router } = await criarBackend(adapter, { demo: DEMO });

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const lerCorpo = (req) => new Promise((resolve, reject) => {
  const partes = [];
  let total = 0;
  req.on('data', (c) => {
    total += c.length;
    if (total > 5 * 1024 * 1024) { reject(new Error('corpo muito grande')); req.destroy(); return; }
    partes.push(c);
  });
  req.on('end', () => resolve(Buffer.concat(partes).toString('utf8')));
  req.on('error', reject);
});

const enviar = (res, status, body) => {
  if (status === 204 || body === null || body === undefined) {
    res.writeHead(status, CORS);
    res.end();
    return;
  }
  res.writeHead(status, { ...CORS, 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
};

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') { res.writeHead(204, CORS); res.end(); return; }
  let body = null;
  try {
    const raw = await lerCorpo(req);
    if (raw) body = JSON.parse(raw);
  } catch {
    enviar(res, 400, { status: 400, erro: 'Dados inválidos', mensagem: 'JSON malformado', caminho: req.url });
    return;
  }
  const r = await router.handle({ method: req.method, path: req.url, body, headers: req.headers });
  enviar(res, r.status, r.body);
  console.log(`${req.method} ${req.url} → ${r.status}`);
});

server.listen(PORT, () => {
  console.log(`BusPoint API em http://localhost:${PORT}/api  (banco: ${ARQUIVO}${DEMO ? ', modo demonstração' : ''})`);
});
