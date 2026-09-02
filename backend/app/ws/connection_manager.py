"""
مدیریت اتصالات فعال WebSocket.
هر بازیکن با ورود به یه اتاق، یه اتصال WebSocket داره که اینجا ثبت میشه.
مسئول فرستادن پیام به یه نفر خاص، یا broadcast به همه‌ی اعضای یه اتاق
(با امکان مخفی کردن دست کارت‌های دیگران - چون هر بازیکن فقط باید دست خودش رو ببینه).
"""
from __future__ import annotations

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        # room_code -> { user_id -> WebSocket }
        self._connections: dict[str, dict[int, WebSocket]] = {}

    async def connect(self, room_code: str, user_id: int, websocket: WebSocket) -> None:
        await websocket.accept()
        self._connections.setdefault(room_code, {})[user_id] = websocket

    def disconnect(self, room_code: str, user_id: int) -> None:
        room_conns = self._connections.get(room_code)
        if room_conns and user_id in room_conns:
            del room_conns[user_id]
        if room_conns is not None and not room_conns:
            del self._connections[room_code]

    async def send_to_user(self, room_code: str, user_id: int, message: dict) -> None:
        room_conns = self._connections.get(room_code, {})
        ws = room_conns.get(user_id)
        if ws is not None:
            await ws.send_json(message)

    async def broadcast(self, room_code: str, message: dict, exclude_user_id: int | None = None) -> None:
        """پیام یکسان رو به همه‌ی بازیکنای یه اتاق می‌فرسته"""
        room_conns = self._connections.get(room_code, {})
        for user_id, ws in room_conns.items():
            if user_id == exclude_user_id:
                continue
            await ws.send_json(message)

    async def broadcast_personalized(self, room_code: str, message_builder) -> None:
        """
        وقتی هر بازیکن باید نسخه‌ی متفاوتی از پیام رو بگیره (مثلاً هرکس فقط دست خودش رو ببینه).
        message_builder: تابعی که user_id می‌گیره و دیکشنری پیام مخصوص همون کاربر رو برمی‌گردونه.
        """
        room_conns = self._connections.get(room_code, {})
        for user_id, ws in room_conns.items():
            message = message_builder(user_id)
            await ws.send_json(message)

    def connected_user_ids(self, room_code: str) -> list[int]:
        return list(self._connections.get(room_code, {}).keys())


# نمونه‌ی سراسری که کل اپ استفاده می‌کنه
connection_manager = ConnectionManager()