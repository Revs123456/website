"use client";
import { useState, useRef, useEffect } from "react";
import MessageBubble from "./MessageBubble";
import InputBox from "./InputBox";
import { MessageCircle, X } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4001";

interface Props {
  onClose: () => void;
  visible: boolean;
}

export default function ChatWindow({ onClose, visible }: Props) {
  const [messages, setMessages] = useState([
    { role: "bot", text: "Hi 👋 I'm your Career Assistant. How can I help you today?" },
  ]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    const updated = [...messages, { role: "user", text }];
    setMessages(updated);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/v1/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      setMessages([...updated, { role: "bot", text: data.reply }]);
    } catch {
      setMessages([...updated, { role: "bot", text: "Something went wrong. Please try again." }]);
    }
    setLoading(false);
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: 88,
        right: 24,
        /* Clamp width: 360px on desktop, full width minus 32px on mobile */
        width: "min(360px, calc(100vw - 32px))",
        /* Clamp height: never taller than 70% viewport so hero stays visible */
        maxHeight: "min(520px, calc(100vh - 140px))",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        background: "#ffffff",
        borderRadius: 20,
        boxShadow: "0 12px 48px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.06)",
        border: "1px solid #e8eaf0",
        overflow: "hidden",
        /* Slide-up + fade animation */
        transition: "opacity 0.25s ease, transform 0.3s cubic-bezier(0.34,1.4,0.64,1)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0) scale(1)" : "translateY(16px) scale(0.96)",
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      {/* ── Header ── */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "14px 16px",
        borderBottom: "1px solid #f1f3f8",
        flexShrink: 0,
        background: "#fff",
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          background: "linear-gradient(135deg,#6366f1,#7c3aed)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, position: "relative",
        }}>
          <MessageCircle size={16} color="#fff" strokeWidth={2.2} />
          <span style={{
            position: "absolute", bottom: 1, right: 1,
            width: 10, height: 10, borderRadius: "50%",
            background: "#22c55e", border: "2px solid #fff",
          }} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#0f172a" }}>Career Assistant</p>
          <p style={{ margin: 0, fontSize: 11, color: "#22c55e", fontWeight: 500 }}>● Online · Replies instantly</p>
        </div>
        <button
          onClick={onClose}
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: "#94a3b8", padding: 6, borderRadius: 8,
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "background 0.15s",
          }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "#f1f5f9")}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "none")}
        >
          <X size={17} strokeWidth={2} />
        </button>
      </div>

      {/* ── Messages ── */}
      {/* min-h-0 is critical — lets flex child shrink and scroll properly */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "16px 14px 8px",
        background: "#f8fafc",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        minHeight: 0,
      }}>
        {messages.map((m, i) => (
          <MessageBubble key={i} role={m.role} text={m.text} />
        ))}

        {loading && (
          <div style={{ display: "flex", alignItems: "flex-start" }}>
            <div style={{
              background: "#fff",
              border: "1px solid #e8eaf0",
              borderRadius: "16px 16px 16px 4px",
              padding: "12px 16px",
              display: "flex", gap: 5, alignItems: "center",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}>
              {[0, 150, 300].map(d => (
                <span key={d} style={{
                  width: 7, height: 7, borderRadius: "50%",
                  background: "#c7d2fe", display: "inline-block",
                  animation: "tcb-bounce 0.9s infinite",
                  animationDelay: `${d}ms`,
                }} />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      <div style={{ flexShrink: 0, background: "#fff", borderTop: "1px solid #f1f3f8" }}>
        <InputBox onSend={sendMessage} />
      </div>

      <style>{`
        @keyframes tcb-bounce {
          0%,80%,100% { transform:translateY(0); }
          40%          { transform:translateY(-5px); }
        }
      `}</style>
    </div>
  );
}
