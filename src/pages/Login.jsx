import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { GoogleLogin } from "@react-oauth/google";
import { useToast } from "../context/ToastContext";

export default function Login() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isRegister, setIsRegister] = useState(false);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    birthDate: "",
    phone: "",
    bloodType: "",
    medicalConditions: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactEmail: "",
  });

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const { data } = await API.post("/auth/google", {
        credential: credentialResponse.credential,
      });

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      showToast("Autentificare Google reușită", "success");

      if (data.user.role === "dispatcher" || data.user.role === "admin") {
        navigate("/dispatcher/dashboard");
        return;
      }

      if (!data.user.phone || !data.user.birthDate) {
        navigate("/profile");
        return;
      }

      navigate("/");
    } catch (error) {
      console.log(error);

      showToast(
        error.response?.data?.message || "Autentificare Google eșuată.",
        "error",
      );
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Gestionează autentificarea și înregistrarea utilizatorilor
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const endpoint = isRegister ? "/auth/register" : "/auth/login";

      const { data } = await API.post(endpoint, formData);

      if (isRegister && data.requiresEmailVerification) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        showToast(
          "Cont creat. Verifică emailul pentru codul de confirmare.",
          "success",
        );

        navigate("/verify-email", {
          state: {
            email: data.email,
          },
        });

        return;
      }

      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        showToast("Autentificare reușită", "success");

        if (data.user.role === "dispatcher" || data.user.role === "admin") {
          navigate("/dispatcher/dashboard");
        } else {
          navigate("/");
        }
      }
    } catch (error) {
      console.log(error);

      showToast(
        error.response?.data?.message || "A apărut o eroare. Încearcă din nou.",
        "error",
      );
    }
  };

  return (
    <div style={styles.container} className="login-container">
      <div style={styles.content} className="login-content">
        <div style={styles.top} className="login-mobile-top">
          <div style={styles.logo}>🚨</div>
          <br />
          <h1 style={styles.title}>
            Emergency Alert <br />
            <br /> Platform
          </h1>
          <br />
          <p style={styles.subtitle}>
            Raportează incidente și trimite alerte SOS
          </p>
        </div>
        <div style={styles.desktopIntro} className="login-desktop-intro">
          <div style={styles.logo}>🚨</div>
          <h1 style={styles.desktopTitle}>Emergency Alert Platform</h1>
          <p style={styles.desktopText}>
            Platformă pentru raportarea și gestionarea incidentelor în timp
            real.
          </p>
        </div>

        <form style={styles.form} onSubmit={handleSubmit}>
          {isRegister && (
            <div style={styles.registerGrid} className="register-grid">
              <div style={styles.fieldGroup}>
                <label style={styles.label}>UserName *</label>
                <input
                  type="text"
                  name="username"
                  placeholder="Username"
                  style={styles.input}
                  onChange={handleChange}
                />
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Prenume *</label>
                <input
                  type="text"
                  name="firstName"
                  placeholder="Prenume"
                  style={styles.input}
                  onChange={handleChange}
                />
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>Nume *</label>
                <input
                  type="text"
                  name="lastName"
                  placeholder="Nume"
                  style={styles.input}
                  onChange={handleChange}
                />
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Data Nașterii *</label>
                <input
                  type="date"
                  name="birthDate"
                  title="Data nașterii"
                  style={styles.input}
                  onChange={handleChange}
                />
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Telefon *</label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="Telefon"
                  style={styles.input}
                  onChange={handleChange}
                />
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>Grupă sanguină </label>
                <select
                  name="bloodType"
                  style={styles.input}
                  onChange={handleChange}
                >
                  <option value="">Grupă sanguină</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Alte afecțiuni medicale</label>
                <textarea
                  name="medicalConditions"
                  placeholder="Ex: astm, diabet, alergii, tratamente permanente"
                  style={styles.textarea}
                  onChange={handleChange}
                />
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Contact urgență </label>
                <input
                  type="text"
                  name="emergencyContactName"
                  placeholder="Contact urgență"
                  style={styles.input}
                  onChange={handleChange}
                />
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Telefon contact</label>
                <input
                  type="tel"
                  name="emergencyContactPhone"
                  placeholder="Telefon contact"
                  style={styles.input}
                  onChange={handleChange}
                />
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Email contact</label>
                <input
                  type="email"
                  name="emergencyContactEmail"
                  placeholder="Email contact"
                  style={styles.input}
                  onChange={handleChange}
                />
              </div>
            </div>
          )}

          <input
            type="email"
            name="email"
            placeholder="Email *"
            style={styles.input}
            onChange={handleChange}
          />

          <input
            type="password"
            name="password"
            placeholder="Parolă *"
            style={styles.input}
            onChange={handleChange}
          />
          {isRegister && <p style={styles.requiredInfo}>* Câmp obligatoriu</p>}
          {!isRegister && (
            <p
              style={styles.forgotPassword}
              onClick={() => navigate("/forgot-password")}
            >
              Ai uitat parola?
            </p>
          )}
          <button type="submit" style={styles.button}>
            {isRegister ? "Creează cont" : "Autentificare"}
          </button>
          <div style={styles.googleBox}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => console.log("Google Login Failed")}
            />
          </div>

          <p style={styles.switchText}>
            {isRegister ? "Ai deja cont?" : "Nu ai cont?"}

            <span
              style={styles.switchButton}
              onClick={() => setIsRegister(!isRegister)}
            >
              {isRegister ? " Autentificare" : " Creează cont"}
            </span>
          </p>
        </form>
      </div>
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
    padding: "48px",
    boxSizing: "border-box",
  },
  content: {
    width: "100%",
    maxWidth: "1400px",
    display: "grid",
    gridTemplateColumns: "1fr 420px",
    gap: "80px",
    alignItems: "center",
  },
  googleBox: {
    display: "flex",
    justifyContent: "center",
    marginTop: "8px",
  },

  top: {
    textAlign: "center",
    marginBottom: "40px",
  },

  logo: {
    alignItems: "center",
    fontSize: "72px",
    marginBottom: "10px",
  },

  title: {
    color: "white",
    fontSize: "36px",
    marginBottom: "10px",
  },

  subtitle: {
    color: "#9ca3af",
    lineHeight: 1.5,
  },

  form: {
    background: "white",
    padding: "28px",
    borderRadius: "26px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
    width: "100%",
    boxSizing: "border-box",
  },

  input: {
    padding: "12px",
    borderRadius: "12px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
  },

  button: {
    padding: "16px",
    borderRadius: "14px",
    border: "none",
    background: "#d90429",
    color: "white",
    fontSize: "16px",
    fontWeight: "bold",
  },

  switchText: {
    textAlign: "center",
    color: "#6b7280",
  },

  switchButton: {
    color: "#d90429",
    fontWeight: "bold",
    cursor: "pointer",
  },
  desktopIntro: {
    color: "white",
    maxWidth: "620px",
  },

  desktopTitle: {
    color: "white",
    fontSize: "52px",
    lineHeight: 1.05,
    margin: "20px 0",
  },

  desktopText: {
    color: "#d1d5db",
    fontSize: "20px",
    lineHeight: 1.6,
  },

  registerGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },

  label: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#6b7280",
    paddingLeft: "4px",
  },
  requiredInfo: {
    fontSize: "12px",
    color: "#6b7280",
    margin: "0",
  },
  forgotPassword: {
    margin: "-6px 0 0",
    textAlign: "right",
    color: "#d90429",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
  },
  textarea: {
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    resize: "vertical",
    minHeight: "80px",
    boxSizing: "border-box",
  },
};
