const express = require("express");
const dagRouter = express.Router({ mergeParams: true });
const { createDag, getDag, getDagNode } = require("../controllers/dag");

dagRouter.post("/", createDag);

dagRouter.get("/:id", getDag);

dagRouter.get("/:dagId/node/:nodeId", getDagNode);

module.exports = dagRouter;
