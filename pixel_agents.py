#!/usr/bin/env python3
"""
╔══════════════════════════════════════════════════════════════╗
║              🎮 PIXEL AGENTS STUDIO 🎮                      ║
║         12 Especialistas em Arte Pixel no Terminal           ║
╚══════════════════════════════════════════════════════════════╝
Dependências: pip install anthropic rich blessed
"""

import os
import sys
import time
import threading
import anthropic
from rich.console import Console
from rich.panel import Panel
from rich.columns import Columns
from rich.text import Text
from rich.table import Table
from rich.layout import Layout
from rich.live import Live
from rich.align import Align
from rich.prompt import Prompt
from rich import box

# ── Inicializa ──────────────────────────────────────────────
console = Console()

# ══════════════════════════════════════════════════════════════
#  PIXEL ART DOS AGENTES (arte ASCII com cores ANSI via Rich)
# ══════════════════════════════════════════════════════════════

PIXELS = {
    "product_designer": [
        "[bright_magenta]  ░▓▓▓░  [/]",
        "[bright_magenta] ▓█████▓ [/]",
        "[white]  ░███░  [/]",
        "[bright_magenta] ▓█████▓ [/]",
        "[bright_magenta]▓███████▓[/]",
        "[bright_magenta] ▓█▓ ▓█▓ [/]",
        "[bright_magenta]  █   █  [/]",
    ],
    "ux_designer": [
        "[bright_blue]  ░▓▓▓░  [/]",
        "[bright_blue] ▓█████▓ [/]",
        "[white]  ░███░  [/]",
        "[bright_blue] ▓█████▓ [/]",
        "[bright_blue]▓███████▓[/]",
        "[bright_blue] ▓█▓ ▓█▓ [/]",
        "[bright_blue]  █   █  [/]",
    ],
    "ui_designer": [
        "[bright_cyan]  ░▓▓▓░  [/]",
        "[bright_cyan] ▓█████▓ [/]",
        "[white]  ░███░  [/]",
        "[bright_cyan] ▓█████▓ [/]",
        "[bright_cyan]▓███████▓[/]",
        "[bright_cyan] ▓█▓ ▓█▓ [/]",
        "[bright_cyan]  █   █  [/]",
    ],
    "ux_researcher": [
        "[bright_green]  ░▓▓▓░  [/]",
        "[bright_green] ▓█████▓ [/]",
        "[white]  ░███░  [/]",
        "[bright_green] ▓█████▓ [/]",
        "[bright_green]▓███████▓[/]",
        "[bright_green] ▓█▓ ▓█▓ [/]",
        "[bright_green]  █   █  [/]",
    ],
    "ux_content": [
        "[yellow]  ░▓▓▓░  [/]",
        "[yellow] ▓█████▓ [/]",
        "[white]  ░███░  [/]",
        "[yellow] ▓█████▓ [/]",
        "[yellow]▓███████▓[/]",
        "[yellow] ▓█▓ ▓█▓ [/]",
        "[yellow]  █   █  [/]",
    ],
    "data_engineer": [
        "[cyan]  ░▓▓▓░  [/]",
        "[cyan] ▓█████▓ [/]",
        "[white]  ░███░  [/]",
        "[cyan] ▓█████▓ [/]",
        "[cyan]▓███████▓[/]",
        "[cyan] ▓█▓ ▓█▓ [/]",
        "[cyan]  █   █  [/]",
    ],
    "fullstack": [
        "[grey70]  ░▓▓▓░  [/]",
        "[grey70] ▓█████▓ [/]",
        "[white]  ░███░  [/]",
        "[grey70] ▓█████▓ [/]",
        "[grey70]▓███████▓[/]",
        "[grey70] ▓█▓ ▓█▓ [/]",
        "[grey70]  █   █  [/]",
    ],
    "frontend": [
        "[blue]  ░▓▓▓░  [/]",
        "[blue] ▓█████▓ [/]",
        "[white]  ░███░  [/]",
        "[blue] ▓█████▓ [/]",
        "[blue]▓███████▓[/]",
        "[blue] ▓█▓ ▓█▓ [/]",
        "[blue]  █   █  [/]",
    ],
    "qa": [
        "[red]  ░▓▓▓░  [/]",
        "[red] ▓█████▓ [/]",
        "[white]  ░███░  [/]",
        "[red] ▓█████▓ [/]",
        "[red]▓███████▓[/]",
        "[red] ▓█▓ ▓█▓ [/]",
        "[red]  █   █  [/]",
    ],
    "analyst": [
        "[magenta]  ░▓▓▓░  [/]",
        "[magenta] ▓█████▓ [/]",
        "[white]  ░███░  [/]",
        "[magenta] ▓█████▓ [/]",
        "[magenta]▓███████▓[/]",
        "[magenta] ▓█▓ ▓█▓ [/]",
        "[magenta]  █   █  [/]",
    ],
    "cto": [
        "[bright_white]  ░▓▓▓░  [/]",
        "[bright_white] ▓█████▓ [/]",
        "[white]  ░███░  [/]",
        "[bright_white] ▓█████▓ [/]",
        "[bright_white]▓███████▓[/]",
        "[bright_white] ▓█▓ ▓█▓ [/]",
        "[bright_white]  █   █  [/]",
    ],
    "product_owner": [
        "[green]  ░▓▓▓░  [/]",
        "[green] ▓█████▓ [/]",
        "[white]  ░███░  [/]",
        "[green] ▓█████▓ [/]",
        "[green]▓███████▓[/]",
        "[green] ▓█▓ ▓█▓ [/]",
        "[green]  █   █  [/]",
    ],
}

