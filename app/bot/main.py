"""
نقطه‌ی اجرای ربات تلگرام (پروسه‌ی جدا از سرور FastAPI).
این فایل جدا اجرا میشه: python -m app.bot.main
"""
from __future__ import annotations

from telegram.ext import Application, CallbackQueryHandler, CommandHandler

from app.bot.handlers import guide_callback, start_command, webapp_not_ready_callback
from app.core.config import settings


def main() -> None:
    if not settings.BOT_TOKEN:
        raise RuntimeError("BOT_TOKEN توی .env تنظیم نشده")

    app = Application.builder().token(settings.BOT_TOKEN).build()

    app.add_handler(CommandHandler("start", start_command))
    app.add_handler(CallbackQueryHandler(guide_callback, pattern="^show_guide$"))
    app.add_handler(CallbackQueryHandler(webapp_not_ready_callback, pattern="^webapp_not_ready$"))

    print("ربات Star Hokm در حال اجراست... 🃏")
    app.run_polling()


if __name__ == "__main__":
    main()