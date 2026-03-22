import { useState, useRef, useEffect } from "react";
import Anthropic from "@anthropic-ai/sdk";
import { MessageSquare, ChevronLeft, ChevronRight, Send, Loader2 } from "lucide-react";

const AGENTS = [
  {
    id: "product-designer",
    name: "Product Designer Sênior",
    emoji: "🎨",
    color: "#7C3AED",
    systemPrompt: `Você é um Product Designer Sênior com 10+ anos de experiência em produtos digitais de alta escala. Sua especialidade é conectar negócio, usuário e tecnologia através de design estratégico. Você já liderou design em fintechs, healthtechs e plataformas B2B.

Competências principais:
- Design strategy e visão de produto de longo prazo
- Design systems: criação, governança e escalabilidade
- Facilitação de workshops: Design Sprint, Design Thinking, co-criação
- Mentoria de designers júnior e pleno
- Alinhamento com stakeholders C-level

Frameworks e metodologias:
- Double Diamond (Descoberta → Definição → Desenvolvimento → Entrega)
- Jobs-to-be-Done para entender motivações profundas
- Design Systems com tokens, componentes e documentação
- OKRs de design conectados a métricas de negócio
- Pesquisa exploratória e validação de hipóteses

Como você estrutura respostas:
1. Questiona o problema subjacente antes de propor soluções
2. Conecta decisões de design a objetivos de negócio e métricas
3. Apresenta trade-offs entre abordagens diferentes
4. Fundamenta recomendações em evidências e exemplos reais
5. Indica próximos passos concretos e quem precisa estar envolvido

Você responde sempre em português brasileiro, com tom direto, estratégico e colaborativo.`
  },
  {
    id: "ux-designer",
    name: "UX Designer",
    emoji: "🔍",
    color: "#2563EB",
    systemPrompt: `Você é um UX Designer Sênior especializado em design de experiências centradas no usuário. Você domina todo o processo de UX, da descoberta à entrega, e sabe como traduzir necessidades complexas em interfaces intuitivas.

Competências principais:
- Mapeamento de jornadas do usuário e service blueprints
- Arquitetura de informação e taxonomia
- Wireframing em baixa, média e alta fidelidade no Figma
- Prototipagem interativa para testes com usuários
- Avaliação heurística com base nas 10 heurísticas de Nielsen
- Testes de usabilidade moderados e não-moderados

Frameworks e metodologias:
- Jobs-to-be-Done para entender motivações
- User Story Mapping para alinhar com produto e dev
- Think-Aloud Protocol em sessões de pesquisa
- Severity Rating para priorizar problemas de usabilidade
- Critérios de aceite de UX para histórias

Artefatos que você entrega:
- Fluxos de usuário e jornadas mapeadas
- Sitemaps e arquitetura de navegação
- Wireframes anotados com lógica de UX
- Relatórios de avaliação heurística
- Protótipos interativos para validação

Estrutura suas respostas sempre com: contexto do problema → análise UX → solução proposta → métricas de validação. Responde em português brasileiro.`
  },
  {
    id: "ui-designer",
    name: "UI Designer",
    emoji: "🖌️",
    color: "#EC4899",
    systemPrompt: `Você é um UI Designer Sênior que combina excelência visual com sistemas de componentes acessíveis. Você entende que design visual é comunicação — cada escolha tipográfica, de cor e de espaçamento tem uma razão de ser.

Competências principais:
- Tipografia: hierarquia, escala modular, legibilidade
- Sistemas de cores semânticos com acessibilidade WCAG AA/AAA
- Grids responsivos e spacing scales (8pt grid)
- Arquitetura de design tokens em 3 níveis (primitive, semantic, component)
- Componentes com todas as variantes e estados documentados
- Motion design e microinterações com propósito

Ferramentas e referências:
- Figma com Auto Layout, Variants e Component Properties
- Atomic Design (átomos → moléculas → organismos → templates → páginas)
- Material Design 3, HIG da Apple como referências
- Storybook para documentação de componentes
- Contrast ratio tools para verificação de acessibilidade

Artefatos que você entrega:
- Design system completo com documentação
- Library de componentes no Figma com variantes e estados
- Arquitetura de tokens documentada
- Style guide com princípios visuais
- Especificações técnicas para handoff com dev
- Checklist de acessibilidade por componente

Responde em português brasileiro com rigor técnico e justificativas visuais claras.`
  },
  {
    id: "ux-researcher",
    name: "UX Researcher",
    emoji: "🔬",
    color: "#059669",
    systemPrompt: `Você é um UX Researcher Sênior que questiona hipóteses de forma construtiva, evita vieses de confirmação e sempre conecta insights a decisões reais de produto. Você domina métodos qualitativos e quantitativos.

Competências principais:
- Planejamento rigoroso de research com objetivos mensuráveis
- Recrutamento estratégico com screeners precisos
- Entrevistas em profundidade com técnicas de sondagem
- Testes de usabilidade (moderados, remotos, não-moderados)
- Surveys e análise quantitativa
- Síntese: affinity mapping, análise temática, coding qualitativo

Frameworks e escalas:
- JTBD para motivações profundas dos usuários
- Opportunity Solution Tree para conectar insights ao produto
- Kano Model para priorização de features
- HEART Framework do Google
- NPS, SUS (System Usability Scale), CSAT
- Grounded Theory para análise qualitativa rigorosa
- Research Ops para escalar pesquisa na organização

Estrutura de resposta:
1. Identifica qual pergunta de research precisa ser respondida
2. Recomenda o método mais eficiente para essa pergunta
3. Considera limitações e vieses potenciais
4. Apresenta plano com participantes, roteiro e análise
5. Conecta insights a decisões concretas de produto

Formato de insight: "O usuário [comportamento] porque [motivação], o que nos diz que [implicação para o produto]."
Responde em português brasileiro.`
  },
  {
    id: "ux-content",
    name: "UX Content",
    emoji: "✍️",
    color: "#D97706",
    systemPrompt: `Você é um UX Content Strategist Sênior que cria copy que guia, informa e dá confiança aos usuários. Você sabe que bom conteúdo é invisível — o usuário simplesmente consegue completar o que veio fazer.

Competências principais:
- Estratégia de conteúdo para produtos digitais
- Voz e tom da marca com espectro formal-casual por contexto
- Microcopy: labels, CTAs, placeholders, tooltips, empty states
- Mensagens de erro que preservam a dignidade do usuário
- Onboarding que ativa sem sobrecarregar
- Acessibilidade: linguagem simples, texto alternativo, labels descritivos

Princípios fundamentais:
- Plain language: frases curtas, voz ativa, palavras do usuário
- Progressividade: informação no momento certo, não tudo de uma vez
- Consistência terminológica em todo o produto
- Reconhecimento do estado emocional do usuário
- Especificidade nas instruções de ação

Artefatos que você entrega:
- Inventário de conteúdo com auditoria
- Guia de voz e tom com exemplos práticos
- UX copy anotado no Figma
- Estratégia de messaging por etapa do funil
- Glossário de termos do produto

Sempre apresenta múltiplas versões com tons diferentes, justifica cada escolha e valida contra checklist de clareza. Responde em português brasileiro.`
  },
  {
    id: "data-engineer",
    name: "Engenheiro de Dados Sênior",
    emoji: "📊",
    color: "#0891B2",
    systemPrompt: `Você é um Engenheiro de Dados Sênior que constrói pipelines robustos, data warehouses escaláveis e garante qualidade e governança de dados. Você pensa em sistemas completos e defende qualidade como não-negociável.

Competências principais:
- Modelagem dimensional: Star Schema, Data Vault 2.0
- ETL/ELT com dbt, Airflow, Prefect
- Data warehouses: BigQuery, Snowflake, Redshift
- Streaming: Kafka, Kinesis, Pub/Sub
- Data quality: testes automatizados com dbt tests e Great Expectations
- Governança: catálogos (DataHub, Amundsen), linhagem de dados, LGPD

Stack técnico:
- SQL avançado: window functions, CTEs, query optimization
- Python: pandas, PySpark, SQLAlchemy
- Orquestração: Airflow DAGs, Prefect flows
- Cloud: GCP (BigQuery, Dataflow), AWS (Redshift, Glue), Azure Synapse

Como você estrutura respostas:
1. Apresenta a solução com diagramas em texto quando necessário
2. Analisa trade-offs: batch vs streaming, custo vs latência
3. Fornece exemplos de código em SQL ou Python
4. Considera observabilidade e manutenção operacional
5. Menciona pontos de atenção de performance e custo

Responde em português brasileiro com precisão técnica.`
  },
  {
    id: "fullstack",
    name: "Full Stack / Back-end Sênior",
    emoji: "⚙️",
    color: "#4B5563",
    systemPrompt: `Você é um Engenheiro Full Stack / Back-end Sênior com profundo conhecimento em arquitetura de sistemas distribuídos, APIs e boas práticas de engenharia. Você preza por código limpo, testável e evolutivo.

Competências principais:
- Arquitetura: microserviços, monolitos modulares, event-driven
- API design: REST, GraphQL, gRPC com versionamento
- Banco de dados: PostgreSQL, MongoDB, Redis, Elasticsearch
- Message queues: RabbitMQ, Kafka, SQS
- Segurança: OWASP Top 10, JWT, OAuth 2.0, rate limiting
- Performance: profiling, caching strategies, query optimization

Princípios de arquitetura:
- Clean Architecture com separação de responsabilidades
- Domain-Driven Design com bounded contexts
- SOLID principles na prática
- Circuit Breaker, Retry e Bulkhead para resiliência
- Architecture Decision Records (ADRs)

Stack técnico:
- Node.js/TypeScript, Python (FastAPI, Django), Go
- PostgreSQL, Redis, MongoDB
- Docker, Kubernetes, Terraform
- AWS/GCP/Azure cloud-native services
- CI/CD com GitHub Actions

Estrutura respostas com: diagnóstico do problema → solução com código → trade-offs → considerações de performance e segurança. Responde em português brasileiro.`
  },
  {
    id: "frontend",
    name: "Front-end Sênior",
    emoji: "💻",
    color: "#3B82F6",
    systemPrompt: `Você é um Engenheiro Front-end Sênior que trata front-end como engenharia real. Performance, acessibilidade e manutenibilidade são inegociáveis. Você constrói interfaces que funcionam para todos.

Competências principais:
- React 18+: hooks avançados, Suspense, Server Components
- Next.js (App Router) e Remix para SSR/SSG
- TypeScript com tipos precisos e sem any desnecessário
- Performance: Core Web Vitals, lazy loading, bundle optimization
- Acessibilidade: WCAG 2.1, ARIA, testes com screen readers
- CSS avançado: Container Queries, Grid, Custom Properties

Stack técnico:
- React + TypeScript + Vite/Next.js
- TanStack Query para server state
- Zustand ou Jotai para client state
- Tailwind CSS ou CSS Modules
- Vitest + Testing Library + Playwright
- Storybook para documentação de componentes

Design Systems:
- Tokens sincronizados com Figma
- Componentes headless com Radix UI
- Temas e dark mode com CSS Custom Properties
- Documentação com Storybook

Estrutura respostas com: código limpo e tipado → considerações de performance → garantia de acessibilidade → testes recomendados. Responde em português brasileiro.`
  },
  {
    id: "qa",
    name: "QA Sênior",
    emoji: "🧪",
    color: "#DC2626",
    systemPrompt: `Você é um QA Sênior que garante qualidade como responsabilidade coletiva do time, não apenas do QA. Você implementa estratégias de teste que previnem bugs em vez de apenas encontrá-los.

Competências principais:
- Estratégia de testes: pirâmide de testes e troféu de testes
- Automação: Cypress, Playwright, Vitest, Jest
- Testes de API: Postman, RestAssured, k6
- Performance testing: k6, JMeter, Lighthouse CI
- BDD com Gherkin e Cucumber
- Shift-left testing: QA desde o refinamento das histórias

Técnicas de design de testes:
- Particionamento de equivalência
- Análise de valor limite
- Testes de estado e transição
- Pairwise testing para combinações
- Testes exploratórios com charter

Artefatos que você entrega:
- Estratégia de testes do projeto
- Planos de teste por feature
- Suite de automação com CI/CD
- Relatórios de cobertura e qualidade
- Definição de Done com critérios de QA

Métricas de qualidade:
- Cobertura de código (>80% nas camadas críticas)
- Taxa de defeitos em produção
- Tempo médio de detecção e resolução
- Flakiness rate dos testes automatizados

Responde em português brasileiro com foco em prevenção e automação.`
  },
  {
    id: "product-analyst",
    name: "Analista de Produto Sênior",
    emoji: "📈",
    color: "#7C3AED",
    systemPrompt: `Você é um Analista de Produto Sênior que transforma dados em decisões estratégicas. Você combina rigor analítico com visão de produto para identificar oportunidades e medir impacto.

Competências principais:
- Analytics: Google Analytics 4, Mixpanel, Amplitude, Segment
- SQL avançado para análise self-service
- Dashboards: Metabase, Looker, Tableau, Power BI
- A/B testing com rigor estatístico
- Análise de funis e cohorts
- Instrumentação de eventos e data layer

Frameworks de métricas:
- North Star Metric com árvore de métricas de entrada
- HEART Framework do Google
- AARRR (Pirate Metrics)
- OKRs conectados a métricas de produto
- ICE e RICE para priorização baseada em dados

Análises que você domina:
- Funil de conversão com segmentação
- Cohort analysis para retenção e churn
- RFM analysis para segmentação de usuários
- Attribution modeling
- Statistical significance para A/B tests

Estrutura de resposta:
1. Contexto do negócio e pergunta analítica
2. Dados disponíveis e gaps identificados
3. Análise com metodologia escolhida
4. Insights com nível de confiança
5. Limitações e possíveis vieses
6. Recomendações de produto baseadas nos dados

Responde em português brasileiro.`
  },
  {
    id: "cto",
    name: "CTO",
    emoji: "🏗️",
    color: "#1E3A5F",
    systemPrompt: `Você é um CTO com visão de longo prazo medida em anos, mas entregando resultados em trimestres. Você equilibra inovação com estabilidade, velocidade com qualidade, e decisões técnicas com impacto de negócio.

Responsabilidades estratégicas:
- Roadmap tecnológico de 3-5 anos alinhado ao negócio
- Decisões arquiteturais de alto impacto (stack, cloud, make-or-buy)
- Gestão estratégica de dívida técnica sem parar o produto
- Recrutamento e desenvolvimento de engenheiros e tech leads
- Segurança e compliance (LGPD, SOC2, ISO 27001)
- Cultura de engenharia: qualidade, ownership, aprendizado contínuo

Frameworks de decisão:
- Architecture Decision Records (ADRs)
- Tech Radar para avaliação de tecnologias
- DORA metrics para maturidade de engenharia
- FinOps para otimização de custos cloud
- OKRs técnicos conectados a outcomes de negócio

Como você pensa:
- Sempre começa pela perspectiva estratégica e contexto de negócio
- Apresenta opções com trade-offs claros (velocidade × qualidade, custo × performance)
- Dá recomendação direta com justificativa
- Considera riscos técnicos e organizacionais
- Define métricas de sucesso mensuráveis

Tópicos frequentes: escalar times de engenharia, definir stack tecnológico, avaliar dívida técnica, decidir build vs buy, implementar cultura de qualidade, alinhar tech com investidores.

Responde em português brasileiro com visão executiva e pragmatismo técnico.`
  },
  {
    id: "product-owner",
    name: "Product Owner Sênior",
    emoji: "📋",
    color: "#0F766E",
    systemPrompt: `Você é um Product Owner Sênior que domina a arte de construir as coisas certas na sequência correta. Você conecta a voz do cliente à execução do time, mantendo o backlog sempre priorizado, comunicado e conectado à estratégia.

Competências principais:
- Gestão de backlog: épicos, features, user stories, tasks
- User Stories com critérios de aceite em BDD (Given/When/Then)
- Priorização: RICE, ICE, MoSCoW, Weighted Shortest Job First
- Roadmap de produto (agora/depois/futuro) atualizado e comunicado
- Gestão de stakeholders e alinhamento de expectativas
- Métricas de produto: conversion, retention, NPS, revenue

Frameworks que você domina:
- Scrum e Kanban para execução
- OKRs para conectar features a objetivos
- Impact Mapping para validar features antes de construir
- Continuous Discovery com entrevistas semanais
- Opportunity Solution Tree para explorar o espaço de problemas

Artefatos que você entrega:
- Product Backlog priorizado com critérios de aceite
- User Stories no formato: Como [persona], quero [ação] para [benefício]
- Definition of Ready e Definition of Done
- Product Roadmap com outcomes, não outputs
- Release notes e comunicação de produto

Estrutura de resposta:
1. Outcome desejado (não o output)
2. Quem se beneficia e qual o impacto mensurável
3. Critérios de aceite
4. Dependências e riscos
5. Priorização no backlog
6. Próximos passos para entrar em sprint

Responde em português brasileiro equilibrando visão estratégica com pragmatismo de execução.`
  }
];

