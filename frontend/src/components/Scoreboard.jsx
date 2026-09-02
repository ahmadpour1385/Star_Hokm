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

export default function Scoreboard({ roundsToWin, teamRounds, tricksCount, hokmSuit }) {
  return (
    <div className="scoreboard">
      <div className="scoreboard-section">
        <div className="scoreboard-label">راند</div>
        <div className="scoreboard-values">
          <span className="scoreboard-team-a">{teamRounds?.[0] ?? 0}</span>
          <span className="scoreboard-divider">/ {roundsToWin} /</span>
          <span className="scoreboard-team-b">{teamRounds?.[1] ?? 0}</span>
        </div>
      </div>

      <div className="scoreboard-divider-vertical" />

      <div className="scoreboard-section">
        <div className="scoreboard-label">تریک</div>
        <div className="scoreboard-values">
          <span className="scoreboard-team-a">{tricksCount?.[0] ?? 0}</span>
          <span className="scoreboard-divider">-</span>
          <span className="scoreboard-team-b">{tricksCount?.[1] ?? 0}</span>
        </div>
      </div>

      {hokmSuit && (
        <>
          <div className="scoreboard-divider-vertical" />
          <div className="scoreboard-section">
            <div className="scoreboard-label">حکم</div>
            <div className={`scoreboard-hokm ${SUIT_COLORS[hokmSuit]}`}>
              {SUIT_SYMBOLS[hokmSuit]}
            </div>
          </div>
        </>
      )}
    </div>
  );
}