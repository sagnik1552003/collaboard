import http from "http";
import { Server } from "socket.io";

import app from "./app.js";
import { registerBoardSocket } from "./sockets/board.socket.js";

const PORT = process.env.PORT || 3000;

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

registerBoardSocket(io);

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});