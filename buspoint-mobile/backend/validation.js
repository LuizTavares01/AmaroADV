/* Validação de dados — equivalente às anotações jakarta.validation
   (@NotBlank, @NotNull, @Size, @Email, @Min) usadas nas entidades e DTOs. */
import { ValidacaoException } from './errors.js';

const MSG = {
  notBlank: 'não deve estar em branco',
  notNull: 'não deve ser nulo',
  email: 'deve ser um endereço de e-mail bem formado',
  size: (max) => `o tamanho deve ser entre 0 e ${max}`,
  min: (v) => `deve ser maior que ou igual à ${v}`,
  time: 'deve ser um horário válido (HH:mm)',
  date: 'deve ser uma data válida (aaaa-mm-dd)',
  integer: 'deve ser um número inteiro',
  number: 'deve ser um número',
};

export const isBlank = (v) => v === undefined || v === null || String(v).trim() === '';

// Converte "6:30", "06:30" ou "06:30:15" para o formato de LocalTime.toString()
export function parseTime(v) {
  if (v === undefined || v === null || v === '') return null;
  const m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(String(v).trim());
  if (!m) return undefined;
  const [h, mi, s] = [Number(m[1]), Number(m[2]), m[3] === undefined ? 0 : Number(m[3])];
  if (h > 23 || mi > 59 || s > 59) return undefined;
  const p = (n) => String(n).padStart(2, '0');
  return s ? `${p(h)}:${p(mi)}:${p(s)}` : `${p(h)}:${p(mi)}`;
}

// Aceita "aaaa-mm-dd" (LocalDate) e também "dd/mm/aaaa"
export function parseDate(v) {
  if (v === undefined || v === null || v === '') return null;
  const s = String(v).trim();
  let y; let mo; let d;
  let m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (m) [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  else {
    m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s);
    if (!m) return undefined;
    [d, mo, y] = [Number(m[1]), Number(m[2]), Number(m[3])];
  }
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return undefined;
  return `${String(y).padStart(4, '0')}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export const timeToMinutes = (t) => {
  const [h, m, s] = String(t).split(':').map(Number);
  return h * 60 + m + (s || 0) / 60;
};

/**
 * Valida um objeto contra um esquema simples.
 * regras: { campo: { notBlank, notNull, max, email, min, type: 'time'|'date'|'integer'|'number', message } }
 * Retorna uma cópia normalizada (horários e datas no formato da API).
 */
export function validar(dados, regras) {
  const body = dados && typeof dados === 'object' ? dados : {};
  const campos = {};
  const out = {};
  for (const [campo, r] of Object.entries(regras)) {
    let v = body[campo];
    if (typeof v === 'string' && r.type !== 'raw') v = r.trim === false ? v : v.trim();
    if (r.notBlank && isBlank(v)) { campos[campo] = r.message || MSG.notBlank; continue; }
    if (r.notNull && (v === undefined || v === null || v === '')) { campos[campo] = r.message || MSG.notNull; continue; }
    if (v === undefined || v === null || v === '') { out[campo] = null; continue; }
    if (r.type === 'time') {
      const t = parseTime(v);
      if (t === undefined) { campos[campo] = MSG.time; continue; }
      v = t;
    } else if (r.type === 'date') {
      const d = parseDate(v);
      if (d === undefined) { campos[campo] = MSG.date; continue; }
      v = d;
    } else if (r.type === 'integer') {
      const n = Number(v);
      if (!Number.isInteger(n) || n > 2147483647 || n < -2147483648) { campos[campo] = MSG.integer; continue; }
      v = n;
    } else if (r.type === 'long') {
      const n = Number(v);
      if (!Number.isSafeInteger(n)) { campos[campo] = MSG.integer; continue; }
      v = n;
    } else if (r.type === 'number') {
      const n = Number(v);
      if (!Number.isFinite(n)) { campos[campo] = MSG.number; continue; }
      v = n;
    } else if (r.type === 'enum') {
      if (!r.values.includes(String(v))) { campos[campo] = `deve ser um dos valores: ${r.values.join(', ')}`; continue; }
      v = String(v);
    } else if (r.type === 'boolean') {
      v = v === true || v === 'true';
    } else if (typeof v !== 'string') {
      v = String(v);
    }
    if (r.max !== undefined && typeof v === 'string' && v.length > r.max) { campos[campo] = r.sizeMessage || MSG.size(r.max); continue; }
    if (r.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { campos[campo] = MSG.email; continue; }
    if (r.min !== undefined && typeof v === 'number' && v < r.min) { campos[campo] = r.minMessage || MSG.min(r.min); continue; }
    out[campo] = v;
  }
  if (Object.keys(campos).length) throw new ValidacaoException(campos);
  return out;
}

// Converte um parâmetro de caminho (@PathVariable Long)
export function pathLong(v, nome = 'id') {
  const n = Number(v);
  if (!Number.isSafeInteger(n)) throw new ValidacaoException({ [nome]: MSG.integer });
  return n;
}
