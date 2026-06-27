import { createContext, useContext, useState } from "react";

const IncidentContext = createContext();

// Componenta utilizata pentru stocarea temporară a incidentului aflat în completare
export const IncidentProvider = ({ children }) => {
  const [draftIncident, setDraftIncident] = useState(null);

  return (
    <IncidentContext.Provider value={{ draftIncident, setDraftIncident }}>
      {children}
    </IncidentContext.Provider>
  );
};
// Hook personalizat pentru accesarea contextului incidentelor
export const useIncident = () => useContext(IncidentContext);
