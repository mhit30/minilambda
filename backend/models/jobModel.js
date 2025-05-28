const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    dagId: { type: String, required: true },
    type: { type: String, required: true },
    status: {
      type: String,
      enum: ["waiting", "active", "completed", "failed", "skipped"],
      required: true,
    },
    dependsOn: {
      type: String,
    },
    input: { type: Object }, // whatever data you accept
    result: { type: Object },
    failedReason: { type: String },
    attemptsMade: { type: Number },
    maxAttempts: { type: Number },
    createdAt: { type: Date, default: Date.now() },
    finishedAt: { type: Date },
  },
  { _id: false }
);

const JobModel = mongoose.model("JobModel", jobSchema);

module.exports = { JobModel, jobSchema };
