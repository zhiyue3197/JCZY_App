import { NavLink } from "react-router-dom";
import { useApp } from "../context/AppContext";

const items = [
  { to: "/home", labelKey: "home", icon: "M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-8.5Z" },
  { to: "/diary", labelKey: "diary", icon: "M5 4h14v16H5zM8 8h8M8 12h8M8 16h5" },
  { to: "/album", labelKey: "album", icon: "M4 6h16v12H4zM7 15l3-3 2 2 3-4 3 5" },
  { to: "/me", labelKey: "me", icon: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21a8 8 0 0 1 16 0" },
];

function NavIcon({ path }) {
  return (
    <svg aria-hidden="true" className="nav-icon" viewBox="0 0 24 24">
      <path d={path} />
    </svg>
  );
}

export default function BottomNav() {
  const { t } = useApp();

  return (
    <nav className="bottom-nav">
      {items.map((item) => (
        <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-button ${isActive ? "active" : ""}`}>
          <NavIcon path={item.icon} />
          <span>{t(item.labelKey)}</span>
        </NavLink>
      ))}
    </nav>
  );
}
