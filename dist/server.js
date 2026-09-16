"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const app_js_1 = __importDefault(require("./app.js"));
const board_socket_js_1 = require("./sockets/board.socket.js");
const PORT = process.env.PORT || 3000;
const httpServer = http_1.default.createServer(app_js_1.default);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: "*",
    },
});
(0, board_socket_js_1.registerBoardSocket)(io);
httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
