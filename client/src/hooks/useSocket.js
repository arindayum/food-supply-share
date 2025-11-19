import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

// ✅ Named export: useSocket
export function useSocket() {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('userToken');

    if (!token) {
      setError('No authentication token found for Socket.IO connection.');
      return;
    }

    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      setError(null);
      console.log('Socket.IO connected.');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Socket.IO disconnected.');
    });

    socket.on('connect_error', (err) => {
      console.error('Socket.IO connection error:', err.message);
      setError(err.message);
      setIsConnected(false);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    error,
  };
}
