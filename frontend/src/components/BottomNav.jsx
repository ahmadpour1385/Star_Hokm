const TABS = [
  { key: "shop", icon: "🛒", label: "Shop" },
  { key: "friends", icon: "👥", label: "Friends" },
  { key: "home", icon: "🏠", label: "Home" },
  { key: "clan", icon: "🛡️", label: "Clan" },
  { key: "ranking", icon: "🏅", label: "Ranking" },
];

export default function BottomNav({ activeTab, onSelectTab }) {
  return (
    <nav className="bottom-nav">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          className={`bottom-nav-item ${activeTab === tab.key ? "active" : ""}`}
          onClick={() => onSelectTab(tab.key)}
        >
          <span className="bottom-nav-icon">{tab.icon}</span>
          <span className="bottom-nav-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}