import { useState, useRef, useEffect, useCallback } from "react";
import { AGENTS, AGENT_SUGGESTIONS } from "./agents.js";

// ── Status constants ─────────────────────────────────────
const STATUS = { IDLE: "idle", THINKING: "thinking", DONE: "done", REVIEW: "review", APPROVED: "approved", BLOCKED: "blocked" };
const ACTIVITY = { IDLE: "aguardando", WRITING: "escrevendo...", READING: "lendo...", RUNNING: "executando...", WAITING: "esperando aprovação", REVIEWING: "revisando..." };

// ── Pixel avatar per agent ───────────────────────────────
const PIXEL_CHARS = {
  atlas:            ["◈◉◈", "█▓█", "▓█▓", "╠═╣"],
  product_designer: ["░▓░", "▓█▓", "░█░", "▓▓▓"],
  ux_designer:      ["·▓·", "▓█▓", "·█·", "▓·▓"],
  ui_designer:      ["▒▓▒", "▓█▓", "▒█▒", "▓▒▓"],
  ux_researcher:    ["○▓○", "▓█▓", "○█○", "▓○▓"],
  ux_content:       ["~▓~", "▓█▓", "~█~", "▓~▓"],
  data_engineer:    ["╔▓╗", "▓█▓", "╚█╝", "▓╬▓"],
  fullstack:        ["≡▓≡", "▓█▓", "≡█≡", "▓≡▓"],
  frontend:         ["⌐▓¬", "▓█▓", "⌐█¬", "▓⌐▓"],
  qa:               ["×▓×", "▓█▓", "×█×", "▓×▓"],
  analyst:          ["↑▓↑", "▓█▓", "↑█↑", "▓↑▓"],
  cto:              ["◆▓◆", "▓█▓", "◆█◆", "▓◆▓"],
  product_owner:    ["▷▓◁", "▓█▓", "▷█◁", "▓▷▓"],
};

// ── Markdown renderer ────────────────────────────────────
function MD({ text, color = "#C0C4D8" }) {
  if (!text) return null;
  return (
    <div style={{ lineHeight: 1.75, color, fontSize: 12.5 }}>
      {text.split("\n").map((line, i) => {
        if (!line.trim()) return <div key={i} style={{ height: 5 }} />;
        const h = line.match(/^(#{1,3})\s(.+)/);
        if (h) return <div key={i} style={{ fontWeight: 800, fontSize: 14 - h[1].length, color: "#fff", margin: "14px 0 4px", fontFamily: "Syne, sans-serif" }}>{h[2]}</div>;
        const isBullet = /^[•\-\*]\s/.test(line);
        const isNum = /^\d+\.\s/.test(line);
        const isCheck = /^- \[[ x]\]/.test(line);
        const render = (s) => s.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((p, j) => {
          if (p.startsWith("**") && p.endsWith("**")) return <strong key={j} style={{ color: "#fff", fontWeight: 600 }}>{p.slice(2, -2)}</strong>;
          if (p.startsWith("`") && p.endsWith("`")) return <code key={j} style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10.5, background: "rgba(255,255,255,0.08)", padding: "1px 5px", borderRadius: 3, color: "#A8C7FA" }}>{p.slice(1, -1)}</code>;
          return p;
        });
        if (isCheck) {
          const done = line.includes("[x]");
          const txt = line.replace(/^- \[[ x]\]\s*/, "");
          return <div key={i} style={{ display: "flex", gap: 7, margin: "2px 0", alignItems: "center" }}>
            <span style={{ color: done ? "#26DE81" : "#444", fontSize: 11 }}>{done ? "✓" : "○"}</span>
            <span style={{ color: done ? "#26DE81" : "#C0C4D8", textDecoration: done ? "line-through" : "none", opacity: done ? 0.6 : 1 }}>{render(txt)}</span>
          </div>;
        }
        if (isBullet) return <div key={i} style={{ display: "flex", gap: 8, margin: "2px 0" }}><span style={{ color: "#444", marginTop: 2, flexShrink: 0 }}>·</span><span>{render(line.replace(/^[•\-\*]\s/, ""))}</span></div>;
        if (isNum) { const n = line.match(/^(\d+)\./)[1]; return <div key={i} style={{ display: "flex", gap: 8, margin: "2px 0" }}><span style={{ color: "#444", minWidth: 16, flexShrink: 0 }}>{n}.</span><span>{render(line.replace(/^\d+\.\s*/, ""))}</span></div>; }
        return <p key={i} style={{ margin: "2px 0" }}>{render(line)}</p>;
      })}
    </div>
  );
}

