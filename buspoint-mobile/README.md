# BusPoint — React Native (Expo)

Conversão do **protótipo web BusPoint** (HTML/CSS/JS) e da **API BusPoint** (Spring Boot + PostgreSQL)
para um único projeto JavaScript/React Native:

| Parte | Onde | O que é |
| --- | --- | --- |
| Front-end | `App.js`, `src/` | App React Native (Expo SDK 57) com todas as telas e a identidade visual do protótipo |
| Back-end | `backend/` | Porta da API Java: mesmas entidades, regras de negócio, validações, mensagens de erro e endpoints `/api/...` |

O back-end roda de duas formas, com **o mesmo código**:

1. **No aparelho (padrão)** — o app executa a API internamente e salva os dados no AsyncStorage. Funciona offline, sem configurar nada.
2. **Servidor Node** — `backend/server.js` expõe a API via HTTP (sem dependências além do `bcryptjs`). No app, toque em
   **“Conexão: … · Alterar”** na tela de login e informe o endereço do servidor.

## Como rodar

```bash
cd buspoint-mobile
npm install
npx expo start          # abra no Expo Go (Android/iOS), emulador, ou tecle "w" para o navegador
```

Servidor da API (opcional):

```bash
npm run server          # http://localhost:8080/api  (dados em backend/data/buspoint-db.json)
# variáveis: PORT, BUSPOINT_DB (arquivo do banco), BUSPOINT_DEMO=1 (habilita "Entrar como" e restaurar dados)
```

> No celular físico use o IP da máquina (ex.: `http://192.168.0.10:8080`), não `localhost`.

### Usuários de demonstração

| Perfil | Login | Senha |
| --- | --- | --- |
| Administrador | `admin` | `admin123` |
| Motorista | `carlos.mendes` (também `roberto.almeida`, `fernanda.ribeiro`) | `motorista123` |
| Aluno | `joao.silva` (também `maria.souza`, `ana.costa`, `pedro.lima`, `luiza.oliveira`) | `aluno123` |

Na tela de login há atalhos **Entrar como** e, dentro do app, o botão flutuante **Trocar usuário**
(com a opção **Restaurar dados de demonstração**).

## Telas

| Área | Telas |
| --- | --- |
| Acesso | Splash, login, primeiro acesso → verificar identidade → definir senha → sucesso, recuperar senha |
| Administrador | Visão geral (indicadores em tempo real, viagens de hoje, últimos registros, atividade, solicitações de horário), alunos, motoristas, ônibus, rotas, viagens — listar/buscar/filtrar, cadastrar, editar, detalhes, inativar/reativar; pontos de parada da rota; vincular aluno (com ponto de embarque), motorista e ônibus à rota; nova viagem; monitoramento de embarques e desembarques; histórico |
| Motorista | Início, minha rota, horários, meus alunos, meu ônibus, viagem atual (iniciar, registrar embarque/desembarque, desfazer com justificativa, encerrar com observação) |
| Aluno | Início, matrícula, minha rota, horários, ônibus, histórico de transporte, solicitar alteração de horário |
| Comuns | Meu perfil (editar dados, alterar senha, foto), estados 403/404/500 etc. |

No celular o painel admin usa menu em gaveta; em tablet/web aparece a barra lateral fixa, como no protótipo.

## Regras portadas da API Java

- Cadastro de usuários com herança (usuario + aluno/motorista/administrador), senha com **bcrypt** (limite de 72 bytes),
  e-mail/login/matrícula/CNH únicos, edição sem alterar senha, desativação lógica.
- Ônibus com placa única em maiúsculas e capacidade > 0.
- Rotas e pontos de parada com ordem única por rota.
- Matrícula: impede duplicidade e **conflito de horário** entre rotas ativas do aluno.
- Viagem: `PENDENTE → EM_ANDAMENTO → FINALIZADA`; finalizar com alunos a bordo **exige observação**.
- Registro de transporte: só em viagem em andamento, aluno com matrícula ativa na rota, sem duplicidade,
  sem embarque simultâneo em outra viagem, respeitando a **capacidade do ônibus**, desembarque só após embarque,
  invalidação com justificativa (embarque só depois de invalidar o desembarque).
- Respostas de erro no mesmo formato do `GlobalExceptionHandler` (`dataHora`, `status`, `erro`, `mensagem`/`campos`, `caminho`).

### Extensões (necessárias para as telas do protótipo)

Autenticação por token (`/api/auth/*`) com controle de perfil, dados da própria conta (`/api/usuarios/me`),
motorista/ônibus padrão por rota, ponto de embarque na matrícula, solicitações de alteração de horário,
reativar alunos/motoristas/rotas e filtros em `GET /api/viagens`. O SQL dessas tabelas está em
`backend/sql/extensoes.sql` (o script original está em `backend/sql/BusPoint-banco.sql`).

## Estrutura

```
buspoint-mobile/
├── App.js                  # fontes, provedores e roteamento por perfil
├── backend/                # API (compartilhada entre app e servidor)
│   ├── router.js           # endpoints REST + tratamento de erros
│   ├── services/           # regras de negócio (alunos, motoristas, ônibus, rotas, matrículas, viagens, registros...)
│   ├── database.js, seed.js
│   ├── server.js           # servidor HTTP Node
│   └── sql/
└── src/
    ├── api/client.js       # chamadas à API (local ou HTTP)
    ├── data/               # carregamento e montagem dos dados das telas
    ├── navigation/router.js
    ├── state/session.js
    ├── screens/            # acesso, admin, motorista/aluno, perfil, estados
    ├── ui/                 # componentes (botão, card, tabela, modal, toast, ícones Lucide)
    └── theme.js            # cores (convertidas do oklch do CSS), fontes DM Sans e Sora
```

## Verificação

`npx eslint .` sem avisos; bundles web, Android e iOS (Hermes) gerados com `npx expo export`.
