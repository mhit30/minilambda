const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema({
  jobId: { type: String, required: true, unique: true },
  type: { type: String, required: true },
  status: {
    type: String,
    enum: ["waiting", "active", "completed", "failed"],
    required: true,
  },
  input: { type: Object }, // whatever data you accept
  result: { type: Object },
  failedReason: { type: String },
  attemptsMade: { type: Number },
  maxAttempts: { type: Number },
  createdAt: { type: Date, default: Date.now },
  finishedAt: { type: Date },
});

const JobModel = mongoose.model("JobModel", jobSchema);

module.exports = JobModel;
