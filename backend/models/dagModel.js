const mongoose = require("mongoose");
const { jobSchema } = require("./jobModel");

const dagSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["success", "failure"],
  },
  jobs: [jobSchema],
});

const DagModel = mongoose.model("DagModel", dagSchema);

module.exports = DagModel;
