"""
مدیریت یک راند کامل بازی حکم: از تعیین حاکم تا پایان راند و محاسبه امتیاز.
هر «راند» یعنی یک دست کامل بازی تا وقتی یک تیم ۷ تریک رو ببره.
"""
from __future__ import annotations

from dataclasses import dataclass, field

from app.core.cards import Card, Suit
from app.core.config import settings
from app.core.models import GamePhase, Player, Team, TeamId
from app.game.deck import Deck
from app.game.hakem import determine_hakem
from app.game.trick import Trick


@dataclass
class RoundResult:
    """نتیجه‌ی نهایی یک راند بعد از تموم شدن ۷ تریک"""
    winning_team: TeamId
    hakem_team_tricks: int
    challenger_team_tricks: int
    is_koot: bool                 # حاکم صفر گرفت و حریف هر ۷ تا رو برد
    is_hakem_koot: bool           # حاکم هر ۷ تا رو برد و حریف صفر گرفت
    points_awarded: int           # تعداد راند اضافه‌شده به تیم برنده (۱ عادی، ۲ یا ۳ در کوت)


class RoundState:
    """
    وضعیت کامل یک راند در حال اجرا.
    seat_order: ترتیب ثابت صندلی‌ها دور میز، مثلاً [0, 1, 2, 3] به ترتیب راست‌گرد.
    team_by_seat: نگاشت هر صندلی به تیمش، مثلاً {0: TEAM_A, 1: TEAM_B, 2: TEAM_A, 3: TEAM_B}
    """

    def __init__(self, seat_order: list[int], team_by_seat: dict[int, TeamId], dealer_start_seat: int):
        self.seat_order = seat_order
        self.team_by_seat = team_by_seat
        self.phase: GamePhase = GamePhase.DETERMINING_HAKEM

        self.deck: Deck = Deck.new_shuffled()
        self.hands: dict[int, list[Card]] = {seat: [] for seat in seat_order}

        self.hakem_seat: int | None = None
        self.hokm_suit: Suit | None = None
        self.dealer_start_seat = dealer_start_seat  # صندلی‌ای که پخش کارت این راند از اون شروع میشه

        self.tricks_history: list[Trick] = []
        self.current_trick: Trick | None = None
        self.current_turn_seat: int | None = None

        self.tricks_won_by_team: dict[TeamId, int] = {TeamId.TEAM_A: 0, TeamId.TEAM_B: 0}

    # ---------- فاز ۱: تعیین حاکم ----------

    def run_determine_hakem(self) -> int:
        """کارت‌ها رندوم پخش میشه تا یکی آس بگیره. کارت‌های این فاز به دسته برنمی‌گردن مصرف میشن،
        چون دسته اصلی همچنان کاملاً شافل و رندوم باقی می‌مونه برای پخش واقعی."""
        order_from_dealer = self._rotated_order(self.dealer_start_seat)
        result = determine_hakem(self.deck, order_from_dealer)
        self.hakem_seat = result.hakem_seat

        # طبق قانون حکم، دسته باید تازه و کامل برای پخش واقعی باشه؛
        # پس دسته رو دوباره کامل و شافل می‌کنیم (کارت‌های فاز تعیین حاکم مصرف و کنار گذاشته میشن)
        self.deck = Deck.new_shuffled()

        self.phase = GamePhase.FIRST_DEAL
        return self.hakem_seat

    def set_hakem_directly(self, seat: int) -> None:
        """
        برای راندهای بعد از اولین راند بازی: حاکم بدون قرعه‌کشی آس مستقیم تعیین میشه،
        چون طبق قانون از قبل مشخصه (همون حاکم قبلی اگه برده، یا نفر بعدی راست‌گرد اگه باخته).
        """
        self.hakem_seat = seat
        self.phase = GamePhase.FIRST_DEAL

    # ---------- فاز ۲: پخش ۵ کارت اول ----------

    def run_first_deal(self) -> None:
        """۵ کارت اول به هر بازیکن داده میشه، شروع از حاکم، راست‌گرد"""
        order_from_hakem = self._rotated_order(self.hakem_seat)
        for seat in order_from_hakem:
            self.hands[seat].extend(self.deck.draw(settings.FIRST_DEAL_COUNT))

        self.phase = GamePhase.CHOOSING_HOKM

    # ---------- فاز ۳: انتخاب حکم ----------

    def set_hokm(self, suit: Suit) -> None:
        """حاکم خال حکم رو انتخاب می‌کنه"""
        if self.phase != GamePhase.CHOOSING_HOKM:
            raise ValueError("الان فاز انتخاب حکم نیست")
        self.hokm_suit = suit
        self.phase = GamePhase.SECOND_DEAL

    # ---------- فاز ۴: پخش بقیه کارت‌ها ----------

    def run_second_deal(self) -> None:
        """بقیه کارت‌ها (۴ تا ۴ تا، دو نوبت) از حاکم شروع و راست‌گرد پخش میشه تا هرکس ۱۳ کارت داشته باشه"""
        order_from_hakem = self._rotated_order(self.hakem_seat)

        # دو نوبت ۴ کارتی
        for _ in range(2):
            for seat in order_from_hakem:
                self.hands[seat].extend(self.deck.draw(settings.SECOND_DEAL_COUNT))

        self.phase = GamePhase.PLAYING
        self.current_turn_seat = self.hakem_seat
        self.current_trick = Trick(hokm_suit=self.hokm_suit)

    # ---------- فاز ۵: بازی تریک‌ها ----------

    def play_card(self, seat: int, card: Card) -> int | None:
        """
        یک بازیکن یه کارت بازی می‌کنه. اگه تریک با این کارت کامل بشه،
        صندلی برنده‌ی تریک برگردونده میشه؛ وگرنه None.
        """
        if self.phase != GamePhase.PLAYING:
            raise ValueError("الان فاز بازی نیست")
        if seat != self.current_turn_seat:
            raise ValueError("نوبت این بازیکن نیست")

        hand = self.hands[seat]
        if card not in hand:
            raise ValueError("این کارت در دست بازیکن نیست")

        if not self.current_trick.is_valid_play(card, hand):
            raise ValueError("این کارت طبق قانون پیروی از خال مجاز نیست")

        hand.remove(card)
        self.current_trick.add_play(seat, card)

        if not self.current_trick.is_complete:
            self.current_turn_seat = self._next_seat(seat)
            return None

        # تریک کامل شد
        winner_seat = self.current_trick.determine_winner_seat()
        winner_team = self.team_by_seat[winner_seat]
        self.tricks_won_by_team[winner_team] += 1
        self.tricks_history.append(self.current_trick)

        if self.tricks_won_by_team[winner_team] >= settings.TRICKS_TO_WIN_ROUND:
            self.phase = GamePhase.ROUND_OVER
            self.current_trick = None
            self.current_turn_seat = None
        else:
            self.current_turn_seat = winner_seat  # برنده‌ی تریک، تریک بعدی رو شروع می‌کنه
            self.current_trick = Trick(hokm_suit=self.hokm_suit)

        return winner_seat

    # ---------- فاز ۶: پایان راند و محاسبه امتیاز ----------

    def finalize_round(self) -> RoundResult:
        """بعد از رسیدن یک تیم به ۷ تریک، امتیاز نهایی راند رو حساب می‌کنه (شامل کوت)"""
        if self.phase != GamePhase.ROUND_OVER:
            raise ValueError("راند هنوز تموم نشده")

        hakem_team = self.team_by_seat[self.hakem_seat]
        challenger_team = TeamId.TEAM_B if hakem_team == TeamId.TEAM_A else TeamId.TEAM_A

        hakem_tricks = self.tricks_won_by_team[hakem_team]
        challenger_tricks = self.tricks_won_by_team[challenger_team]

        is_koot = hakem_tricks == 0 and challenger_tricks == settings.TRICKS_TO_WIN_ROUND
        is_hakem_koot = challenger_tricks == 0 and hakem_tricks == settings.TRICKS_TO_WIN_ROUND

        if is_koot:
            winning_team = challenger_team
            points = settings.KOOT_POINTS
        elif is_hakem_koot:
            winning_team = hakem_team
            points = settings.HAKEM_KOOT_POINTS
        else:
            winning_team = hakem_team if hakem_tricks > challenger_tricks else challenger_team
            points = 1

        self.phase = GamePhase.GAME_OVER  # فراخوان بیرونی تصمیم می‌گیره راند بعدی شروع بشه یا بازی تموم شده

        return RoundResult(
            winning_team=winning_team,
            hakem_team_tricks=hakem_tricks,
            challenger_team_tricks=challenger_tricks,
            is_koot=is_koot,
            is_hakem_koot=is_hakem_koot,
            points_awarded=points,
        )

    # ---------- کمکی‌ها ----------

    def _rotated_order(self, start_seat: int) -> list[int]:
        """ترتیب صندلی‌ها رو راست‌گرد از start_seat می‌چینه"""
        idx = self.seat_order.index(start_seat)
        return self.seat_order[idx:] + self.seat_order[:idx]

    def _next_seat(self, seat: int) -> int:
        idx = self.seat_order.index(seat)
        return self.seat_order[(idx + 1) % len(self.seat_order)]