"""
ساختار پیام‌های WebSocket بین کلاینت (Mini App) و سرور.
همه‌ی پیام‌ها یه فرمت مشترک دارن: {"action": "...", "data": {...}}
"""
from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel


# ---------- پیام ورودی از کلاینت ----------

class ClientMessage(BaseModel):
    """هر پیامی که کلاینت می‌فرسته این ساختار رو داره"""
    action: str
    data: dict[str, Any] = {}


# اکشن‌های مجاز از سمت کلاینت (برای مستندسازی و ارجاع در handlers.py):
#
# "assign_team"   -> data: {target_user_id, team, seat}   [فقط سازنده اتاق]
# "set_ready"     -> data: {is_ready}
# "start_game"    -> data: {}                              [فقط سازنده اتاق]
# "choose_hokm"   -> data: {suit}                          [فقط حاکم]
# "play_card"     -> data: {rank, suit}


# ---------- پیام خروجی از سرور ----------

class ServerMessage(BaseModel):
    """هر پیامی که سرور broadcast یا ارسال می‌کنه این ساختار رو داره"""
    event: str
    data: dict[str, Any] = {}


# رویدادهای مهمی که سرور می‌فرسته:
#
# "room_update"        -> وضعیت کامل اتاق (بازیکن‌ها، تیم‌ها، آماده بودن) - بعد از هر تغییر
# "game_started"       -> بازی شروع شد
# "hakem_determined"   -> صندلی حاکم مشخص شد
# "your_hand"          -> دست کارت‌های شخصی (فقط برای همون کاربر فرستاده میشه)
# "waiting_for_hokm"   -> منتظر انتخاب حکم توسط حاکم
# "hokm_chosen"        -> خال حکم مشخص شد
# "card_played"        -> یه کارت بازی شد (seat, card, به همه)
# "trick_won"          -> یه تریک تموم شد و برنده مشخص شد
# "round_over"         -> یه راند تموم شد (نتیجه، امتیاز، کوت)
# "game_over"          -> کل بازی تموم شد (تیم برنده نهایی)
# "error"              -> خطا (data: {message})


def error_message(message: str) -> dict:
    """کمکی برای ساخت سریع پیام خطا"""
    return ServerMessage(event="error", data={"message": message}).model_dump()