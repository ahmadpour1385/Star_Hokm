import { createContext, useContext, useEffect, useRef, useState } from "react";
import { gameConnection } from "../ws/connection";

const GameContext = createContext(null);
const SESSION_KEY = "starHokmSession";

function saveSession(roomCode, userId) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ roomCode, userId }));
  } catch {}
}
function clearStoredSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {}
}
function loadStoredSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function GameProvider({ children }) {
  const [userId, setUserId] = useState(null);
  const [roomCode, setRoomCode] = useState(null);

  const [room, setRoom] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [roomDissolved, setRoomDissolved] = useState(false);

  const [hakemSeat, setHakemSeat] = useState(null);
  const [hokmSuit, setHokmSuit] = useState(null);
  const [myHand, setMyHand] = useState([]);
  const [currentTurnSeat, setCurrentTurnSeat] = useState(null);
  const [tableCards, setTableCards] = useState([]);
  const [tricksCount, setTricksCount] = useState({ 0: 0, 1: 0 });
  const [lastTrickWinnerSeat, setLastTrickWinnerSeat] = useState(null);

  const [teamRounds, setTeamRounds] = useState({ 0: 0, 1: 0 });
  const [roundResult, setRoundResult] = useState(null);
  const [nextDealerSeat, setNextDealerSeat] = useState(null);
  const [gameOverResult, setGameOverResult] = useState(null);

  const [lastError, setLastError] = useState(null);
  const [pendingSession, setPendingSession] = useState(() => loadStoredSession());

    const connectedRef = useRef(false);

  useEffect(() => {
    function checkAndPromptReconnect() {
      if (document.visibilityState === "visible" && !gameConnection.isConnected()) {
        const stored = loadStoredSession();
        if (stored) {
          setPendingSession(stored);
        }
      }
    }
    document.addEventListener("visibilitychange", checkAndPromptReconnect);
    window.addEventListener("pageshow", checkAndPromptReconnect);
    window.addEventListener("focus", checkAndPromptReconnect);
    return () => {
      document.removeEventListener("visibilitychange", checkAndPromptReconnect);
      window.removeEventListener("pageshow", checkAndPromptReconnect);
      window.removeEventListener("focus", checkAndPromptReconnect);
    };
  }, []);

  useEffect(() => {
    const unsubscribers = [];

  const connectedRef = useRef(false);

  useEffect(() => {
    const unsubscribers = [];

    unsubscribers.push(gameConnection.on("room_update", (data) => setRoom(data)));

    unsubscribers.push(
      gameConnection.on("game_started", () => {
        setRoundResult(null);
        setGameOverResult(null);
        setGameStarted(true);
        setTeamRounds({ 0: 0, 1: 0 });
      })
    );

    unsubscribers.push(
      gameConnection.on("hakem_determined", (data) => {
        setHakemSeat(data.hakem_seat);
        setHokmSuit(null);
        setTableCards([]);
        setTricksCount({ 0: 0, 1: 0 });
        setRoundResult(null);
        setNextDealerSeat(null);
      })
    );

    unsubscribers.push(gameConnection.on("your_hand", (data) => setMyHand(data.cards)));
    unsubscribers.push(gameConnection.on("waiting_for_hokm", () => setHokmSuit(null)));
    unsubscribers.push(gameConnection.on("hokm_chosen", (data) => setHokmSuit(data.suit)));
    unsubscribers.push(gameConnection.on("turn_changed", (data) => setCurrentTurnSeat(data.seat)));

    unsubscribers.push(
      gameConnection.on("card_played", (data) => {
        setTableCards((prev) => [...prev, { seat: data.seat, card: data.card }]);
        setMyHand((prev) => prev.filter((c) => c !== data.card));
      })
    );

    unsubscribers.push(
      gameConnection.on("trick_won", (data) => {
        setLastTrickWinnerSeat(data.winner_seat);
        setTricksCount(data.tricks);
        setTimeout(() => setTableCards([]), 1200);
      })
    );

    unsubscribers.push(
      gameConnection.on("round_over", (data) => {
        setRoundResult(data);
        setNextDealerSeat(data.next_dealer_seat);
        if (data.score) {
          setTeamRounds({ 0: data.score.team_a_rounds, 1: data.score.team_b_rounds });
        }
      })
    );

    unsubscribers.push(gameConnection.on("game_over", (data) => setGameOverResult(data)));
    unsubscribers.push(gameConnection.on("room_dissolved", () => setRoomDissolved(true)));
    unsubscribers.push(gameConnection.on("error", (data) => setLastError(data.message)));

    unsubscribers.push(
      gameConnection.on("game_state_sync", (data) => {
        setGameStarted(true);
        setHakemSeat(data.hakem_seat);
        setHokmSuit(data.hokm_suit);
        setMyHand(data.my_hand);
        setCurrentTurnSeat(data.current_turn_seat);
        setTableCards(data.table_cards.map((p) => ({ seat: p.seat, card: p.card })));
        setTricksCount(data.tricks);
        setTeamRounds(data.team_rounds);
        if (data.pending_round_result) {
          setRoundResult(data.pending_round_result);
          setNextDealerSeat(data.pending_round_result.next_dealer_seat);
        }
      })
    );

    return () => unsubscribers.forEach((unsub) => unsub());
  }, []);

  function resetGameState() {
    setGameStarted(false);
    setRoomDissolved(false);
    setRoom(null);
    setHakemSeat(null);
    setHokmSuit(null);
    setMyHand([]);
    setCurrentTurnSeat(null);
    setTableCards([]);
    setTricksCount({ 0: 0, 1: 0 });
    setTeamRounds({ 0: 0, 1: 0 });
    setRoundResult(null);
    setNextDealerSeat(null);
    setGameOverResult(null);
  }

  async function connectToRoom(code, uid) {
    resetGameState();
    await gameConnection.connect(code, uid);
    setUserId(uid);
    setRoomCode(code);
    connectedRef.current = true;
    saveSession(code, uid);
  }

  function acknowledgeDissolved() {
    gameConnection.disconnect();
    resetGameState();
    clearStoredSession();
  }

  async function confirmReconnect() {
    const session = pendingSession;
    setPendingSession(null);
    if (session) {
      await connectToRoom(session.roomCode, session.userId);
    }
  }

  function declineReconnect() {
    clearStoredSession();
    setPendingSession(null);
  }

  function assignTeam(targetUserId, team, seat) {
    gameConnection.send("assign_team", { target_user_id: targetUserId, team, seat });
  }
  function setReady(isReady) {
    gameConnection.send("set_ready", { is_ready: isReady });
  }
  function startGame() {
    gameConnection.send("start_game");
  }
  function chooseHokm(suit) {
    gameConnection.send("choose_hokm", { suit });
  }
  function playCard(rank, suit) {
    gameConnection.send("play_card", { rank, suit });
  }
  function startNextRound() {
    gameConnection.send("start_next_round");
  }
  function endGame() {
    gameConnection.send("end_game");
  }

  const value = {
    userId, roomCode, room, gameStarted, roomDissolved, pendingSession,
    hakemSeat, hokmSuit, myHand, currentTurnSeat, tableCards,
    tricksCount, lastTrickWinnerSeat, teamRounds, roundResult, nextDealerSeat, gameOverResult, lastError,
    connectToRoom, assignTeam, setReady, startGame, chooseHokm, playCard, startNextRound, endGame,
    acknowledgeDissolved, confirmReconnect, declineReconnect,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used inside GameProvider");
  return ctx;
}