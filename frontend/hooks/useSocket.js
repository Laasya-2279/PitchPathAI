'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { getSocket } from '@/services/socketClient';

/**
 * Hook for managing Socket.io connection and events.
 * Provides connection state and methods to emit/listen.
 */
export default function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    function onConnect() { setIsConnected(true); }
    function onDisconnect() { setIsConnected(false); }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    // Check if already connected
    if (socket.connected) {
      setIsConnected(true);
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  const on = useCallback((event, handler) => {
    const socket = socketRef.current;
    if (socket) {
      socket.on(event, handler);
      return () => socket.off(event, handler);
    }
    return () => {};
  }, []);

  const emit = useCallback((event, data) => {
    const socket = socketRef.current;
    if (socket) {
      socket.emit(event, data);
    }
  }, []);

  return { isConnected, on, emit, socket: socketRef.current };
}
