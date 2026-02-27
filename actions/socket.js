const socketIo = require('socket.io');

let io;

// Map to store userId -> socketId
const userSockets = new Map();

module.exports = {
    init: (server) => {
        io = socketIo(server, {
            cors: {
                origin: "*", // allow all origins for now
                methods: ["GET", "POST"]
            }
        });

        io.on('connection', (socket) => {
            console.log('New client connected', socket.id);

            socket.on('user_connected', (userId) => {
                if (!userId) return;
                const uid = userId.toString();

                // Join a room unique to this user
                socket.join(uid);
                userSockets.set(uid, socket.id);

                console.log(`User ${uid} connected, joined room and paired with socket ${socket.id}`);

                // Broadcast online status
                io.emit('user_status_change', { userId: uid, status: 'online' });
            });

            socket.on('disconnect', () => {
                let disconnectedUserId = null;
                for (const [userId, socketId] of userSockets.entries()) {
                    if (socketId === socket.id) {
                        disconnectedUserId = userId;
                        userSockets.delete(userId);
                        break;
                    }
                }

                if (disconnectedUserId) {
                    console.log(`User ${disconnectedUserId} offline`);
                    io.emit('user_status_change', { userId: disconnectedUserId, status: 'offline' });
                }
            });
        });

        return io;
    },
    getIO: () => {
        if (!io) {
            throw new Error("Socket.io not initialized!");
        }
        return io;
    },
    getOnlineUsers: () => {
        return Array.from(userSockets.keys());
    }
};
