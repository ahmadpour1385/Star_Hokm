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
  if (rank === "K") {
    return (
      <svg viewBox="0 0 24 24" width="58%" height="58%" fill="currentColor" style={{ opacity: 0.85 }}>
        <path d="M3 17l1.5-8 4 4 3.5-6 3.5 6 4-4L21 17H3z" />
        <rect x="4" y="17.5" width="16" height="2" rx="0.6" />
        <circle cx="12" cy="6.3" r="1.3" />
        <circle cx="4.5" cy="9.3" r="1" />
        <circle cx="19.5" cy="9.3" r="1" />
      </svg>
    );
  }
  if (rank === "Q") {
    return (
      <svg viewBox="0 0 24 24" width="54%" height="54%" fill="currentColor" style={{ opacity: 0.85 }}>
        <path d="M12 3c2.6 2 4 4.8 4 7.6 0 3.4-1.8 6.2-4 8.4-2.2-2.2-4-5-4-8.4C8 7.8 9.4 5 12 3z" />
        <circle cx="12" cy="10.2" r="1.6" fill="#0000" stroke="currentColor" strokeWidth="1" />
        <path d="M6 6.5c1.4-1 3-1.5 6-1.5s4.6.5 6 1.5" fill="none" stroke="currentColor" strokeWidth="1" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" width="52%" height="58%" fill="currentColor" style={{ opacity: 0.85 }}>
      <path d="M8 2h8l-2 4 2 3-3 2 3 2-2 3 2 4H8l2-4-3-2 3-2-3-2 2-3-2-4z" opacity="0.9" />
      <circle cx="12" cy="12" r="1.4" fill="#0000" />
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