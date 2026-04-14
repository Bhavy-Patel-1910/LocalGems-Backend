const onlineUsers = new Map(); // userId -> socketId

const initSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // 🔹 User comes online
    socket.on('user_online', (userId) => {
      if (!userId) return;

      socket.userId = userId; // ✅ attach userId to socket

      onlineUsers.set(userId, socket.id);

      socket.join(userId); // private room for messages

      io.emit('online_users', Array.from(onlineUsers.keys()));

      console.log(`🟢 User online: ${userId}`);
    });

    // 🔹 Send message (optional real-time emit)
    socket.on('send_message', ({ to, message }) => {
      const receiverSocket = onlineUsers.get(to);

      if (receiverSocket) {
        io.to(receiverSocket).emit('receive_message', {
          from: socket.userId,
          message,
        });
      }
    });

    // 🔹 Typing indicator
    socket.on('typing', ({ to }) => {
      const receiverSocket = onlineUsers.get(to);

      if (receiverSocket) {
        io.to(receiverSocket).emit('typing', {
          from: socket.userId,
        });
      }
    });

    // 🔹 Stop typing
    socket.on('stop_typing', ({ to }) => {
      const receiverSocket = onlineUsers.get(to);

      if (receiverSocket) {
        io.to(receiverSocket).emit('stop_typing', {
          from: socket.userId,
        });
      }
    });

    // 🔹 Disconnect
    socket.on('disconnect', () => {
      if (socket.userId) {
        onlineUsers.delete(socket.userId);

        io.emit('online_users', Array.from(onlineUsers.keys()));

        console.log(`🔴 User offline: ${socket.userId}`);
      }

      console.log(`❌ Socket disconnected: ${socket.id}`);
    });
  });
};

// 🔹 Helper: get online users
const getOnlineUsers = () => {
  return Array.from(onlineUsers.keys());
};

module.exports = {
  initSocket,
  getOnlineUsers,
};
