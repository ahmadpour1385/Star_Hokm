import { useState } from "react";
import { joinRoom } from "../ws/api";
import { useGame } from "../context/GameContext";
import { getProfile } from "../utils/profile";

export default function JoinRoomScreen({ onBack, onRoomJoined }) {
  const { connectToRoom } = useGame();

  const [roomCode, setRoomCode] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleJoin() {
    setError("");

    const displayName = getProfile().displayName?.trim();
    if (!displayName) {
      setError("Please set your display name in your profile first");
      return;
    }
    if (!roomCode.trim()) {
      setError("Please enter the room code");
      return;
    }
    if (!password) {
      setError("Please enter the room password");
      return;
    }

    setLoading(true);
    try {
      const userId = Math.floor(Math.random() * 1_000_000_000);

      await joinRoom({
        roomCode: roomCode.trim(),
        password,
        userId,
        displayName,
      });

      await connectToRoom(roomCode.trim(), userId);
      onRoomJoined();
    } catch (e) {
      setError(e.message || "Failed to join room");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="screen form-screen">
      <h2 className="form-title">🔑 Join Room</h2>

      <div className="form-group">
        <label>Room Code</label>
        <input
          type="text"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value)}
          placeholder="e.g. 407903"
        />
      </div>

      <div className="form-group">
        <label>Room Password</label>
        <input
          type="text"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password given by room owner"
        />
      </div>

      {error && <p className="form-error">{error}</p>}

      <button className="btn btn-primary" onClick={handleJoin} disabled={loading}>
        {loading ? "Joining..." : "Join Room"}
      </button>
      <button className="btn btn-secondary" onClick={onBack} disabled={loading}>
        Back
      </button>
    </div>
  );
}