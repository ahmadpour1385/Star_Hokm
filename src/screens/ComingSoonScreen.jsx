import BottomNav from "../components/BottomNav";

const TITLES = {
  shop: { icon: "🛒", label: "Shop" },
  friends: { icon: "👥", label: "Friends" },
  clan: { icon: "🛡️", label: "Clan" },
  ranking: { icon: "🏅", label: "Ranking" },
};

export default function ComingSoonScreen({ tab, onSelectTab }) {
  const info = TITLES[tab] || { icon: "✨", label: "" };

  return (
    <div className="screen coming-soon-screen">
      <div className="casino-pattern" />
      <div className="coming-soon-icon">{info.icon}</div>
      <h2 className="coming-soon-title">{info.label}</h2>
      <div className="brand-divider" />
      <p className="coming-soon-text">This feature will be available soon.</p>

      <BottomNav activeTab={tab} onSelectTab={onSelectTab} />
    </div>
  );
}