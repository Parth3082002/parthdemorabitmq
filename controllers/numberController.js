// const { publishNumber } = require("../rabbitmq/publisher");
// const {
//   addSelection,
//   getAnalytics,
// } = require("../services/analyticsService");

// let manualNumber = null;
// let publishedHistory = [];

// const manualPublish = async (req, res) => {
//   manualNumber = req.body.number;

//   res.json({
//     success: true,
//     number: manualNumber,
//   });
// };

// const selectNumber = (req, res) => {
//   const { selectedNumber } = req.body;

//   addSelection(selectedNumber);

//   res.json({
//     success: true,
//   });
// };

// const analytics = (req, res) => {
//   res.json(getAnalytics());
// };

// const getPublishedHistory = (req, res) => {
//   res.json(publishedHistory);
// };

// const executePublish = async () => {
//   let finalNumber;

//   if (manualNumber !== null) {
//     finalNumber = manualNumber;
//     manualNumber = null;
//   } else {
//     finalNumber = Math.floor(Math.random() * 10);
//   }

//   await publishNumber({
//     number: finalNumber,
//   });

//   publishedHistory.unshift(finalNumber);

// if (publishedHistory.length > 20) {
//   publishedHistory.pop();
// }
// };

// module.exports = {
//   manualPublish,
//   selectNumber,
//   analytics,
//   executePublish,
//   getPublishedHistory,
// };
const {
  publishNumber,
} = require(
  "../rabbitmq/publisher"
);

const {
  addSelection,
  getUserBets,
  getNumberTotals,
  getTotalPool,
  getNumberPercentages,
} = require(
  "../services/analyticsService"
);

let manualNumber = null;
let publishedHistory = [];

const manualPublish =
  async (
    req,
    res
  ) => {
    manualNumber =
      req.body.number;

    res.json({
      success: true,
      number:
        manualNumber,
    });
  };

const selectNumber = (
  req,
  res
) => {
  const {
    userId,
    bets,
  } = req.body;

  bets.forEach((bet) => {
    addSelection(
      userId,
      bet.selectedNumber,
      bet.betAmount
    );
  });

  res.json({
    success: true,
  });
};

const analytics = (
  req,
  res
) => {
  const totalPool =
    getTotalPool();

  const percentages =
    getNumberPercentages();

  res.json({
    userBets:
      getUserBets(),
    numberTotals:
      getNumberTotals(),
    totalPool,
    percentages,
  });
};

const getPublishedHistory =
  (
    req,
    res
  ) => {
    res.json(
      publishedHistory
    );
  };

const executePublish =
  async () => {
    let finalNumber;

    if (
      manualNumber !== null
    ) {
      finalNumber =
        manualNumber;

      manualNumber = null;
    } else {
      const percentages =
        getNumberPercentages();

      const eligibleNumbers =
        Object.keys(
          percentages
        ).filter(
          (number) =>
            percentages[
              number
            ] <= 5
        );

      if (
        eligibleNumbers.length >
        0
      ) {
        finalNumber =
          Number(
            eligibleNumbers[
              Math.floor(
                Math.random() *
                  eligibleNumbers.length
              )
            ]
          );
      } else {
        finalNumber =
          Math.floor(
            Math.random() *
              10
          );
      }
    }

    publishedHistory.unshift(
      finalNumber
    );

    if (
      publishedHistory.length >
      20
    ) {
      publishedHistory.pop();
    }

    await publishNumber({
      number:
        finalNumber,
    });
  };

module.exports = {
  manualPublish,
  selectNumber,
  analytics,
  executePublish,
  getPublishedHistory,
};