import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

// Pagina principală care afișează istoricul incidentelor utilizatorului
export default function Home() {
  const [incidents, setIncidents] = useState([]);
  const navigate = useNavigate();

  // Încarcă incidentele utilizatorului la deschiderea paginii
  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const { data } = await API.get("/incidents");
        setIncidents(
          data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
        );
      } catch (error) {
        console.log(error);
      }
    };

    fetchIncidents();
  }, []);

  const statusLabel = {
    reported: "Raportat",
    in_progress: "În intervenție",
    resolved: "Rezolvat",
  };

  const statusColor = {
    reported: "#f59e0b",
    in_progress: "#3b82f6",
    resolved: "#10b981",
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Activitate</h1>

      {incidents.length === 0 ? (
        <div style={styles.empty}>
          <h3>Nicio activitate</h3>
          <p>Nu există raportări în acest moment.</p>
        </div>
      ) : (
        incidents.map((incident) => (
          <div
            key={incident._id}
            style={styles.card}
            onClick={() => navigate(`/map?incident=${incident._id}`)}
          >
            <div style={styles.header}>
              <strong>{incident.title}</strong>

              <span
                style={{
                  ...styles.status,
                  background: statusColor[incident.status] || "#6b7280",
                }}
              >
                {statusLabel[incident.status] || incident.status}
              </span>
            </div>

            <p>{incident.description}</p>

            <small>
              {new Date(incident.createdAt).toLocaleString("ro-RO")}
            </small>
          </div>
        ))
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: "20px",
    color: "#111827",
  },

  title: {
    marginBottom: "20px",
  },

  empty: {
    background: "white",
    borderRadius: "20px",
    padding: "40px 20px",
    textAlign: "center",
    color: "#6b7280",
    boxShadow: "0 6px 16px rgba(0,0,0,0.08)",
  },

  card: {
    background: "white",
    padding: "16px",
    borderRadius: "18px",
    marginBottom: "14px",
    boxShadow: "0 6px 16px rgba(0,0,0,0.08)",
    cursor: "pointer",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  status: {
    color: "white",
    padding: "4px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "bold",
  },
};
