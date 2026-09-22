const PROFILE_KEY = "starHokmProfile";

function generatePlayerId() {
  if (crypto?.randomUUID) return crypto.randomUUID();
  return "p_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const DEFAULT_PROFILE = {
  playerId: null,
  displayName: "",
  bio: "",
  avatar: null,
  gamesPlayed: 0,
  wins: 0,
  losses: 0,
};

export function getProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    const parsed = raw ? { ...DEFAULT_PROFILE, ...JSON.parse(raw) } : { ...DEFAULT_PROFILE };
    if (!parsed.playerId) {
      parsed.playerId = generatePlayerId();
      saveProfile(parsed);
    }
    return parsed;
  } catch {
    const fresh = { ...DEFAULT_PROFILE, playerId: generatePlayerId() };
    saveProfile(fresh);
    return fresh;
  }
}

function saveProfile(profile) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {}
}

export function setLocalDisplayName(name) {
  const profile = getProfile();
  profile.displayName = name;
  saveProfile(profile);
  return profile;
}

export function saveBio(bio) {
  const profile = getProfile();
  profile.bio = bio;
  saveProfile(profile);
  return profile;
}

export function saveAvatar(avatarId) {
  const profile = getProfile();
  profile.avatar = avatarId;
  saveProfile(profile);
  return profile;
}

export function recordGameResult(won) {
  const profile = getProfile();
  profile.gamesPlayed += 1;
  if (won) profile.wins += 1;
  else profile.losses += 1;
  saveProfile(profile);
  return profile;
}