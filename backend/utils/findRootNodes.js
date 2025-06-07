function findRootNodes(nodes) {
  return nodes.filter((node) => !node.dependsOn || node.dependsOn.length === 0);
}

module.exports = findRootNodes;