PIXELS_ACTIVE = {
    "product_designer": [
        "[bright_magenta on magenta]  ░▓▓▓░  [/]",
        "[bright_magenta on magenta] ▓█████▓ [/]",
        "[white on magenta]  ░███░  [/]",
        "[bright_magenta on magenta] ▓█████▓ [/]",
        "[bright_magenta on magenta]▓███████▓[/]",
        "[bright_magenta on magenta] ▓█▓ ▓█▓ [/]",
        "[bright_magenta on magenta]  █   █  [/]",
    ],
    "ux_designer": [
        "[bright_blue on blue]  ░▓▓▓░  [/]",
        "[bright_blue on blue] ▓█████▓ [/]",
        "[white on blue]  ░███░  [/]",
        "[bright_blue on blue] ▓█████▓ [/]",
        "[bright_blue on blue]▓███████▓[/]",
        "[bright_blue on blue] ▓█▓ ▓█▓ [/]",
        "[bright_blue on blue]  █   █  [/]",
    ],
    "ui_designer": [
        "[bright_cyan on cyan]  ░▓▓▓░  [/]",
        "[bright_cyan on cyan] ▓█████▓ [/]",
        "[white on cyan]  ░███░  [/]",
        "[bright_cyan on cyan] ▓█████▓ [/]",
        "[bright_cyan on cyan]▓███████▓[/]",
        "[bright_cyan on cyan] ▓█▓ ▓█▓ [/]",
        "[bright_cyan on cyan]  █   █  [/]",
    ],
    "ux_researcher": [
        "[bright_green on green]  ░▓▓▓░  [/]",
        "[bright_green on green] ▓█████▓ [/]",
        "[white on green]  ░███░  [/]",
        "[bright_green on green] ▓█████▓ [/]",
        "[bright_green on green]▓███████▓[/]",
        "[bright_green on green] ▓█▓ ▓█▓ [/]",
        "[bright_green on green]  █   █  [/]",
    ],
    "ux_content": [
        "[yellow on dark_orange]  ░▓▓▓░  [/]",
        "[yellow on dark_orange] ▓█████▓ [/]",
        "[white on dark_orange]  ░███░  [/]",
        "[yellow on dark_orange] ▓█████▓ [/]",
        "[yellow on dark_orange]▓███████▓[/]",
        "[yellow on dark_orange] ▓█▓ ▓█▓ [/]",
        "[yellow on dark_orange]  █   █  [/]",
    ],
    "data_engineer": [
        "[cyan on dark_cyan]  ░▓▓▓░  [/]",
        "[cyan on dark_cyan] ▓█████▓ [/]",
        "[white on dark_cyan]  ░███░  [/]",
        "[cyan on dark_cyan] ▓█████▓ [/]",
        "[cyan on dark_cyan]▓███████▓[/]",
        "[cyan on dark_cyan] ▓█▓ ▓█▓ [/]",
        "[cyan on dark_cyan]  █   █  [/]",
    ],
    "fullstack": [
        "[grey70 on grey30]  ░▓▓▓░  [/]",
        "[grey70 on grey30] ▓█████▓ [/]",
        "[white on grey30]  ░███░  [/]",
        "[grey70 on grey30] ▓█████▓ [/]",
        "[grey70 on grey30]▓███████▓[/]",
        "[grey70 on grey30] ▓█▓ ▓█▓ [/]",
        "[grey70 on grey30]  █   █  [/]",
    ],
    "frontend": [
        "[blue on navy_blue]  ░▓▓▓░  [/]",
        "[blue on navy_blue] ▓█████▓ [/]",
        "[white on navy_blue]  ░███░  [/]",
        "[blue on navy_blue] ▓█████▓ [/]",
        "[blue on navy_blue]▓███████▓[/]",
        "[blue on navy_blue] ▓█▓ ▓█▓ [/]",
        "[blue on navy_blue]  █   █  [/]",
    ],
    "qa": [
        "[red on dark_red]  ░▓▓▓░  [/]",
        "[red on dark_red] ▓█████▓ [/]",
        "[white on dark_red]  ░███░  [/]",
        "[red on dark_red] ▓█████▓ [/]",
        "[red on dark_red]▓███████▓[/]",
        "[red on dark_red] ▓█▓ ▓█▓ [/]",
        "[red on dark_red]  █   █  [/]",
    ],
    "analyst": [
        "[magenta on purple]  ░▓▓▓░  [/]",
        "[magenta on purple] ▓█████▓ [/]",
        "[white on purple]  ░███░  [/]",
        "[magenta on purple] ▓█████▓ [/]",
        "[magenta on purple]▓███████▓[/]",
        "[magenta on purple] ▓█▓ ▓█▓ [/]",
        "[magenta on purple]  █   █  [/]",
    ],
    "cto": [
        "[bright_white on grey42]  ░▓▓▓░  [/]",
        "[bright_white on grey42] ▓█████▓ [/]",
        "[white on grey42]  ░███░  [/]",
        "[bright_white on grey42] ▓█████▓ [/]",
        "[bright_white on grey42]▓███████▓[/]",
        "[bright_white on grey42] ▓█▓ ▓█▓ [/]",
        "[bright_white on grey42]  █   █  [/]",
    ],
    "product_owner": [
        "[green on dark_green]  ░▓▓▓░  [/]",
        "[green on dark_green] ▓█████▓ [/]",
        "[white on dark_green]  ░███░  [/]",
        "[green on dark_green] ▓█████▓ [/]",
        "[green on dark_green]▓███████▓[/]",
        "[green on dark_green] ▓█▓ ▓█▓ [/]",
        "[green on dark_green]  █   █  [/]",
    ],
}

