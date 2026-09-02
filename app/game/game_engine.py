"""
موتور اصلی بازی: مدیریت کل بازی روی چند راند پشت سر هم.
مسئول شروع راند جدید، تعیین حاکم راند بعدی (طبق قانون: اگه حاکم باخت،
حاکم راست‌گرد به نفر بعدی منتقل میشه)، و تشخیص برنده نهایی بازی.
"""
from __future__ import annotations

from dataclasses import dataclass, field

from app.core.config import settings
from app.core.models import GamePhase, Player, Team, TeamId
from app.game.round_state import RoundResult, RoundState


@dataclass
class GameEngine:
    """
    وضعیت کامل یک بازی از شروع تا پایان.
    players: دیکشنری seat -> Player (باید از قبل seat و team مشخص شده باشه)
    rounds_to_win: تعداد راند لازم برای برد کل بازی (۳، ۵ یا ۷)
    """
    players: dict[int, Player]
    rounds_to_win: int

    seat_order: list[int] = field(init=False)
    team_by_seat: dict[int, TeamId] = field(init=False)
    teams: dict[TeamId, Team] = field(init=False)

    current_round: RoundState | None = field(default=None, init=False)
    round_history: list[RoundResult] = field(default_factory=list, init=False)

    # صندلی‌ای که راند فعلی/بعدی باید حاکمش از اینجا تعیین‌شروع بشه
    _next_dealer_start_seat: int = field(default=0, init=False)

    def __post_init__(self):
        if self.rounds_to_win not in settings.VALID_ROUNDS_TO_WIN_OPTIONS:
            raise ValueError(
                f"تعداد راند باید یکی از {settings.VALID_ROUNDS_TO_WIN_OPTIONS} باشه"
            )

        self.seat_order = sorted(self.players.keys())
        if len(self.seat_order) != settings.PLAYERS_PER_ROOM:
            raise ValueError(f"بازی باید دقیقاً {settings.PLAYERS_PER_ROOM} بازیکن داشته باشه")

        self.team_by_seat = {
            seat: self.players[seat].team for seat in self.seat_order
        }

        self.teams = {
            TeamId.TEAM_A: Team(team_id=TeamId.TEAM_A, player_ids=[
                self.players[s].user_id for s in self.seat_order if self.team_by_seat[s] == TeamId.TEAM_A
            ]),
            TeamId.TEAM_B: Team(team_id=TeamId.TEAM_B, player_ids=[
                self.players[s].user_id for s in self.seat_order if self.team_by_seat[s] == TeamId.TEAM_B
            ]),
        }

        self._next_dealer_start_seat = self.seat_order[0]

    # ---------- شروع راند جدید ----------

    def start_new_round(self) -> RoundState:
        """
        یک راند جدید می‌سازه. فقط اولین راند کل بازی با قرعه‌کشی آس تعیین حاکم می‌کنه؛
        راندهای بعدی حاکم مستقیم و قطعی طبق قانون برد/باخت (self._next_dealer_start_seat) تعیین میشه.
        """
        self.current_round = RoundState(
            seat_order=self.seat_order,
            team_by_seat=self.team_by_seat,
            dealer_start_seat=self._next_dealer_start_seat,
        )
        if not self.round_history:
            self.current_round.run_determine_hakem()
        else:
            self.current_round.set_hakem_directly(self._next_dealer_start_seat)
        return self.current_round

    # ---------- پایان راند و رفتن به راند بعدی ----------

    def finish_current_round(self) -> RoundResult:
        """
        راند فعلی رو نهایی می‌کنه، امتیاز رو ثبت می‌کنه، و صندلی شروع راند بعدی رو
        طبق قانون مشخص می‌کنه:
        - اگه تیمِ حاکم راند رو باخت (یعنی تیم برنده == تیم حریفِ حاکم)،
          حاکم راست‌گرد به نفر بعدی منتقل میشه.
        - اگه تیمِ حاکم برد، حاکم همون صندلی باقی می‌مونه (پخش بعدی هم از همونجا شروع میشه).
        """
        result = self.current_round.finalize_round()
        self.round_history.append(result)
        self.teams[result.winning_team].rounds_won += result.points_awarded

        hakem_seat = self.current_round.hakem_seat
        hakem_team = self.team_by_seat[hakem_seat]

        if result.winning_team != hakem_team:
            # حاکم باخت -> راست‌گرد به نفر بعدی منتقل میشه
            idx = self.seat_order.index(hakem_seat)
            self._next_dealer_start_seat = self.seat_order[(idx + 1) % len(self.seat_order)]
        else:
            self._next_dealer_start_seat = hakem_seat

        return result

    # ---------- تشخیص پایان کل بازی ----------

    @property
    def is_game_over(self) -> bool:
        return any(team.rounds_won >= self.rounds_to_win for team in self.teams.values())

    @property
    def winning_team(self) -> TeamId | None:
        for team_id, team in self.teams.items():
            if team.rounds_won >= self.rounds_to_win:
                return team_id
        return None

    @property
    def next_dealer_seat(self) -> int:
        """صندلی‌ای که باید راند بعدی از اونجا پخش کارت شروع بشه"""
        return self._next_dealer_start_seat

    def get_score_summary(self) -> dict:
        """برای نمایش روی بیلبورد: امتیاز راندهای هر تیم"""
        return {
            "team_a_rounds": self.teams[TeamId.TEAM_A].rounds_won,
            "team_b_rounds": self.teams[TeamId.TEAM_B].rounds_won,
            "rounds_to_win": self.rounds_to_win,
            "is_game_over": self.is_game_over,
            "winning_team": self.winning_team.value if self.winning_team else None,
        }