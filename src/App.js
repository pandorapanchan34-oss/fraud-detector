{ useState } from "react";

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

判定基準：
【金銭系】
- 「絶対儲かる」「リスクゼロ」などの利益保証
- 具体的な高額収入の提示（月収100万円など）
- 高額な初期費用・情報商材

【勧誘系】
- MLM・ネットワークビジネスの構造
- 「紹介するだけ」「友達に広めるだけ」
- 「今だけ限定」「残り3席」の焦らせ手法

【信頼偽装系】
- 著名人・有名企業の名前を無断使用
- 偽の実績・口コミ・メディア掲載
- 根拠のない受賞歴

【逃げ道系】
- 返金保証があるが条件不明
- 運営者情報が不透明
- 特定商取引法の記載なし

レベル定義：
1（0-20点）: 安心 → AIがビックリして画面から飛び出すレベル
2（21-40点）: やや注意 → AIが様子見するレベル
3（41-60点）: 要注意 → AIがサーバーエラーを起こすレベル
4（61-80点）: 危険 → AIがターミネーターになるレベル
5（81-100点）: 詐欺の疑い強 → AIが火星に移動するレベル`;

const LEVEL_STYLE = {
  1: { bg: "#f0fdf4", border: "#22c55e", color: "#15803d", emoji: "😲" },
  2: { bg: "#fefce8", border: "#eab308", color: "#854d0e", emoji: "👀" },
  3: { bg: "#fff7ed", border: "#f97316", color: "#9a3412", emoji: "💥" },
  4: { bg: "#fef2f2", border: "#ef4444", color: "#991b1b", emoji: "🤖" },
  5: { bg: "#1a0000", border: "#7f1d1d", color: "#fca5a5", emoji: "🚀" },
};

export default function App() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

      if (data.error) {
        setError("APIエラー: " + data.error.message);
        return;
      }

      const text = data.content?.[0]?.text || "";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setResult(parsed);

    } catch (e) {
      setError("エラー: " + (e?.message || "不明"));
    } finally {
      setLoading(false);
    }
  };

  const style = result ? LEVEL_STYLE[result.level] || LEVEL_STYLE[3] : null;

  return (
    <div style={{ maxWidth: 600, margin: "40px auto", padding: "0 20px", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 22, fontWeight: "bold", marginBottom: 4 }}>🔍 詐欺商材判定ツール</h1>
      <p style={{ color: "#666", fontSize: 13, marginBottom: 20 }}>
        商材・勧誘文句・サービス内容を貼り付けてください
      </p>

      {error && (
        <div style={{ background: "#fee2e2", color: "#b91c1c", padding: "10px 14px", borderRadius: 8, marginBottom: 12, fontSize: 13 }}>
          ⚠️ {error}
        </div>
      )}

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="例：月収100万円保証！初期費用0円で始められる副業。今だけ限定募集中..."
        style={{
          width: "100%", height: 130, padding: 12, fontSize: 14,
          border: "1px solid #ddd", borderRadius: 8, resize: "vertical",
          boxSizing: "border-box", marginBottom: 12
        }}
      />

      <button
        onClick={analyze}
        disabled={loading || !input.trim()}
        style={{
          width: "100%", padding: "12px 0", fontSize: 15, fontWeight: "bold",
          background: loading ? "#aaa" : "#1d4ed8", color: "white",
          border: "none", borderRadius: 8, cursor: loading ? "not-allowed" : "pointer",
          marginBottom: 24
        }}
      >
        {loading ? "🔄 分析中..." : "判定する"}
      </button>

      {result && style && (
        <div style={{
          border: `2px solid ${style.border}`,
          borderRadius: 12, overflow: "hidden"
        }}>
          {/* ヘッダー */}
          <div style={{ background: style.border, padding: "16px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 48 }}>{style.emoji}</div>
            <div style={{ color: "white", fontWeight: "bold", fontSize: 20, marginTop: 4 }}>
              {result.verdict}
            </div>
            <div style={{ color: "white", fontSize: 12, opacity: 0.9, marginTop: 2 }}>
              {result.character}
            </div>
          </div>

          {/* スコア */}
          <div style={{ background: style.bg, padding: "16px 20px" }}>
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <span style={{ fontSize: 48, fontWeight: "bold", color: style.color }}>
                {result.score}
              </span>
              <span style={{ fontSize: 14, color: style.color }}> / 100</span>
              <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>危険度スコア</div>

              {/* スコアバー */}
              <div style={{ background: "#e5e7eb", borderRadius: 99, height: 10, marginTop: 10 }}>
                <div style={{
                  width: `${result.score}%`, height: "100%",
                  background: style.border, borderRadius: 99,
                  transition: "width 0.5s"
                }} />
              </div>
            </div>

            {/* 説明 */}
            <p style={{ fontSize: 14, lineHeight: 1.7, color: "#333", marginBottom: 16 }}>
              {result.explanation}
            </p>

            {/* 危険ポイント */}
            {result.redFlags?.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <strong style={{ color: "#ef4444", fontSize: 13 }}>⚠️ 危険なポイント</strong>
                <ul style={{ marginTop: 6, paddingLeft: 18 }}>
                  {result.redFlags.map((f, i) => (
                    <li key={i} style={{ fontSize: 13, marginBottom: 4, color: "#333" }}>{f}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* 安全ポイント */}
            {result.safePoints?.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <strong style={{ color: "#22c55e", fontSize: 13 }}>✅ 安全なポイント</strong>
                <ul style={{ marginTop: 6, paddingLeft: 18 }}>
                  {result.safePoints.map((f, i) => (
                    <li key={i} style={{ fontSize: 13, marginBottom: 4, color: "#333" }}>{f}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* アドバイス */}
            <div style={{ background: "white", borderRadius: 8, padding: 12, border: "1px solid #e5e7eb" }}>
              <strong style={{ fontSize: 13 }}>💡 アドバイス</strong>
              <p style={{ fontSize: 13, marginTop: 6, marginBottom: 0, lineHeight: 1.6, color: "#333" }}>
                {result.advice}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