# ══════════════════════════════════════════════════════════════
#  DEFINIÇÃO DOS 12 AGENTES
# ══════════════════════════════════════════════════════════════

AGENTS = [
    {
        "id": "product_designer",
        "name": "🎨 Prod.Designer",
        "short": "DESIGN",
        "emoji": "🎨",
        "color": "bright_magenta",
        "system": """Você é um Product Designer Sênior com 10+ anos de experiência. Especialista em design strategy, design systems, facilitação de workshops (Design Sprint, Design Thinking) e mentoria. Usa Double Diamond, JTBD e pesquisa para decisões. Responde sempre em PT-BR, de forma direta e estratégica.""",
    },
    {
        "id": "ux_designer",
        "name": "🔍 UX Designer",
        "short": "UX",
        "emoji": "🔍",
        "color": "bright_blue",
        "system": """Você é um UX Designer Sênior. Especialista em jornadas, arquitetura de informação, wireframes, prototipagem e testes de usabilidade. Usa Nielsen heuristics, JTBD e User Story Mapping. Responde em PT-BR com foco em usabilidade e evidências.""",
    },
    {
        "id": "ui_designer",
        "name": "🖌️ UI Designer",
        "short": "UI",
        "emoji": "🖌️",
        "color": "bright_cyan",
        "system": """Você é um UI Designer Sênior. Especialista em tipografia, sistemas de cores (WCAG), grids, design tokens, Atomic Design e Figma. Entrega componentes acessíveis com documentação completa. Responde em PT-BR com rigor técnico visual.""",
    },
    {
        "id": "ux_researcher",
        "name": "🔬 UX Research",
        "short": "RSCH",
        "emoji": "🔬",
        "color": "bright_green",
        "system": """Você é um UX Researcher Sênior. Domina métodos qualitativos e quantitativos, affinity mapping, JTBD, Kano Model, SUS, NPS. Conecta insights a decisões de produto. Responde em PT-BR evitando vieses de confirmação.""",
    },
    {
        "id": "ux_content",
        "name": "✍️ UX Content",
        "short": "COPY",
        "emoji": "✍️",
        "color": "yellow",
        "system": """Você é um UX Content Strategist Sênior. Especialista em microcopy, voz e tom, mensagens de erro, onboarding e acessibilidade de conteúdo. Usa plain language e linguagem simples. Responde em PT-BR com exemplos práticos.""",
    },
    {
        "id": "data_engineer",
        "name": "📊 Data Engineer",
        "short": "DATA",
        "emoji": "📊",
        "color": "cyan",
        "system": """Você é um Engenheiro de Dados Sênior. Especialista em pipelines ETL/ELT, dbt, Airflow, BigQuery, Snowflake, Kafka e governança de dados. Pensa em sistemas completos e qualidade. Responde em PT-BR com código SQL/Python quando necessário.""",
    },
    {
        "id": "fullstack",
        "name": "⚙️ Full Stack",
        "short": "FULL",
        "emoji": "⚙️",
        "color": "grey70",
        "system": """Você é um Engenheiro Full Stack/Back-end Sênior. Especialista em arquitetura (microserviços, DDD), APIs REST/GraphQL, PostgreSQL, Redis, Docker, Kubernetes e segurança OWASP. Responde em PT-BR com código limpo e trade-offs claros.""",
    },
    {
        "id": "frontend",
        "name": "💻 Front-end",
        "short": "FRNT",
        "emoji": "💻",
        "color": "blue",
        "system": """Você é um Engenheiro Front-end Sênior. Especialista em React 18+, Next.js, TypeScript, performance (Core Web Vitals), acessibilidade WCAG e design systems em código. Responde em PT-BR com código tipado e foco em performance.""",
    },
    {
        "id": "qa",
        "name": "🧪 QA Sênior",
        "short": "QA",
        "emoji": "🧪",
        "color": "red",
        "system": """Você é um QA Sênior. Especialista em estratégia de testes, Cypress, Playwright, BDD/Gherkin, testes de performance (k6) e shift-left testing. Qualidade é responsabilidade coletiva. Responde em PT-BR com foco em prevenção.""",
    },
    {
        "id": "analyst",
        "name": "📈 Analista Prod.",
        "short": "ANLT",
        "emoji": "📈",
        "color": "magenta",
        "system": """Você é um Analista de Produto Sênior. Especialista em analytics (GA4, Mixpanel, Amplitude), SQL, A/B testing estatístico, funis, cohorts e North Star Metric. Responde em PT-BR com rigor analítico.""",
    },
    {
        "id": "cto",
        "name": "🏗️ CTO",
        "short": "CTO",
        "emoji": "🏗️",
        "color": "bright_white",
        "system": """Você é um CTO. Especialista em roadmap tecnológico, decisões arquiteturais, gestão de dívida técnica, cultura de engenharia e alinhamento tech-negócio. Pensa em anos, entrega em trimestres. Responde em PT-BR com visão executiva.""",
    },
    {
        "id": "product_owner",
        "name": "📋 Prod. Owner",
        "short": "PO",
        "emoji": "📋",
        "color": "green",
        "system": """Você é um Product Owner Sênior. Especialista em backlog, user stories com BDD, priorização (RICE, MoSCoW), OKRs, Impact Mapping e Continuous Discovery. Responde em PT-BR com foco em outcomes, não outputs.""",
    },
]

