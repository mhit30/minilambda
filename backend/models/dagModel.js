const mongoose = require("mongoose");
const jobSchema = require("./jobModel");

const dagSchema = new mongoose.Schema({
  dagId: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["success", "failure"],
  },
  jobs: [jobSchema],
  startedAt: {
    type: Date,
    default: Date.now(),
  },
  finishedAt: {
    type: Date,
  },
});

const DagModel = mongoose.model("DagModel", dagSchema);

module.exports = DagModel;
