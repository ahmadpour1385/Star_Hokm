"""
مدیریت دسته کارت: ساخت و شافل کردن.
شافل کاملاً تصادفی با random.shuffle پایتون انجام میشه - بدون هیچ الگوریتم
یا وزن‌دهی خاص، طبق خواسته صریح کاربر (احتمال یکسان برای هر دست).
"""
from __future__ import annotations

import random

from app.core.cards import Card


class Deck:
    """یک دسته کارت قابل شافل و برداشتن (draw)"""

    def __init__(self):
        self._cards: list[Card] = Card.full_deck()

    def shuffle(self) -> None:
        """شافل کاملاً تصادفی - از الگوریتم استاندارد Fisher-Yates داخل random.shuffle استفاده میشه"""
        random.shuffle(self._cards)

    def draw(self, count: int) -> list[Card]:
        """برداشتن `count` کارت از بالای دسته (بعد از شافل). کارت‌های برداشته‌شده از دسته حذف میشن."""
        if count > len(self._cards):
            raise ValueError(
                f"تعداد درخواستی ({count}) بیشتر از کارت‌های باقی‌مانده ({len(self._cards)}) هست"
            )
        drawn = self._cards[:count]
        self._cards = self._cards[count:]
        return drawn

    @property
    def remaining_count(self) -> int:
        return len(self._cards)

    @classmethod
    def new_shuffled(cls) -> "Deck":
        """یک دسته جدید می‌سازه و بلافاصله شافلش می‌کنه - نقطه ورود اصلی برای شروع هر راند"""
        deck = cls()
        deck.shuffle()
        return deck