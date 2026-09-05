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

const FACE_RANKS = ["J", "Q", "K"];

export function parseCardId(cardId) {
  const [rank, suit] = cardId.split("-");
  return { rank, suit };
}

function FaceIcon({ rank }) {
  return (
    <svg viewBox="0 0 24 24" width="60%" height="60%" fill="currentColor" style={{ opacity: 0.6 }}>
      <circle cx="12" cy="9" r="4" />
      <path d="M4 20c0-4.2 3.5-7.5 8-7.5s8 3.3 8 7.5H4z" />
      {rank === "K" && <path d="M5.5 4.5l2 2.8 4-3.6 4 3.6 2-2.8-1.1 4.8H6.6z" />}
      {rank === "Q" && <path d="M7 5l2 2 3-2.8 3 2.8 2-2-1 3.8H8z" />}
    </svg>
  );
}

export default function Card({ cardId, faceDown = false, disabled = false, onClick, small = false }) {
  if (faceDown) {
    return (
      <div className={`card card-back ${small ? "card-small" : ""}`}>
        <div className="card-back-pattern" />
        <div className="card-back-medallion">SH</div>
      </div>
    );
  }

  const { rank, suit } = parseCardId(cardId);
  const color = SUIT_COLORS[suit];
  const symbol = SUIT_SYMBOLS[suit];
  const isFace = FACE_RANKS.includes(rank);

  return (
    <div
      className={`card card-face ${color} ${disabled ? "card-disabled" : ""} ${small ? "card-small" : ""}`}
      onClick={!disabled ? onClick : undefined}
    >
      <div className="card-corner card-corner-top">
        <span className="card-rank">{rank}</span>
        <span className="card-suit">{symbol}</span>
      </div>

      {isFace ? (
        <div className="card-face-icon-wrap">
          <FaceIcon rank={rank} />
          <span className="card-face-suit-mini">{symbol}</span>
        </div>
      ) : (
        <div className="card-center-suit">{symbol}</div>
      )}

      <div className="card-brand-star">✦</div>
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