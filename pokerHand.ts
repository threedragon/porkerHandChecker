// ポーカーの役を判定するTypeScript関数
// カードは "S2"（スペードの2）, "H10"（ハートの10）, "DJ"（ダイヤのJ）, "CQ"（クラブのQ）, "SK"（スペードのK）などの形式で渡すことを想定

export type Card = string; // 例: "S2", "H10", "DJ", "CQ", "SK"

export function judgePokerHand(cards: Card[]): string {
  if (cards.length !== 5) return "5枚のカードを入力してください";

  // スートと数字に分解
  const suits = cards.map(card => card[0]);
  const values = cards.map(card => {
    const v = card.slice(1);
    if (v === "A") return 14;
    if (v === "K") return 13;
    if (v === "Q") return 12;
    if (v === "J") return 11;
    return parseInt(v, 10);
  });
  values.sort((a, b) => a - b);

  // 同じ数字の枚数をカウント
  const counts: { [key: number]: number } = {};
  values.forEach(v => counts[v] = (counts[v] || 0) + 1);
  const countValues = Object.values(counts).sort((a, b) => b - a);

  const isFlush = suits.every(s => s === suits[0]);
  const isStraight = values.every((v, i, arr) => i === 0 || v === arr[i - 1] + 1) || (values.toString() === "2,3,4,5,14");

  if (isFlush && isStraight && values[0] === 10) return "ロイヤルストレートフラッシュ";
  if (isFlush && isStraight) return "ストレートフラッシュ";
  if (countValues[0] === 4) return "フォーカード";
  if (countValues[0] === 3 && countValues[1] === 2) return "フルハウス";
  if (isFlush) return "フラッシュ";
  if (isStraight) return "ストレート";
  if (countValues[0] === 3) return "スリーカード";
  if (countValues[0] === 2 && countValues[1] === 2) return "ツーペア";
  if (countValues[0] === 2) return "ワンペア";
  return "ハイカード";
}

// 役の詳細情報
export type PokerHandDetail = {
  name: string;
  rank: number;
  main: number[]; // 役の強さ比較用（降順）
  kickers: number[]; // 残りカードの強さ（降順）
};

// 5枚のカードから役の詳細を返す
export function judgePokerHandDetail(cards: Card[]): PokerHandDetail {
  if (cards.length !== 5) return { name: "不正", rank: 0, main: [], kickers: [] };
  const suits = cards.map(card => card[0]);
  const values = cards.map(card => {
    const v = card.slice(1);
    if (v === "A") return 14;
    if (v === "K") return 13;
    if (v === "Q") return 12;
    if (v === "J") return 11;
    return parseInt(v, 10);
  });
  values.sort((a, b) => b - a); // 降順
  const counts: { [key: number]: number } = {};
  values.forEach(v => counts[v] = (counts[v] || 0) + 1);
  const countArr = Object.entries(counts).map(([v, c]) => ({ v: +v, c })).sort((a, b) => b.c - a.c || b.v - a.v);
  const isFlush = suits.every(s => s === suits[0]);
  const isStraight = (() => {
    for (let i = 0; i < 4; i++) if (values[i] - 1 !== values[i + 1]) return values.toString() === "14,5,4,3,2";
    return true;
  })();
  // ロイヤルストレートフラッシュ
  if (isFlush && isStraight && values[0] === 14 && values[1] === 13) return { name: "ロイヤルストレートフラッシュ", rank: 10, main: [14], kickers: [] };
  // ストレートフラッシュ
  if (isFlush && isStraight) return { name: "ストレートフラッシュ", rank: 9, main: [values[0]], kickers: [] };
  // フォーカード
  if (countArr[0].c === 4) return { name: "フォーカード", rank: 8, main: [countArr[0].v], kickers: [countArr[1].v] };
  // フルハウス
  if (countArr[0].c === 3 && countArr[1].c === 2) return { name: "フルハウス", rank: 7, main: [countArr[0].v, countArr[1].v], kickers: [] };
  // フラッシュ
  if (isFlush) return { name: "フラッシュ", rank: 6, main: [...values], kickers: [] };
  // ストレート
  if (isStraight) return { name: "ストレート", rank: 5, main: [values[0]], kickers: [] };
  // スリーカード
  if (countArr[0].c === 3) return { name: "スリーカード", rank: 4, main: [countArr[0].v], kickers: [countArr[1].v, countArr[2].v] };
  // ツーペア
  if (countArr[0].c === 2 && countArr[1].c === 2) return { name: "ツーペア", rank: 3, main: [countArr[0].v, countArr[1].v], kickers: [countArr[2].v] };
  // ワンペア
  if (countArr[0].c === 2) return { name: "ワンペア", rank: 2, main: [countArr[0].v], kickers: [countArr[1].v, countArr[2].v, countArr[3].v] };
  // ハイカード
  return { name: "ハイカード", rank: 1, main: [...values], kickers: [] };
}

// 7枚から最強役を判定（詳細返却）
export function judgeBestPokerHandDetail(community: Card[], hand: Card[]): PokerHandDetail {
  const all = [...community, ...hand];
  if (all.length < 5 || hand.length !== 2 || community.length > 5) {
    return { name: "不正", rank: 0, main: [], kickers: [] };
  }
  if (all.length === 5) return judgePokerHandDetail(all);
  function combinations<T>(arr: T[], k: number): T[][] {
    if (k === 0) return [[]];
    if (arr.length < k) return [];
    const [first, ...rest] = arr;
    const withFirst = combinations(rest, k - 1).map(comb => [first, ...comb]);
    const withoutFirst = combinations(rest, k);
    return [...withFirst, ...withoutFirst];
  }
  let best: PokerHandDetail = { name: "ハイカード", rank: 1, main: [0], kickers: [] };
  for (const comb of combinations(all, 5)) {
    const detail = judgePokerHandDetail(comb);
    if (
      detail.rank > best.rank ||
      (detail.rank === best.rank && compareHandDetail(detail, best) > 0)
    ) {
      best = detail;
    }
  }
  return best;
}

// 役の詳細同士を比較（aが強い:1, bが強い:-1, 同じ:0）
export function compareHandDetail(a: PokerHandDetail, b: PokerHandDetail): number {
  if (a.rank !== b.rank) return a.rank > b.rank ? 1 : -1;
  for (let i = 0; i < Math.max(a.main.length, b.main.length); i++) {
    if ((a.main[i] || 0) !== (b.main[i] || 0)) return (a.main[i] || 0) > (b.main[i] || 0) ? 1 : -1;
  }
  for (let i = 0; i < Math.max(a.kickers.length, b.kickers.length); i++) {
    if ((a.kickers[i] || 0) !== (b.kickers[i] || 0)) return (a.kickers[i] || 0) > (b.kickers[i] || 0) ? 1 : -1;
  }
  return 0;
}
