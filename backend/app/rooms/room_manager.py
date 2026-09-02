"""
مدیریت متمرکز همه‌ی اتاق‌های فعال (in-memory).
مسئول ساخت کد اتاق یکتا، ساخت اتاق جدید، و پیدا کردن اتاق برای ورود بازیکن.
"""
from __future__ import annotations

import random
import string

from app.core.config import settings
from app.rooms.room import Room


class RoomManager:
    """Singleton-مانند: یک نمونه از این کلاس باید در کل اپ استفاده بشه (توی main.py ساخته میشه)"""

    def __init__(self):
        self._rooms: dict[str, Room] = {}  # room_code -> Room

    def _generate_unique_code(self) -> str:
        """کد ۶ رقمی یکتا (فقط عدد) می‌سازه که با هیچ اتاق فعالی تداخل نداشته باشه"""
        while True:
            code = "".join(random.choices(string.digits, k=settings.ROOM_CODE_LENGTH))
            if code not in self._rooms:
                return code

    def create_room(
        self,
        owner_user_id: int,
        owner_display_name: str,
        password: str,
        rounds_to_win: int,
    ) -> Room:
        """اتاق جدید می‌سازه و سازنده اتاق رو خودکار به‌عنوان اولین بازیکن اضافه می‌کنه"""
        if len(password) < settings.ROOM_PASSWORD_MIN_LENGTH:
            raise ValueError(f"رمز باید حداقل {settings.ROOM_PASSWORD_MIN_LENGTH} کاراکتر باشه")
        if rounds_to_win not in settings.VALID_ROUNDS_TO_WIN_OPTIONS:
            raise ValueError(f"تعداد راند باید یکی از {settings.VALID_ROUNDS_TO_WIN_OPTIONS} باشه")

        room_code = self._generate_unique_code()
        room = Room(
            room_code=room_code,
            password=password,
            owner_user_id=owner_user_id,
            rounds_to_win=rounds_to_win,
        )
        room.add_player(owner_user_id, owner_display_name)
        self._rooms[room_code] = room
        return room

    def get_room(self, room_code: str) -> Room | None:
        return self._rooms.get(room_code)

    def join_room(self, room_code: str, password: str, user_id: int, display_name: str) -> Room:
        """یه بازیکن با کد و رمز درست وارد اتاق میشه"""
        room = self.get_room(room_code)
        if room is None:
            raise ValueError("اتاقی با این کد پیدا نشد")
        if not room.check_password(password):
            raise ValueError("رمز اتاق اشتباهه")

        room.add_player(user_id, display_name)
        return room

    def remove_room(self, room_code: str) -> None:
        """برای پاکسازی اتاق‌های تموم‌شده یا خالی"""
        self._rooms.pop(room_code, None)

    @property
    def active_rooms_count(self) -> int:
        return len(self._rooms)


# نمونه‌ی سراسری که کل اپ (bot و ws) ازش استفاده می‌کنن
room_manager = RoomManager()