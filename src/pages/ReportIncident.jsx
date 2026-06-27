import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useIncident } from "../context/IncidentContext";
import { useToast } from "../context/ToastContext";

// Pagina pentru raportarea unui incident obișnuit
export default function ReportIncident() {
  const navigate = useNavigate();
  const { setDraftIncident } = useIncident();

  const [selectedType, setSelectedType] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);

  const { showToast } = useToast();

  // Salvează temporar incidentul și continuă către hartă pentru alegerea locației
  const continueToMap = () => {
    if (!selectedType) {
      showToast("Selectează tipul incidentului", "error");
      return;
    }

    // Incidentul este păstrat temporar în context până la confirmarea locației
    setDraftIncident({
      title: selectedType,
      type: selectedType.toLowerCase(),
      description,
      file,
    });

    navigate("/map");
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Raportare rapidă</h2>

      <h3 style={styles.subtitle}>Alege tipul incidentului</h3>

      <div style={styles.grid}>
        {[
          ["Incendiu", "🔥", "#ef4444"],
          ["Accident", "🚗", "#3b82f6"],
          ["Medical", "🚑", "#10b981"],
          ["Agresiune", "🚨", "#f59e0b"],
          ["Altele", "⚠️", "#6b7280"],
        ].map(([type, icon, color]) => (
          <button
            key={type}
            style={{
              ...styles.card,
              ...(type === "Altele" ? styles.fullWidthCard : {}),
              border: selectedType === type ? `2px solid ${color}` : "none",
            }}
            onClick={() => setSelectedType(type)}
          >
            <span style={styles.icon}>{icon}</span>
            <span>{type}</span>
          </button>
        ))}
      </div>

      <textarea
        placeholder="Descrie incidentul..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        style={styles.textarea}
      />

      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files[0])}
        style={styles.file}
      />

      <button style={styles.submitButton} onClick={continueToMap}>
        Continuă către hartă
      </button>
    </div>
  );
}

const styles = {
  container: {
    padding: "20px",
    color: "#111827",
  },
  title: {
    textAlign: "center",
    marginBottom: "18px",
    color: "#111827",
    fontSize: "28px",
  },
  subtitle: {
    color: "#6b7280",
    textAlign: "center",
    marginBottom: "12px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
  },
  card: {
    border: "none",
    borderRadius: "18px",
    padding: "14px",
    background: "#ffffff",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#111827",
    boxShadow: "0px 4px 12px rgba(0,0,0,0.08)",
    minHeight: "70px",
  },

  fullWidthCard: {
    gridColumn: "1 / span 2",
  },
  icon: {
    fontSize: "20px",
  },
  textarea: {
    width: "100%",
    height: "80px",
    marginTop: "16px",
    borderRadius: "12px",
    padding: "12px",
    boxSizing: "border-box",
    background: "#ffffff",
    color: "#111827",
    border: "1px solid #d1d5db",
  },
  file: {
    marginTop: "16px",
  },
  submitButton: {
    width: "100%",
    marginTop: "20px",
    padding: "16px",
    borderRadius: "14px",
    border: "none",
    background: "#023047",
    color: "white",
    fontWeight: "bold",
  },
};
