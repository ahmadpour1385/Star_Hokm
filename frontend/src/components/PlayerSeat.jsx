import AvatarIcon from "./AvatarIcon";

export default function PlayerSeat({ player, isHakem, isCurrentTurn, cardsCount, position, isOffline = false, nameAbove = false }) {
  const side = nameAbove ? "ps-above" : "ps-below";

  if (!player) {
    return (
      <div className={`ps ${side} ps-empty ps-${position}`}>
        <div className="ps-avatar">
          <div className="ps-circle" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`ps ${side} ps-${position} ${isCurrentTurn ? "ps-active" : ""} ${isOffline ? "ps-offline" : ""}`}
    >
      <div className="ps-avatar">
        {isHakem && <span className="ps-crown">👑</span>}
        <div className="ps-circle">
          {player.avatar ? <AvatarIcon id={player.avatar} /> : player.display_name?.[0] || "?"}
        </div>
      </div>
      <div className="ps-name">{player.display_name}</div>
      <div className="ps-count">{isOffline ? "reconnecting..." : `🂠 ${cardsCount}`}</div>
    </div>
  );
}