const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

let io;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: function (origin, callback) {
        // Allow requests with no origin
        if (!origin) return callback(null, true);
        
        if (process.env.NODE_ENV === "production") {
          // In production, only allow specific origins
          const allowedOrigins = [
            process.env.FRONTEND_URL || "http://localhost:3000"
          ];
          if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
          } else {
            callback(null, false);
          }
        } else {
          // In development, allow all origins
          callback(null, true);
        }
      },
      methods: ["GET", "POST"],
      credentials: true,
    },
    allowEIO3: true, // Allow Engine.IO v3 clients
  });

  // Authentication middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error("Authentication error"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select("-password");

      if (!user) {
        return next(new Error("User not found"));
      }

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (error) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    

    // Join user to their personal room for targeted notifications
    socket.join(`user_${socket.userId}`);

    // Join user to admin room if they are admin
    if (socket.user.role === "Admin") {
      socket.join("admin_room");
    }

    socket.on("disconnect", () => {
    });

    // Handle joining specific post rooms for real-time comments
    socket.on("join_post", (postId) => {
      socket.join(`post_${postId}`);
    });

    socket.on("leave_post", (postId) => {
      socket.leave(`post_${postId}`);
    });
  });

  return io;
};

// Notification functions
const sendNotificationToUser = (userId, notification) => {
  if (io) {
    io.to(`user_${userId}`).emit("notification", notification);
  }
};

const sendNotificationToAdmins = (notification) => {
  if (io) {
    io.to("admin_room").emit("notification", notification);
  }
};

const sendCommentNotification = (postId, notification) => {
  if (io) {
    io.to(`post_${postId}`).emit("new_comment", notification);
  }
};

const sendLikeNotification = (userId, notification) => {
  if (io) {
    io.to(`user_${userId}`).emit("like_notification", notification);
  }
};

module.exports = {
  initializeSocket,
  sendNotificationToUser,
  sendNotificationToAdmins,
  sendCommentNotification,
  sendLikeNotification,
  getIO: () => io,
};
