async function gatherDagOutputs(dagId, dag, connection) {
  const statuses = await Promise.all(
    dag.nodes.map((node) =>
      connection.get(`dag:${dagId}:node:${node.id}:status`)
    )
  );
  const isFinished = statuses.every((status) => status !== "pending");
  let outputs = null;
  if (isFinished) {
    const attempts = await Promise.all(
      dag.nodes.map((node) =>
        connection.get(`dag:${dagId}:node:${node.id}:attemptsMade`)
      )
    );

    const mAttempts = await Promise.all(
      dag.nodes.map((node) =>
        connection.get(`dag:${dagId}:node:${node.id}:maxAttempts`)
      )
    );

    outputs = await Promise.all(
      dag.nodes.map(async (node, index) => ({
        [node.id]: {
          output: await connection.get(`dag:${dagId}:node:${node.id}:output`),
          status: statuses[index],
          attemptsMade: attempts[index],
          maxAttempts: mAttempts[index],
        },
      }))
    );
  }

  return {
    isFinished,
    outputs: outputs ? Object.assign({}, ...outputs) : null,
  };
}

module.exports = gatherDagOutputs;
