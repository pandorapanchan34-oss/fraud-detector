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
  1: { color: "#00ff88", glow: "#00ff8844", emoji: "😲", label: "SAFE" },
  2: { color: "#ffe500", glow: "#ffe50044", emoji: "👀", label: "CAUTION" },
  3: { color: "#ff8c00", glow: "#ff8c0044", emoji: "💥", label: "WARNING" },
  4: { color: "#ff2d2d", glow: "#ff2d2d44", emoji: "🤖", label: "DANGER" },
  5: { color: "#ff00ff", glow: "#ff00ff44", emoji: "🚀", label: "FRAUD" },
};

function ScanLine() {
  return (
    <div style={{
      position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
      background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.12) 2px, rgba(0,0,0,0.12) 4px)",
      pointerEvents: "none", borderRadius: "inherit",
    }} />
  );
}

const TABS = ["判定", "ビジョン", "収益の流れ"];

export default function App() {
  const [tab, setTab] = useState(0);
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [blink, setBlink] = useState(true);

  useEffect(() => {
    const t = setInterval(() => setBlink(b => !b), 600);
    return () => clearInterval(t);
  }, []);

  const analyze = async () => {
    if (!input.trim() || loading) return;
    setLoading(true); setError(""); setResult(null);
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
      setResult(JSON.parse(text.replace(/```json|```/g, "").trim()));
    } catch (e) {
      setError("エラー: " + (e?.message || "不明"));
    } finally {
      setLoading(false);
    }
  };

  const cfg = result ? LEVEL_CONFIG[result.level] || LEVEL_CONFIG[3] : null;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#050508",
      backgroundImage: "radial-gradient(ellipse at 50% 0%, #0a0a1a 0%, #050508 70%)",
      padding: "24px 16px",
      fontFamily: "'Courier New', monospace",
    }}>
      <style>{`
        @keyframes flicker { 0%,100%{opacity:1} 92%{opacity:1} 93%{opacity:0.8} 95%{opacity:1} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.03)} }
        @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-4px)} 75%{transform:translateX(4px)} }
        .fade-in { animation: fadeIn 0.5s ease forwards; }
        .danger-shake { animation: shake 0.3s ease infinite; }
        .tab-btn:hover { opacity: 0.8; }
      `}</style>

      <div style={{ maxWidth: 560, margin: "0 auto" }}>

        {/* ヘッダー */}
        <div style={{ textAlign: "center", marginBottom: 24, animation: "flicker 5s infinite" }}>
          <div style={{ fontSize: 10, color: "#ff2d2d", letterSpacing: 6, marginBottom: 6 }}>▸ SYSTEM ACTIVE ◂</div>
          <h1 style={{
            fontSize: 20, fontWeight: 900, margin: 0, color: "#fff", letterSpacing: 2,
            textShadow: "0 0 20px #ff2d2d, 0 0 40px #ff2d2d66"
          }}>
            🔍 詐欺商材<span style={{ color: "#ff2d2d" }}>判定</span>システム
          </h1>
          <div style={{ fontSize: 10, color: "#333", letterSpacing: 4, marginTop: 4 }}>FRAUD DETECTION AI v2.0</div>
        </div>

        {/* タブ */}
        <div style={{ display: "flex", gap: 4, marginBottom: 24 }}>
          {TABS.map((t, i) => (
            <button key={i} className="tab-btn" onClick={() => setTab(i)} style={{
              flex: 1, padding: "8px 0", background: tab === i ? "#ff2d2d22" : "transparent",
              border: tab === i ? "1px solid #ff2d2d" : "1px solid #1a1a2a",
              color: tab === i ? "#ff2d2d" : "#555", borderRadius: 6,
              fontSize: 12, letterSpacing: 2, cursor: "pointer",
              fontFamily: "'Courier New', monospace",
            }}>{t}</button>
          ))}
        </div>

        {/* ===== 判定タブ ===== */}
        {tab === 0 && (
          <div className="fade-in">
            {error && (
              <div style={{
                background: "#1a0000", border: "1px solid #ff2d2d", borderRadius: 8,
                padding: "10px 14px", marginBottom: 14, color: "#ff6666", fontSize: 13,
                boxShadow: "0 0 20px #ff2d2d44"
              }}>⚠ {error}</div>
            )}

            <div style={{ position: "relative", marginBottom: 12 }}>
              <div style={{
                position: "absolute", top: -10, left: 12, background: "#050508",
                padding: "0 8px", color: "#ff2d2d", fontSize: 10, letterSpacing: 3
              }}>INPUT_TARGET</div>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="商材・勧誘文句・サービス内容を貼り付けてください..."
                style={{
                  width: "100%", height: 130, padding: "20px 14px 14px",
                  background: "#0a0a0f", color: "#aaffcc",
                  border: "1px solid #1a3a2a", borderRadius: 8,
                  fontSize: 13, resize: "vertical", boxSizing: "border-box",
                  outline: "none", lineHeight: 1.7,
                  boxShadow: "inset 0 0 30px #00ff0808",
                  fontFamily: "'Courier New', monospace",
                }}
              />
              <ScanLine />
            </div>

            <button onClick={analyze} disabled={loading || !input.trim()} style={{
              width: "100%", padding: "13px 0",
              background: loading ? "#111" : "linear-gradient(135deg, #ff2d2d, #aa0000)",
              color: loading ? "#444" : "#fff",
              border: loading ? "1px solid #333" : "1px solid #ff2d2d",
              borderRadius: 8, fontSize: 13, fontWeight: "bold", letterSpacing: 4,
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: loading ? "none" : "0 0 20px #ff2d2d66",
              marginBottom: 24, fontFamily: "'Courier New', monospace",
              animation: loading ? "none" : "pulse 2s infinite",
            }}>
              {loading ? "[ ANALYZING... ]" : "[ 判定開始 ]"}
            </button>

            {result && cfg && (
              <div className={`fade-in ${result.level >= 4 ? "danger-shake" : ""}`} style={{
                border: `1px solid ${cfg.color}`, borderRadius: 12, overflow: "hidden",
                boxShadow: `0 0 40px ${cfg.glow}, 0 0 80px ${cfg.glow}`,
                position: "relative",
              }}>
                <ScanLine />
                {/* 判定ヘッダー */}
                <div style={{
                  background: `linear-gradient(135deg, ${cfg.color}22, ${cfg.color}11)`,
                  borderBottom: `1px solid ${cfg.color}44`,
                  padding: "18px 20px 14px", textAlign: "center",
                }}>
                  <div style={{ fontSize: 10, color: cfg.color, letterSpacing: 6, marginBottom: 6 }}>
                    {blink ? "▸ SCAN COMPLETE ◂" : "　"}
                  </div>
                  <div style={{ fontSize: 48 }}>{cfg.emoji}</div>
                  <div style={{
                    fontSize: 26, fontWeight: 900, marginTop: 6, letterSpacing: 4,
                    color: cfg.color, textShadow: `0 0 20px ${cfg.color}`,
                  }}>{cfg.label}</div>
                  <div style={{ color: "#ccc", fontSize: 14, marginTop: 2 }}>{result.verdict}</div>
                  <div style={{ color: "#666", fontSize: 11, marginTop: 2 }}>{result.character}</div>
                </div>

                {/* スコアバー */}
                <div style={{ padding: "14px 20px", borderBottom: "1px solid #1a1a2a" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ color: "#444", fontSize: 10, letterSpacing: 3 }}>DANGER_LEVEL</span>
                    <span style={{ color: cfg.color, fontSize: 22, fontWeight: 900 }}>
                      {result.score}<span style={{ fontSize: 12, color: "#444" }}>/100</span>
                    </span>
                  </div>
                  <div style={{ background: "#111", borderRadius: 99, height: 8, overflow: "hidden" }}>
                    <div style={{
                      width: `${result.score}%`, height: "100%",
                      background: `linear-gradient(90deg, ${cfg.color}88, ${cfg.color})`,
                      boxShadow: `0 0 10px ${cfg.color}`, borderRadius: 99,
                    }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
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
                  <p style={{ color: "#aaa", fontSize: 13, lineHeight: 1.8, marginBottom: 16 }}>{result.explanation}</p>

                  {result.redFlags?.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ color: "#ff4444", fontSize: 10, letterSpacing: 4, marginBottom: 8 }}>▸ RED_FLAGS</div>
                      {result.redFlags.map((f, i) => (
                        <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, color: "#ff8888", fontSize: 13 }}>
                          <span style={{ color: "#ff4444", flexShrink: 0 }}>✗</span><span>{f}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {result.safePoints?.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ color: "#00ff88", fontSize: 10, letterSpacing: 4, marginBottom: 8 }}>▸ SAFE_POINTS</div>
                      {result.safePoints.map((f, i) => (
                        <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, color: "#88ffbb", fontSize: 13 }}>
                          <span style={{ color: "#00ff88", flexShrink: 0 }}>✓</span><span>{f}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ background: "#0a0a15", border: "1px solid #1a1a3a", borderRadius: 8, padding: 14 }}>
                    <div style={{ color: "#4488ff", fontSize: 10, letterSpacing: 4, marginBottom: 8 }}>▸ ADVICE</div>
                    <p style={{ color: "#88aaff", fontSize: 13, lineHeight: 1.7, margin: 0 }}>{result.advice}</p>
                  </div>

                  <div style={{
                    marginTop: 14, paddingTop: 12, borderTop: "1px solid #1a1a2a",
                    display: "flex", justifyContent: "space-between",
                  }}>
                    <span style={{ color: "#222", fontSize: 10 }}>FRAUD DETECTION AI</span>
                    <span style={{ color: cfg.color, fontSize: 10 }}>LEVEL {result.level} / 5</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===== ビジョンタブ ===== */}
        {tab === 1 && (
          <div className="fade-in" style={{
            border: "1px solid #1a1a3a", borderRadius: 12, overflow: "hidden",
            boxShadow: "0 0 40px #4488ff22",
          }}>
            <div style={{
              background: "linear-gradient(135deg, #4488ff22, #00aaff11)",
              borderBottom: "1px solid #1a1a3a", padding: "20px 20px 16px", textAlign: "center",
            }}>
              <div style={{ fontSize: 10, color: "#4488ff", letterSpacing: 6, marginBottom: 8 }}>▸ VISION ◂</div>
              <div style={{ fontSize: 32 }}>🌌</div>
              <div style={{ color: "#4488ff", fontSize: 16, fontWeight: 900, marginTop: 8, letterSpacing: 2 }}>
                Pandora Theory
              </div>
              <div style={{ color: "#666", fontSize: 11, marginTop: 4 }}>宇宙＝情報場 研究プロジェクト</div>
            </div>

            <div style={{ padding: "20px" }}>
              <div style={{ color: "#4488ff", fontSize: 10, letterSpacing: 4, marginBottom: 12 }}>▸ RESEARCH</div>
              <p style={{ color: "#aaa", fontSize: 13, lineHeight: 1.9, marginBottom: 20 }}>
                宇宙は物質ではなく、<span style={{ color: "#4488ff" }}>情報の計算場</span>である——<br />
                この仮説のもと、局所時間モデルと残差分析を組み合わせた独自理論「Pandora Theory」を構築中。第1章完成、全6〜7章構成。
              </p>

              <div style={{ color: "#4488ff", fontSize: 10, letterSpacing: 4, marginBottom: 12 }}>▸ MISSION</div>
              <p style={{ color: "#aaa", fontSize: 13, lineHeight: 1.9, marginBottom: 20 }}>
                AIは間違える。でも、<span style={{ color: "#00ff88" }}>その間違いを正直に見せられるAI</span>が人を守れる。<br /><br />
                大企業が独占しつつあるAIの未来を、普通の人・研究者・日本の開発者に取り戻す。<br />
                このツールの収益は、その活動を支えるために使われます。
              </p>

              <div style={{ color: "#4488ff", fontSize: 10, letterSpacing: 4, marginBottom: 12 }}>▸ PROGRESS</div>
              {[
                { label: "第1章 基礎原理（宇宙＝情報場）", done: true },
                { label: "第2章 局所時間の検証", done: false },
                { label: "第3章〜7章 理論展開", done: false },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "center" }}>
                  <span style={{ color: item.done ? "#00ff88" : "#333", fontSize: 14 }}>
                    {item.done ? "✓" : "○"}
                  </span>
                  <span style={{ color: item.done ? "#88ffbb" : "#444", fontSize: 13 }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== 収益の流れタブ ===== */}
        {tab === 2 && (
          <div className="fade-in" style={{
            border: "1px solid #1a3a2a", borderRadius: 12, overflow: "hidden",
            boxShadow: "0 0 40px #00ff8822",
          }}>
            <div style={{
              background: "linear-gradient(135deg, #00ff8822, #00ff8811)",
              borderBottom: "1px solid #1a3a2a", padding: "20px 20px 16px", textAlign: "center",
            }}>
              <div style={{ fontSize: 10, color: "#00ff88", letterSpacing: 6, marginBottom: 8 }}>▸ TRANSPARENCY ◂</div>
              <div style={{ fontSize: 32 }}>💰</div>
              <div style={{ color: "#00ff88", fontSize: 16, fontWeight: 900, marginTop: 8, letterSpacing: 2 }}>
                収益の流れ
              </div>
              <div style={{ color: "#666", fontSize: 11, marginTop: 4 }}>毎月収支を公開します</div>
            </div>

            <div style={{ padding: "20px" }}>
              {[
                { pct: 40, label: "サーバー・API運営費", color: "#555", desc: "ツールを無料で使い続けるための費用" },
                { pct: 35, label: "研究費", color: "#4488ff", desc: "Pandora Theory 論文執筆・検証費用" },
                { pct: 25, label: "日本のAI開発者への寄付", color: "#00ff88", desc: "個人開発者・研究者への直接支援" },
              ].map((item, i) => (
                <div key={i} style={{ marginBottom: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ color: item.color, fontSize: 13, fontWeight: "bold" }}>{item.label}</span>
                    <span style={{ color: item.color, fontSize: 18, fontWeight: 900 }}>{item.pct}%</span>
                  </div>
                  <div style={{ background: "#111", borderRadius: 99, height: 8, marginBottom: 6 }}>
                    <div style={{
                      width: `${item.pct}%`, height: "100%",
                      background: `linear-gradient(90deg, ${item.color}88, ${item.color})`,
                      boxShadow: `0 0 8px ${item.color}`, borderRadius: 99,
                    }} />
                  </div>
                  <div style={{ color: "#555", fontSize: 11 }}>{item.desc}</div>
                </div>
              ))}

              <div style={{
                background: "#0a0a0f", border: "1px solid #1a1a2a",
                borderRadius: 8, padding: 14, marginTop: 8,
              }}>
                <div style={{ color: "#00ff88", fontSize: 10, letterSpacing: 4, marginBottom: 8 }}>▸ COMMITMENT</div>
                <p style={{ color: "#888", fontSize: 12, lineHeight: 1.8, margin: 0 }}>
                  このツールは<span style={{ color: "#fff" }}>完全無料</span>で公開しています。<br />
                  サポートしてくださる方の支援が、AIの民主化と日本の研究者を支えます。<br />
                  収益・寄付先は毎月このページで公開します。
                </p>
              </div>
            </div>
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: 24, color: "#222", fontSize: 10, letterSpacing: 2 }}>
          PANDORA PROJECT © 2025 — AI FOR EVERYONE
        </div>
      </div>
    </div>
  );
}
