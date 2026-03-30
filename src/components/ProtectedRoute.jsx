import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({
  children,
  allowedRoles = [],
  featureEnabled = true,
}) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  if (
    (user.forcePasswordReset || user.force_password_reset) &&
    location.pathname !== "/settings"
  ) {
    return <Navigate to="/settings" replace />;
  }

  if (!featureEnabled) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
