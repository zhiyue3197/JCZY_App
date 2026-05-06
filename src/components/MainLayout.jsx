import { Navigate, Outlet } from "react-router-dom";
import { useApp } from "../context/AppContext";
import BottomNav from "./BottomNav";

export default function MainLayout() {
  const { currentUser, authReady } = useApp();

  if (!authReady) {
    return (
      <div className="page-bg">
        <div className="phone-shell">
          <div className="screen-content">
            <div className="card empty-card">
              <p className="copy">正在同步登录状态...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (!currentUser.coupleId) {
    return <Navigate to="/couple" replace />;
  }

  return (
    <div className="page-bg">
      <div className="phone-shell">
        <div className="screen-content">
          <Outlet />
        </div>
        <BottomNav />
      </div>
    </div>
  );
}
