"""
مدل یک اتاق بازی: نگه‌داری بازیکن‌ها، تیم‌بندی، وضعیت آماده‌بودن،
و اتصال به موتور بازی (GameEngine) وقتی بازی شروع میشه.
"""
from __future__ import annotations

from dataclasses import dataclass, field

from app.core.config import settings
from app.core.models import Player, RoomStatus, TeamId
from app.game.game_engine import GameEngine


@dataclass
class Room:
    """یک اتاق بازی. هر اتاق دقیقاً برای ۴ بازیکن (۲ تیم دو نفره) هست."""
    room_code: str                 # کد ۶ رقمی برای پیدا کردن اتاق
    password: str                  # رمز ورود به اتاق
    owner_user_id: int             # سازنده اتاق
    rounds_to_win: int             # ۳، ۵ یا ۷

    players: dict[int, Player] = field(default_factory=dict)  # user_id -> Player
    status: RoomStatus = RoomStatus.WAITING

    game_engine: GameEngine | None = field(default=None, init=False)
    pending_round_result: dict | None = field(default=None, init=False)

    # ---------- مدیریت بازیکن‌ها ----------

    def add_player(self, user_id: int, display_name: str, avatar: str | None = None) -> Player:
        """یه بازیکن جدید با رمز درست وارد اتاق میشه (بدون تیم و صندلی مشخص - سازنده اتاق بعداً تعیین می‌کنه)"""
        if self.status != RoomStatus.WAITING:
            raise ValueError("اتاق دیگه در حالت پذیرش بازیکن جدید نیست")
        if len(self.players) >= settings.PLAYERS_PER_ROOM:
            raise ValueError("اتاق پره")
        if user_id in self.players:
            raise ValueError("این بازیکن از قبل توی اتاقه")

        is_owner = user_id == self.owner_user_id
        player = Player(user_id=user_id, display_name=display_name, is_room_owner=is_owner, avatar=avatar)
        self.players[user_id] = player
        return player

    def remove_player(self, user_id: int) -> None:
        self.players.pop(user_id, None)

    def check_password(self, password: str) -> bool:
        return self.password == password

    # ---------- تیم‌بندی (فقط توسط سازنده اتاق) ----------

    def assign_team(self, requester_id: int, target_user_id: int, team: TeamId, seat: int) -> None:
        """سازنده اتاق جایگاه و تیم یه بازیکن رو تعیین می‌کنه"""
        if requester_id != self.owner_user_id:
            raise PermissionError("فقط سازنده اتاق می‌تونه تیم‌بندی کنه")
        if target_user_id not in self.players:
            raise ValueError("بازیکن مورد نظر توی این اتاق نیست")
        if not (0 <= seat < settings.PLAYERS_PER_ROOM):
            raise ValueError("جایگاه نامعتبره")

        # چک کن این صندلی قبلاً به کس دیگه‌ای داده نشده باشه
        for p in self.players.values():
            if p.user_id != target_user_id and p.seat == seat:
                raise ValueError("این جایگاه قبلاً به بازیکن دیگه‌ای اختصاص داده شده")

        player = self.players[target_user_id]
        player.team = team
        player.seat = seat
        self._update_status()

    # ---------- وضعیت آماده‌بودن ----------

    def set_ready(self, user_id: int, is_ready: bool) -> None:
        if user_id not in self.players:
            raise ValueError("بازیکن توی این اتاق نیست")
        self.players[user_id].is_ready = is_ready
        self._update_status()

    def _update_status(self) -> None:
        if self.status == RoomStatus.IN_PROGRESS or self.status == RoomStatus.FINISHED:
            return

        is_full = len(self.players) == settings.PLAYERS_PER_ROOM
        all_assigned = all(p.team is not None and p.seat is not None for p in self.players.values())
        all_ready = all(p.is_ready for p in self.players.values())

        if is_full and all_assigned and all_ready:
            self.status = RoomStatus.READY
        else:
            self.status = RoomStatus.WAITING

    # ---------- شروع بازی ----------

    def start_game(self, requester_id: int) -> GameEngine:
        """فقط سازنده اتاق می‌تونه بازی رو شروع کنه، و فقط وقتی همه آماده‌ان"""
        if requester_id != self.owner_user_id:
            raise PermissionError("فقط سازنده اتاق می‌تونه بازی رو شروع کنه")
        if self.status != RoomStatus.READY:
            raise ValueError("همه بازیکن‌ها هنوز آماده و تیم‌بندی نشدن")
        players_by_seat = {p.seat: p for p in self.players.values()}
        self.game_engine = GameEngine(players=players_by_seat, rounds_to_win=self.rounds_to_win)
        self.status = RoomStatus.IN_PROGRESS
        return self.game_engine

    # ---------- نمایش عمومی ----------

    def to_public_dict(self) -> dict:
        """اطلاعات امن اتاق برای فرستادن به کلاینت (بدون رمز)"""
        return {
            "room_code": self.room_code,
            "owner_user_id": self.owner_user_id,
            "rounds_to_win": self.rounds_to_win,
            "status": self.status.value,
            "players": [p.to_public_dict() for p in self.players.values()],
        }