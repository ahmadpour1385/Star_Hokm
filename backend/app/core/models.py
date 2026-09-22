"""
مدل‌های پایه‌ی مشترک بین game/ و rooms/:
بازیکن، تیم، و enum های وضعیت اتاق/بازی.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum


class TeamId(int, Enum):
    """شناسه دو تیم. همیشه دقیقاً دو تیم دو نفره داریم."""
    TEAM_A = 0
    TEAM_B = 1


class RoomStatus(str, Enum):
    """وضعیت اتاق در چرخه‌ی زندگیش"""
    WAITING = "waiting"          # منتظر تکمیل ۴ نفر و تیم‌بندی
    READY = "ready"              # همه آماده‌ان، منتظر شروع توسط سازنده اتاق
    IN_PROGRESS = "in_progress"  # بازی در جریانه
    FINISHED = "finished"        # بازی تموم شده (یک تیم به تعداد راند لازم رسیده)


class GamePhase(str, Enum):
    """فاز فعلی داخل یک راند بازی"""
    DETERMINING_HAKEM = "determining_hakem"   # پخش رندوم برای پیدا کردن اولین آس
    FIRST_DEAL = "first_deal"                 # ۵ کارت اول به هرکس داده شده، منتظر انتخاب حکم
    CHOOSING_HOKM = "choosing_hokm"           # حاکم داره خال حکم رو انتخاب می‌کنه
    SECOND_DEAL = "second_deal"               # ادامه پخش تا ۱۳ کارت
    PLAYING = "playing"                       # در حال بازی تریک‌ها
    ROUND_OVER = "round_over"                 # راند تموم شده، محاسبه امتیاز
    GAME_OVER = "game_over"                   # بازی تموم شده


@dataclass
class Player:
    """یک بازیکن داخل اتاق"""
    user_id: int              # آیدی عددی کاربر تلگرام
    display_name: str         # نام نمایشی انتخابی کاربر
    seat: int | None = None   # جایگاه دور میز (۰ تا ۳)، برای ترتیب راست‌گرد
    team: TeamId | None = None
    is_ready: bool = False
    is_room_owner: bool = False
    avatar: str | None = None  # شناسه آواتار انتخابی (مثلاً "male1", "female2")

    def to_public_dict(self) -> dict:
        """اطلاعاتی که امن هست برای همه بازیکنای اتاق فرستاده بشه (بدون دست کارت‌ها)"""
        return {
            "user_id": self.user_id,
            "display_name": self.display_name,
            "seat": self.seat,
            "team": self.team.value if self.team is not None else None,
            "is_ready": self.is_ready,
            "is_room_owner": self.is_room_owner,
            "avatar": self.avatar,
        }


@dataclass
class Team:
    """یک تیم دو نفره"""
    team_id: TeamId
    player_ids: list[int] = field(default_factory=list)
    tricks_won: int = 0     # تعداد تریک‌های برده‌شده در راند جاری
    rounds_won: int = 0     # تعداد راندهای برده‌شده در کل بازی (برای تعیین برنده نهایی)