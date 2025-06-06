const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
app.use(cors({ origin: "*" }));
app.use(express.json());

// initilize the socket
const { initSocket } = require("./socket");
initSocket(server);
const dagQueueEvents = require("./dagJob/dagQueueEvents");
const dagRouter = require("./routes/dagRouter");
app.use("/dag", dagRouter);

// const { main } = require("./utils/gemini");
// main();

const PORT = process.env.PORT || 3001;
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/minilambda";
mongoose.connect(MONGO_URI).then(() => {
  console.log("MongoDB connected");
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
