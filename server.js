require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const { connectRabbitMQ } = require("./rabbitmq/connection");
const { consumeNumbers } = require("./rabbitmq/consumer");
const { startTimer } = require("./services/timerService");
const {
  ensureOpenRound,
} = require("./services/gameRoundService");

const walletRoutes = require("./routes/walletRoutes");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

app.use(cors());
app.use(express.json());

/* ROUTES */

app.use(
  "/api",
  require("./routes/numberRoutes")
);

app.use(
  "/api/wallet",
  walletRoutes
);

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/admin",
  adminRoutes
);

/* TESTING API */

app.get(
  "/api/keep-alive",
  (req, res) => {
    console.log(
      "Keep Alive Hit:",
      new Date()
    );

    res.status(200).json({
      success: true,
      message:
        "Server is running 🚀",
      timestamp: new Date(),
    });
  }
);

/* HEALTH CHECK */

app.get(
  "/api/health",
  (req, res) => {
    res.send("OK");
  }
);

const server =
  http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

io.on(
  "connection",
  (socket) => {
    console.log(
      "Client Connected"
    );
  }
);

app.set("io", io);

const startServer =
  async () => {
    await connectRabbitMQ();

    await ensureOpenRound();

    await consumeNumbers(io);

    startTimer(io);

    server.listen(5000, () => {
      console.log(
        "Server running on 5000"
      );
    });
  };

startServer();