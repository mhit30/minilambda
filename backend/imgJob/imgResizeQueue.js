const { Queue } = require("bullmq");
const IORedis = require("ioredis");
require("dotenv").config();

const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

// create a  queue with a job retry strategy
const imgResizeQueue = new Queue("imgResize", {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
  },
  connection,
});

module.exports = imgResizeQueue;
