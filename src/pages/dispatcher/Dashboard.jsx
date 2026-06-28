import { useEffect, useState } from "react";
import API from "../../services/api";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import socket from "../../services/socket";
import { useNavigate } from "react-router-dom";

import "leaflet/dist/leaflet.css";

function DashboardMapController({ selectedIncident }) {
  const map = useMap();

  useEffect(() => {
    if (!selectedIncident) return;

    // Dacă incidentul are locație live, harta se centrează pe coordonatele actualizate
    const lat = Number(
      selectedIncident.liveLocation?.latitude || selectedIncident.latitude,
    );

    const lng = Number(
      selectedIncident.liveLocation?.longitude || selectedIncident.longitude,
    );

    map.flyTo([lat, lng], 17, {
      animate: true,
      duration: 0.8,
    });

    setTimeout(() => {
      map.invalidateSize();
    }, 300);
  }, [selectedIncident, map]);

  return null;
}

// Dashboard-ul utilizat de dispeceri pentru monitorizarea incidentelor
export default function Dashboard() {
  const [incidents, setIncidents] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [liveNotification, setLiveNotification] = useState(null);
  const [viewMode, setViewMode] = useState("details");
  const [showResolvedOnMap, setShowResolvedOnMap] = useState(false);

  const navigate = useNavigate();
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  // Calculează statisticile operaționale afișate în dashboard
  const resolvedCount = incidents.filter((i) => i.status === "resolved").length;

  const today = new Date().toDateString();

  const todayCount = incidents.filter(
    (incident) => new Date(incident.createdAt).toDateString() === today,
  ).length;

  const activeSOSCount = incidents.filter(
    (incident) => incident.type === "sos" && incident.status !== "resolved",
  ).length;

  const resolutionRate =
    incidents.length === 0
      ? 0
      : Math.round((resolvedCount / incidents.length) * 100);

  const typeStats = {
    sos: incidents.filter((i) => i.type === "sos").length,
    incendiu: incidents.filter((i) => i.type === "incendiu").length,
    accident: incidents.filter((i) => i.type === "accident").length,
    medical: incidents.filter((i) => i.type === "medical").length,
    agresiune: incidents.filter((i) => i.type === "agresiune").length,
    altele: incidents.filter((i) => i.type === "altele").length,
  };
  const takenIncidents = incidents.filter((incident) => incident.takenAt);

  const resolvedIncidents = incidents.filter((incident) => incident.resolvedAt);

  const averageTakeTime =
    takenIncidents.length === 0
      ? null
      : takenIncidents.reduce(
          (sum, incident) =>
            sum + (new Date(incident.takenAt) - new Date(incident.createdAt)),
          0,
        ) / takenIncidents.length;

  const averageResolveTime =
    resolvedIncidents.length === 0
      ? null
      : resolvedIncidents.reduce(
          (sum, incident) =>
            sum +
            (new Date(incident.resolvedAt) - new Date(incident.createdAt)),
          0,
        ) / resolvedIncidents.length;

  const statusLabel = {
    reported: "Raportat",
    in_progress: "În intervenție",
    resolved: "Rezolvat",
  };

  // variabile pentru a calcula durata de timp
  const formatDuration = (milliseconds) => {
    if (!milliseconds || milliseconds <= 0) return "N/A";

    const minutes = Math.round(milliseconds / 60000);

    if (minutes < 1) return "sub 1 min";
    if (minutes < 60) return `${minutes} min`;

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    return `${hours}h ${remainingMinutes}min`;
  };

  const fetchIncidents = async () => {
    try {
      const { data } = await API.get("/incidents");
      setIncidents(data);
    } catch (error) {
      console.log(error);
    }
  };

  // Filtrează incidentele din listă în funcție de status
  const filteredIncidents =
    statusFilter === "all"
      ? incidents
      : incidents.filter((incident) => incident.status === statusFilter);

  // Controlează afișarea incidentelor rezolvate pe hartă
  const mapIncidents = showResolvedOnMap
    ? filteredIncidents
    : filteredIncidents.filter((incident) => incident.status !== "resolved");

  const updateStatus = async (status) => {
    try {
      await API.put(`/incidents/${selectedIncident._id}/status`, { status });

      await fetchIncidents();

      setSelectedIncident((prev) => ({
        ...prev,
        status,
      }));
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  // Ascultă incidentele noi primite în timp real prin Socket.IO
  useEffect(() => {
    const handleNewIncident = (incident) => {
      console.log("Incident nou primit live:", incident);
      setIncidents((prev) => {
        const exists = prev.some((i) => i._id === incident._id);

        if (exists) return prev;

        return [incident, ...prev];
      });

      setSelectedIncident(incident);

      setLiveNotification(incident);

      setTimeout(() => {
        setLiveNotification(null);
      }, 5000);
    };

    socket.on("incident:new", handleNewIncident);

    return () => {
      socket.off("incident:new", handleNewIncident);
    };
  }, []);

  // Actualizează locația live pentru incidentele SOS
  useEffect(() => {
    const handleLiveLocation = (data) => {
      setIncidents((prev) =>
        prev.map((incident) =>
          incident._id === data.incidentId
            ? {
                ...incident,
                liveLocation: {
                  latitude: data.latitude,
                  longitude: data.longitude,
                  updatedAt: data.updatedAt,
                },
              }
            : incident,
        ),
      );

      setSelectedIncident((prev) =>
        prev?._id === data.incidentId
          ? {
              ...prev,
              liveLocation: {
                latitude: data.latitude,
                longitude: data.longitude,
                updatedAt: data.updatedAt,
              },
            }
          : prev,
      );
    };

    socket.on("sos:location:update", handleLiveLocation);

    return () => {
      socket.off("sos:location:update", handleLiveLocation);
    };
  }, []);

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
      html: `<div style="font-size:30px">${icons[type] || "📍"}</div>`,
      className: "",
      iconSize: [34, 34],
      iconAnchor: [17, 34],
    });
  };

  return (
    <div style={styles.page}>
      {liveNotification && (
        <div style={styles.liveNotification}>
          <strong>Incident nou raportat</strong>

          <span>{liveNotification.title}</span>

          <small>
            {[
              liveNotification.street &&
                `${liveNotification.street}${
                  liveNotification.houseNumber
                    ? ` ${liveNotification.houseNumber}`
                    : ""
                }`,
              liveNotification.city,
            ]
              .filter(Boolean)
              .join(", ") || "Locație în curs de identificare"}
          </small>
        </div>
      )}
      <aside style={styles.sidebar}>
        <h2 style={styles.sidebarTitle}>Dispecer</h2>
        <p style={styles.subtitle}>Panou control incidente</p>
        <button
          style={styles.statsButton}
          onClick={() => {
            setViewMode("stats");
            setSelectedIncident(null);
          }}
        >
          📊 Vezi statistici
        </button>
        <div style={styles.filterBox}>
          <label style={styles.filterLabel}>Filtru status</label>

          <div style={styles.selectWrapper}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={styles.select}
            >
              <option value="all">Toate incidentele active</option>
              <option value="reported">Raportat</option>
              <option value="in_progress">În intervenție</option>
              <option value="resolved">Rezolvat</option>
            </select>

            <span style={styles.selectArrow}>⌄</span>
          </div>
        </div>
        <label style={styles.mapToggle}>
          <input
            type="checkbox"
            checked={showResolvedOnMap}
            onChange={(e) => setShowResolvedOnMap(e.target.checked)}
          />
          Afișează rezolvate pe hartă
        </label>

        <div style={styles.incidentsList}>
          <h3>Incidente recente</h3>

          {filteredIncidents.map((incident) => (
            <div
              key={incident._id}
              style={{
                ...styles.incidentCard,
                border:
                  selectedIncident?._id === incident._id
                    ? "1px solid #60a5fa"
                    : "1px solid rgba(255,255,255,0.06)",
              }}
              onClick={() => {
                setSelectedIncident(incident);
                setViewMode("details");
              }}
            >
              <div style={styles.incidentHeader}>
                <div style={styles.incidentLeft}>
                  <span style={styles.incidentIcon}>
                    {incident.type === "sos"
                      ? "🆘"
                      : incident.type === "incendiu"
                        ? "🔥"
                        : incident.type === "accident"
                          ? "🚗"
                          : incident.type === "altele"
                            ? "⚠️"
                            : incident.type === "medical"
                              ? "🚑"
                              : incident.type === "agresiune"
                                ? "🚨"
                                : "📍"}
                  </span>

                  <strong>{incident.title}</strong>
                </div>

                <span
                  style={{
                    ...styles.statusBadge,
                    background:
                      incident.status === "reported"
                        ? "rgba(239,68,68,0.15)"
                        : incident.status === "in_progress"
                          ? "rgba(245,158,11,0.15)"
                          : "rgba(16,185,129,0.15)",

                    color:
                      incident.status === "reported"
                        ? "#dc2626"
                        : incident.status === "in_progress"
                          ? "#d97706"
                          : "#059669",
                  }}
                >
                  {statusLabel[incident.status] || incident.status}
                </span>
              </div>

              <small style={styles.incidentDate}>
                {new Date(incident.createdAt).toLocaleString("ro-RO")}
              </small>
            </div>
          ))}
        </div>
      </aside>

      <main style={styles.main}>
        <header style={styles.header}>
          <div>
            <h2 style={styles.dashboardTitle}>Dashboard Dispecerat</h2>

            <p style={styles.dashboardSubtitle}>
              Monitorizare și gestionare incidente în timp real
            </p>
          </div>

          <button style={styles.logout} onClick={logout}>
            Deconectare
          </button>
        </header>

        <section style={styles.mapWrapper}>
          <MapContainer
            center={[44.4268, 26.1025]}
            zoom={12}
            style={styles.map}
          >
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <DashboardMapController selectedIncident={selectedIncident} />

            {mapIncidents.map((incident) => (
              <Marker
                key={incident._id}
                position={[
                  incident.liveLocation?.latitude || incident.latitude,
                  incident.liveLocation?.longitude || incident.longitude,
                ]}
                icon={getMarkerIcon(incident.type)}
              >
                <Popup>
                  <strong>{incident.title}</strong>
                  <br />
                  {incident.description}
                  <br />
                  <strong>Status:</strong>{" "}
                  {statusLabel[incident.status] || incident.status}
                  <br />
                  <strong>Adresă:</strong>{" "}
                  {[
                    incident.street &&
                      `${incident.street}${incident.houseNumber ? ` ${incident.houseNumber}` : ""}`,
                    incident.city,
                  ]
                    .filter(Boolean)
                    .join(", ") || "Adresă indisponibilă"}
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </section>

        {viewMode === "stats" && (
          <section style={styles.statsPanel}>
            <div style={styles.statsHeader}>
              <h2 style={styles.detailsTitle}>Statistici incidente</h2>
              <p style={styles.statsSubtitle}>
                Rezumat operațional al incidentelor raportate
              </p>
            </div>

            <div style={styles.statsGrid}>
              <div style={styles.statCard}>
                <span style={styles.statLabel}>Total incidente</span>
                <strong style={styles.statValue}>{incidents.length}</strong>
              </div>

              <div style={styles.statCard}>
                <span style={styles.statLabel}>Rată rezolvare</span>
                <strong style={styles.statValue}>{resolutionRate}%</strong>
              </div>

              <div style={styles.statCard}>
                <span style={styles.statLabel}>Raportate astăzi</span>
                <strong style={styles.statValue}>{todayCount}</strong>
              </div>

              <div style={styles.statCard}>
                <span style={styles.statLabel}>SOS active</span>
                <strong style={styles.statValue}>{activeSOSCount}</strong>
              </div>
              <div style={styles.statCard}>
                <span style={styles.statLabel}>Timp mediu preluare</span>
                <strong style={styles.statValue}>
                  {formatDuration(averageTakeTime)}
                </strong>
              </div>

              <div style={styles.statCard}>
                <span style={styles.statLabel}>Timp mediu rezolvare</span>
                <strong style={styles.statValue}>
                  {formatDuration(averageResolveTime)}
                </strong>
              </div>
            </div>

            <div style={styles.typeStats}>
              <h3 style={styles.typeStatsTitle}>Incidente pe tip</h3>

              <div style={styles.typeStatRow}>
                <span>🆘 SOS</span>
                <strong>{typeStats.sos}</strong>
              </div>

              <div style={styles.typeStatRow}>
                <span>🔥 Incendii</span>
                <strong>{typeStats.incendiu}</strong>
              </div>

              <div style={styles.typeStatRow}>
                <span>🚗 Accidente</span>
                <strong>{typeStats.accident}</strong>
              </div>

              <div style={styles.typeStatRow}>
                <span>🚑 Medicale</span>
                <strong>{typeStats.medical}</strong>
              </div>

              <div style={styles.typeStatRow}>
                <span>🚨 Agresiuni</span>
                <strong>{typeStats.agresiune}</strong>
              </div>
              <div style={styles.typeStatRow}>
                <span>⚠️ Altele</span>
                <strong>{typeStats.altele}</strong>
              </div>
            </div>
          </section>
        )}

        {viewMode === "details" && selectedIncident && (
          <section style={styles.detailsPanel}>
            <div style={styles.detailsLeft}>
              <div style={styles.detailsHeader}>
                <div style={styles.incidentLeft}>
                  <span style={styles.incidentIcon}>
                    {selectedIncident.type === "sos"
                      ? "🆘"
                      : selectedIncident.type === "incendiu"
                        ? "🔥"
                        : selectedIncident.type === "accident"
                          ? "🚗"
                          : selectedIncident.type === "medical"
                            ? "🚑"
                            : selectedIncident.type === "agresiune"
                              ? "🚨"
                              : selectedIncident.type === "altele"
                                ? "⚠️"
                                : "📍"}
                  </span>

                  <h2 style={styles.detailsTitle}>{selectedIncident.title}</h2>
                </div>

                <span
                  style={{
                    ...styles.statusPill,
                    background:
                      selectedIncident.status === "reported"
                        ? "rgba(245,158,11,0.15)"
                        : selectedIncident.status === "in_progress"
                          ? "rgba(59,130,246,0.15)"
                          : "rgba(16,185,129,0.15)",
                    color:
                      selectedIncident.status === "reported"
                        ? "#d97706"
                        : selectedIncident.status === "in_progress"
                          ? "#2563eb"
                          : "#059669",
                  }}
                >
                  {statusLabel[selectedIncident.status] ||
                    selectedIncident.status}
                </span>

                <div style={styles.statusActions}>
                  {selectedIncident.status === "reported" && (
                    <button
                      style={styles.actionButton}
                      onClick={() => updateStatus("in_progress")}
                    >
                      🚓 Preia intervenția
                    </button>
                  )}

                  {selectedIncident.status === "in_progress" && (
                    <button
                      style={styles.actionButton}
                      onClick={() => updateStatus("resolved")}
                    >
                      ✅ Marchează ca rezolvat
                    </button>
                  )}

                  {selectedIncident.status === "resolved" && (
                    <div style={styles.resolvedText}>Incident rezolvat</div>
                  )}
                </div>
              </div>

              <div style={styles.detailsSection}>
                <div style={styles.label}>Descriere</div>
                <div style={styles.value}>
                  {selectedIncident.description || "Fără descriere"}
                </div>
              </div>

              <div style={styles.detailsSection}>
                <div style={styles.label}>Adresă</div>
                <div style={styles.value}>
                  {[
                    selectedIncident.street &&
                      `${selectedIncident.street}${
                        selectedIncident.houseNumber
                          ? ` ${selectedIncident.houseNumber}`
                          : ""
                      }`,
                    selectedIncident.city,
                  ]
                    .filter(Boolean)
                    .join(", ") || "Adresă indisponibilă"}
                </div>
              </div>
            </div>

            <div style={styles.actionColumn}>
              <div style={styles.detailsSection}>
                <div style={styles.label}>Data raportării</div>
                <div style={styles.value}>
                  {new Date(selectedIncident.createdAt).toLocaleString("ro-RO")}
                </div>
              </div>
              <div style={styles.coordinateBox}>
                <div style={styles.label}>Longitudine</div>
                <div style={styles.value}>
                  {Number(selectedIncident.longitude).toFixed(4)}
                </div>
              </div>

              <div style={styles.coordinateBox}>
                <div style={styles.label}>Latitudine</div>
                <div style={styles.value}>
                  {Number(selectedIncident.latitude).toFixed(4)}
                </div>
              </div>
            </div>

            <div style={styles.detailsRight}>
              {selectedIncident.image && (
                <img
                  src={`${import.meta.env.VITE_API_URL}${selectedIncident.image}`}
                  alt="Incident"
                  style={styles.incidentImage}
                  onClick={() =>
                    window.open(
                      `${import.meta.env.VITE_API_URL}${selectedIncident.image}`,
                      "_blank",
                    )
                  }
                />
              )}
              {selectedIncident.liveLocation && (
                <div style={styles.coordinateBox}>
                  <div style={styles.label}>Locație live</div>
                  <div style={styles.value}>
                    {Number(selectedIncident.liveLocation.latitude).toFixed(4)},{" "}
                    {Number(selectedIncident.liveLocation.longitude).toFixed(4)}
                  </div>
                </div>
              )}
            </div>

            {selectedIncident.emergencyProfile && (
              <div style={styles.emergencyBox}>
                <div>
                  <strong>Date SOS</strong>
                  <p>
                    {selectedIncident.emergencyProfile.firstName}{" "}
                    {selectedIncident.emergencyProfile.lastName}
                  </p>
                </div>

                <div>
                  <strong>Vârstă</strong>
                  <p>{selectedIncident.emergencyProfile.age}</p>
                </div>

                <div>
                  <strong>Telefon</strong>
                  <p>{selectedIncident.emergencyProfile.phone}</p>
                </div>

                <div>
                  <strong>Grupă sanguină</strong>
                  <p>{selectedIncident.emergencyProfile.bloodType}</p>
                </div>
                <div>
                  <strong>Afecțiuni</strong>
                  <p>
                    {selectedIncident.emergencyProfile.medicalConditions ||
                      "Nespecificat"}
                  </p>
                </div>
                <div>
                  <strong>Contact urgență</strong>
                  <p>
                    {selectedIncident.emergencyProfile.emergencyContactName} -{" "}
                    {selectedIncident.emergencyProfile.emergencyContactPhone}
                  </p>
                </div>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

const styles = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "4px",
  },

  dashboardTitle: {
    margin: 0,
    color: "#111827",
    fontSize: "18px",
    fontWeight: "700",
    lineHeight: 1.1,
  },

  dashboardSubtitle: {
    margin: "2px 0 0",
    color: "#6b7280",
    fontSize: "12px",
  },

  logout: {
    padding: "6px 12px",
    borderRadius: "8px",
    border: "none",
    background: "#d90429",
    color: "white",
    fontWeight: "600",
    fontSize: "12px",
    cursor: "pointer",
  },

  page: {
    position: "fixed",
    inset: 0,
    display: "grid",
    gridTemplateColumns: "350px 1fr",
    background: "#f4f6f8",
  },
  sidebar: {
    background: "#111827",
    color: "white",
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    boxSizing: "border-box",
    overflow: "hidden",
  },
  sidebarTitle: {
    color: "#ffffff",
    margin: 0,
    fontSize: "24px",
    fontWeight: "700",
  },
  subtitle: {
    color: "#9ca3af",
  },

  filterBox: {
    marginTop: "24px",
  },
  selectWrapper: {
    position: "relative",
  },

  selectArrow: {
    position: "absolute",
    right: "18px",
    top: "50%",
    transform: "translateY(-60%)",
    color: "#d1d5db",
    fontSize: "18px",
    lineHeight: 1,
    pointerEvents: "none",
  },

  filterLabel: {
    display: "block",
    fontSize: "12px",
    color: "#9ca3af",
    marginBottom: "8px",
    fontWeight: "700",
    textTransform: "uppercase",
  },

  select: {
    width: "100%",
    padding: "12px 50px 12px 16px",
    borderRadius: "12px",
    border: "1px solid #374151",
    background: "#1f2937",
    color: "white",
    fontWeight: "600",
    outline: "none",
    cursor: "pointer",
    appearance: "none",
    WebkitAppearance: "none",
    MozAppearance: "none",
  },

  main: {
    padding: "18px",
    display: "flex",
    flexDirection: "column",
    overflow: "auto",
  },

  mapWrapper: {
    height: "42vh",
    minHeight: "300px",
    marginTop: "8px",
    borderRadius: "18px",
    overflow: "hidden",
    background: "white",
    boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
  },

  map: {
    width: "100%",
    height: "100%",
  },
  incidentsList: {
    marginTop: "20px",
    overflowY: "auto",
    flex: 1,
    minHeight: 0,
    paddingRight: "6px",
    scrollbarWidth: "thin",
    scrollbarColor: "#374151 transparent",
  },

  incidentCard: {
    background: "#1f2937",
    padding: "14px",
    borderRadius: "14px",
    marginBottom: "10px",
    cursor: "pointer",
    display: "grid",
    gap: "8px",
    border: "1px solid rgba(255,255,255,0.06)",
  },

  incidentDate: {
    color: "#9ca3af",
    fontSize: "12px",
    marginTop: "4px",
  },

  statusBadge: {
    padding: "4px 8px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: "700",
    width: "fit-content",
    textTransform: "uppercase",
  },
  incidentHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  incidentLeft: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },

  incidentIcon: {
    fontSize: "20px",
  },
  detailsPanel: {
    background: "#ffffff",
    marginTop: "12px",
    borderRadius: "18px",
    padding: "16px",
    boxShadow: "0 8px 22px rgba(0,0,0,0.07)",
    display: "grid",
    gridTemplateColumns: "1.8fr 1fr 1fr",
    gap: "16px",
    alignItems: "end",
  },
  detailsHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },

  detailsLeft: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  detailsRight: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    alignItems: "flex-start",
  },

  detailsSection: {
    background: "#f9fafb",
    borderRadius: "10px",
    padding: "8px 10px",
  },

  detailsTitle: {
    margin: 0,
    fontSize: "18px",
    fontWeight: "700",
  },

  actionColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    alignItems: "flex-start",
    paddingTop: "10px",
  },

  coordinateBox: {
    background: "#f9fafb",
    borderRadius: "10px",
    padding: "8px 10px",
  },

  incidentImage: {
    width: "220px",
    height: "120px",
    objectFit: "cover",
    borderRadius: "10px",
    cursor: "pointer",
    border: "1px solid #e5e7eb",
  },

  label: {
    fontSize: "11px",
    color: "#6b7280",
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: "3px",
  },

  value: {
    color: "#111827",
    fontWeight: "600",
    fontSize: "14px",
    lineHeight: "1.35",
    wordBreak: "break-word",
  },

  statusPill: {
    padding: "4px 10px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: "800",
    textTransform: "uppercase",
  },

  statusActions: {
    display: "flex",
    gap: "10px",
  },

  emergencyBox: {
    gridColumn: "1 / -1",
    background: "#fff7ed",
    border: "1px solid #fed7aa",
    color: "#7c2d12",
    borderRadius: "12px",
    padding: "10px 12px",
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    gap: "8px",
    fontSize: "13px",
  },

  actionButton: {
    padding: "10px 14px",
    borderRadius: "10px",
    border: "none",
    background: "#0f172a",
    color: "white",
    fontWeight: "600",
    fontSize: "13px",
    cursor: "pointer",
  },

  resolvedText: {
    color: "#059669",
    fontWeight: "700",
    fontSize: "14px",
  },
  liveNotification: {
    position: "fixed",
    top: "20px",
    right: "24px",
    background: "#ffffff",
    color: "#111827",
    padding: "14px 18px",
    borderRadius: "16px",
    boxShadow: "0 12px 32px rgba(0,0,0,0.18)",
    zIndex: 99999,
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    borderLeft: "5px solid #d90429",
    minWidth: "260px",
  },
  statsButton: {
    marginTop: "24px",
    padding: "12px",
    borderRadius: "12px",
    border: "none",
    background: "#2563eb",
    color: "white",
    fontWeight: "700",
    cursor: "pointer",
  },

  statsPanel: {
    background: "#ffffff",
    marginTop: "12px",
    borderRadius: "18px",
    padding: "18px",
    boxShadow: "0 8px 22px rgba(0,0,0,0.07)",
  },

  statsHeader: {
    marginBottom: "16px",
  },

  statsSubtitle: {
    color: "#6b7280",
    fontSize: "14px",
    marginTop: "4px",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "12px",
  },

  statCard: {
    background: "#f9fafb",
    borderRadius: "14px",
    padding: "14px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  statLabel: {
    color: "#6b7280",
    fontSize: "12px",
    fontWeight: "700",
    textTransform: "uppercase",
  },

  statValue: {
    color: "#111827",
    fontSize: "26px",
  },

  typeStats: {
    marginTop: "16px",
    background: "#f9fafb",
    borderRadius: "14px",
    padding: "14px",
  },

  typeStatsTitle: {
    margin: "0 0 12px",
    color: "#111827",
  },

  typeStatRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "8px 0",
    borderBottom: "1px solid #e5e7eb",
    color: "#111827",
  },
  mapToggle: {
    marginTop: "12px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#d1d5db",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },
};
