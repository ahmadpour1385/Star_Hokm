"""
منطق تعیین حاکم: کارت‌ها یکی‌یکی و به‌ترتیب دور میز (راست‌گرد) از یک دسته
کاملاً شافل‌شده پخش میشه تا اولین بازیکنی که آس بگیره، به‌عنوان حاکم انتخاب بشه.

نکته: چون دسته از قبل کاملاً شافل شده (random.shuffle)، ترتیب پخش هم
کاملاً تصادفیه و هیچ بازیکنی شانس بیشتر/کمتری برای گرفتن آس نداره.
"""
from __future__ import annotations

from dataclasses import dataclass

from app.core.cards import Card, Rank
from app.game.deck import Deck


@dataclass
class HakemResult:
    hakem_seat: int              # جایگاه (0-3) بازیکنی که حاکم شد
    winning_card: Card           # آسی که باعث حاکم شدن شد
    cards_dealt: dict[int, list[Card]]  # کارت‌هایی که تا اون لحظه به هرکس داده شده (باید بعداً به دسته برگردن)


def determine_hakem(deck: Deck, seat_order: list[int]) -> HakemResult:
    """
    از دسته شافل‌شده، به‌ترتیب seat_order (که باید راست‌گرد و شروع از یه نفر دلخواه باشه)
    یکی‌یکی کارت میده تا یکی آس بگیره.

    seat_order: مثلاً [0, 1, 2, 3] یعنی اول صندلی ۰، بعد ۱، بعد ۲، بعد ۳، و اگه لازم شد دوباره از ۰.

    توجه: کارت‌های داده‌شده در این فاز باید بعد از تعیین حاکم به دسته برگردونده بشن
    و دسته دوباره شافل بشه، چون طبق قانون حکم این کارت‌ها بخشی از دست نهایی نیستن؛
    این فقط یه مرحله‌ی جداگانه برای تعیین حاکمه.
    """
    cards_dealt: dict[int, list[Card]] = {seat: [] for seat in seat_order}
    idx = 0

    while True:
        seat = seat_order[idx % len(seat_order)]
        card = deck.draw(1)[0]
        cards_dealt[seat].append(card)

        if card.rank == Rank.ACE:
            return HakemResult(
                hakem_seat=seat,
                winning_card=card,
                cards_dealt=cards_dealt,
            )

        idx += 1