import { useState, useEffect } from "react";
import { GameProvider, useGame } from "./context/GameContext";
import WelcomeScreen from "./screens/WelcomeScreen";
import ProfileScreen from "./screens/ProfileScreen";
import CreateRoomScreen from "./screens/CreateRoomScreen";
import JoinRoomScreen from "./screens/JoinRoomScreen";
import LobbyScreen from "./screens/LobbyScreen";
import GameScreen from "./screens/GameScreen";
import "./App.css";

function AppContent() {
  const [screen, setScreen] = useState("welcome");
  const {
    gameStarted, roomDissolved, acknowledgeDissolved,
    pendingSession, confirmReconnect,
  } = useGame();

  useEffect(() => {
    if (pendingSession) {
      (async () => {
        await confirmReconnect();
        setScreen("lobby");
      })();
    }
  }, [pendingSession]);

  useEffect(() => {
    if (gameStarted && (screen === "lobby" || screen === "welcome")) {
      setScreen("game");
    }
  }, [gameStarted, screen]);

  useEffect(() => {
    if (roomDissolved) {
      acknowledgeDissolved();
      setScreen("welcome");
    }
  }, [roomDissolved]);

  if (pendingSession) {
    return (
      <div className="screen">
        <p>Loading...</p>
      </div>
    );
  }

  if (screen === "welcome") {
    return (
      <WelcomeScreen
        onSelectCreate={() => setScreen("create")}
        onSelectJoin={() => setScreen("join")}
        onOpenProfile={() => setScreen("profile")}
      />
    );
  }
  if (screen === "profile") {
    return <ProfileScreen onBack={() => setScreen("welcome")} />;
  }
  if (screen === "create") {
    return <CreateRoomScreen onBack={() => setScreen("welcome")} onRoomJoined={() => setScreen("lobby")} />;
  }
  if (screen === "join") {
    return <JoinRoomScreen onBack={() => setScreen("welcome")} onRoomJoined={() => setScreen("lobby")} />;
  }
  if (screen === "lobby") {
    return <LobbyScreen onGameStarted={() => setScreen("game")} />;
  }
  if (screen === "game") {
    return <GameScreen onBackToHome={() => setScreen("welcome")} />;
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