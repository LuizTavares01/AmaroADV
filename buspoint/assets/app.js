/* =========================================================
   BusPoint — lógica da interface em JavaScript puro.
   Rotas por hash (#/admin/alunos, #/motorista/viagem ...),
   funciona abrindo o index.html direto no navegador.
   ========================================================= */
(function () {
  'use strict';

  /* ---------------- Dados de demonstração ---------------- */
  const students = [
    { id: 'AL-001', name: 'João Silva', enrollment: '202600184', period: 'Manhã', route: 'Rota ETEC', stop: 'Rua das Flores', status: 'Ativo', email: 'joao.silva@aluno.edu.br', phone: '(11) 98842-1550', initials: 'JS' },
    { id: 'AL-002', name: 'Maria Souza', enrollment: '202600217', period: 'Manhã', route: 'Rota ETEC', stop: 'Av. Brasil', status: 'Ativo', email: 'maria.souza@aluno.edu.br', phone: '(11) 98512-8024', initials: 'MS' },
    { id: 'AL-003', name: 'Ana Beatriz Costa', enrollment: '202600328', period: 'Manhã', route: 'Rota ETEC', stop: 'Praça Central', status: 'Ativo', email: 'ana.costa@aluno.edu.br', phone: '(11) 98045-4368', initials: 'AC' },
    { id: 'AL-004', name: 'Pedro Henrique Lima', enrollment: '202600419', period: 'Tarde', route: 'Rota Centro', stop: 'Rua Aurora', status: 'Ativo', email: 'pedro.lima@aluno.edu.br', phone: '(11) 98271-6029', initials: 'PL' },
    { id: 'AL-005', name: 'Luiza Oliveira', enrollment: '202600526', period: 'Manhã', route: 'Rota ETEC', stop: 'Rua das Flores', status: 'Ativo', email: 'luiza.oliveira@aluno.edu.br', phone: '(11) 98412-7310', initials: 'LO' },
    { id: 'AL-006', name: 'Gabriel Santos', enrollment: '202600633', period: 'Tarde', route: 'Rota Norte', stop: 'Av. Independência', status: 'Inativo', email: 'gabriel.santos@aluno.edu.br', phone: '(11) 98993-1020', initials: 'GS' },
  ];
  const drivers = [
    { id: 'MO-001', name: 'Carlos Mendes', license: '04821756390', category: 'D', validity: '18/08/2028', status: 'Ativo', route: 'Rota ETEC', email: 'carlos.mendes@buspoint.com.br', phone: '(11) 98743-2201', initials: 'CM' },
    { id: 'MO-002', name: 'Roberto Almeida', license: '05731482601', category: 'D', validity: '23/04/2029', status: 'Ativo', route: 'Rota Centro', email: 'roberto.almeida@buspoint.com.br', phone: '(11) 98114-5700', initials: 'RA' },
    { id: 'MO-003', name: 'Fernanda Ribeiro', license: '06628451377', category: 'D', validity: '09/11/2027', status: 'Ativo', route: 'Rota Norte', email: 'fernanda.ribeiro@buspoint.com.br', phone: '(11) 99481-6072', initials: 'FR' },
  ];
  const buses = [
    { id: 'ON-001', plate: 'ABC-1234', capacity: 42, status: 'Ativo', driver: 'Carlos Mendes', route: 'Rota ETEC' },
    { id: 'ON-002', plate: 'DEF-5678', capacity: 38, status: 'Ativo', driver: 'Roberto Almeida', route: 'Rota Centro' },
    { id: 'ON-003', plate: 'GHI-9012', capacity: 44, status: 'Ativo', driver: 'Fernanda Ribeiro', route: 'Rota Norte' },
    { id: 'ON-004', plate: 'JKL-3456', capacity: 40, status: 'Manutenção', driver: '—', route: '—' },
  ];
  const routes = [
    { id: 'RO-001', name: 'Rota ETEC', type: 'Ida e volta', start: '06:30', end: '12:10', status: 'Ativa', driver: 'Carlos Mendes', bus: 'ABC-1234', students: 4, stops: ['Garagem Municipal', 'Rua das Flores', 'Av. Brasil', 'Praça Central', 'ETEC Central'] },
    { id: 'RO-002', name: 'Rota Centro', type: 'Ida e volta', start: '12:30', end: '18:20', status: 'Ativa', driver: 'Roberto Almeida', bus: 'DEF-5678', students: 1, stops: ['Garagem Municipal', 'Rua Aurora', 'Centro Educacional'] },
    { id: 'RO-003', name: 'Rota Norte', type: 'Ida e volta', start: '06:45', end: '12:15', status: 'Ativa', driver: 'Fernanda Ribeiro', bus: 'GHI-9012', students: 1, stops: ['Garagem Municipal', 'Av. Independência', 'Escola Norte'] },
  ];
  const trips = [
    { id: 'VG-0821', date: '28/09/2026', route: 'Rota ETEC', driver: 'Carlos Mendes', bus: 'ABC-1234', start: '06:30', end: '—', status: 'Em andamento' },
    { id: 'VG-0822', date: '28/09/2026', route: 'Rota Norte', driver: 'Fernanda Ribeiro', bus: 'GHI-9012', start: '06:45', end: '12:15', status: 'Finalizada' },
    { id: 'VG-0823', date: '28/09/2026', route: 'Rota Centro', driver: 'Roberto Almeida', bus: 'DEF-5678', start: '12:30', end: '18:20', status: 'Pendente' },
    { id: 'VG-0818', date: '25/09/2026', route: 'Rota ETEC', driver: 'Carlos Mendes', bus: 'ABC-1234', start: '06:30', end: '12:12', status: 'Finalizada' },
    { id: 'VG-0814', date: '24/09/2026', route: 'Rota ETEC', driver: 'Carlos Mendes', bus: 'ABC-1234', start: '06:31', end: '12:08', status: 'Finalizada' },
  ];
  const events = [
    { name: 'João Silva', action: 'Embarque', time: '07:12', stop: 'Rua das Flores', initials: 'JS' },
    { name: 'Maria Souza', action: 'Embarque', time: '07:08', stop: 'Av. Brasil', initials: 'MS' },
    { name: 'Ana Beatriz Costa', action: 'Desembarque', time: '07:02', stop: 'Praça Central', initials: 'AC' },
    { name: 'Luiza Oliveira', action: 'Embarque', time: '06:54', stop: 'Rua das Flores', initials: 'LO' },
  ];

  /* ---------------- Helpers ---------------- */
  const ICONS = window.BP_ICONS || {};
  const I = (name, cls) => `<svg class="icon${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const h = (...parts) => '#/' + parts.filter(Boolean).join('/');
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  const brand = (light) => `<div class="brand${light ? ' brand--light' : ''}"><div class="brand__logo">${I('bus-front')}</div><span class="brand__name">Bus<span>Point</span></span></div>`;
  const badge = (value) => {
    const tone = /Ativ|andamento|Embarcado|Aprovad|Concluíd/.test(value) ? ' badge--green'
      : /Pendente|Aguardando|Manutenção/.test(value) ? ' badge--yellow'
      : /Inativ|Cancelad|Erro/.test(value) ? ' badge--red' : '';
    return `<span class="badge${tone}">${esc(value)}</span>`;
  };
  const avatar = (initials, lg) => `<span class="avatar${lg ? ' avatar--lg' : ''}">${esc(initials)}</span>`;
  const headline = ({ eyebrow, title, description, action }) =>
    `<div class="headline"><div>${eyebrow ? `<p class="kicker">${esc(eyebrow)}</p>` : ''}<h1>${esc(title)}</h1>${description ? `<p class="desc">${esc(description)}</p>` : ''}</div>${action || ''}</div>`;
  const section = (title, body, aside) =>
    `<section class="card section"><div class="section__head"><h2 class="section-title">${esc(title)}</h2>${aside || ''}</div>${body}</section>`;
  const empty = (text) => `<div class="empty">${I('search')}<p>${esc(text || 'Nenhum resultado encontrado.')}</p></div>`;
  const field = (label, value = '', type = 'text', options, name) => {
    const n = name ? ` name="${name}"` : '';
    const control = options
      ? `<select class="input"${n}>${options.map((o) => `<option${o === (value || options[0]) ? ' selected' : ''}>${esc(o)}</option>`).join('')}</select>`
      : `<input class="input" required type="${type}" value="${esc(value)}"${n} placeholder="Digite ${esc(label.toLowerCase())}">`;
    return `<label class="field"><span class="label">${esc(label)}</span>${control}</label>`;
  };

  /* ---------------- Perfil simulado ---------------- */
  const ROLE_KEY = 'buspoint-role';
  const roleInfo = {
    admin: { label: 'Administrador', person: 'Gestão BusPoint', home: '#/admin/dashboard', icon: 'shield-check' },
    motorista: { label: 'Motorista', person: 'Carlos Mendes', home: '#/motorista/inicio', icon: 'bus' },
    aluno: { label: 'Aluno', person: 'João Silva', home: '#/aluno/inicio', icon: 'graduation-cap' },
  };
  let memoryRole = 'admin';
  function getRole() {
    try { const v = localStorage.getItem(ROLE_KEY); if (v === 'motorista' || v === 'aluno' || v === 'admin') return v; } catch (e) { /* sem storage */ }
    return memoryRole;
  }
  function setRole(r) { memoryRole = r; try { localStorage.setItem(ROLE_KEY, r); } catch (e) { /* sem storage */ } }
  function navigate(hash) { if (location.hash === hash) render(); else location.hash = hash; }

  function guard(allow, html) {
    const role = getRole();
    if (role === allow) return html;
    return `<div class="system"><main>
      <div class="lock-circle">${I('lock')}</div>
      <span class="code" style="margin-top:20px;font-size:60px">403</span>
      <h1>Acesso não autorizado</h1>
      <p>Esta área é exclusiva do perfil <b>${roleInfo[allow].label}</b>. Você está conectado como <b>${roleInfo[role].label}</b>.</p>
      <a class="btn btn--tall" style="margin-top:28px" href="${roleInfo[role].home}">Ir para minha área</a>
    </main></div>`;
  }

  /* ---------------- Toast global ---------------- */
  let toastTimer;
  function toast(text, mobile) {
    const el = document.getElementById('bp-toast');
    el.innerHTML = `<div role="status" class="toast${mobile ? ' toast--mobile' : ''}" data-act="toast-close">${mobile ? '' : I('circle-check')}${esc(text)}</div>`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.innerHTML = ''; }, 4000);
  }

  /* =========================================================
     ADMINISTRADOR
     ========================================================= */
  const adminNav = [['Visão geral', 'dashboard', 'layout-dashboard'], ['Alunos', 'alunos', 'graduation-cap'], ['Motoristas', 'motoristas', 'users'], ['Ônibus', 'onibus', 'bus-front'], ['Rotas', 'rotas', 'route'], ['Viagens', 'viagens', 'calendar-days'], ['Embarques', 'embarques', 'arrow-up-right'], ['Desembarques', 'desembarques', 'arrow-down-right'], ['Histórico', 'historico', 'file-clock']];
  const names = { dashboard: 'Visão geral', alunos: 'Alunos', motoristas: 'Motoristas', onibus: 'Ônibus', rotas: 'Rotas', viagens: 'Viagens', embarques: 'Embarques', desembarques: 'Desembarques', historico: 'Histórico de viagens' };
  const labels = { alunos: 'aluno', motoristas: 'motorista', onibus: 'ônibus', rotas: 'rota', viagens: 'viagem' };
  const datasets = { alunos: students, motoristas: drivers, onibus: buses, rotas: routes, viagens: trips };
  const columns = {
    alunos: [['Aluno', 'name'], ['Matrícula', 'enrollment'], ['Período', 'period'], ['Rota', 'route'], ['Status', 'status']],
    motoristas: [['Motorista', 'name'], ['CNH', 'license'], ['Categoria', 'category'], ['Validade', 'validity'], ['Rota atual', 'route'], ['Status', 'status']],
    onibus: [['Placa', 'plate'], ['Capacidade', 'capacity'], ['Motorista atual', 'driver'], ['Rota atual', 'route'], ['Status', 'status']],
    rotas: [['Rota', 'name'], ['Tipo', 'type'], ['Horário inicial', 'start'], ['Horário final', 'end'], ['Motorista', 'driver'], ['Ônibus', 'bus'], ['Alunos', 'students'], ['Status', 'status']],
    viagens: [['Viagem', 'id'], ['Data', 'date'], ['Rota', 'route'], ['Motorista', 'driver'], ['Ônibus', 'bus'], ['Início', 'start'], ['Fim', 'end'], ['Status', 'status']],
  };
  const formFields = {
    alunos: [['Nome', 'name'], ['E-mail', 'email', 'email'], ['Telefone', 'phone', 'tel'], ['Login', 'email', 'text', null, 'login'], ['Número da matrícula', 'enrollment'], ['Período', 'period', 'text', ['Manhã', 'Tarde', 'Noite']], ['Status', 'status', 'text', ['Ativo', 'Inativo']]],
    motoristas: [['Nome', 'name'], ['E-mail', 'email', 'email'], ['Telefone', 'phone', 'tel'], ['Login', 'email', 'text', null, 'login'], ['Número da CNH', 'license'], ['Categoria da CNH', 'category', 'text', ['D', 'E']], ['Validade da CNH', 'validity'], ['Status', 'status', 'text', ['Ativo', 'Inativo']]],
    onibus: [['Placa', 'plate'], ['Capacidade', 'capacity', 'number'], ['Status', 'status', 'text', ['Ativo', 'Manutenção', 'Inativo']]],
    rotas: [['Nome da rota', 'name'], ['Tipo', 'type', 'text', ['Ida e volta', 'Ida', 'Volta']], ['Horário de início', 'start', 'time'], ['Horário de fim', 'end', 'time'], ['Status', 'status', 'text', ['Ativa', 'Inativa']]],
  };

  const A = {
    menu: false, query: '', filter: 'Todos', modal: null, lastSection: '',
    disabled: [], stops: ['Garagem Municipal', 'Rua das Flores', 'Av. Brasil', 'Praça Central', 'ETEC Central'],
    linked: ['João Silva', 'Maria Souza', 'Ana Beatriz Costa', 'Luiza Oliveira'],
    list: null, // { source, type, tableSection, section }
  };

  function adminListBody() {
    const { source, type, tableSection, section: sec } = A.list;
    const q = A.query.toLowerCase();
    const filtered = source.filter((r) => JSON.stringify(r).toLowerCase().includes(q) && (A.filter === 'Todos' || r.status === A.filter));
    const cols = columns[tableSection] || [];
    const editable = tableSection !== 'viagens';
    const table = filtered.length ? `<table class="table"><thead><tr>${cols.map(([n]) => `<th>${n}</th>`).join('')}<th>Ações</th></tr></thead><tbody>${filtered.map((r) => {
      const title = esc(r.name || r.plate || r.id);
      const cells = cols.map(([label, key]) => {
        if (key === 'name') return `<td><div class="cell-person">${avatar(String(r.initials || String(r.name).slice(0, 2)).toUpperCase())}<span class="semibold">${esc(r[key] || '—')}</span></div></td>`;
        if (key === 'status') return `<td>${badge(A.disabled.includes(String(r.id)) ? 'Inativo' : String(r[key] || 'Ativo'))}</td>`;
        if (key === 'capacity') return `<td>${esc(r[key])} lugares</td>`;
        return `<td><span class="${label === 'Rota' || key === 'id' ? 'semibold' : 'muted'}">${esc(r[key] ?? '—')}</span></td>`;
      }).join('');
      const actions = `<a class="btn btn--ghost btn--icon" title="Visualizar" aria-label="Ver detalhes de ${title}" href="${h('admin', tableSection, 'detalhes', r.id)}">${I('eye')}</a>`
        + (editable ? `<a class="btn btn--ghost btn--icon" title="Editar" aria-label="Editar ${title}" href="${h('admin', sec, 'editar', r.id)}">${I('square-pen')}</a><button class="btn btn--ghost btn--icon" title="Inativar" aria-label="Inativar ${title}" data-act="inactivate" data-id="${esc(r.id)}">${I('ellipsis')}</button>` : '');
      return `<tr>${cells}<td><div class="row-actions">${actions}</div></td></tr>`;
    }).join('')}</tbody></table>` : empty(`Nenhum ${type} encontrado.`);
    return `<div class="table-scroll">${table}</div><div class="table-foot"><span>Mostrando ${filtered.length} de ${source.length} registros</span><span>Página 1 de 1</span></div>`;
  }

  function adminList(type, source, sec) {
    A.list = { source, type, tableSection: sec === 'historico' ? 'viagens' : sec, section: sec };
    const opts = ['Todos', 'Ativo', 'Inativo', 'Ativa', 'Em andamento', 'Pendente', 'Finalizada', 'Manutenção'];
    return `<div class="toolbar">
      <label class="input-wrap search">${I('search')}<input class="input" data-input="query" aria-label="Pesquisar" placeholder="Buscar ${esc(type)}..." value="${esc(A.query)}"></label>
      <label class="input-wrap">${I('filter')}<select class="input" data-input="filter" aria-label="Filtrar status">${opts.map((o) => `<option${o === A.filter ? ' selected' : ''}>${o}</option>`).join('')}</select></label>
    </div><div id="bp-list">${adminListBody()}</div>`;
  }

  function adminDashboard() {
    const stats = [['Alunos ativos', '248', 'graduation-cap', '+12 este mês'], ['Motoristas ativos', '18', 'users', 'Equipe completa'], ['Ônibus ativos', '16', 'bus-front', '2 em manutenção'], ['Rotas ativas', '24', 'route', 'Em operação'], ['Viagens em andamento', '05', 'activity', 'Agora mesmo']];
    return headline({ eyebrow: 'SEGUNDA-FEIRA, 28 DE SETEMBRO DE 2026', title: 'Bom dia, Administrador', description: 'Acompanhe a operação do transporte escolar em tempo real.', action: `<span class="date-pill">${I('calendar-days')} 28 set, 2026</span>` })
      + `<div class="stats">${stats.map(([l, n, ic, sub]) => `<div class="card card--pad"><div class="stat-card__top"><span class="stat-card__label">${l}</span><span class="icon-tile icon-tile--sm">${I(ic)}</span></div><div class="stat">${n}</div><p class="stat-card__sub">${sub}</p></div>`).join('')}</div>`
      + `<div class="layout-a mt-6">`
      + section('Viagens de hoje', `<div class="table-scroll"><table class="table"><thead><tr><th>Rota / viagem</th><th>Motorista</th><th>Horário</th><th>Status</th></tr></thead><tbody>${trips.slice(0, 3).map((t) => `<tr class="clickable" data-href="${h('admin', 'viagens', 'detalhes', t.id)}"><td><div class="strong">${esc(t.route)}</div><div class="xsmall muted">${t.id}</div></td><td>${esc(t.driver)}</td><td>${t.start}</td><td>${badge(t.status)}</td></tr>`).join('')}</tbody></table></div>`, `<a class="link-more" href="${h('admin', 'viagens')}">Ver todas ${I('arrow-right')}</a>`)
      + section('Status da operação', `<div class="section__body kv-list"><div class="op-banner"><div class="op-banner__tag"><span class="dot"></span> OPERAÇÃO EM ANDAMENTO</div><p class="strong" style="font-size:14px">5 viagens em circulação</p><p class="small muted" style="margin-top:4px">Todos os veículos rastreados normalmente.</p></div>${[['Em andamento', '5', ''], ['Finalizadas', '8', ' dot--success'], ['Pendentes', '11', ' dot--warning']].map(([n, v, c]) => `<div class="kv-row"><div class="row" style="gap:8px"><span class="dot${c}"></span>${n}</div><strong>${v}</strong></div>`).join('')}</div>`, `<span class="text-primary">${I('activity')}</span>`)
      + `</div><div class="layout-b mt-5">`
      + section('Últimos embarques e desembarques', `<div class="divide">${events.map((e) => `<div class="list-item">${avatar(e.initials)}<div class="list-item__main"><p class="list-item__title">${esc(e.name)}</p><p class="small muted">${esc(e.stop)} · Rota ETEC</p></div>${badge(e.action)}<span class="small muted">${e.time}</span></div>`).join('')}</div>`, `<a class="link-more" href="${h('admin', 'embarques')}">Ver registros →</a>`)
      + section('Atividade recente', `<div class="section__body kv-list">${[['Viagem iniciada', 'Carlos Mendes iniciou a Rota ETEC.', '06:30'], ['Novo aluno cadastrado', 'Luiza Oliveira adicionada à Rota ETEC.', 'Ontem'], ['Rota atualizada', 'Ponto Praça Central atualizado.', 'Ontem']].map(([a, b, c]) => `<div class="timeline-row"><span class="dot"></span><div style="flex:1"><p class="semibold" style="font-size:14px">${a}</p><p class="small muted">${b}</p></div><span class="xsmall muted" style="white-space:nowrap">${c}</span></div>`).join('')}</div>`, `<span class="muted">${I('clock-3')}</span>`)
      + `</div>`;
  }

  function adminForm(sec, mode, entity) {
    const edit = mode === 'editar';
    const label = labels[sec] || 'registro';
    const fields = (formFields[sec] || []).map(([lab, key, type, options, name]) => field(lab, edit && entity ? String(entity[key] ?? '') : '', type || 'text', options || undefined, name || key)).join('');
    const stopsBlock = sec === 'rotas' ? `<div class="mt-5">${section('Pontos de parada', `<div class="section__body"><p class="small muted" style="margin-bottom:16px">Os pontos aparecem na ordem percorrida pelo ônibus.</p><div>${A.stops.map((s, i) => `<div class="stop-edit"><span class="stop__num">${i + 1}</span><span class="grow">${esc(s)}</span><button type="button" class="btn btn--ghost btn--icon" aria-label="Remover ${esc(s)}" data-act="stop-remove" data-i="${i}">${I('x')}</button></div>`).join('')}</div><div class="inline-form"><input class="input" id="bp-new-stop" aria-label="Nome do ponto" placeholder="Nome ou endereço do ponto"><button type="button" class="btn btn--outline" data-act="stop-add">${I('plus')} Adicionar ponto</button></div></div>`)}</div>` : '';
    return headline({ eyebrow: `${names[sec]} / ${edit ? 'EDITAR' : 'CADASTRAR'}`, title: `${edit ? 'Editar' : 'Cadastrar'} ${label}`, description: `Preencha as informações ${edit ? 'para atualizar o cadastro' : 'do novo cadastro'}.` })
      + `<form class="form-max" data-form="admin" data-section="${sec}" data-mode="${mode}" data-id="${esc(entity && edit ? entity.id : '')}">${section('Informações gerais', `<div class="form-grid">${fields}</div>`)}${stopsBlock}<div class="form-actions"><a class="btn btn--outline" href="${h('admin', sec)}">Cancelar</a><button class="btn" type="submit">${edit ? 'Salvar alterações' : `Cadastrar ${label}`}</button></div></form>`;
  }

  function adminDetails(sec, entity) {
    if (!entity) return empty();
    const title = String(entity.name || entity.plate || entity.id);
    const keys = (columns[sec] || []).filter(([l, k]) => !['name', 'plate', 'id'].includes(k) && l !== 'Status');
    const status = A.disabled.includes(String(entity.id)) ? 'Inativo' : String(entity.status || 'Ativo');
    const person = ['alunos', 'motoristas'].includes(sec) ? `<div class="row" style="margin-bottom:24px">${avatar(entity.initials || 'BP', true)}<div><h3 class="display" style="font-size:18px">${esc(title)}</h3><p class="muted" style="font-size:14px">${esc(entity.email)}</p></div></div>` : '';
    const info = `<div class="section__body--lg">${person}<div class="kv-grid">${keys.map(([l, k]) => `<div><p class="kicker">${l}</p><p class="semibold" style="font-size:14px">${esc(entity[k] ?? '—')}${k === 'capacity' ? ' lugares' : ''}</p></div>`).join('')}<div><p class="kicker">Status</p>${badge(status)}</div></div></div>`;
    let side;
    if (sec === 'rotas') {
      const list = Array.isArray(entity.stops) ? entity.stops : A.stops;
      side = `<div class="stops">${list.map((s, i) => `<div class="stop"><div class="stop__rail"><span class="stop__num">${i + 1}</span>${i < list.length - 1 ? '<span class="stop__line"></span>' : ''}</div><span class="stop__text">${esc(s)}</span></div>`).join('')}</div><div class="row" style="gap:8px;margin-top:8px">${[['Vincular aluno', 'aluno'], ['Vincular motorista', 'motorista'], ['Vincular ônibus', 'onibus']].map(([l, k]) => `<a class="btn btn--outline btn--sm" href="${h('admin', 'rotas', 'vincular-' + k, entity.id)}">${l}</a>`).join('')}</div>`;
    } else if (sec === 'viagens') {
      side = `<div class="kv-list">${students.filter((s) => s.route === entity.route).map((s, i) => `<div class="kv-row"><span>${esc(s.name)}</span>${badge(i < 2 ? 'Embarcado' : 'Aguardando')}</div>`).join('') || '<p class="small muted">Nenhum aluno nesta rota.</p>'}</div>`;
    } else {
      side = `<p class="kicker" style="margin-bottom:8px">Rota vinculada</p><p class="semibold" style="font-size:14px">${esc(entity.route || 'Rota ETEC')}</p><p class="kicker" style="margin:20px 0 8px">Última atividade</p><p class="muted" style="font-size:14px">Viagem da Rota ETEC · 25/09/2026</p>`;
    }
    const sideTitle = sec === 'rotas' ? 'Pontos de parada' : sec === 'viagens' ? 'Controle de passageiros' : 'Vínculos e atividade';
    const linkedStudents = sec === 'rotas' ? `<div class="mt-5">${section('Alunos vinculados', `<div class="divide">${students.filter((s) => s.route === entity.name).map((s) => `<div class="list-item">${avatar(s.initials)}<span class="list-item__main list-item__title">${esc(s.name)}</span><span class="small muted">${s.enrollment}</span></div>`).join('') || empty('Nenhum aluno vinculado.')}</div>`)}</div>` : '';
    return `<a class="back-link" href="${h('admin', sec)}">${I('arrow-left')} Voltar para ${(names[sec] || sec).toLowerCase()}</a>`
      + headline({ eyebrow: `${names[sec]} / DETALHES`, title, action: sec !== 'viagens' ? `<div class="headline__actions"><a class="btn btn--outline" href="${h('admin', sec, 'editar', entity.id)}">${I('square-pen')} Editar</a></div>` : '' })
      + `<div class="layout-c">${section('Informações gerais', info)}${section(sideTitle, `<div class="section__body">${side}</div>`)}</div>${linkedStudents}`;
  }

  function adminLinking(mode, id) {
    const type = mode.replace('vincular-', '');
    const options = type === 'aluno' ? students : type === 'motorista' ? drivers : buses;
    const route = routes.find((r) => r.id === id) || routes[0];
    return `<a class="back-link" href="${h('admin', 'rotas', 'detalhes', id)}">${I('arrow-left')} Voltar à rota</a>`
      + headline({ eyebrow: 'ROTAS / VINCULAÇÕES', title: `Vincular ${type === 'aluno' ? 'alunos' : type === 'motorista' ? 'motorista' : 'ônibus'} à ${route.name}`, description: 'Selecione os registros disponíveis para esta rota.' })
      + section('Registros disponíveis', `<div class="divide">${options.map((o) => {
        const name = o.name || o.plate;
        const on = A.linked.includes(name);
        const sub = o.enrollment || (o.license ? `CNH ${o.license}` : `${o.capacity} lugares`);
        return `<div class="list-item">${avatar(o.initials || 'ON')}<div class="list-item__main"><p class="list-item__title">${esc(name)}</p><p class="small muted">${esc(sub)}</p></div><button class="btn btn--sm${on ? ' btn--outline' : ''}" data-act="link-toggle" data-name="${esc(name)}">${on ? 'Vinculado' : 'Vincular'}</button></div>`;
      }).join('')}</div>`);
  }

  function adminMonitoring(sec) {
    const emb = sec === 'embarques';
    return headline({ eyebrow: 'OPERAÇÃO / TEMPO REAL', title: emb ? 'Monitoramento de embarques' : 'Monitoramento de desembarques', description: 'Acompanhe os registros da viagem atual.' })
      + `<div class="grid grid-3 mb-5">${[['Viagem atual', 'Rota ETEC'], ['Motorista', 'Carlos Mendes'], ['Ônibus', 'ABC-1234']].map(([a, b]) => `<div class="card card--pad"><p class="kicker">${a}</p><p class="display" style="margin-top:8px;font-size:16px">${b}</p></div>`).join('')}</div>`
      + section(emb ? 'Passageiros da viagem' : 'Registros de desembarque', `<div class="table-scroll"><table class="table"><thead><tr><th>Aluno</th><th>Ponto de parada</th><th>Horário</th><th>Situação</th></tr></thead><tbody>${students.filter((s) => s.route === 'Rota ETEC').map((s, i) => `<tr><td class="semibold">${esc(s.name)}</td><td>${esc(s.stop)}</td><td>${i < 2 ? ['07:12', '07:08'][i] : '—'}</td><td>${badge(emb ? (i < 2 ? 'Embarcado' : 'Aguardando') : (i === 0 ? 'Desembarcado' : 'Aguardando'))}</td></tr>`).join('')}</tbody></table></div>`);
  }

  function renderAdmin(slug) {
    const parts = slug.split('/');
    const sec = parts[0] || 'dashboard';
    const mode = parts[1] || 'list';
    const id = parts[2];
    if (sec !== A.lastSection) { A.query = ''; A.filter = 'Todos'; A.lastSection = sec; }
    const rows = datasets[sec] || [];
    const entity = rows.find((r) => String(r.id) === id) || rows[0];

    let content;
    if (sec === 'dashboard') content = adminDashboard();
    else if (sec === 'embarques' || sec === 'desembarques') content = adminMonitoring(sec);
    else if (sec === 'historico') content = headline({ eyebrow: 'OPERAÇÃO / CONSULTA', title: 'Histórico de viagens', description: 'Consulte as viagens finalizadas e seus registros.' }) + section('Viagens finalizadas', adminList('viagem', trips.filter((t) => t.status === 'Finalizada'), sec));
    else if (!datasets[sec]) content = empty('Seção não encontrada.');
    else if (mode.startsWith('vincular-')) content = adminLinking(mode, id);
    else if (mode === 'novo' || mode === 'editar') content = adminForm(sec, mode, entity);
    else if (mode === 'detalhes') content = adminDetails(sec, entity);
    else content = headline({ eyebrow: 'GESTÃO / CADASTROS', title: names[sec], description: `Gerencie ${names[sec].toLowerCase()} do transporte escolar.`, action: sec !== 'viagens' ? `<a class="btn" href="${h('admin', sec, 'novo')}">${I('plus')} Novo ${labels[sec]}</a>` : '' })
      + section(`Todos os ${names[sec].toLowerCase()}`, adminList(labels[sec] || 'registro', rows, sec));

    const modal = A.modal ? `<div class="modal-backdrop" data-act="modal-cancel"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="bp-modal-t" data-stop><div class="modal__icon">${I('trash-2')}</div><h2 id="bp-modal-t">Confirmar inativação</h2><p>Deseja realmente inativar este ${labels[sec] || 'registro'}? Esta ação pode ser revertida posteriormente.</p><div class="form-actions"><button class="btn btn--outline" data-act="modal-cancel">Cancelar</button><button class="btn btn--destructive" data-act="modal-confirm">Inativar</button></div></div></div>` : '';

    return `<div class="admin">
      <aside class="sidebar${A.menu ? ' open' : ''}">
        <div class="sidebar__brand">${brand(false)}</div>
        <p class="sidebar__label">MENU PRINCIPAL</p>
        <nav>${adminNav.map(([l, p, ic]) => `<a class="navlink${sec === p ? ' active' : ''}" href="${h('admin', p)}">${I(ic)}${l}</a>`).join('')}</nav>
        <div class="sidebar__foot">
          <a class="navlink" href="${h('perfil', 'admin')}">${I('user-round')}Meu perfil</a>
          <a class="navlink" href="${h('acesso', 'login')}">${I('log-out')}Sair</a>
        </div>
        <div class="sidebar__user">${avatar('AD')}<div><p class="name">Administrador</p><p class="role">Gestão BusPoint</p></div></div>
      </aside>
      ${A.menu ? '<div class="overlay" data-act="menu-close"></div>' : ''}
      <div class="admin__main">
        <header class="topbar">
          <div class="topbar__left"><button class="btn btn--ghost btn--icon only-mobile" aria-label="Abrir menu" data-act="menu-open">${I('menu')}</button><span class="topbar__crumb">Painel administrativo ${I('chevron-right')} <b>${esc(names[sec] || sec)}</b></span></div>
          <div class="topbar__right"><span class="topbar__status"><span class="dot dot--success"></span> Sistema operacional</span><button class="btn btn--ghost btn--icon" aria-label="Notificações" title="Notificações" data-act="notify">${I('bell')}</button><span class="vsep"></span>${avatar('AD')}</div>
        </header>
        <main class="admin__content">${content}</main>
      </div>
      ${modal}
    </div>`;
  }

  /* =========================================================
     MOTORISTA E ALUNO
     ========================================================= */
  const driverNav = [['Início', 'inicio', 'layout-dashboard'], ['Minha rota', 'minha-rota', 'route'], ['Meus horários', 'horarios', 'clock-3'], ['Meus alunos', 'alunos', 'graduation-cap'], ['Meu ônibus', 'onibus', 'bus-front'], ['Viagem atual', 'viagem', 'map-pin']];
  const studentNav = [['Início', 'inicio', 'layout-dashboard'], ['Minha matrícula', 'matricula', 'book-open'], ['Minha rota', 'minha-rota', 'route'], ['Meus horários', 'horarios', 'clock-3'], ['Meu ônibus', 'onibus', 'bus-front'], ['Histórico', 'historico', 'file-clock'], ['Alterar horário', 'solicitacao', 'calendar-days']];
  const titleMap = { inicio: 'Início', 'minha-rota': 'Minha rota', horarios: 'Meus horários', alunos: 'Meus alunos', onibus: 'Meu ônibus', viagem: 'Viagem atual', matricula: 'Minha matrícula', historico: 'Histórico de transporte', solicitacao: 'Alterar horário' };

  const M = { tripState: 'Pendente', passengers: { 'AL-001': 'Embarcado', 'AL-002': 'Embarcado' }, confirm: '', sent: false };
  const etec = () => students.filter((s) => s.route === 'Rota ETEC');

  const mini = (label, value, ic) => `<div class="card mini"><span class="icon-tile">${I(ic)}</span><div><p class="xsmall">${label}</p><p class="val">${value}</p></div></div>`;

  function stopList() {
    const st = routes[0].stops;
    return `<div class="card card--pad"><h2 class="section-title" style="margin-bottom:20px">Pontos de parada</h2><div class="stops">${st.map((s, i) => `<div class="stop"><div class="stop__rail"><span class="stop__num${i === 1 ? ' stop__num--active' : ''}">${i + 1}</span>${i < st.length - 1 ? '<span class="stop__line"></span>' : ''}</div><div class="stop__text">${esc(s)}${i === 1 ? '<p class="xsmall text-primary" style="font-weight:400">Próximo ponto</p>' : ''}</div></div>`).join('')}</div></div>`;
  }

  function mobileContent(role, slug) {
    const isDriver = role === 'motorista';
    const startLabel = M.tripState === 'Pendente' ? 'Iniciar viagem' : M.tripState === 'Em andamento' ? 'Viagem em andamento' : 'Viagem finalizada';
    switch (slug) {
      case 'inicio':
        return `<div class="hero"><p class="hero__date">SEGUNDA-FEIRA, 28 DE SETEMBRO</p><h1>${isDriver ? 'Bom dia, Carlos!' : 'Olá, João!'}</h1><p class="hero__sub">${isDriver ? 'Sua próxima viagem está programada.' : 'Sua jornada começa aqui.'}</p><div class="hero__route"><p class="label-sm">${isDriver ? 'SUA ROTA DE HOJE' : 'MINHA ROTA'}</p><div class="hero__route-row"><div><p class="name">Rota ETEC</p><p class="meta">${isDriver ? '06:30 · ABC-1234' : 'Próxima viagem às 06:30'}</p></div><span class="hero__icon">${I('route')}</span></div></div></div>`
          + (isDriver
            ? `<button class="btn btn--xl btn--block" data-act="trip-ask" data-kind="start"${M.tripState !== 'Pendente' ? ' disabled' : ''}>${startLabel} ${I('arrow-right')}</button><div class="grid-2">${mini('Próximo horário', '06:30', 'clock-3')}${mini('Meu ônibus', 'ABC-1234', 'bus-front')}</div><div class="card card--pad"><h2 class="section-title" style="margin-bottom:12px">Visão rápida</h2><div class="kv-row"><span class="muted">Alunos na rota</span><strong>4 alunos</strong></div><div class="kv-row" style="margin-top:12px"><span class="muted">Pontos de parada</span><strong>5 pontos</strong></div></div>`
            : `<div class="grid-2">${mini('Meu ônibus', 'ABC-1234', 'bus-front')}${mini('Motorista', 'Carlos Mendes', 'user-round')}</div><div class="card card--pad"><div class="row" style="gap:12px"><span class="icon-tile">${I('map-pin')}</span><div><p class="xsmall muted">Ponto de embarque</p><p class="strong" style="font-size:14px">Rua das Flores</p></div></div></div><a class="card link-card" href="${h(role, 'minha-rota')}">Ver detalhes da minha rota ${I('chevron-right')}</a>`);
      case 'minha-rota':
        return `<div class="card card--pad"><div class="split-top"><div><p class="kicker" style="margin-bottom:8px">ROTA VINCULADA</p><h2 class="display" style="font-size:20px">Rota ETEC</h2><p class="muted" style="margin-top:4px;font-size:14px">Ida e volta · Período da manhã</p></div>${badge('Ativa')}</div><div class="facts">${[['Saída', '06:30'], ['Retorno', '12:10'], ['Motorista', 'Carlos Mendes'], ['Ônibus', 'ABC-1234']].map(([a, b]) => `<div><p class="k">${a}</p><p class="v">${b}</p></div>`).join('')}</div></div>${stopList()}`;
      case 'horarios':
        return `<div class="card card--pad"><h2 class="section-title" style="margin-bottom:4px">Programação semanal</h2><p class="small muted">Segunda a sexta-feira · Rota ETEC</p><div style="margin-top:20px">${[['Manhã', '06:30', 'Ida · Garagem Municipal → ETEC Central'], ['Meio-dia', '12:10', 'Volta · ETEC Central → Garagem Municipal']].map(([a, b, c]) => `<div class="schedule"><div class="schedule__time">${b}</div><div><p class="strong" style="font-size:14px">${a}</p><p class="small muted">${c}</p></div></div>`).join('')}</div></div><div class="card card--pad"><div class="row semibold" style="gap:8px;font-size:14px"><span class="text-primary">${I('calendar-days')}</span> Próxima viagem</div><p class="small muted" style="margin-top:8px">Segunda-feira, 28 de setembro · 06:30</p></div>`;
      case 'alunos':
        if (!isDriver) break;
        return `<div class="card divide">${etec().map((s) => `<div class="list-item" style="padding:16px">${avatar(s.initials)}<div class="list-item__main"><p class="strong" style="font-size:14px">${esc(s.name)}</p><p class="small muted">${s.enrollment} · ${esc(s.stop)}</p></div>${badge(M.passengers[s.id] || 'Aguardando')}</div>`).join('')}</div>`;
      case 'onibus':
        return `<div class="card card--pad-lg"><div class="icon-tile icon-tile--xl" style="margin-bottom:20px">${I('bus-front')}</div><p class="kicker">VEÍCULO VINCULADO</p><h2 class="display" style="margin-top:8px;font-size:24px">ABC-1234</h2><div style="margin-top:20px;padding-top:20px;border-top:1px solid var(--border)">${[['Capacidade', '42 passageiros'], ['Status', 'Ativo'], ['Motorista', 'Carlos Mendes'], ['Rota', 'Rota ETEC']].map(([a, b]) => `<div class="kv-row" style="padding:8px 0"><span class="muted">${a}</span><strong>${b}</strong></div>`).join('')}</div></div>`;
      case 'viagem': {
        if (!isDriver) break;
        const head = `<div class="card card--pad"><div class="split-top"><div><p class="kicker" style="margin-bottom:8px">VIAGEM VG-0821</p><h2 class="display" style="font-size:20px">Rota ETEC</h2></div>${badge(M.tripState)}</div><div class="facts">${[['Próximo ponto', 'Rua das Flores'], ['Ônibus', 'ABC-1234'], ['Horário', '06:30'], ['Motorista', 'Carlos Mendes']].map(([a, b]) => `<div><p class="k">${a}</p><p class="v">${b}</p></div>`).join('')}</div></div>`;
        if (M.tripState === 'Pendente') return head + `<button class="btn btn--xl btn--block" data-act="trip-ask" data-kind="start">Iniciar viagem ${I('arrow-right')}</button>`;
        const running = M.tripState === 'Em andamento';
        const list = `<div class="card"><div style="padding:16px;border-bottom:1px solid var(--border)"><h2 class="section-title">Controle de passageiros</h2><p class="small muted" style="margin-top:4px">Registre embarques e desembarques durante o percurso.</p></div><div class="divide">${etec().map((s) => `<div class="passenger"><div class="row" style="gap:12px;flex-wrap:nowrap">${avatar(s.initials)}<div style="flex:1"><p class="strong" style="font-size:14px">${esc(s.name)}</p><p class="small muted">${esc(s.stop)}</p></div>${badge(M.passengers[s.id] || 'Aguardando')}</div>${running ? `<div class="passenger__actions"><button class="btn btn--sm ${M.passengers[s.id] === 'Embarcado' ? 'btn--secondary' : 'btn--outline'}" data-act="pass" data-id="${s.id}" data-status="Embarcado">Embarcou</button><button class="btn btn--sm btn--outline" data-act="pass" data-id="${s.id}" data-status="Desembarcado">Desembarcou</button></div>` : ''}</div>`).join('')}</div></div>`;
        const tail = running
          ? `<button class="btn btn--outline btn--block" style="height:48px" data-act="trip-ask" data-kind="end">Encerrar viagem</button>`
          : `<div class="card card--pad"><div class="row text-success" style="gap:8px">${I('circle-check')}<strong>Viagem finalizada</strong></div><p class="muted" style="margin-top:8px;font-size:14px">Rota ETEC · 28/09/2026 · 06:30–12:10</p><p style="margin-top:8px;font-size:14px">${Object.values(M.passengers).filter((x) => x !== 'Aguardando').length} alunos transportados</p></div>`;
        return head + list + tail;
      }
      case 'matricula':
        if (isDriver) break;
        return `<div class="card card--pad"><div class="profile-head" style="padding-bottom:20px">${avatar('JS', true)}<div><h2 class="display" style="font-size:18px">João Silva</h2><p class="small muted">Aluno · ETEC Central</p></div></div><div class="kv-list" style="margin-top:16px">${[['Número da matrícula', '202600184'], ['Período', 'Manhã'], ['Rota vinculada', 'Rota ETEC'], ['Situação', 'Ativa']].map(([a, b]) => `<div class="kv-row"><span class="muted">${a}</span><strong>${b}</strong></div>`).join('')}</div></div>`;
      case 'historico':
        if (isDriver) break;
        return `<div class="card"><div style="padding:16px;border-bottom:1px solid var(--border)"><h2 class="section-title">Viagens realizadas</h2><p class="small muted" style="margin-top:4px">Seu registro de transporte na Rota ETEC.</p></div><div class="divide">${trips.filter((t) => t.status === 'Finalizada').map((t, i) => `<details class="trip"><summary><span class="icon-tile">${I('bus-front')}</span><div style="flex:1"><p class="strong" style="font-size:14px">${esc(t.route)}</p><p class="small muted">${t.date} · Viagem ${String(i + 1).padStart(2, '0')}</p></div>${I('chevron-down', 'chev')}</summary><div class="trip__body">${[['Horário', `${t.start} – ${t.end}`], ['Motorista', t.driver], ['Ônibus', t.bus], ['Status', t.status]].map(([a, b]) => `<div><p class="muted">${a}</p><p class="strong" style="margin-top:4px">${esc(b)}</p></div>`).join('')}</div></details>`).join('')}</div></div>`;
      case 'solicitacao':
        if (isDriver) break;
        if (M.sent) return `<div class="card card--pad-lg center"><span class="success-circle">${I('check')}</span><h2 class="display" style="margin-top:16px;font-size:18px">Solicitação enviada!</h2><p class="muted" style="margin-top:8px;font-size:14px">Sua solicitação de alteração de horário foi registrada.</p><div class="note"><p>Data: 28/09/2026</p><p style="margin-top:8px">Status: ${badge('Pendente')}</p></div><button class="btn btn--outline" style="margin-top:24px" data-act="req-new">Nova solicitação</button></div>`;
        return `<form class="card card--pad stack" data-form="request"><p class="muted" style="font-size:14px">Solicite uma mudança na programação da sua rota.</p>${field('Horário atual', '06:30', 'time')}${field('Novo horário desejado', '', 'time')}<label class="field"><span class="label">Motivo</span><textarea class="input" required placeholder="Conte por que precisa alterar o horário"></textarea></label><button class="btn btn--block" type="submit">Enviar solicitação ${I('arrow-right')}</button></form>`;
    }
    return empty();
  }

  function renderMobile(role, slug) {
    const isDriver = role === 'motorista';
    const items = isDriver ? driverNav : studentNav;
    const bottom = [items[0], items[1], items[2], items[5]];
    const confirm = M.confirm ? `<div class="modal-backdrop" data-act="confirm-cancel"><div class="modal" role="dialog" aria-modal="true" data-stop><h2>${M.confirm === 'start' ? 'Iniciar viagem?' : 'Encerrar viagem?'}</h2><p>${M.confirm === 'start' ? 'Você está iniciando a viagem da Rota ETEC com o ônibus ABC-1234 às 06:30.' : `A viagem começou às 06:30. ${Object.values(M.passengers).filter((x) => x === 'Embarcado').length} alunos estão embarcados.`}</p><div class="form-actions"><button class="btn btn--outline" data-act="confirm-cancel">Cancelar</button><button class="btn" data-act="confirm-ok">${M.confirm === 'start' ? 'Iniciar viagem' : 'Encerrar viagem'}</button></div></div></div>` : '';
    return `<div class="mobile">
      <header class="appbar"><div class="appbar__inner">${brand(true)}<div class="appbar__right"><span class="appbar__role">${isDriver ? 'Motorista' : 'Aluno'}</span><a href="${h('perfil', role)}" title="Meu perfil">${avatar(isDriver ? 'CM' : 'JS')}</a></div></div></header>
      <div class="mobile__body">
        <aside class="side-menu"><p class="kicker">MENU PRINCIPAL</p><nav>${items.map(([l, p, ic]) => `<a class="side-link${slug === p ? ' active' : ''}" href="${h(role, p)}">${I(ic)}${l}</a>`).join('')}<a class="side-link side-link--plain" href="${h('perfil', role)}">${I('user-round')}Meu perfil</a><a class="side-link side-link--plain" href="${h('acesso', 'login')}">${I('log-out')}Sair</a></nav></aside>
        <main class="mobile__main"><div class="mobile__title"><p class="kicker">${isDriver ? 'ÁREA DO MOTORISTA' : 'ÁREA DO ALUNO'}</p>${slug !== 'inicio' ? `<h1>${esc(titleMap[slug] || 'Início')}</h1>` : ''}</div><div class="stack">${mobileContent(role, slug)}</div></main>
      </div>
      <nav class="bottom-nav">${bottom.map(([l, p, ic]) => `<a class="${slug === p ? 'active' : ''}" href="${h(role, p)}">${I(ic)}${l}</a>`).join('')}<a href="${h('perfil', role)}">${I('user-round')}Perfil</a></nav>
      ${confirm}
    </div>`;
  }

  /* =========================================================
     ACESSO (login, primeiro acesso, recuperação)
     ========================================================= */
  const headings = { login: ['Bem-vindo de volta', 'Acesse sua conta para continuar.'], primeiro: ['Primeiro acesso', 'Vamos configurar seu acesso ao BusPoint.'], verificar: ['Verificar identidade', 'Confirme seus dados para continuar.'], definir: ['Definir senha', 'Crie uma senha segura para sua conta.'], resetar: ['Recuperar senha', 'Confirme seus dados e defina uma nova senha.'], sucesso: ['Tudo pronto!', 'Sua senha foi definida com sucesso.'], splash: ['BusPoint', 'Preparando sua experiência.'] };

  function renderAccess(slug) {
    if (!headings[slug]) slug = 'login';
    const [title, sub] = headings[slug];
    const pw = (label) => `<label class="field"><span class="label">${label}</span><input class="input" required minlength="8" type="password"></label>`;
    let box;
    if (slug === 'sucesso') {
      box = `<div class="center"><span class="success-circle success-circle--lg">${I('circle-check')}</span><h1 style="margin-top:20px;font-size:24px">${title}</h1><p class="muted" style="margin-top:8px;font-size:14px">${sub}</p><a class="btn btn--block" style="margin-top:32px" href="${h('acesso', 'login')}">Ir para login ${I('arrow-right')}</a></div>`;
    } else if (slug === 'splash') {
      box = `<div class="center"><div style="width:fit-content;margin:0 auto 20px">${brand(true)}</div><p class="muted" style="font-size:14px">Carregando...</p><div class="loader"><div></div></div><a class="btn btn--outline" style="margin-top:32px" href="${h('acesso', 'login')}">Continuar</a></div>`;
    } else {
      let fields;
      if (slug === 'login') {
        fields = `<label class="field"><span class="label">Login ou e-mail</span><input class="input" required type="text" placeholder="seu.email@exemplo.com"></label>
          <label class="field"><span class="label">Senha</span><span class="input-wrap input-wrap--pw"><input class="input" id="bp-pw" required type="password" placeholder="Digite sua senha"><button type="button" class="btn btn--ghost btn--icon" aria-label="Mostrar senha" data-act="pw-toggle">${I('eye')}</button></span></label>
          <label class="field"><span class="label">Perfil para demonstração</span><select class="input" name="role"><option value="admin">Administrador</option><option value="motorista">Motorista</option><option value="aluno">Aluno</option></select></label>
          <div style="display:flex;justify-content:flex-end"><a class="small strong text-primary" href="${h('acesso', 'resetar')}">Esqueci minha senha</a></div>`;
      } else if (slug === 'primeiro' || slug === 'verificar' || slug === 'resetar') {
        fields = `<label class="field"><span class="label">Login ou e-mail</span><input class="input" required placeholder="Seu login ou e-mail"></label><label class="field"><span class="label">CPF para identificação</span><input class="input" required placeholder="000.000.000-00" inputmode="numeric"></label>`
          + (slug === 'verificar' ? `<p class="info-box">Confirme os dados vinculados à conta para prosseguir.</p>` : '')
          + (slug === 'resetar' ? pw('Nova senha') + pw('Confirmar nova senha') : '');
      } else {
        fields = pw('Nova senha') + pw('Confirmar senha') + `<p class="small muted">Use no mínimo 8 caracteres, com letras e números.</p>`;
      }
      const submit = { login: 'Entrar', primeiro: 'Verificar identidade', verificar: 'Continuar', resetar: 'Confirmar nova senha' }[slug] || 'Definir senha';
      box = `<p class="kicker primary">ACESSO AO SISTEMA</p><h1>${title}</h1><p class="muted" style="margin-top:8px;font-size:14px">${sub}</p>
        <form class="access__form" data-form="access" data-slug="${slug}">${fields}<p class="small" role="alert" id="bp-access-err" style="color:var(--destructive)"></p><button class="btn btn--block btn--tall" type="submit">${submit} ${I('arrow-right')}</button></form>
        <div class="center" style="margin-top:24px;font-size:14px">${slug === 'login' ? `Ainda não configurou sua senha? <a class="strong text-primary" href="${h('acesso', 'primeiro')}">Primeiro acesso</a>` : `<a class="strong text-primary" href="${h('acesso', 'login')}">← Voltar para o login</a>`}</div>
        <p class="center small muted" style="margin-top:48px">Protótipo demonstrativo · Nenhuma senha real é verificada</p>`;
    }
    return `<div class="access">
      <div class="access__aside">${brand(false)}<div><div class="access__art">${I('bus-front')}</div><h1>O transporte escolar em movimento.</h1><p class="lead">Uma experiência conectada para quem organiza, conduz e vive cada trajeto.</p></div><p class="copy">© 2026 BusPoint · Protótipo demonstrativo</p></div>
      <main class="access__main"><div class="access__box"><div class="access__mobile-brand">${brand(true)}</div>${box}</div></main>
    </div>`;
  }

  /* =========================================================
     PERFIL
     ========================================================= */
  const P = { screen: 'view', saved: false };
  let savedTimer;
  function renderProfile(role) {
    const name = role === 'admin' ? 'Administrador BusPoint' : role === 'motorista' ? 'Carlos Mendes' : 'João Silva';
    const email = role === 'admin' ? 'admin@buspoint.com.br' : role === 'motorista' ? 'carlos.mendes@buspoint.com.br' : 'joao.silva@aluno.edu.br';
    const initials = role === 'admin' ? 'AD' : role === 'motorista' ? 'CM' : 'JS';
    const label = roleInfo[role].label;
    const title = P.screen === 'edit' ? 'Editar perfil' : P.screen === 'password' ? 'Alterar senha' : 'Meu perfil';
    let body;
    if (P.screen === 'view') {
      body = `<div class="profile-head">${avatar(initials, true)}<div><h2 class="display" style="font-size:18px">${name}</h2><p class="muted" style="font-size:14px">${label}</p></div></div>
        <div class="profile-grid">${[['Nome', name], ['E-mail', email], ['Telefone', '(11) 98743-2201'], ['Login', email], ['Tipo de usuário', label]].map(([a, b]) => `<div><p class="kicker" style="margin-bottom:4px">${a}</p><p class="semibold" style="font-size:14px">${b}</p></div>`).join('')}</div>
        <div class="profile-actions"><button class="btn" data-act="screen" data-screen="edit">${I('square-pen')} Editar perfil</button><button class="btn btn--outline" data-act="screen" data-screen="password">${I('lock-keyhole')} Alterar senha</button></div>`;
    } else {
      const fields = P.screen === 'edit'
        ? field('Nome', name) + field('E-mail', email, 'email') + field('Telefone', '(11) 98743-2201', 'tel') + field('Login', email)
          + `<div class="span-2"><p class="label">Foto do perfil</p><div class="row">${avatar(initials, true)}<button type="button" class="btn btn--outline" data-act="photo">Alterar foto</button><button type="button" class="btn btn--ghost" data-act="photo">Remover</button></div></div>`
        : field('Senha atual', '', 'password') + field('Nova senha', '', 'password') + field('Confirmar nova senha', '', 'password');
      body = `<form class="profile-form" data-form="profile">${fields}<div class="form-actions span-2" style="margin-top:0"><button type="button" class="btn btn--outline" data-act="screen" data-screen="view">Cancelar</button><button class="btn" type="submit">Salvar alterações</button></div></form>`;
    }
    return `<div style="min-height:100vh">
      <header class="simple-header"><div class="simple-header__inner">${brand(true)}<a class="back-primary" href="${roleInfo[role].home}">${I('arrow-left')} Voltar</a></div></header>
      <main class="profile-main">${headline({ eyebrow: 'CONTA / DADOS PESSOAIS', title, description: 'Gerencie seus dados de acesso e contato.' })}<div class="card card--pad-lg">${body}</div>${P.saved ? '<p role="status" class="semibold text-success" style="margin-top:16px;font-size:14px">Alterações salvas no protótipo.</p>' : ''}</main>
    </div>`;
  }

  /* =========================================================
     ESTADOS DO SISTEMA
     ========================================================= */
  function renderSystem(slug) {
    const content = { '403': ['403', 'Acesso não autorizado', 'Você não possui permissão para acessar esta página.'], '404': ['404', 'Página não encontrada', 'A página que você procura não existe ou foi movida.'], '500': ['500', 'Erro interno', 'Algo deu errado. Tente novamente em instantes.'], carregando: ['...', 'Carregando', 'Preparando suas informações.'], vazio: ['0', 'Nenhum resultado', 'Nenhum aluno encontrado para esta busca.'], sucesso: ['✓', 'Tudo certo!', 'Operação realizada com sucesso.'], erro: ['!', 'Revise os dados', 'Este e-mail já está cadastrado.'] };
    const [code, title, desc] = content[slug] || content['404'];
    return `<div class="system"><header>${brand(true)}</header><main><span class="code">${code}</span><h1>${title}</h1><p>${desc}</p><a class="back-primary" style="margin-top:28px;font-weight:700" href="#/">${I('arrow-left')} Voltar ao início</a></main></div>`;
  }

  /* =========================================================
     Troca de usuário (canto inferior direito)
     ========================================================= */
  let switcherOpen = false;
  function renderSwitcher(top) {
    const el = document.getElementById('bp-switcher');
    if (top === 'acesso') { el.innerHTML = ''; return; }
    const role = getRole();
    el.innerHTML = `<div class="switcher">${switcherOpen ? `<div class="switcher__panel"><p class="kicker">TROCAR USUÁRIO</p>${Object.keys(roleInfo).map((r) => `<button class="switcher__opt${r === role ? ' active' : ''}" data-act="sw-pick" data-role="${r}">${I(roleInfo[r].icon)}<span class="grow"><span class="t">${roleInfo[r].label}</span><span class="s">${roleInfo[r].person}</span></span>${r === role ? '<span class="tag">Ativo</span>' : ''}</button>`).join('')}</div>` : ''}<button class="switcher__btn" data-act="sw-toggle" aria-label="Trocar usuário" title="Trocar usuário">${I('users')}${roleInfo[role].label}</button></div>`;
  }

  /* =========================================================
     Roteador
     ========================================================= */
  const titles = { admin: 'Administração', motorista: 'Motorista', aluno: 'Aluno', perfil: 'Meu perfil', acesso: 'Acesso', estado: 'Estado do sistema' };
  let lastPath = null;

  function render() {
    const path = (location.hash.replace(/^#\/?/, '') || '').split('?')[0];
    if (!path) { location.replace(roleInfo[getRole()].home); return; }
    const [top, ...rest] = path.split('/');
    const slug = decodeURIComponent(rest.join('/'));
    if (path !== lastPath) { A.menu = false; A.modal = null; M.confirm = ''; if (top === 'perfil') { P.screen = 'view'; P.saved = false; } }

    let html;
    if (top === 'admin') html = guard('admin', renderAdmin(slug || 'dashboard'));
    else if (top === 'motorista' || top === 'aluno') html = guard(top, renderMobile(top, slug || 'inicio'));
    else if (top === 'perfil') { const r = slug === 'motorista' || slug === 'aluno' ? slug : 'admin'; html = guard(r, renderProfile(r)); }
    else if (top === 'acesso') html = renderAccess(slug || 'login');
    else if (top === 'estado') html = renderSystem(slug || '404');
    else html = renderSystem('404');

    document.getElementById('app').innerHTML = html;
    document.title = `${titles[top] || 'BusPoint'} — BusPoint`;
    renderSwitcher(top);
    if (path !== lastPath) window.scrollTo(0, 0);
    lastPath = path;
  }

  /* ---------------- Eventos (delegação) ---------------- */
  document.addEventListener('click', (e) => {
    const rowLink = e.target.closest('tr[data-href]');
    if (rowLink) { navigate(rowLink.dataset.href); return; }
    const el = e.target.closest('[data-act]');
    if (!el) return;
    // clique dentro do modal não deve fechá-lo pelo fundo
    if ((el.dataset.act === 'modal-cancel' || el.dataset.act === 'confirm-cancel') && el.classList.contains('modal-backdrop') && e.target.closest('[data-stop]')) return;
    const d = el.dataset;
    switch (d.act) {
      // Admin
      case 'menu-open': A.menu = true; render(); break;
      case 'menu-close': A.menu = false; render(); break;
      case 'notify': toast('Nenhuma nova notificação.'); break;
      case 'inactivate': A.modal = d.id; render(); break;
      case 'modal-cancel': A.modal = null; render(); break;
      case 'modal-confirm': A.disabled.push(A.modal); A.modal = null; render(); toast('Registro inativado com sucesso.'); break;
      case 'stop-remove': A.stops.splice(Number(d.i), 1); keepFormAndRender(); break;
      case 'stop-add': {
        const inp = document.getElementById('bp-new-stop');
        const v = inp && inp.value.trim();
        if (v) { A.stops.push(v); keepFormAndRender(); const n = document.getElementById('bp-new-stop'); if (n) n.focus(); }
        break;
      }
      case 'link-toggle': {
        const on = A.linked.includes(d.name);
        A.linked = on ? A.linked.filter((x) => x !== d.name) : [...A.linked, d.name];
        render(); toast(on ? 'Vínculo removido.' : 'Vínculo realizado com sucesso.');
        break;
      }
      // Motorista / aluno
      case 'trip-ask': M.confirm = d.kind; render(); break;
      case 'confirm-cancel': M.confirm = ''; render(); break;
      case 'confirm-ok': {
        const start = M.confirm === 'start';
        M.tripState = start ? 'Em andamento' : 'Finalizada'; M.confirm = '';
        render(); toast(start ? 'Viagem iniciada.' : 'Viagem finalizada.', true);
        break;
      }
      case 'pass': {
        M.passengers[d.id] = d.status;
        const s = students.find((x) => x.id === d.id);
        render(); toast(`${d.status === 'Embarcado' ? 'Embarque' : 'Desembarque'} de ${s ? s.name : ''} registrado.`, true);
        break;
      }
      case 'req-new': M.sent = false; render(); break;
      case 'toast-close': document.getElementById('bp-toast').innerHTML = ''; break;
      // Acesso
      case 'pw-toggle': {
        const inp = document.getElementById('bp-pw');
        const show = inp.type === 'password';
        inp.type = show ? 'text' : 'password';
        el.setAttribute('aria-label', show ? 'Ocultar senha' : 'Mostrar senha');
        el.innerHTML = I(show ? 'eye-off' : 'eye');
        break;
      }
      // Perfil
      case 'screen': P.screen = d.screen; render(); break;
      case 'photo': showSaved(); break;
      // Troca de usuário
      case 'sw-toggle': switcherOpen = !switcherOpen; renderSwitcher(); break;
      case 'sw-pick': setRole(d.role); switcherOpen = false; navigate(roleInfo[d.role].home); break;
    }
  });

  // Mantém o que foi digitado no formulário de rota ao adicionar/remover pontos
  function keepFormAndRender() {
    const form = document.querySelector('form[data-form="admin"]');
    const values = form ? Array.from(form.querySelectorAll('[name]')).map((x) => [x.name, x.value]) : [];
    render();
    const nf = document.querySelector('form[data-form="admin"]');
    if (nf) values.forEach(([n, v]) => { const x = nf.querySelector(`[name="${n}"]`); if (x) x.value = v; });
  }

  function showSaved() {
    P.saved = true; render();
    clearTimeout(savedTimer);
    savedTimer = setTimeout(() => { P.saved = false; if (location.hash.startsWith('#/perfil')) render(); }, 4000);
  }

  document.addEventListener('input', (e) => {
    const t = e.target;
    if (t.dataset && t.dataset.input === 'query') { A.query = t.value; refreshList(); }
  });
  document.addEventListener('change', (e) => {
    const t = e.target;
    if (t.dataset && t.dataset.input === 'filter') { A.filter = t.value; refreshList(); }
  });
  function refreshList() { const box = document.getElementById('bp-list'); if (box && A.list) box.innerHTML = adminListBody(); }

  document.addEventListener('submit', (e) => {
    const form = e.target;
    const kind = form.dataset && form.dataset.form;
    if (!kind) return;
    e.preventDefault();
    if (kind === 'admin') {
      const sec = form.dataset.section;
      const edit = form.dataset.mode === 'editar';
      const data = {};
      form.querySelectorAll('[name]').forEach((x) => { data[x.name] = x.value; });
      if (edit) {
        const target = (datasets[sec] || []).find((r) => String(r.id) === form.dataset.id);
        if (target) Object.keys(data).forEach((k) => { if (k !== 'login') target[k] = sec === 'onibus' && k === 'capacity' ? Number(data[k]) : data[k]; });
      } else {
        const rec = Object.assign({ id: `DEMO-${Date.now()}`, status: 'Ativo' }, data);
        if (rec.name) rec.initials = rec.name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
        if (sec === 'rotas') { rec.stops = A.stops.slice(); rec.driver = '—'; rec.bus = '—'; rec.students = 0; }
        if (sec === 'onibus') { rec.capacity = Number(rec.capacity); rec.driver = '—'; rec.route = '—'; }
        if (sec !== 'onibus' && sec !== 'rotas' && !rec.route) rec.route = '—';
        datasets[sec].push(rec);
      }
      navigate(h('admin', sec));
      toast(`${cap(labels[sec] || 'registro')} ${edit ? 'atualizado' : 'cadastrado'} com sucesso.`);
    } else if (kind === 'request') {
      M.sent = true; render();
    } else if (kind === 'profile') {
      P.screen = 'view'; showSaved();
    } else if (kind === 'access') {
      const slug = form.dataset.slug;
      const pws = Array.from(form.querySelectorAll('input[type="password"][minlength]'));
      if (pws.length === 2 && pws[0].value !== pws[1].value) { document.getElementById('bp-access-err').textContent = 'As senhas não coincidem.'; return; }
      if (slug === 'login') {
        const r = form.querySelector('[name="role"]').value;
        setRole(r); navigate(roleInfo[r].home);
      } else if (slug === 'primeiro') navigate(h('acesso', 'verificar'));
      else if (slug === 'verificar') navigate(h('acesso', 'definir'));
      else navigate(h('acesso', 'sucesso'));
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && (A.modal || M.confirm || A.menu)) { A.modal = null; M.confirm = ''; A.menu = false; render(); }
  });

  window.addEventListener('hashchange', render);
  window.addEventListener('storage', (e) => { if (e.key === ROLE_KEY) render(); });
  render();
})();
