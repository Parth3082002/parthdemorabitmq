require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const { connectRabbitMQ } = require("./rabbitmq/connection");
const { consumeNumbers } = require("./rabbitmq/consumer");
const { startTimer } = require("./services/timerService");
const walletRoutes = require("./routes/walletRoutes");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", require("./routes/numberRoutes"));


const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.use("/api/wallet", walletRoutes);

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);

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