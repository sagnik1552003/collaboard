import { io } from "socket.io-client";

const socket = io("http://localhost:3000");

socket.on("connect", () => {
  console.log("Connected:", socket.id);

  socket.emit("join-board", {
    boardId: "59f6d6ce-bf72-404f-9d4f-c12674f394d6",
    userName: "Sagnik",
  });
});

socket.on("board-joined", (data) => {
  console.log("Joined board:", data);

  socket.emit("task:move", {
    taskId: "470550e1-e5ff-47b7-ba5b-e7844feb7661",
    targetColumnId: "c8e3f340-e479-4eb9-8fd5-763361cbb591",
    targetPosition: 0,
  });
});

socket.on("task:moved", (data) => {
  console.log("TASK MOVED:", data);
});

socket.on("error", (data) => {
  console.log("Socket error:", data);
});