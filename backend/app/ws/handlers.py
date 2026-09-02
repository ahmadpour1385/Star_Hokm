"""
مغز ارتباط real-time: مدیریت چرخه‌ی عمر یک اتصال WebSocket و مسیریابی
اکشن‌های کلاینت به منطق مربوطه روی Room / GameEngine، و broadcast نتیجه.
"""
from __future__ import annotations

from fastapi import WebSocket, WebSocketDisconnect

from app.core.cards import Card, Rank, Suit
from app.core.models import GamePhase, TeamId
from app.rooms.room import Room
from app.rooms.room_manager import room_manager
from app.ws.connection_manager import connection_manager
from app.ws.schemas import ClientMessage, ServerMessage, error_message


async def handle_connection(websocket: WebSocket, room_code: str, user_id: int) -> None:
    """نقطه ورود اصلی: وقتی یه کلاینت به یه اتاق وصل میشه"""
    room = room_manager.get_room(room_code)
    if room is None or user_id not in room.players:
        await websocket.close(code=4404, reason="اتاق یا بازیکن پیدا نشد")
        return

    await connection_manager.connect(room_code, user_id, websocket)
    await _broadcast_room_update(room)

    try:
        while True:
            raw = await websocket.receive_json()
            message = ClientMessage(**raw)
            await _route_action(room, user_id, message)
    except WebSocketDisconnect:
        connection_manager.disconnect(room_code, user_id)


async def _route_action(room: Room, user_id: int, message: ClientMessage) -> None:
    handlers = {
        "assign_team": _handle_assign_team,
        "set_ready": _handle_set_ready,
        "start_game": _handle_start_game,
        "choose_hokm": _handle_choose_hokm,
        "play_card": _handle_play_card,
        "start_next_round": _handle_start_next_round,
        "end_game": _handle_end_game,
    }
    handler = handlers.get(message.action)
    if handler is None:
        await connection_manager.send_to_user(room.room_code, user_id, error_message("اکشن نامعتبر"))
        return

    try:
        await handler(room, user_id, message.data)
    except (ValueError, PermissionError) as e:
        await connection_manager.send_to_user(room.room_code, user_id, error_message(str(e)))


# ---------- هندلرهای هر اکشن ----------

async def _handle_assign_team(room: Room, user_id: int, data: dict) -> None:
    room.assign_team(
        requester_id=user_id,
        target_user_id=data["target_user_id"],
        team=TeamId(data["team"]),
        seat=data["seat"],
    )
    await _broadcast_room_update(room)


async def _handle_set_ready(room: Room, user_id: int, data: dict) -> None:
    room.set_ready(user_id, bool(data.get("is_ready", True)))
    await _broadcast_room_update(room)


async def _handle_start_game(room: Room, user_id: int, data: dict) -> None:
    room.start_game(requester_id=user_id)
    await connection_manager.broadcast(
        room.room_code,
        ServerMessage(event="game_started", data={}).model_dump(),
    )
    await _start_new_round(room)


async def _handle_choose_hokm(room: Room, user_id: int, data: dict) -> None:
    engine = room.game_engine
    round_state = engine.current_round

    hakem_player = _player_by_seat(room, round_state.hakem_seat)
    if hakem_player.user_id != user_id:
        raise PermissionError("فقط حاکم می‌تونه خال حکم رو انتخاب کنه")

    suit = Suit(data["suit"])
    round_state.set_hokm(suit)
    round_state.run_second_deal()

    await connection_manager.broadcast(
        room.room_code,
        ServerMessage(event="hokm_chosen", data={"suit": suit.value}).model_dump(),
    )
    await _send_all_hands(room)
    await _notify_turn(room)


async def _handle_play_card(room: Room, user_id: int, data: dict) -> None:
    engine = room.game_engine
    round_state = engine.current_round

    seat = _seat_by_user(room, user_id)
    card = Card(suit=Suit(data["suit"]), rank=Rank(data["rank"]))

    winner_seat = round_state.play_card(seat, card)

    await connection_manager.broadcast(
        room.room_code,
        ServerMessage(event="card_played", data={"seat": seat, "card": card.id}).model_dump(),
    )

    if winner_seat is None:
        await _notify_turn(room)
        return

    await connection_manager.broadcast(
        room.room_code,
        ServerMessage(
            event="trick_won",
            data={
                "winner_seat": winner_seat,
                "tricks": {t.value: c for t, c in round_state.tricks_won_by_team.items()},
            },
        ).model_dump(),
    )

    if round_state.phase == GamePhase.ROUND_OVER:
        await _finish_round(room)
    else:
        await _notify_turn(room)


