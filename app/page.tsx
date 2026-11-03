"use client";
import Image from "next/image";
import { useState, useEffect, useRef, useCallback } from "react";

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
type Priority = "high" | "medium" | "low";
type Filter = "all" | "active" | "completed";

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  priority: Priority;
}

/* ─────────────────────────────────────────────
   Icons (Vector SVGs)
───────────────────────────────────────────── */
const Icon = {
  Plus: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  Check: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  ),
  CheckAll: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L7 17l-4-4" />
      <path d="M22 10l-7.5 7.5-2-2" />
    </svg>
  ),
  Edit: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  Trash: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  ),
  Broom: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m16 4 3 3-9 9H7v-3l9-9Z" />
      <path d="m14 6 3 3" />
      <path d="M3 21h18" />
    </svg>
  ),
  Login: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <polyline points="10 17 15 12 10 7" />
      <line x1="15" y1="12" x2="3" y2="12" />
    </svg>
  ),
  Close: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  Save: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  ),
  AdSparkle: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
};

/* ─────────────────────────────────────────────
   Constants & Config
───────────────────────────────────────────── */
const STORAGE_KEY = "taskflow_todos_v2";

const QUOTES = [
  "Small steps every day build great things.",
  "Done is better than perfect.",
  "Focus on progress, not perfection.",
  "One task at a time.",
  "Your future self will thank you.",
  "Clarity leads to productivity.",
  "Make it happen. Shock everyone.",
  "The secret to getting ahead is getting started.",
];

const PRIORITY_CONFIG: Record<Priority, { color: string; bg: string; label: string }> = {
  high:   { color: "#F6F0ED", bg: "#C2948A", label: "High" },
  medium: { color: "#F6F0ED", bg: "#28536B", label: "Medium" },
  low:    { color: "#142C3B", bg: "#BBB193", label: "Low" },
};

function generateId() {
  return Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
}

function loadTodos(): Todo[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
    // Initial sample tasks matching the mock
    return [
      { id: "1", text: "Task 1", completed: false, createdAt: Date.now() - 3000, priority: "high" },
      { id: "2", text: "Task 2", completed: true, createdAt: Date.now() - 2000, priority: "medium" },
      { id: "3", text: "Task 3", completed: false, createdAt: Date.now() - 1000, priority: "low" },
    ];
  } catch {
    return [];
  }
}

