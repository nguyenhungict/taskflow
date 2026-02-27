import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextData {
    socket: Socket | null;
    onlineUsers: Set<string>;
}

const SocketContext = createContext<SocketContextData>({
    socket: null,
    onlineUsers: new Set()
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated, user } = useAuth();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (!isAuthenticated || !user) {
            if (socket) {
                socket.disconnect();
                setSocket(null);
            }
            return;
        }

        const backendUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api$/, '') : 'http://localhost:8000';

        const newSocket = io(backendUrl, {
            transports: ['websocket'],
            reconnectionAttempts: 5,
        });

        newSocket.on('connect', () => {
            console.log('socket connected with ID', newSocket.id);
            const userId = user._id || (user as any).id;
            if (userId) {
                newSocket.emit('user_connected', userId);
            }
        });

        newSocket.on('user_status_change', (data: { userId: string, status: string }) => {
            setOnlineUsers(prev => {
                const newSet = new Set(prev);
                if (data.status === 'online') {
                    newSet.add(data.userId);
                } else {
                    newSet.delete(data.userId);
                }
                return newSet;
            });
        });

        // Initialize active user list from server
        fetch(`${backendUrl}/api/socket/online-users`)
            .then(res => res.json())
            .then((data) => {
                if (data.success && data.data) {
                    setOnlineUsers(new Set(data.data));
                }
            })
            .catch(err => console.error("Could not fetch initial online users", err));

        setSocket(newSocket);

        return () => {
            newSocket.removeAllListeners();
            newSocket.disconnect();
        };
    }, [isAuthenticated, user?._id, (user as any)?.id]);

    return (
        <SocketContext.Provider value={{ socket, onlineUsers }}>
            {children}
        </SocketContext.Provider>
    );
};
