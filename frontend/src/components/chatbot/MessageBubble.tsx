export default function MessageBubble({ role, text }: { role: string; text: string }) {
  const isUser = role === "user";
  return (
    <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start" }}>
      <div style={{
        padding: "10px 14px",
        borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
        fontSize: 13,
        lineHeight: 1.6,
        maxWidth: "78%",
        wordBreak: "break-word",
        background: isUser
          ? "linear-gradient(135deg,#6366f1,#7c3aed)"
          : "#ffffff",
        color: isUser ? "#ffffff" : "#1e293b",
        boxShadow: isUser
          ? "0 2px 8px rgba(99,102,241,0.3)"
          : "0 1px 4px rgba(0,0,0,0.07)",
        border: isUser ? "none" : "1px solid #e8eaf0",
      }}>
        {text}
      </div>
    </div>
  );
}
