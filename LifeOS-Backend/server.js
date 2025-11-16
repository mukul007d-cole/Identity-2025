import http from "http";
import { Server } from "socket.io";
import app from "./app.js";
import connectDB from "./db/index.js";
import fs from "fs";

const port = process.env.PORT || 3000;

const server = http.createServer(app);

fs.mkdirSync("public/audio", { recursive: true });

export const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  console.log("Android Connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("Android Disconnected:", socket.id);
  });
});

connectDB();

server.listen(port, () => {
  console.log("Server Running On Port", port);
});
