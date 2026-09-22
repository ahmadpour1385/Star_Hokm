"""
مغز ارتباط real-time: مدیریت چرخه‌ی عمر یک اتصال WebSocket و مسیریابی
اکشن‌های کلاینت به منطق مربوطه روی Room / GameEngine، و broadcast نتیجه.
"""
from __future__ import annotations

from fastapi import WebSocket, WebSocketDisconnect

from app.core.cards import Card, Rank, Suit
from app.core.models import GamePhase, RoomStatus, TeamId
from app.rooms.room import Room
from app.rooms.room_manager import room_manager
from app.ws.connection_manager import connection_manager
from app.ws.schemas import ClientMessage, ServerMessage, error_message


async def handle_connection(websocket: WebSocket, room_code: str, user_id: int) -> None:
    """نقطه ورود اصلی: وقتی یه کلاینت به یه اتاق وصل میشه (چه اولین بار، چه اتصال مجدد)"""
    room = room_manager.get_room(room_code)
    if room is None or user_id not in room.players:
        await websocket.close(code=4404, reason="اتاق یا بازیکن پیدا نشد")
        return

    await connection_manager.connect(room_code, user_id, websocket)
    await _broadcast_room_update(room)

    # اگه بازی از قبل در جریان بود (یعنی این یه اتصال مجدد بعد از رفرش/قطعی است)،
    # کل وضعیت فعلی بازی فقط برای همین کاربر دوباره فرستاده میشه
    if room.status == RoomStatus.IN_PROGRESS and room.game_engine is not None:
        sync_data = _build_sync_data(room, user_id)
        await connection_manager.send_to_user(
            room.room_code, user_id,
            ServerMessage(event="game_state_sync", data=sync_data).model_dump(),
        )

    try:
        while True:
            raw = await websocket.receive_json()
            message = ClientMessage(**raw)
            await _route_action(room, user_id, message)
    except WebSocketDisconnect:
        connection_manager.disconnect(room_code, user_id)
        # بازیکن رو از room.players حذف نمی‌کنیم تا بتونه دوباره وصل بشه،
        # ولی اگه سازنده اتاق بود، مالکیت رو به اولین بازیکن آنلاین بعدی منتقل می‌کنیم
        if user_id == room.owner_user_id:
            _transfer_ownership_if_needed(room)
        await _broadcast_room_update(room)


def _build_sync_data(room: Room, user_id: int) -> dict:
    """کل وضعیت لازم برای بازسازی صفحه‌ی بازی یک کاربر خاص، برای اتصال مجدد"""
    engine = room.game_engine
    round_state = engine.current_round
    seat = room.players[user_id].seat
    hand = round_state.hands.get(seat, []) if round_state else []

    table_cards = []
    if round_state and round_state.current_trick:
        table_cards = [{"seat": p.seat, "card": p.card.id} for p in round_state.current_trick.plays]

    return {
        "hakem_seat": round_state.hakem_seat if round_state else None,
        "hokm_suit": round_state.hokm_suit.value if round_state and round_state.hokm_suit else None,
        "current_turn_seat": round_state.current_turn_seat if round_state else None,
        "my_hand": [c.id for c in hand],
        "table_cards": table_cards,
        "tricks": {t.value: c for t, c in round_state.tricks_won_by_team.items()} if round_state else {0: 0, 1: 0},
        "team_rounds": {
            TeamId.TEAM_A.value: engine.teams[TeamId.TEAM_A].rounds_won,
            TeamId.TEAM_B.value: engine.teams[TeamId.TEAM_B].rounds_won,
        },
        "pending_round_result": room.pending_round_result,
    }


async def _route_action(room: Room, user_id: int, message: ClientMessage) -> None:
    handlers = {
        "assign_team": _handle_assign_team,
        "set_ready": _handle_set_ready,
        "start_game": _handle_start_game,
        "choose_hokm": _handle_choose_hokm,
        "play_card": _handle_play_card,
        "start_next_round": _handle_start_next_round,
        "end_game": _handle_end_game,
        "send_emoji": _handle_send_emoji,
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
    engine = room.game_engine
    expected_seat = engine.next_dealer_seat
    seat = _seat_by_user(room, user_id)

    if seat != expected_seat:
        raise PermissionError("فقط بازیکن مربوطه می‌تونه راند بعدی رو شروع کنه")

    await _start_new_round(room)


async def _handle_end_game(room: Room, user_id: int, data: dict) -> None:
    if user_id != room.owner_user_id:
        raise PermissionError("فقط سازنده اتاق می‌تونه بازی رو تموم کنه")

    await connection_manager.broadcast(
        room.room_code,
        ServerMessage(event="room_dissolved", data={}).model_dump(),
    )
    room_manager.remove_room(room.room_code)


async def _handle_send_emoji(room: Room, user_id: int, data: dict) -> None:
    emoji = data.get("emoji", "")
    if not emoji:
        return
    seat = _seat_by_user(room, user_id)
    await connection_manager.broadcast(
        room.room_code,
        ServerMessage(event="emoji_reaction", data={"seat": seat, "emoji": emoji}).model_dump(),
    )

# ---------- کمکی‌های داخلی ----------

def _transfer_ownership_if_needed(room: Room) -> None:
    """اگه سازنده اتاق دیسکانکت بشه، مالکیت به اولین بازیکن آنلاین بعدی (راست‌گرد) منتقل میشه"""
    owner_id = room.owner_user_id
    owner_player = room.players.get(owner_id)
    if owner_player is None:
        return

    online_ids = set(connection_manager.connected_user_ids(room.room_code))
    new_owner = None

    if owner_player.seat is not None:
        seats = sorted(p.seat for p in room.players.values() if p.seat is not None)
        idx = seats.index(owner_player.seat)
        ordered_seats = seats[idx + 1:] + seats[:idx]
        players_by_seat = {p.seat: p for p in room.players.values() if p.seat is not None}
        for seat in ordered_seats:
            candidate = players_by_seat.get(seat)
            if candidate and candidate.user_id in online_ids:
                new_owner = candidate
                break
    else:
        candidates = [p for p in room.players.values() if p.user_id != owner_id and p.user_id in online_ids]
        if candidates:
            new_owner = candidates[0]

    if new_owner is None:
        return

    owner_player.is_room_owner = False
    room.owner_user_id = new_owner.user_id
    new_owner.is_room_owner = True

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
        ServerMessage(
            event="room_update",
            data={
                **room.to_public_dict(),
                "connected_user_ids": connection_manager.connected_user_ids(room.room_code),
            },
        ).model_dump(),
    )


async def _start_new_round(room: Room) -> None:
    room.pending_round_result = None
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

    payload = {
        "winning_team": result.winning_team.value,
        "is_koot": result.is_koot,
        "is_hakem_koot": result.is_hakem_koot,
        "points_awarded": result.points_awarded,
        "score": engine.get_score_summary(),
        "next_dealer_seat": None if is_game_over else engine.next_dealer_seat,
    }
    room.pending_round_result = None if is_game_over else payload

    await connection_manager.broadcast(
        room.room_code,
        ServerMessage(event="round_over", data=payload).model_dump(),
    )

    if is_game_over:
        await connection_manager.broadcast(
            room.room_code,
            ServerMessage(
                event="game_over",
                data={"winning_team": engine.winning_team.value},
            ).model_dump(),
        )