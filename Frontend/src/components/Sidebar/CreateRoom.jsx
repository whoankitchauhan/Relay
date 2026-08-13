import React, { useState } from 'react';
import api from '../../utils/api';

const CreateRoom = ({ isOpen, onClose, onRoomCreated }) => {
  const [roomName, setRoomName]       = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate]     = useState(false);
  const [accessKey, setAccessKey]     = useState('');
  const [error, setError]             = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    setRoomName('');
    setDescription('');
    setIsPrivate(false);
    setAccessKey('');
    setError('');
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!roomName.trim()) { setError('Room name is required.'); return; }
    if (roomName.trim().length < 3) { setError('Room name must be at least 3 characters long.'); return; }
    if (isPrivate && !accessKey.trim()) { setError('Access key is required for private rooms.'); return; }

    setIsSubmitting(true);
    setError('');
    try {
      const res = await api.post('/api/rooms', {
        name: roomName,
        description,
        isPrivate,
        accessKey: isPrivate ? accessKey : ''
      });
      onRoomCreated(res.data);
      handleClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <h2 className="modal-title">Create a room</h2>

        {error && <div className="error-banner" role="alert">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="roomName">Room name</label>
            <input
              className="form-input"
              type="text"
              id="roomName"
              placeholder="e.g. design-team"
              value={roomName}
              onChange={e => { setRoomName(e.target.value); setError(''); }}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="roomDesc">Description <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
            <input
              className="form-input"
              type="text"
              id="roomDesc"
              placeholder="What is this room about?"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <input
              type="checkbox"
              id="isPrivate"
              checked={isPrivate}
              onChange={e => { setIsPrivate(e.target.checked); if (!e.target.checked) setAccessKey(''); }}
              style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--color-brand)' }}
            />
            <label htmlFor="isPrivate" style={{ cursor: 'pointer', fontSize: 'var(--text-sm)', color: 'var(--text-primary)', fontWeight: 'var(--fw-medium)', userSelect: 'none' }}>
              Private room — require an access key to join
            </label>
          </div>

          {isPrivate && (
            <div className="form-group">
              <label className="form-label" htmlFor="accessKey">Access key</label>
              <input
                className="form-input"
                type="text"
                id="accessKey"
                placeholder="Choose a key people will use to join"
                value={accessKey}
                onChange={e => setAccessKey(e.target.value)}
                required={isPrivate}
              />
            </div>
          )}

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Creating…' : 'Create room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRoom;
