import { useState } from "react";
import API from "../services/api";
import { useNavigate, useLocation } from "react-router-dom";

// Pagina utilizată pentru confirmarea adresei de email
export default function VerifyEmail() {
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  // Emailul primit din pagina de înregistrare
  const email = location.state?.email || "";

  // Protecție pentru acces direct la pagină
  if (!email) {
    return (
      <div style={styles.container}>
        <div style={styles.form}>
          <h2>Confirmare email</h2>

          <p>Nu a fost găsită adresa de email pentru verificare.</p>

          <button style={styles.button} onClick={() => navigate("/login")}>
            Înapoi la autentificare
          </button>
        </div>
      </div>
    );
  }

  // Trimite codul introdus către server pentru validare
  const handleVerify = async (e) => {
    e.preventDefault();

    try {
      const { data } = await API.post("/auth/verify-email", {
        email,
        code,
      });

      setMessage(data.message);

      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error) {
      setMessage(error.response?.data?.message || "A apărut o eroare.");
    }
  };

  return (
    <div style={styles.container}>
      <form style={styles.form} onSubmit={handleVerify}>
        <h2>Confirmare email</h2>

        <p>
          Introdu codul primit pe adresa:
          <br />
          <strong>{email}</strong>
        </p>

        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          placeholder="Cod verificare"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          style={styles.input}
        />

        <button type="submit" style={styles.button}>
          Confirmă
        </button>

        {message && <p style={styles.message}>{message}</p>}
      </form>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f3f4f6",
  },

  form: {
    width: "100%",
    maxWidth: "420px",
    background: "white",
    padding: "30px",
    borderRadius: "16px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
  },

  input: {
    width: "100%",
    padding: "12px",
    marginTop: "12px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    boxSizing: "border-box",
  },

  button: {
    width: "100%",
    marginTop: "16px",
    padding: "12px",
    border: "none",
    borderRadius: "10px",
    background: "#2563eb",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
  },

  message: {
    marginTop: "12px",
    textAlign: "center",
  },
};
