# BusPoint — versão web em HTML + CSS

Conversão do protótipo BusPoint (originalmente React + TanStack Start + Tailwind) para
**HTML, CSS e JavaScript puros**. Não precisa de Node.js, `npm install` nem build:
basta abrir o `index.html` no navegador (ou publicar a pasta em qualquer hospedagem estática).

## Estrutura

```
buspoint/
├── index.html          # página única
└── assets/
    ├── styles.css      # todo o visual (substitui o Tailwind)
    ├── app.js          # telas, dados de demonstração, rotas e interações
    ├── icons.js        # ícones Lucide embutidos em SVG
    └── favicon.ico
```

## Telas (endereços)

| Área | Endereços |
| --- | --- |
| Acesso | `#/acesso/login`, `#/acesso/primeiro`, `#/acesso/verificar`, `#/acesso/definir`, `#/acesso/resetar`, `#/acesso/sucesso`, `#/acesso/splash` |
| Administrador | `#/admin/dashboard`, `#/admin/alunos`, `#/admin/motoristas`, `#/admin/onibus`, `#/admin/rotas`, `#/admin/viagens`, `#/admin/embarques`, `#/admin/desembarques`, `#/admin/historico` — com `/novo`, `/editar/ID`, `/detalhes/ID` e `rotas/vincular-aluno|motorista|onibus/ID` |
| Motorista | `#/motorista/inicio`, `minha-rota`, `horarios`, `alunos`, `onibus`, `viagem` |
| Aluno | `#/aluno/inicio`, `matricula`, `minha-rota`, `horarios`, `onibus`, `historico`, `solicitacao` |
| Comuns | `#/perfil/admin|motorista|aluno`, `#/estado/403|404|500|carregando|vazio|sucesso|erro` |

Use o botão **Trocar usuário** (canto inferior direito) para alternar entre Administrador,
Motorista e Aluno. O perfil escolhido fica salvo no navegador.

## Limites da demonstração

Os dados são fictícios e ficam apenas na memória da página: cadastros, edições, vínculos e
registros de viagem somem ao recarregar. Não há autenticação real.
