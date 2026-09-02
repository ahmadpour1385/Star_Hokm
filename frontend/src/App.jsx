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
  const { gameStarted, roomDissolved, acknowledgeDissolved } = useGame();

  useEffect(() => {
    if (gameStarted && screen === "lobby") {
      setScreen("game");
    }
  }, [gameStarted, screen]);

  useEffect(() => {
    if (roomDissolved) {
      acknowledgeDissolved();
      setScreen("home");
    }
  }, [roomDissolved]);

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