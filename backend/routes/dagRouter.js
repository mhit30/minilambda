const express = require("express");

const { dagQueue, connection } = require("../dagJob/dagQueue");
const DagModel = require("../models/dagModel");

function findRootNodes(nodes) {
  return nodes.filter((node) => !node.dependsOn || node.dependsOn.length === 0);
}

const dagRouter = express.Router({ mergeParams: true });
const { v4: uuidv4 } = require("uuid");

dagRouter.post("/", async (req, res) => {
  try {
    const { name, nodes } = req.body;

    if (!name || !nodes) {
      return res.status(400).json({ error: "Missing DAG name or nodes." });
    }

    const dagId = uuidv4();

    // create a dag document
    await DagModel.create({
      dagId: dagId,
      name: name,
    });

    await connection.set(
      `dag:${dagId}`,
      JSON.stringify({ dagId, name, nodes })
    );

    for (const node of nodes) {
      await connection.set(`dag:${dagId}:node:${node.id}:status`, "pending");
    }

    const rootNodes = findRootNodes(nodes);
    for (const node of rootNodes) {
      await dagQueue.add("dagQueue", {
        dagId,
        nodeId: node.id,
        type: node.type,
        input: node.input,
      });
    }
    return res.status(200).json({ message: "Dag submmited with id: ", dagId });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ error: "Internal server error." });
  }
});

dagRouter.get("/:id", async (req, res) => {
  const dagId = req.params.id;
  try {
    const dag = await DagModel.findOne({ dagId: dagId });
    res.status(200).json({ dag: dag });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = dagRouter;
