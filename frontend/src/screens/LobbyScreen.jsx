import { useState } from "react";
import { useGame } from "../context/GameContext";

const TEAM_LABELS = { 0: "Team A", 1: "Team B" };
const TEAM_SEATS = { 0: [0, 2], 1: [1, 3] };

export default function LobbyScreen({ onGameStarted }) {
  const { room, userId, assignTeam, setReady, startGame, endGame } = useGame();
  const [copied, setCopied] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  if (!room) {
    return (
      <div className="screen">
        <p>Loading room...</p>
      </div>
    );
  }

  const me = room.players.find((p) => p.user_id === userId);
  const isOwner = me?.is_room_owner;
  const allReady =
    room.players.length === 4 &&
    room.players.every((p) => p.is_ready && p.team !== null && p.seat !== null);

  function pickSeatForTeam(team, excludeUserId) {
    const possibleSeats = TEAM_SEATS[team];
    const takenSeats = room.players
      .filter((p) => p.user_id !== excludeUserId && p.team === team && p.seat !== null)
      .map((p) => p.seat);
    return possibleSeats.find((s) => !takenSeats.includes(s)) ?? possibleSeats[0];
  }

  function handleAssign(targetUserId, team) {
    const seat = pickSeatForTeam(team, targetUserId);
    assignTeam(targetUserId, team, seat);
  }

  function handleStart() {
    startGame();
  }

  function handleCopyCode() {
    navigator.clipboard.writeText(room.room_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="screen lobby-screen">
      <h2 className="form-title">🚪 Room Lobby</h2>

      <div className="room-code-box">
        <span className="room-code-value">{room.room_code}</span>
        <button className="room-code-copy-btn" onClick={handleCopyCode}>
          {copied ? "✅ Copied" : "📋 Copy Code"}
        </button>
      </div>

      <p className="lobby-subtitle">Players: {room.players.length} / 4</p>

      <div className="lobby-players">
        {room.players.map((p) => (
          <div key={p.user_id} className="lobby-player-card">
            <div className="lobby-player-name">
              {p.display_name} {p.is_room_owner && "👑"}
            </div>

            <div className="lobby-player-status">{p.is_ready ? "✅ Ready" : "⏳ Waiting"}</div>

            {isOwner ? (
              <div className="lobby-assign-controls">
                <select
                  value={p.team ?? ""}
                  onChange={(e) => handleAssign(p.user_id, Number(e.target.value))}
                >
                  <option value="" disabled>
                    Team
                  </option>
                  <option value={0}>{TEAM_LABELS[0]}</option>
                  <option value={1}>{TEAM_LABELS[1]}</option>
                </select>
              </div>
            ) : (
              <div className="lobby-assign-readonly">
                {p.team !== null ? TEAM_LABELS[p.team] : "No Team"}
              </div>
            )}
          </div>
        ))}
      </div>

      <button className={`btn ${me?.is_ready ? "btn-secondary" : "btn-primary"}`} onClick={() => setReady(!me?.is_ready)}>
        {me?.is_ready ? "Cancel Ready" : "✅ I'm Ready"}
      </button>

            {isOwner && (
        <button className="btn btn-primary" disabled={!allReady} onClick={handleStart}>
          🎮 Start Game
        </button>
      )}

      {isOwner && (
        <button className="end-game-btn" onClick={() => setShowEndConfirm(true)}>
          ✕ Close Room
        </button>
      )}

      {showEndConfirm && (
        <div className="hokm-modal-backdrop">
          <div className="hokm-modal">
            <h3>Close Room?</h3>
            <p style={{ marginBottom: 16 }}>
              This will close the room for everyone. This cannot be undone.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button className="btn btn-secondary" onClick={() => setShowEndConfirm(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={endGame}>
                Yes, Close Room
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}