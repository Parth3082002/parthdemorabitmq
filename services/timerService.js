const { executePublish } = require("../controllers/numberController");
const { resetAnalytics } = require("./analyticsService");

let timer = 60;

const startTimer = (io) => {
  setInterval(async () => {
    timer--;

    io.emit("timerUpdate", timer);

    if (timer <= 0) {
      await executePublish();

      io.emit("selectionClosed");

      timer = 60;

      resetAnalytics();
    }
  }, 1000);
};

module.exports = {
  startTimer,
};