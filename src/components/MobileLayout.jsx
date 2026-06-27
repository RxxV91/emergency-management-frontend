import { useLocation } from "react-router-dom";
import BottomNav from "./BottomNav";
import { useEffect } from "react";
import socket from "../services/socket";
import { useToast } from "../context/ToastContext";

// Layout principal utilizat de paginile aplicației mobile
export default function MobileLayout({ children }) {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";
  const { showToast } = useToast();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));

    // Primește notificări în timp real când statusul unui incident este modificat
    const handleStatusUpdate = (data) => {
      if (!user || data.userId !== user._id) return;

      if (data.status === "in_progress") {
        showToast(
          `Incidentul "${data.title}" a fost preluat de un dispecer.`,
          "success",
        );
      }

      if (data.status === "resolved") {
        showToast(
          `Incidentul "${data.title}" a fost marcat ca rezolvat.`,
          "success",
        );
      }
    };

    socket.on("incident:status:update", handleStatusUpdate);

    return () => {
      socket.off("incident:status:update", handleStatusUpdate);
    };
  }, [showToast]);

  return (
    <div style={styles.wrapper}>
      <main style={styles.content}>{children}</main>
      {!isLoginPage && <BottomNav />}
    </div>
  );
}

const styles = {
  wrapper: {
    width: "100%",
    maxWidth: "100%",
    minHeight: "100vh",
    background: "#f4f6f8",
    position: "relative",
    overflowX: "hidden",
  },

  content: {
    minHeight: "calc(100vh - 70px)",
    paddingBottom: "70px",
  },
};
