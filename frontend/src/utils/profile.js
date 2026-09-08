const PROFILE_KEY = "starHokmProfile";

const DEFAULT_PROFILE = {
  displayName: "",
  gamesPlayed: 0,
  wins: 0,
  losses: 0,
};

export function getProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? { ...DEFAULT_PROFILE, ...JSON.parse(raw) } : { ...DEFAULT_PROFILE };
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}

function saveProfile(profile) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {}
}

export function saveDisplayName(name) {
  const profile = getProfile();
  profile.displayName = name;
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