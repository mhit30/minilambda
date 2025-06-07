const { Worker } = require("bullmq");
const { connection } = require("./dagQueue");
const jobRegistry = require("../jobRegistry/jobRegistry");
require("dotenv").config({ path: "../.env" });

const worker = new Worker(
  "dagQueue",
  async (job) => {
    const { dagId, nodeId, input, type } = job.data;
    const handler = jobRegistry[type];
    if (!handler) throw new Error(`Unknown job type: ${type}`);

    // put dagId in input object for ease of access in later job handlers
    input.dagId = dagId;
    const output = await handler(input);

    console.log(`Node ${nodeId} for dag ${dagId} completed`);

    return output;
  },
  { connection }
);

// listen to worker
worker.on("active", (job) => {
  console.log(`Job ${job.id} started`);
});

worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed.`);
});

worker.on("failed", (job, err) => {
  console.error(`Job ${job.id} failed: ${err}`);
});

worker.on("error", (err) => {
  console.error("Worker error: CHANGE TO SHOW");
});
