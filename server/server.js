/* ============================================
   NEON VORTEX — Multiplayer Server
   Express + Socket.IO + Room Management
   ============================================ */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { GameSimulation } = require('./game-simulation');
const { MODES, PLAYER_COLORS } = require('./constants');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: '*' },
    pingInterval: 2000,
    pingTimeout: 5000,
});

// Serve static game files
app.use(express.static(path.join(__dirname, '..')));

// Serve socket.io client
app.get('/socket.io/socket.io.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'node_modules', 'socket.io', 'client-dist', 'socket.io.min.js'));
});

// ============================================
// ROOM MANAGEMENT
// ============================================
const rooms = new Map();
const playerRooms = new Map(); // socketId -> roomId

class Room {
    constructor(id, name, mode, hostId, settings = {}) {
        this.id = id;
        this.name = name;
        this.mode = mode;
        this.hostId = hostId;
        this.settings = settings;
        this.players = new Map(); // socketId -> { name, ready, team }
        this.state = 'lobby'; // lobby | playing | finished
        this.game = null;
        this.maxPlayers = MODES[mode]?.maxPlayers || 16;
        this.minPlayers = MODES[mode]?.minPlayers || 1;
        this.createdAt = Date.now();
        this.chatHistory = [];
    }

    toPublic() {
        return {
            id: this.id,
            name: this.name,
            mode: this.mode,
            modeName: MODES[this.mode]?.name || this.mode,
            hostId: this.hostId,
            playerCount: this.players.size,
            maxPlayers: this.maxPlayers,
            minPlayers: this.minPlayers,
            state: this.state,
            players: Array.from(this.players.entries()).map(([id, p], i) => ({
                id,
                name: p.name,
                ready: p.ready,
                team: p.team,
                color: PLAYER_COLORS[i % PLAYER_COLORS.length],
                isHost: id === this.hostId,
            })),
        };
    }
}

function createRoom(hostSocket, name, mode, settings = {}) {
    const roomId = uuidv4().slice(0, 6).toUpperCase();
    const room = new Room(roomId, name, mode, hostSocket.id, settings);
    rooms.set(roomId, room);
    broadcastRoomList();
    return room;
}

function joinRoom(socket, roomId, playerName) {
    const room = rooms.get(roomId);
    if (!room) return { error: 'Room not found' };
    if (room.state !== 'lobby') return { error: 'Game already in progress' };
    if (room.players.size >= room.maxPlayers) return { error: 'Room is full' };

    room.players.set(socket.id, {
        name: playerName,
        ready: false,
        team: null,
    });
    playerRooms.set(socket.id, roomId);
    socket.join(roomId);

    broadcastRoomList();
    return { success: true, room: room.toPublic(), chatHistory: room.chatHistory };
}

function leaveRoom(socket) {
    const roomId = playerRooms.get(socket.id);
    if (!roomId) return;

    const room = rooms.get(roomId);
    if (!room) {
        playerRooms.delete(socket.id);
        return;
    }

    room.players.delete(socket.id);
    playerRooms.delete(socket.id);
    socket.leave(roomId);

    // Remove player from game simulation if playing
    if (room.game) {
        room.game.removePlayer(socket.id);
    }

    // If host left, assign new host or delete room
    if (room.hostId === socket.id) {
        const remaining = Array.from(room.players.keys());
        if (remaining.length > 0) {
            room.hostId = remaining[0];
        } else {
            // Room empty, clean up
            if (room.game) room.game.stop();
            rooms.delete(roomId);
            broadcastRoomList();
            return;
        }
    }

    io.to(roomId).emit('room_update', room.toPublic());
    broadcastRoomList();
}

function startGame(roomId) {
    const room = rooms.get(roomId);
    if (!room || room.state !== 'lobby') return;

    room.state = 'playing';
    broadcastRoomList();

    // Create game simulation
    const game = new GameSimulation(roomId, room.mode, room.settings);

    // Add all players
    for (const [socketId, playerData] of room.players) {
        const player = game.addPlayer(socketId, playerData.name);
        if (playerData.team !== null) player.team = playerData.team;
    }

    // Set up callbacks
    game.onBroadcast = (state) => {
        io.to(roomId).emit('game_state', state);
    };

    game.onEvent = (type, data) => {
        io.to(roomId).emit('game_event', { type, data });

        if (type === 'match_end') {
            room.state = 'finished';
            broadcastRoomList();
            setTimeout(() => {
                room.state = 'lobby';
                // Reset ready states
                for (const [, p] of room.players) {
                    p.ready = false;
                }
                io.to(roomId).emit('room_update', room.toPublic());
                broadcastRoomList();
            }, 5000);
        }
    };

    room.game = game;
    game.startCountdown();
}