# ══════════════════════════════════════════════════════════════
#  ESTADO GLOBAL
# ══════════════════════════════════════════════════════════════

active_agent = None
chat_history = {}
last_response = ""
status_msg = "Escolha um agente e faça uma pergunta"

# ══════════════════════════════════════════════════════════════
#  RENDER DO PIXEL ART
# ══════════════════════════════════════════════════════════════

def render_agent_card(agent, is_active=False):
    """Renderiza o card de um agente com pixel art."""
    agent_id = agent["id"]
    color = agent["color"]
    
    pixel_art = PIXELS_ACTIVE[agent_id] if is_active else PIXELS[agent_id]
    
    # Monta o texto do pixel art
    art_lines = []
    for line in pixel_art:
        art_lines.append(line)
    
    # Adiciona nome embaixo
    name_display = agent["short"]
    
    # Borda pulsante se ativo
    border_style = f"bold {color}" if is_active else color
    title_style = f"bold {color}" if is_active else color
    
    art_text = Text()
    for line in pixel_art:
        art_text.append_text(Text.from_markup(line))
        art_text.append("\n")
    
    indicator = "▶ FALANDO" if is_active else "  aguard."
    indicator_color = "bright_yellow" if is_active else "grey50"
    
    content = Text()
    for line in pixel_art:
        content.append_text(Text.from_markup(line))
        content.append("\n")
    content.append(f"[{indicator_color}]{indicator}[/]", style=indicator_color)
    
    panel = Panel(
        Align.center(content),
        title=f"[{title_style}]{agent['name']}[/]",
        border_style=border_style,
        box=box.HEAVY if is_active else box.ROUNDED,
        padding=(0, 1),
        expand=True,
    )
    return panel


