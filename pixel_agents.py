#!/usr/bin/env python3
"""
╔══════════════════════════════════════════════════════════════════╗
║            🧠 AGENT STUDIO — ATLAS & 12 ESPECIALISTAS           ║
║         Terminal Interativo com Orquestrador Inteligente         ║
╚══════════════════════════════════════════════════════════════════╝

Dependências: pip install anthropic rich
"""

import os, sys, time, json, threading
from datetime import datetime
from pathlib import Path
import anthropic
from rich.console import Console
from rich.panel import Panel
from rich.columns import Columns
from rich.text import Text
from rich.table import Table
from rich.layout import Layout
from rich.align import Align
from rich.prompt import Prompt
from rich.live import Live
from rich import box

console = Console()

# ─── PERSISTÊNCIA ───────────────────────────────────────────────
SAVE_FILE = Path.home() / ".agent_studio_state.json"

def load_state():
    if SAVE_FILE.exists():
        try:
            return json.loads(SAVE_FILE.read_text())
        except:
            pass
    return {"tasks": [], "history_counts": {}}

def save_state(state):
    SAVE_FILE.write_text(json.dumps(state, ensure_ascii=False, indent=2))

# ─── PIXEL ART ───────────────────────────────────────────────────
PIXELS = {
    "atlas":            ["[bold bright_white]◈◉◈[/]", "[bold #6C5CE7]█▓█[/]", "[bold bright_white]▓█▓[/]", "[bold #6C5CE7]╠═╣[/]"],
    "product_designer": ["[bright_magenta]░▓░[/]",     "[bright_magenta]▓█▓[/]", "[bright_magenta]░█░[/]", "[bright_magenta]▓▓▓[/]"],
    "ux_designer":      ["[bright_blue]·▓·[/]",        "[bright_blue]▓█▓[/]",    "[bright_blue]·█·[/]",   "[bright_blue]▓·▓[/]"],
    "ui_designer":      ["[bright_cyan]▒▓▒[/]",        "[bright_cyan]▓█▓[/]",    "[bright_cyan]▒█▒[/]",   "[bright_cyan]▓▒▓[/]"],
    "ux_researcher":    ["[bright_green]○▓○[/]",        "[bright_green]▓█▓[/]",   "[bright_green]○█○[/]",  "[bright_green]▓○▓[/]"],
    "ux_content":       ["[yellow]~▓~[/]",             "[yellow]▓█▓[/]",          "[yellow]~█~[/]",         "[yellow]▓~▓[/]"],
    "data_engineer":    ["[cyan]╔▓╗[/]",               "[cyan]▓█▓[/]",            "[cyan]╚█╝[/]",           "[cyan]▓╬▓[/]"],
    "fullstack":        ["[grey70]≡▓≡[/]",             "[grey70]▓█▓[/]",          "[grey70]≡█≡[/]",         "[grey70]▓≡▓[/]"],
    "frontend":         ["[blue]⌐▓¬[/]",               "[blue]▓█▓[/]",            "[blue]⌐█¬[/]",           "[blue]▓⌐▓[/]"],
    "qa":               ["[red]×▓×[/]",                "[red]▓█▓[/]",             "[red]×█×[/]",            "[red]▓×▓[/]"],
    "analyst":          ["[magenta]↑▓↑[/]",            "[magenta]▓█▓[/]",         "[magenta]↑█↑[/]",        "[magenta]▓↑▓[/]"],
    "cto":              ["[bright_white]◆▓◆[/]",       "[bright_white]▓█▓[/]",    "[bright_white]◆█◆[/]",   "[bright_white]▓◆▓[/]"],
    "product_owner":    ["[green]▷▓◁[/]",              "[green]▓█▓[/]",           "[green]▷█◁[/]",          "[green]▓▷▓[/]"],
}