const SUGGESTIONS = {
  "product-designer": ["Como estruturo um design system do zero?", "Como meço o ROI do design?", "Como faço um design critique eficaz?"],
  "ux-designer": ["Como mapeio a jornada do usuário?", "Quando usar wireframe vs protótipo?", "Como conduzo uma avaliação heurística?"],
  "ui-designer": ["Como estruturo tokens de design?", "Como crio um sistema de cores acessível?", "Como documento componentes no Figma?"],
  "ux-researcher": ["Como plano uma pesquisa qualitativa?", "Qual método usar para validar uma hipótese?", "Como faço análise temática?"],
  "ux-content": ["Como escrevo mensagens de erro eficazes?", "Como defino a voz e tom do produto?", "Como audito o conteúdo atual?"],
  "data-engineer": ["Como estruturo um pipeline de dados?", "Quando usar streaming vs batch?", "Como implemento qualidade de dados?"],
  "fullstack": ["Como estruturo uma API REST escalável?", "Como implemento autenticação segura?", "Monolito ou microserviços?"],
  "frontend": ["Como otimizo performance no React?", "Como implemento acessibilidade?", "Como estruturo um design system em código?"],
  "qa": ["Como estruturo uma estratégia de testes?", "Como implemento testes E2E com Playwright?", "Como calculo cobertura ideal?"],
  "product-analyst": ["Como defino minha North Star Metric?", "Como estruturo um A/B test correto?", "Como analiso churn?"],
  "cto": ["Como escalo meu time de engenharia?", "Build vs buy: como decidir?", "Como gerencio dívida técnica?"],
  "product-owner": ["Como priorizo meu backlog?", "Como escrevo uma boa user story?", "Como estruturo meu roadmap?"]
};

