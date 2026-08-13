import React from 'react';
import Avatar from '../Chat/Avatar';

const OnlineUsers = ({ users }) => {
  return (
    <aside className="online-users-panel">
      <div className="online-users-header">
        <span className="online-users-title">Members</span>
        <span className="online-users-count">{users.length} online</span>
      </div>

      <div className="online-users-list">
        {users.length === 0 ? (
          <div className="online-users-empty">No one else here yet</div>
        ) : (
          users.map((u, i) => (
            <div key={u.userId || i} className="online-user-row">
              <Avatar username={u.username} size={28} />
              <span className="online-user-name">{u.username}</span>
              <span className="online-dot" title="Online" />
            </div>
          ))
        )}
      </div>
    </aside>
  );
};

export default OnlineUsers;
