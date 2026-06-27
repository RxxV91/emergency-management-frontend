import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { useToast } from "../context/ToastContext";

export default function BottomNav() {
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Verifică dacă profilul medical obligatoriu este completat
  const isProfileComplete = () => {
    const user = JSON.parse(localStorage.getItem("user"));

    return user?.firstName && user?.lastName && user?.birthDate && user?.phone;
  };

  // Blochează accesul la funcționalități până la completarea profilului medical
  const handleNavigation = (path) => {
    if (path !== "/profile" && !isProfileComplete()) {
      showToast(
        "Completează profilul medical înainte de a utiliza aplicația.",
        "error",
      );
      return;
    }

    navigate(path);
  };

  const reportSOS = () => {
    if (!isProfileComplete()) {
      showToast(
        "Completează profilul medical înainte de a trimite o alertă SOS.",
        "error",
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { data } = await API.post("/incidents", {
            title: "SOS",
            type: "sos",
            description: "Alertă SOS trimisă rapid",
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });

          const watchId = navigator.geolocation.watchPosition(
            async (livePosition) => {
              await API.put(`/incidents/${data._id}/live-location`, {
                latitude: livePosition.coords.latitude,
                longitude: livePosition.coords.longitude,
              });
            },
            (error) => {
              console.log(error);
            },
            {
              enableHighAccuracy: true,
              maximumAge: 0,
              timeout: 10000,
            },
          );

          localStorage.setItem("sosWatchId", watchId);

          showToast("SOS trimis. Locația live este activă.");
        } catch (error) {
          console.log(error);
          showToast(
            error.response?.data?.message || "Eroare la trimiterea SOS",
            "error",
          );
        }
      },
      () => {
        showToast("Locația nu poate fi accesată", "error");
      },
      { enableHighAccuracy: true },
    );
  };

  return (
    <nav style={styles.nav}>
      <button
        style={styles.linkButton}
        onClick={() => handleNavigation("/report")}
      >
        Raportează
      </button>

      <button
        style={styles.linkButton}
        onClick={() => handleNavigation("/map")}
      >
        Hartă
      </button>

      <button style={styles.sosButton} onClick={reportSOS}>
        SOS
      </button>

      <button
        style={styles.linkButton}
        onClick={() => handleNavigation("/profile")}
      >
        Profil
      </button>

      <button style={styles.linkButton} onClick={() => handleNavigation("/")}>
        Activitate
      </button>
    </nav>
  );
}

const styles = {
  nav: {
    position: "fixed",
    bottom: 0,
    left: 0,
    width: "100%",
    height: "74px",
    background: "#ffffff",
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1.2fr 1fr 1fr",
    alignItems: "center",
    borderTop: "1px solid #ddd",
    zIndex: 1000,
    padding: "0 4px",
    boxSizing: "border-box",
  },

  linkButton: {
    border: "none",
    background: "transparent",
    color: "#374151",
    fontSize: "11px",
    fontWeight: "600",
    textAlign: "center",
    cursor: "pointer",
  },

  sosButton: {
    width: "62px",
    height: "62px",
    borderRadius: "50%",
    border: "4px solid white",
    background: "#d90429",
    color: "white",
    fontSize: "16px",
    fontWeight: "bold",
    justifySelf: "center",
    marginTop: "-26px",
    boxShadow: "0 8px 22px rgba(217,4,41,0.35)",
  },
};
