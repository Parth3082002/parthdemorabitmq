const { executePublish } = require("../controllers/numberController");
const { resetAnalytics } = require("./analyticsService");

let timer = 60;
let tickRunning = false;

const startTimer = (io) => {
  setInterval(async () => {
    if (tickRunning) {
      return;
    }

    tickRunning = true;

    try {
      timer--;

      io.emit("timerUpdate", timer);

      if (timer <= 0) {
        timer = 60;

        await executePublish();

        io.emit("selectionClosed");

        resetAnalytics();
      }
    } finally {
      tickRunning = false;
    }
  }, 1000);
};

module.exports = {
  startTimer,
};