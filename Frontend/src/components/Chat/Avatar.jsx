import React from 'react';

const Avatar = ({ username, size = 40 }) => {
  // Simple hashing function to generate a stable seed number from username
  const getHash = (str) => {
    let hash = 0;
    if (!str) return hash;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  };

  // Generate a distinct pair of HSL colors based on the username hash
  const generateGradients = (name) => {
    const hash = getHash(name);
    const h1 = hash % 360;
    const h2 = (h1 + 120) % 360; // Complementary hue

    const color1 = `hsl(${h1}, 75%, 45%)`;
    const color2 = `hsl(${h2}, 85%, 60%)`;

    return `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`;
  };

  const initials = username ? username.substring(0, 2).toUpperCase() : '??';
  const backgroundStyle = generateGradients(username);

  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        background: backgroundStyle,
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: '600',
        fontSize: `${size * 0.4}px`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        textShadow: '0 1px 2px rgba(0,0,0,0.2)',
        userSelect: 'none',
        flexShrink: 0
      }}
    >
      {initials}
    </div>
  );
};

export default Avatar;
