const { QueueEvents } = require("bullmq");
const { connection } = require("./dagQueue");

const dagQueueEvents = new QueueEvents("dagQueue", { connection });

const DagModel = require("../models/dagModel");
const { JobModel } = require("../models/jobModel");

async function dagReport(dagId, dag, nodeOutputs, isSuccess = true) {
  // get the name of the dag
  // get the status of the entire dag
  // fill out each job, the job id, the job type, inputs, depends on,
  const dagReport = new DagModel({
    name: dag.name,
    status: isSuccess ? "success" : "failure",
    jobs: [],
  });

  for (const node of dag.nodes) {
    dagReport.jobs.push(
      new JobModel({
        dagId: dagId,
        type: node.type,
        status: nodeOutputs[node.id].status,
        dependsOn: node.dependsOn,
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
        attemptsMade: null,
        maxAttempts: null,
        finishedAt: Date.now(),
      })
    );
  }
  await dagReport.save();
}

module.exports = dagReport;
