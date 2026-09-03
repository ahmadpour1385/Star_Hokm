"""
راه‌اندازی ربات تلگرام به روش Webhook (نه Polling).
این فایل دیگه به‌صورت پروسه‌ی جدا اجرا نمیشه؛ به‌جاش یه Application میسازه
که از داخل خود FastAPI (در app/main.py) استفاده میشه.
"""
from __future__ import annotations

from telegram.ext import Application, CallbackQueryHandler, CommandHandler

from app.bot.handlers import guide_callback, start_command, webapp_not_ready_callback
from app.core.config import settings

_application: Application | None = None


def get_bot_application() -> Application:
    """یه نمونه‌ی Application میسازه (فقط یه‌بار) که هم برای وب‌هوک هم برای هندلرها استفاده میشه"""
    global _application
    if _application is None:
        if not settings.BOT_TOKEN:
            raise RuntimeError("BOT_TOKEN توی .env تنظیم نشده")

        _application = Application.builder().token(settings.BOT_TOKEN).build()
        _application.add_handler(CommandHandler("start", start_command))
        _application.add_handler(CallbackQueryHandler(guide_callback, pattern="^show_guide$"))
        _application.add_handler(
            CallbackQueryHandler(webapp_not_ready_callback, pattern="^webapp_not_ready$")
        )

    return _application