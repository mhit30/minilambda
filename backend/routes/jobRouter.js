const express = require("express");
const router = express.Router({ mergeParams: true });
const imgResizeQueue = require("../imgJob/imgResizeQueue");
const JobModel = require("../models/jobModel");

router.get("/job/:id", async (req, res) => {
  try {
    const job = await JobModel.findOne({ jobId: req.params.id });

    if (!job) {
      return res.status(404).json({ error: "Job not found in MongoDB" });
    }

    res.status(200).json({
      id: job.jobId,
      state: job.status,
      attemptsMade: job.attemptsMade,
      maxAttempts: job.maxAttempts,
      result: job.result || null,
      failedReason: job.failedReason || null,
      createdAt: job.createdAt,
      finishedAt: job.finishedAt,
      duration: (job.finishedAt - job.createdAt) / 1000,
    });
  } catch (err) {
    console.error("Error fetching job from Mongo:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/resize-job", async (req, res) => {
  const { imageBase64, width, height } = req.body;

  if (!imageBase64 || !width || !height) {
    return res
      .status(400)
      .json({ error: "Missing imageBase64, width, or height" });
  }

  // add new job to queue
  const job = await imgResizeQueue.add("resize-image", {
    imageBase64,
    width,
    height,
  });

  res
    .status(200)
    .json({ message: "Resize job added to queue!", jobId: job.id });
});

module.exports = router;
