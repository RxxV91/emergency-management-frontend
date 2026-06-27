import { io } from "socket.io-client";

// Conexiune Socket.IO utilizată pentru actualizările în timp real
const socket = io(import.meta.env.VITE_API_URL);

export default socket;
