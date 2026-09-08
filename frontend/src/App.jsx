import { useState, useEffect } from "react";
import { GameProvider, useGame } from "./context/GameContext";
import HomeScreen from "./screens/HomeScreen";
import CreateRoomScreen from "./screens/CreateRoomScreen";
import JoinRoomScreen from "./screens/JoinRoomScreen";
import LobbyScreen from "./screens/LobbyScreen";
import GameScreen from "./screens/GameScreen";
import "./App.css";

function AppContent() {
  const [screen, setScreen] = useState("home");
  const {
    gameStarted, roomDissolved, acknowledgeDissolved,
    pendingSession, confirmReconnect,
  } = useGame();

  // اتصال خودکار و بی‌صدا به آخرین اتاق، بدون هیچ سوالی از کاربر
  useEffect(() => {
    if (pendingSession) {
      (async () => {
        await confirmReconnect();
        setScreen("lobby");
      })();
    }
  }, [pendingSession]);

  useEffect(() => {
    if (gameStarted && (screen === "lobby" || screen === "home")) {
      setScreen("game");
    }
  }, [gameStarted, screen]);

  useEffect(() => {
    if (roomDissolved) {
      acknowledgeDissolved();
      setScreen("home");
    }
  }, [roomDissolved]);

  if (pendingSession) {
    return (
      <div className="screen">
        <p>Loading...</p>
      </div>
    );
  }

  if (screen === "home") {
    return <HomeScreen onSelectCreate={() => setScreen("create")} onSelectJoin={() => setScreen("join")} />;
  }
  if (screen === "create") {
    return <CreateRoomScreen onBack={() => setScreen("home")} onRoomJoined={() => setScreen("lobby")} />;
  }
  if (screen === "join") {
    return <JoinRoomScreen onBack={() => setScreen("home")} onRoomJoined={() => setScreen("lobby")} />;
  }
  if (screen === "lobby") {
    return <LobbyScreen onGameStarted={() => setScreen("game")} />;
  }
  if (screen === "game") {
    return <GameScreen onBackToHome={() => setScreen("home")} />;
  }
  return null;
}

function App() {
  return (
    <GameProvider>
      <AppContent />
    </GameProvider>
  );
}

export default App;