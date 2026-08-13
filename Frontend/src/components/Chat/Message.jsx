import React, { useState } from 'react';

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

// Generate a stable hue from a username string
const usernameHue = (name) => {
  let h = 0;
  for (let i = 0; i < (name || '').length; i++) {
    h = name.charCodeAt(i) + ((h << 5) - h);
  }
  return Math.abs(h) % 360;
};

const Message = ({ msg, isOwnMessage, onReact }) => {
  const [showPicker, setShowPicker] = useState(false);

  const formatTime = (d) => {
    try { return new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
    catch { return ''; }
  };

  const grouped = (msg.reactions || []).reduce((acc, r) => {
    acc[r.reaction] = (acc[r.reaction] || 0) + 1;
    return acc;
  }, {});

  // Avatar color derived from sender's username
  const hue = usernameHue(msg.senderUsername);
  const avatarStyle = {
    width: 28, height: 28,
    borderRadius: '50%',
    background: `hsl(${hue}, 55%, 50%)`,
    color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.65rem', fontWeight: 600,
    userSelect: 'none', flexShrink: 0
  };

  return (
    <div
      className={`message-row ${isOwnMessage ? 'own' : 'received'}`}
      onMouseEnter={() => setShowPicker(true)}
      onMouseLeave={() => setShowPicker(false)}
    >
      {/* Avatar placeholder column (received only) */}
      {!isOwnMessage && (
        <div style={avatarStyle}>
          {(msg.senderUsername || '?').substring(0, 2).toUpperCase()}
        </div>
      )}

      <div className="message-content-col">
        {/* Sender name (received only) */}
        {!isOwnMessage && (
          <div className="message-sender-name">{msg.senderUsername}</div>
        )}

        {/* Bubble */}
        <div className="message-bubble" style={{ position: 'relative' }}>
          {showPicker && onReact && (
            <div className="reaction-picker">
              {EMOJIS.map(e => (
                <span key={e} className="reaction-emoji-btn" onClick={() => onReact(msg._id, e)}>
                  {e}
                </span>
              ))}
            </div>
          )}
          {msg.content}
        </div>

        {/* Reaction badges */}
        {Object.keys(grouped).length > 0 && (
          <div className="message-reactions">
            {Object.entries(grouped).map(([emoji, count]) => (
              <span
                key={emoji}
                className="reaction-badge"
                title={`${count} reaction${count > 1 ? 's' : ''}`}
                onClick={() => onReact(msg._id, emoji)}
              >
                {emoji}{count > 1 ? ` ${count}` : ''}
              </span>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <div className="message-time">{formatTime(msg.timestamp)}</div>
      </div>

      {/* Spacer for own message avatar side */}
      {isOwnMessage && <div style={{ width: 28, flexShrink: 0 }} />}
    </div>
  );
};

export default Message;
