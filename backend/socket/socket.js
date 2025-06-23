const { Server } = require("socket.io");

const initializeSocket = (httpServer) => {
  const io = new Server(httpServer, {
    path: "/socket.io/",
    cors: {
      origin: process.env.CORS_ORIGIN || "*",
      methods: ["GET", "POST"],
    },
  });

  const activeUsers = {};

  io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;
    if (!userId) {
      console.log("No userId provided, disconnecting");
      return socket.disconnect(true);
    }

    activeUsers[userId] = socket.id;
    socket.join(`user_${userId}`);
    io.emit("user-status", { userId, status: "online" });
    console.log(`User ${userId} connected`);

    // Join a group/room (e.g., for group chats or post comments)
    socket.on("join-group", (groupId) => {
      socket.join(`group_${groupId}`);
      console.log(`User ${userId} joined group ${groupId}`);
    });

    // Typing Indicator
    socket.on("typing", ({ groupId, senderId }) => {
      socket.to(`group_${groupId}`).emit("typing", { senderId });
    });

    socket.on("stop-typing", ({ groupId, senderId }) => {
      socket.to(`group_${groupId}`).emit("stop-typing", { senderId });
    });

    // Real-time Notifications
    socket.on("send-notification", ({ recipientId, type, data }) => {
      if (activeUsers[recipientId]) {
        io.to(`user_${recipientId}`).emit("notification", { type, data });
      }
    });

    // Initiate Call (Voice/Video)
    socket.on("initiate-call", ({ groupId, recipientId, callType }) => {
      if (activeUsers[recipientId]) {
        io.to(`user_${recipientId}`).emit("incoming-call", {
          groupId,
          callerId: userId,
          callType, // 'voice' or 'video'
        });
      } else {
        socket.emit("call-error", { message: "Recipient is offline" });
      }
    });

    socket.on("accept-call", ({ groupId, callerId }) => {
      io.to(`user_${callerId}`).emit("call-accepted", { groupId, acceptorId: userId });
    });

    socket.on("reject-call", ({ groupId, callerId }) => {
      io.to(`user_${callerId}`).emit("call-rejected", { groupId });
    });

    socket.on("end-call", ({ groupId, recipientId }) => {
      io.to(`group_${groupId}`).emit("call-ended", { groupId });
    });

    // WebRTC Signaling
    socket.on("offer", ({ groupId, offer, recipientId }) => {
      if (activeUsers[recipientId]) {
        io.to(`user_${recipientId}`).emit("offer", { offer });
      }
    });

    socket.on("answer", ({ groupId, answer, recipientId }) => {
      if (activeUsers[recipientId]) {
        io.to(`user_${recipientId}`).emit("answer", { answer });
      }
    });

    socket.on("ice-candidate", ({ groupId, candidate, recipientId }) => {
      if (activeUsers[recipientId]) {
        io.to(`user_${recipientId}`).emit("ice-candidate", { candidate });
      }
    });

    // Handle Disconnection
    socket.on("disconnect", () => {
      delete activeUsers[userId];
      io.emit("user-status", { userId, status: "offline" });
      console.log(`User ${userId} disconnected`);
    });
  });

  // Expose activeUsers for potential use elsewhere
  io.activeUsers = activeUsers;
};

module.exports = initializeSocket;