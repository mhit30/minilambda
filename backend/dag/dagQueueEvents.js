const { QueueEvents } = require("bullmq");
const { dagQueue, connection } = require("./dagQueue");
const getDownstreamNodes = require("../utils/getDownstreamNodes");
const dagQueueEvents = new QueueEvents("dagQueue", { connection });
const dagReport = require("../utils/dagReport");
const gatherDagOutputs = require("../utils/gatherDagOutputs");
const checkNodeReady = require("../utils/checkNodeReady");

// When any dag-step job completes
dagQueueEvents.on("completed", async ({ jobId, returnvalue }) => {
  try {
    const job = await dagQueue.getJob(jobId);
    const { dagId, nodeId } = job.data;

    // current current status of the node
    // save the output as a string
    await connection.set(
      `dag:${dagId}:node:${nodeId}:output`,
      JSON.stringify(returnvalue)
    );
    // save the status as complete
    await connection.set(`dag:${dagId}:node:${nodeId}:status`, "completed");
    // store the number of attempts made
    await connection.set(
      `dag:${dagId}:node:${nodeId}:attemptsMade`,
      job.attemptsMade
    );
    await connection.set(
      `dag:${dagId}:node:${nodeId}:maxAttempts`,
      job.opts.attempts
    );

    // get our original dag
    const rawDag = await connection.get(`dag:${dagId}`);
    if (!rawDag) return;

    // parse string dag into json
    const dag = JSON.parse(rawDag);

    // find all the nodes that depended on the node that just completed
    const dependents = dag.nodes.filter((node) =>
      node.dependsOn?.includes(nodeId)
    );

    // for each node that depended on the node that just completed
    for (const node of dependents) {
      // if the node is ready
      const ready = await checkNodeReady(node, dagId, connection);
      // enqueue that node
      if (ready) {
        await dagQueue.add("dagQueue", {
          dagId,
          nodeId: node.id,
          type: node.type,
          input: node.input,
        });
        console.log(
          `QueueEvents Enqueued ${node.id} after ${dependents
            .map((dep) => dep.id)
            .join(", ")}`
        );
      }
    }

    const { isFinished, outputs } = await gatherDagOutputs(
      dagId,
      dag,
      connection
    );
    if (isFinished) {
      await dagReport(dagId, dag, outputs);
    }
  } catch (err) {
    console.error("QueueEvents completion error:", err.message);
  }
});

dagQueueEvents.on("failed", async ({ jobId, failedReason }) => {
  try {
    const job = await dagQueue.getJob(jobId);
    const { dagId, nodeId } = job.data;

    // current current status of the node
    await connection.set(`dag:${dagId}:node:${nodeId}:output`, failedReason);
    await connection.set(`dag:${dagId}:node:${nodeId}:status`, "failed");
    await connection.set(
      `dag:${dagId}:node:${nodeId}:attemptsMade`,
      job.attemptsMade
    );
    await connection.set(
      `dag:${dagId}:node:${nodeId}:maxAttempts`,
      job.opts.attempts
    );

    // get our original dag
    const rawDag = await connection.get(`dag:${dagId}`);
    if (!rawDag) return;

    const dag = JSON.parse(rawDag);
    const skippedNodes = getDownstreamNodes(nodeId, dag);

    for (const skippedNode of skippedNodes) {
      await connection.set(
        `dag:${dagId}:node:${skippedNode}:status`,
        "skipped"
      );
      await connection.set(
        `dag:${dagId}:node:${skippedNode}:output`,
        `Dependency: ${nodeId} failed.`
      );
      await connection.set(`dag:${dagId}:node:${skippedNode}:attemptsMade`, 0);
      // max attempts omitted
    }

    const { isFinished, outputs } = await gatherDagOutputs(
      dagId,
      dag,
      connection
    );
    if (isFinished) {
      await dagReport(dagId, dag, outputs);
    }
    console.error(
      `QueueEvents failed error: DAG job ${jobId} failed:`,
      failedReason
    );
  } catch (err) {
    console.error("QueueEvents Failed error:", err.message);
  }
});
