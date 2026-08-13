import React from 'react';

const TypingIndicator = ({ typingUsers }) => {
  if (!typingUsers || typingUsers.length === 0) {
    return <div className="typing-indicator" aria-hidden="true" />;
  }

  const text =
    typingUsers.length === 1
      ? `${typingUsers[0]} is typing`
      : typingUsers.length === 2
      ? `${typingUsers[0]} and ${typingUsers[1]} are typing`
      : 'Several people are typing';

  return (
    <div className="typing-indicator" aria-live="polite" aria-label={text}>
      <div className="typing-dots">
        <span /><span /><span />
      </div>
      <span>{text}</span>
    </div>
  );
};

export default TypingIndicator;
