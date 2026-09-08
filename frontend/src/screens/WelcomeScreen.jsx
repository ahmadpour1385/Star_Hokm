import { useState } from "react";
import { getProfile, saveDisplayName } from "../utils/profile";

export default function WelcomeScreen({ onStart }) {
  const [profile, setProfile] = useState(getProfile());
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState(profile.displayName);

  function handleSaveName() {
    const trimmed = nameInput.trim() || "Player";
    const updated = saveDisplayName(trimmed);
    setProfile(updated);
    setEditing(false);
  }

  return (
    <div className="screen welcome-screen">
      <div className="profile-card">
        <div className="profile-avatar">{(profile.displayName || "?")[0]?.toUpperCase()}</div>

        <div className="profile-info">
          {editing ? (
            <input
              className="profile-name-input"
              value={nameInput}
              autoFocus
              onChange={(e) => setNameInput(e.target.value)}
              onBlur={handleSaveName}
              onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
            />
          ) : (
            <div className="profile-name-row" onClick={() => setEditing(true)}>
              <span>{profile.displayName || "Set your name"}</span>
              <span className="profile-edit-icon">✎</span>
            </div>
          )}

          <div className="profile-stats">
            <span>🎮 {profile.gamesPlayed}</span>
            <span>🏆 {profile.wins}</span>
            <span>💔 {profile.losses}</span>
          </div>
        </div>
      </div>

      <div className="home-logo">🃏</div>
      <h1 className="home-title">Star Hokm</h1>
      <div className="brand-divider" />

      <div className="welcome-chair-wrap">
        <div className="welcome-chair-back">
          <span className="welcome-chair-star">✦</span>
        </div>
        <div className="welcome-chair-seat" />
        <button className="welcome-start-btn" onClick={onStart}>
          ▶ Start Game
        </button>
      </div>
    </div>
  );
}