import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = ({ allowedRoles }) => {
  const token = localStorage.getItem("token");
  const userStr = localStorage.getItem("user");
  let user = null;

  try {
    user = userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error("Failed to parse user from localStorage", error);
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If role doesn't match, maybe redirect to their respective dashboard or login
    if (user.role === 'student') return <Navigate to="/chat" replace />;
    if (user.role === 'teacher') return <Navigate to="/teacher" replace />;
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
