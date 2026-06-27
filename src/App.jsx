import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import MobileLayout from "./components/MobileLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleRoute from "./components/RoleRoute";

import Home from "./pages/Home";
import ReportIncident from "./pages/ReportIncident";
import MapPage from "./pages/MapPage";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/dispatcher/Dashboard";

import { IncidentProvider } from "./context/IncidentContext";
import { ToastProvider } from "./context/ToastContext";

function App() {
  return (
    <ToastProvider>
      <IncidentProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/verify-email" element={<VerifyEmail />} />

            <Route
              path="/dispatcher/dashboard"
              element={
                <ProtectedRoute>
                  <RoleRoute allowedRoles={["dispatcher", "admin"]}>
                    <Dashboard />
                  </RoleRoute>
                </ProtectedRoute>
              }
            />

            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <RoleRoute allowedRoles={["user"]}>
                    <MobileLayout>
                      <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/report" element={<ReportIncident />} />
                        <Route path="/map" element={<MapPage />} />
                        <Route path="/profile" element={<Profile />} />
                      </Routes>
                    </MobileLayout>
                  </RoleRoute>
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </IncidentProvider>
    </ToastProvider>
  );
}

export default App;
