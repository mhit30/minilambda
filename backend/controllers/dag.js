const { dagQueue, connection } = require("../dag/dagQueue");
const DagModel = require("../models/dagModel");
const { v4: uuidv4 } = require("uuid");
const findRootNodes = require("../utils/findRootNodes.js");
async function createDag(req, res) {
  try {
    const { name, nodes } = req.body;

    if (!name || !nodes) {
      return res.status(400).json({ error: "Missing DAG name or nodes." });
    }
    let dagId;
    do {
      dagId = uuidv4();
      existingDagId = await DagModel.findOne({ dagId: dagId });
    } while (existingDagId);
    // create a dag document
    await DagModel.create({
      dagId: dagId,
      name: name,
    });

    await connection.set(
      `dag:${dagId}`,
      JSON.stringify({ dagId, name, nodes })
    );

    // mark each node as pending
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
    return res.status(200).json({ message: `Dag submitted with id: ${dagId}` });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ error: "Internal server error." });
  }
}

async function getDag(req, res) {
  const dagId = req.params.id;
  try {
    const dag = await DagModel.findOne({ dagId: dagId });
    res.status(200).json({ dag: dag });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function getDagNode(req, res) {
  const dagId = req.params.dagId;
  const nodeId = req.params.nodeId;
  try {
    const dag = await DagModel.findOne({ dagId: dagId });
    const node = dag.jobs.find((n) => n.type === nodeId);
    res.status(200).json({ node: node });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
}

module.exports = { createDag, getDag, getDagNode };
