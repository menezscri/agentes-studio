# 🤖 Agent Studio

Framework multi-agente com **12 especialistas de produto e tecnologia**, powered by Anthropic API (Claude).

---

## 🎮 Pixel Agents — Terminal Interativo

> Converse com os 12 agentes em pixel art direto no seu terminal!

```
╔══════════════════════════════════════════════════════════╗
║            🎮 PIXEL AGENTS STUDIO 🎮                    ║
║       12 Especialistas em Arte Pixel no Terminal         ║
╚══════════════════════════════════════════════════════════╝

  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
  │🎨 DESIGN    │ │🔍 UX        │ │🖌️ UI        │ │🔬 RESEARCH  │
  │  ░▓▓▓░     │ │  ░▓▓▓░     │ │  ░▓▓▓░     │ │  ░▓▓▓░     │
  │ ▓█████▓    │ │ ▓█████▓    │ │ ▓█████▓    │ │ ▓█████▓    │
  │  ░███░     │ │  ░███░     │ │  ░███░     │ │  ░███░     │
  │▶ FALANDO   │ │  aguard.   │ │  aguard.   │ │  aguard.   │
  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
```

### ⚡ Como rodar o Pixel Agents (terminal local)

```bash
# 1. Clone o repositório
git clone https://github.com/menezscri/agentes-studio.git
cd agentes-studio

# 2. Instale as dependências Python
pip install -r requirements.txt

# 3. Configure sua API key
export ANTHROPIC_API_KEY=sk-ant-...

# 4. Rode!
python pixel_agents.py
```

### 🕹️ Comandos no terminal

| Comando | O que faz |
|---------|-----------|
| `1` a `12` | Seleciona o agente |
| `ask <pergunta>` | Pergunta ao agente ativo |
| `<número> <mensagem>` | Seleciona e pergunta em um comando (ex: `3 como criar um sistema de cores?`) |
| `clear` | Limpa o histórico do agente ativo |
| `q` | Sai |

> **Onde rodar?** No seu terminal local (Mac, Linux ou Windows com WSL).
> O GitHub Actions **não** suporta interfaces interativas — você precisa rodar localmente.

---

## 🌐 Agent Studio — Interface Web (React)

Prefere uma interface visual no browser? O Agent Studio React também está neste repositório.

### Como rodar o Web

```bash
npm install
cp .env.example .env
# Adicione: VITE_ANTHROPIC_API_KEY=sk-ant-...
npm run dev
```

---

## 👥 Os 12 Agentes

| # | Agente | Pixel | Especialidade |
|---|--------|-------|--------------|
| 1 | 🎨 Product Designer Sênior | magenta | Estratégia de design, design systems, mentoria |
| 2 | 🔍 UX Designer | azul | Jornadas, arquitetura de informação, usabilidade |
| 3 | 🖌️ UI Designer | ciano | Design visual, tipografia, sistemas de componentes |
| 4 | 🔬 UX Researcher | verde | Research qualitativo e quantitativo, síntese |
| 5 | ✍️ UX Content | amarelo | Microcopy, voz e tom, conteúdo estratégico |
| 6 | 📊 Engenheiro de Dados | ciano escuro | Pipelines, data warehouse, analytics |
| 7 | ⚙️ Full Stack / Back-end | cinza | Arquitetura, APIs, sistemas distribuídos |
| 8 | 💻 Front-end Sênior | azul escuro | React, performance, acessibilidade |
| 9 | 🧪 QA Sênior | vermelho | Estratégia de testes, automação, qualidade |
| 10 | 📈 Analista de Produto | roxo | Métricas, analytics, decisões baseadas em dados |
| 11 | 🏗️ CTO | branco | Visão técnica, arquitetura, liderança |
| 12 | 📋 Product Owner Sênior | verde escuro | Backlog, priorização, frameworks ágeis |

---

## 🏗️ Estrutura do projeto

```
agentes-studio/
├── pixel_agents.py       # 🎮 Terminal interativo com pixel art
├── requirements.txt      # Dependências Python
├── src/
│   ├── AgentStudio.jsx  # Interface React web
│   ├── main.jsx
│   └── index.css
├── .env.example
├── index.html
├── package.json
└── vite.config.js
```

## 🛠️ Tech Stack

**Terminal (Python):** `anthropic` + `rich` + `blessed`

**Web (React):** `React 18` + `Vite` + `Anthropic SDK` + `Lucide React`

---

Feito com ❤️ e Claude API
