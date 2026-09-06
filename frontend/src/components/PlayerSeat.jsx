export default function PlayerSeat({ player, isHakem, isCurrentTurn, cardsCount, position, isOffline = false }) {
  if (!player) {
    return (
      <div className={`player-seat player-seat-${position} player-seat-empty`}>
        <div className="player-seat-name">— empty —</div>
      </div>
    );
  }

  return (
    <div
      className={`player-seat player-seat-${position} ${isCurrentTurn ? "player-seat-active" : ""} ${isOffline ? "player-seat-offline" : ""}`}
    >
      <div className="player-seat-avatar">
        {isHakem && <span className="player-seat-crown">👑</span>}
        <div className="player-seat-circle">{player.display_name?.[0] || "?"}</div>
      </div>
      <div className="player-seat-name">{player.display_name}</div>
      <div className="player-seat-cards-count">
        {isOffline ? "reconnecting..." : `🂠 ${cardsCount}`}
      </div>
    </div>
  );
}