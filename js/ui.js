/* ============================================
   NEON VORTEX — UI Manager
   Handles both Singleplayer and Multiplayer UI
   ============================================ */

const UI = (() => {
    const els = {};
    let onJoinRoom = null;
    let onCreateRoom = null;
    let onStartMatch = null;
    let onLeaveRoom = null;
    let onToggleReady = null;
    let onSetTeam = null;
    let onChangeMode = null;
    let onSendChat = null;
    let onConnect = null;

    function init() {
        // Core HUD
        els.hud = document.getElementById('hud');
        els.scoreValue = document.getElementById('score-value');
        els.waveValue = document.getElementById('wave-value');
        els.comboValue = document.getElementById('combo-value');
        els.healthBarFill = document.getElementById('health-bar-fill');
        els.healthText = document.getElementById('health-text');
        els.weaponName = document.getElementById('weapon-name');
        els.augmentIcons = document.getElementById('augment-icons');
        els.weaponSlots = document.querySelectorAll('.weapon-slot');
        els.waveAnnounce = document.getElementById('wave-announce');
        els.waveAnnounceText = document.getElementById('wave-announce-text');

        // Multiplayer HUD additions
        els.matchTimer = document.getElementById('hud-match-timer');
        els.matchTimerValue = document.getElementById('match-timer-value');
        els.hudTeamScores = document.getElementById('hud-team-scores');
        els.team0Score = document.getElementById('team-0-score');
        els.team1Score = document.getElementById('team-1-score');
        els.hudRound = document.getElementById('hud-round');
        els.roundValue = document.getElementById('round-value');
        els.pingIndicator = document.getElementById('hud-ping');
        els.pingValue = document.getElementById('ping-value');
        els.pingDot = document.getElementById('ping-dot');
        els.killFeed = document.getElementById('kill-feed');
        els.scoreboard = document.getElementById('scoreboard');
        els.scoreboardMode = document.getElementById('scoreboard-mode');
        els.scoreboardBody = document.getElementById('scoreboard-body');
        els.respawnOverlay = document.getElementById('respawn-overlay');
        els.respawnKillerName = document.getElementById('respawn-killer-name');
        els.respawnTimerValue = document.getElementById('respawn-timer-value');
        els.countdownOverlay = document.getElementById('countdown-overlay');
        els.countdownValue = document.getElementById('countdown-value');

        // Screens
        els.mainMenu = document.getElementById('main-menu');
        els.nameScreen = document.getElementById('name-screen');
        els.browserScreen = document.getElementById('browser-screen');
        els.createRoomScreen = document.getElementById('create-room-screen');
        els.roomLobby = document.getElementById('room-lobby');
        els.matchResults = document.getElementById('match-results');
        els.pauseMenu = document.getElementById('pause-menu');
        els.gameoverScreen = document.getElementById('gameover-screen');
        els.augmentScreen = document.getElementById('augment-screen');
        els.augmentChoices = document.getElementById('augment-choices');
        els.augmentWave = document.getElementById('augment-wave');
        els.finalStats = document.getElementById('final-stats');

        // Multiplayer Inputs
        els.inputPlayerName = document.getElementById('input-player-name');
        els.inputRoomCode = document.getElementById('input-room-code');
        els.inputRoomName = document.getElementById('input-room-name');
        els.chatInput = document.getElementById('lobby-chat-input');
        els.chatMessages = document.getElementById('lobby-chat-messages');
        els.roomList = document.getElementById('room-list');
        els.lobbyPlayerList = document.getElementById('lobby-player-list');

        // Lobby Details
        els.lobbyRoomName = document.getElementById('lobby-room-name');
        els.lobbyRoomCode = document.getElementById('lobby-room-code');
        els.lobbyModeName = document.getElementById('lobby-mode-name');
        els.btnReady = document.getElementById('btn-ready');
        els.btnStartMatch = document.getElementById('btn-start-match');

        // Load saved name
        const savedName = localStorage.getItem('neonVortexName');
        if (savedName) els.inputPlayerName.value = savedName;

        bindEvents();
    }

    function bindEvents() {
        // Main Menu
        document.getElementById('btn-multiplayer').addEventListener('click', () => {
            hide('main-menu');
            show('name-screen');
            els.inputPlayerName.focus();
        });

        // Name Screen
        document.getElementById('btn-name-back').addEventListener('click', () => {
            hide('name-screen');
            show('main-menu');
        });
        document.getElementById('btn-confirm-name').addEventListener('click', handleConnect);
        els.inputPlayerName.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') handleConnect();
        });

        // Browser Screen
        document.getElementById('btn-browser-back').addEventListener('click', () => {
            hide('browser-screen');
            show('main-menu');
            if (onLeaveRoom) onLeaveRoom(); // Disconnect
        });
        document.getElementById('btn-create-room').addEventListener('click', () => {
            hide('browser-screen');
            show('create-room-screen');
            els.inputRoomName.focus();
        });
        document.getElementById('btn-refresh-rooms').addEventListener('click', () => {
            if (onConnect) onConnect(); // Trigger refresh
        });
        document.getElementById('btn-join-code').addEventListener('click', () => {
            const code = els.inputRoomCode.value.trim().toUpperCase();
            if (code && onJoinRoom) onJoinRoom(code);
        });

        // Create Room Screen
        document.getElementById('btn-create-back').addEventListener('click', () => {
            hide('create-room-screen');
            show('browser-screen');
        });
        document.querySelectorAll('.mode-card').forEach(card => {
            card.addEventListener('click', () => {
                document.querySelectorAll('.mode-card').forEach(c => c.classList.remove('active'));
                card.classList.add('active');
            });
        });
        document.getElementById('btn-do-create').addEventListener('click', () => {
            const name = els.inputRoomName.value.trim() || 'Neon Vortex Arena';
            const mode = document.querySelector('.mode-card.active').dataset.mode;
            if (onCreateRoom) onCreateRoom(name, mode);
        });

        // Lobby
        document.getElementById('btn-leave-room').addEventListener('click', () => {
            if (onLeaveRoom) onLeaveRoom();
            hide('room-lobby');
            show('browser-screen');
        });
        els.btnReady.addEventListener('click', () => {
            if (onToggleReady) onToggleReady();
        });
        els.btnStartMatch.addEventListener('click', () => {
            if (onStartMatch) onStartMatch();
        });
        document.getElementById('btn-send-chat').addEventListener('click', handleChat);
        els.chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') handleChat();
        });

        // Match Results
        document.getElementById('btn-results-lobby').addEventListener('click', () => {
            hide('match-results');
            show('room-lobby');
        });

        // Scoreboard toggle
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                show('scoreboard');
            }
        });
        window.addEventListener('keyup', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                hide('scoreboard');
            }
        });
    }

    function handleConnect() {
        const name = els.inputPlayerName.value.trim() || 'Pilot_' + Math.floor(Math.random() * 1000);
        localStorage.setItem('neonVortexName', name);
        
        document.getElementById('connecting-status').classList.remove('hidden');
        document.getElementById('btn-confirm-name').disabled = true;
        
        if (onConnect) onConnect(name);
    }

    function show(id) {
        const el = typeof id === 'string' ? document.getElementById(id) : id;
        if (el) el.classList.remove('hidden');
    }

    function hide(id) {
        const el = typeof id === 'string' ? document.getElementById(id) : id;
        if (el) el.classList.add('hidden');
    }

    // ---- Multiplayer UI Updates ----

    function renderRoomList(rooms) {
        els.roomList.innerHTML = '';
        if (!rooms || rooms.length === 0) {
            els.roomList.innerHTML = '<div class="room-list-empty">No rooms available. Create one!</div>';
            return;
        }

        rooms.forEach(room => {
            const isPlaying = room.state !== 'lobby';
            const isFull = room.playerCount >= room.maxPlayers || isPlaying;
            const statusText = isPlaying ? 'IN PROGRESS' : `${room.playerCount}/${room.maxPlayers}`;

            const card = document.createElement('div');
            card.className = 'room-card';
            card.innerHTML = `
                <div class="room-card-info">
                    <div class="room-card-name">${room.name} <span style="color:var(--text-dim);font-size:10px;">#${room.id}</span></div>
                    <div class="room-card-mode">${room.modeName}</div>
                </div>
                <div class="room-card-players ${isFull ? 'full' : ''}">${statusText}</div>
            `;
            if (!isFull) {
                card.addEventListener('click', () => {
                    if (onJoinRoom) onJoinRoom(room.id);
                });
            } else {
                card.style.opacity = '0.5';
                card.style.cursor = 'not-allowed';
            }
            els.roomList.appendChild(card);
        });
    }

    function updateLobby(room, localPlayerId) {
        els.lobbyRoomName.textContent = room.name;
        els.lobbyRoomCode.textContent = room.id;
        els.lobbyModeName.textContent = room.modeName;

        els.lobbyPlayerList.innerHTML = '';
        const localPlayer = room.players.find(p => p.id === localPlayerId);
        const isHost = localPlayer && localPlayer.isHost;

        room.players.forEach(p => {
            const isMe = p.id === localPlayerId;
            const card = document.createElement('div');
            card.className = `lobby-player-card ${p.isHost ? 'is-host' : ''} ${p.ready ? 'is-ready' : ''}`;
            card.innerHTML = `
                <div class="player-color-dot" style="background:${p.color};box-shadow:0 0 8px ${p.color}"></div>
                <div class="player-card-name">${p.name} ${isMe ? '(You)' : ''}</div>
                ${p.isHost ? '<div class="player-card-badge badge-host">HOST</div>' : ''}
                ${p.ready ? '<div class="player-card-badge badge-ready">READY</div>' : ''}
            `;
            els.lobbyPlayerList.appendChild(card);
        });

        // Host controls
        if (isHost) {
            els.btnReady.classList.add('hidden');
            els.btnStartMatch.classList.remove('hidden');
            
            // Check if can start
            const minP = room.minPlayers || 1;
            const allReady = room.players.every(p => p.isHost || p.ready);
            els.btnStartMatch.disabled = !allReady || room.players.length < minP;
            els.btnStartMatch.style.opacity = els.btnStartMatch.disabled ? '0.5' : '1';
        } else {
            els.btnReady.classList.remove('hidden');
            els.btnStartMatch.classList.add('hidden');
            
            if (localPlayer && localPlayer.ready) {
                els.btnReady.classList.add('is-ready');
                els.btnReady.textContent = 'READY!';
            } else {
                els.btnReady.classList.remove('is-ready');
                els.btnReady.textContent = 'READY';
            }
        }
    }

    function handleChat() {
        const text = els.chatInput.value.trim();
        if (text && onSendChat) {
            onSendChat(text);
            els.chatInput.value = '';
        }
    }

    function addChatMessage(msg) {
        const el = document.createElement('div');
        el.className = 'chat-msg';
        el.innerHTML = `<span class="chat-msg-name">${msg.sender}:</span><span class="chat-msg-text">${msg.message}</span>`;
        els.chatMessages.appendChild(el);
        els.chatMessages.scrollTop = els.chatMessages.scrollHeight;
    }

    function formatTime(seconds) {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    }

    function updateMatchHUD(time, ping, mode, teamScores, round) {
        els.matchTimerValue.textContent = formatTime(time);
        els.matchTimer.classList.toggle('low-time', time <= 30 && time > 0);
        
        els.pingValue.textContent = ping + 'ms';
        els.pingDot.className = ping < 80 ? 'ping-good' : (ping < 150 ? 'ping-mid' : 'ping-bad');

        // Team Modes
        if (mode === 'tdm') {
            els.hudTeamScores.classList.remove('hidden');
            els.team0Score.textContent = (teamScores && teamScores[0]) || 0;
            els.team1Score.textContent = (teamScores && teamScores[1]) || 0;
        } else {
            els.hudTeamScores.classList.add('hidden');
        }

        // Elimination
        if (mode === 'elimination') {
            els.hudRound.classList.remove('hidden');
            els.roundValue.textContent = (round || 0) + 1;
            els.hudTeamScores.classList.remove('hidden');
            // In elimination, teamScores are actually roundScores
            els.team0Score.textContent = (teamScores && teamScores[0]) || 0;
            els.team1Score.textContent = (teamScores && teamScores[1]) || 0;
        } else {
            els.hudRound.classList.add('hidden');
        }
    }

    function updateScoreboard(players, localPlayerId, mode) {
        els.scoreboardMode.textContent = mode.toUpperCase();
        els.scoreboardBody.innerHTML = '';
        
        // Sort by score/kills descending
        const sorted = [...players].sort((a, b) => (b.score || b.kills) - (a.score || a.kills));
        
        sorted.forEach(p => {
            const isMe = p.id === localPlayerId;
            const tr = document.createElement('tr');
            if (isMe) tr.className = 'sb-you';
            tr.innerHTML = `
                <td class="sb-player-cell">
                    <div class="sb-color-dot" style="background:${p.color};box-shadow:0 0 6px ${p.color}"></div>
                    <span class="sb-player-name">${p.name}</span>
                </td>
                <td>${p.kills}</td>
                <td>${p.deaths}</td>
                <td style="color:var(--neon-cyan)">${p.score || 0}</td>
                <td style="color:var(--text-dim);font-weight:400;font-size:11px;">${isMe ? pingValue.textContent : '-'}</td>
            `;
            els.scoreboardBody.appendChild(tr);
        });
    }

    function addKillFeed(entry) {
        const el = document.createElement('div');
        el.className = 'kill-entry';
        
        const killerStr = entry.killerName ? `<span class="killer-name">${entry.killerName}</span>` : '<span style="color:#888">Environment</span>';
        
        el.innerHTML = `
            ${killerStr}
            <span class="weapon-icon">⚔</span>
            <span class="victim-name">${entry.victimName}</span>
        `;
        
        els.killFeed.appendChild(el);
        
        // Remove after animation (4.4s total)
        setTimeout(() => {
            if (el.parentNode) el.parentNode.removeChild(el);
        }, 4500);
    }

    function showRespawnOverlay(killerName, timeRemaining) {
        show('respawn-overlay');
        els.respawnKillerName.textContent = killerName || 'Environment';
        els.respawnTimerValue.textContent = Math.ceil(timeRemaining);
    }

    function hideRespawnOverlay() {
        hide('respawn-overlay');
    }

    function showCountdown(timeRemaining) {
        show('countdown-overlay');
        const val = Math.ceil(timeRemaining);
        els.countdownValue.textContent = val > 0 ? val : 'GO!';
        if (val <= 0) {
            setTimeout(() => hide('countdown-overlay'), 1000);
        }
    }

    function showMatchResults(results, localPlayerId) {
        show('match-results');
        hide('hud');
        hide('scoreboard');
        
        if (results.winner) {
            els.matchResults.querySelector('#results-winner').textContent = `${results.winner.name} WINS!`;
        } else {
            els.matchResults.querySelector('#results-winner').textContent = `MATCH ENDED`;
        }
        
        const tbody = document.getElementById('results-body');
        tbody.innerHTML = '';
        
        const sorted = [...results.players].sort((a, b) => (b.score || b.kills) - (a.score || a.kills));
        
        sorted.forEach((p, i) => {
            const tr = document.createElement('tr');
            if (p.id === localPlayerId) tr.style.background = 'rgba(0, 240, 255, 0.08)';
            
            const rankClass = i < 3 ? `rank-${i+1}` : '';
            
            tr.innerHTML = `
                <td class="${rankClass}">#${i+1}</td>
                <td style="color:${p.color};font-weight:bold;">${p.name}</td>
                <td>${p.kills}</td>
                <td>${p.deaths}</td>
                <td style="color:var(--neon-cyan)">${p.score || 0}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    // ---- Singleplayer HUD ----
    function updateHUD(score, wave, combo, hp, maxHp, weaponIdx, augments) {
        els.scoreValue.textContent = score.toLocaleString();
        els.waveValue.textContent = wave;

        if (combo > 1) {
            els.comboValue.textContent = 'x' + combo;
            els.comboValue.classList.add('pulse');
            setTimeout(() => els.comboValue.classList.remove('pulse'), 150);
        } else {
            els.comboValue.textContent = 'x1';
        }

        const pct = Math.max(0, hp / maxHp) * 100;
        els.healthBarFill.style.width = pct + '%';
        els.healthBarFill.classList.toggle('low', pct < 30);
        els.healthText.textContent = Math.ceil(hp) + ' / ' + maxHp;

        // In multiplayer, WEAPONS might be imported differently, assuming it's global
        if (typeof WEAPONS !== 'undefined') {
            els.weaponName.textContent = WEAPONS[weaponIdx].name;
        }

        els.weaponSlots.forEach((slot, i) => {
            slot.classList.toggle('active', i === weaponIdx);
        });

        // Augment icons
        if (augments) {
            els.augmentIcons.innerHTML = '';
            const seen = {};
            for (const augId of augments) {
                if (!seen[augId]) seen[augId] = 0;
                seen[augId]++;
            }
            for (const [augId, count] of Object.entries(seen)) {
                if (typeof AUGMENT_DEFS !== 'undefined') {
                    const def = AUGMENT_DEFS.find(a => a.id === augId);
                    if (def) {
                        const icon = document.createElement('div');
                        icon.className = 'augment-icon';
                        icon.title = def.name + (count > 1 ? ' x' + count : '');
                        icon.innerHTML = def.icon;
                        els.augmentIcons.appendChild(icon);
                    }
                }
            }
        }
    }

    function showGameOver(score, wave, highScore) {
        document.getElementById('final-score').textContent = score.toLocaleString();
        document.getElementById('final-wave').textContent = wave;
        document.getElementById('high-score').textContent = highScore.toLocaleString();
        show('gameover-screen');
    }

    function announceWave(waveNum, isBoss) {
        els.waveAnnounceText.textContent = isBoss ? '⚠ BOSS WAVE ' + waveNum : 'WAVE ' + waveNum;
        els.waveAnnounceText.style.color = isBoss ? '#ffe600' : '#00f0ff';
        show('wave-announce');
        els.waveAnnounceText.style.animation = 'none';
        void els.waveAnnounceText.offsetWidth;
        els.waveAnnounceText.style.animation = 'waveAnnounce 2s ease forwards';
        setTimeout(() => hide('wave-announce'), 2200);
    }

    function showAugmentSelection(wave, choices, callback) {
        els.augmentWave.textContent = wave;
        els.augmentChoices.innerHTML = '';

        choices.forEach(aug => {
            const card = document.createElement('div');
            card.className = 'augment-card';
            card.innerHTML = `
                <div class="augment-card-icon">${aug.icon}</div>
                <div class="augment-card-name">${aug.name}</div>
                <div class="augment-card-desc">${aug.desc}</div>
            `;
            card.addEventListener('click', () => {
                callback(aug.id);
                hide('augment-screen');
            });
            els.augmentChoices.appendChild(card);
        });

        show('augment-screen');
    }

    return { 
        init, show, hide, 
        updateHUD, showGameOver, showAugmentSelection, announceWave, 
        renderRoomList, updateLobby, addChatMessage,
        updateMatchHUD, updateScoreboard, addKillFeed,
        showRespawnOverlay, hideRespawnOverlay, showCountdown,
        showMatchResults,
        els,
        // Setters for callbacks
        set onJoinRoom(cb) { onJoinRoom = cb; },
        set onCreateRoom(cb) { onCreateRoom = cb; },
        set onStartMatch(cb) { onStartMatch = cb; },
        set onLeaveRoom(cb) { onLeaveRoom = cb; },
        set onToggleReady(cb) { onToggleReady = cb; },
        set onSetTeam(cb) { onSetTeam = cb; },
        set onChangeMode(cb) { onChangeMode = cb; },
        set onSendChat(cb) { onSendChat = cb; },
        set onConnect(cb) { onConnect = cb; }
    };
})();
