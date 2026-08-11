import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { SocketContext } from '../../context/SocketContext';
import RoomList from '../Sidebar/RoomList';
import OnlineUsers from '../Sidebar/OnlineUsers';
import CreateRoom from '../Sidebar/CreateRoom';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';
import Avatar from './Avatar';
import ConfirmModal from './ConfirmModal';
import api from '../../utils/api';

// ── SVG Icons ────────────────────────────────────────────────────────────────
const LogOutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const MoonIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);

const SunIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/>
    <line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/>
    <line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);

const MenuIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="3" y1="6"  x2="21" y2="6"/>
    <line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);

const ArrowLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/>
    <polyline points="12 19 5 12 12 5"/>
  </svg>
);

const LockIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

// ── ChatRoom ─────────────────────────────────────────────────────────────────
const ChatRoom = () => {
  const { user, logout } = useContext(AuthContext);
  const { socket, isConnected } = useContext(SocketContext);

  const [rooms, setRooms]               = useState([]);
  const [activeRoom, setActiveRoom]     = useState(null);
  const [messages, setMessages]         = useState([]);
  const [onlineUsers, setOnlineUsers]   = useState([]);
  const [typingUsers, setTypingUsers]   = useState([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [hasMoreOlder, setHasMoreOlder] = useState(true);
  const [sidebarOpen, setSidebarOpen]   = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [joinAccessKey, setJoinAccessKey]   = useState('');
  const [joinError, setJoinError]           = useState('');
  const [isJoining, setIsJoining]           = useState(false);
  const [isDark, setIsDark]             = useState(
    () => document.documentElement.getAttribute('data-theme') === 'dark'
  );

  // Reset join form when room changes
  useEffect(() => {
    setJoinAccessKey('');
    setJoinError('');
    setIsJoining(false);
  }, [activeRoom?._id]);

  // Theme toggle
  const toggleTheme = () => {
    const next = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('relay-theme', next);
    setIsDark(!isDark);
  };

  // Fetch all rooms
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await api.get('/api/rooms');
        setRooms(res.data);
        if (res.data.length > 0) setActiveRoom(res.data[0]);
      } catch (err) {
        console.error('Error fetching rooms:', err);
      }
    };
    fetchRooms();
  }, []);

  // Global room creation socket event
  useEffect(() => {
    if (!socket) return;
    const handler = (newRoom) => {
      setRooms(prev => prev.some(r => r._id === newRoom._id) ? prev : [newRoom, ...prev]);
    };
    socket.on('roomCreated', handler);
    return () => socket.off('roomCreated', handler);
  }, [socket]);

  // Room socket events
  useEffect(() => {
    if (!activeRoom?._id || !socket) return;
    const { _id: roomId } = activeRoom;

    socket.emit('joinRoom', { roomId, username: user.username, userId: user.id });
    setMessages([]);
    setOnlineUsers([]);
    setTypingUsers([]);
    setHasMoreOlder(true);

    const onMessage    = (msg) => setMessages(p => [...p, msg]);
    const onHistory    = (h)   => { setMessages(h); if (h.length < 50) setHasMoreOlder(false); };
    const onOnline     = (u)   => setOnlineUsers(u);
    const onJoined     = (m)   => setMessages(p => [...p, { isSystem: true, content: m.message, timestamp: new Date() }]);
    const onLeft       = (m)   => setMessages(p => [...p, { isSystem: true, content: m.message, timestamp: new Date() }]);
    const onTyping     = ({ username: u, isTyping }) => {
      if (u === user.username) return;
      setTypingUsers(p => isTyping ? (p.includes(u) ? p : [...p, u]) : p.filter(x => x !== u));
    };
    const onReaction   = ({ messageId, reactions }) =>
      setMessages(p => p.map(m => m._id === messageId ? { ...m, reactions } : m));

    socket.on('message',        onMessage);
    socket.on('loadHistory',    onHistory);
    socket.on('onlineUsers',    onOnline);
    socket.on('userJoined',     onJoined);
    socket.on('userLeft',       onLeft);
    socket.on('typing',         onTyping);
    socket.on('reactionUpdate', onReaction);

    return () => {
      socket.emit('leaveRoom', { roomId, username: user.username });
      socket.off('message',        onMessage);
      socket.off('loadHistory',    onHistory);
      socket.off('onlineUsers',    onOnline);
      socket.off('userJoined',     onJoined);
      socket.off('userLeft',       onLeft);
      socket.off('typing',         onTyping);
      socket.off('reactionUpdate', onReaction);
      setTypingUsers([]);
    };
  }, [activeRoom?._id, socket?.id, user.id, user.username]);

  const handleSendMessage = (content) => {
    if (!socket || !activeRoom) return;
    socket.emit('chatMessage', { roomId: activeRoom._id, userId: user.id, username: user.username, message: content });
  };

  const handleReact = (messageId, emoji) => {
    if (!socket || !activeRoom) return;
    socket.emit('messageReaction', { roomId: activeRoom._id, messageId, username: user.username, reaction: emoji });
  };

  const handleTyping = (isTyping) => {
    if (!socket || !activeRoom) return;
    socket.emit('typing', { roomId: activeRoom._id, username: user.username, isTyping });
  };

  const handleLoadOlder = async () => {
    if (!messages.length) return;
    try {
      const res = await api.get(`/api/rooms/${activeRoom._id}/messages?before=${messages[0].timestamp}&limit=50`);
      if (!res.data.length) { setHasMoreOlder(false); return; }
      if (res.data.length < 50) setHasMoreOlder(false);
      setMessages(p => [...res.data, ...p]);
    } catch (err) {
      console.error('Error fetching older messages:', err);
    }
  };

  const handleRoomCreated = (room) => setActiveRoom(room);

  const handleRoomSelect  = (room) => {
    setActiveRoom(room);
    setSidebarOpen(false);
  };

  const handleJoinSubmit = async (e) => {
    e.preventDefault();
    if (activeRoom.isPrivate && !joinAccessKey.trim()) {
      setJoinError('Access key is required.');
      return;
    }
    setIsJoining(true);
    setJoinError('');
    try {
      const res = await api.post(`/api/rooms/${activeRoom._id}/join`, { accessKey: joinAccessKey });
      setRooms(p => p.map(r => r._id === activeRoom._id ? res.data : r));
      setActiveRoom(res.data);
      setJoinAccessKey('');
    } catch (err) {
      setJoinError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };

  const confirmLeave = async () => {
    if (!activeRoom) return;
    try {
      await api.post(`/api/rooms/${activeRoom._id}/leave`);
      setRooms(p => p.map(r => r._id === activeRoom._id
        ? { ...r, members: r.members.filter(m => m !== user.id) }
        : r
      ));
      setActiveRoom(null);
      setShowLeaveModal(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Something went wrong. Please try again.');
      setShowLeaveModal(false);
    }
  };

  const isMember = activeRoom?.members?.map(String).includes(String(user.id));

  return (
    <div className="app-shell">
      {/* ── Navbar ── */}
      <nav className="navbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Mobile sidebar toggle */}
          <button
            className="btn-icon"
            id="mobile-menu-btn"
            onClick={() => setSidebarOpen(v => !v)}
            aria-label="Toggle sidebar"
            style={{ display: 'none' }}
          >
            <MenuIcon />
          </button>
          <div className="navbar-brand">
            <div className="navbar-brand-icon">⚡</div>
            <span className="navbar-brand-name">Relay</span>
          </div>
        </div>

        <div className="navbar-right">
          <div className="navbar-user">
            <Avatar username={user.username} size={28} />
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
              <span className="navbar-username">{user.username}</span>
              <span className={`navbar-status ${isConnected ? '' : 'offline'}`}>
                {isConnected ? '● Online' : '○ Offline'}
              </span>
            </div>
          </div>

          <div className="navbar-divider" />

          <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>

          <button
            className="btn-icon btn-icon-danger"
            onClick={logout}
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOutIcon />
          </button>
        </div>
      </nav>

      {/* ── Workspace ── */}
      <div className="workspace">
        {/* Sidebar */}
        <aside className={`sidebar ${sidebarOpen ? 'mobile-open' : ''}`}>
          <div className="sidebar-action">
            <button className="btn btn-secondary btn-block" onClick={() => setIsCreateOpen(true)}>
              + New Room
            </button>
          </div>

          <RoomList
            rooms={rooms}
            activeRoom={activeRoom}
            onRoomSelect={handleRoomSelect}
          />
        </aside>

        {/* Chat pane */}
        {activeRoom ? (
          <>
            <main className="chat-area">
              {/* Chat header */}
              <div className="chat-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                  <button
                    className="btn-icon"
                    id="chat-back-btn"
                    onClick={() => setSidebarOpen(true)}
                    aria-label="Back to rooms"
                    style={{ display: 'none', flexShrink: 0 }}
                  >
                    <ArrowLeftIcon />
                  </button>
                  <div className="chat-header-info">
                    <div className="chat-room-name">
                      {activeRoom.name}
                      {activeRoom.isPrivate && (
                        <span style={{ marginLeft: 6, color: 'var(--text-muted)', verticalAlign: 'middle' }}>
                          <LockIcon />
                        </span>
                      )}
                    </div>
                    <div className="chat-room-meta">
                      {activeRoom.description || 'No description'} · {onlineUsers.length} online
                    </div>
                  </div>
                </div>

                <div className="chat-header-actions">
                  {isMember && (
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => setShowLeaveModal(true)}
                    >
                      Leave
                    </button>
                  )}
                </div>
              </div>

              {/* Message area or join prompt */}
              {isMember ? (
                <>
                  <MessageList
                    messages={messages}
                    currentUserId={user.id}
                    onLoadOlder={handleLoadOlder}
                    hasMoreOlder={hasMoreOlder}
                    onReact={handleReact}
                  />
                  <TypingIndicator typingUsers={typingUsers} />
                  <MessageInput onSendMessage={handleSendMessage} onTyping={handleTyping} />
                </>
              ) : (
                <div className="join-view">
                  <div className="join-card">
                    <div className="join-card-avatar">
                      {activeRoom.name.substring(0, 2).toUpperCase()}
                    </div>
                    <h2 className="join-card-title">{activeRoom.name}</h2>
                    <p className="join-card-desc">
                      {activeRoom.description || 'No description available.'}
                    </p>

                    <form className="join-card-form" onSubmit={handleJoinSubmit}>
                      {activeRoom.isPrivate && (
                        <div className="form-group">
                          <label className="form-label" htmlFor="joinAccessKey">
                            Access key
                          </label>
                          <input
                            className="form-input"
                            type="password"
                            id="joinAccessKey"
                            placeholder="Enter room access key"
                            value={joinAccessKey}
                            onChange={e => setJoinAccessKey(e.target.value)}
                            required
                          />
                        </div>
                      )}

                      {joinError && (
                        <div className="error-banner" role="alert">{joinError}</div>
                      )}

                      <button
                        className="btn btn-primary btn-block"
                        type="submit"
                        disabled={isJoining}
                        style={{ marginTop: '8px' }}
                      >
                        {isJoining ? 'Joining…' : 'Join Room'}
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </main>

            {/* Online users panel */}
            {isMember && <OnlineUsers users={onlineUsers} />}
          </>
        ) : (
          /* Empty state */
          <div className="chat-area">
            <div className="empty-state">
              <div className="empty-state-icon">💬</div>
              <h2 className="empty-state-title">No room selected</h2>
              <p className="empty-state-desc">
                Create a new room or select one from the sidebar to start a conversation.
              </p>
              <button className="btn btn-primary" onClick={() => setIsCreateOpen(true)}>
                Create a room
              </button>
            </div>
          </div>
        )}
      </div>

      <CreateRoom
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onRoomCreated={handleRoomCreated}
      />

      <ConfirmModal
        isOpen={showLeaveModal}
        title="Leave room?"
        message={`Are you sure you want to leave "${activeRoom?.name}"? You can rejoin at any time.`}
        confirmText="Leave"
        cancelText="Stay"
        danger
        onConfirm={confirmLeave}
        onCancel={() => setShowLeaveModal(false)}
      />

      {/* Mobile-only CSS overrides */}
      <style>{`
        @media (max-width: 768px) {
          #mobile-menu-btn { display: flex !important; }
          #chat-back-btn   { display: flex !important; }
        }
      `}</style>
    </div>
  );
};

export default ChatRoom;
