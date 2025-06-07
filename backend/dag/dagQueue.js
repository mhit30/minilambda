const { Queue } = require("bullmq");
const IORedis = require("ioredis");
const appConfig = require("../config/appConfig");

const connection = new IORedis(appConfig.REDIS_URL, {
  maxRetriesPerRequest: null,
});

// create a  queue with a job retry strategy
const dagQueue = new Queue("dagQueue", {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
  },
  connection,
});

module.exports = { dagQueue, connection };
