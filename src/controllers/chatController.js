const { Server } = require('socket.io');

const createSocketServer = (httpServer) => {
    const io = new Server(httpServer, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
            credentials: true
        },
        transports: ['websocket', 'polling']
    });

    const rooms = new Map();

    io.on('connection', (socket) => {
        console.log('Player connected:', socket.id);

        socket.on('create_room', (data) => {
            try {
                const { roomId, playerId, playerName } = data;
                
                if (!roomId || !playerId || !playerName) {
                    console.error('Invalid room creation data:', data);
                    return;
                }

                if (!rooms.has(roomId)) {
                    rooms.set(roomId, {
                        players: [{ playerId, playerName }]
                    });
                    socket.join(roomId);
                    
                    io.emit('room_list', Array.from(rooms.entries()));
                    console.log(`Room ${roomId} created by player ${playerName}`);
                }
            } catch (error) {
                console.error('Error creating room:', error);
            }
        });

        socket.on('join_room', (data) => {
            try {
                const { roomId, playerId, playerName } = data;
                
                if (!roomId || !playerId || !playerName) {
                    console.error('Invalid join room data:', data);
                    return;
                }

                console.log(`Join room attempt - Room: ${roomId}, Player: ${playerName}`);
                
                if (rooms.has(roomId)) {
                    const room = rooms.get(roomId);
                    
                    if (room.players.length < 2) {
                        room.players.push({ playerId, playerName });
                        socket.join(roomId);
                        
                        io.to(roomId).emit('player_joined', {
                            roomId,
                            players: room.players
                        });
                        
                        io.emit('room_list', Array.from(rooms.entries()));
                        console.log(`Player ${playerName} joined room ${roomId}`);
                    } else {
                        console.log(`Room ${roomId} is full`);
                        socket.emit('room_full', { roomId });
                    }
                } else {
                    console.log(`Room ${roomId} not found`);
                    socket.emit('room_not_found', { roomId });
                }
            } catch (error) {
                console.error('Error joining room:', error);
            }
        });

        socket.on('send_message', (data) => {
            try {
                const { roomId, playerId, playerName, message } = data;
                
                if (!roomId || !playerId || !playerName || !message) {
                    console.error('Invalid message data:', data);
                    return;
                }

                console.log(`Player ${playerName} (${playerId}) sent message in room ${roomId}: ${message}`);

                io.to(roomId).emit('receive_message', {
                    roomId,
                    playerId,
                    playerName,  // Include playerName in the message data
                    message
                });
            } catch (error) {
                console.error('Error sending message:', error);
            }
        });

        socket.on('disconnect', () => {
            try {
                rooms.forEach((room, roomId) => {
                    const index = room.players.findIndex(player => player.playerId === socket.id);
                    if (index !== -1) {
                        room.players.splice(index, 1);
                        
                        if (room.players.length === 0) {
                            rooms.delete(roomId);
                        }
                        
                        io.emit('room_list', Array.from(rooms.entries()));
                    }
                });
                
                console.log('Player disconnected:', socket.id);
            } catch (error) {
                console.error('Error handling disconnect:', error);
            }
        });

        // Emit the current list of rooms to the client on connection
        socket.emit('room_list', Array.from(rooms.entries()));
    });

    io.on('error', (error) => {
        console.error('Socket.IO Error:', error);
    });

    console.log('Socket server running');
};

module.exports = { createSocketServer };
