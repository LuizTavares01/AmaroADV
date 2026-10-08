/* Ponto de entrada do back-end BusPoint (compartilhado entre app e servidor). */
import { Database } from './database.js';
import { criarRouter } from './router.js';

export { configurarAleatorio } from './services/auth.js';

export async function criarBackend(adapter, opcoes = {}) {
  const db = await new Database(adapter).init();
  return { db, router: criarRouter(db, opcoes) };
}
