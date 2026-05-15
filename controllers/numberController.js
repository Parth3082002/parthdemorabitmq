const {
  publishNumber,
} = require("../rabbitmq/publisher");

const {
  addSelection,
  getUserBets,
  getNumberTotals,
  getTotalPool,
  getNumberPercentages,
} = require("../services/analyticsService");

const {
  beginSettlement,
  markGameSettled,
  openNextRound,
  isAcceptingBets,
  getOpenGameId,
} = require("../services/gameRoundService");

const {
  placeBetsForRound,
} = require("../services/betPlacementService");

const {
  settlePendingBetsForGame,
  WIN_MULTIPLIER,
} = require("../services/betSettlementService");

let manualNumber = null;
let publishedHistory = [];
let isPublishing = false;

const manualPublish = async (
  req,
  res
) => {
  manualNumber = req.body.number;

  res.json({
    success: true,
    number: manualNumber,
  });
};

const selectNumber = async (
  req,
  res
) => {
  if (!isAcceptingBets()) {
    return res
      .status(503)
      .json({
        success: false,
        message:
          "Round is not accepting bets right now",
      });
  }

  const gameId = getOpenGameId();
  const userId = req.user.id;
  const { bets } = req.body;

  const result =
    await placeBetsForRound({
      userId,
      gameId,
      bets,
    });

  if (!result.ok) {
    const statusByCode = {
      insufficient_balance: 400,
      invalid_bet_line: 400,
      invalid_body: 400,
      too_many_bets: 400,
      wallet_not_found: 404,
      concurrent_wallet_change: 409,
      round_closed: 503,
      invalid_round: 400,
      bet_insert_failed: 500,
      wallet_update_failed: 500,
    };

    const http =
      statusByCode[
        result.code
      ] || 400;

    return res
      .status(http)
      .json({
        success: false,
        code: result.code,
        message:
          result.message,
        index:
          result.index,
      });
  }

  bets.forEach((bet) => {
    addSelection(
      String(userId),
      bet.selectedNumber,
      bet.betAmount
    );
  });

  req.app.get("io").emit(
    "analyticsUpdated",
    {
      userBets: getUserBets(),
      numberTotals:
        getNumberTotals(),
      totalPool: getTotalPool(),
      percentages:
        getNumberPercentages(),
    }
  );

  res.json({
    success: true,
    newBalance:
      result.newBalance,
    linesPlaced:
      result.linesPlaced,
    totalStake:
      result.totalStake,
    winMultiplier:
      WIN_MULTIPLIER,
  });
};

const analytics = (
  req,
  res
) => {
  const totalPool = getTotalPool();
  const percentages =
    getNumberPercentages();

  res.json({
    userBets: getUserBets(),
    numberTotals:
      getNumberTotals(),
    totalPool,
    percentages,
  });
};

const getPublishedHistory = (
  req,
  res
) => {
  res.json(publishedHistory);
};

const executePublish = async () => {
  if (isPublishing) {
    return;
  }

  isPublishing = true;

  try {
  const { gameId: gameIdToSettle } =
    beginSettlement();

  let finalNumber;

  if (manualNumber !== null) {
    finalNumber = manualNumber;
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

    if (eligibleNumbers.length > 0) {
      finalNumber = Number(
        eligibleNumbers[
          Math.floor(
            Math.random() *
              eligibleNumbers.length
          )
        ]
      );
    } else {
      finalNumber = Math.floor(
        Math.random() * 10
      );
    }
  }

  publishedHistory.unshift(
    finalNumber
  );

  if (publishedHistory.length > 20) {
    publishedHistory.pop();
  }

  await settlePendingBetsForGame(
    gameIdToSettle,
    finalNumber
  );

  await markGameSettled(
    gameIdToSettle,
    finalNumber
  );

  await openNextRound();

  await publishNumber({
    number: finalNumber,
  });
  } finally {
    isPublishing = false;
  }
};

module.exports = {
  manualPublish,
  selectNumber,
  analytics,
  executePublish,
  getPublishedHistory,
};
