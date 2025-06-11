import React, { useState } from "react";
import { judgeBestPokerHandDetail, compareHandDetail } from "./pokerHand";
import type { Card, PokerHandDetail } from "./pokerHand";

const suits = [
  { code: "S", label: "♠" },
  { code: "H", label: "♥" },
  { code: "D", label: "♦" },
  { code: "C", label: "♣" },
];
const values = [
  "A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"
];

type AddTarget = { type: "community" } | { type: "hand", player: number };

// カードボタン共通コンポーネント
const CardInputPad: React.FC<{
  disabledCards: Card[];
  onAdd: (card: Card) => void;
  disabled: boolean;
}> = ({ disabledCards, onAdd, disabled }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
    {suits.map(suit => (
      <div key={suit.code} style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 2 }}>
        <div style={{ width: 24, textAlign: "center", fontWeight: "bold", marginRight: 4, color: suit.code === "H" ? "red" : suit.code === "D" ? "#c00" : "#222" }}>{suit.label}</div>
        {values.map(value => {
          const card = suit.code + value;
          const isDisabled = disabledCards.includes(card) || disabled;
          return (
            <button
              key={card}
              onClick={() => onAdd(card)}
              disabled={isDisabled}
              style={{
                width: 36,
                height: 36,
                fontSize: 16,
                background: isDisabled ? "#f5f5f5" : "#fff",
                color: suit.code === "H" ? "red" : suit.code === "D" ? "#c00" : "#222",
                border: "1px solid #aaa",
                borderRadius: 4,
                cursor: isDisabled ? "not-allowed" : "pointer",
                margin: 0,
                padding: 0
              }}
            >
              {value}
            </button>
          );
        })}
      </div>
    ))}
  </div>
);

const PokerHandChecker: React.FC = () => {
  const [community, setCommunity] = useState<Card[]>([]);
  const [players, setPlayers] = useState<Card[][]>([[ ]]); // 複数プレイヤー
  const [result, setResult] = useState<PokerHandDetail[]>([]);
  const [addTarget, setAddTarget] = useState<AddTarget>({ type: "community" });
  const [winnerIdx, setWinnerIdx] = useState<number[]>([]);

  // すべてのカード（重複不可）
  const allSelected = [
    ...community,
    ...players.flat()
  ];

  const addCard = (card: Card) => {
    if (allSelected.includes(card)) return;
    if (addTarget.type === "community" && community.length < 5) {
      setCommunity([...community, card]);
    } else if (addTarget.type === "hand") {
      setPlayers(players => players.map((h, i) => i === addTarget.player && h.length < 2 ? [...h, card] : h));
    }
  };

  const removeCard = (target: AddTarget, card: Card) => {
    if (target.type === "community") setCommunity(community.filter(c => c !== card));
    else setPlayers(players => players.map((h, i) => i === target.player ? h.filter(c => c !== card) : h));
  };

  const handleCheck = () => {
    const hands = players.map(hand => judgeBestPokerHandDetail(community, hand));
    setResult(hands);
    // 最強役を比較
    let best: PokerHandDetail | null = null;
    let winners: number[] = [];
    hands.forEach((h, i) => {
      if (!best || compareHandDetail(h, best) > 0) {
        best = h;
        winners = [i];
      } else if (compareHandDetail(h, best) === 0) {
        winners.push(i);
      }
    });
    setWinnerIdx(winners);
  };

  const handleReset = () => {
    setCommunity([]);
    setPlayers([[ ]]);
    setResult([]);
  };

  // プレイヤー追加
  const addPlayer = () => {
    setPlayers(players => [...players, []]);
    setResult([]);
  };

  // カード表示用の色付け関数
  const getCardColor = (card: Card) => {
    if (card[0] === "H") return "red";
    if (card[0] === "D") return "#c00";
    return "#222";
  };

  return (
    <div style={{ maxWidth: 600, margin: "2rem auto", padding: 20, border: "1px solid #ccc", borderRadius: 8 }}>
      <h2>ポーカー役判定</h2>
      <div style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 8 }}>
          <strong>コミュニティカード（最大5枚）</strong>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "8px 0" }}>
            {community.map(card => (
              <button key={card} onClick={() => removeCard({ type: "community" }, card)} style={{ fontSize: 18, padding: 6, background: "#eee", border: "1px solid #aaa", borderRadius: 4, color: getCardColor(card) }}>
                {card[0] === "S" ? "♠" : card[0] === "H" ? "♥" : card[0] === "D" ? "♦" : "♣"}{card.slice(1)} ×
              </button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 8 }}>
          <strong>プレイヤー</strong>
          {players.map((hand, idx) => (
            <div key={idx} style={{ marginBottom: 8, border: "1px solid #ddd", borderRadius: 6, padding: 8 }}>
              <div style={{ marginBottom: 4 }}>
                <label>
                  <input
                    type="radio"
                    name="addTarget"
                    checked={addTarget.type === "hand" && addTarget.player === idx}
                    onChange={() => setAddTarget({ type: "hand", player: idx })}
                  />
                  プレイヤー{idx + 1}（手札2枚）
                </label>
                <span style={{ marginLeft: 12 }}>
                  {hand.map(card => (
                    <button key={card} onClick={() => removeCard({ type: "hand", player: idx }, card)} style={{ fontSize: 18, padding: 6, background: "#eee", border: "1px solid #aaa", borderRadius: 4, color: getCardColor(card), marginRight: 4 }}>
                      {card[0] === "S" ? "♠" : card[0] === "H" ? "♥" : card[0] === "D" ? "♦" : "♣"}{card.slice(1)} ×
                    </button>
                  ))}
                </span>
                {result[idx] && (
                  <span style={{ marginLeft: 16, fontWeight: "bold", color: winnerIdx.includes(idx) ? "#d00" : "#007" }}>
                    役: {result[idx].name}{winnerIdx.length > 0 && winnerIdx.includes(idx) ? " ← 勝者" : ""}
                  </span>
                )}
              </div>
            </div>
          ))}
          <button onClick={addPlayer} style={{ marginTop: 4, padding: "4px 12px", fontSize: 15, borderRadius: 4, border: "1px solid #aaa", background: "#f5f5f5" }}>＋プレイヤー追加</button>
        </div>
        <div style={{ margin: "12px 0" }}>
          <label style={{ marginRight: 12 }}>
            <input
              type="radio"
              name="addTarget"
              checked={addTarget.type === "community"}
              onChange={() => setAddTarget({ type: "community" })}
            />
            コミュニティカードに追加
          </label>
        </div>
        <CardInputPad
          disabledCards={allSelected}
          onAdd={addCard}
          disabled={addTarget.type === "community" ? community.length >= 5 : addTarget.type === "hand" && players[addTarget.player]?.length >= 2}
        />
      </div>
      <button onClick={handleCheck} disabled={players.some(h => h.length !== 2) || community.length === 0} style={{ marginTop: 12, width: "100%", padding: 10, fontSize: 16 }}>
        判定
      </button>
      <button onClick={handleReset} style={{ marginTop: 8, width: "100%", padding: 8, fontSize: 14, background: "#eee" }}>
        リセット
      </button>
    </div>
  );
};

export default PokerHandChecker;
