/* Configuração das seções do painel administrativo (menus, colunas e formulários). */
export const ADMIN_NAV = [
  ['Visão geral', 'dashboard', 'layout-dashboard'],
  ['Alunos', 'alunos', 'graduation-cap'],
  ['Motoristas', 'motoristas', 'users'],
  ['Ônibus', 'onibus', 'bus-front'],
  ['Rotas', 'rotas', 'route'],
  ['Viagens', 'viagens', 'calendar-days'],
  ['Embarques', 'embarques', 'arrow-up-right'],
  ['Desembarques', 'desembarques', 'arrow-down-right'],
  ['Histórico', 'historico', 'file-clock'],
];

export const NAMES = {
  dashboard: 'Visão geral', alunos: 'Alunos', motoristas: 'Motoristas', onibus: 'Ônibus', rotas: 'Rotas',
  viagens: 'Viagens', embarques: 'Embarques', desembarques: 'Desembarques', historico: 'Histórico de viagens',
};

export const LABELS = { alunos: 'aluno', motoristas: 'motorista', onibus: 'ônibus', rotas: 'rota', viagens: 'viagem' };

// Endpoints da API por seção
export const ENDPOINT = { alunos: '/api/alunos', motoristas: '/api/motoristas', onibus: '/api/onibus', rotas: '/api/rotas', viagens: '/api/viagens' };

// [rótulo, chave, largura, destaque]
export const COLUMNS = {
  alunos: [['Aluno', 'name', 230], ['Matrícula', 'enrollment', 120], ['Período', 'period', 100], ['Rota', 'route', 170, true], ['Status', 'status', 110]],
  motoristas: [['Motorista', 'name', 230], ['CNH', 'license', 140], ['Categoria', 'category', 100], ['Validade', 'validity', 120], ['Rota atual', 'route', 170], ['Status', 'status', 110]],
  onibus: [['Placa', 'plate', 120, true], ['Capacidade', 'capacity', 120], ['Motorista atual', 'driver', 180], ['Rota atual', 'route', 170], ['Status', 'status', 110]],
  rotas: [['Rota', 'name', 170, true], ['Tipo', 'type', 120], ['Horário inicial', 'start', 130], ['Horário final', 'end', 120], ['Motorista', 'driver', 170], ['Ônibus', 'bus', 110], ['Alunos', 'students', 90], ['Status', 'status', 110]],
  viagens: [['Viagem', 'code', 110, true], ['Data', 'date', 110], ['Rota', 'route', 150, true], ['Motorista', 'driver', 170], ['Ônibus', 'bus', 110], ['Início', 'start', 90], ['Fim', 'end', 90], ['Status', 'status', 130]],
};

export const FILTERS = {
  alunos: ['Todos', 'Ativo', 'Inativo'],
  motoristas: ['Todos', 'Ativo', 'Inativo'],
  onibus: ['Todos', 'Ativo', 'Inativo'],
  rotas: ['Todos', 'Ativa', 'Inativa'],
  viagens: ['Todos', 'Pendente', 'Em andamento', 'Finalizada'],
};

const STATUS_M = { label: 'Status', key: '_status', options: ['Ativo', 'Inativo'] };
const STATUS_F = { label: 'Status', key: '_status', options: ['Ativa', 'Inativa'] };
const SENHA = { label: 'Senha inicial', key: 'senhaUsuario', type: 'password', onlyNew: true, placeholder: 'Mínimo de 8 caracteres' };

// Campos dos formulários — as chaves são os mesmos nomes de campo da API
export const FORM_FIELDS = {
  alunos: [
    { label: 'Nome', key: 'nomeUsuario' },
    { label: 'E-mail', key: 'emailUsuario', type: 'email' },
    { label: 'Telefone', key: 'telefoneUsuario', type: 'tel' },
    { label: 'Login', key: 'loginUsuario', type: 'login' },
    { label: 'Número da matrícula', key: 'numeroMatricula', type: 'number' },
    { label: 'Período', key: 'periodo', options: ['Manhã', 'Tarde', 'Noite'] },
    STATUS_M, SENHA,
  ],
  motoristas: [
    { label: 'Nome', key: 'nomeUsuario' },
    { label: 'E-mail', key: 'emailUsuario', type: 'email' },
    { label: 'Telefone', key: 'telefoneUsuario', type: 'tel' },
    { label: 'Login', key: 'loginUsuario', type: 'login' },
    { label: 'Número da CNH', key: 'numeroCnh', type: 'number' },
    { label: 'Categoria da CNH', key: 'categoriaCnh', options: ['D', 'E', 'C', 'B'] },
    { label: 'Validade da CNH', key: 'validadeCnh', type: 'date' },
    STATUS_M, SENHA,
  ],
  onibus: [
    { label: 'Placa', key: 'placaOnibus', type: 'plate' },
    { label: 'Capacidade', key: 'capacidadeOnibus', type: 'number' },
    STATUS_M,
  ],
  rotas: [
    { label: 'Nome da rota', key: 'nomeRota' },
    { label: 'Tipo', key: 'tipo', options: ['Ida e volta', 'Ida', 'Volta'] },
    { label: 'Horário de início', key: 'horarioInicio', type: 'time' },
    { label: 'Horário de fim', key: 'horarioFim', type: 'time' },
    STATUS_F,
  ],
  viagens: [
    { label: 'Data da viagem', key: 'dataViagem', type: 'date' },
    { label: 'Horário de início', key: 'horaInicio', type: 'time' },
    { label: 'Rota', key: 'idRota', ref: 'rotas' },
    { label: 'Motorista', key: 'idMotorista', ref: 'motoristas' },
    { label: 'Ônibus', key: 'idOnibus', ref: 'onibus' },
  ],
};