def render_table():
    """Renderiza a mesa com todos os 12 agentes em 4 colunas x 3 linhas."""
    table = Table(
        show_header=False,
        show_edge=True,
        box=box.DOUBLE_EDGE,
        style="grey23",
        padding=(0, 0),
        expand=True,
        title="[bold bright_cyan]╔═══ 🎮 PIXEL AGENTS STUDIO ═══╗[/]",
        caption="[grey50]Digite o número do agente + sua pergunta | 'q' para sair[/]",
    )
    
    for _ in range(4):
        table.add_column(ratio=1, justify="center")
    
    rows = []
    for i, agent in enumerate(AGENTS):
        is_active = active_agent is not None and active_agent["id"] == agent["id"]
        card = render_agent_card(agent, is_active)
        rows.append(card)
        
        if (i + 1) % 4 == 0:
            table.add_row(*rows)
            rows = []
    
    # Última linha se não completar 4
    if rows:
        while len(rows) < 4:
            rows.append(Panel("", border_style="grey15", box=box.ROUNDED))
        table.add_row(*rows)
    
    return table


def render_chat_area():
    """Renderiza a área de chat com a última resposta."""
    global last_response, active_agent, status_msg
    
    if active_agent and last_response:
        agent_color = active_agent["color"]
        agent_name = active_agent["name"]
        
        # Trunca para o terminal
        max_chars = 500
        display_text = last_response[:max_chars]
        if len(last_response) > max_chars:
            display_text += "..."
        
        content = Text()
        content.append(f"{active_agent['emoji']} {agent_name}:\n", style=f"bold {agent_color}")
        content.append(display_text, style="white")
        
        return Panel(
            content,
            title=f"[bold {agent_color}]💬 Resposta[/]",
            border_style=agent_color,
            box=box.ROUNDED,
            padding=(1, 2),
        )
    else:
        return Panel(
            Text(status_msg, style="grey50 italic", justify="center"),
            title="[grey50]💬 Chat[/]",
            border_style="grey30",
            box=box.ROUNDED,
            padding=(1, 2),
        )


