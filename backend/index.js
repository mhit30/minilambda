const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
const server = http.createServer(app);
app.use(cors({ origin: "*" }));
app.use(express.json());

// initialize the socket
const { initSocket } = require("./socket");
initSocket(server);
require("./dag/dagQueueEvents");
const dagRouter = require("./routes/dagRouter");
const appConfig = require("./config/appConfig");
app.use("/dag", dagRouter);

// const { main } = require("./utils/gemini");
// main();

mongoose.connect(appConfig.MONGO_URI).then(() => {
  console.log("MongoDB connected");
  server.listen(appConfig.PORT, () => {
    console.log(`Server running on port ${appConfig.PORT}`);
  });
});
