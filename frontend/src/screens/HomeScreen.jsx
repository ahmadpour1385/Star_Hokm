export default function HomeScreen({ onSelectCreate, onSelectJoin }) {
  return (
    <div className="screen home-screen">
      <div className="home-logo">🃏</div>
      <h1 className="home-title">Star Hokm</h1>
      <div className="brand-divider" />
      <p className="home-subtitle">Online 4-player team card game</p>

      <div className="home-buttons">
        <button className="btn btn-primary" onClick={onSelectCreate}>
          ➕ Create Room
        </button>
        <button className="btn btn-secondary" onClick={onSelectJoin}>
          🔑 Join Room
        </button>
      </div>
    </div>
  );
}