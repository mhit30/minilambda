const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const imgResizeQueue = require("./imgJob/imgResizeQueue");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
app.use(cors({ origin: "*" }));
app.use(express.json());

// initilize the socket
const { initSocket } = require("./socket");
initSocket(server);
const imgResizeQueueEvents = require("./imgJob/imgResizeQueueEvents");

const jobRouter = require("./routes/jobRouter");
app.use("/imgJob", jobRouter);

const PORT = process.env.PORT || 3001;
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/minilambda";
mongoose.connect(MONGO_URI).then(() => {
  console.log("MongoDB connected");
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
