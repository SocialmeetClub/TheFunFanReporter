const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { createClient } = require('redis');
const { createAdapter } = require('@socket.io/redis-adapter');
const cors = require('cors');
const axios = require('axios');

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// Redis Setup for Socket.io Adapter (AWS ElastiCache simulation)
const pubClient = createClient({ 
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379
});
const subClient = pubClient.duplicate();

// Socket.io Setup with Redis Adapter
const io = new Server(server, {
  cors: {
    origin: process.env.WORDPRESS_URL || '*',
    methods: ['GET', 'POST']
  },
  adapter: createAdapter(pubClient, subClient)
});

// Connect Redis clients
Promise.all([pubClient.connect(), subClient.connect()])
  .then(() => {
    console.log('✅ Redis adapter connected');
  })
  .catch((err) => {
    console.error('❌ Redis connection error:', err);
  });

// WordPress API Configuration
const WP_API_URL = process.env.WP_API_URL || 'http://localhost/wp-json/funfan/v1';

// Helper: Verify user balance via WordPress API
async function verifyUserBalance(userId, amount) {
  try {
    const response = await axios.get(`${WP_API_URL}/balance/${userId}`);
    return response.data.balance >= amount;
  } catch (error) {
    console.error('Error verifying balance:', error.message);
    return false;
  }
}

// Helper: Update user balance via WordPress API
async function updateUserBalance(userId, amount) {
  try {
    await axios.post(`${WP_API_URL}/update-balance`, {
      userId,
      amount
    });
    return true;
  } catch (error) {
    console.error('Error updating balance:', error.message);
    return false;
  }
}

// Socket.io Connection Handler
io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);

  // Join Event Room
  socket.on('join-room', (eventId, userId) => {
    const roomName = `room_${eventId}`;
    socket.join(roomName);
    socket.userId = userId;
    socket.currentRoom = roomName;
    console.log(`👤 User ${userId} joined ${roomName}`);
    
    // Broadcast user joined
    io.to(roomName).emit('user-joined', {
      userId,
      timestamp: Date.now()
    });
  });

  // Handle Chat Message
  socket.on('send-message', async (data) => {
    const { eventId, userId, username, message } = data;
    const roomName = `room_${eventId}`;
    
    const messageData = {
      messageId: `msg_${Date.now()}_${userId}`,
      userId,
      username,
      message,
      timestamp: Date.now(),
      tips: 0
    };

    // Store in Redis for chat history
    await pubClient.lPush(`chat:${roomName}`, JSON.stringify(messageData));
    await pubClient.lTrim(`chat:${roomName}`, 0, 99); // Keep last 100 messages

    // Broadcast to room
    io.to(roomName).emit('new-message', messageData);
  });

  // Handle Meritocracy Tipping (50/50 Split)
  socket.on('tip-reporter', async (data) => {
    const { messageId, reporterId, reporterUsername, senderId, senderUsername, amount, eventId } = data;
    const roomName = `room_${eventId}`;

    try {
      // Step 1: Verify sender has enough coins
      const hasBalance = await verifyUserBalance(senderId, amount);
      if (!hasBalance) {
        socket.emit('tip-error', {
          error: 'Insufficient balance',
          messageId
        });
        return;
      }

      // Step 2: Execute 50/50 Split Transaction
      const reporterShare = amount * 0.5;
      const adminShare = amount * 0.5;
      const adminId = process.env.ADMIN_USER_ID || 1;

      // Deduct from sender
      await updateUserBalance(senderId, -amount);
      
      // Credit reporter (50%)
      await updateUserBalance(reporterId, reporterShare);
      
      // Credit admin/platform (50%)
      await updateUserBalance(adminId, adminShare);

      // Step 3: Broadcast tip success with coin sound trigger
      const tipData = {
        messageId,
        reporterId,
        reporterUsername,
        senderId,
        senderUsername,
        amount,
        split: {
          reporter: reporterShare,
          platform: adminShare
        },
        timestamp: Date.now()
      };

      io.to(roomName).emit('tip-success', tipData);
      io.to(roomName).emit('play-coin-sound'); // Trigger coin sound on all clients

      console.log(`💰 Tip processed: ${senderUsername} → ${reporterUsername} (${amount} coins, 50/50 split)`);

    } catch (error) {
      console.error('Tip processing error:', error);
      socket.emit('tip-error', {
        error: 'Transaction failed',
        messageId
      });
    }
  });

  // Load Chat History
  socket.on('load-history', async (eventId) => {
    const roomName = `room_${eventId}`;
    try {
      const history = await pubClient.lRange(`chat:${roomName}`, 0, 49); // Last 50 messages
      const messages = history.map(msg => JSON.parse(msg)).reverse();
      socket.emit('chat-history', messages);
    } catch (error) {
      console.error('Error loading history:', error);
      socket.emit('chat-history', []);
    }
  });

  // Disconnect Handler
  socket.on('disconnect', () => {
    console.log(`🔌 User disconnected: ${socket.id}`);
    if (socket.currentRoom && socket.userId) {
      io.to(socket.currentRoom).emit('user-left', {
        userId: socket.userId,
        timestamp: Date.now()
      });
    }
  });
});

// REST API Endpoint for Tip Processing (Alternative to Socket)
app.post('/api/process-tip', async (req, res) => {
  const { senderId, reporterId, amount } = req.body;

  try {
    // Verify balance
    const hasBalance = await verifyUserBalance(senderId, amount);
    if (!hasBalance) {
      return res.status(400).json({ success: false, error: 'Insufficient balance' });
    }

    // Execute 50/50 split
    const reporterShare = amount * 0.5;
    const adminShare = amount * 0.5;
    const adminId = process.env.ADMIN_USER_ID || 1;

    await updateUserBalance(senderId, -amount);
    await updateUserBalance(reporterId, reporterShare);
    await updateUserBalance(adminId, adminShare);

    res.json({
      success: true,
      split: '50/50',
      details: {
        reporter: reporterShare,
        platform: adminShare
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'TheFunFanReporter Backend' });
});

// Start Server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 TheFunFanReporter Server running on port ${PORT}`);
  console.log(`🎮 Meritocracy Tipping: 50/50 Split Active`);
});
