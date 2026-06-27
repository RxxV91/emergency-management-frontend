import { useEffect, useState } from "react";
import API from "../services/api";
import { useToast } from "../context/ToastContext";

// Pagina de profil a utilizatorului
export default function Profile() {
  const [formData, setFormData] = useState({
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

  const validatePhone = (phone) => {
    const regex = /^[0-9]{10}$/;
    return regex.test(phone);
  };

  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const { showToast } = useToast();

  // Încarcă automat datele profilului la deschiderea paginii
  useEffect(() => {
    fetchProfile();
  }, []);

  // Încarcă datele profilului utilizatorului autentificat
  const fetchProfile = async () => {
    try {
      const { data } = await API.get("/auth/me");

      setFormData({
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        birthDate: data.birthDate ? data.birthDate.slice(0, 10) : "",
        phone: data.phone || "",
        bloodType: data.bloodType || "",
        medicalConditions: data.medicalConditions || "",
        emergencyContactName: data.emergencyContactName || "",
        emergencyContactPhone: data.emergencyContactPhone || "",
        emergencyContactEmail: data.emergencyContactEmail || "",
      });
    } catch (error) {
      console.log(error);
    }
  };

  // Actualizează starea formularului la modificarea câmpurilor
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };
  // Salvează modificările efectuate în profil
  const saveProfile = async () => {
    try {
      // Verifică doar câmpurile obligatorii ale profilului
      if (
        !formData.firstName ||
        !formData.lastName ||
        !formData.birthDate ||
        !formData.phone
      ) {
        showToast(
          "Completează prenumele, numele, data nașterii și numărul de telefon.",
          "error",
        );
        return;
      }

      if (!validatePhone(formData.phone)) {
        showToast(
          "Numărul de telefon trebuie să conțină exact 10 cifre.",
          "error",
        );
        return;
      }

      if (
        formData.emergencyContactEmail &&
        !validateEmail(formData.emergencyContactEmail)
      ) {
        showToast("Emailul persoanei de contact este invalid.", "error");
        return;
      }

      if (
        formData.emergencyContactPhone &&
        !validatePhone(formData.emergencyContactPhone)
      ) {
        showToast("Numărul persoanei de contact este invalid.", "error");
        return;
      }

      const { data } = await API.put("/auth/profile", formData);

      // Actualizează datele locale pentru verificarea profilului complet
      localStorage.setItem("user", JSON.stringify(data));

      showToast("Profil actualizat");
    } catch (error) {
      console.log(error);
    }
  };
  // Deconectează utilizatorul și șterge datele de autentificare locale
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Profil medical</h1>

      <input
        name="firstName"
        placeholder="Prenume"
        value={formData.firstName}
        onChange={handleChange}
        style={styles.input}
      />

      <input
        name="lastName"
        placeholder="Nume"
        value={formData.lastName}
        onChange={handleChange}
        style={styles.input}
      />

      <input
        type="date"
        name="birthDate"
        value={formData.birthDate}
        onChange={handleChange}
        style={styles.input}
      />

      <input
        type="tel"
        inputMode="numeric"
        pattern="[0-9]*"
        name="phone"
        placeholder="Telefon"
        value={formData.phone}
        onChange={handleChange}
        style={styles.input}
      />

      <select
        name="bloodType"
        value={formData.bloodType}
        onChange={handleChange}
        style={styles.input}
      >
        <option value="">Selectează grupa sanguină</option>
        <option value="A+">A+</option>
        <option value="A-">A-</option>
        <option value="B+">B+</option>
        <option value="B-">B-</option>
        <option value="AB+">AB+</option>
        <option value="AB-">AB-</option>
        <option value="0+">0+</option>
        <option value="0-">0-</option>
      </select>
      <textarea
        name="medicalConditions"
        placeholder="Alte afecțiuni medicale"
        value={formData.medicalConditions}
        onChange={handleChange}
        style={styles.textarea}
      />
      <input
        name="emergencyContactName"
        placeholder="Persoană contact"
        value={formData.emergencyContactName}
        onChange={handleChange}
        style={styles.input}
      />

      <input
        name="emergencyContactPhone"
        placeholder="Telefon contact"
        value={formData.emergencyContactPhone}
        onChange={handleChange}
        style={styles.input}
      />

      <input
        type="email"
        name="emergencyContactEmail"
        placeholder="Email contact"
        value={formData.emergencyContactEmail}
        onChange={handleChange}
        style={styles.input}
      />

      <button style={styles.button} onClick={saveProfile}>
        Salvează
      </button>
      <button style={styles.logoutButton} onClick={logout}>
        Deconectare
      </button>
    </div>
  );
}

const styles = {
  container: {
    padding: "20px",
  },

  title: {
    marginBottom: "20px",
  },

  input: {
    width: "100%",
    padding: "14px",
    marginBottom: "14px",
    borderRadius: "12px",
    border: "1px solid #d1d5db",
    boxSizing: "border-box",
  },

  button: {
    width: "100%",
    padding: "16px",
    borderRadius: "14px",
    border: "none",
    background: "#023047",
    color: "white",
    fontWeight: "bold",
  },
  logoutButton: {
    width: "100%",
    padding: "16px",
    borderRadius: "14px",
    border: "1px solid #e5e7eb",
    background: "white",
    color: "#dc2626",
    fontWeight: "bold",
    marginTop: "12px",
  },
  ageText: {
    margin: "4px 0 0",
    color: "#6b7280",
    fontSize: "13px",
    fontWeight: "600",
  },
  textarea: {
    width: "100%",
    minHeight: "90px",
    padding: "14px",
    marginBottom: "14px",
    borderRadius: "12px",
    border: "1px solid #d1d5db",
    boxSizing: "border-box",
    resize: "vertical",
  },
};
