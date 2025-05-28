function getDownstreamNodes(failedNodeId, dag) {
  const downstream = new Set();
  function dfs(nodeId) {
    for (const node of dag.nodes) {
      if (
        node !== nodeId &&
        node.dependsOn?.includes(nodeId) &&
        !downstream.has(nodeId)
      ) {
        downstream.add(node.id);
        // visit each children of a dependent node
        dfs(node.id);
      }
    }
  }
  dfs(failedNodeId);
  downstream.delete(failedNodeId);
  return Array.from(downstream);
}

module.exports = getDownstreamNodes;
