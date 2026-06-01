/* ============================================
   NEON VORTEX — Main Game
   State management, game loop, singleplayer logic,
   and multiplayer integration.
   ============================================ */

const Game = (() => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    // Shared State
    let isMultiplayer = false;
    let state = 'menu'; // menu | playing | paused | gameover | augment
    let time = 0;
    
    // Singleplayer State
    let player, bullets, enemies, powerUps, enemyBullets;
    let score, combo, comboTimer, wave, enemiesRemaining, waveDelay;
    let highScore = parseInt(localStorage.getItem('neonVortexHighScore') || '0');

    // Multiplayer State
    let mpState = null; // Latest interpolated state from server
    let remotePlayers = {}; // socketId -> RemotePlayer
    let inputSequence = 0;
    const inputRate = 1 / 20; // Send input 20 times per sec
    let inputTimer = 0;

    // ---- Resize ----
    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        Engine.initStarfield(canvas.width, canvas.height);
    }

    // ---- Init ----
    function init() {
        Sound.init();
        UI.init();
        Engine.initInput(canvas);
        resize();
        window.addEventListener('resize', resize);

        // UI Event Bindings
        document.getElementById('btn-start').addEventListener('click', startSinglePlayer);
        document.getElementById('btn-resume').addEventListener('click', resumeGame);
        document.getElementById('btn-quit').addEventListener('click', quitToMenu);
        document.getElementById('btn-restart').addEventListener('click', () => {
            if (isMultiplayer) quitToMenu();
            else startSinglePlayer();
        });
        document.getElementById('btn-menu').addEventListener('click', quitToMenu);

        // Pause button in HUD
        const pauseBtn = document.getElementById('btn-pause');
        if (pauseBtn) {
            pauseBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (!isMultiplayer && state === 'playing') pauseGame();
            });
        }

        // Weapon switch from keys
        document.addEventListener('weaponswitch', e => {
            if (state === 'playing') {
                if (isMultiplayer && Network.connected) {
                    Network.sendInput({ weapon: e.detail });
                } else if (!isMultiplayer && player) {
                    player.currentWeapon = e.detail;
                }
            }
        });

        // Weapon switch from clicking weapon bar
        document.querySelectorAll('.weapon-slot').forEach(slot => {
            slot.addEventListener('click', () => {
                if (state === 'playing') {
                    const w = parseInt(slot.dataset.weapon);
                    if (isMultiplayer && Network.connected) {
                        Network.sendInput({ weapon: w });
                    } else if (!isMultiplayer && player) {
                        player.currentWeapon = w;
                    }
                }
            });
        });

        // Pause
        document.addEventListener('togglepause', () => {
            if (!isMultiplayer) {
                if (state === 'playing') pauseGame();
                else if (state === 'paused') resumeGame();
            }
        });

        // Multiplayer Callbacks
        setupMultiplayerCallbacks();

        // Start loop
        requestAnimationFrame(loop);
    }

    function setupMultiplayerCallbacks() {
        UI.onConnect = async (name) => {
            try {
                // Determine server URL (use window.location for now, or specify if needed)
                await Network.connect(window.location.origin);
                Network.playerName = name;
                
                UI.hide('name-screen');
                UI.show('browser-screen');
                refreshRoomList();
            } catch (err) {
                alert('Connection failed. Server might be down.');
                UI.hide('connecting-status');
                document.getElementById('btn-confirm-name').disabled = false;
            }
        };

        UI.onJoinRoom = async (roomId) => {
            const res = await Network.joinRoom(roomId);
            if (res.error) alert(res.error);
            else {
                document.getElementById('lobby-chat-messages').innerHTML = '';
                if (res.chatHistory) {
                    res.chatHistory.forEach(msg => UI.addChatMessage(msg));
                }
                UI.hide('browser-screen');
                UI.show('room-lobby');
            }
        };

        UI.onCreateRoom = async (name, mode) => {
            const res = await Network.createRoom(name, mode);
            if (res.error) alert(res.error);
            else {
                document.getElementById('lobby-chat-messages').innerHTML = '';
                UI.hide('create-room-screen');
                UI.show('room-lobby');
            }
        };

        UI.onStartMatch = () => Network.startGame();
        UI.onLeaveRoom = () => Network.leaveRoom();
        UI.onToggleReady = () => Network.toggleReady();
        UI.onSendChat = (msg) => Network.sendChat(msg);

        // Network Events
        Network.onRoomsListUpdate = (rooms) => {
            if (!document.getElementById('browser-screen').classList.contains('hidden')) {
                UI.showRoomList(rooms);
            }
        };

        Network.onRoomUpdate = (room) => {
            if (room.state === 'lobby') {
                UI.updateLobby(room, Network.playerId);
            }
        };

        Network.onChat = (msg) => {
            UI.addChatMessage(msg);
        };

        Network.onGameEvent = (event) => {
            switch(event.type) {
                case 'player_death':
                    UI.addKillFeed(event.data);
                    if (event.data.victimId === Network.playerId) {
                        Sound.game_over();
                        // Get current state to find respawn time
                        const st = Network.getLatestState();
                        const myPlayer = st?.players.find(p => p.id === Network.playerId);
                        if (myPlayer) {
                            UI.showRespawnOverlay(event.data.killerName, myPlayer.respawnTimer);
                        }
                    } else if (event.data.killerId === Network.playerId) {
                        Sound.explosion_small();
                    } else {
                        Sound.hit_player(); // distant explosion sound
                    }
                    break;
                case 'wave_start':
                    UI.announceWave(event.data.wave, event.data.isBoss);
                    if (event.data.isBoss) Sound.boss_alert(); else Sound.wave_start();
                    break;
                case 'match_end':
                    UI.showMatchResults(event.data, Network.playerId);
                    state = 'gameover';
                    break;
            }
        };
    }

    async function refreshRoomList() {
        const rooms = await Network.getRooms();
        UI.renderRoomList(rooms);
    }

    // ---- Single Player Start ----
    function startSinglePlayer() {
        isMultiplayer = false;
        Sound.resume();
        Sound.menu_click();
        player = new Player(canvas.width / 2, canvas.height / 2);
        bullets = [];
        enemies = [];
        powerUps = [];
        enemyBullets = [];
        score = 0;
        combo = 1;
        comboTimer = 0;
        wave = 0;
        enemiesRemaining = 0;
        waveDelay = 1.5;
        Engine.clearParticles();

        state = 'playing';
        UI.hide('main-menu');
        UI.hide('gameover-screen');
        UI.show('hud');
        document.getElementById('hud-match-timer').classList.add('hidden');
        document.getElementById('hud-ping').classList.add('hidden');

        nextWave();
    }

    // ---- Single Player Logic ----
    function nextWave() {
        wave++;
        waveDelay = 2;

        const isBoss = wave % 5 === 0;
        UI.announceWave(wave, isBoss);
        if (isBoss) Sound.boss_alert(); else Sound.wave_start();

        if (isBoss) {
            spawnEnemy('boss');
            const extras = Math.min(wave, 8);
            for (let i = 0; i < extras; i++) setTimeout(() => spawnEnemy('chaser'), i * 400);
            enemiesRemaining = 1 + extras;
        } else {
            const chaserCount = 3 + wave * 2;
            const shooterCount = Math.floor(wave * 0.8);
            enemiesRemaining = chaserCount + shooterCount;

            for (let i = 0; i < chaserCount; i++) setTimeout(() => spawnEnemy('chaser'), i * 300);
            for (let i = 0; i < shooterCount; i++) setTimeout(() => spawnEnemy('shooter'), chaserCount * 300 + i * 500);
        }
    }

    function spawnEnemy(type) {
        if (state !== 'playing' && state !== 'augment') return;
        let x, y;
        const side = Math.floor(Math.random() * 4);
        switch (side) {
            case 0: x = Math.random() * canvas.width; y = -40; break;
            case 1: x = canvas.width + 40; y = Math.random() * canvas.height; break;
            case 2: x = Math.random() * canvas.width; y = canvas.height + 40; break;
            case 3: x = -40; y = Math.random() * canvas.height; break;
        }
        enemies.push(new Enemy(x, y, type, wave));
    }

    function playerShootSP() {
        if (player.fireCooldown > 0) return;

        const w = WEAPONS[player.currentWeapon];
        player.fireCooldown = player.getFireRate();
        const dmg = player.getDamage();
        const sz = player.getBulletSize();
        const muzzleX = player.x + Math.cos(player.angle) * 24;
        const muzzleY = player.y + Math.sin(player.angle) * 24;

        switch (w.type) {
            case 'pulse':
                bullets.push(new Bullet(muzzleX, muzzleY, player.angle, w, dmg, sz));
                Engine.spawnParticles(muzzleX, muzzleY, 3, { speed: 100, life: 0.15, size: 2, color: w.color, angle: player.angle, spread: 0.3 });
                Sound.shoot_pulse();
                break;
            case 'spread':
                for (let i = 0; i < (w.count || 5); i++) {
                    const offset = (i - 2) * (w.arc / (w.count - 1));
                    bullets.push(new Bullet(muzzleX, muzzleY, player.angle + offset, w, dmg, sz));
                }
                Engine.spawnParticles(muzzleX, muzzleY, 6, { speed: 120, life: 0.2, size: 2, color: w.color, angle: player.angle, spread: 0.6 });
                Sound.shoot_spread();
                break;
            case 'beam':
                Sound.shoot_beam();
                break;
            case 'rocket':
                bullets.push(new Bullet(muzzleX, muzzleY, player.angle, w, dmg, sz));
                Engine.spawnParticles(muzzleX, muzzleY, 8, { speed: 80, life: 0.3, size: 3, color: '#ff8800', angle: player.angle + Math.PI, spread: 0.8 });
                Sound.shoot_rocket();
                break;
            case 'homing':
                bullets.push(new Bullet(muzzleX, muzzleY, player.angle, w, dmg, sz));
                Sound.shoot_homing();
                break;
            case 'rail': {
                const bulletCount = w.bulletCount || 3;
                const spread = w.railSpread || 0.06;
                for (let i = 0; i < bulletCount; i++) {
                    const offset = (i - (bulletCount - 1) / 2) * spread;
                    bullets.push(new Bullet(muzzleX, muzzleY, player.angle + offset, w, dmg, sz));
                }
                Engine.triggerShake(5, 0.12);
                Engine.spawnParticles(muzzleX, muzzleY, 12, { speed: 250, life: 0.2, size: 2, color: w.color, angle: player.angle, spread: 0.2 });
                Sound.shoot_rail();
                break;
            }
        }
    }

    function updateSinglePlayer(dt) {
        player.update(dt, canvas.width, canvas.height);

        // Shooting
        if (Engine.mouse.down) playerShootSP();

        // Beam
        if (Engine.mouse.down && WEAPONS[player.currentWeapon].type === 'beam') {
            const w = WEAPONS[2];
            const range = w.beamRange || 600;
            const dmg = player.getDamage() * dt * 60;
            for (const e of enemies) {
                if (e.dead) continue;
                const dx = Math.cos(player.angle);
                const dy = Math.sin(player.angle);
                const toEX = e.x - player.x;
                const toEY = e.y - player.y;
                const proj = toEX * dx + toEY * dy;
                if (proj < 0 || proj > range) continue;
                const perpDist = Math.abs(toEX * dy - toEY * dx);
                if (perpDist < e.radius + (w.beamWidth || 6)) {
                    e.takeDamage(dmg);
                    Engine.spawnParticles(e.x, e.y, 1, { speed: 50, life: 0.1, size: 2, color: w.color });
                    if (e.dead) onEnemyKilledSP(e);
                }
            }
        }

        comboTimer -= dt;
        if (comboTimer <= 0) combo = 1;

        // Bullets
        const hasRicochet = player.hasAugment('ricochet');
        for (let i = bullets.length - 1; i >= 0; i--) {
            bullets[i].update(dt, canvas.width, canvas.height, enemies, hasRicochet);
            if (bullets[i].dead) bullets.splice(i, 1);
        }
        for (let i = enemyBullets.length - 1; i >= 0; i--) {
            enemyBullets[i].update(dt, canvas.width, canvas.height, [], false);
            if (enemyBullets[i].dead) enemyBullets.splice(i, 1);
        }

        // Enemies
        for (const enemy of enemies) {
            enemy.update(dt, player, canvas.width, canvas.height);
            if ((enemy.type === 'shooter' || enemy.type === 'boss') && enemy.fireCooldown <= 0) {
                enemy.fireCooldown = enemy.fireRate;
                const angle = Engine.angleBetween(enemy.x, enemy.y, player.x, player.y);
                enemyBullets.push(new Bullet(enemy.x, enemy.y, angle, { speed: 300, color: enemy.color, type: 'pulse', bulletSize: 4 }, enemy.type === 'boss' ? 20 : 12, 4, 'enemy'));
                Sound.enemy_shoot();
            }
        }

        // Powerups
        const magnetRange = player.hasAugment('magnetism') ? 200 * Math.pow(3, player.augmentCounts['magnetism'] || 0) : 60;
        for (let i = powerUps.length - 1; i >= 0; i--) {
            const pu = powerUps[i];
            pu.update(dt);
            const d = Engine.distance(player.x, player.y, pu.x, pu.y);
            if (d < magnetRange) {
                const angle = Engine.angleBetween(pu.x, pu.y, player.x, player.y);
                const pullSpeed = 300 * (1 - d / magnetRange);
                pu.x += Math.cos(angle) * pullSpeed * dt;
                pu.y += Math.sin(angle) * pullSpeed * dt;
            }
            if (pu.dead) powerUps.splice(i, 1);
        }

        // Collisions
        for (let bi = bullets.length - 1; bi >= 0; bi--) {
            const b = bullets[bi];
            for (let ei = enemies.length - 1; ei >= 0; ei--) {
                const e = enemies[ei];
                if (e.dead) continue;
                if (Engine.circleCollision(b, e)) {
                    e.takeDamage(b.damage);
                    Sound.hit_enemy();
                    Engine.spawnParticles(b.x, b.y, 4, { speed: 100, life: 0.2, size: 2, color: b.color });

                    if (!b.piercing) b.dead = true;

                    if (b.aoeEnabled && b.explosionRadius > 0) {
                        rocketExplosionSP(b.x, b.y, b.explosionRadius, b.damage * 0.6);
                    }

                    if (e.dead) onEnemyKilledSP(e);
                    break;
                }
            }
        }

        for (let i = enemyBullets.length - 1; i >= 0; i--) {
            const b = enemyBullets[i];
            if (Engine.circleCollision(b, player)) {
                player.takeDamage(b.damage);
                Sound.hit_player();
                b.dead = true;
            }
        }

        for (const e of enemies) {
            if (e.dead) continue;
            if (Engine.circleCollision(e, player)) {
                if (player.takeDamage(e.damage)) {
                    const angle = Engine.angleBetween(e.x, e.y, player.x, player.y);
                    player.x += Math.cos(angle) * 40;
                    player.y += Math.sin(angle) * 40;
                }
            }
        }

        for (let i = powerUps.length - 1; i >= 0; i--) {
            const pu = powerUps[i];
            if (Engine.circleCollision(pu, player)) {
                if (pu.type === 'health') player.hp = Math.min(player.hp + 30, player.maxHp);
                if (pu.type === 'shield') player.shieldTimer = 8;
                if (pu.type === 'ammo') player.fireCooldown = 0;
                Sound.powerup_collect();
                Engine.spawnParticles(pu.x, pu.y, 10, { speed: 120, life: 0.4, size: 3, color: pu.color });
                powerUps.splice(i, 1);
            }
        }

        for (let i = enemies.length - 1; i >= 0; i--) if (enemies[i].dead) enemies.splice(i, 1);

        if (enemiesRemaining <= 0 && enemies.length === 0) {
            waveDelay -= dt;
            if (waveDelay <= 0) {
                if (wave % 3 === 0) {
                    state = 'augment';
                    const shuffled = [...AUGMENT_DEFS].sort(() => Math.random() - 0.5);
                    UI.showAugmentSelection(wave, shuffled.slice(0, 3), augId => {
                        player.addAugment(augId);
                        Sound.augment_select();
                        state = 'playing';
                        nextWave();
                    });
                } else {
                    nextWave();
                }
            }
        }

        if (player.hp <= 0) {
            state = 'gameover';
            Sound.game_over();
            if (score > highScore) {
                highScore = score;
                localStorage.setItem('neonVortexHighScore', highScore.toString());
            }
            UI.hide('hud');
            UI.showGameOver(score, wave, highScore);
        }

        Engine.updateParticles(dt);
        UI.updateHUD(score, wave, combo, player.hp, player.maxHp, player.currentWeapon, player.augments);
    }

    function rocketExplosionSP(x, y, radius, damage) {
        Engine.spawnParticles(x, y, 30, { speed: 300, life: 0.6, size: 5, color: '#ff6600' });
        Engine.spawnParticles(x, y, 20, { speed: 180, life: 0.5, size: 4, color: '#ff2d55' });
        Engine.triggerShake(12, 0.3);
        Sound.rocket_aoe();

        for (const e of enemies) {
            if (e.dead) continue;
            const dist = Engine.distance(x, y, e.x, e.y);
            if (dist < radius) {
                const falloff = 1 - (dist / radius) * 0.5;
                e.takeDamage(damage * falloff);
                if (e.dead) onEnemyKilledSP(e);
            }
        }
    }

    function onEnemyKilledSP(enemy) {
        combo = Math.min(combo + 1, 20);
        comboTimer = 3;
        score += enemy.score * combo;

        Engine.spawnParticles(enemy.x, enemy.y, 15, { speed: 200, life: 0.5, size: 4, color: enemy.color });
        Sound.explosion_small();

        if (player.hasAugment('vampiric')) player.hp = Math.min(player.hp + (player.augmentCounts['vampiric'] || 0), player.maxHp);
        
        if (Math.random() < 0.15 * (player.hasAugment('luckystar') ? Math.pow(2, player.augmentCounts['luckystar']) : 1)) {
            const types = ['health', 'health', 'shield', 'ammo'];
            powerUps.push(new PowerUp(enemy.x, enemy.y, types[Math.floor(Math.random() * types.length)]));
        }

        enemiesRemaining--;
    }

    function drawBeamSP() {
        const w = WEAPONS[2];
        const range = w.beamRange || 600;
        const endX = player.x + Math.cos(player.angle) * range;
        const endY = player.y + Math.sin(player.angle) * range;

        ctx.save();
        ctx.strokeStyle = w.color;
        ctx.lineWidth = (w.beamWidth || 6) * 2;
        ctx.globalAlpha = 0.3;
        ctx.shadowColor = w.color;
        ctx.shadowBlur = 30;
        ctx.beginPath();
        ctx.moveTo(player.x + Math.cos(player.angle) * 24, player.y + Math.sin(player.angle) * 24);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        ctx.lineWidth = w.beamWidth || 6;
        ctx.globalAlpha = 0.8;
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.6;
        ctx.stroke();
        ctx.restore();
    }

    // ---- Multiplayer Logic ----
    function updateMultiplayer(dt) {
        // Transition from lobby to playing
        if (state !== 'playing' && state !== 'countdown') {
            state = 'playing';
            isMultiplayer = true;
            Engine.clearParticles();
            
            UI.hide('room-lobby');
            UI.hide('main-menu');
            UI.show('hud');
            document.getElementById('hud-match-timer').classList.remove('hidden');
            document.getElementById('hud-ping').classList.remove('hidden');
            Sound.resume();
        }

        mpState = Network.getInterpolatedState();
        if (!mpState) return;

        // Check if game is in countdown
        if (mpState.state === 'countdown') {
            state = 'countdown';
            UI.showCountdown(mpState.countdownTimer);
            return;
        } else {
            state = 'playing';
            // hide countdown just in case
            // it will hide automatically but let's be safe
        }

        // Send Input
        inputTimer -= dt;
        if (inputTimer <= 0) {
            inputTimer = inputRate;
            
            // Assume player aims from screen center to mouse (simplification, since camera follows nothing right now)
            // Wait, in our game canvas is fixed size or resizes to window?
            // Local player is always at center? No, local player moves around fixed canvas right now.
            const localP = mpState.players.find(p => p.id === Network.playerId);
            let angle = 0;
            if (localP) {
                angle = Engine.angleBetween(localP.x, localP.y, Engine.mouse.x, Engine.mouse.y);
            }

            Network.sendInput({
                up: Engine.keys['w'] || Engine.keys['arrowup'],
                down: Engine.keys['s'] || Engine.keys['arrowdown'],
                left: Engine.keys['a'] || Engine.keys['arrowleft'],
                right: Engine.keys['d'] || Engine.keys['arrowright'],
                angle: angle,
                shooting: Engine.mouse.down,
                // Weapon handled by events
            });
        }

        // Sync local RemotePlayers
        const newRemotePlayers = {};
        for (const pData of mpState.players) {
            if (!remotePlayers[pData.id]) {
                remotePlayers[pData.id] = new RemotePlayer(pData);
            } else {
                remotePlayers[pData.id].updateState(pData);
            }
            remotePlayers[pData.id].update(dt);
            newRemotePlayers[pData.id] = remotePlayers[pData.id];
        }
        remotePlayers = newRemotePlayers;

        // Update local HUD
        const localP = mpState.players.find(p => p.id === Network.playerId);
        if (localP) {
            // HUD Update
            UI.updateHUD(localP.score, mpState.wave || 1, 1, localP.hp, localP.maxHp, localP.currentWeapon, []);
            UI.updateMatchHUD(mpState.matchTimer, Network.ping, mpState.mode, mpState.teamScores, mpState.round);

            if (localP.dead) {
                UI.respawnTimerValue.textContent = Math.ceil(localP.respawnTimer);
            } else {
                UI.hideRespawnOverlay();
            }
        }

        // Scoreboard Update
        UI.updateScoreboard(mpState.players, Network.playerId, mpState.mode);

        // Update Particles
        Engine.updateParticles(dt);
    }

    function drawMultiplayer() {
        if (!mpState) return;

        ctx.save();
        
        // Power-ups
        for (const pu of mpState.powerUps) {
            const pObj = new PowerUp(pu.x, pu.y, pu.type);
            // Quick mock drawing
            pObj.draw(ctx);
        }

        // Bullets
        for (const b of mpState.bullets) {
            const bObj = new Bullet(b.x, b.y, b.angle, {speed: 0, color: b.color, type: b.type, bulletSize: b.radius}, 0, b.radius);
            bObj.draw(ctx);
        }

        // Enemies
        for (const e of mpState.enemies) {
            const eObj = new Enemy(e.x, e.y, e.type, mpState.wave || 1);
            eObj.hp = e.hp;
            eObj.maxHp = e.maxHp;
            eObj.draw(ctx);
        }

        // Players
        for (const rp of Object.values(remotePlayers)) {
            rp.draw(ctx);
            // Draw beam if shooting
            if (rp.shooting && WEAPONS[rp.currentWeapon].type === 'beam' && !rp.dead) {
                const w = WEAPONS[2];
                const range = w.beamRange || 600;
                const endX = rp.x + Math.cos(rp.angle) * range;
                const endY = rp.y + Math.sin(rp.angle) * range;

                ctx.save();
                ctx.strokeStyle = w.color;
                ctx.lineWidth = (w.beamWidth || 6) * 2;
                ctx.globalAlpha = 0.3;
                ctx.shadowColor = w.color;
                ctx.shadowBlur = 30;
                ctx.beginPath();
                ctx.moveTo(rp.x + Math.cos(rp.angle) * 24, rp.y + Math.sin(rp.angle) * 24);
                ctx.lineTo(endX, endY);
                ctx.stroke();

                ctx.lineWidth = w.beamWidth || 6;
                ctx.globalAlpha = 0.8;
                ctx.stroke();

                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.globalAlpha = 0.6;
                ctx.stroke();
                ctx.restore();
            }
        }

        // Particles
        Engine.drawParticles(ctx);

        ctx.restore();
    }

    // ---- General Update & Draw ----
    function update(dt) {
        time += dt;

        if (isMultiplayer) {
            updateMultiplayer(dt);
        } else {
            if (state === 'playing') {
                updateSinglePlayer(dt);
            }
        }
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Background
        const grad = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width * 0.7);
        grad.addColorStop(0, '#0d0d2b');
        grad.addColorStop(1, '#050510');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        Engine.drawStarfield(ctx, canvas.width, canvas.height, time);

        if (isMultiplayer) {
            if (state === 'playing' || state === 'countdown') {
                drawMultiplayer();
            }
        } else {
            if (state === 'playing' || state === 'paused' || state === 'augment') {
                const shake = Engine.updateShake(state === 'playing' ? 0.016 : 0);
                ctx.save();
                ctx.translate(shake.x, shake.y);

                if (state === 'playing' && Engine.mouse.down && player.currentWeapon === 2) drawBeamSP();
                
                powerUps.forEach(p => p.draw(ctx));
                enemyBullets.forEach(b => b.draw(ctx));
                bullets.forEach(b => b.draw(ctx));
                enemies.forEach(e => e.draw(ctx));
                player.draw(ctx);
                Engine.drawParticles(ctx);

                ctx.restore();
            }
        }
    }

    // ---- Game Controls ----
    function pauseGame() {
        state = 'paused';
        Sound.pause_open();
        UI.show('pause-menu');
    }

    function resumeGame() {
        state = 'playing';
        Sound.pause_close();
        UI.hide('pause-menu');
    }

    function quitToMenu() {
        state = 'menu';
        isMultiplayer = false;
        if (Network.connected) Network.disconnect();
        
        UI.hide('hud');
        UI.hide('pause-menu');
        UI.hide('gameover-screen');
        UI.hide('augment-screen');
        UI.hide('match-results');
        UI.hide('room-lobby');
        UI.hide('browser-screen');
        UI.hide('name-screen');
        UI.show('main-menu');
    }

    // ---- Loop ----
    let lastTime = 0;
    function loop(timestamp) {
        const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
        lastTime = timestamp;

        update(dt);
        draw();

        requestAnimationFrame(loop);
    }

    // Start
    init();

    return { canvas, ctx };
})();
