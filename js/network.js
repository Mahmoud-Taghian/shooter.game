/* ============================================
   NEON VORTEX — Network Client
   Socket.IO connection, input sending,
   state interpolation, client prediction
   ============================================ */

const Network = (() => {
    let socket = null;
    let connected = false;
    let playerId = null;
    let playerName = 'Player';
    let currentRoom = null;
    let ping = 0;
    let lastPingTime = 0;

    // State interpolation
    let stateBuffer = [];
    const INTERP_DELAY = 100; // ms interpolation delay for smooth remote players

    // Callbacks
    let onConnected = null;
    let onDisconnected = null;
    let onRoomUpdate = null;
    let onGameState = null;
    let onGameEvent = null;
    let onChat = null;
    let onError = null;
    let onRoomsListUpdate = null;

    function connect(serverUrl) {
        return new Promise((resolve, reject) => {
            if (socket) socket.disconnect();

            // Use the Socket.IO CDN or local
            socket = io(serverUrl || window.location.origin, {
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                reconnectionAttempts: 10,
            });

            socket.on('connect', () => {
                connected = true;
                playerId = socket.id;
                console.log('[NET] Connected:', playerId);
                if (onConnected) onConnected(playerId);
                resolve(playerId);

                // Start ping measurement
                measurePing();
                setInterval(measurePing, 3000);
            });

            socket.on('disconnect', (reason) => {
                connected = false;
                console.log('[NET] Disconnected:', reason);
                if (onDisconnected) onDisconnected(reason);
            });

            socket.on('connect_error', (err) => {
                console.error('[NET] Connection error:', err.message);
                reject(err);
            });

            socket.on('room_update', (room) => {
                currentRoom = room;
                if (onRoomUpdate) onRoomUpdate(room);
            });

            socket.on('game_state', (state) => {
                // Push to interpolation buffer
                stateBuffer.push({
                    timestamp: Date.now(),
                    state,
                });
                // Keep buffer limited
                if (stateBuffer.length > 30) stateBuffer.shift();

                if (onGameState) onGameState(state);
            });

            socket.on('game_event', (event) => {
                if (onGameEvent) onGameEvent(event);
            });

            socket.on('chat', (msg) => {
                if (onChat) onChat(msg);
            });

            socket.on('error_msg', (msg) => {
                console.warn('[NET] Error:', msg);
                if (onError) onError(msg);
            });

            socket.on('room_list', (rooms) => {
                if (onRoomsListUpdate) onRoomsListUpdate(rooms);
            });
        });
    }

    function disconnect() {
        if (socket) {
            socket.disconnect();
            socket = null;
        }
        connected = false;
        playerId = null;
        currentRoom = null;
        stateBuffer = [];
    }

    function measurePing() {
        if (!socket || !connected) return;
        lastPingTime = Date.now();
        socket.emit('ping_check', lastPingTime, (serverTime) => {
            ping = Date.now() - serverTime;
        });
    }

    // ---- Room Operations ----
    function getRooms() {
        return new Promise((resolve) => {
            if (!socket) return resolve([]);
            socket.emit('get_rooms', (rooms) => resolve(rooms));
        });
    }

    function createRoom(name, mode, settings = {}) {
        return new Promise((resolve) => {
            if (!socket) return resolve({ error: 'Not connected' });
            socket.emit('create_room', { name, mode, playerName, settings }, (result) => {
                if (result.success) currentRoom = result.room;
                resolve(result);
            });
        });
    }

    function joinRoom(roomId) {
        return new Promise((resolve) => {
            if (!socket) return resolve({ error: 'Not connected' });
            socket.emit('join_room', { roomId, playerName }, (result) => {
                if (result.success) currentRoom = result.room;
                resolve(result);
            });
        });
    }

    function leaveRoom() {
        if (socket) socket.emit('leave_room');
        currentRoom = null;
        stateBuffer = [];
    }

    function toggleReady() {
        if (socket) socket.emit('toggle_ready');
    }

    function setTeam(team) {
        if (socket) socket.emit('set_team', team);
    }

    function changeMode(mode) {
        if (socket) socket.emit('change_mode', mode);
    }

    function startGame() {
        if (socket) socket.emit('start_game');
    }

    // ---- Gameplay ----
    function sendInput(input) {
        if (socket && connected) {
            socket.volatile.emit('input', input);
        }
    }

    function sendChat(message) {
        if (socket && connected) {
            socket.emit('chat', message);
        }
    }

    // ---- State Interpolation ----
    // Returns interpolated state for smooth rendering of remote players
    function getInterpolatedState() {
        if (stateBuffer.length < 2) {
            return stateBuffer.length > 0 ? stateBuffer[stateBuffer.length - 1].state : null;
        }

        const renderTime = Date.now() - INTERP_DELAY;

        // Find two states to interpolate between
        let prev = stateBuffer[0];
        let next = stateBuffer[1];

        for (let i = 0; i < stateBuffer.length - 1; i++) {
            if (stateBuffer[i].timestamp <= renderTime && stateBuffer[i + 1].timestamp >= renderTime) {
                prev = stateBuffer[i];
                next = stateBuffer[i + 1];
                break;
            }
        }

        // If render time is past all buffered states, use latest
        if (renderTime > stateBuffer[stateBuffer.length - 1].timestamp) {
            return stateBuffer[stateBuffer.length - 1].state;
        }

        // Interpolation factor
        const totalTime = next.timestamp - prev.timestamp;
        const t = totalTime > 0 ? (renderTime - prev.timestamp) / totalTime : 0;

        return interpolateStates(prev.state, next.state, clamp01(t));
    }

    function interpolateStates(prev, next, t) {
        // Deep copy next as base, then interpolate positions
        const result = JSON.parse(JSON.stringify(next));

        for (const nextPlayer of result.players) {
            const prevPlayer = prev.players.find(p => p.id === nextPlayer.id);
            if (prevPlayer && nextPlayer.id !== playerId) {
                // Interpolate remote player positions
                nextPlayer.x = lerp(prevPlayer.x, nextPlayer.x, t);
                nextPlayer.y = lerp(prevPlayer.y, nextPlayer.y, t);
                nextPlayer.angle = lerpAngle(prevPlayer.angle, nextPlayer.angle, t);
            }
        }

        // Interpolate bullet positions
        for (const nextBullet of result.bullets) {
            const prevBullet = prev.bullets.find(b => b.id === nextBullet.id);
            if (prevBullet) {
                nextBullet.x = lerp(prevBullet.x, nextBullet.x, t);
                nextBullet.y = lerp(prevBullet.y, nextBullet.y, t);
            }
        }

        // Interpolate enemy positions
        for (const nextEnemy of result.enemies) {
            const prevEnemy = prev.enemies.find(e => e.id === nextEnemy.id);
            if (prevEnemy) {
                nextEnemy.x = lerp(prevEnemy.x, nextEnemy.x, t);
                nextEnemy.y = lerp(prevEnemy.y, nextEnemy.y, t);
            }
        }

        return result;
    }

    function lerp(a, b, t) { return a + (b - a) * t; }
    function clamp01(t) { return Math.max(0, Math.min(1, t)); }

    function lerpAngle(a, b, t) {
        let diff = b - a;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        return a + diff * t;
    }

    // ---- Getters ----
    function getLatestState() {
        return stateBuffer.length > 0 ? stateBuffer[stateBuffer.length - 1].state : null;
    }

    return {
        connect, disconnect,
        getRooms, createRoom, joinRoom, leaveRoom,
        toggleReady, setTeam, changeMode, startGame,
        sendInput, sendChat,
        getInterpolatedState, getLatestState,
        measurePing,

        get connected() { return connected; },
        get playerId() { return playerId; },
        get ping() { return ping; },
        get currentRoom() { return currentRoom; },

        set playerName(n) { playerName = n; },
        get playerName() { return playerName; },

        set onConnected(fn) { onConnected = fn; },
        set onDisconnected(fn) { onDisconnected = fn; },
        set onRoomUpdate(fn) { onRoomUpdate = fn; },
        set onGameState(fn) { onGameState = fn; },
        set onGameEvent(fn) { onGameEvent = fn; },
        set onChat(fn) { onChat = fn; },
        set onError(fn) { onError = fn; },
        set onRoomsListUpdate(fn) { onRoomsListUpdate = fn; },
    };
})();
