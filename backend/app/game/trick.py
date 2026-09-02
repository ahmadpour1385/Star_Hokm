"""
منطق یک تریک (دست): بررسی معتبر بودن کارت بازی‌شده طبق قانون پیروی از خال،
و تشخیص برنده‌ی تریک بعد از اینکه هر ۴ بازیکن کارت زدن.

قانون:
- بازیکن باید از خال زمین (خال اولین کارت بازی‌شده در این تریک) پیروی کنه، اگه در دستش داشته باشه.
- اگه خال زمین رو نداشت، آزاده: یا با خال حکم بزنه (ببره)، یا با هر خال دیگه رد کنه.
- برنده‌ی تریک: اگه حکم زده شده باشه، بالاترین کارت از خال حکم می‌بره؛
  وگرنه بالاترین کارت از خال زمین می‌بره.
"""
from __future__ import annotations

from dataclasses import dataclass, field

from app.core.cards import Card, Suit


@dataclass
class TrickPlay:
    """یک کارتِ بازی‌شده توسط یک بازیکن در این تریک"""
    seat: int
    card: Card


@dataclass
class Trick:
    """یک تریک در حال انجام یا تمام‌شده"""
    hokm_suit: Suit
    plays: list[TrickPlay] = field(default_factory=list)

    @property
    def leading_suit(self) -> Suit | None:
        """خال زمین = خال اولین کارتی که در این تریک بازی شده"""
        if not self.plays:
            return None
        return self.plays[0].card.suit

    def is_valid_play(self, card: Card, player_hand: list[Card]) -> bool:
        """
        بررسی می‌کنه آیا زدن این کارت طبق قانون پیروی از خال مجازه یا نه.
        player_hand: کل دست فعلی بازیکن (قبل از زدن این کارت)
        """
        leading = self.leading_suit

        # اگه این اولین کارت تریکه، هر کارتی مجازه
        if leading is None:
            return True

        has_leading_suit = any(c.suit == leading for c in player_hand)

        if has_leading_suit:
            # اگه خال زمین رو داره، مجبوره همون خال رو بزنه
            return card.suit == leading

        # اگه خال زمین رو نداره، هر کارتی (حکم یا هر خال دیگه) مجازه
        return True

    def add_play(self, seat: int, card: Card) -> None:
        self.plays.append(TrickPlay(seat=seat, card=card))

    @property
    def is_complete(self) -> bool:
        return len(self.plays) == 4

    def determine_winner_seat(self) -> int:
        """
        برنده‌ی تریک رو مشخص می‌کنه. فقط وقتی صدا بزن که تریک کامل شده (۴ کارت).
        اولویت با بالاترین حکم زده‌شده؛ اگه هیچ حکمی زده نشده، بالاترین کارت خال زمین می‌بره.
        """
        if not self.is_complete:
            raise ValueError("تریک هنوز کامل نشده - ۴ کارت لازمه")

        hokm_plays = [p for p in self.plays if p.card.suit == self.hokm_suit]

        if hokm_plays:
            winner = max(hokm_plays, key=lambda p: p.card.rank.power)
        else:
            leading = self.leading_suit
            leading_plays = [p for p in self.plays if p.card.suit == leading]
            winner = max(leading_plays, key=lambda p: p.card.rank.power)

        return winner.seat