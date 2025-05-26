const { QueueEvents } = require("bullmq");
const IORedis = require("ioredis");
const { getIO } = require("../socket");
const imgResizeQueue = require("./imgResizeQueue");
const JobModel = require("../models/jobModel");

const connection = new IORedis(process.env.IORedis, {
  maxRetriesPerRequest: null,
});

const imgResizeQueueEvents = new QueueEvents("imgResize", {
  connection,
});

imgResizeQueueEvents.on("completed", async ({ jobId, returnvalue }) => {
  try {
    const job = await imgResizeQueue.getJob(jobId);
    if (!job) return;

    const io = getIO();
    io.to(jobId).emit("job:completed", {
      jobId: jobId,
      status: "completed",
      from: "live",
      attemptsMade: job.attemptsMade,
      maxAttempts: job.opts.attempts,
    });

    await JobModel.create({
      jobId: jobId,
      type: "imgResize",
      status: "completed",
      input: job.data,
      result: returnvalue,
      attemptsMade: job.attemptsMade,
      maxAttempts: job.opts.attempts,
      createdAt: new Date(job.timestamp),
      finishedAt: new Date(),
    });

    console.log(`Socket Emitted job: completed for ${jobId}`);
  } catch (err) {
    console.error("Failed to emit job:completed:", err.message);
  }
});

imgResizeQueueEvents.on("failed", async ({ jobId, failedReason }) => {
  try {
    const job = await imgResizeQueue.getJob(jobId);
    if (!job) return;

    const io = getIO();
    io.to(jobId).emit("job:failed", {
      jobId: jobId,
      status: "failed",
      from: "live",
      attemptsMade: job.attemptsMade,
      maxAttempts: job.opts.attempts,
      failedReason: failedReason,
    });

    await JobModel.create({
      jobId: job.id,
      type: job.name,
      status: "failed",
      input: job.data,
      failedReason: failedReason,
      attemptsMade: job.attemptsMade,
      maxAttempts: job.opts.attempts,
      createdAt: new Date(job.timestamp),
      finishedAt: new Date(),
    });
    console.error(`Socket Emitted job:failed for ${jobId}`);
  } catch (err) {
    console.error("Failed to emit job:failed:", err.message);
  }
});

module.exports = imgResizeQueueEvents;
