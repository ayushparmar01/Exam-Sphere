const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ExamAttempt = require('../models/ExamAttempt');
const ExamSession = require('../models/ExamSession');

let io = null;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST', 'PUT'],
      credentials: true,
    },
    pingInterval: 10000,
    pingTimeout: 5000,
    transports: ['websocket', 'polling'],
  });

  // Socket Authentication Middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) {
        // Allow unauthenticated connection only for non-sensitive public ping
        return next();
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'examsphere_enterprise_super_secret_jwt_key_2026');
      const user = await User.findById(decoded.id).select('-passwordHash');
      if (user) {
        socket.user = user;
      }
      next();
    } catch (err) {
      // Allow connection but without authenticated user context
      next();
    }
  });

  io.on('connection', (socket) => {
    // 1. Join Candidate Exam Attempt Room
    socket.on('join_attempt', async ({ attemptId }) => {
      if (!attemptId) return;

      const room = `attempt:${attemptId}`;
      socket.join(room);
      socket.attemptId = attemptId;

      // Update attempt connection status
      await ExamAttempt.findByIdAndUpdate(attemptId, {
        $set: { connectionStatus: 'CONNECTED', lastHeartbeat: new Date() },
      });

      socket.emit('joined_room', { room, timestamp: Date.now() });
    });

    // 2. Join Admin Live Monitoring Room for specific exam or platform-wide
    socket.on('join_admin_monitor', ({ examId }) => {
      // Authorization check: Only ADMIN role can join monitoring rooms
      if (socket.user && socket.user.role === 'ADMIN') {
        if (examId) {
          socket.join(`exam:${examId}:monitor`);
        }
        socket.join('admin:live_monitor');
        socket.emit('joined_monitor', { examId: examId || 'all', status: 'ACTIVE' });
      } else {
        socket.emit('error', { message: 'Unauthorized for monitoring room' });
      }
    });

    // 3. Lightweight Client Heartbeat (every 10-15 seconds)
    socket.on('heartbeat', async ({ attemptId, currentQuestionIndex, answeredCount }) => {
      if (!attemptId) return;

      const now = new Date();

      // Update session in memory / touch DB asynchronously (without hammering Mongo on every tick)
      await ExamSession.updateOne(
        { attemptId },
        { $set: { lastHeartbeat: now } }
      ).catch(() => {});

      // Broadcast candidate status delta to admin room
      if (socket.user) {
        io.to('admin:live_monitor').emit('candidate_heartbeat_delta', {
          attemptId,
          studentId: socket.user._id,
          studentName: socket.user.name,
          currentQuestionIndex,
          answeredCount,
          lastHeartbeat: now,
          connectionStatus: 'CONNECTED',
        });
      }

      socket.emit('heartbeat_ack', {
        serverTime: Date.now(),
        attemptId,
      });
    });

    // 4. Candidate Device Status Broadcast
    socket.on('device_status_update', async ({ attemptId, cameraStatus, microphoneStatus }) => {
      if (!attemptId) return;

      const updateFields = {};
      if (cameraStatus) updateFields.cameraStatus = cameraStatus;
      if (microphoneStatus) updateFields.microphoneStatus = microphoneStatus;

      await ExamAttempt.findByIdAndUpdate(attemptId, { $set: updateFields }).catch(() => {});

      io.to('admin:live_monitor').emit('candidate_device_delta', {
        attemptId,
        ...updateFields,
      });
    });

    // 5. Handle Disconnect
    socket.on('disconnect', async () => {
      if (socket.attemptId) {
        await ExamAttempt.findByIdAndUpdate(socket.attemptId, {
          $set: { connectionStatus: 'DISCONNECTED', lastHeartbeat: new Date() },
        }).catch(() => {});

        io.to('admin:live_monitor').emit('candidate_status_change', {
          attemptId: socket.attemptId,
          connectionStatus: 'DISCONNECTED',
        });
      }
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

module.exports = { initSocket, getIO };