// ── Pixel Avatar Component ───────────────────────────────
function PixelAvatar({ agentId, color, size = 36, active = false, status = STATUS.IDLE }) {
  const [frame, setFrame] = useState(0);
  const rows = PIXEL_CHARS[agentId] || PIXEL_CHARS.product_designer;
  useEffect(() => {
    if (!active && status !== STATUS.THINKING) return;
    const t = setInterval(() => setFrame(f => (f + 1) % 4), active ? 200 : 600);
    return () => clearInterval(t);
  }, [active, status]);
  const glowColor = status === STATUS.APPROVED ? "#26DE81" : status === STATUS.REVIEW ? "#FFC200" : status === STATUS.BLOCKED ? "#FF6B6B" : color;
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.22, background: `${color}18`,
      border: `1.5px solid ${glowColor}${active ? "90" : "30"}`,
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      boxShadow: active ? `0 0 10px ${glowColor}40` : "none",
      transition: "all 0.2s", overflow: "hidden", flexDirection: "column", gap: 0,
      fontFamily: "JetBrains Mono, monospace",
    }}>
      {rows.slice(0, 3).map((r, i) => (
        <div key={i} style={{ fontSize: Math.max(size * 0.19, 7), lineHeight: 1.1, color: i === 1 && active ? "#fff" : glowColor, opacity: i === frame % 3 && active ? 1 : 0.7, transition: "opacity 0.15s" }}>
          {r}
        </div>
      ))}
    </div>
  );
}

// ── Speech Bubble ────────────────────────────────────────
function SpeechBubble({ text, color, visible }) {
  if (!visible || !text) return null;
  return (
    <div style={{ position: "absolute", bottom: "110%", left: "50%", transform: "translateX(-50%)", background: "#0C0F1A", border: `1px solid ${color}40`, borderRadius: 8, padding: "5px 10px", fontSize: 10, color, whiteSpace: "nowrap", zIndex: 10, pointerEvents: "none" }}>
      {text}
      <div style={{ position: "absolute", bottom: -5, left: "50%", transform: "translateX(-50%)", width: 8, height: 8, background: "#0C0F1A", border: `1px solid ${color}40`, borderTop: "none", borderLeft: "none", transform: "translateX(-50%) rotate(45deg)" }} />
    </div>
  );
}

