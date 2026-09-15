const SUIT_SYMBOLS = {
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
  spades: "♠",
};

const SUIT_COLORS = {
  hearts: "red",
  diamonds: "red",
  clubs: "gold",
  spades: "gold",
};

const FACE_RANKS = ["J", "Q", "K"];

export function parseCardId(cardId) {
  const [rank, suit] = cardId.split("-");
  return { rank, suit };
}

function FaceIcon({ rank }) {
  if (rank === "K") {
    return (
      <svg viewBox="0 0 24 16" width="100%" height="100%" fill="currentColor">
        <path d="M2 13 L3.5 5 L7 9 L12 3 L17 9 L20.5 5 L22 13 Z" opacity="0.95" />
        <rect x="2" y="13" width="20" height="1.6" rx="0.5" />
        <circle cx="12" cy="2.2" r="1.1" />
        <circle cx="4" cy="4.6" r="0.8" />
        <circle cx="20" cy="4.6" r="0.8" />
      </svg>
    );
  }
  if (rank === "Q") {
    return (
      <svg viewBox="0 0 24 16" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="1.1">
        <path d="M12 2c3 2.4 5 5.4 5 8.4 0 2-1.6 4-5 5.2-3.4-1.2-5-3.2-5-5.2 0-3 2-6 5-8.4z" fill="currentColor" opacity="0.85" stroke="none" />
        <path d="M4 5.5c2-1.4 5-2 8-2s6 0.6 8 2" />
        <circle cx="12" cy="9" r="1.4" fill="none" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 16" width="100%" height="100%" fill="currentColor">
      <path d="M12 1l2 3-2 2.4-2-2.4z" opacity="0.95" />
      <rect x="11.3" y="6" width="1.4" height="7" opacity="0.95" />
      <path d="M7 13h10l-1.6 2H8.6z" opacity="0.95" />
      <circle cx="12" cy="4" r="0.5" fill="#0D0D0D" />
    </svg>
  );
}

export default function Card({ cardId, faceDown = false, disabled = false, onClick, small = false }) {
  if (faceDown) {
    return (
      <div className={`card card-back ${small ? "card-small" : ""}`}>
        <div className="card-back-border-ring" />
        <div className="card-back-pattern" />
        <div className="card-back-corner tl" />
        <div className="card-back-corner tr" />
        <div className="card-back-corner bl" />
        <div className="card-back-corner br" />
        <div className="card-back-medallion">
          <span className="card-back-crown">♛</span>
          <span className="card-back-star">✦</span>
        </div>
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
        <div className="card-face-mirror">
          <div className="card-face-half top">
            <FaceIcon rank={rank} />
          </div>
          <span className="card-face-suit-mini">{symbol}</span>
          <div className="card-face-half bottom">
            <FaceIcon rank={rank} />
          </div>
        </div>
      ) : (
        <div className="card-center-suit">{symbol}</div>
      )}

      {!isFace && (
        <div className="card-corner card-corner-bottom">
          <span className="card-rank">{rank}</span>
          <span className="card-suit">{symbol}</span>
        </div>
      )}
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