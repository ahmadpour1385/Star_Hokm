import { useState } from "react";
import { getProfile, setLocalDisplayName, saveBio } from "../utils/profile";
import { claimDisplayName } from "../ws/api";

export default function ProfileScreen({ onBack }) {
  const [profile, setProfile] = useState(getProfile());
  const [nameInput, setNameInput] = useState(profile.displayName);
  const [bioInput, setBioInput] = useState(profile.bio);

  const [nameError, setNameError] = useState("");

  async function commitName() {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    try {
      const confirmedName = await claimDisplayName(profile.playerId, trimmed);
      setProfile(setLocalDisplayName(confirmedName));
      setNameError("");
    } catch (err) {
      setNameError(err.message);
      setNameInput(profile.displayName);
    }
  }

  function commitBio() {
    setProfile(saveBio(bioInput));
  }

  const total = profile.gamesPlayed;
  const winRate = total > 0 ? Math.round((profile.wins / total) * 100) : 0;

  return (
    <div className="screen profile-screen">
      <div className="casino-pattern" />

      <div className="profile-topbar">
        <button className="profile-back-btn" onClick={onBack}>‹</button>
        <span className="profile-topbar-title">Profile</span>
        <span style={{ width: 34 }} />
      </div>

      <div className="profile-page-content">
        {/* بخش ۱: آواتار بزرگ */}
        <section className="profile-section profile-hero">
          <div className="profile-avatar-ring">
            <div className="profile-avatar-big">{(profile.displayName || "?")[0]?.toUpperCase()}</div>
          </div>
          <div className="profile-hero-name">{profile.displayName || "Unnamed Player"}</div>
          <div className="profile-hero-tag">Star Hokm Player</div>
        </section>

        {/* بخش ۲: نام نمایشی و بیوگرافی */}
        <section className="profile-section">
          <div className="profile-section-title">
            <span className="title-star">✦</span> Display Name & Bio
          </div>

          <label className="profile-field-label">Display Name</label>
          <div className="profile-name-edit-row">
            <input
              className="profile-field-input"
              style={{ marginBottom: 0 }}
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && commitName()}
              placeholder="Your name"
            />
            <button className="name-confirm-btn" onClick={commitName}>✓</button>
            <button
              className="name-cancel-btn"
              onClick={() => {
                setNameInput(profile.displayName);
                setNameError("");
              }}
            >
              ✕
            </button>
          </div>
          {nameError && <p className="profile-name-error" style={{ marginTop: 4, marginBottom: 14 }}>{nameError}</p>}

          <label className="profile-field-label">Bio</label>
          <textarea
            className="profile-field-textarea"
            value={bioInput}
            onChange={(e) => setBioInput(e.target.value)}
            onBlur={commitBio}
            placeholder="Say something about yourself..."
            rows={3}
          />
        </section>

        {/* بخش ۳: آمار */}
        <section className="profile-section">
          <div className="profile-section-title">
            <span className="title-star">✦</span> Statistics
          </div>

          <div className="profile-stats-grid">
            <div className="stat-card">
              <div className="stat-icon">🎮</div>
              <div className="stat-value">{profile.gamesPlayed}</div>
              <div className="stat-label">Games</div>
            </div>
            <div className="stat-card stat-win">
              <div className="stat-icon">🏆</div>
              <div className="stat-value">{profile.wins}</div>
              <div className="stat-label">Wins</div>
            </div>
            <div className="stat-card stat-loss">
              <div className="stat-icon">💔</div>
              <div className="stat-value">{profile.losses}</div>
              <div className="stat-label">Losses</div>
            </div>
          </div>

          <div className="winrate-bar-wrap">
            <div className="winrate-bar-label">
              <span>Win Rate</span>
              <span>{winRate}%</span>
            </div>
            <div className="winrate-bar-track">
              <div className="winrate-bar-fill" style={{ width: `${winRate}%` }} />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}