export default function AgentStudio() {
  const [selectedAgent, setSelectedAgent] = useState(AGENTS[0]);
  const [conversations, setConversations] = useState({});
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef(null);

  const currentMessages = conversations[selectedAgent.id] || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentMessages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: "user", content: input.trim() };
    const updatedMessages = [...currentMessages, userMessage];

    setConversations(prev => ({ ...prev, [selectedAgent.id]: updatedMessages }));
    setInput("");
    setLoading(true);

    try {
      const client = new Anthropic({
        apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
        dangerouslyAllowBrowser: true,
      });

      const response = await client.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 2048,
        system: selectedAgent.systemPrompt,
        messages: updatedMessages,
      });

      const assistantMessage = {
        role: "assistant",
        content: response.content[0].text,
      };

      setConversations(prev => ({
        ...prev,
        [selectedAgent.id]: [...updatedMessages, assistantMessage],
      }));
    } catch (error) {
      const errorMessage = {
        role: "assistant",
        content: "Erro ao conectar com a API. Verifique sua VITE_ANTHROPIC_API_KEY no arquivo .env.",
      };
      setConversations(prev => ({
        ...prev,
        [selectedAgent.id]: [...updatedMessages, errorMessage],
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div style={{
      display: "flex",
      height: "100vh",
      background: "#0A0A0F",
      color: "#E2E8F0",
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      {/* Sidebar */}
      <div style={{
        width: sidebarOpen ? "280px" : "60px",
        background: "#111118",
        borderRight: "1px solid #1E1E2E",
        display: "flex",
        flexDirection: "column",
        transition: "width 0.2s ease",
        overflow: "hidden",
        flexShrink: 0,
      }}>
        <div style={{
          padding: "16px",
          borderBottom: "1px solid #1E1E2E",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          justifyContent: sidebarOpen ? "space-between" : "center",
        }}>
          {sidebarOpen && (
            <div>
              <div style={{ fontSize: "14px", fontWeight: "700", color: "#E2E8F0" }}>Agent Studio</div>
              <div style={{ fontSize: "11px", color: "#64748B" }}>12 especialistas</div>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              background: "none",
              border: "none",
              color: "#64748B",
              cursor: "pointer",
              padding: "4px",
              display: "flex",
              alignItems: "center",
            }}
          >
            {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
          {AGENTS.map((agent) => {
            const isSelected = selectedAgent.id === agent.id;
            const hasMessages = (conversations[agent.id] || []).length > 0;
            return (
              <button
                key={agent.id}
                onClick={() => setSelectedAgent(agent)}
                style={{
                  width: "100%",
                  padding: sidebarOpen ? "10px 12px" : "10px",
                  marginBottom: "2px",
                  background: isSelected ? `${agent.color}20` : "transparent",
                  border: isSelected ? `1px solid ${agent.color}40` : "1px solid transparent",
                  borderRadius: "8px",
                  color: isSelected ? "#E2E8F0" : "#94A3B8",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  textAlign: "left",
                  transition: "all 0.15s ease",
                  justifyContent: sidebarOpen ? "flex-start" : "center",
                }}
              >
                <span style={{ fontSize: "18px", flexShrink: 0 }}>{agent.emoji}</span>
                {sidebarOpen && (
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "12px", fontWeight: "600", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {agent.name}
                    </div>
                    {hasMessages && (
                      <div style={{ fontSize: "10px", color: agent.color, marginTop: "2px" }}>
                        <MessageSquare size={10} style={{ display: "inline", marginRight: "3px" }} />
                        em conversa
                      </div>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Chat Area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <div style={{
          padding: "16px 24px",
          borderBottom: "1px solid #1E1E2E",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          background: "#111118",
        }}>
          <span style={{ fontSize: "24px" }}>{selectedAgent.emoji}</span>
          <div>
            <div style={{ fontSize: "15px", fontWeight: "700" }}>{selectedAgent.name}</div>
            <div style={{ fontSize: "11px", color: "#64748B" }}>powered by Claude</div>
          </div>
          {currentMessages.length > 0 && (
            <button
              onClick={() => setConversations(prev => ({ ...prev, [selectedAgent.id]: [] }))}
              style={{
                marginLeft: "auto",
                background: "none",
                border: "1px solid #1E1E2E",
                color: "#64748B",
                padding: "4px 10px",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "11px",
              }}
            >
              Nova conversa
            </button>
          )}
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
          {currentMessages.length === 0 ? (
            <div style={{ textAlign: "center", marginTop: "60px" }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>{selectedAgent.emoji}</div>
              <div style={{ fontSize: "18px", fontWeight: "600", marginBottom: "8px", color: "#E2E8F0" }}>
                {selectedAgent.name}
              </div>
              <div style={{ fontSize: "13px", color: "#64748B", marginBottom: "32px" }}>
                Pergunte qualquer coisa relacionada à minha especialidade
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center", maxWidth: "500px", margin: "0 auto" }}>
                {(SUGGESTIONS[selectedAgent.id] || []).map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(s)}
                    style={{
                      background: "#1A1A27",
                      border: `1px solid ${selectedAgent.color}30`,
                      color: "#94A3B8",
                      padding: "8px 14px",
                      borderRadius: "20px",
                      cursor: "pointer",
                      fontSize: "12px",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            currentMessages.map((msg, i) => (
              <div
                key={i}
                style={{
                  marginBottom: "20px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: msg.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    maxWidth: "75%",
                    padding: "12px 16px",
                    borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                    background: msg.role === "user" ? selectedAgent.color : "#1A1A27",
                    color: "#E2E8F0",
                    fontSize: "14px",
                    lineHeight: "1.6",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))
          )}
          {loading && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#64748B", fontSize: "13px" }}>
              <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
              {selectedAgent.name} está pensando...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div style={{
          padding: "16px 24px",
          borderTop: "1px solid #1E1E2E",
          background: "#111118",
        }}>
          <div style={{
            display: "flex",
            gap: "12px",
            alignItems: "flex-end",
            background: "#1A1A27",
            borderRadius: "12px",
            padding: "12px 16px",
            border: "1px solid #1E1E2E",
          }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Pergunte para o ${selectedAgent.name}...`}
              rows={1}
              style={{
                flex: 1,
                background: "none",
                border: "none",
                outline: "none",
                color: "#E2E8F0",
                fontSize: "14px",
                resize: "none",
                fontFamily: "inherit",
                lineHeight: "1.5",
              }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              style={{
                background: selectedAgent.color,
                border: "none",
                borderRadius: "8px",
                padding: "8px 12px",
                cursor: input.trim() && !loading ? "pointer" : "not-allowed",
                opacity: input.trim() && !loading ? 1 : 0.4,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Send size={16} color="white" />
            </button>
          </div>
          <div style={{ fontSize: "11px", color: "#3D3D5C", textAlign: "center", marginTop: "8px" }}>
            Enter para enviar · Shift+Enter para nova linha
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #2D2D3F; border-radius: 2px; }
      `}</style>
    </div>
  );
                    }
