const { Server } = require("socket.io");

let io;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // setup username prior to any connection
  io.use((socket, next) => {
    const username = socket.handshake.auth.username;
    if (!username || typeof username !== "string") {
      return next(new Error("Username is required."));
    }
    socket.username = username.trim();
    next();
  });

  io.on("connection", (socket) => {
    socket.on("subscribeToJob", async ({ jobId }) => {
      socket.join(jobId);
      const job = await imgResizeQueue.getJob(jobId);
      const state = await job.getState();
      // catch up emit
      if (state === "completed") {
        socket.emit("job:completed", { jobId: jobId, from: "catch-up" });
      }
      console.log(`${socket.username} joined job room: ${jobId}`);
    });

    socket.on("disconnect", (reason) => {
      console.log(`${socket.username} left server.`);
    });
  });

  return io;
}

function getIO() {
  if (!io) throw new Error("Socket has not been initialized yet.");
  return io;
}

module.exports = { initSocket, getIO };
