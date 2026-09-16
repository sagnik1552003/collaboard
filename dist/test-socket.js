"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_client_1 = require("socket.io-client");
const socket = (0, socket_io_client_1.io)("http://localhost:3000");
socket.on("connect", () => {
    console.log("Connected:", socket.id);
    socket.emit("join-board", {
        boardId: "59f6d6ce-bf72-404f-9d4f-c12674f394d6",
        userName: "Sagnik",
    });
});
socket.on("board-joined", (data) => {
    console.log("Joined board:", data);
    socket.emit("task:update", {
        taskId: "some-task-id",
        title: "My first real-time task",
        description: "Created through Socket.IO",
    });
});
socket.on("task:created", (data) => {
    console.log("Task created:", data);
});
socket.on("user-joined", (data) => {
    console.log("Someone joined:", data);
});
socket.on("error", (data) => {
    console.log("Socket error:", data);
});
