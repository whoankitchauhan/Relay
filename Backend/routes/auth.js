const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

const GENERIC_ERROR = 'Something went wrong. Please try again.';
const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

// @route   POST api/auth/register
// @desc    Register a user
// @access  Public
router.post('/register', async (req, res) => {
  const username = req.body.username?.trim();
  const email = req.body.email?.trim().toLowerCase();
  const { password } = req.body;

  try {
    if (!username) {
      return res.status(400).json({ message: 'Please enter a username.' });
    }
    if (username.length < 3) {
      return res.status(400).json({ message: 'Username must be at least 3 characters long.' });
    }
    if (!email) {
      return res.status(400).json({ message: 'Please enter an email address.' });
    }
    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address.' });
    }
    if (!password) {
      return res.status(400).json({ message: 'Please enter a password.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    // Check if user exists
    let userByEmail = await User.findOne({ email });
    if (userByEmail) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    let userByUsername = await User.findOne({ username });
    if (userByUsername) {
      return res.status(409).json({ message: 'Username is already taken.' });
    }

    const newUser = new User({
      username,
      email,
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
        res.status(201).json({
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
    if (err.code === 11000) {
      if (err.keyPattern?.username) {
        return res.status(409).json({ message: 'Username is already taken.' });
      }
      if (err.keyPattern?.email) {
        return res.status(409).json({ message: 'An account with this email already exists.' });
      }
    }
    res.status(500).json({ message: GENERIC_ERROR });
  }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  const usernameOrEmail = req.body.usernameOrEmail?.trim();
  const { password } = req.body;

  try {
    if (!usernameOrEmail) {
      return res.status(400).json({ message: 'Please enter your username or email address.' });
    }
    if (!password) {
      return res.status(400).json({ message: 'Please enter your password.' });
    }

    // Search by username or email
    let user = await User.findOne({
      $or: [
        { email: usernameOrEmail.toLowerCase() },
        { username: usernameOrEmail }
      ]
    });

    if (!user) {
      return res.status(401).json({ message: 'Username/email or password is incorrect.' });
    }

    // Match password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Username/email or password is incorrect.' });
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
    res.status(500).json({ message: GENERIC_ERROR });
  }
});

// @route   GET api/auth/verify
// @desc    Verify current token and return user details
// @access  Private
router.get('/verify', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'We could not find your account. Please sign in again.' });
    }
    res.json({
      id: user._id,
      username: user.username,
      email: user.email
    });
  } catch (err) {
    console.error('Verification error:', err.message);
    res.status(500).json({ message: GENERIC_ERROR });
  }
});

module.exports = router;
