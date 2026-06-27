import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { useToast } from "../context/ToastContext";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Trimite pe email codul de resetare a parolei
  const sendResetCode = async (e) => {
    e.preventDefault();

    try {
      await API.post("/auth/forgot-password", { email });

      showToast("Codul de resetare a fost trimis pe email.", "success");
      setStep(2);
    } catch (error) {
      showToast(
        error.response?.data?.message || "Eroare la trimiterea codului.",
        "error",
      );
    }
  };

  // Resetează parola folosind codul primit pe email
  const resetPassword = async (e) => {
    e.preventDefault();

    if (code.length !== 6) {
      showToast("Codul trebuie să conțină 6 cifre.", "error");
      return;
    }

    if (newPassword.length < 6) {
      showToast("Parola trebuie să aibă cel puțin 6 caractere.", "error");
      return;
    }

    try {
      await API.post("/auth/reset-password", {
        email,
        code,
        newPassword,
      });

      showToast("Parola a fost resetată cu succes.", "success");
      navigate("/login");
    } catch (error) {
      showToast(
        error.response?.data?.message || "Eroare la resetarea parolei.",
        "error",
      );
    }
  };

  return (
    <div style={styles.container}>
      <form
        style={styles.form}
        onSubmit={step === 1 ? sendResetCode : resetPassword}
      >
        <h2 style={styles.title}>Resetare parolă</h2>

        {step === 1 ? (
          <>
            <p style={styles.text}>
              Introdu adresa de email asociată contului.
            </p>

            <input
              type="email"
              placeholder="Email"
              style={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <button type="submit" style={styles.button}>
              Trimite cod
            </button>
          </>
        ) : (
          <>
            <p style={styles.text}>
              Introdu codul primit pe email și parola nouă.
            </p>

            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="Cod resetare"
              style={styles.input}
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />

            <input
              type="password"
              placeholder="Parolă nouă"
              style={styles.input}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />

            <button type="submit" style={styles.button}>
              Resetează parola
            </button>
          </>
        )}

        <button
          type="button"
          style={styles.backButton}
          onClick={() => navigate("/login")}
        >
          Înapoi la autentificare
        </button>
      </form>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg, #0f172a 0%, #111827 55%, #1f2937 100%)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "24px",
  },

  form: {
    width: "100%",
    maxWidth: "420px",
    background: "white",
    padding: "28px",
    borderRadius: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
  },

  title: {
    margin: 0,
    color: "#111827",
    textAlign: "center",
  },

  text: {
    color: "#6b7280",
    textAlign: "center",
    margin: 0,
  },

  input: {
    padding: "14px",
    borderRadius: "12px",
    border: "1px solid #d1d5db",
    fontSize: "15px",
  },

  button: {
    padding: "14px",
    borderRadius: "12px",
    border: "none",
    background: "#d90429",
    color: "white",
    fontWeight: "700",
    cursor: "pointer",
  },

  backButton: {
    border: "none",
    background: "transparent",
    color: "#d90429",
    fontWeight: "700",
    cursor: "pointer",
  },
};