async def _handle_start_next_round(room: Room, user_id: int, data: dict) -> None:
    """فقط بازیکنی که نوبت پخش کارت راند بعدی رو داره می‌تونه راند جدید رو شروع کنه"""
    engine = room.game_engine
    expected_seat = engine.next_dealer_seat
    seat = _seat_by_user(room, user_id)

    if seat != expected_seat:
        raise PermissionError("فقط بازیکن مربوطه می‌تونه راند بعدی رو شروع کنه")

    await _start_new_round(room)

async def _handle_end_game(room: Room, user_id: int, data: dict) -> None:
    """فقط سازنده اتاق می‌تونه در هر لحظه بازی رو تموم و اتاق رو منحل کنه"""
    if user_id != room.owner_user_id:
        raise PermissionError("فقط سازنده اتاق می‌تونه بازی رو تموم کنه")

    await connection_manager.broadcast(
        room.room_code,
        ServerMessage(event="room_dissolved", data={}).model_dump(),
    )
    room_manager.remove_room(room.room_code)

# ---------- کمکی‌های داخلی ----------

def _player_by_seat(room: Room, seat: int):
    for p in room.players.values():
        if p.seat == seat:
            return p
    raise ValueError("بازیکنی با این جایگاه پیدا نشد")


def _seat_by_user(room: Room, user_id: int) -> int:
    return room.players[user_id].seat


async def _broadcast_room_update(room: Room) -> None:
    await connection_manager.broadcast(
        room.room_code,
        ServerMessage(event="room_update", data=room.to_public_dict()).model_dump(),
    )


async def _start_new_round(room: Room) -> None:
    engine = room.game_engine
    round_state = engine.start_new_round()
    round_state.run_first_deal()

    await connection_manager.broadcast(
        room.room_code,
        ServerMessage(event="hakem_determined", data={"hakem_seat": round_state.hakem_seat}).model_dump(),
    )
    await _send_all_hands(room)

    hakem_player = _player_by_seat(room, round_state.hakem_seat)
    await connection_manager.send_to_user(
        room.room_code,
        hakem_player.user_id,
        ServerMessage(event="waiting_for_hokm", data={}).model_dump(),
    )


async def _send_all_hands(room: Room) -> None:
    """به هر بازیکن فقط دست خودش رو می‌فرسته - بقیه نمی‌بینن"""
    round_state = room.game_engine.current_round

    def build(user_id: int) -> dict:
        seat = room.players[user_id].seat
        hand = round_state.hands[seat]
        return ServerMessage(
            event="your_hand",
            data={"cards": [c.id for c in hand]},
        ).model_dump()

    await connection_manager.broadcast_personalized(room.room_code, build)


async def _notify_turn(room: Room) -> None:
    round_state = room.game_engine.current_round
    await connection_manager.broadcast(
        room.room_code,
        ServerMessage(event="turn_changed", data={"seat": round_state.current_turn_seat}).model_dump(),
    )


async def _finish_round(room: Room) -> None:
    engine = room.game_engine
    result = engine.finish_current_round()

    is_game_over = engine.is_game_over

    await connection_manager.broadcast(
        room.room_code,
        ServerMessage(
            event="round_over",
            data={
                "winning_team": result.winning_team.value,
                "is_koot": result.is_koot,
                "is_hakem_koot": result.is_hakem_koot,
                "points_awarded": result.points_awarded,
                "score": engine.get_score_summary(),
                "next_dealer_seat": None if is_game_over else engine.next_dealer_seat,
            },
        ).model_dump(),
    )

    if is_game_over:
        await connection_manager.broadcast(
            room.room_code,
            ServerMessage(
                event="game_over",
                data={"winning_team": engine.winning_team.value},
            ).model_dump(),
        )