def render_menu():
    """Renderiza o menu de seleção de agentes."""
    lines = []
    for i, agent in enumerate(AGENTS, 1):
        color = agent["color"]
        is_active = active_agent and active_agent["id"] == agent["id"]
        marker = "▶" if is_active else f"{i:2d}"
        lines.append(f"[{color}]{marker}[/] [{color}]{agent['emoji']} {agent['name']}[/]")
    
    left_col = "\n".join(lines[:6])
    right_col = "\n".join(lines[6:])
    
    content = Text.from_markup(f"{left_col}      {right_col}")
    
    return Panel(
        content,
        title="[bold cyan]📋 Agentes[/]",
        border_style="cyan",
        box=box.ROUNDED,
        padding=(0, 2),
    )


# ══════════════════════════════════════════════════════════════
#  CHAMADA À API ANTHROPIC
# ══════════════════════════════════════════════════════════════

def call_agent(agent, user_message):
    """Chama a API do Claude com o system prompt do agente."""
    global last_response, status_msg
    
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        last_response = "❌ Configure ANTHROPIC_API_KEY no seu ambiente.\nExemplo: export ANTHROPIC_API_KEY=sk-ant-..."
        return
    
    agent_id = agent["id"]
    if agent_id not in chat_history:
        chat_history[agent_id] = []
    
    chat_history[agent_id].append({"role": "user", "content": user_message})
    
    status_msg = f"⏳ {agent['name']} está pensando..."
    
    try:
        client = anthropic.Anthropic(api_key=api_key)
        response = client.messages.create(
            model="claude-sonnet-4-5",
            max_tokens=1024,
            system=agent["system"],
            messages=chat_history[agent_id][-10:],  # últimas 10 mensagens
        )
        
        reply = response.content[0].text
        chat_history[agent_id].append({"role": "assistant", "content": reply})
        last_response = reply
        status_msg = f"✅ {agent['name']} respondeu"
        
    except Exception as e:
        last_response = f"❌ Erro ao chamar API: {str(e)}"
        status_msg = "❌ Erro na API"


# ══════════════════════════════════════════════════════════════
#  INTERFACE PRINCIPAL
# ══════════════════════════════════════════════════════════════

def show_intro():
    """Mostra tela de intro."""
    console.clear()
    
    intro = """
[bright_cyan]
  ██████╗ ██╗██╗  ██╗███████╗██╗         
  ██╔══██╗██║╚██╗██╔╝██╔════╝██║         
  ██████╔╝██║ ╚███╔╝ █████╗  ██║         
  ██╔═══╝ ██║ ██╔██╗ ██╔══╝  ██║         
  ██║     ██║██╔╝ ██╗███████╗███████╗    
  ╚═╝     ╚═╝╚═╝  ╚═╝╚══════╝╚══════╝   
                                          
  █████╗  ██████╗ ███████╗███╗   ██╗████████╗███████╗
  ██╔══██╗██╔════╝ ██╔════╝████╗  ██║╚══██╔══╝██╔════╝
  ███████║██║  ███╗█████╗  ██╔██╗ ██║   ██║   ███████╗
  ██╔══██║██║   ██║██╔══╝  ██║╚██╗██║   ██║   ╚════██║
  ██║  ██║╚██████╔╝███████╗██║ ╚████║   ██║   ███████║
  ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝   ╚═╝   ╚══════╝
[/]
[bright_yellow]          🎮 STUDIO — 12 Especialistas em Pixel Art 🎮[/]
[grey50]                    powered by Claude API[/]
"""
    
    console.print(Panel(
        Align.center(intro),
        border_style="bright_cyan",
        box=box.DOUBLE,
    ))
    time.sleep(2)


