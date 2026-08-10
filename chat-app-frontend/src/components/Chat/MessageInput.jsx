import React, { useState, useRef, useEffect } from 'react';

// Send icon
const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);

const MessageInput = ({ onSendMessage, onTyping }) => {
  const [text, setText]             = useState('');
  const [isTyping, setIsTyping]     = useState(false);
  const timeoutRef                  = useRef(null);

  const send = () => {
    if (!text.trim()) return;
    onSendMessage(text);
    setText('');
    if (isTyping) {
      setIsTyping(false);
      onTyping?.(false);
    }
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const handleChange = (e) => {
    setText(e.target.value);
    if (!isTyping) { setIsTyping(true); onTyping?.(true); }
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      onTyping?.(false);
    }, 3000);
  };

  useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);

  return (
    <div className="message-input-bar">
      <textarea
        className="message-input-field"
        placeholder="Message…"
        value={text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        rows={1}
        aria-label="Message input"
      />
      <button
        className="send-btn"
        onClick={send}
        disabled={!text.trim()}
        aria-label="Send message"
      >
        <SendIcon />
      </button>
    </div>
  );
};

export default MessageInput;
