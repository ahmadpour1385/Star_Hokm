"""
نقطه ورود اصلی اپلیکیشن FastAPI.
شامل:
- مسیرهای HTTP برای ساخت اتاق و ورود به اتاق (قبل از WebSocket)
- مسیر WebSocket برای ارتباط real-time بازی
"""
from __future__ import annotations

from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

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