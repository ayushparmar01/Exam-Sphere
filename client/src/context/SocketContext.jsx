import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socketInstance = io(window.location.origin, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socketInstance.on('connect', () => {
      setConnected(true);
    });

    socketInstance.on('disconnect', () => {
      setConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const joinAttempt = (attemptId) => {
    if (socket && attemptId) {
      socket.emit('join_attempt', {
        attemptId,
        studentId: user?._id,
      });
    }
  };

  const sendHeartbeat = (attemptId) => {
    if (socket && attemptId) {
      socket.emit('heartbeat', { attemptId });
    }
  };

  return (
    <SocketContext.Provider value={{ socket, connected, joinAttempt, sendHeartbeat }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  return useContext(SocketContext);
};
