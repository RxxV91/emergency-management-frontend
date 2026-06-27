import { Navigate } from "react-router-dom";

export default function RoleRoute({ children, allowedRoles }) {
  const user = JSON.parse(localStorage.getItem("user"));

  // Dacă utilizatorul nu este autentificat, este redirecționat către login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Verifică dacă utilizatorul are rolul necesar pentru accesarea rutei
  if (!allowedRoles.includes(user.role)) {
    // Dispecerii și administratorii sunt redirecționați către dashboard
    if (user.role === "dispatcher" || user.role === "admin") {
      return <Navigate to="/dispatcher/dashboard" replace />;
    }

    // Utilizatorii obișnuiți sunt redirecționați către pagina principală
    return <Navigate to="/" replace />;
  }

  // Permite accesul la conținutul protejat
  return children;
}
