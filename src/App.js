import { useState, useEffect } from "react";

const SYSTEM_PROMPT = `あなたは詐欺商材を判定する専門AIです。
ユーザーが入力した商材・サービス・勧誘文句を分析し、以下のJSON形式のみで返答してください。
他のテキストは一切含めないこと。

{
  "score": 0から100の数値（100が最も危険）,
  "level": 1から5の整数,
  "verdict": "安心" または "やや注意" または "要注意" または "危険" または "詐欺の疑い強",
  "character": "AIがビックリして画面から飛び出すレベル" または "AIが様子見するレベル" または "AIがサーバーエラーを起こすレベル" または "AIがターミネーターになるレベル" または "AIが火星に移動するレベル",
  "redFlags": ["危険ポイント1", "危険ポイント2"],
  "safePoints": ["安全ポイント1"],
  "explanation": "判定理由を150字程度で",
  "advice": "ユーザーへのアドバイスを100字程度で"
}

レベル定義：
1（0-20点）: 安心 → AIがビックリして画面から飛び出すレベル
2（21-40点）: やや注意 → AIが様子見するレベル
3（41-60点）: 要注意 → AIがサーバーエラーを起こすレベル
4（61-80点）: 危険 → AIがターミネーターになるレベル
5（81-100点）: 詐欺の疑い強 → AIが火星に移動するレベル`;

const LEVEL_CONFIG = {
  1: { color: "#00ff88", glow: "#00ff8844", emoji: "😲", label: "SAFE", scanColor: "#00ff88" },
  2: { color: "#ffe500", glow: "#ffe50044", emoji: "👀", label: "CAUTION", scanColor: "#ffe500" },
  3: { color: "#ff8c00", glow: "#ff8c0044", emoji: "💥", label: "WARNING", scanColor: "#ff8c00" },
  4: { color: "#ff2d2d", glow: "#ff2d2d44", emoji: "🤖", label: "DANGER", scanColor: "#ff2d2d" },
  5: { color: "#ff00ff", glow: "#ff00ff44", emoji: "🚀", label: "FRAUD", scanColor: "#ff00ff" },
};

function GlitchText({ text, color }) {
  return (
    <span style={{
      color, fontFamily: "'Courier New', monospace",
      textShadow: `0 0 10px ${color}, 0 0 20px ${color}, 2px 2px 0 #ff000044`,
      letterSpacing: 4,
    }}>{text}</span>
  );
}

function ScanLine() {
  return (
    <div style={{
      position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
      background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)",
      pointerEvents: "none", borderRadius: 12,
    }} />
  );
}

