const { QueueEvents } = require("bullmq");
const { dagQueue, connection } = require("./dagQueue");
const getDownstreamNodes = require("./getDownstreamNodes");
const dagQueueEvents = new QueueEvents("dagQueue", { connection });
const dagReport = require("./dagReport");
// When any dag-step job completes
dagQueueEvents.on("completed", async ({ jobId, returnvalue }) => {
  try {
    const job = await dagQueue.getJob(jobId);
    const { dagId, nodeId } = job.data;

    // save the output as a string
    await connection.set(
      `dag:${dagId}:node:${nodeId}:output`,
      JSON.stringify(returnvalue)
    );

    // save the status as complete
    await connection.set(`dag:${dagId}:node:${nodeId}:status`, "completed");

    // get our original dag
    const rawDag = await connection.get(`dag:${dagId}`);
    if (!rawDag) return;

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
        console.log(
          `📦 QueueEvents Enqueued ${node.id} after ${deps.join(", ")}`
        );
      }
    }

    if (dependents.length === 0) {
      // concurrently wait for all promises to resolve
      const statuses = await Promise.all(
        dag.nodes.map((node) =>
          connection.get(`dag:${dagId}:node:${node.id}:status`)
        )
      );
      const isFinished = statuses.every((status) => status !== "pending");
      if (isFinished) {
        const outputs = await Promise.all(
          dag.nodes.map(async (node, index) => ({
            [node.id]: {
              output: await connection.get(
                `dag:${dagId}:node:${node.id}:output`
              ),
              status: statuses[index],
            },
          }))
        );
        await dagReport(dagId, dag, Object.assign({}, ...outputs));
      }
    }
  } catch (err) {
    console.error("QueueEvents completion error:", err.message);
  }
});

dagQueueEvents.on("failed", async ({ jobId, failedReason }) => {
  try {
    const job = await dagQueue.getJob(jobId);
    const { dagId, nodeId } = job.data;

    await connection.set(`dag:${dagId}:node:${nodeId}:output`, failedReason);
    await connection.set(`dag:${dagId}:node:${nodeId}:status`, "failed");

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
    }
    // check if we have finished the dag
    // concurrently wait for all promises to resolve
    const statuses = await Promise.all(
      dag.nodes.map((node) =>
        connection.get(`dag:${dagId}:node:${node.id}:status`)
      )
    );
    const isFinished = statuses.every((status) => status !== "pending");
    if (isFinished) {
      const outputs = await Promise.all(
        dag.nodes.map(async (node, index) => ({
          [node.id]: {
            output: await connection.get(`dag:${dagId}:node:${node.id}:output`),
            status: statuses[index],
          },
        }))
      );
      await dagReport(dagId, dag, Object.assign({}, ...outputs), false);
    }

    console.error(
      `QueueEvents failed error: DAG job ${jobId} failed:`,
      failedReason
    );
  } catch (err) {
    console.error("QueueEvents Failed error:", err.message);
  }
});
