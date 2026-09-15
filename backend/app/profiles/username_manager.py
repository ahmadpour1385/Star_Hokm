"""
مدیریت یکتا بودن نام‌های نمایشی بین همه‌ی کاربران.
هر کاربر یک player_id پایدار (تولیدشده در فرانت و ذخیره‌شده در localStorage) دارد
که مستقل از userId موقت هر بار ورود به اتاق است.
"""
from __future__ import annotations

import json
import os
from threading import Lock

DATA_FILE = os.path.join(os.path.dirname(__file__), "usernames.json")


class UsernameManager:
    def __init__(self):
        self._lock = Lock()
        self._by_name: dict[str, str] = {}
        self._by_player: dict[str, str] = {}
        self._load()

    def _load(self) -> None:
        if os.path.exists(DATA_FILE):
            try:
                with open(DATA_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)
                self._by_name = data.get("by_name", {})
                self._by_player = data.get("by_player", {})
            except Exception:
                pass

    def _save(self) -> None:
        try:
            with open(DATA_FILE, "w", encoding="utf-8") as f:
                json.dump({"by_name": self._by_name, "by_player": self._by_player}, f, ensure_ascii=False)
        except Exception:
            pass

    def claim_name(self, player_id: str, display_name: str) -> str:
        clean_name = display_name.strip()
        key = clean_name.lower()
        if not clean_name:
            raise ValueError("نام نمایشی نمی‌تونه خالی باشه")

        with self._lock:
            existing_owner = self._by_name.get(key)
            if existing_owner and existing_owner != player_id:
                raise ValueError("این نام قبلاً توسط شخص دیگه‌ای انتخاب شده")

            old_name = self._by_player.get(player_id)
            if old_name and old_name.lower() != key:
                self._by_name.pop(old_name.lower(), None)

            self._by_name[key] = player_id
            self._by_player[player_id] = clean_name
            self._save()

        return clean_name

    def search(self, query: str, limit: int = 10) -> list[str]:
        q = query.strip().lower()
        if not q:
            return []
        with self._lock:
            matches = [
                self._by_player[pid]
                for key, pid in self._by_name.items()
                if q in key
            ]
        return matches[:limit]


username_manager = UsernameManager()