import { useState } from "react";
import { getProfile, saveDisplayName } from "../utils/profile";
import Card from "../components/Card";

const FLOATING_CARDS = [
  { id: "A-spades", cls: "fc-1", faceDown: false },
  { id: "K-hearts", cls: "fc-2", faceDown: false },
  { id: "back-1", cls: "fc-3", faceDown: true },
  { id: "Q-diamonds", cls: "fc-4", faceDown: false },
  { id: "back-2", cls: "fc-5", faceDown: true },
];

export default function WelcomeScreen({ onStart, onOpenProfile }) {
  const [profile, setProfile] = useState(getProfile());
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState(profile.displayName);

  function handleSaveName(e) {
    e?.stopPropagation();
    const trimmed = nameInput.trim() || "Player";
    const updated = saveDisplayName(trimmed);
    setProfile(updated);
    setEditing(false);
  }

  return (
    <div className="screen welcome-screen">
      <div className="casino-pattern" />

      <div className="profile-card" onClick={() => !editing && onOpenProfile()}>
        <div className="profile-avatar">{(profile.displayName || "?")[0]?.toUpperCase()}</div>

        <div className="profile-info">
          {editing ? (
            <input
              className="profile-name-input"
              value={nameInput}
              autoFocus
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => setNameInput(e.target.value)}
              onBlur={handleSaveName}
              onKeyDown={(e) => e.key === "Enter" && handleSaveName(e)}
            />
          ) : (
            <div
              className="profile-name-row"
              onClick={(e) => {
                e.stopPropagation();
                setEditing(true);
              }}
            >
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

        <span className="profile-chevron">›</span>
      </div>

      <div className="home-logo">🃏</div>
      <h1 className="home-title">Star Hokm</h1>
      <div className="brand-divider" />

      <div className="welcome-stage">
        <div className="stage-glow" />

        {FLOATING_CARDS.map((c) => (
          <div key={c.cls} className={`floating-card ${c.cls}`}>
            <Card cardId={c.faceDown ? undefined : c.id} faceDown={c.faceDown} />
          </div>
        ))}

        <div className="welcome-chair-wrap">
          <div className="welcome-chair-back">
            <div className="chair-tufting">
              {Array.from({ length: 6 }).map((_, i) => <span key={i} />)}
            </div>
            <span className="welcome-chair-star">✦</span>
          </div>
          <div className="welcome-chair-armrest left" />
          <div className="welcome-chair-armrest right" />
          <div className="welcome-chair-seat">
            <div className="chair-tufting seat-tufting">
              {Array.from({ length: 4 }).map((_, i) => <span key={i} />)}
            </div>
          </div>
          <button className="welcome-start-btn" onClick={onStart}>
            ▶ Start Game
          </button>
        </div>
      </div>
    </div>
  );
}