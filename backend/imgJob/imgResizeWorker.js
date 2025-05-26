const { Worker } = require("bullmq");
const IORedis = require("ioredis");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

// create new worker to listen to new jobs on the imgResize queue
const worker = new Worker(
  "imgResize",
  async (job) => {
    try {
      const { imageBase64, width, height } = job.data;

      const imageBuffer = Buffer.from(imageBase64, "base64");

      const resizedBuffer = await sharp(imageBuffer)
        .resize(width, height)
        .toFormat("jpg")
        .toBuffer();

      const filename = `resized-${Date.now()}.jpg`;
      const filepath = path.join(__dirname, "output", filename);

      fs.mkdirSync(path.join(__dirname, "output"), { recursive: true });
      fs.writeFileSync(filepath, resizedBuffer);
      // may return something for queue-event to send back to client
      return { fileUrl: `output/${filepath}` };
    } catch (err) {
      throw err;
    }
  },
  { connection }
);

// listen to worker
worker.on("active", (job) => {
  console.log(`🚀 Job ${job.id} started`);
});

worker.on("completed", (job) => {
  console.log(`✅ Job ${job.id} completed by ${process.pid}`);
});

worker.on("failed", (job, err) => {
  // console.error(`❌ Job ${job.id} failed:`, err);
});

worker.on("error", (err) => {
  console.error("❌ Worker error:", err);
});
