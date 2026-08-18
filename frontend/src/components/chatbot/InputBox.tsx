"use client";
import { useState } from "react";
import { Send } from "lucide-react";

export default function InputBox({ onSend }: { onSend: (text: string) => void }) {
  const [input, setInput] = useState("");
  const [focused, setFocused] = useState(false);

  function submit() {
    if (!input.trim()) return;
    onSend(input);
    setInput("");
  }

  return (
    <div style={{ display: "flex", gap: 8, padding: "10px 12px", alignItems: "center" }}>
      <input
        style={{
          flex: 1,
          border: `1.5px solid ${focused ? "#a5b4fc" : "#e2e8f0"}`,
          borderRadius: 100,
          padding: "9px 16px",
          fontSize: 13,
          color: "#1e293b",
          background: "#f8fafc",
          outline: "none",
          transition: "border-color 0.2s",
        }}
        placeholder="Ask me anything…"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => e.key === "Enter" && submit()}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      <button
        onClick={submit}
        disabled={!input.trim()}
        style={{
          width: 36, height: 36, borderRadius: "50%",
          border: "none", cursor: input.trim() ? "pointer" : "default",
          background: "linear-gradient(135deg,#6366f1,#7c3aed)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
          opacity: input.trim() ? 1 : 0.4,
          transition: "opacity 0.2s, transform 0.15s",
        }}
        onMouseEnter={e => { if (input.trim()) (e.currentTarget as HTMLElement).style.transform = "scale(1.08)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
      >
        <Send size={15} color="#fff" strokeWidth={2.2} style={{ transform: "translateX(1px)" }} />
      </button>
    </div>
  );
}
