import { Navigate } from "react-router-dom";

// Protejează rutele care necesită autentificare
export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
