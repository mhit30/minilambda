async function checkNodeReady(node, dagId, connection) {
  // for each node that dependent on the node that just completed
  // get its dependents
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
  return ready;
}

module.exports = checkNodeReady;
