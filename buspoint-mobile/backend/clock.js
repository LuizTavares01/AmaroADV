/* Data e hora locais no formato do java.time (LocalDate / LocalTime / LocalDateTime) */
const p = (n) => String(n).padStart(2, '0');

export const hoje = (d = new Date()) => `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;

export const agoraHora = (d = new Date()) => {
  const s = d.getSeconds();
  return s ? `${p(d.getHours())}:${p(d.getMinutes())}:${p(s)}` : `${p(d.getHours())}:${p(d.getMinutes())}`;
};

export const agoraDataHora = (d = new Date()) => `${hoje(d)}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;

export const somarDias = (iso, dias) => {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d + dias);
  return hoje(dt);
};
