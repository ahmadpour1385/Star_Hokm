"""
تنظیمات کلی پروژه Star Hokm.
مقادیر حساس (مثل توکن ربات) از متغیرهای محیطی (Environment Variables) خونده میشن.
"""
from dotenv import load_dotenv
load_dotenv()
import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    # توکن ربات تلگرام - از BotFather گرفته میشه
    BOT_TOKEN: str = os.getenv("BOT_TOKEN", "")

    # آدرس Mini App که تلگرام باید باز کنه (بعداً موقع هاست شدن فرانت‌اند پر میشه)
    WEBAPP_URL: str = os.getenv("WEBAPP_URL", "http://localhost:5173")
    BACKEND_URL: str = os.getenv("BACKEND_URL", "http://localhost:8000")

    # تنظیمات بازی
    PLAYERS_PER_ROOM: int = 4          # ثابت: همیشه ۴ نفره (۲ تیم ۲ نفره)
    TEAMS_COUNT: int = 2
    PLAYERS_PER_TEAM: int = 2
    CARDS_PER_PLAYER: int = 13         # مجموع کارت هر بازیکن در پایان پخش
    FIRST_DEAL_COUNT: int = 5          # تعداد کارت دور اول (قبل تعیین حکم)
    SECOND_DEAL_COUNT: int = 4         # تعداد کارت هر نوبت در دور دوم (۲ نوبت = ۸ کارت)
    TRICKS_TO_WIN_ROUND: int = 7       # تعداد تریک لازم برای بردن یک راند

    # مقادیر مجاز برای تعداد راند لازم جهت برد کل بازی
    VALID_ROUNDS_TO_WIN_OPTIONS: tuple = (3, 5, 7)

    # امتیاز کوت
    KOOT_POINTS: int = 3        # وقتی تیم حاکم صفر تریک بگیره و حریف هر ۷ تا رو ببره
    HAKEM_KOOT_POINTS: int = 2  # وقتی تیم حاکم هر ۷ تریک رو ببره و حریف صفر بگیره

    # طول رمز و کد اتاق
    ROOM_CODE_LENGTH: int = 6
    ROOM_PASSWORD_MIN_LENGTH: int = 4


settings = Settings()