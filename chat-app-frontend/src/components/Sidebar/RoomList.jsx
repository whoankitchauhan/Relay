import React, { useState } from 'react';

const RoomList = ({ rooms, activeRoom, onRoomSelect }) => {
  const [search, setSearch] = useState('');

  const filtered = rooms.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  // Get initials for room avatar
  const initials = (name) => name ? name.substring(0, 2).toUpperCase() : '??';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <div className="sidebar-search">
        <input
          className="sidebar-search-input"
          type="text"
          placeholder="Search rooms…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="room-list-label">Rooms</div>

      <div className="room-list">
        {filtered.length === 0 ? (
          <div className="room-list-empty">
            {search ? 'No rooms match your search.' : 'No rooms yet. Create one!'}
          </div>
        ) : (
          filtered.map(room => (
            <div
              key={room._id}
              className={`room-item ${activeRoom?._id === room._id ? 'active' : ''}`}
              onClick={() => onRoomSelect(room)}
            >
              <div className="room-item-avatar">
                {initials(room.name)}
              </div>
              <div className="room-item-body">
                <div className="room-item-name">
                  {room.name}
                  {room.isPrivate && (
                    <span className="room-private-badge" title="Private room">🔒</span>
                  )}
                </div>
                <div className="room-item-desc">
                  {room.description || 'No description'}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RoomList;
