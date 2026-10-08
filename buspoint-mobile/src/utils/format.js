/* Formatação de dados da API para exibição (pt-BR). */
const p = (n) => String(n).padStart(2, '0');

export const DIAS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
export const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

export const hojeISO = (d = new Date()) => `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;

export const isoParaData = (iso) => {
  const [y, m, d] = String(iso).slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
};

// "2026-09-28" → "28/09/2026"
export const dataBR = (iso) => {
  if (!iso) return '—';
  const [y, m, d] = String(iso).slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
};

// "28/09/2026" → "2026-09-28" (para enviar à API)
export const dataISO = (br) => {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(br || '').trim());
  return m ? `${m[3]}-${m[2]}-${m[1]}` : String(br || '').trim();
};

// "SEGUNDA-FEIRA, 28 DE SETEMBRO DE 2026"
export const dataPorExtenso = (d = new Date(), ano = true) => `${DIAS[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()]}${ano ? ` de ${d.getFullYear()}` : ''}`;

export const dataCurta = (d = new Date()) => `${d.getDate()} ${MESES[d.getMonth()].slice(0, 3)}, ${d.getFullYear()}`;

// "06:30:00" → "06:30"
export const hora = (t) => (t ? String(t).slice(0, 5) : '—');

// "2026-09-28T07:12:44" → "07:12"
export const horaDe = (dt) => (dt ? String(dt).slice(11, 16) : '—');

export const saudacao = (d = new Date()) => (d.getHours() < 12 ? 'Bom dia' : d.getHours() < 18 ? 'Boa tarde' : 'Boa noite');

export const periodoDoHorario = (t) => {
  const h = Number(String(t || '0').slice(0, 2));
  return h < 12 ? 'manhã' : h < 18 ? 'tarde' : 'noite';
};

// "11988421550" → "(11) 98842-1550"
export const telefone = (v) => {
  const d = String(v || '').replace(/\D/g, '');
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return v || '—';
};

export const soDigitos = (v) => String(v || '').replace(/\D/g, '');

export const iniciais = (nome) => String(nome || '')
  .split(/\s+/).filter(Boolean)
  .filter((w, i, arr) => i === 0 || i === arr.length - 1)
  .map((w) => w[0]).join('').toUpperCase().slice(0, 2) || 'BP';

export const STATUS_VIAGEM = { PENDENTE: 'Pendente', EM_ANDAMENTO: 'Em andamento', FINALIZADA: 'Finalizada' };

export const codigoViagem = (id) => `VG-${String(id).padStart(4, '0')}`;

export const ativoLabel = (b, fem) => (b ? (fem ? 'Ativa' : 'Ativo') : (fem ? 'Inativa' : 'Inativo'));

// Máscaras de digitação
export const mascaraHora = (v) => {
  const d = soDigitos(v).slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}:${d.slice(2)}` : d;
};

export const mascaraData = (v) => {
  const d = soDigitos(v).slice(0, 8);
  if (d.length > 4) return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
  if (d.length > 2) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return d;
};

export const mascaraTelefone = (v) => {
  const d = soDigitos(v).slice(0, 11);
  if (d.length > 6) return `(${d.slice(0, 2)}) ${d.slice(2, d.length === 11 ? 7 : 6)}-${d.slice(d.length === 11 ? 7 : 6)}`;
  if (d.length > 2) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return d;
};
