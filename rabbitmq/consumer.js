// const { getChannel } = require("./connection");

// const consumeNumbers = async (io) => {
//   const channel = getChannel();

//   const queue = await channel.assertQueue("", {
//     exclusive: true,
//   });

//   await channel.bindQueue(
//     queue.queue,
//     "number_exchange",
//     ""
//   );

//   channel.consume(
//     queue.queue,
//     (message) => {
//       if (message) {
//         const data = JSON.parse(
//           message.content.toString()
//         );

//         console.log("Consumed:", data);

//         // Flutter आणि React ला realtime send
//         io.emit("numberPublished", data);

//         channel.ack(message);
//       }
//     },
//     {
//       noAck: false,
//     }
//   );
// };

// module.exports = {
//   consumeNumbers,
// };
const { getChannel } = require("./connection");

const {
  getUserBets,
  getNumberTotals,
  getTotalPool,
  getNumberPercentages,
} = require(
  "../services/analyticsService"
);

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

        console.log(
          "Consumed:",
          data
        );

        io.emit(
          "numberPublished",
          data
        );

        io.emit(
          "analyticsUpdated",
          {
            userBets:
              getUserBets(),
            numberTotals:
              getNumberTotals(),
            totalPool:
              getTotalPool(),
            percentages:
              getNumberPercentages(),
          }
        );

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