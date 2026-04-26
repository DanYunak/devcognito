const { Server } = require('socket.io');

const initSocket = (httpServer, corsOrigin) => {
  const io = new Server(httpServer, {
    cors: {
      origin: corsOrigin,
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    socket.emit('chat:connected', { message: 'Socket connected' });

    socket.on('disconnect', () => {
      // Keep silent; no-op for now.
    });
  });

  return io;
};

module.exports = initSocket;
