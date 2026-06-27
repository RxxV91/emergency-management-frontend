import axios from "axios";

// Instanță Axios utilizată pentru comunicarea cu backend-ul
const API = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
});

// Adaugă automat tokenul JWT la fiecare cerere autenticată
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");

  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }

  return req;
});

export default API;
