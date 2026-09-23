import AvatarIcon from "./AvatarIcon";

export default function PlayerSeat({ player, isHakem, isCurrentTurn, cardsCount, position, isOffline = false, nameAbove = false }) {
  if (!player) {
    return (
      <div className={`player-seat player-seat-${position} player-seat-empty`}>
        <div className="player-seat-name">— empty —</div>
      </div>
    );
  }

  const nameEl = <div className="player-seat-name">{player.display_name}</div>;
  const avatarEl = (
    <div className="player-seat-avatar">
      {isHakem && <span className="player-seat-crown">👑</span>}
      <div className="player-seat-circle">
        {player.avatar ? <AvatarIcon id={player.avatar} /> : player.display_name?.[0] || "?"}
      </div>
    </div>
  );

  return (
    <div
      className={`player-seat player-seat-${position} ${isCurrentTurn ? "player-seat-active" : ""} ${isOffline ? "player-seat-offline" : ""}`}
    >
      {nameAbove && nameEl}
      {avatarEl}
      {!nameAbove && nameEl}
      <div className="player-seat-cards-count">
        {isOffline ? "reconnecting..." : `🂠 ${cardsCount}`}
      </div>
    </div>
  );
}