# ─── AGENTES ─────────────────────────────────────────────────────
AGENTS = [
    {
        "id": "atlas", "name": "Atlas", "role": "Diretor / Orquestrador",
        "tag": "AT", "emoji": "🧠", "color": "bold #6C5CE7",
        "is_orchestrator": True, "num": 0,
        "system": """Você é ATLAS — o Diretor de Operações do Agent Studio. Você é o agente líder que recebe qualquer tarefa, avalia sua complexidade e coordena o time de 12 especialistas.

SEU TIME:
• Lara (Product Designer) • Marco (UX Designer) • Nina (UI Designer)
• Sofia (UX Research) • Theo (UX Content) • Kai (Data Engineer)
• Rafa (Full Stack) • Zoe (Front-end) • Alex (QA)
• Leo (Analytics) • Max (CTO) • Bia (Product Owner)

PROTOCOLO AO RECEBER UMA TAREFA:
1. DIAGNÓSTICO: objetivo real, complexidade (🟢/🟡/🔴/⚫), domínios impactados
2. DECOMPOSIÇÃO: subtarefas específicas com dependências
3. DELEGAÇÃO: agente certo + entregável esperado + critérios de aceite
4. PARALELIZAÇÃO: o que roda junto vs sequencial
5. GATE DE APROVAÇÃO: checklist antes de produção

FORMATO DE RESPOSTA:
## 🧠 ATLAS — Análise
**Complexidade:** [nível]
**Domínios:** [lista]

### Plano de Execução
**Fase 1 — Paralelo:**
- [ ] **Lara** → [tarefa específica]
- [ ] **Marco** → [tarefa específica]

**Fase 2 — Sequencial:**
- [ ] **Zoe** → [tarefa]
- [ ] **Rafa** → [tarefa]

**Fase 3 — Qualidade:**
- [ ] **Alex (QA)** → testes + automação
- [ ] **Leo (Analytics)** → tracking plan

### 🔐 Gate de Aprovação
- [ ] Design aprovado por Lara
- [ ] Código front revisado por Max
- [ ] Testes passando por Alex
- [ ] Métricas por Leo
- [ ] Critérios de aceite por Bia

Responda em português brasileiro."""
    },
    {
        "id": "product_designer", "name": "Lara", "role": "Product Designer Sênior",
        "tag": "PD", "emoji": "🎨", "color": "bright_magenta", "num": 1,
        "system": "Você é Lara, Product Designer Sênior no time do Agent Studio (liderado pelo Atlas). Especialista em design strategy, design systems, facilitação (Design Sprint, Double Diamond) e mentoria. Quando o Atlas delegar uma tarefa, você entrega: contexto interpretado, análise, proposta com justificativa, entregáveis concretos e dependências. Responda em português brasileiro de forma direta e estratégica."
    },
    {
        "id": "ux_designer", "name": "Marco", "role": "UX Designer Sênior",
        "tag": "UX", "emoji": "🔍", "color": "bright_blue", "num": 2,
        "system": "Você é Marco, UX Designer Sênior no time do Atlas. Especialista em user flows, arquitetura de informação, wireframes, heurísticas de Nielsen e testes de usabilidade. Entrega: fluxos documentados, decisões justificadas, edge cases identificados, métricas de sucesso. Responda em português brasileiro."
    },
    {
        "id": "ui_designer", "name": "Nina", "role": "UI Designer Sênior",
        "tag": "UI", "emoji": "🖌️", "color": "bright_cyan", "num": 3,
        "system": "Você é Nina, UI Designer Sênior no time do Atlas. Especialista em tipografia, sistemas de cores (WCAG), design tokens, Atomic Design e componentes com todos os estados. Entrega especificações técnicas exatas (hex, rem, px). Checklist de acessibilidade sempre incluso. Responda em português brasileiro."
    },
    {
        "id": "ux_researcher", "name": "Sofia", "role": "UX Researcher Sênior",
        "tag": "UR", "emoji": "🔬", "color": "bright_green", "num": 4,
        "system": "Você é Sofia, UX Researcher Sênior no time do Atlas. Especialista em pesquisa qualitativa/quantitativa, affinity mapping, Kano, SUS, NPS. Entrega insights no formato 'O usuário X faz Y porque Z' com nível de confiança. Responda em português brasileiro com rigor metodológico."
    },
    {
        "id": "ux_content", "name": "Theo", "role": "UX Content Strategist",
        "tag": "UC", "emoji": "✍️", "color": "yellow", "num": 5,
        "system": "Você é Theo, UX Content Strategist no time do Atlas. Especialista em microcopy, voz e tom, mensagens de erro (sem culpa, máxima utilidade), onboarding e acessibilidade de conteúdo. Entrega 2-3 variações de copy com justificativas. Responda em português brasileiro com exemplos concretos."
    },
    {
        "id": "data_engineer", "name": "Kai", "role": "Engenheiro de Dados Sênior",
        "tag": "DE", "emoji": "📊", "color": "cyan", "num": 6,
        "system": "Você é Kai, Engenheiro de Dados Sênior no time do Atlas. Especialista em pipelines ETL/ELT, dbt, BigQuery, Snowflake, Kafka e governança de dados. Entrega: schema proposto, pipeline descrito, estratégia de qualidade, SQL/Python quando relevante. Responda em português brasileiro."
    },
    {
        "id": "fullstack", "name": "Rafa", "role": "Full Stack / Back-end Sênior",
        "tag": "FS", "emoji": "⚙️", "color": "grey70", "num": 7,
        "system": "Você é Rafa, Engenheiro Full Stack/Back-end Sênior no time do Atlas. Especialista em arquitetura (microserviços, DDD), APIs REST/GraphQL, PostgreSQL, Redis, segurança OWASP. Código TypeScript limpo, tipado, com tratamento de erro. Responda em português brasileiro."
    },
    {
        "id": "frontend", "name": "Zoe", "role": "Front-end Sênior",
        "tag": "FE", "emoji": "💻", "color": "blue", "num": 8,
        "system": "Você é Zoe, Engenheira Front-end Sênior no time do Atlas. Especialista em React 18+, Next.js, TypeScript, Core Web Vitals, acessibilidade WCAG e design systems em código. Zero `any` sem justificativa. Checklist de a11y sempre. Responda em português brasileiro."
    },
    {
        "id": "qa", "name": "Alex", "role": "QA Sênior",
        "tag": "QA", "emoji": "🧪", "color": "red", "num": 9,
        "system": "Você é Alex, QA Engineer Sênior no time do Atlas. Especialista em estratégia de testes, Cypress/Playwright, BDD/Gherkin, k6, shift-left testing. Entrega: análise de risco, cenários BDD (happy+edge+negativos), código de automação, relatório de qualidade. Responda em português brasileiro."
    },
    {
        "id": "analyst", "name": "Leo", "role": "Analista de Produto Sênior",
        "tag": "PA", "emoji": "📈", "color": "magenta", "num": 10,
        "system": "Você é Leo, Product Analyst Sênior no time do Atlas. Especialista em North Star Metric, A/B testing estatístico, SQL (window functions, cohorts), Mixpanel/Amplitude, tracking plans. Entrega: métricas de sucesso, tracking plan com eventos/propriedades, SQL relevante. Responda em português brasileiro."
    },
    {
        "id": "cto", "name": "Max", "role": "CTO",
        "tag": "CT", "emoji": "🏗️", "color": "bright_white", "num": 11,
        "system": "Você é Max, CTO no time do Atlas. Especialista em visão técnica, arquitetura de sistemas, cultura de engenharia e decisões build vs buy. No gate de aprovação, valida segurança, escalabilidade, qualidade técnica e alinhamento arquitetural. Responda em português brasileiro com clareza executiva."
    },
    {
        "id": "product_owner", "name": "Bia", "role": "Product Owner Sênior",
        "tag": "PO", "emoji": "📋", "color": "green", "num": 12,
        "system": "Você é Bia, Product Owner Sênior no time do Atlas. Especialista em user stories com BDD, priorização (RICE/MoSCoW), OKRs e gestão de stakeholders. No gate de aprovação, valida se critérios de aceite foram atendidos. Responda em português brasileiro."
    },
]

