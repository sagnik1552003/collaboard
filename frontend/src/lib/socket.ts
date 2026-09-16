import { io, Socket } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(API_URL, { autoConnect: false });
  }

  return socket;
}
