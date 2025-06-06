const { QueueEvents } = require("bullmq");
const { dagQueue, connection } = require("./dagQueue");
const getDownstreamNodes = require("./getDownstreamNodes");
const dagQueueEvents = new QueueEvents("dagQueue", { connection });
const dagReport = require("./dagReport");
const gatherDagOutputs = require("./gatherDagOutputs");

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

    // for each node that dependened on the node that just completed
    for (const node of dependents) {
      // get its depdents
      const deps = node.dependsOn;

      // Check if all of its dependents are marked as completed
      const allDepsDone = await Promise.all(
        deps.map(async (depNodeId) => {
          const status = await connection.get(
            `dag:${dagId}:node:${depNodeId}:status`
          );
          return status === "completed";
        })
      );

      // if so it is ready, i.e. all elems in the array are true
      const ready = allDepsDone.every(Boolean);

      // enque that node
      if (ready) {
        await dagQueue.add("dagQueue", {
          dagId,
          nodeId: node.id,
          type: node.type,
          input: node.input,
        });
        console.log(`QueueEvents Enqueued ${node.id} after ${deps.join(", ")}`);
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
    const skipedNodes = getDownstreamNodes(nodeId, dag);

    for (const skipedNode of skipedNodes) {
      await connection.set(`dag:${dagId}:node:${skipedNode}:status`, "skipped");
      await connection.set(
        `dag:${dagId}:node:${skipedNode}:output`,
        `Dependency: ${nodeId} failed.`
      );
      await connection.set(`dag:${dagId}:node:${skipedNode}:attemptsMade`, 0);
      // max attempts ommited
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
