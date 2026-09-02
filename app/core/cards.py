"""
مدل‌های پایه‌ی کارت‌های بازی: خال (Suit)، رتبه (Rank) و خود کارت (Card).
این فایل کاملاً مستقل از منطق بازی، اتاق یا ربات هست.
"""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class Suit(str, Enum):
    """چهار خال استاندارد پاسور"""
    HEARTS = "hearts"        # دل ♥ - قرمز
    DIAMONDS = "diamonds"    # خشت ♦ - قرمز
    CLUBS = "clubs"          # گشنیز ♣ - مشکی
    SPADES = "spades"        # پیک ♠ - مشکی

    @property
    def color(self) -> str:
        """رنگ خال - برای نمایش رنگ عدد/حرف روی کارت طبق خواسته کاربر"""
        return "red" if self in (Suit.HEARTS, Suit.DIAMONDS) else "black"

    @property
    def symbol(self) -> str:
        return {
            Suit.HEARTS: "♥",
            Suit.DIAMONDS: "♦",
            Suit.CLUBS: "♣",
            Suit.SPADES: "♠",
        }[self]


class Rank(str, Enum):
    """رتبه‌های کارت از ۲ تا آس. مقدار عددی برای مقایسه قدرت کارت استفاده میشه."""
    TWO = "2"
    THREE = "3"
    FOUR = "4"
    FIVE = "5"
    SIX = "6"
    SEVEN = "7"
    EIGHT = "8"
    NINE = "9"
    TEN = "10"
    JACK = "J"
    QUEEN = "Q"
    KING = "K"
    ACE = "A"

    @property
    def power(self) -> int:
        """قدرت عددی کارت برای مقایسه (۲=۰ ... آس=۱۲)"""
        order = [
            Rank.TWO, Rank.THREE, Rank.FOUR, Rank.FIVE, Rank.SIX,
            Rank.SEVEN, Rank.EIGHT, Rank.NINE, Rank.TEN,
            Rank.JACK, Rank.QUEEN, Rank.KING, Rank.ACE,
        ]
        return order.index(self)


@dataclass(frozen=True)
class Card:
    """یک کارت بازی. immutable و قابل مقایسه/هش تا بشه توی set/dict استفادش کرد."""
    suit: Suit
    rank: Rank

    @property
    def id(self) -> str:
        """شناسه یکتا و کوتاه کارت، مثلاً 'A-spades' یا '10-hearts' - برای انتقال در JSON/WebSocket"""
        return f"{self.rank.value}-{self.suit.value}"

    def __str__(self) -> str:
        return f"{self.rank.value}{self.suit.symbol}"

    @staticmethod
    def full_deck() -> list["Card"]:
        """یک دسته کامل ۵۲ کارتی می‌سازه (بدون شافل)"""
        return [Card(suit=s, rank=r) for s in Suit for r in Rank]