const onlineUsers = new Map(); // userId -> socketId

const initSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // User comes online
    socket.on('user_online', (userId) => {
      onlineUsers.set(userId, socket.id);
      socket.join(userId); // join room = userId for direct messages
      io.emit('online_users', Array.from(onlineUsers.keys()));
    });

    // Typing indicator
    socket.on('typing', ({ to }) => {
      const receiverSocket = onlineUsers.get(to);
      if (receiverSocket) io.to(receiverSocket).emit('typing', { from: socket.userId });
    });

    socket.on('stop_typing', ({ to }) => {
      const receiverSocket = onlineUsers.get(to);
      if (receiverSocket) io.to(receiverSocket).emit('stop_typing');
    });

    socket.on('disconnect', () => {
      for (const [userId, sid] of onlineUsers.entries()) {
        if (sid === socket.id) { onlineUsers.delete(userId); break; }
      }
      io.emit('online_users', Array.from(onlineUsers.keys()));
      console.log(`❌ Socket disconnected: ${socket.id}`);
    });
  });
};

const getOnlineUsers = () => Array.from(onlineUsers.keys());

module.exports = { initSocket, getOnlineUsers };
