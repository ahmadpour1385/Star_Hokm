/**
 * درخواست‌های HTTP به بک‌اند (قبل از برقراری WebSocket):
 * ساخت اتاق و ورود به اتاق.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function postJson(path, body) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || "خطایی رخ داد");
  }
  return data;
}

export function createRoom({ ownerUserId, ownerDisplayName, password, roundsToWin }) {
  return postJson("/rooms/create", {
    owner_user_id: ownerUserId,
    owner_display_name: ownerDisplayName,
    password,
    rounds_to_win: roundsToWin,
  });
}

export function joinRoom({ roomCode, password, userId, displayName }) {
  return postJson("/rooms/join", {
    room_code: roomCode,
    password,
    user_id: userId,
    display_name: displayName,
  });
}