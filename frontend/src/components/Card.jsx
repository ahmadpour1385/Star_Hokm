const SUIT_SYMBOLS = {
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
  spades: "♠",
};

const SUIT_COLORS = {
  hearts: "red",
  diamonds: "red",
  clubs: "black",
  spades: "black",
};

/**
 * cardId فرمتش طبق بک‌اند اینه: "RANK-suit" مثلاً "A-spades" یا "10-hearts"
 */
export function parseCardId(cardId) {
  const [rank, suit] = cardId.split("-");
  return { rank, suit };
}

export default function Card({ cardId, faceDown = false, disabled = false, onClick, small = false }) {
  if (faceDown) {
    return <div className={`card card-back ${small ? "card-small" : ""}`} />;
  }

  const { rank, suit } = parseCardId(cardId);
  const color = SUIT_COLORS[suit];
  const symbol = SUIT_SYMBOLS[suit];

  return (
    <div
      className={`card card-face ${color} ${disabled ? "card-disabled" : ""} ${small ? "card-small" : ""}`}
      onClick={!disabled ? onClick : undefined}
    >
      <div className="card-corner card-corner-top">
        <span className="card-rank">{rank}</span>
        <span className="card-suit">{symbol}</span>
      </div>
      <div className="card-center-suit">{symbol}</div>
      <div className="card-corner card-corner-bottom">
        <span className="card-rank">{rank}</span>
        <span className="card-suit">{symbol}</span>
      </div>
    </div>
  );
}
const DEFAULT_SUIT_ORDER = ["spades", "hearts", "clubs", "diamonds"];
const RANK_ORDER = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
const RED_SUITS = ["hearts", "diamonds"];
const BLACK_SUITS = ["spades", "clubs"];

function buildSuitOrder(hokmSuit) {
  if (!hokmSuit) return DEFAULT_SUIT_ORDER;

  const hokmIsRed = RED_SUITS.includes(hokmSuit);
  const sameColor = hokmIsRed ? RED_SUITS : BLACK_SUITS;
  const oppColor = hokmIsRed ? BLACK_SUITS : RED_SUITS;
  const sameColorOther = sameColor.find((s) => s !== hokmSuit);

  // خال حکم اول، بعد رنگ مخالف، بعد رنگ خودش، بعد رنگ مخالف دیگه
  return [hokmSuit, oppColor[0], sameColorOther, oppColor[1]];
}

export function sortHand(cardIds, hokmSuit = null) {
  const suitOrder = buildSuitOrder(hokmSuit);
  return [...cardIds].sort((a, b) => {
    const pa = parseCardId(a);
    const pb = parseCardId(b);
    const suitDiff = suitOrder.indexOf(pa.suit) - suitOrder.indexOf(pb.suit);
    if (suitDiff !== 0) return suitDiff;
    return RANK_ORDER.indexOf(pb.rank) - RANK_ORDER.indexOf(pa.rank);
  });
}