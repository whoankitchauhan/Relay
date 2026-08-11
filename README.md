# Relay - Real-Time Chat Room Application

Relay is a premium MERN-stack real-time chat room application powered by Socket.io, utilizing MongoDB + Mongoose for data persistence, and a custom-styled React frontend with standard CSS variables.

---

## Folder Structure

```
Relay/
├── chat-app-backend/       # Node.js + Express API & Socket.io Server
│   ├── models/             # Mongoose schemas (User, Room, Message)
│   ├── routes/             # Authentication & Room endpoints
│   ├── socket/             # Socket.io connection logic
│   └── server.js           # Server configuration entrypoint
└── chat-app-frontend/      # React client SPA
    ├── src/
    │   ├── components/     # UI elements (Auth, Chat, Sidebar)
    │   ├── context/        # React Contexts (AuthContext, SocketContext)
    │   ├── utils/          # API & Socket helpers
    │   └── styles/         # Global App styling (CSS variables)
    └── public/             # Main HTML context
```

---

## 🛠️ Tech Stack Details

- **Backend**: Node.js, Express.js, MongoDB, Mongoose, Socket.io
- **Frontend**: React (SPA), Socket.io Client, Axios, React Router (v6)
- **Styling**: Pure CSS + responsive layout grid and smooth keyframe animations
- **Authentication**: JWT token storage, password encryption (`bcryptjs`)

---

## 🚀 Setup & Execution Guide

### Prerequisite
Make sure you have MongoDB Server running on your system (defaulting to `mongodb://localhost:27017`).

### 1. Backend Launch
1. Open terminal and navigate to `chat-app-backend/`
2. Install packages:
   ```bash
   npm install
   ```
3. Copy environment settings or create `.env`:
   ```bash
   cp .env.example .env
   ```
4. Start development server:
   ```bash
   npm run dev
   ```
   *(Running on `http://localhost:5000`)*

### 2. Frontend Launch
1. Open terminal and navigate to `chat-app-frontend/`
2. Install packages:
   ```bash
   npm install
   ```
3. Start development bundle:
   ```bash
   npm start
   ```
   *(Running on `http://localhost:3000`)*

---

## 📋 API Endpoints Documentation

### Authentication (`/api/auth`)
* `POST /register`: Registers new users. Payload: `{ username, email, password }`
* `POST /login`: Validates credentials and yields authorization token. Payload: `{ usernameOrEmail, password }`
* `GET /verify`: Authenticates current JWT authorization header token.

### Rooms (`/api/rooms`)
* `POST /`: Creates new rooms. Payload: `{ name, description }`
* `GET /`: Lists all available rooms.
* `GET /:id`: Details of a specific room.
* `POST /:id/join`: Joins a room.
* `GET /:id/messages?before=<timestamp>&limit=50`: History pagination.

---

## 🔌 Socket.io Events

### Client → Server Events
* `joinRoom`: `{ roomId, username, userId }` — Joins room. Updates status.
* `chatMessage`: `{ roomId, userId, username, message }` — Submits message.
* `typing`: `{ roomId, username }` — Broadcasts typing activity.
* `leaveRoom`: `{ roomId, username }` — Departs room.
* `disconnect` — Automatically drops member listings.

### Server → Client Events
* `loadHistory`: `[messages]` — Yields existing chat archive.
* `message`: `newMessage` — Synchronizes messages.
* `onlineUsers`: `[users]` — Updates member lists.
* `userJoined` / `userLeft` — System notification text.
* `typing`: `{ username }` — Typing status updates.

---

## 🌐 Deployment Guidelines

### Backend (e.g. Render / Railway)
1. Commit and push backend code to Git repo.
2. Define Environment Configs:
   - `PORT`: `5000` (or dynamic)
   - `MONGO_URI`: Atlas Cloud cluster connection string.
   - `JWT_SECRET`: Random hash.
3. Build command: `npm install`
4. Start command: `npm start`

### Frontend (e.g. Vercel / Netlify)
1. Define env vars:
   - `REACT_APP_API_URL`: Backend live URL.
   - `REACT_APP_SOCKET_URL`: Backend live URL.
2. Setup React build proxy rules or ensure absolute production endpoint URLs are matched in configs.
3. Build command: `npm run build`
4. Deploy folder target: `build`