# ─── ESTADO ──────────────────────────────────────────────────────
state = load_state()
active_agent = AGENTS[0]  # Atlas por padrão
chat_history = {}
tasks = state.get("tasks", [])
last_response = ""
status_msg = "Atlas pronto — descreva uma tarefa ou selecione um especialista"
animation_frame = 0

# ─── RENDER ──────────────────────────────────────────────────────
def get_pixel(agent_id, frame=0):
    rows = PIXELS.get(agent_id, PIXELS["product_designer"])
    return rows[frame % len(rows)]

def render_agent_card(agent, is_active=False):
    color = agent["color"]
    is_orchestrator = agent.get("is_orchestrator", False)

    pixel = get_pixel(agent["id"], animation_frame if is_active else 0)
    indicator = "▶ ATIVO" if is_active else "  —    "
    ind_color = "bold bright_yellow" if is_active else "grey35"

    if is_orchestrator:
        border = "bold #6C5CE7" if is_active else "#6C5CE7"
        b = box.HEAVY
    else:
        border = f"bold {color}" if is_active else color
        b = box.HEAVY if is_active else box.ROUNDED

    content = Text()
    content.append_text(Text.from_markup(f"  {pixel}  \n"))
    content.append_text(Text.from_markup(f"[{ind_color}]{indicator}[/]"))

    name_display = f"[bold]{agent['name']}[/]" if is_active else agent['name']
    return Panel(
        Align.center(content),
        title=f"[{color}]{agent['emoji']} {name_display}[/]",
        subtitle=f"[grey42]{agent['tag']}[/]",
        border_style=border, box=b, padding=(0,1), expand=True,
    )

