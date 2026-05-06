const { getChannel } = require("./connection");

const publishNumber = async (data) => {
  const channel = getChannel();

  channel.publish(
    "number_exchange",
    "",
    Buffer.from(JSON.stringify(data))
  );

  console.log("Published:", data);
};

module.exports = {
  publishNumber,
};