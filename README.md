# 🤖 Agent Studio

Framework multi-agente com **12 especialistas de produto e tecnologia**, powered by Anthropic API (Claude).

## 🎯 O que é o Agent Studio?

O Agent Studio é um app React que simula um ambiente multi-agente onde você pode conversar com 12 especialistas distintos, cada um com sua própria persona, metodologia, frameworks e forma de estruturar respostas — tudo em português brasileiro.

## 👥 Os 12 Agentes

| Agente | Especialidade |
|--------|--------------|
| 🎨 Product Designer Sênior | Estratégia de design, design systems, mentoria |
| 🔍 UX Designer | Jornadas, arquitetura de informação, usabilidade |
| 🖌️ UI Designer | Design visual, tipografia, sistemas de componentes |
| 🔬 UX Researcher | Research qualitativo e quantitativo, síntese de dados |
| ✍️ UX Content | Microcopy, voz e tom, conteúdo estratégico |
| 📊 Engenheiro de Dados Sênior | Pipelines, data warehouse, analytics |
| ⚙️ Full Stack / Back-end Sênior | Arquitetura, APIs, sistemas distribuídos |
| 💻 Front-end Sênior | React, performance, acessibilidade |
| 🧪 QA Sênior | Estratégia de testes, automação, qualidade |
| 📈 Analista de Produto Sênior | Métricas, analytics, decisões baseadas em dados |
| 🏗️ CTO | Visão técnica, arquitetura, liderança de engenharia |
| 📋 Product Owner Sênior | Backlog, priorização, frameworks ágeis |

## 🚀 Como usar

### Pré-requisitos

- Node.js 18+
- Chave de API da Anthropic

### Instalação

```bash
git clone https://github.com/menezscri/agentes-studio.git
cd agentes-studio
npm install
cp .env.example .env
# Edite o .env e coloque: VITE_ANTHROPIC_API_KEY=sk-ant-...
npm run dev
```

## 🏗️ Estrutura do projeto

```
agentes-studio/
├── src/
│   ├── AgentStudio.jsx      # Componente principal com os 12 agentes
│   ├── main.jsx             # Entry point
│   └── index.css            # Estilos globais
├── .env.example             # Template de variáveis de ambiente
├── index.html               # HTML base
├── package.json             # Dependências
└── vite.config.js           # Configuração do Vite
```

## 🤖 Como funciona

Cada agente mantém seu próprio **histórico de conversa independente**. Você alterna entre eles pela sidebar sem perder o contexto de nenhuma conversa.

Cada agente tem:
- System prompt robusto de 400-600 palavras
- Persona, competências e metodologias próprias
- Frameworks e artefatos específicos da área
- Sugestões de perguntas para começar rápido

## 🛠️ Tech Stack

- **React 18** com Vite
- **Anthropic SDK** (claude-sonnet)
- **Lucide React** para ícones
- Design system próprio com tema dark

## 📝 Licença

MIT — feito com ❤️ e Claude API
