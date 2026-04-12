# SplitZ — Expense Sharing App

Mobile web app para dividir gastos com amigos, inspirado no Splitwise.

## Stack

| Camada | Tecnologia |
|---|---|
| Backend | Python 3.11 (stdlib only) |
| Banco de dados | SQLite (via `sqlite3` builtin) |
| Autenticação | JWT HS256 (pure Python) |
| Frontend | Vanilla JS SPA |
| UI | CSS custom design system (dark B&W) |

## Iniciar

```bash
cd expense-app
./start.sh
# ou
python3 server.py
```

Acesse `http://localhost:3000` no navegador.

**Para usar no celular:** conecte ao mesmo Wi-Fi e abra `http://<IP-LOCAL>:3000`.

## Funcionalidades

- **Autenticação**: cadastro e login com JWT
- **Amigos**: adicionar por e-mail, pedidos de amizade
- **Grupos**: criar grupos, adicionar membros
- **Despesas**: adicionar com 3 tipos de divisão:
  - **Igualitária**: divide automaticamente
  - **Valor exato**: cada pessoa define seu valor
  - **Porcentagem**: define a % de cada um
- **Saldos**: quem deve quanto para quem (algoritmo de mínimas transações)
- **Acerto**: registrar pagamentos
- **Atividade**: feed de ações recentes

## Estrutura

```
expense-app/
├── server.py        # HTTP server + todas as rotas da API
├── database.py      # Schema SQLite + helpers de conexão
├── auth.py          # JWT + hashing de senha (PBKDF2-HMAC-SHA256)
├── balance.py       # Algoritmo de cálculo de saldos
├── start.sh         # Script de inicialização
├── data/
│   └── splitz.db    # Banco SQLite (criado automaticamente)
└── static/
    ├── index.html   # SPA shell
    ├── css/
    │   └── app.css  # Design system completo
    └── js/
        ├── api.js          # Cliente HTTP
        ├── components.js   # Componentes UI reutilizáveis
        ├── app.js          # Router + App state
        └── pages/
            ├── auth.js
            ├── dashboard.js
            ├── groups.js
            ├── expenses.js
            ├── friends.js
            └── activity.js
```

## API

```
POST /api/auth/register      POST /api/auth/login         POST /api/auth/logout
GET  /api/users/me           PATCH /api/users/me

GET  /api/friends            POST /api/friends
GET  /api/friends/requests   PATCH /api/friends/requests
DELETE /api/friends/:id

GET  /api/groups             POST /api/groups
GET  /api/groups/:id         PATCH /api/groups/:id        DELETE /api/groups/:id
POST /api/groups/:id/members DELETE /api/groups/:id/members
GET  /api/groups/:id/expenses
GET  /api/groups/:id/balances
POST /api/groups/:id/settle

GET  /api/expenses           POST /api/expenses
GET  /api/expenses/:id       PATCH /api/expenses/:id      DELETE /api/expenses/:id

GET  /api/activity
```

Todos os valores monetários são em **centavos** (inteiros).