def render_board():
    """Renderiza a mesa de todos os agentes."""
    table = Table(
        show_header=False, show_edge=True, box=box.DOUBLE_EDGE,
        style="grey11", padding=(0,0), expand=True,
        title="[bold #6C5CE7]◈ AGENT STUDIO — Atlas & 12 Especialistas[/]",
        caption="[grey35]0=Atlas  1-12=Especialistas  task <descrição>=delegar ao Atlas  q=sair[/]"
    )
    for _ in range(4):
        table.add_column(ratio=1, justify="center")

    # Linha 0: Atlas full-width simulado + 3 primeiros especialistas
    atlas = AGENTS[0]
    is_atlas_active = active_agent["id"] == atlas["id"]
    atlas_card = Panel(
        Align.center(Text.from_markup(f"  {get_pixel(atlas['id'], animation_frame if is_atlas_active else 0)}  \n[bold bright_yellow]{'▶ ATIVO' if is_atlas_active else '  —    '}[/]")),
        title=f"[bold #6C5CE7]🧠 Atlas — ORQUESTRADOR[/]",
        subtitle="[grey42]Analisa · Delega · Aprova[/]",
        border_style=f"bold #6C5CE7" if is_atlas_active else "#6C5CE7",
        box=box.HEAVY if is_atlas_active else box.ROUNDED,
        padding=(0,1), expand=True,
    )
    specialists = AGENTS[1:]
    table.add_row(atlas_card, render_agent_card(specialists[0], active_agent["id"]==specialists[0]["id"]),
                               render_agent_card(specialists[1], active_agent["id"]==specialists[1]["id"]),
                               render_agent_card(specialists[2], active_agent["id"]==specialists[2]["id"]))
    # Linhas 1-2: especialistas 4-12
    for row_start in range(3, 12, 4):
        row = []
        for i in range(4):
            idx = row_start + i
            if idx < len(specialists):
                a = specialists[idx]
                row.append(render_agent_card(a, active_agent["id"] == a["id"]))
            else:
                row.append(Panel("", border_style="grey11", box=box.ROUNDED))
        table.add_row(*row)
    return table

def render_chat():
    if not last_response:
        return Panel(
            Text(status_msg, style="grey42 italic", justify="center"),
            title="[grey35]💬 Output[/]", border_style="grey20", box=box.ROUNDED, padding=(1,2)
        )
    agent = active_agent
    color = agent["color"]
    truncated = last_response[:600] + ("..." if len(last_response) > 600 else "")
    content = Text()
    content.append(f"{agent['emoji']} {agent['name']}  →  ", style=f"bold {color}")
    content.append(truncated, style="white")
    return Panel(content, title=f"[bold {color}]💬 {agent['name']} responde[/]",
                 border_style=color, box=box.ROUNDED, padding=(1,2))

