import { useState } from "react";
import { useGame } from "../context/GameContext";
import Card, { parseCardId, sortHand } from "../components/Card";
import PlayerSeat from "../components/PlayerSeat";
import Scoreboard from "../components/Scoreboard";
import ConfirmBoard from "../components/ConfirmBoard";

const SUITS = ["hearts", "diamonds", "clubs", "spades"];
const SUIT_SYMBOLS = { hearts: "♥", diamonds: "♦", clubs: "♣", spades: "♠" };
const SUIT_COLORS = { hearts: "red", diamonds: "red", clubs: "black", spades: "black" };

export default function GameScreen({ onBackToHome }) {
  const {
    room, userId, hakemSeat, hokmSuit, myHand, currentTurnSeat,
    tableCards, tricksCount, teamRounds, roundResult, nextDealerSeat, gameOverResult,
    chooseHokm, playCard, startNextRound, endGame,
  } = useGame();

  const [showEndConfirm, setShowEndConfirm] = useState(false);

  if (!room) {
    return (
      <div className="screen">
        <p>Loading game...</p>
      </div>
    );
  }

  const me = room.players.find((p) => p.user_id === userId);
  const isOwner = me?.is_room_owner;
  const mySeat = me?.seat;

  const relativePosition = (seat) => {
    const diff = (seat - mySeat + 4) % 4;
    return { 0: "bottom", 1: "right", 2: "top", 3: "left" }[diff];
  };

  const playerBySeat = {};
  room.players.forEach((p) => {
    if (p.seat !== null) playerBySeat[p.seat] = p;
  });

  const hakemPlayer = hakemSeat !== null ? playerBySeat[hakemSeat] : null;
  const isMyTurn = currentTurnSeat === mySeat;
  const isChoosingHokm = hakemSeat !== null && hakemSeat === mySeat && hokmSuit === null;
  const isPlayingPhase = hokmSuit !== null;

  const myTeam = me?.team;
  const oppTeam = myTeam === 0 ? 1 : 0;
  const myTricks = tricksCount?.[myTeam] || 0;
  const oppTricks = tricksCount?.[oppTeam] || 0;

  const sortedHand = sortHand(myHand, hokmSuit);

  function handlePlayCard(cardId) {
    if (!isMyTurn) return;
    const { rank, suit } = parseCardId(cardId);
    playCard(rank, suit);
  }

  function isCardPlayable(cardId) {
    if (!isMyTurn) return false;
    if (tableCards.length === 0) return true;
    const leadingSuit = parseCardId(tableCards[0].card).suit;
    const hasLeadingSuit = myHand.some((c) => parseCardId(c).suit === leadingSuit);
    if (!hasLeadingSuit) return true;
    return parseCardId(cardId).suit === leadingSuit;
  }

  return (
    <div className="screen game-screen">
      <div className="game-top-bar">
        <Scoreboard roundsToWin={room.rounds_to_win} teamRounds={teamRounds} tricksCount={tricksCount} hokmSuit={hokmSuit} />
      </div>

      {hakemPlayer && (
        <div className="hakem-banner">
          👑 Hakem: <strong>{hakemPlayer.display_name}</strong>
          {!hokmSuit && (hakemSeat === mySeat ? " — choose the hokm suit" : " — waiting for hokm...")}
        </div>
      )}

      {isOwner && (
        <button className="end-game-btn" onClick={() => setShowEndConfirm(true)}>
          ✕ End Game
        </button>
      )}

      {showEndConfirm && (
        <ConfirmBoard
          title="END GAME"
          message="This will close the room for everyone and end the game immediately. This cannot be undone."
          confirmLabel="Yes, End Game"
          cancelLabel="Cancel"
          onCancel={() => setShowEndConfirm(false)}
          onConfirm={endGame}
        />
      )}

      <div className="game-table-wrapper">
        <div className="table-felt">
          <div className="table-diamond-plate" />
          <div className="table-outer-ring" />
          <div className="table-center-medallion" />

          <div className="ray-line ray-line-top" />
          <div className="ray-line ray-line-bottom" />
          <div className="ray-line ray-line-left" />
          <div className="ray-line ray-line-right" />

          <div className="ray-stars ray-stars-top">
            <span>✦</span><span>✦</span><span>✦</span>
          </div>
          <div className="ray-stars ray-stars-bottom">
            <span>✦</span><span>✦</span><span>✦</span>
          </div>
          <div className="ray-stars ray-stars-left">
            <span>✦</span><span>✦</span><span>✦</span>
          </div>
          <div className="ray-stars ray-stars-right">
            <span>✦</span><span>✦</span><span>✦</span>
          </div>

          <div className="table-logo">
            <svg className="table-logo-star" viewBox="0 0 100 100">
              <polygon
                points="50,6 61,38 95,38 67,58 78,90 50,70 22,90 33,58 5,38 39,38"
                fill="none"
                stroke="#b8891f"
                strokeWidth="7"
                strokeLinejoin="round"
              />
            </svg>
            <div className="table-logo-suits">
              <span className="suit-gold">♠</span>
              <span className="suit-red">♦</span>
              <span className="suit-red">♥</span>
              <span className="suit-gold">♣</span>
            </div>
            <span className="table-logo-star-text">STAR</span>
            <span className="table-logo-hokm-text">HOKM</span>
          </div>

          <div className="seat-top-abs chair-slot">
            <div className="chair-back" />
            <PlayerSeat
              player={playerBySeat[(mySeat + 2) % 4]}
              isHakem={hakemSeat === (mySeat + 2) % 4}
              isCurrentTurn={currentTurnSeat === (mySeat + 2) % 4}
              cardsCount={13}
              position="top"
              nameAbove={true}
              isOffline={playerBySeat[(mySeat + 2) % 4] && !room.connected_user_ids?.includes(playerBySeat[(mySeat + 2) % 4].user_id)}
            />
          </div>

          <div className="seat-left-abs chair-slot">
            <div className="chair-back" />
            <PlayerSeat
              player={playerBySeat[(mySeat + 3) % 4]}
              isHakem={hakemSeat === (mySeat + 3) % 4}
              isCurrentTurn={currentTurnSeat === (mySeat + 3) % 4}
              cardsCount={13}
              position="left"
              nameAbove={true}
              isOffline={playerBySeat[(mySeat + 3) % 4] && !room.connected_user_ids?.includes(playerBySeat[(mySeat + 3) % 4].user_id)}
            />
            <div className="opp-trick-pile">
              {Array.from({ length: oppTricks }).map((_, i) => (
                <div key={i} className="won-trick-mini" />
              ))}
            </div>
          </div>

          <div className="seat-right-abs chair-slot">
            <div className="chair-back" />
            <PlayerSeat
              player={playerBySeat[(mySeat + 1) % 4]}
              isHakem={hakemSeat === (mySeat + 1) % 4}
              isCurrentTurn={currentTurnSeat === (mySeat + 1) % 4}
              cardsCount={13}
              position="right"
              nameAbove={true}
              isOffline={playerBySeat[(mySeat + 1) % 4] && !room.connected_user_ids?.includes(playerBySeat[(mySeat + 1) % 4].user_id)}
            />
          </div>

          <div className="seat-bottom-abs chair-slot">
            <div className="chair-back" />
            <PlayerSeat
              player={me}
              isHakem={hakemSeat === mySeat}
              isCurrentTurn={isMyTurn}
              cardsCount={myHand.length}
              position="bottom"
            />
          </div>

          <div className="table-center">
            {tableCards.map((play, idx) => (
              <div key={idx} className={`table-card table-card-${relativePosition(play.seat)}`}>
                <Card cardId={play.card} />
              </div>
            ))}
          </div>

          <div className="won-tricks-pile">
            {Array.from({ length: myTricks }).map((_, i) => (
              <div key={i} className="won-trick-mini" />
            ))}
          </div>
        </div>
      </div>

      <div className="my-hand">
        {sortedHand.map((cardId, idx) => (
          <div
            key={cardId}
            className="my-hand-card"
            style={{ zIndex: idx }}
            onClick={() => handlePlayCard(cardId)}
          >
            <Card cardId={cardId} disabled={isPlayingPhase && !isCardPlayable(cardId)} />
          </div>
        ))}
      </div>

      {isChoosingHokm && (
        <div className="hokm-choice-panel">
          {SUITS.map((suit) => (
            <button
              key={suit}
              className={`hokm-suit-circle ${SUIT_COLORS[suit]}`}
              onClick={() => chooseHokm(suit)}
            >
              {SUIT_SYMBOLS[suit]}
            </button>
          ))}
        </div>
      )}

      {roundResult && !gameOverResult && (
        <div className="hokm-modal-backdrop">
          <div className="hokm-modal">
            <h3>Round Over</h3>
            <p>
              {roundResult.is_koot && "Hakem Koot! 👑"}
              {roundResult.is_hakem_koot && "Koot! 🔥"}
            </p>
            <p>Winning Team: {roundResult.winning_team === 0 ? "A" : "B"}</p>
            <p>Points: {roundResult.points_awarded}</p>

            {nextDealerSeat === mySeat ? (
              <button className="btn btn-primary" onClick={startNextRound} style={{ marginTop: 16 }}>
                Start Next Round
              </button>
            ) : (
              <p style={{ marginTop: 16, fontSize: 13, color: "#c9b896" }}>
                Waiting for the next dealer to start...
              </p>
            )}
          </div>
        </div>
      )}

      {gameOverResult && (
        <div className="hokm-modal-backdrop">
          <div className="hokm-modal">
            <h3>🏆 Game Over</h3>
            <p>Winning Team: {gameOverResult.winning_team === 0 ? "A" : "B"}</p>
            <button className="btn btn-primary" onClick={onBackToHome}>
              Back to Home
            </button>
          </div>
        </div>
      )}
    </div>
  );
}