// ============================================
// SOCKET.IO EVENT HANDLERS
// ============================================
function broadcastRoomList() {
    const roomList = Array.from(rooms.values()).map(r => r.toPublic());
    io.emit('room_list', roomList);
}
io.on('connection', (socket) => {
    console.log(`[+] Player connected: ${socket.id}`);

    // ---- Room Listing ----
    socket.on('get_rooms', (callback) => {
        const roomList = Array.from(rooms.values()).map(r => r.toPublic());
        callback(roomList);
    });

    // ---- Create Room ----
    socket.on('create_room', ({ name, mode, playerName, settings }, callback) => {
        // Leave current room if any
        leaveRoom(socket);

        const room = createRoom(socket, name || 'Neon Vortex Arena', mode || 'ffa', settings || {});
        const result = joinRoom(socket, room.id, playerName || 'Player');

        if (result.error) {
            callback({ error: result.error });
            return;
        }

        console.log(`[ROOM] Created: ${room.id} (${room.name}) by ${playerName}`);
        callback({ success: true, roomId: room.id, room: room.toPublic() });
    });

    // ---- Join Room ----
    socket.on('join_room', ({ roomId, playerName }, callback) => {
        leaveRoom(socket);
        const result = joinRoom(socket, roomId, playerName || 'Player');

        if (result.error) {
            callback({ error: result.error });
            return;
        }

        console.log(`[ROOM] ${playerName} joined ${roomId}`);
        callback({ success: true, room: result.room });

        // Notify others
        io.to(roomId).emit('room_update', result.room);
    });

    // ---- Leave Room ----
    socket.on('leave_room', () => {
        leaveRoom(socket);
    });

    // ---- Toggle Ready ----
    socket.on('toggle_ready', () => {
        const roomId = playerRooms.get(socket.id);
        if (!roomId) return;
        const room = rooms.get(roomId);
        if (!room || room.state !== 'lobby') return;

        const player = room.players.get(socket.id);
        if (player) {
            player.ready = !player.ready;
            io.to(roomId).emit('room_update', room.toPublic());
        }
    });

    // ---- Set Team ----
    socket.on('set_team', (team) => {
        const roomId = playerRooms.get(socket.id);
        if (!roomId) return;
        const room = rooms.get(roomId);
        if (!room || room.state !== 'lobby') return;

        const player = room.players.get(socket.id);
        if (player) {
            player.team = team;
            io.to(roomId).emit('room_update', room.toPublic());
        }
    });

    // ---- Change Mode ----
    socket.on('change_mode', (mode) => {
        const roomId = playerRooms.get(socket.id);
        if (!roomId) return;
        const room = rooms.get(roomId);
        if (!room || room.state !== 'lobby') return;
        if (socket.id !== room.hostId) return; // Only host

        if (MODES[mode]) {
            room.mode = mode;
            room.maxPlayers = MODES[mode].maxPlayers;
            io.to(roomId).emit('room_update', room.toPublic());
        }
    });

    // ---- Start Game (host only) ----
    socket.on('start_game', () => {
        const roomId = playerRooms.get(socket.id);
        if (!roomId) return;
        const room = rooms.get(roomId);
        if (!room || room.state !== 'lobby') return;
        if (socket.id !== room.hostId) return;

        // Check minimum players
        const minPlayers = MODES[room.mode]?.minPlayers || 2;
        if (room.players.size < minPlayers) {
            socket.emit('error_msg', `Need at least ${minPlayers} players to start`);
            return;
        }

        // Check all players ready (except host)
        for (const [id, p] of room.players) {
            if (id !== room.hostId && !p.ready) {
                socket.emit('error_msg', 'Not all players are ready');
                return;
            }
        }

        console.log(`[GAME] Starting game in room ${roomId} (${room.mode})`);
        startGame(roomId);
    });

    // ---- Player Input (during game) ----
    socket.on('input', (input) => {
        const roomId = playerRooms.get(socket.id);
        if (!roomId) return;
        const room = rooms.get(roomId);
        if (!room || !room.game) return;

        room.game.setPlayerInput(socket.id, {
            up: !!input.up,
            down: !!input.down,
            left: !!input.left,
            right: !!input.right,
            angle: typeof input.angle === 'number' ? input.angle : 0,
            shooting: !!input.shooting,
            weapon: typeof input.weapon === 'number' ? input.weapon : 0,
        });
    });

    // ---- Chat ----
    socket.on('chat', (message) => {
        const roomId = playerRooms.get(socket.id);
        if (!roomId) return;
        const room = rooms.get(roomId);
        if (!room) return;

        const player = room.players.get(socket.id);
        if (!player) return;

        const chatMsg = {
            sender: player.name,
            senderId: socket.id,
            message: String(message).slice(0, 200),
            timestamp: Date.now(),
        };

        room.chatHistory.push(chatMsg);
        if (room.chatHistory.length > 50) room.chatHistory.shift();

        io.to(roomId).emit('chat', chatMsg);
    });

    // ---- Ping ----
    socket.on('ping_check', (timestamp, callback) => {
        callback(timestamp);
    });

    // ---- Disconnect ----
    socket.on('disconnect', () => {
        console.log(`[-] Player disconnected: ${socket.id}`);
        leaveRoom(socket);
    });
});

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════╗
║          NEON VORTEX — Game Server           ║
║──────────────────────────────────────────────║
║  🌐  http://localhost:${PORT}                  ║
║  🎮  Multiplayer ready                       ║
╚══════════════════════════════════════════════╝
    `);
});
