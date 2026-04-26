const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const User = require('../models/User');
const Message = require('../models/Message');
const { jwtSecret } = require('../config/env');
const { ensureChatAccess } = require('../utils/chatAccess');

const roomName = (applicationId) => `application:${applicationId}`;

const initSocket = (httpServer, corsOrigin) => {
  const io = new Server(httpServer, {
    cors: {
      origin: corsOrigin,
      credentials: true
    }
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error('Missing auth token'));
      }

      const payload = jwt.verify(token, jwtSecret);
      const user = await User.findById(payload.sub);

      if (!user) {
        return next(new Error('Unauthorized'));
      }

      socket.user = {
        id: String(user._id),
        role: user.role,
        companyId: user.company_id ? String(user.company_id) : null
      };

      return next();
    } catch (error) {
      return next(new Error('Token verification failed'));
    }
  });

  io.on('connection', (socket) => {
    socket.emit('chat:connected', { message: 'Socket connected' });

    socket.on('chat:join', async ({ applicationId }) => {
      try {
        await ensureChatAccess({ applicationId, user: socket.user });
        socket.join(roomName(applicationId));

        const messages = await Message.find({ application_id: applicationId })
          .populate('sender_id', 'role profile.fullName')
          .sort({ createdAt: 1 });

        socket.emit('chat:history', { applicationId, messages });
      } catch (error) {
        socket.emit('chat:error', {
          applicationId,
          message: error.message || 'Cannot join this chat room'
        });
      }
    });

    socket.on('chat:message', async ({ applicationId, text }) => {
      try {
        if (!text || !String(text).trim()) {
          throw new Error('Message text is required');
        }

        await ensureChatAccess({ applicationId, user: socket.user });

        const message = await Message.create({
          application_id: applicationId,
          sender_id: socket.user.id,
          text: String(text).trim()
        });

        const payload = await Message.findById(message._id).populate(
          'sender_id',
          'role profile.fullName'
        );

        io.to(roomName(applicationId)).emit('chat:message', {
          applicationId,
          message: payload
        });
      } catch (error) {
        socket.emit('chat:error', {
          applicationId,
          message: error.message || 'Cannot send message'
        });
      }
    });
  });

  return io;
};

module.exports = initSocket;