def render_tasks():
    if not tasks:
        return Panel(Text("Nenhuma tarefa ainda — use: task <descrição>", style="grey35 italic", justify="center"),
                     title="[grey35]📋 Tasks[/]", border_style="grey20", box=box.ROUNDED, padding=(0,1))
    table = Table(show_header=True, box=box.SIMPLE, header_style="bold grey42", expand=True)
    table.add_column("Agente", style="bold", width=10)
    table.add_column("Tarefa")
    table.add_column("Status", width=14)
    status_colors = {"pending": "grey42", "active": "yellow", "done": "blue", "approved": "bright_green", "blocked": "red"}
    status_labels = {"pending": "⏳ Pendente", "active": "🔄 Ativo", "done": "✅ Feito", "approved": "🚀 Produção", "blocked": "🚫 Bloqueado"}
    for t in tasks[-8:]:
        agent = next((a for a in AGENTS if a["id"] == t.get("agent_id")), None)
        if agent:
            color = status_colors.get(t["status"], "grey42")
            table.add_row(
                f"[{agent['color']}]{agent['emoji']} {agent['name']}[/]",
                t["description"][:60],
                f"[{color}]{status_labels.get(t['status'], t['status'])}[/]"
            )
    return Panel(table, title="[bold cyan]📋 Task Board[/]", border_style="cyan", box=box.ROUNDED, padding=(0,1))

# ─── API CALL ────────────────────────────────────────────────────
def call_agent(agent, message):
    global last_response, status_msg
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        last_response = "❌ ANTHROPIC_API_KEY não configurada.\nexport ANTHROPIC_API_KEY=sk-ant-..."
        return
    agent_id = agent["id"]
    if agent_id not in chat_history:
        chat_history[agent_id] = []
    chat_history[agent_id].append({"role": "user", "content": message})
    status_msg = f"⏳ {agent['name']} está analisando..."
    try:
        client = anthropic.Anthropic(api_key=api_key)
        resp = client.messages.create(
            model="claude-sonnet-4-5", max_tokens=1024,
            system=agent["system"],
            messages=chat_history[agent_id][-12:]
        )
        reply = resp.content[0].text
        chat_history[agent_id].append({"role": "assistant", "content": reply})
        last_response = reply
        status_msg = f"✅ {agent['name']} respondeu — {datetime.now().strftime('%H:%M')}"
        # Se Atlas respondeu, tenta extrair tasks
        if agent.get("is_orchestrator"):
            parse_atlas_tasks(reply)
    except Exception as e:
        last_response = f"❌ Erro API: {e}"
        status_msg = "❌ Erro na API"

def parse_atlas_tasks(response):
    """Extrai delegações do Atlas e cria tasks."""
    lines = response.split("\n")
    for line in lines:
        # Busca padrão: **Nome** → descrição
        import re
        m = re.search(r'\*\*([A-ZÁ-Úa-zá-ú]+)\s*(?:\([^)]+\))?\*\*\s*[→\-]+\s*(.+)', line)
        if m:
            agent_name = m.group(1).strip().lower()
            task_desc = m.group(2).strip()
            found = next((a for a in AGENTS if a["name"].lower() == agent_name), None)
            if found and not found.get("is_orchestrator") and task_desc:
                tasks.append({"id": len(tasks)+1, "agent_id": found["id"], "description": task_desc[:80], "status": "pending", "created": datetime.now().isoformat()})
    save_state({"tasks": tasks})

def approve_task(task_num):
    if 1 <= task_num <= len(tasks):
        tasks[task_num-1]["status"] = "approved"
        save_state({"tasks": tasks})
        return True
    return False

# ─── INTRO ───────────────────────────────────────────────────────
def show_intro():
    console.clear()
    console.print(Panel(Align.center(
        "[bold #6C5CE7]◈ AGENT STUDIO[/]\n"
        "[grey50]Atlas + 12 Especialistas[/]\n"
        "[grey35]powered by Claude API[/]"
    ), border_style="#6C5CE7", box=box.DOUBLE, padding=(1,4)))
    console.print()
    rows = []
    for a in AGENTS:
        rows.append(f"[{a['color']}]{a['num']:2d}. {a['emoji']} {a['name']:12s}[/] [grey42]{a['role']}[/]")
    for i in range(0, len(rows), 2):
        r = rows[i]
        r2 = rows[i+1] if i+1 < len(rows) else ""
        console.print(f"  {r}    {r2}")
    console.print()
    console.print("[grey35]Comandos: 0-12 seleciona | task <desc> → Atlas orquestra | approve <N> | q sair[/]")
    console.print()
    time.sleep(1.5)

