"""
هندلرهای ربات تلگرام.
مسئول فقط دستور /start و دکمه‌های اولیه:
- دکمه «ورود به بازی» -> باز کردن Mini App (تمام‌صفحه، نه داخل چت)
- دکمه «راهنمای بازی» -> نمایش متن راهنما در همون چت

هیچ منطق بازی‌ای اینجا نیست - همه‌چیز داخل Mini App (frontend) و از طریق
WebSocket با بک‌اند انجام میشه.
"""
from __future__ import annotations

from telegram import InlineKeyboardButton, InlineKeyboardMarkup, Update, WebAppInfo
from telegram.ext import ContextTypes

from app.core.config import settings

WELCOME_TEXT = (
    "🃏 به Star Hokm خوش اومدی!\n\n"
    "بازی حکم آنلاین، ۴ نفره و تیمی — دقیقاً مثل دور همی‌های واقعی.\n"
    "برای شروع، «ورود به بازی» رو بزن."
)

GUIDE_TEXT = (
    "📖 راهنمای بازی حکم:\n\n"
    "۱. کارت‌ها رندوم پخش میشه تا یه نفر آس بگیره و حاکم بشه.\n"
    "۲. حاکم ۵ کارت اول رو می‌گیره و خال حکم رو انتخاب می‌کنه.\n"
    "۳. بقیه کارت‌ها پخش میشه تا هرکس ۱۳ کارت داشته باشه.\n"
    "۴. هر بازیکن باید از خال زمین پیروی کنه؛ اگه نداشت، یا حکم بزنه یا رد کنه.\n"
    "۵. تیمی که ۷ تریک ببره، راند رو می‌بره.\n"
    "۶. بازی تا رسیدن یه تیم به تعداد راند تعیین‌شده (۳، ۵ یا ۷) ادامه داره.\n\n"
    "برای شروع، از منو «ورود به بازی» رو بزن 🎮"
)


def _is_valid_webapp_url(url: str) -> bool:
    """تلگرام فقط https قبول می‌کنه - تا وقتی فرانت با https (مثلاً از طریق ngrok) بالا نیومده،
    این چک جلوی کرش کردن ربات رو می‌گیره."""
    return url.startswith("https://")


async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """هندلر دستور /start"""
    buttons = []

    if _is_valid_webapp_url(settings.WEBAPP_URL):
        buttons.append([InlineKeyboardButton(
            text="🎮 ورود به بازی",
            web_app=WebAppInfo(url=settings.WEBAPP_URL),
        )])
    else:
        # فرانت هنوز آدرس https نداره - موقتاً دکمه غیرفعال نمایش داده میشه
        buttons.append([InlineKeyboardButton(
            text="🎮 ورود به بازی (به‌زودی)",
            callback_data="webapp_not_ready",
        )])

    buttons.append([InlineKeyboardButton(text="📖 راهنمای بازی حکم", callback_data="show_guide")])

    keyboard = InlineKeyboardMarkup(buttons)
    await update.message.reply_text(WELCOME_TEXT, reply_markup=keyboard)


async def guide_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """وقتی دکمه راهنما زده میشه"""
    query = update.callback_query
    await query.answer()
    await query.message.reply_text(GUIDE_TEXT)


async def webapp_not_ready_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """وقتی دکمه موقت 'به‌زودی' زده میشه (فقط تا وقتی فرانت آماده بشه)"""
    query = update.callback_query
    await query.answer("این بخش هنوز در حال ساخته که کاملاً رایگانه 🙂", show_alert=True)