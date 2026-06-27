import { useEffect, useState } from "react";
import { useIncident } from "../context/IncidentContext";
import { useToast } from "../context/ToastContext";
import { useSearchParams } from "react-router-dom";
import L from "leaflet";
import API from "../services/api";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  useMap,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";

const statusLabel = {
  reported: "Raportat",
  in_progress: "În intervenție",
  resolved: "Rezolvat",
};

// Pagina care afișează incidentele pe hartă și permite selectarea locației pentru raportare
export default function MapPage() {
  const [incidents, setIncidents] = useState([]);
  const [userLocation, setUserLocation] = useState([44.4268, 26.1025]);
  const { draftIncident, setDraftIncident } = useIncident();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const selectedIncidentId = searchParams.get("incident");
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [manualLocationMode, setManualLocationMode] = useState(false);
  const [countdown, setCountdown] = useState(15);

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const { data } = await API.get("/incidents");
        setIncidents(data);
      } catch (error) {
        console.log(error);
        showToast("Nu s-au putut încărca incidentele.", "error");
      }
    };

    fetchIncidents();

    if (!navigator.geolocation) {
      showToast("Geolocația nu este suportată de acest browser.", "error");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation([position.coords.latitude, position.coords.longitude]);
      },
      (error) => {
        console.log(error);
      },
      {
        enableHighAccuracy: true,
      },
    );
  }, []);

  useEffect(() => {
    if (!draftIncident) return;

    setShowLocationModal(true);
    setCountdown(15);

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);

          submitIncident(userLocation[0], userLocation[1]);

          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [draftIncident]);

  const submitIncident = async (latitude, longitude) => {
    if (!draftIncident) return;

    try {
      const formData = new FormData();

      formData.append("title", draftIncident.title);
      formData.append("type", draftIncident.type);
      formData.append(
        "description",
        draftIncident.description || `Raportare: ${draftIncident.title}`,
      );

      formData.append("latitude", latitude);
      formData.append("longitude", longitude);

      if (draftIncident.file) {
        formData.append("image", draftIncident.file);
      }

      const { data } = await API.post("/incidents", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setIncidents((prev) => [data, ...prev]);
      showToast(`${draftIncident.title} raportat`);

      setDraftIncident(null);
      setShowLocationModal(false);
      setManualLocationMode(false);
    } catch (error) {
      console.log(error);
      showToast("Eroare la raportare", "error");
    }
  };

  // Permite raportarea incidentului prin selectarea unei poziții pe hartă
  function MapClickHandler() {
    useMapEvents({
      click: async (e) => {
        if (!draftIncident || !manualLocationMode) return;

        await submitIncident(e.latlng.lat, e.latlng.lng);
      },
    });

    return null;
  }

  // Alege iconița markerului în funcție de tipul incidentului
  const getMarkerIcon = (type) => {
    const icons = {
      sos: "🆘",
      incendiu: "🔥",
      accident: "🚗",
      medical: "🚑",
      agresiune: "🚨",
      altele: "⚠️",
    };

    return L.divIcon({
      html: `<div style="font-size:28px">${icons[type] || "📍"}</div>`,
      className: "",
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });
  };

  // Centrează harta pe locația utilizatorului sau pe incidentul selectat
  function RecenterMap() {
    const map = useMap();

    useEffect(() => {
      if (selectedIncidentId && incidents.length > 0) {
        const selectedIncident = incidents.find(
          (incident) => incident._id === selectedIncidentId,
        );

        if (selectedIncident) {
          map.setView(
            [selectedIncident.latitude, selectedIncident.longitude],
            17,
          );
          return;
        }
      }

      map.setView(userLocation, 15);
    }, [userLocation, incidents, selectedIncidentId, map]);

    return null;
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Hartă incidente</h1>
      {showLocationModal && draftIncident && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>Locația incidentului</h3>

            <p style={styles.modalText}>
              Dorești să adaugi o locație diferită?
            </p>

            <p style={styles.timerText}>
              Dacă nu alegi nimic, se va folosi automat locația dispozitivului
              în <strong>{countdown}</strong> secunde.
            </p>

            <div style={styles.modalActions}>
              <button
                style={styles.secondaryButton}
                onClick={() => submitIncident(userLocation[0], userLocation[1])}
              >
                Nu
              </button>

              <button
                style={styles.primaryButton}
                onClick={() => {
                  setShowLocationModal(false);
                  setManualLocationMode(true);
                  showToast("Selectează locația incidentului pe hartă.");
                }}
              >
                Da
              </button>
            </div>
          </div>
        </div>
      )}

      <MapContainer center={userLocation} zoom={15} style={styles.map}>
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <RecenterMap />
        <MapClickHandler />

        {incidents
          .filter((incident) => incident.status !== "resolved")
          .map((incident) => (
            <Marker
              key={incident._id}
              position={[incident.latitude, incident.longitude]}
              icon={getMarkerIcon(incident.type)}
            >
              <Popup>
                <div style={styles.popup}>
                  <div style={styles.popupHeader}>
                    <span style={styles.popupIcon}>
                      {incident.type === "sos"
                        ? "🆘"
                        : incident.type === "incendiu"
                          ? "🔥"
                          : incident.type === "accident"
                            ? "🚗"
                            : incident.type === "medical"
                              ? "🚑"
                              : incident.type === "agresiune"
                                ? "🚨"
                                : "📍"}
                    </span>

                    <div>
                      <strong>{incident.title}</strong>
                      <p style={styles.popupType}>{incident.type}</p>
                    </div>
                  </div>

                  {incident.image && (
                    <img
                      src={`${import.meta.env.VITE_API_URL}${incident.image}`}
                      alt="Incident"
                      style={styles.popupImage}
                    />
                  )}

                  <p>{incident.description}</p>

                  <p>
                    <strong>Status:</strong>{" "}
                    {statusLabel[incident.status] || incident.status}
                  </p>

                  <p style={styles.popupDate}>
                    {new Date(incident.createdAt).toLocaleString("ro-RO")}
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}
      </MapContainer>
    </div>
  );
}

const styles = {
  container: {
    height: "calc(100vh - 70px)",
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
    padding: "12px",
  },

  title: {
    fontSize: "32px",
    margin: "8px 0 12px 0",
  },

  map: {
    flex: 1,
    width: "100%",
    borderRadius: "18px",
    overflow: "hidden",
  },
  popup: {
    width: "220px",
  },

  popupHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "8px",
  },

  popupIcon: {
    fontSize: "30px",
  },

  popupType: {
    margin: 0,
    color: "#6b7280",
    textTransform: "capitalize",
  },

  popupImage: {
    width: "100%",
    height: "120px",
    objectFit: "cover",
    borderRadius: "10px",
    marginBottom: "8px",
  },

  popupDate: {
    fontSize: "12px",
    color: "#6b7280",
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 3000,
  },

  modal: {
    width: "90%",
    maxWidth: "360px",
    background: "#ffffff",
    borderRadius: "20px",
    padding: "22px",
    boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
    textAlign: "center",
  },

  modalTitle: {
    margin: "0 0 10px",
    color: "#111827",
  },

  modalText: {
    color: "#374151",
    fontWeight: "600",
  },

  timerText: {
    color: "#6b7280",
    fontSize: "14px",
    lineHeight: "1.4",
  },

  modalActions: {
    display: "flex",
    gap: "12px",
    marginTop: "18px",
  },

  primaryButton: {
    flex: 1,
    padding: "12px",
    borderRadius: "12px",
    border: "none",
    background: "#023047",
    color: "white",
    fontWeight: "700",
    cursor: "pointer",
  },

  secondaryButton: {
    flex: 1,
    padding: "12px",
    borderRadius: "12px",
    border: "1px solid #d1d5db",
    background: "#ffffff",
    color: "#111827",
    fontWeight: "700",
    cursor: "pointer",
  },
};
