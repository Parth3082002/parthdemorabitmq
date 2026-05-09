const generateUserId = () => {
  return "USR" + Date.now().toString().slice(-6);
};

module.exports = generateUserId;