export default function App() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [scanY, setScanY] = useState(0);
  const [blink, setBlink] = useState(true);

  useEffect(() => {
    const t = setInterval(() => setScanY(y => (y + 2) % 100), 20);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setBlink(b => !b), 600);
    return () => clearInterval(t);
  }, []);

  const analyze = async () => {
    if (!input.trim() || loading) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.REACT_APP_ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: input }],
        }),
      });

      const data = await response.json();
      if (data.error) { setError("APIエラー: " + data.error.message); return; }
      const text = data.content?.[0]?.text || "";
      const clean = text.replace(/```json|```/g, "").trim();
      setResult(JSON.parse(clean));
    } catch (e) {
      setError("エラー: " + (e?.message || "不明"));
    } finally {
      setLoading(false);
    }
  };

  const cfg = result ? LEVEL_CONFIG[result.level] || LEVEL_CONFIG[3] : null;

  return (
    <div style={{
      minHeight: "100vh", background: "#050508",
      backgroundImage: "radial-gradient(ellipse at 50% 0%, #0a0a1a 0%, #050508 70%)",
      padding: "24px 16px", fontFamily: "'Courier New', monospace",
    }}>
      <style>{`
        @keyframes flicker { 0%,100%{opacity:1} 92%{opacity:1} 93%{opacity:0.8} 95%{opacity:1} 97%{opacity:0.9} }
        @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }
        @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-4px)} 75%{transform:translateX(4px)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes scanMove { from{top:0%} to{top:100%} }
        .result-card { animation: fadeIn 0.5s ease forwards; }
        .danger-shake { animation: shake 0.3s ease infinite; }
      `}</style>

      <div style={{ maxWidth: 560, margin: "0 auto" }}>

        {/* ヘッダー */}
        <div style={{ textAlign: "center", marginBottom: 32, animation: "flicker 4s infinite" }}>
          <div style={{ fontSize: 11, color: "#ff2d2d", letterSpacing: 6, marginBottom: 8 }}>
            ▸ SYSTEM ACTIVE ◂
          </div>
          <h1 style={{
            fontSize: 22, fontWeight: 900, margin: 0,
            color: "#fff", letterSpacing: 3,
            textShadow: "0 0 20px #ff2d2d, 0 0 40px #ff2d2d66"
          }}>
            🔍 詐欺商材<span style={{ color: "#ff2d2d" }}>判定</span>システム
          </h1>
          <div style={{ fontSize: 10, color: "#444", letterSpacing: 4, marginTop: 6 }}>
            FRAUD DETECTION AI v2.0
          </div>
        </div>

        {/* エラー */}
        {error && (
          <div style={{
            background: "#1a0000", border: "1px solid #ff2d2d",
            borderRadius: 8, padding: "12px 16px", marginBottom: 16,
            color: "#ff6666", fontSize: 13,
            boxShadow: "0 0 20px #ff2d2d44"
          }}>⚠ {error}</div>
        )}

        {/* 入力エリア */}
        <div style={{ position: "relative", marginBottom: 12 }}>
          <div style={{
            position: "absolute", top: -10, left: 12,
            background: "#050508", padding: "0 8px",
            color: "#ff2d2d", fontSize: 10, letterSpacing: 3
          }}>INPUT_TARGET</div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="商材・勧誘文句・サービス内容を貼り付けてください..."
            style={{
              width: "100%", height: 140, padding: "20px 14px 14px",
              background: "#0a0a0f", color: "#aaffcc",
              border: "1px solid #1a3a2a", borderRadius: 8,
              fontSize: 13, resize: "vertical", boxSizing: "border-box",
              outline: "none", lineHeight: 1.7,
              boxShadow: "inset 0 0 30px #00ff0808",
            }}
          />
          <ScanLine />
        </div>

        {/* ボタン */}
        <button
          onClick={analyze}
          disabled={loading || !input.trim()}
          style={{
            width: "100%", padding: "14px 0",
            background: loading ? "#1a1a1a" : "linear-gradient(135deg, #ff2d2d, #aa0000)",
            color: loading ? "#444" : "#fff",
            border: loading ? "1px solid #333" : "1px solid #ff2d2d",
            borderRadius: 8, fontSize: 14, fontWeight: "bold",
            letterSpacing: 4, cursor: loading ? "not-allowed" : "pointer",
            boxShadow: loading ? "none" : "0 0 20px #ff2d2d66, inset 0 1px 0 #ff666644",
            marginBottom: 32, fontFamily: "'Courier New', monospace",
            animation: loading ? "none" : "pulse 2s infinite",
          }}
        >
          {loading ? "[ ANALYZING... ]" : "[ 判定開始 ]"}
        </button>

        {/* 結果 */}
        {result && cfg && (
          <div className={`result-card ${result.level >= 4 ? "danger-shake" : ""}`}
            style={{
              background: "#08080f",
              border: `1px solid ${cfg.color}`,
              borderRadius: 12, overflow: "hidden",
              boxShadow: `0 0 40px ${cfg.glow}, 0 0 80px ${cfg.glow}`,
              position: "relative",
            }}>
            <ScanLine />

            {/* 警告ヘッダー */}
            <div style={{
              background: `linear-gradient(135deg, ${cfg.color}22, ${cfg.color}11)`,
              borderBottom: `1px solid ${cfg.color}44`,
              padding: "20px 20px 16px", textAlign: "center",
              position: "relative",
            }}>
              <div style={{ fontSize: 11, color: cfg.color, letterSpacing: 6, marginBottom: 8 }}>
                {blink ? "▸ SCAN COMPLETE ◂" : "              "}
              </div>
              <div style={{ fontSize: 52 }}>{cfg.emoji}</div>
              <div style={{
                fontSize: 28, fontWeight: 900, marginTop: 8, letterSpacing: 4,
                color: cfg.color,
                textShadow: `0 0 20px ${cfg.color}, 0 0 40px ${cfg.color}`,
              }}>
                {cfg.label}
              </div>
              <div style={{ color: "#ccc", fontSize: 14, marginTop: 4, letterSpacing: 2 }}>
                {result.verdict}
              </div>
              <div style={{ color: "#888", fontSize: 11, marginTop: 4 }}>
                {result.character}
              </div>
            </div>

            {/* スコアバー */}
            <div style={{ padding: "16px 20px", borderBottom: `1px solid #1a1a2a` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ color: "#555", fontSize: 10, letterSpacing: 3 }}>DANGER_LEVEL</span>
                <span style={{ color: cfg.color, fontSize: 20, fontWeight: 900 }}>
                  {result.score}<span style={{ fontSize: 12, color: "#555" }}>/100</span>
                </span>
              </div>
              <div style={{ background: "#111", borderRadius: 99, height: 8, overflow: "hidden" }}>
                <div style={{
                  width: `${result.score}%`, height: "100%",
                  background: `linear-gradient(90deg, ${cfg.color}88, ${cfg.color})`,
                  boxShadow: `0 0 10px ${cfg.color}`,
                  borderRadius: 99, transition: "width 1s ease",
                }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                {[1,2,3,4,5].map(l => (
                  <div key={l} style={{
                    width: 28, height: 4, borderRadius: 2,
                    background: result.level >= l ? LEVEL_CONFIG[l].color : "#1a1a2a",
                    boxShadow: result.level >= l ? `0 0 6px ${LEVEL_CONFIG[l].color}` : "none",
                  }} />
                ))}
              </div>
            </div>

            {/* 詳細 */}
            <div style={{ padding: "16px 20px" }}>
              <p style={{ color: "#aaa", fontSize: 13, lineHeight: 1.8, marginBottom: 16 }}>
                {result.explanation}
              </p>

              {result.redFlags?.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ color: "#ff4444", fontSize: 10, letterSpacing: 4, marginBottom: 8 }}>
                    ▸ RED_FLAGS
                  </div>
                  {result.redFlags.map((f, i) => (
                    <div key={i} style={{
                      display: "flex", gap: 8, marginBottom: 6,
                      color: "#ff8888", fontSize: 13, lineHeight: 1.5,
                    }}>
                      <span style={{ color: "#ff4444", flexShrink: 0 }}>✗</span>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              )}

              {result.safePoints?.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ color: "#00ff88", fontSize: 10, letterSpacing: 4, marginBottom: 8 }}>
                    ▸ SAFE_POINTS
                  </div>
                  {result.safePoints.map((f, i) => (
                    <div key={i} style={{
                      display: "flex", gap: 8, marginBottom: 6,
                      color: "#88ffbb", fontSize: 13, lineHeight: 1.5,
                    }}>
                      <span style={{ color: "#00ff88", flexShrink: 0 }}>✓</span>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              )}

              <div style={{
                background: "#0a0a15", border: "1px solid #1a1a3a",
                borderRadius: 8, padding: 14, marginTop: 8,
              }}>
                <div style={{ color: "#4488ff", fontSize: 10, letterSpacing: 4, marginBottom: 8 }}>
                  ▸ ADVICE
                </div>
                <p style={{ color: "#88aaff", fontSize: 13, lineHeight: 1.7, margin: 0 }}>
                  {result.advice}
                </p>
              </div>

              {/* SNSシェア用フッター */}
              <div style={{
                marginTop: 16, paddingTop: 12,
                borderTop: "1px solid #1a1a2a",
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <span style={{ color: "#333", fontSize: 10, letterSpacing: 2 }}>
                  FRAUD DETECTION AI
                </span>
                <span style={{ color: cfg.color, fontSize: 10, letterSpacing: 2 }}>
                  LEVEL {result.level} / 5
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
