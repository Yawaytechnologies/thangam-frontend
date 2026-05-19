import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../stores/auth.store';

export function useNotificationSocket() {
  const socketRef = useRef<Socket | null>(null);
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!accessToken) return;

    const socket = io(`${import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001'}/notifications`, {
      auth: { token: accessToken },
    });

    socket.on('notification:new', () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'latest'] });
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [accessToken, queryClient]);

  return socketRef;
}
