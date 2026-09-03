"""
نقطه ورود اصلی اپلیکیشن FastAPI.
شامل:
- مسیرهای HTTP برای ساخت اتاق و ورود به اتاق (قبل از WebSocket)
- مسیر WebSocket برای ارتباط real-time بازی
"""
from __future__ import annotations

from fastapi import FastAPI, Request, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from telegram import Update

from app.bot.main import get_bot_application
from app.core.config import settings
from app.rooms.room_manager import room_manager
from app.ws.handlers import handle_connection

app = FastAPI(title="Star Hokm API")

# CORS باز، چون فرانت (Mini App) از دامنه/پورت جدا اجرا میشه (مثلاً localhost:5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def on_startup():
    """موقع بالا اومدن سرور، ربات مقداردهی اولیه میشه و وب‌هوک تنظیم میشه"""
    bot_app = get_bot_application()
    await bot_app.initialize()
    await bot_app.start()

    webhook_url = f"{settings.BACKEND_URL}/telegram/webhook"
    await bot_app.bot.set_webhook(url=webhook_url)


@app.on_event("shutdown")
async def on_shutdown():
    bot_app = get_bot_application()
    await bot_app.stop()
    await bot_app.shutdown()


@app.post("/telegram/webhook")
async def telegram_webhook(request: Request):
    """تلگرام هر پیام جدید رو مستقیم به این آدرس POST می‌کنه"""
    bot_app = get_bot_application()
    data = await request.json()
    update = Update.de_json(data, bot_app.bot)
    await bot_app.process_update(update)
    return {"ok": True}

# ---------- مدل‌های ورودی HTTP ----------

class CreateRoomRequest(BaseModel):
    owner_user_id: int
    owner_display_name: str
    password: str
    rounds_to_win: int


class JoinRoomRequest(BaseModel):
    room_code: str
    password: str
    user_id: int
    display_name: str


# ---------- مسیرهای HTTP ----------

@app.post("/rooms/create")
def create_room(payload: CreateRoomRequest):
    room = room_manager.create_room(
        owner_user_id=payload.owner_user_id,
        owner_display_name=payload.owner_display_name,
        password=payload.password,
        rounds_to_win=payload.rounds_to_win,
    )
    return room.to_public_dict()


@app.post("/rooms/join")
def join_room(payload: JoinRoomRequest):
    room = room_manager.join_room(
        room_code=payload.room_code,
        password=payload.password,
        user_id=payload.user_id,
        display_name=payload.display_name,
    )
    return room.to_public_dict()


@app.get("/rooms/{room_code}")
def get_room(room_code: str):
    room = room_manager.get_room(room_code)
    if room is None:
        return {"error": "اتاقی با این کد پیدا نشد"}
    return room.to_public_dict()


# ---------- مسیر WebSocket ----------

@app.websocket("/ws/{room_code}/{user_id}")
async def websocket_endpoint(websocket: WebSocket, room_code: str, user_id: int):
    await handle_connection(websocket, room_code, user_id)