// ── Task Card ────────────────────────────────────────────
function TaskCard({ task, agents }) {
  const agent = agents.find(a => a.id === task.agentId);
  if (!agent) return null;
  const statusColors = { [STATUS.IDLE]: "#303648", [STATUS.THINKING]: "#FFC200", [STATUS.DONE]: "#4B7BEC", [STATUS.REVIEW]: "#FF9F43", [STATUS.APPROVED]: "#26DE81", [STATUS.BLOCKED]: "#FF6B6B" };
  const statusLabels = { [STATUS.IDLE]: "Pendente", [STATUS.THINKING]: "Em progresso", [STATUS.DONE]: "Feito", [STATUS.REVIEW]: "Em revisão", [STATUS.APPROVED]: "Aprovado", [STATUS.BLOCKED]: "Bloqueado" };
  return (
    <div style={{ background: "#0C0F1A", border: `1px solid ${agent.color}20`, borderLeft: `2px solid ${agent.color}`, borderRadius: 8, padding: "8px 10px", marginBottom: 6 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
        <PixelAvatar agentId={agent.id} color={agent.color} size={20} status={task.status} />
        <span style={{ fontSize: 10, color: agent.color, fontWeight: 600 }}>{agent.name}</span>
        <span style={{ marginLeft: "auto", fontSize: 9, color: statusColors[task.status], background: `${statusColors[task.status]}15`, padding: "1px 6px", borderRadius: 10 }}>{statusLabels[task.status]}</span>
      </div>
      <div style={{ fontSize: 11, color: "#8890A8", lineHeight: 1.4 }}>{task.description}</div>
      {task.deliverable && <div style={{ marginTop: 4, fontSize: 10, color: "#404560" }}>↳ {task.deliverable}</div>}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────
export default function AgentStudio() {
  const [selectedId, setSelectedId] = useState("atlas");
  const [conversations, setConversations] = useState(Object.fromEntries(AGENTS.map(a => [a.id, []])));
  const [agentStatus, setAgentStatus] = useState(Object.fromEntries(AGENTS.map(a => [a.id, STATUS.IDLE])));
  const [agentActivity, setAgentActivity] = useState(Object.fromEntries(AGENTS.map(a => [a.id, ACTIVITY.IDLE])));
  const [tasks, setTasks] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [view, setView] = useState("chat"); // chat | board | office
  const [notifications, setNotifications] = useState([]);
  const [mounted, setMounted] = useState(false);
  const endRef = useRef(null);
  const textRef = useRef(null);

  const agent = AGENTS.find(a => a.id === selectedId);
  const messages = conversations[selectedId];

  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Outfit:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    const style = document.createElement("style");
    style.textContent = `
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: #252836; border-radius: 2px; }
      @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
      @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
      @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
      @keyframes slideIn { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
    `;
    document.head.appendChild(style);
    setTimeout(() => setMounted(true), 80);
  }, []);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const addNotification = useCallback((text, color = "#6C5CE7") => {
    const id = Date.now();
    setNotifications(p => [...p, { id, text, color }]);
    setTimeout(() => setNotifications(p => p.filter(n => n.id !== id)), 4000);
  }, []);

  // Parse Atlas response to extract task assignments
  const parseAtlasTasks = useCallback((response) => {
    const lines = response.split("\n");
    const newTasks = [];
    lines.forEach(line => {
      const match = line.match(/\*\*([A-ZÁ-Úa-zá-ú]+)\s*\(([^)]+)\)\*\*\s*[→-]+\s*(.+)/);
      if (match) {
        const agentName = match[1].toLowerCase();
        const found = AGENTS.find(a => a.name.toLowerCase() === agentName || a.id.includes(agentName));
        if (found && !found.isOrchestrator) {
          newTasks.push({ id: Date.now() + Math.random(), agentId: found.id, description: match[3].trim(), deliverable: "", status: STATUS.IDLE });
        }
      }
    });
    if (newTasks.length > 0) setTasks(p => [...p, ...newTasks]);
  }, []);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input.trim() };
    const history = [...messages, userMsg];
    setConversations(p => ({ ...p, [selectedId]: history }));
    setInput("");
    if (textRef.current) textRef.current.style.height = "auto";
    setLoading(true);
    setAgentStatus(p => ({ ...p, [selectedId]: STATUS.THINKING }));
    setAgentActivity(p => ({ ...p, [selectedId]: ACTIVITY.WRITING }));
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, system: agent.systemPrompt, messages: history }),
      });
      const data = await res.json();
      const reply = data.content[0].text;
      const aMsg = { role: "assistant", content: reply };
      setConversations(p => ({ ...p, [selectedId]: [...history, aMsg] }));
      setAgentStatus(p => ({ ...p, [selectedId]: STATUS.DONE }));
      setAgentActivity(p => ({ ...p, [selectedId]: ACTIVITY.IDLE }));
      if (agent.isOrchestrator) parseAtlasTasks(reply);
      addNotification(`${agent.name} respondeu`, agent.color);
    } catch (e) { console.error(e); setAgentStatus(p => ({ ...p, [selectedId]: STATUS.IDLE })); }
    finally { setLoading(false); }
  };

  const handleKey = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } };

  const approveTask = (taskId) => { setTasks(p => p.map(t => t.id === taskId ? { ...t, status: STATUS.APPROVED } : t)); addNotification("✅ Aprovado para produção!", "#26DE81"); };
  const blockTask = (taskId) => { setTasks(p => p.map(t => t.id === taskId ? { ...t, status: STATUS.BLOCKED } : t)); addNotification("🚫 Bloqueado — necessita revisão", "#FF6B6B"); };

  const tasksByStatus = { active: tasks.filter(t => [STATUS.THINKING, STATUS.DONE, STATUS.REVIEW].includes(t.status)), pending: tasks.filter(t => t.status === STATUS.IDLE), approved: tasks.filter(t => t.status === STATUS.APPROVED), blocked: tasks.filter(t => t.status === STATUS.BLOCKED) };

  const specialists = AGENTS.filter(a => !a.isOrchestrator);
  const orchestrator = AGENTS.find(a => a.isOrchestrator);

  return (
    <div style={{ display: "flex", height: "100vh", background: "#070A13", fontFamily: "'Outfit', sans-serif", color: "#B8BCD0", overflow: "hidden", opacity: mounted ? 1 : 0, transition: "opacity 0.3s" }}>

      {/* SIDEBAR */}
      <div style={{ width: collapsed ? 58 : 260, background: "#0B0E1B", borderRight: "1px solid #141828", display: "flex", flexDirection: "column", transition: "width 0.25s cubic-bezier(0.4,0,0.2,1)", overflow: "hidden", flexShrink: 0, zIndex: 10 }}>
        {/* Header */}
        <div style={{ padding: collapsed ? "14px 10px" : "14px 14px 12px", borderBottom: "1px solid #141828", display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg,#6C5CE7,#8B5CF6)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Syne", fontWeight: 800, fontSize: 15, color: "#fff", flexShrink: 0 }}>◈</div>
          {!collapsed && <div><div style={{ fontFamily: "Syne", fontWeight: 800, fontSize: 11, color: "#fff", letterSpacing: "0.09em" }}>AGENT STUDIO</div><div style={{ fontSize: 9, color: "#252A3A", marginTop: 1 }}>13 agentes · Atlas no comando</div></div>}
        </div>

        {/* Atlas — Orchestrator highlighted */}
        {orchestrator && (
          <div onClick={() => setSelectedId(orchestrator.id)}
            style={{ margin: "8px 6px 4px", padding: collapsed ? "7px 0" : "8px 10px", borderRadius: 8, cursor: "pointer", background: selectedId === orchestrator.id ? orchestrator.accent : "rgba(108,92,231,0.06)", border: `1px solid ${orchestrator.color}${selectedId === orchestrator.id ? "40" : "18"}`, display: "flex", alignItems: "center", gap: 9, justifyContent: collapsed ? "center" : "flex-start", transition: "all 0.15s" }}>
            <PixelAvatar agentId={orchestrator.id} color={orchestrator.color} size={30} active={selectedId === orchestrator.id} status={agentStatus[orchestrator.id]} />
            {!collapsed && <div><div style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>{orchestrator.name}</div><div style={{ fontSize: 9, color: orchestrator.color }}>Orquestrador</div></div>}
          </div>
        )}

        {/* Divider */}
        {!collapsed && <div style={{ margin: "4px 14px", fontSize: 9, color: "#20253A", letterSpacing: "0.08em", paddingTop: 4 }}>ESPECIALISTAS</div>}

        {/* Agent list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "2px 6px 8px" }}>
          {specialists.map(a => {
            const active = selectedId === a.id;
            const hasMsgs = conversations[a.id].length > 0;
            const status = agentStatus[a.id];
            const agentTasks = tasks.filter(t => t.agentId === a.id);
            return (
              <div key={a.id} onClick={() => setSelectedId(a.id)}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: collapsed ? "7px 0" : "7px 9px", justifyContent: collapsed ? "center" : "flex-start", marginBottom: 1, borderRadius: 7, border: "none", background: active ? a.accent : "transparent", borderLeft: !collapsed ? `2px solid ${active ? a.color : "transparent"}` : "none", cursor: "pointer", transition: "all 0.15s", position: "relative" }}>
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <PixelAvatar agentId={a.id} color={a.color} size={28} active={active} status={status} />
                  {status === STATUS.THINKING && <div style={{ position: "absolute", bottom: -1, right: -1, width: 8, height: 8, borderRadius: "50%", background: "#FFC200", animation: "pulse 1s infinite", border: "1px solid #070A13" }} />}
                  {status === STATUS.APPROVED && <div style={{ position: "absolute", bottom: -1, right: -1, width: 8, height: 8, borderRadius: "50%", background: "#26DE81", border: "1px solid #070A13" }} />}
                </div>
                {!collapsed && (
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: active ? "#fff" : "#8890A8" }}>{a.name}</span>
                      {agentTasks.length > 0 && <span style={{ fontSize: 9, background: `${a.color}20`, color: a.color, padding: "0px 5px", borderRadius: 8 }}>{agentTasks.length}</span>}
                    </div>
                    <div style={{ fontSize: 9, color: active ? a.color : "#252A3A" }}>{a.role}</div>
                  </div>
                )}
                {hasMsgs && !collapsed && <div style={{ width: 4, height: 4, borderRadius: "50%", background: a.color, flexShrink: 0, opacity: 0.7 }} />}
              </div>
            );
          })}
        </div>

        {/* Collapse */}
        <div style={{ padding: "8px 6px", borderTop: "1px solid #141828", display: "flex", justifyContent: collapsed ? "center" : "flex-end" }}>
          <button onClick={() => setCollapsed(p => !p)} style={{ background: "none", border: "1px solid #1E2235", borderRadius: 6, color: "#303040", cursor: "pointer", padding: "4px 8px", fontSize: 12, fontFamily: "Outfit" }}>
            {collapsed ? "›" : "‹"}
          </button>
        </div>
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
        {/* Top bar */}
        <div style={{ padding: "11px 20px", borderBottom: "1px solid #141828", display: "flex", alignItems: "center", gap: 12, background: "#070A13", flexShrink: 0 }}>
          <PixelAvatar agentId={agent.id} color={agent.color} size={38} active={loading} status={agentStatus[agent.id]} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 14, color: "#fff" }}>{agent.name}</span>
              {agent.isOrchestrator && <span style={{ fontSize: 10, color: "#6C5CE7", background: "rgba(108,92,231,0.15)", padding: "2px 8px", borderRadius: 20, fontWeight: 600 }}>ORQUESTRADOR</span>}
              <span style={{ fontSize: 10, color: agent.color, background: `${agent.color}18`, padding: "2px 8px", borderRadius: 20 }}>{agent.role}</span>
            </div>
            <div style={{ fontSize: 10, color: agentStatus[agent.id] === STATUS.THINKING ? agent.color : "#252A3A", marginTop: 1 }}>
              {agentStatus[agent.id] === STATUS.THINKING ? `⏳ ${agentActivity[agent.id]}` : agent.description}
            </div>
          </div>
          {/* View switcher */}
          <div style={{ display: "flex", gap: 4, background: "#0C0F1A", borderRadius: 8, padding: 3 }}>
            {[["chat", "💬"], ["board", "📋"], ["office", "🏢"]].map(([v, icon]) => (
              <button key={v} onClick={() => setView(v)} style={{ background: view === v ? "#1A1F30" : "none", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12, color: view === v ? "#fff" : "#404560", fontFamily: "Outfit", transition: "all 0.15s" }}>{icon} {v}</button>
            ))}
          </div>
          {/* Gate approval badge */}
          {tasks.filter(t => t.status === STATUS.DONE).length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(255,194,0,0.1)", border: "1px solid #FFC20040", borderRadius: 8, padding: "4px 10px" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#FFC200", display: "inline-block", animation: "pulse 1s infinite" }} />
              <span style={{ fontSize: 10, color: "#FFC200" }}>{tasks.filter(t => t.status === STATUS.DONE).length} aguardando aprovação</span>
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#26DE81", boxShadow: "0 0 6px #26DE81" }} />
            <span style={{ fontSize: 10, color: "#26DE81" }}>Online</span>
          </div>
        </div>

        {/* CHAT VIEW */}
        {view === "chat" && (
          <>
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
              {messages.length === 0 && (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px", animation: "fadeUp 0.4s ease" }}>
                  <PixelAvatar agentId={agent.id} color={agent.color} size={56} />
                  <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 18, color: "#fff", margin: "14px 0 4px" }}>{agent.name}</div>
                  <div style={{ fontSize: 11, color: "#303648", marginBottom: 8 }}>{agent.role}</div>
                  {agent.isOrchestrator && <div style={{ fontSize: 11, color: "#6C5CE7", background: "rgba(108,92,231,0.1)", padding: "6px 14px", borderRadius: 20, marginBottom: 20 }}>Eu analiso, delego e aprovo — descreva qualquer tarefa</div>}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 7, justifyContent: "center", maxWidth: 500 }}>
                    {(AGENT_SUGGESTIONS[agent.id] || []).map((s, i) => (
                      <button key={i} onClick={() => setInput(s)} style={{ background: agent.accent, border: `1px solid ${agent.color}25`, color: agent.color, cursor: "pointer", borderRadius: 20, padding: "6px 14px", fontSize: 11, fontFamily: "Outfit", transition: "all 0.15s" }}
                        onMouseEnter={e => { e.currentTarget.style.background = `${agent.color}20`; }} onMouseLeave={e => { e.currentTarget.style.background = agent.accent; }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", animation: "fadeUp 0.2s ease", gap: 9 }}>
                  {msg.role === "assistant" && <PixelAvatar agentId={agent.id} color={agent.color} size={26} status={agentStatus[agent.id]} />}
                  <div style={{ maxWidth: msg.role === "user" ? "68%" : "82%", background: msg.role === "user" ? "#111520" : "#0C0F1A", border: msg.role === "user" ? "1px solid #1A1F30" : `1px solid ${agent.color}18`, borderLeft: msg.role === "assistant" ? `2px solid ${agent.color}` : undefined, borderRadius: msg.role === "user" ? "12px 12px 3px 12px" : "3px 12px 12px 12px", padding: "11px 15px" }}>
                    {msg.role === "assistant" ? <MD text={msg.content} color="#C0C4D8" /> : <span style={{ fontSize: 12.5, color: "#C0C4D8" }}>{msg.content}</span>}
                  </div>
                </div>
              ))}
              {loading && (
                <div style={{ display: "flex", gap: 9, animation: "fadeUp 0.2s ease" }}>
                  <PixelAvatar agentId={agent.id} color={agent.color} size={26} active={true} status={STATUS.THINKING} />
                  <div style={{ background: "#0C0F1A", border: `1px solid ${agent.color}18`, borderLeft: `2px solid ${agent.color}`, borderRadius: "3px 12px 12px 12px", padding: "14px 18px", display: "flex", gap: 5, alignItems: "center" }}>
                    {[0, 1, 2].map(j => <div key={j} style={{ width: 5, height: 5, borderRadius: "50%", background: agent.color, animation: `pulse 1.2s ease ${j * 0.2}s infinite` }} />)}
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            {/* Input */}
            <div style={{ padding: "12px 20px 16px", borderTop: "1px solid #141828", background: "#070A13", flexShrink: 0 }}>
              <div style={{ display: "flex", gap: 9, alignItems: "flex-end", background: "#0C0F1A", border: `1px solid #1A1F30`, borderRadius: 11, padding: "9px 12px", transition: "border-color 0.2s" }}
                onFocusCapture={e => { e.currentTarget.style.borderColor = `${agent.color}40`; }} onBlurCapture={e => { e.currentTarget.style.borderColor = "#1A1F30"; }}>
                <textarea ref={textRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey} placeholder={agent.isOrchestrator ? `Descreva a tarefa para o Atlas analisar e delegar...` : `Fale com ${agent.name}...`} rows={1}
                  style={{ flex: 1, background: "none", border: "none", outline: "none", color: "#C0C4D8", fontSize: 12.5, fontFamily: "'Outfit', sans-serif", resize: "none", lineHeight: 1.6, maxHeight: 120, overflowY: "auto" }}
                  onInput={e => { e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"; }} />
                <button onClick={send} disabled={!input.trim() || loading}
                  style={{ width: 32, height: 32, borderRadius: 8, background: input.trim() && !loading ? agent.color : "#141828", border: "none", cursor: input.trim() && !loading ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s", color: input.trim() && !loading ? "#000" : "#303040", fontSize: 16, fontWeight: 700 }}>
                  ↑
                </button>
              </div>
              <div style={{ textAlign: "center", marginTop: 5, fontSize: 9, color: "#1A1F30", letterSpacing: "0.04em" }}>ENTER para enviar · SHIFT+ENTER nova linha</div>
            </div>
          </>
        )}

        {/* BOARD VIEW */}
        {view === "board" && (
          <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
            <div style={{ fontFamily: "Syne", fontWeight: 800, fontSize: 14, color: "#fff", marginBottom: 4 }}>Task Board</div>
            <div style={{ fontSize: 11, color: "#303648", marginBottom: 20 }}>Atlas distribui e gerencia. Nada vai para produção sem aprovação.</div>
            {tasks.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#252A3A" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🧠</div>
                <div style={{ fontSize: 13, color: "#303648" }}>Envie uma tarefa para o Atlas criar o plano</div>
                <button onClick={() => { setView("chat"); setSelectedId("atlas"); }} style={{ marginTop: 16, background: "rgba(108,92,231,0.15)", border: "1px solid rgba(108,92,231,0.3)", borderRadius: 20, padding: "8px 20px", color: "#6C5CE7", cursor: "pointer", fontSize: 11, fontFamily: "Outfit" }}>Falar com Atlas</button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
                {/* Pending */}
                <div>
                  <div style={{ fontSize: 10, color: "#303648", fontWeight: 600, letterSpacing: "0.06em", marginBottom: 8, textTransform: "uppercase" }}>⏳ Pendente ({tasksByStatus.pending.length})</div>
                  {tasksByStatus.pending.map(t => <TaskCard key={t.id} task={t} agents={AGENTS} />)}
                </div>
                {/* Active */}
                <div>
                  <div style={{ fontSize: 10, color: "#FFC200", fontWeight: 600, letterSpacing: "0.06em", marginBottom: 8, textTransform: "uppercase" }}>🔄 Em progresso ({tasksByStatus.active.length})</div>
                  {tasksByStatus.active.map(t => (
                    <div key={t.id}>
                      <TaskCard task={t} agents={AGENTS} />
                      {t.status === STATUS.DONE && (
                        <div style={{ display: "flex", gap: 6, marginTop: -2, marginBottom: 6, paddingLeft: 4 }}>
                          <button onClick={() => approveTask(t.id)} style={{ flex: 1, background: "rgba(38,222,129,0.1)", border: "1px solid rgba(38,222,129,0.3)", borderRadius: 6, padding: "4px", color: "#26DE81", cursor: "pointer", fontSize: 10, fontFamily: "Outfit" }}>✓ Aprovar</button>
                          <button onClick={() => blockTask(t.id)} style={{ flex: 1, background: "rgba(255,107,107,0.1)", border: "1px solid rgba(255,107,107,0.3)", borderRadius: 6, padding: "4px", color: "#FF6B6B", cursor: "pointer", fontSize: 10, fontFamily: "Outfit" }}>✗ Bloquear</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {/* Approved */}
                <div>
                  <div style={{ fontSize: 10, color: "#26DE81", fontWeight: 600, letterSpacing: "0.06em", marginBottom: 8, textTransform: "uppercase" }}>✅ Aprovado — Produção ({tasksByStatus.approved.length})</div>
                  {tasksByStatus.approved.map(t => <TaskCard key={t.id} task={t} agents={AGENTS} />)}
                </div>
                {/* Blocked */}
                {tasksByStatus.blocked.length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, color: "#FF6B6B", fontWeight: 600, letterSpacing: "0.06em", marginBottom: 8, textTransform: "uppercase" }}>🚫 Bloqueado ({tasksByStatus.blocked.length})</div>
                    {tasksByStatus.blocked.map(t => <TaskCard key={t.id} task={t} agents={AGENTS} />)}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* OFFICE VIEW */}
        {view === "office" && (
          <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
            <div style={{ fontFamily: "Syne", fontWeight: 800, fontSize: 14, color: "#fff", marginBottom: 4 }}>Escritório Virtual</div>
            <div style={{ fontSize: 11, color: "#303648", marginBottom: 20 }}>Todos os agentes — veja quem está ativo agora</div>
            {/* Atlas desk */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 9, color: "#252A3A", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>🏢 Mesa do Diretor</div>
              {orchestrator && (
                <div onClick={() => { setSelectedId(orchestrator.id); setView("chat"); }}
                  style={{ background: "rgba(108,92,231,0.08)", border: "1px solid rgba(108,92,231,0.25)", borderRadius: 12, padding: "12px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
                  <PixelAvatar agentId={orchestrator.id} color={orchestrator.color} size={44} active={agentStatus[orchestrator.id] === STATUS.THINKING} status={agentStatus[orchestrator.id]} />
                  <div><div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 13, color: "#fff" }}>Atlas</div><div style={{ fontSize: 10, color: "#6C5CE7" }}>Orquestrador · {tasks.length} tarefas ativas</div></div>
                  <div style={{ marginLeft: "auto", fontSize: 10, color: "#252A3A" }}>clique para falar →</div>
                </div>
              )}
            </div>
            {/* Team grid */}
            <div style={{ fontSize: 9, color: "#252A3A", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>👥 Time de Especialistas</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
              {specialists.map(a => {
                const agentTasks = tasks.filter(t => t.agentId === a.id);
                const busy = agentStatus[a.id] === STATUS.THINKING;
                return (
                  <div key={a.id} onClick={() => { setSelectedId(a.id); setView("chat"); }}
                    style={{ background: busy ? a.accent : "#0C0F1A", border: `1px solid ${busy ? a.color + "40" : "#141828"}`, borderRadius: 10, padding: "12px 10px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 7, transition: "all 0.15s", position: "relative" }}>
                    <div style={{ position: "relative" }}>
                      <PixelAvatar agentId={a.id} color={a.color} size={38} active={busy} status={agentStatus[a.id]} />
                      {busy && <SpeechBubble text="trabalhando..." color={a.color} visible={true} />}
                    </div>
                    <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 11, color: busy ? "#fff" : "#8890A8", textAlign: "center" }}>{a.name}</div>
                    <div style={{ fontSize: 9, color: a.color, textAlign: "center" }}>{a.tag}</div>
                    {agentTasks.length > 0 && <div style={{ fontSize: 9, color: "#303648" }}>{agentTasks.length} tarefa{agentTasks.length > 1 ? "s" : ""}</div>}
                    <div style={{ fontSize: 9, color: "#1A1F30" }}>{agentActivity[a.id]}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* NOTIFICATIONS */}
      <div style={{ position: "fixed", top: 16, right: 16, display: "flex", flexDirection: "column", gap: 6, zIndex: 100, pointerEvents: "none" }}>
        {notifications.map(n => (
          <div key={n.id} style={{ background: "#0C0F1A", border: `1px solid ${n.color}30`, borderLeft: `2px solid ${n.color}`, borderRadius: 8, padding: "8px 14px", fontSize: 11, color: n.color, animation: "slideIn 0.2s ease", boxShadow: `0 4px 16px rgba(0,0,0,0.4)` }}>
            {n.text}
          </div>
        ))}
      </div>
    </div>
  );
}