def main():
    """Loop principal da aplicação."""
    global active_agent, status_msg
    
    show_intro()
    console.clear()
    
    while True:
        # ── Renderiza interface ──────────────────────────────
        console.clear()
        
        # Header
        console.print(Panel(
            Align.center("[bold bright_cyan]🎮 PIXEL AGENTS STUDIO[/]  [grey50]|[/]  [yellow]12 especialistas prontos para ajudar[/]"),
            style="on grey7",
            border_style="bright_cyan",
            box=box.HEAVY,
            padding=(0, 2),
        ))
        
        # Mesa de agentes
        console.print(render_table())
        
        # Área de resposta
        console.print(render_chat_area())
        
        # Status bar
        status_color = "bright_yellow" if "pensando" in status_msg else ("bright_green" if "respondeu" in status_msg else "grey50")
        console.print(Panel(
            f"[{status_color}]{status_msg}[/]",
            style="on grey7",
            border_style="grey30",
            box=box.SIMPLE,
            padding=(0, 1),
        ))
        
        # ── Input do usuário ─────────────────────────────────
        console.print()
        console.print("[grey50]Comandos:[/] [cyan]1-12[/] seleciona agente  [cyan]ask <mensagem>[/] pergunta ao agente ativo  [cyan]clear[/] limpa chat  [cyan]q[/] sair")
        
        try:
            user_input = Prompt.ask("[bright_cyan]>[/]").strip()
        except (KeyboardInterrupt, EOFError):
            break
        
        if not user_input:
            continue
        
        if user_input.lower() == "q":
            console.print("[bright_cyan]\nAté mais! 👋[/]")
            break
        
        # Seleciona agente por número
        if user_input.isdigit():
            idx = int(user_input) - 1
            if 0 <= idx < len(AGENTS):
                active_agent = AGENTS[idx]
                last_response = ""
                status_msg = f"✅ {active_agent['name']} selecionado! Agora use: ask <sua pergunta>"
            else:
                status_msg = "❌ Número inválido. Use 1-12."
            continue
        
        # Pergunta direta ao agente ativo (sem prefixo)
        if user_input.lower().startswith("ask "):
            question = user_input[4:].strip()
            if not active_agent:
                status_msg = "❌ Selecione um agente primeiro (digite 1-12)"
                continue
            if not question:
                status_msg = "❌ Digite uma pergunta após 'ask '"
                continue
            call_agent(active_agent, question)
            continue
        
        # Limpa histórico
        if user_input.lower() == "clear":
            if active_agent:
                chat_history[active_agent["id"]] = []
                last_response = ""
                status_msg = f"🗑️ Histórico de {active_agent['name']} limpo"
            continue
        
        # Lista agentes
        if user_input.lower() == "list":
            for i, a in enumerate(AGENTS, 1):
                console.print(f"[{a['color']}]{i:2d}. {a['emoji']} {a['name']}[/]")
            Prompt.ask("[grey50]Enter para continuar[/]")
            continue
        
        # Atalho: número+espaço+mensagem (ex: "3 como faço um sistema de cores?")
        parts = user_input.split(" ", 1)
        if parts[0].isdigit() and len(parts) > 1:
            idx = int(parts[0]) - 1
            if 0 <= idx < len(AGENTS):
                active_agent = AGENTS[idx]
                last_response = ""
                call_agent(active_agent, parts[1])
            else:
                status_msg = "❌ Número inválido. Use 1-12."
            continue
        
        # Mensagem direta ao agente ativo
        if active_agent:
            call_agent(active_agent, user_input)
        else:
            status_msg = "❌ Selecione um agente (1-12) ou use: <número> <mensagem>"


if __name__ == "__main__":
    main()
