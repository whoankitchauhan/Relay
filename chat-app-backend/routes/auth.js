const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

// @route   POST api/auth/register
// @desc    Register a user
// @access  Public
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Validate inputs
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Please enter all fields' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Check if user exists
    let userByEmail = await User.findOne({ email: email.toLowerCase() });
    if (userByEmail) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    let userByUsername = await User.findOne({ username });
    if (userByUsername) {
      return res.status(400).json({ message: 'Username is already taken' });
    }

    const newUser = new User({
      username,
      email: email.toLowerCase(),
      password
    });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    newUser.password = await bcrypt.hash(password, salt);

    await newUser.save();

    // Create JWT
    const payload = {
      id: newUser._id,
      username: newUser.username,
      email: newUser.email
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          user: {
            id: newUser._id,
            username: newUser.username,
            email: newUser.email
          }
        });
      }
    );
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  const { usernameOrEmail, password } = req.body;

  try {
    if (!usernameOrEmail || !password) {
      return res.status(400).json({ message: 'Please enter all fields' });
    }

    // Search by username or email
    let user = await User.findOne({
      $or: [
        { email: usernameOrEmail.toLowerCase() },
        { username: usernameOrEmail }
      ]
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Match password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const payload = {
      id: user._id,
      username: user.username,
      email: user.email
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          user: {
            id: user._id,
            username: user.username,
            email: user.email
          }
        });
      }
    );
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/auth/verify
// @desc    Verify current token and return user details
// @access  Private
router.get('/verify', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      id: user._id,
      username: user.username,
      email: user.email
    });
  } catch (err) {
    console.error('Verification error:', err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
