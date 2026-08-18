"use client";

import { useState, useEffect } from "react";
import ChatWindow from "./ChatWindow";
import { MessageCircle, X } from "lucide-react";

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
    } else {
      // keep mounted briefly so the close animation plays out
      const t = setTimeout(() => setMounted(false), 300);
      return () => clearTimeout(t);
    }
  }, [open]);

  return (
    <>
      {mounted && (
        <ChatWindow visible={open} onClose={() => setOpen(false)} />
      )}

      {/* FAB */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Toggle chat"
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 9999,
          width: 56,
          height: 56,
          borderRadius: 18,
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: open
            ? "#f1f5f9"
            : "linear-gradient(135deg,#6366f1,#7c3aed)",
          boxShadow: open
            ? "0 2px 10px rgba(0,0,0,0.08)"
            : "0 4px 20px rgba(99,102,241,0.45)",
          transition: "all 0.25s cubic-bezier(0.34,1.4,0.64,1)",
        }}
        onMouseEnter={e => {
          if (!open) (e.currentTarget as HTMLElement).style.transform = "scale(1.1) translateY(-2px)";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.transform = "scale(1)";
        }}
      >
        {open
          ? <X size={22} color="#64748b" strokeWidth={2} />
          : <MessageCircle size={22} color="#fff" strokeWidth={2} />
        }
      </button>
    </>
  );
}
