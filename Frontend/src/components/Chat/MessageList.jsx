import React, { useEffect, useRef } from 'react';
import Message from './Message';

const MessageList = ({ messages, currentUserId, onLoadOlder, hasMoreOlder, onReact }) => {
  const bottomRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="message-list">
      {hasMoreOlder && (
        <button className="load-more-btn" onClick={onLoadOlder}>
          Load earlier messages
        </button>
      )}

      {messages.length === 0 ? (
        <div style={{ margin: 'auto', textAlign: 'center' }}>
          <div className="system-msg">No messages yet — say hello! 👋</div>
        </div>
      ) : (
        messages.map((msg, i) => {
          // System message
          if (msg.isSystem || msg.senderUsername === 'System') {
            return (
              <div key={msg._id || i} className="system-msg">
                {msg.content}
              </div>
            );
          }
          return (
            <Message
              key={msg._id || i}
              msg={msg}
              isOwnMessage={String(msg.sender) === String(currentUserId)}
              onReact={onReact}
            />
          );
        })
      )}

      <div ref={bottomRef} />
    </div>
  );
};

export default MessageList;
