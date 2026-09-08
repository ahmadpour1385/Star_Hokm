import { useState } from "react";
import { createRoom } from "../ws/api";
import { useGame } from "../context/GameContext";
import { getProfile } from "../utils/profile";

export default function CreateRoomScreen({ onBack, onRoomJoined }) {
  const { connectToRoom } = useGame();

  const [password, setPassword] = useState("");
  const [roundsToWin, setRoundsToWin] = useState(7);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate() {
    setError("");

    const displayName = getProfile().displayName?.trim();
    if (!displayName) {
      setError("Please set your display name in your profile first");
      return;
    }
    if (password.length < 4) {
      setError("Password must be at least 4 characters");
      return;
    }

    setLoading(true);
    try {
      const userId = Math.floor(Math.random() * 1_000_000_000);

      const room = await createRoom({
        ownerUserId: userId,
        ownerDisplayName: displayName,
        password,
        roundsToWin,
      });

      await connectToRoom(room.room_code, userId);
      onRoomJoined();
    } catch (e) {
      setError(e.message || "Failed to create room");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="screen form-screen">
      <h2 className="form-title">➕ Create Room</h2>

      <div className="form-group">
        <label>Room Password</label>
        <input
          type="text"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 4 characters"
        />
      </div>

      <div className="form-group">
        <label>Rounds to Win</label>
        <div className="rounds-options">
          {[3, 5, 7].map((n) => (
            <button
              key={n}
              className={`rounds-btn ${roundsToWin === n ? "selected" : ""}`}
              onClick={() => setRoundsToWin(n)}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}

      <button className="btn btn-primary" onClick={handleCreate} disabled={loading}>
        {loading ? "Creating..." : "Create Room"}
      </button>
      <button className="btn btn-secondary" onClick={onBack} disabled={loading}>
        Back
      </button>
    </div>
  );
}