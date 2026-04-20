/**
 * Socket.io Client Singleton
 * Manages a single WebSocket connection to the PitchPath AI backend.
 */

import { io } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000', {
      transports: ['websocket', 'polling'],
      withCredentials: true
    });

    socket.on('connect', () => {
      console.log('[PitchPath] Connected to backend:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('[PitchPath] Disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
      console.warn('[PitchPath] Connection error:', err.message);
    });
  }

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
