# ◈ Agent Studio

> **Atlas** lidera. 12 especialistas executam. Nada vai para produção sem aprovação.

![Claude API](https://img.shields.io/badge/Claude-Sonnet_4-blueviolet?style=flat-square)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square&logo=python)

---

## 🧠 O Time — 13 Agentes com Nome

| # | Nome | Papel | Especialidade |
|---|------|-------|---------------|
| 0 | **Atlas** | 🧠 Orquestrador | Analisa · Delega · Aprova para produção |
| 1 | **Lara** | 🎨 Product Designer Sênior | Strategy · Design Systems · Mentoria |
| 2 | **Marco** | 🔍 UX Designer Sênior | Flows · IA · Wireframes · Usabilidade |
| 3 | **Nina** | 🖌️ UI Designer Sênior | Visual · Tokens · Componentes · a11y |
| 4 | **Sofia** | 🔬 UX Researcher Sênior | Qualitativo · Quantitativo · Síntese |
| 5 | **Theo** | ✍️ UX Content Strategist | Microcopy · Voice & Tone · Copy |
| 6 | **Kai** | 📊 Engenheiro de Dados Sênior | Pipelines · dbt · Data Warehouse |
| 7 | **Rafa** | ⚙️ Full Stack / Back-end Sênior | Arquitetura · APIs · Banco de Dados |
| 8 | **Zoe** | 💻 Front-end Sênior | React · TypeScript · Performance |
| 9 | **Alex** | 🧪 QA Sênior | Testing Strategy · Automação · BDD |
| 10 | **Leo** | 📈 Analista de Produto Sênior | Métricas · Analytics · A/B Testing |
| 11 | **Max** | 🏗️ CTO | Tech Vision · Arquitetura · Cultura |
| 12 | **Bia** | 📋 Product Owner Sênior | Backlog · Priorização · Stakeholders |

---

## ✨ Features

### Core
- **Atlas como orquestrador** — analisa qualquer tarefa, decompõe, delega aos especialistas certos e controla o gate de aprovação para produção
- **Personagens com pixel art único** por agente — cada um tem seu visual no terminal
- **Animação por estado** — personagens animam quando pensando, respondendo ou aguardando

### Task Management
- **Task Board (Kanban)** — Pendente / Em progresso / Em revisão / Aprovado / Bloqueado
- **Gate de produção** — Atlas revisa todos os entregáveis antes de aprovar para produção
- **Aprovação explícita** — `approve <N>` no terminal / botão na interface web
- **Decomposição automática** — Atlas extrai subtarefas e distribui pelo time

### Interface
- **Speech bubbles** — indica quando agente está aguardando aprovação ou trabalhando
- **Office view** — visão do escritório com todos os 13 personagens e status em tempo real
- **Notificações** — toast quando agente responde
- **Histórico persistente** — estado de tasks salvo em `~/.agent_studio_state.json`

### Checkout Builder (caso de uso)
Exemplo de tarefa para o Atlas:
```
task Preciso construir um checkout builder com drag-drop
```
Atlas cria automaticamente o plano com fases paralelas, atribui para Lara, Marco, Nina, Zoe, Rafa, Alex, Leo e Bia — com gate de aprovação antes de qualquer push para produção.

---

## 🚀 Como rodar

### Web (React)
```bash
npm install
cp .env.example .env
# Adicione: VITE_ANTHROPIC_API_KEY=sk-ant-...
npm run dev
# → http://localhost:3000
```

### Terminal (Python)
```bash
pip install anthropic rich
export ANTHROPIC_API_KEY=sk-ant-...
python pixel_agents.py
```

---

## 🎮 Comandos no Terminal

| Comando | Ação |
|---------|------|
| `0` | Seleciona Atlas (orquestrador) |
| `1-12` | Seleciona especialista |
| `task <descrição>` | Atlas analisa e cria plano de execução |
| `<N> <mensagem>` | Ex: `8 implementa drag-drop com dnd-kit` |
| `tasks` | Lista todas as tasks com status |
| `approve <N>` | Aprova task N para produção |
| `clear` | Limpa histórico do agente ativo |
| `q` | Sair |

---

## ⚠️ Segurança

A API key fica no `.env` local. Para deploy compartilhado, use um backend intermediário (Next.js API Route ou Edge Function) que nunca exponha a key no client.

---

## 🛠️ Stack

**Terminal:** Python 3.10+ · anthropic · rich

**Web:** React 18 · Vite 6 · TypeScript · Anthropic API

---

MIT License
