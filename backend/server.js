const express = require("express");
const http = require("http");
const cors = require("cors");
const socketIO = require("socket.io");
const { userJoin, getUsers, userLeave } = require("./utils/user");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(cors());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.get("/", (req, res) => {
  res.send("Server is running");
});

let roomDrawings = {};

io.on("connection", (socket) => {
  let userRoom = null;

  socket.on("user-joined", (data) => {
    const { roomId, userName } = data;
    userRoom = roomId;

    const user = userJoin(socket.id, userName, roomId);
    const roomUsers = getUsers(roomId);

    socket.join(userRoom);

    socket.emit("chat message", { message: "Welcome to the Chat Room" });
    socket.broadcast.to(userRoom).emit("chat message", {
      message: `${user.username} has joined`,
    });

    io.to(userRoom).emit("users", roomUsers);
    socket.emit("canvasImage", roomDrawings[userRoom] || []);
  });

  socket.on("chat message", (msg) => {
    console.log("Received message: ", msg); // Debug log to ensure the message is received
    io.to(userRoom).emit("chat message", msg);
  });

  socket.on("drawing-update", (data) => {
    if (!roomDrawings[userRoom]) {
      roomDrawings[userRoom] = [];
    }

    roomDrawings[userRoom].push(data);
    io.to(userRoom).emit("canvasImage", roomDrawings[userRoom]);
  });

  socket.on("clear-canvas", () => {
    if (roomDrawings[userRoom]) {
      roomDrawings[userRoom] = [];
    }
    io.to(userRoom).emit("clear-canvas");
  });

  socket.on("undo-canvas", () => {
    if (roomDrawings[userRoom] && roomDrawings[userRoom].length > 0) {
      roomDrawings[userRoom].pop();
      io.to(userRoom).emit("canvasImage", roomDrawings[userRoom]);
    }
  });

  socket.on("redo-canvas", (redoneElement) => {
    if (redoneElement) {
      roomDrawings[userRoom].push(redoneElement);
      io.to(userRoom).emit("canvasImage", roomDrawings[userRoom]);
    }
  });

  // Chat message
  socket.on("chat message", (msg) => {
    try {
      io.emit("chat message", msg);
    } catch (error) {
      console.error("Error in chat message:", error);
    }
  });

  socket.on("disconnect", () => {
    const userLeaves = userLeave(socket.id);
    const roomUsers = getUsers(userRoom);

    if (userLeaves) {
      io.to(userRoom).emit("chat message", {
        message: `${userLeaves.username} left the chat`,
      });
      io.to(userRoom).emit("users", roomUsers);
    }
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () =>
  console.log(`Server is running on http://localhost:${PORT}`)
);
