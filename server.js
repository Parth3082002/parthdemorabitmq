const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const { connectRabbitMQ } = require("./rabbitmq/connection");
const { consumeNumbers } = require("./rabbitmq/consumer");
const { startTimer } = require("./services/timerService");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", require("./routes/numberRoutes"));
require("dotenv").config();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log("Client Connected");
});

app.set("io", io);

const startServer = async () => {
  await connectRabbitMQ();
  await consumeNumbers(io);
  startTimer(io);
    
  server.listen(5000, () => {
    console.log("Server running on 5000");
  });
};

startServer();