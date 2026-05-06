import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useApp } from "../context/AppContext";

export default function AuthLayout() {
  const { currentUser, authReady } = useApp();
  const location = useLocation();

  if (!authReady) {
    return (
      <div className="page-bg">
        <div className="phone-shell">
          <div className="auth-content">
            <div className="card empty-card">
              <p className="copy">正在同步登录状态...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser && location.pathname === "/couple") {
    return <Navigate to="/login" replace />;
  }

  if (currentUser && location.pathname !== "/couple") {
    return <Navigate to={currentUser.coupleId ? "/home" : "/couple"} replace />;
  }

  if (currentUser?.coupleId && location.pathname === "/couple") {
    return <Navigate to="/home" replace />;
  }

  return (
    <div className="page-bg">
      <div className="phone-shell">
        <div className="auth-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
