const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// ── Startup validation ──────────────────────────────────────────────────────
// Fail fast if required environment variables are missing.
const REQUIRED_ENV = ['MONGO_URI', 'JWT_SECRET'];
const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(`[FATAL] Missing required environment variables: ${missing.join(', ')}`);
  console.error('[FATAL] Copy .env.example to .env and fill in all values before starting.');
  process.exit(1);
}

// ── CORS configuration ──────────────────────────────────────────────────────
// CLIENT_URL can be a comma-separated list for multiple allowed origins.
// In development (no CLIENT_URL set), allow localhost:3000 and localhost:5173.
// In production, CLIENT_URL must be set explicitly — if it is missing we
// fall back to an empty list so that no arbitrary origin is silently allowed.
const isDev = process.env.NODE_ENV !== 'production';

const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((u) => u.trim())
  : isDev
  ? ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000', 'http://127.0.0.1:5173']
  : [];

const corsOriginHandler = (origin, callback) => {
  // Allow requests with no origin (server-to-server, curl, Postman).
  if (!origin) return callback(null, true);
  if (allowedOrigins.includes(origin)) return callback(null, true);
  callback(new Error(`Origin '${origin}' is not allowed by CORS`));
};

// ── App initialisation ──────────────────────────────────────────────────────
const app = express();
const server = http.createServer(app);

// ── Socket.io ───────────────────────────────────────────────────────────────
const io = socketIo(server, {
  cors: {
    origin: corsOriginHandler,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// ── Express middleware ──────────────────────────────────────────────────────
app.use(cors({
  origin: corsOriginHandler,
  credentials: true
}));
app.use(express.json());

// ── Database connection ─────────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB successfully connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// ── Attach Socket.io to requests ────────────────────────────────────────────
app.use((req, res, next) => {
  req.io = io;
  next();
});

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/rooms', require('./routes/rooms'));

// Base route
app.get('/', (req, res) => {
  res.send('Relay Backend Server is running...');
});

// ── Socket.io handler ────────────────────────────────────────────────────────
require('./socket/socketHandler')(io);

// ── Global error handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong. Please try again.' });
});

// ── Start server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  if (isDev) {
    console.log(`Allowed CORS origins: ${allowedOrigins.join(', ')}`);
  }
});
