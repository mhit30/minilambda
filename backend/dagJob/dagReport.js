const { QueueEvents } = require("bullmq");
const { connection } = require("./dagQueue");

const DagModel = require("../models/dagModel");

async function dagReport(dagId, dag, nodeOutputs, isSuccess = true) {
  // get the name of the dag
  // get the status of the entire dag
  // fill out each job, the job id, the job type, inputs, depends on,
  const dagReport = await DagModel.findOne({
    dagId: dagId,
  });
  dagReport.status = isSuccess ? "success" : "failure";
  dagReport.jobs = [];
  dagReport.finishedAt = Date.now();
  for (const node of dag.nodes) {
    dagReport.jobs.push({
      dagId: dagId,
      type: node.type,
      status: nodeOutputs[node.id].status,
      dependsOn: node.dependsOn || null,
      input: node.input,
      result:
        nodeOutputs[node.id].status === "completed"
          ? nodeOutputs[node.id].output
          : null,
      failedReason:
        nodeOutputs[node.id].status === "failure" ||
        nodeOutputs[node.id].status === "skipped"
          ? nodeOutputs[node.id].output
          : null,
      attemptsMade: nodeOutputs[node.id].attemptsMade,
      maxAttempts: nodeOutputs[node.id].maxAttempts,
      finishedAt: Date.now(),
    });
  }
  await dagReport.save();
}

module.exports = dagReport;
