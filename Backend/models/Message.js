const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  senderUsername: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: [true, 'Message content cannot be empty'],
    trim: true
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file'],
    default: 'text'
  },
  reactions: [{
    username: { type: String, required: true },
    reaction: { type: String, required: true }
  }],
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Indexing for quick pagination/queries of message history by room/timestamp
MessageSchema.index({ room: 1, timestamp: -1 });

module.exports = mongoose.model('Message', MessageSchema);