# ─── MAIN ────────────────────────────────────────────────────────
def main():
    global active_agent, status_msg, animation_frame

    show_intro()
    console.clear()

    while True:
        animation_frame = (animation_frame + 1) % 4
        console.clear()

        # Header
        console.print(Panel(
            Align.center(f"[bold #6C5CE7]◈ AGENT STUDIO[/]  [grey35]|[/]  [white]{active_agent['emoji']} {active_agent['name']}[/] [grey42]ativo[/]  [grey35]|[/]  [grey42]{len(tasks)} tasks[/]"),
            style="on grey7", border_style="#6C5CE7", box=box.HEAVY, padding=(0,2)
        ))

        # Board
        console.print(render_board())

        # Output + Tasks lado a lado
        output = render_chat()
        board = render_tasks()
        console.print(Columns([output, board], equal=True, expand=True))

        # Status bar
        color = "bright_yellow" if "analisando" in status_msg else ("bright_green" if "respondeu" in status_msg else "grey42")
        console.print(Panel(f"[{color}]{status_msg}[/]", style="on grey7", border_style="grey20", box=box.SIMPLE, padding=(0,1)))

        console.print()
        try:
            user_input = Prompt.ask("[#6C5CE7]>[/]").strip()
        except (KeyboardInterrupt, EOFError):
            break

        if not user_input:
            continue
        if user_input.lower() == "q":
            console.print("[#6C5CE7]\n◈ Até mais![/]"); break

        # Seleciona agente
        if user_input.isdigit():
            idx = int(user_input)
            if 0 <= idx < len(AGENTS):
                active_agent = AGENTS[idx]
                last_response = ""
                status_msg = f"✅ {active_agent['name']} selecionado"
            else:
                status_msg = "❌ Use 0 (Atlas) ou 1-12 (especialistas)"
            continue

        # Delega ao Atlas
        if user_input.lower().startswith("task "):
            task_desc = user_input[5:].strip()
            active_agent = AGENTS[0]  # Atlas
            call_agent(active_agent, f"Analise e crie o plano de execução para: {task_desc}")
            continue

        # Aprovação de task
        if user_input.lower().startswith("approve "):
            try:
                n = int(user_input.split()[1])
                if approve_task(n):
                    status_msg = f"✅ Task {n} aprovada para produção!"
                else:
                    status_msg = f"❌ Task {n} não encontrada"
            except:
                status_msg = "❌ Use: approve <número>"
            continue

        # Lista de tasks
        if user_input.lower() == "tasks":
            console.clear()
            for i, t in enumerate(tasks, 1):
                agent = next((a for a in AGENTS if a["id"] == t.get("agent_id")), None)
                name = agent["name"] if agent else "?"
                console.print(f"[cyan]{i:2d}.[/] [{agent['color'] if agent else 'white'}]{name:10s}[/] {t['description'][:70]} [grey42][{t['status']}][/]")
            Prompt.ask("[grey35]Enter para continuar[/]")
            continue

        # Limpa histórico
        if user_input.lower() == "clear":
            chat_history[active_agent["id"]] = []
            last_response = ""
            status_msg = f"🗑️ Histórico de {active_agent['name']} limpo"
            continue

        # Atalho: número + mensagem (ex: "3 como criar tokens?")
        parts = user_input.split(" ", 1)
        if parts[0].isdigit() and len(parts) > 1:
            idx = int(parts[0])
            if 0 <= idx < len(AGENTS):
                active_agent = AGENTS[idx]
                call_agent(active_agent, parts[1])
            else:
                status_msg = "❌ Use 0-12"
            continue

        # Mensagem ao agente ativo
        call_agent(active_agent, user_input)

    # Salva estado antes de sair
    save_state({"tasks": tasks})

if __name__ == "__main__":
    main()
