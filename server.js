const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// Socket.io Setup (Memory Mode - No Redis needed for Demo)
const io = new Server(server, {
  cors: {
    origin: '*', // Allow connections from anywhere (Hostinger)
    methods: ['GET', 'POST']
  }
});

// Socket.io Connection Handler
io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);

  // Join Event Room
  socket.on('join-room', (eventId, userId) => {
    const roomName = `room_${eventId}`;
    socket.join(roomName);
    console.log(`👤 User ${userId} joined ${roomName}`);
  });

  // Handle Chat Message
  socket.on('send-message', (data) => {
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

    // Broadcast to room immediately
    io.to(roomName).emit('new-message', messageData);
    console.log(`💬 Message: ${message}`);
  });

  // Handle Tipping (Mock Logic for Demo)
  socket.on('tip-reporter', (data) => {
    const { messageId, reporterUsername, senderUsername, amount, eventId } = data;
    const roomName = `room_${eventId}`;

    // Broadcast success immediately (Skip DB check for Demo speed)
    const tipData = {
      messageId,
      senderUsername,
      reporterUsername,
      amount,
      split: { reporter: amount * 0.5, platform: amount * 0.5 }
    };

    io.to(roomName).emit('tip-success', tipData);
    io.to(roomName).emit('play-coin-sound');
    console.log(`💰 Tip: ${senderUsername} -> ${reporterUsername}`);
  });
});


// Start Server
const PORT = process.env.PORT || 3000; // Let Render decide the port
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 TheFunFanReporter Server running on port ${PORT}`);
});