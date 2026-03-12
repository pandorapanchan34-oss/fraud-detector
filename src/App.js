import { useState } from "react";

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!input.trim() || loading) return;

    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: newMessages,
        }),
      });

      const data = await response.json();
      const reply = data.content?.[0]?.text || "エラーが発生しました";
      setMessages([...newMessages, { role: "assistant", content: reply }]);
    } catch (e) {
      setMessages([...newMessages, { role: "assistant", content: "エラーが発生しました" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "40px auto", padding: "0 20px", fontFamily: "sans-serif" }}>
      <h2>チャット</h2>

      <div style={{ border: "1px solid #ddd", borderRadius: 8, height: 400, overflowY: "auto", padding: 16, marginBottom: 12 }}>
        {messages.length === 0 && <p style={{ color: "#aaa" }}>メッセージを送ってみよう</p>}
        {messages.map((m, i) => (
          <div key={i} style={{ marginBottom: 12, textAlign: m.role === "user" ? "right" : "left" }}>
            <span style={{
              display: "inline-block", padding: "8px 12px", borderRadius: 12,
              background: m.role === "user" ? "#1d4ed8" : "#f0f0f0",
              color: m.role === "user" ? "white" : "black",
              maxWidth: "80%", fontSize: 14, lineHeight: 1.5
            }}>
              {m.content}
            </span>
          </div>
        ))}
        {loading && <p style={{ color: "#aaa", fontSize: 14 }}>返答中...</p>}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="メッセージを入力..."
          style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14 }}
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          style={{ padding: "10px 20px", background: "#1d4ed8", color: "white", border: "none", borderRadius: 8, cursor: "pointer" }}
        >
          送信
        </button>
      </div>
    </div>
  );
}
