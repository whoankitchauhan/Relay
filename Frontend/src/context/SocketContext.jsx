import React, { createContext, useState, useEffect, useContext } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    // Only connect socket when user is logged in
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      setIsConnected(false);
      return;
    }

    const socketUrl = import.meta.env.VITE_APP_SOCKET_URL || window.location.origin;
    console.log(`[Socket Client] Connecting to: ${socketUrl}`);
    
    const socketInstance = io(socketUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socketInstance.on('connect', () => {
      console.log('[Socket Client] Connected!');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('[Socket Client] Disconnected!');
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (err) => {
      console.error('[Socket Client] Connection error:', err);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
