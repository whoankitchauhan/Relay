const Message = require('../models/Message');
const Room = require('../models/Room');

// Keep track of active users in each room
// Structure: { roomId: [ { socketId, userId, username } ] }
const activeRoomUsers = {};

// Helper to remove a socket from all rooms they are in
const removeUserFromAllRooms = (socket, io) => {
  const socketId = socket.id;
  
  for (const roomId in activeRoomUsers) {
    const initialLength = activeRoomUsers[roomId].length;
    activeRoomUsers[roomId] = activeRoomUsers[roomId].filter(user => user.socketId !== socketId);
    
    if (activeRoomUsers[roomId].length !== initialLength) {
      const userWhoLeft = socket.username || 'Someone';
      
      // Update online list without posting timeline exit notifications
      io.to(roomId).emit('onlineUsers', activeRoomUsers[roomId]);
      console.log(`[Socket] ${userWhoLeft} removed from room ${roomId} due to disconnect`);
    }

    // Clean up empty room listings
    if (activeRoomUsers[roomId].length === 0) {
      delete activeRoomUsers[roomId];
    }
  }
};

module.exports = function(io) {
  io.on('connection', (socket) => {
    console.log(`[Socket] New connection established: ${socket.id}`);

    // Join Room Event
    socket.on('joinRoom', async ({ roomId, username, userId }) => {
      try {
        if (!roomId || !username || !userId) {
          console.log('[Socket] Invalid joinRoom payload');
          return;
        }

        // Store user details on socket session for disconnect cleanup
        socket.username = username;
        socket.userId = userId;

        // Join the socket room channel
        socket.join(roomId);
        console.log(`[Socket] User ${username} (${userId}) joined room ${roomId}`);

        // Add to active users for the room
        if (!activeRoomUsers[roomId]) {
          activeRoomUsers[roomId] = [];
        }

        // Prevent duplicate socket listings for same user in same room
        const userExists = activeRoomUsers[roomId].some(u => u.userId === userId);
        if (!userExists) {
          activeRoomUsers[roomId].push({
            socketId: socket.id,
            userId,
            username
          });

          // Broadcast to room members that a user joined - only when newly joined
          socket.to(roomId).emit('userJoined', {
            username,
            message: `${username} has joined the room`
          });
        } else {
          // Update socketId in case user refreshed or reconnected
          activeRoomUsers[roomId] = activeRoomUsers[roomId].map(u => 
            u.userId === userId ? { ...u, socketId: socket.id } : u
          );
        }

        // Send active users list to everyone in the room
        io.to(roomId).emit('onlineUsers', activeRoomUsers[roomId]);

        // Load history and send to the user who just joined
        const history = await Message.find({ room: roomId })
          .sort({ timestamp: -1 })
          .limit(50);
        
        // Reverse history to send in correct chronological order
        socket.emit('loadHistory', history.reverse());

      } catch (err) {
        console.error('[Socket] Join room error:', err);
      }
    });

    // Chat Message Event
    socket.on('chatMessage', async ({ roomId, userId, username, message }) => {
      try {
        if (!roomId || !userId || !username || !message || !message.trim()) {
          return;
        }

        // Save message to MongoDB
        const newMessage = new Message({
          room: roomId,
          sender: userId,
          senderUsername: username,
          content: message.trim(),
          messageType: 'text'
        });

        await newMessage.save();

        // Broadcast the message to all clients in the room (including sender)
        io.to(roomId).emit('message', newMessage);

      } catch (err) {
        console.error('[Socket] Chat message error:', err);
      }
    });

    // Typing Indicator Event
    socket.on('typing', ({ roomId, username, isTyping }) => {
      // Broadcast typing event to other users in the room
      socket.to(roomId).emit('typing', { username, isTyping });
    });

    // Message Reaction Event
    socket.on('messageReaction', async ({ roomId, messageId, username, reaction }) => {
      try {
        if (!roomId || !messageId || !username || !reaction) return;

        const message = await Message.findById(messageId);
        if (!message) return;

        // Check if user already reacted with this emoji
        const existingReactionIndex = message.reactions.findIndex(
          (r) => r.username === username
        );

        if (existingReactionIndex > -1) {
          if (message.reactions[existingReactionIndex].reaction === reaction) {
            // Remove reaction if clicked same emoji again
            message.reactions.splice(existingReactionIndex, 1);
          } else {
            // Update reaction emoji
            message.reactions[existingReactionIndex].reaction = reaction;
          }
        } else {
          // Add new reaction
          message.reactions.push({ username, reaction });
        }

        await message.save();

        // Broadcast reaction updates to everyone in the room
        io.to(roomId).emit('reactionUpdate', {
          messageId,
          reactions: message.reactions
        });

      } catch (err) {
        console.error('[Socket] Message reaction error:', err);
      }
    });

    // Leave Room Event
    socket.on('leaveRoom', ({ roomId, username }) => {
      console.log(`[Socket] User ${username} leaving room ${roomId}`);
      socket.leave(roomId);
      
      if (activeRoomUsers[roomId]) {
        activeRoomUsers[roomId] = activeRoomUsers[roomId].filter(user => user.socketId !== socket.id);
        
        // Update online list without posting timeline exit notifications
        io.to(roomId).emit('onlineUsers', activeRoomUsers[roomId]);

        if (activeRoomUsers[roomId].length === 0) {
          delete activeRoomUsers[roomId];
        }
      }
    });

    // Disconnect Event
    socket.on('disconnect', () => {
      console.log(`[Socket] Connection disconnected: ${socket.id}`);
      removeUserFromAllRooms(socket, io);
    });
  });
};
