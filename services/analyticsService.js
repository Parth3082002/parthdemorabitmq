// let selections = {};

// const addSelection = (number) => {
//   if (selections[number]) {
//     selections[number]++;
//   } else {
//     selections[number] = 1;
//   }
// };

// const getAnalytics = () => {
//   return selections;
// };

// const resetAnalytics = () => {
//   selections = {};
// };

// module.exports = {
//   addSelection,
//   getAnalytics,
//   resetAnalytics,
// };
let userBets = {};
let numberTotals = {};

const addSelection = (
  userId,
  selectedNumber,
  betAmount
) => {
  if (!userBets[userId]) {
    userBets[userId] = [];
  }

  userBets[userId].push({
    selectedNumber,
    betAmount,
  });

  if (!numberTotals[selectedNumber]) {
    numberTotals[selectedNumber] = 0;
  }

  numberTotals[selectedNumber] +=
    betAmount;
};

const getUserBets = () =>
  userBets;

const getNumberTotals = () =>
  numberTotals;

const getTotalPool = () => {
  return Object.values(
    numberTotals
  ).reduce(
    (sum, amount) =>
      sum + amount,
    0
  );
};

const getNumberPercentages =
  () => {
    const totalPool =
      getTotalPool();

    let percentages = {};

    Object.keys(
      numberTotals
    ).forEach((number) => {
      percentages[number] =
        totalPool === 0
          ? 0
          : (numberTotals[
                number
              ] /
              totalPool) *
            100;
    });

    return percentages;
  };

const resetAnalytics =
  () => {
    userBets = {};
    numberTotals = {};
  };

module.exports = {
  addSelection,
  getUserBets,
  getNumberTotals,
  getTotalPool,
  getNumberPercentages,
  resetAnalytics,
};