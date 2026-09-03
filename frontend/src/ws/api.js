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

  // اول متن خام رو می‌گیریم، نه مستقیم json() — اینطوری اگه بدنه خالی یا نامعتبر باشه، خودمون کنترلش می‌کنیم
  const rawText = await res.text();
  console.log("[postJson]", path, "status:", res.status, "rawText:", rawText);

  let data = null;
  if (rawText) {
    try {
      data = JSON.parse(rawText);
    } catch (parseErr) {
      console.error("[postJson] JSON parse failed:", parseErr);
      throw new Error(
        `جواب سرور JSON معتبر نبود (status ${res.status}): ${rawText.slice(0, 200)}`
      );
    }
  }

  if (!res.ok) {
    throw new Error((data && data.detail) || `خطای سرور (status ${res.status}, body خالی بود)`);
  }

  if (!data) {
    throw new Error(`جواب سرور خالی بود (status ${res.status})`);
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