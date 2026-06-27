import { createContext, useContext, useState } from "react";

const ToastContext = createContext();

//Componenta ce ajuta la afisarea notificarilor toast in aplicatie
export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  // Afișează un mesaj temporar utilizatorului
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    // Ascunde automat notificarea după 3 secunde
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {toast && (
        <div style={styles.toast}>
          <span style={styles.icon}>
            {toast.type === "error" ? "❌" : "✅"}
          </span>

          <span>{toast.message}</span>
        </div>
      )}
    </ToastContext.Provider>
  );
}
// Hook personalizat pentru utilizarea sistemului de notificări
export const useToast = () => useContext(ToastContext);

const styles = {
  toast: {
    position: "fixed",
    top: "20px",
    left: "50%",
    transform: "translateX(-50%)",
    background: "#ffffff",
    color: "#111827",
    padding: "14px 18px",
    borderRadius: "16px",
    fontWeight: "600",
    zIndex: 9999,
    boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    border: "1px solid #e5e7eb",
  },

  icon: {
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f3f4f6",
    fontWeight: "bold",
  },
};
