const { publishNumber } = require("../rabbitmq/publisher");
const {
  addSelection,
  getAnalytics,
} = require("../services/analyticsService");

let manualNumber = null;
let publishedHistory = [];

const manualPublish = async (req, res) => {
  manualNumber = req.body.number;

  res.json({
    success: true,
    number: manualNumber,
  });
};

const selectNumber = (req, res) => {
  const { selectedNumber } = req.body;

  addSelection(selectedNumber);

  res.json({
    success: true,
  });
};

const analytics = (req, res) => {
  res.json(getAnalytics());
};

const getPublishedHistory = (req, res) => {
  res.json(publishedHistory);
};

const executePublish = async () => {
  let finalNumber;

  if (manualNumber !== null) {
    finalNumber = manualNumber;
    manualNumber = null;
  } else {
    finalNumber = Math.floor(Math.random() * 10);
  }

  await publishNumber({
    number: finalNumber,
  });

  publishedHistory.unshift(finalNumber);

if (publishedHistory.length > 20) {
  publishedHistory.pop();
}
};

module.exports = {
  manualPublish,
  selectNumber,
  analytics,
  executePublish,
  getPublishedHistory,
};