function saveTodos(todos: Todo[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch { /* silent */ }
}

/* ─────────────────────────────────────────────
   Confetti helper
───────────────────────────────────────────── */
function spawnConfetti(parentRef: HTMLElement) {
  const colors = ["#7EA8BE", "#C2948A", "#BBB193", "#F6F0ED", "#28536B"];
  for (let i = 0; i < 14; i++) {
    const el = document.createElement("div");
    el.className = "confetti-particle";
    el.style.background = colors[i % colors.length];
    el.style.left = `${20 + Math.random() * 60}%`;
    el.style.top = `${20 + Math.random() * 50}%`;
    el.style.animationDelay = `${Math.random() * 0.25}s`;
    parentRef.appendChild(el);
    setTimeout(() => el.remove(), 1100);
  }
}

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */
export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [priority, setPriority] = useState<Priority>("medium");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [toastMsg, setToastMsg] = useState("");
  const [toastVisible, setToastVisible] = useState(false);

  const statsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMsg(msg);
    setToastVisible(true);
    toastTimerRef.current = setTimeout(() => setToastVisible(false), 2400);
  }, []);

  /* ── Load on mount (avoid hydration mismatch) ── */
  useEffect(() => {
    setTodos(loadTodos());
    setQuoteIdx(Math.floor(Math.random() * QUOTES.length));
    setMounted(true);
  }, []);

  /* ── Auto save to localStorage ── */
  useEffect(() => {
    if (mounted) saveTodos(todos);
  }, [todos, mounted]);

  /* ── Derived calculations ── */
  const total = todos.length;
  const done = todos.filter(t => t.completed).length;

  const filtered = todos.filter(t => {
    if (filter === "active") return !t.completed;
    if (filter === "completed") return t.completed;
    return true;
  });

  /* ── Add task ── */
  const addTodo = () => {
    const text = input.trim();
    if (!text) {
      inputRef.current?.focus();
      return;
    }
    const newTodo: Todo = {
      id: generateId(),
      text,
      completed: false,
      createdAt: Date.now(),
      priority,
    };
    setTodos(prev => [newTodo, ...prev]);
    setInput("");
    showToast("Task added ✓");
    inputRef.current?.focus();
  };

  /* ── Toggle completed ── */
  const toggleTodo = (id: string) => {
    setTodos(prev => prev.map(t => {
      if (t.id !== id) return t;
      const next = { ...t, completed: !t.completed };
      if (next.completed && statsRef.current) {
        spawnConfetti(statsRef.current);
        showToast("Great job! Task completed 🎉");
      }
      return next;
    }));
  };

  /* ── Delete task ── */
  const deleteTodo = (id: string) => {
    setTodos(prev => prev.filter(t => t.id !== id));
    showToast("Task removed");
  };

  /* ── Inline edit ── */
  const startEdit = (todo: Todo) => {
    setEditingId(todo.id);
    setEditText(todo.text);
  };

  const saveEdit = () => {
    if (!editText.trim()) return;
    setTodos(prev => prev.map(t => t.id === editingId ? { ...t, text: editText.trim() } : t));
    setEditingId(null);
    showToast("Task updated ✓");
  };

  /* ── 3 Requested Action Buttons ── */
  // 1. Clear All
  const clearAll = () => {
    if (todos.length === 0) return;
    if (window.confirm("Are you sure you want to clear all tasks?")) {
      setTodos([]);
      showToast("All tasks cleared");
    }
  };

  // 2. Clear Completed
  const clearCompleted = () => {
    const count = todos.filter(t => t.completed).length;
    if (count === 0) {
      showToast("No completed tasks to clear");
      return;
    }
    setTodos(prev => prev.filter(t => !t.completed));
    showToast(`Cleared ${count} completed task${count > 1 ? "s" : ""}`);
  };

  // 3. Complete All
  const completeAll = () => {
    if (todos.length === 0) return;
    setTodos(prev => prev.map(t => ({ ...t, completed: true })));
    if (statsRef.current) spawnConfetti(statsRef.current);
    showToast("All tasks marked as completed! 🚀");
  };

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#08141B",
      color: "#F6F0ED",
      position: "relative",
    }}>
      {/* Background ambient lighting */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
        <div style={{
          position: "absolute", top: "-10%", left: "-10%",
          width: 520, height: 520,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(40, 83, 107, 0.22) 0%, transparent 70%)",
          filter: "blur(70px)",
        }} />
        <div style={{
          position: "absolute", bottom: "10%", right: "-5%",
          width: 480, height: 480,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(194, 148, 138, 0.12) 0%, transparent 70%)",
          filter: "blur(70px)",
        }} />
      </div>

      <div style={{
        position: "relative", zIndex: 1,
        maxWidth: 1140, margin: "0 auto",
        padding: "0 24px",
        display: "grid",
        gridTemplateColumns: "1fr 320px",
        gridTemplateRows: "auto 1fr",
        gap: "0 32px",
        minHeight: "100vh",
      }}>

        {/* ══════════════════════════════════
            HEADER
        ══════════════════════════════════ */}
        <header style={{
          gridColumn: "1 / -1",
          padding: "32px 0 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          {/* Logo & Brand */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 44, height: 44,
              borderRadius: 14,
              overflow: "hidden",
              flexShrink: 0,
              boxShadow: "0 6px 20px rgba(40, 83, 107, 0.5)",
            }}>
              <Image
                src="/logo.jpg"
                alt="XEROTODO Logo"
                width={44}
                height={44}
                style={{ objectFit: "cover", width: "100%", height: "100%" }}
                priority
              />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{
                  fontSize: 20,
                  fontWeight: 800,
                  color: "#C2948A",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}>
                  XEROTODO
                </span>
                <span style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#F6F0ED",
                  background: "#28536B",
                  padding: "2px 8px",
                  borderRadius: 6,
                  letterSpacing: "0.05em",
                }}>
                  FREE
                </span>
              </div>
              <p style={{ fontSize: 12, color: "#7EA8BE", marginTop: 1 }}>
                Instant & persistent • No login needed
              </p>
            </div>
          </div>

          {/* Optional Login / Account button */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={() => setShowLoginModal(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "#0E212D",
                color: "#F6F0ED",
                padding: "10px 18px",
                borderRadius: 14,
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
                transition: "all 0.2s ease",
              }}
              title="Optional Login / Cloud Sync"
            >
              <Icon.Login />
              <span>Login / Sync</span>
            </button>
          </div>
        </header>

        {/* ══════════════════════════════════
            MAIN COLUMN
        ══════════════════════════════════ */}
        <main style={{ paddingBottom: 50 }}>

          {/* ── Top Hero Stats Card (matching Image 1 layout) ── */}
          <div ref={statsRef} className="seamless-card animate-fadeInUp" style={{
            padding: "28px 32px",
            marginBottom: 26,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 24,
            position: "relative",
            overflow: "hidden",
          }}>
            <div>
              <h2 style={{
                fontSize: 32,
                fontWeight: 800,
                color: "#F6F0ED",
                letterSpacing: "-0.02em",
                lineHeight: 1.15,
              }}>
                Todo Done
              </h2>
              <p style={{
                fontSize: 16,
                fontWeight: 500,
                color: "#BBB193",
                marginTop: 6,
                letterSpacing: "0.02em",
              }}>
                {total === 0 ? "ready for action" : done === total ? "all caught up! 🌟" : "keep it up"}
              </p>

              {/* Progress bar */}
              {total > 0 && (
                <div style={{ marginTop: 18, width: 220 }}>
                  <div style={{
                    height: 6,
                    borderRadius: 9999,
                    background: "#0E212D",
                    overflow: "hidden",
                  }}>
                    <div style={{
                      height: "100%",
                      width: `${(done / total) * 100}%`,
                      background: "linear-gradient(90deg, #28536B, #7EA8BE)",
                      borderRadius: 9999,
                      transition: "width 0.5s ease",
                    }} />
                  </div>
                </div>
              )}
            </div>

            {/* Prominent circular counter badge */}
            <div style={{
              width: 104,
              height: 104,
              borderRadius: "50%",
              background: done === total && total > 0
                ? "linear-gradient(135deg, #7EA8BE, #28536B)"
                : "linear-gradient(135deg, #C2948A, #28536B)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 10px 28px rgba(194, 148, 138, 0.4)",
              flexShrink: 0,
            }}>
              <span style={{
                fontSize: 26,
                fontWeight: 800,
                color: "#F6F0ED",
                letterSpacing: "-0.03em",
                lineHeight: 1,
              }}>
                {done}/{total}
              </span>
              <span style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: "uppercase",
                color: "#F6F0ED",
                opacity: 0.85,
                marginTop: 4,
                letterSpacing: "0.05em",
              }}>
                COMPLETED
              </span>
            </div>
          </div>

          {/* ── Quick Input + Plus Add Button ── */}
          <div className="animate-fadeInUp" style={{ animationDelay: "60ms", marginBottom: 20 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <input
                ref={inputRef}
                id="task-input-field"
                className="seamless-input"
                type="text"
                placeholder="write your next task"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") addTodo(); }}
                maxLength={240}
              />
              <button
                id="add-task-btn"
                className="add-btn"
                onClick={addTodo}
                aria-label="Add Task"
                title="Add task"
              >
                <Icon.Plus />
              </button>
            </div>

            {/* Priority Selector Pills */}
            <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "#7EA8BE", marginRight: 4 }}>Priority:</span>
              {(["high", "medium", "low"] as Priority[]).map(p => {
                const conf = PRIORITY_CONFIG[p];
                const active = priority === p;
                return (
                  <button
                    key={p}
                    onClick={() => setPriority(p)}
                    className="priority-pill"
                    style={{
                      background: active ? conf.bg : "#0E212D",
                      color: active ? conf.color : "#7EA8BE",
                      boxShadow: active ? "0 2px 8px rgba(0,0,0,0.3)" : "none",
                    }}
                  >
                    <span>{conf.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── The 3 Action Buttons Toolbar ── */}
          <div className="animate-fadeInUp" style={{
            animationDelay: "110ms",
            marginBottom: 20,
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            {/* 3 Requested Action Buttons */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
              {/* 1. Clear All */}
              <button
                id="btn-clear-all"
                className="bulk-btn bulk-btn-clear-all"
                onClick={clearAll}
                title="Delete all tasks"
              >
                <Icon.Trash />
                <span>1. Clear All</span>
              </button>

              {/* 2. Clear Completed */}
              <button
                id="btn-clear-completed"
                className="bulk-btn bulk-btn-clear-completed"
                onClick={clearCompleted}
                title="Remove only finished tasks"
              >
                <Icon.Broom />
                <span>2. Clear Completed</span>
              </button>

              {/* 3. Complete All */}
              <button
                id="btn-complete-all"
                className="bulk-btn bulk-btn-complete"
                onClick={completeAll}
                title="Mark all tasks as done"
              >
                <Icon.CheckAll />
                <span>3. Complete All</span>
              </button>
            </div>

            {/* Filter Tabs */}
            <div style={{ display: "flex", gap: 6, background: "#08141B", padding: 4, borderRadius: 14 }}>
              {(["all", "active", "completed"] as Filter[]).map(f => (
                <button
                  key={f}
                  className={`filter-tab ${filter === f ? "active" : ""}`}
                  onClick={() => setFilter(f)}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                  {f === "all" && total > 0 && (
                    <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.8 }}>({total})</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* ── Tasks List ── */}
          <div className="animate-fadeInUp stagger-children" style={{
            animationDelay: "150ms",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}>
            {filtered.length === 0 ? (
              <div className="seamless-card animate-scaleIn" style={{
                padding: "48px 24px",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 10,
              }}>
                <div style={{
                  width: 56, height: 56, borderRadius: "50%",
                  background: "#0E212D", display: "flex",
                  alignItems: "center", justifyContent: "center",
                  color: "#7EA8BE",
                }}>
                  <Icon.Check />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: "#F6F0ED" }}>
                  {filter === "completed" ? "No completed tasks yet" : filter === "active" ? "All clear! No pending tasks" : "Your task list is empty"}
                </h3>
                <p style={{ fontSize: 13, color: "#7EA8BE", maxWidth: 320 }}>
                  Add a task using the bar above. Your tasks persist automatically without requiring an account.
                </p>
              </div>
            ) : (
              filtered.map(todo => {
                const conf = PRIORITY_CONFIG[todo.priority];
                return (
                  <div
                    key={todo.id}
                    className="seamless-item animate-slideRight"
                    style={{
                      padding: "16px 20px",
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                      opacity: todo.completed ? 0.65 : 1,
                    }}
                  >
                    {/* Circle checkbox (borderless filled / pill) */}
                    <button
                      className={`todo-checkbox ${todo.completed ? "checked" : ""}`}
                      onClick={() => toggleTodo(todo.id)}
                      aria-label={todo.completed ? "Mark pending" : "Mark completed"}
                    >
                      {todo.completed && <Icon.Check />}
                    </button>

                    {/* Task Content / Inline Edit */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {editingId === todo.id ? (
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <input
                            className="edit-input"
                            value={editText}
                            onChange={e => setEditText(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === "Enter") saveEdit();
                              if (e.key === "Escape") setEditingId(null);
                            }}
                            autoFocus
                            maxLength={240}
                          />
                          <button
                            className="action-btn"
                            onClick={saveEdit}
                            style={{ background: "#28536B", color: "#F6F0ED" }}
                            title="Save"
                          >
                            <Icon.Save />
                          </button>
                          <button
                            className="action-btn"
                            onClick={() => setEditingId(null)}
                            title="Cancel"
                          >
                            <Icon.Close />
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{
                            fontSize: 16,
                            fontWeight: 600,
                            color: todo.completed ? "#BBB193" : "#F6F0ED",
                            textDecoration: todo.completed ? "line-through" : "none",
                            textDecorationColor: "#BBB193",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}>
                            {todo.text}
                          </span>
                          <span style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: 6,
                            background: conf.bg,
                            color: conf.color,
                            textTransform: "uppercase",
                            letterSpacing: "0.04em",
                            flexShrink: 0,
                          }}>
                            {conf.label}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action icons (Edit & Delete) */}
                    {editingId !== todo.id && (
                      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                        <button
                          className="action-btn"
                          onClick={() => startEdit(todo)}
                          title="Edit Task"
                        >
                          <Icon.Edit />
                        </button>
                        <button
                          className="action-btn delete"
                          onClick={() => deleteTodo(todo.id)}
                          title="Delete Task"
                        >
                          <Icon.Trash />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </main>

        {/* ══════════════════════════════════
            SIDEBAR (Monetization Ads & Tips)
        ══════════════════════════════════ */}
        <aside style={{ paddingBottom: 50, display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Ad Slot 1 (Medium Rectangle 300x250) */}
          <div className="ad-slot animate-fadeIn" style={{ minHeight: 250, flexDirection: "column", gap: 10, padding: 20 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 12,
              background: "#142C3B", display: "flex",
              alignItems: "center", justifyContent: "center",
              color: "#C2948A",
            }}>
              <Icon.AdSparkle />
            </div>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontWeight: 700, fontSize: 13, color: "#F6F0ED" }}>Sponsored Slot</p>
              <p style={{ fontSize: 11, color: "#7EA8BE", marginTop: 4 }}>300 × 250 Display Ad</p>
              <p style={{ fontSize: 10, color: "#BBB193", marginTop: 8, opacity: 0.7 }}>
                Paste Google AdSense / Mediavine tag here
              </p>
            </div>
          </div>

          {/* Quick Shortcuts & Perks */}
          <div className="seamless-card animate-fadeIn" style={{ padding: 22 }}>
            <h3 style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#BBB193",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: 16,
            }}>
              Productivity Perks
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { title: "Zero Friction", desc: "No login, no paywalls. Free forever." },
                { title: "Browser Storage", desc: "Reload anytime; tasks never vanish." },
                { title: "Bulk Controls", desc: "Clear all, clear done, or complete all in 1 click." },
              ].map(item => (
                <div key={item.title}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#F6F0ED" }}>{item.title}</p>
                  <p style={{ fontSize: 12, color: "#7EA8BE", marginTop: 2, lineHeight: 1.4 }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Ad Slot 2 (Half Page / Skyscraper 300x300) */}
          <div className="ad-slot animate-fadeIn" style={{ minHeight: 280, flexDirection: "column", gap: 10, padding: 20 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 12,
              background: "#142C3B", display: "flex",
              alignItems: "center", justifyContent: "center",
              color: "#7EA8BE",
            }}>
              <Icon.AdSparkle />
            </div>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontWeight: 700, fontSize: 13, color: "#F6F0ED" }}>Banner Ad Space</p>
              <p style={{ fontSize: 11, color: "#7EA8BE", marginTop: 4 }}>300 × 280 Responsive Ad</p>
              <p style={{ fontSize: 10, color: "#BBB193", marginTop: 8, opacity: 0.7 }}>
                Monetize your high-traffic free tool
              </p>
            </div>
          </div>
        </aside>
      </div>

      {/* ── Footer ── */}
      <footer style={{
        position: "relative", zIndex: 1,
        padding: "24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
        fontSize: 12,
        color: "#7EA8BE",
        background: "#050D12",
      }}>
        <span>© 2026 XEROTODO</span>
        <span>•</span>
        <span>Free for everyone</span>
        <span>•</span>
        <span>Client-side persistent storage</span>
      </footer>

      {/* ── Optional Login / Sync Modal ── */}
      {showLoginModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(5, 13, 18, 0.75)",
          backdropFilter: "blur(8px)",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
        }}>
          <div className="seamless-card animate-scaleIn" style={{
            maxWidth: 420,
            width: "100%",
            padding: 32,
            position: "relative",
          }}>
            <button
              onClick={() => setShowLoginModal(false)}
              style={{
                position: "absolute",
                top: 20, right: 20,
                background: "#0E212D",
                color: "#7EA8BE",
                width: 32, height: 32,
                borderRadius: 10,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <Icon.Close />
            </button>

            <h3 style={{ fontSize: 22, fontWeight: 800, color: "#F6F0ED" }}>
              Cloud Sync <span style={{ fontSize: 12, color: "#C2948A" }}>(Optional)</span>
            </h3>
            <p style={{ fontSize: 13, color: "#7EA8BE", marginTop: 8, lineHeight: 1.5 }}>
              TaskFlow is <strong>100% free with no login required</strong>. Your tasks are already automatically saved in your browser.
            </p>
            <p style={{ fontSize: 13, color: "#BBB193", marginTop: 10, lineHeight: 1.5 }}>
              Only sign in if you want to sync your tasks across multiple phones and computers:
            </p>

            <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 12 }}>
              <input
                type="email"
                className="seamless-input"
                placeholder="Enter your email"
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
              />
              <button
                onClick={() => {
                  if (!loginEmail.trim()) {
                    showToast("Please enter an email");
                    return;
                  }
                  setShowLoginModal(false);
                  showToast(`Magic link sent to ${loginEmail}!`);
                  setLoginEmail("");
                }}
                className="bulk-btn bulk-btn-complete"
                style={{
                  justifyContent: "center",
                  padding: "14px",
                  fontSize: 14,
                  borderRadius: 14,
                }}
              >
                Send Magic Link
              </button>
            </div>

            <p style={{ fontSize: 11, color: "#7EA8BE", textAlign: "center", marginTop: 16 }}>
              You can keep using the app for free without an account.
            </p>
          </div>
        </div>
      )}

      {/* ── Toast Notification ── */}
      <div
        className={`toast ${toastVisible ? "show" : ""}`}
        role="status"
        aria-live="polite"
      >
        {toastMsg}
      </div>
    </div>
  );
}
