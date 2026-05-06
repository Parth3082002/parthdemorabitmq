let selections = {};

const addSelection = (number) => {
  if (selections[number]) {
    selections[number]++;
  } else {
    selections[number] = 1;
  }
};

const getAnalytics = () => {
  return selections;
};

const resetAnalytics = () => {
  selections = {};
};

module.exports = {
  addSelection,
  getAnalytics,
  resetAnalytics,
};