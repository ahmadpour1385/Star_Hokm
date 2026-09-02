export default function PlayerSeat({ player, isHakem, isCurrentTurn, cardsCount, position }) {
  if (!player) {
    return (
      <div className={`player-seat player-seat-${position} player-seat-empty`}>
        <div className="player-seat-name">— خالی —</div>
      </div>
    );
  }

  return (
    <div
      className={`player-seat player-seat-${position} ${isCurrentTurn ? "player-seat-active" : ""}`}
    >
      <div className="player-seat-avatar">
        {isHakem && <span className="player-seat-crown">👑</span>}
        <div className="player-seat-circle">{player.display_name?.[0] || "?"}</div>
      </div>
      <div className="player-seat-name">{player.display_name}</div>
      <div className="player-seat-cards-count">🂠 {cardsCount}</div>
    </div>
  );
}