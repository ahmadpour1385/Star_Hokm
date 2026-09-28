import { useState } from "react";
import { useGame } from "../context/GameContext";
import Card, { parseCardId, sortHand, SuitIcon } from "../components/Card";
import PlayerSeat from "../components/PlayerSeat";
import Scoreboard from "../components/Scoreboard";
import ConfirmBoard from "../components/ConfirmBoard";

const SUITS = ["hearts", "diamonds", "clubs", "spades"];
const SUIT_COLORS = { hearts: "red", diamonds: "red", clubs: "black", spades: "black" };

const SEAT_LAYOUT = [
  { key: "top", offset: 2, nameAbove: true },
  { key: "left", offset: 3, nameAbove: true },
  { key: "right", offset: 1, nameAbove: true },
  { key: "bottom", offset: 0, nameAbove: false },
];

export default function GameScreen({ onBackToHome }) {
  const {
    room, userId, hakemSeat, hokmSuit, myHand, currentTurnSeat,
    tableCards, tricksCount, teamRounds, roundResult, nextDealerSeat, gameOverResult,
    chooseHokm, playCard, startNextRound, endGame, sendEmoji, emojiReactions,
  } = useGame();

  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showEmojiPanel, setShowEmojiPanel] = useState(false);

  const EMOJI_LIST = ["😄", "😂", "😮", "😡", "👍", "👎", "🔥", "😢", "🤔", "🎉"];

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

  function reactionForSeat(seatNum) {
    const found = [...emojiReactions].reverse().find((r) => r.seat === seatNum);
    return found?.emoji || null;
  }

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
        <Scoreboard
          roundsToWin={room.rounds_to_win}
          teamRounds={teamRounds}
          tricksCount={tricksCount}
          hokmSuit={hokmSuit}
        />
      </div>

      {hakemPlayer && (
        <div className="hakem-banner">
          👑 Hakem: <strong>{hakemPlayer.display_name}</strong>
          {!hokmSuit &&
            (hakemSeat === mySeat
              ? " — choose the hokm suit"
              : " — waiting for hokm...")}
        </div>
      )}

      {isOwner && (
        <button
          className="end-game-btn"
          onClick={() => setShowEndConfirm(true)}
        >
          ✕ End Game
        </button>
      )}

      <button
        className="emoji-toggle-btn"
        onClick={() => setShowEmojiPanel((v) => !v)}
      >
        💬
      </button>

      {showEmojiPanel && (
        <div className="emoji-panel">
          {EMOJI_LIST.map((emoji) => (
            <button
              key={emoji}
              className="emoji-panel-item"
              onClick={() => {
                sendEmoji(emoji);
                setShowEmojiPanel(false);
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
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

      <div className="tbl-wrap">
        <div className="tbl-felt">
          <div className="tbl-ring" />
          <div className="tbl-plate" />
          <div className="tbl-medallion" />

          {["top", "bottom", "left", "right"].map((v) => (
            <div key={v} className={`tbl-vertex tbl-vertex-${v}`}>
              <span>✦</span>
              <span>✦</span>
              <span>✦</span>
            </div>
          ))}

          <div className="tbl-logo">
            <svg className="tbl-logo-star" viewBox="0 0 100 100">
              <polygon
                points="50,6 61,38 95,38 67,58 78,90 50,70 22,90 33,58 5,38 39,38"
                fill="none"
                stroke="#9a7a2e"
                strokeWidth="6"
                strokeLinejoin="round"
              />
            </svg>
            <div className="tbl-logo-suits">
              <span className="suit-gold"><SuitIcon suit="spades" /></span>
              <span className="suit-red"><SuitIcon suit="diamonds" /></span>
              <span className="suit-red"><SuitIcon suit="hearts" /></span>
              <span className="suit-gold"><SuitIcon suit="clubs" /></span>
            </div>
            <span className="tbl-logo-title">STAR</span>
            <div className="tbl-logo-sub">
              <i />
              <span>HOKM</span>
              <i />
            </div>
          </div>

          <div className="tbl-cards">
            {tableCards.map((play, idx) => (
              <div key={idx} className={`tbl-card tbl-card-${relativePosition(play.seat)}`}>
                <Card cardId={play.card} />
              </div>
            ))}
          </div>

          <div className="tbl-pile tbl-pile-mine">
            {Array.from({ length: myTricks }).map((_, i) => (
              <div key={i} className="won-trick-mini" />
            ))}
          </div>

          <div className="tbl-pile tbl-pile-opp">
            {Array.from({ length: oppTricks }).map((_, i) => (
              <div key={i} className="won-trick-mini" />
            ))}
          </div>

          {SEAT_LAYOUT.map(({ key, offset, nameAbove }) => {
            const seatNum = (mySeat + offset) % 4;
            const player = playerBySeat[seatNum];
            const reaction = reactionForSeat(seatNum);
            return (
              <div key={key} className={`tbl-seat tbl-seat-${key}`}>
                <div className="tbl-chair" />
                <PlayerSeat
                  player={player}
                  isHakem={hakemSeat === seatNum}
                  isCurrentTurn={currentTurnSeat === seatNum}
                  cardsCount={key === "bottom" ? myHand.length : 13}
                  position={key}
                  nameAbove={nameAbove}
                  isOffline={
                    key !== "bottom" &&
                    player &&
                    !room.connected_user_ids?.includes(player.user_id)
                  }
                />
                {reaction && <span className="emoji-bubble">{reaction}</span>}
              </div>
            );
          })}
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
            <Card
              cardId={cardId}
              disabled={isPlayingPhase && !isCardPlayable(cardId)}
            />
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
              <SuitIcon suit={suit} />
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

            <p>
              Winning Team: {roundResult.winning_team === 0 ? "A" : "B"}
            </p>

            <p>Points: {roundResult.points_awarded}</p>

            {nextDealerSeat === mySeat ? (
              <button
                className="btn btn-primary"
                onClick={startNextRound}
                style={{ marginTop: 16 }}
              >
                Start Next Round
              </button>
            ) : (
              <p
                style={{
                  marginTop: 16,
                  fontSize: 13,
                  color: "#c9b896",
                }}
              >
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

            <p>
              Winning Team: {gameOverResult.winning_team === 0 ? "A" : "B"}
            </p>

            <button
              className="btn btn-primary"
              onClick={onBackToHome}
            >
              Back to Home
            </button>
          </div>
        </div>
      )}
    </div>
  );
}