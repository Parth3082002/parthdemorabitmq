const { getChannel } = require("./connection");

const consumeNumbers = async (io) => {
  const channel = getChannel();

  const queue = await channel.assertQueue("", {
    exclusive: true,
  });

  await channel.bindQueue(
    queue.queue,
    "number_exchange",
    ""
  );

  channel.consume(
    queue.queue,
    (message) => {
      if (message) {
        const data = JSON.parse(
          message.content.toString()
        );

        console.log("Consumed:", data);

        // Flutter आणि React ला realtime send
        io.emit("numberPublished", data);

        channel.ack(message);
      }
    },
    {
      noAck: false,
    }
  );
};

module.exports = {
  consumeNumbers,
};