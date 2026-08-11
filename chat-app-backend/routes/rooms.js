const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const auth = require('../middleware/auth');
const Room = require('../models/Room');
const Message = require('../models/Message');

const GENERIC_ERROR = 'Something went wrong. Please try again.';

// @route   POST api/rooms
// @desc    Create a new chat room
// @access  Private
router.post('/', auth, async (req, res) => {
  const { name, description, isPrivate, accessKey } = req.body;

  try {
    if (!name?.trim()) {
      return res.status(400).json({ message: 'Room name is required.' });
    }
    if (name.trim().length < 3) {
      return res.status(400).json({ message: 'Room name must be at least 3 characters long.' });
    }

    if (isPrivate && !accessKey?.trim()) {
      return res.status(400).json({ message: 'Access key is required for private rooms.' });
    }

    // Check if room name exists
    let room = await Room.findOne({ name: name.trim() });
    if (room) {
      return res.status(409).json({ message: 'A room with this name already exists.' });
    }

    // Hash the access key before storing — never store plaintext keys
    let hashedAccessKey = '';
    if (isPrivate && accessKey) {
      const salt = await bcrypt.genSalt(10);
      hashedAccessKey = await bcrypt.hash(accessKey.trim(), salt);
    }

    const newRoom = new Room({
      name: name.trim(),
      description: description || '',
      createdBy: req.user.id,
      members: [req.user.id], // Creator is the first member
      isPrivate: !!isPrivate,
      accessKey: hashedAccessKey
    });

    await newRoom.save();

    // Broadcast the new room to all connected sockets
    if (req.io) {
      req.io.emit('roomCreated', newRoom);
    }

    res.status(201).json(newRoom);
  } catch (err) {
    console.error('Create room error:', err.message);
    if (err.code === 11000) {
      return res.status(409).json({ message: 'A room with this name already exists.' });
    }
    res.status(500).json({ message: GENERIC_ERROR });
  }
});

// @route   GET api/rooms
// @desc    Get all chat rooms
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const rooms = await Room.find()
      .populate('createdBy', 'username email')
      .sort({ createdAt: -1 });
    res.json(rooms);
  } catch (err) {
    console.error('Get rooms error:', err.message);
    res.status(500).json({ message: GENERIC_ERROR });
  }
});

// @route   GET api/rooms/:id
// @desc    Get a single room details
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate('createdBy', 'username email')
      .populate('members', 'username');

    if (!room) {
      return res.status(404).json({ message: 'Room not found.' });
    }
    res.json(room);
  } catch (err) {
    console.error('Get room error:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Room not found.' });
    }
    res.status(500).json({ message: GENERIC_ERROR });
  }
});

// @route   POST api/rooms/:id/join
// @desc    Join a room
// @access  Private
router.post('/:id/join', auth, async (req, res) => {
  const { accessKey } = req.body;

  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found.' });
    }

    const isAlreadyMember = room.members.map(m => m.toString()).includes(req.user.id);

    // Verify access key if room is private and user is not already a member
    if (room.isPrivate && !isAlreadyMember) {
      if (!accessKey?.trim()) {
        return res.status(400).json({ message: 'Access key is required for this private room.' });
      }
      // Compare provided key against the stored bcrypt hash
      const isKeyValid = await bcrypt.compare(accessKey.trim(), room.accessKey);
      if (!isKeyValid) {
        return res.status(401).json({ message: 'The access key is incorrect.' });
      }
    }

    // Add member if not already added
    if (!isAlreadyMember) {
      room.members.push(req.user.id);
      await room.save();
    }

    res.json(room);
  } catch (err) {
    console.error('Join room error:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Room not found.' });
    }
    res.status(500).json({ message: GENERIC_ERROR });
  }
});

// @route   POST api/rooms/:id/leave
// @desc    Leave/Exit a group room explicitly
// @access  Private
router.post('/:id/leave', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found.' });
    }

    // Remove user from room members array
    room.members = room.members.filter(m => m.toString() !== req.user.id);
    await room.save();

    // Broadcast userLeftChat system event to notify online group members in real-time
    if (req.io) {
      req.io.to(req.params.id).emit('userLeftChat', {
        userId: req.user.id,
        username: req.user.username,
        message: `${req.user.username} left the chat`
      });
    }

    // Save a system log message to the room database so it persists in history
    const leftMessage = new Message({
      room: req.params.id,
      sender: req.user.id,
      senderUsername: 'System',
      content: `${req.user.username} left the chat`,
      messageType: 'text'
    });
    await leftMessage.save();

    // Broadcast the system message to feed
    if (req.io) {
      req.io.to(req.params.id).emit('message', leftMessage);
    }

    res.json({ message: 'You left the room.', roomId: req.params.id });
  } catch (err) {
    console.error('Leave room error:', err.message);
    res.status(500).json({ message: GENERIC_ERROR });
  }
});

// @route   GET api/rooms/:id/messages
// @desc    Get historical messages for a room with cursor/timestamp pagination
// @access  Private
router.get('/:id/messages', auth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const before = req.query.before; // ISO String timestamp

    const query = { room: req.params.id };
    if (before) {
      query.timestamp = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .sort({ timestamp: -1 }) // Get newest first to paginate correctly backwards
      .limit(limit);

    // Return messages in chronological order (oldest to newest)
    res.json(messages.reverse());
  } catch (err) {
    console.error('Get messages error:', err.message);
    res.status(500).json({ message: GENERIC_ERROR });
  }
});

module.exports = router;
