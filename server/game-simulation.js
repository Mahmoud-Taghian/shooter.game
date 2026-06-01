/* ============================================
   NEON VORTEX — Server Game Simulation
   Authoritative game loop for all modes
   ============================================ */

const { v4: uuidv4 } = require('uuid');
const {
    TICK_RATE, TICK_MS, ARENA_W, ARENA_H,
    WEAPONS, MODES, PLAYER_DEFAULTS, PLAYER_COLORS, ENEMY_TYPES
} = require('./constants');

// ---- Utility ----
function distance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}
function angleBetween(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1);
}
function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
}
function circleCollision(a, b) {
    const d = distance(a.x, a.y, b.x, b.y);
    return d < (a.radius || 4) + (b.radius || 4);
}

// ---- Spawn Points ----
function getSpawnPoint(players, arenaW, arenaH, team = null) {
    const margin = 80;
    let bestX, bestY, bestDist = -1;

    for (let attempt = 0; attempt < 20; attempt++) {
        let x, y;
        
        // Team spawn zones (0 = Left, 1 = Right, 2 = Top, 3 = Bottom)
        if (team !== null && team !== undefined) {
            if (team === 0) {
                x = margin + Math.random() * (arenaW / 3);
                y = margin + Math.random() * (arenaH - margin * 2);
            } else if (team === 1) {
                x = arenaW - margin - Math.random() * (arenaW / 3);
                y = margin + Math.random() * (arenaH - margin * 2);
            } else {
                x = margin + Math.random() * (arenaW - margin * 2);
                y = margin + Math.random() * (arenaH - margin * 2);
            }
        } else {
            x = margin + Math.random() * (arenaW - margin * 2);
            y = margin + Math.random() * (arenaH - margin * 2);
        }

        let minDist = Infinity;
        for (const p of Object.values(players)) {
            if (p.dead) continue;
            // Only care about distance from enemies
            if (team !== null && p.team === team) continue;
            
            const d = distance(x, y, p.x, p.y);
            if (d < minDist) minDist = d;
        }

        if (minDist > bestDist) {
            bestDist = minDist;
            bestX = x;
            bestY = y;
        }
    }

    return { x: bestX || arenaW / 2, y: bestY || arenaH / 2 };
}

// ============================================
// GAME SIMULATION CLASS
// ============================================
class GameSimulation {
    constructor(roomId, mode, settings = {}) {
        this.roomId = roomId;
        this.mode = mode;
        this.config = { ...MODES[mode], ...settings };
        this.state = 'waiting'; // waiting | countdown | playing | roundEnd | finished
        this.players = {};
        this.bullets = [];
        this.enemies = [];
        this.powerUps = [];
        this.scores = {};
        this.killFeed = [];
        this.tick = 0;
        this.matchTimer = this.config.matchDuration || 300;
        this.countdownTimer = 0;
        this.interval = null;

        // PvE state
        this.wave = 0;
        this.enemiesRemaining = 0;
        this.waveDelay = 0;

        // Elimination state
        this.round = 0;
        this.roundScores = {};

        // Event callbacks
        this.onBroadcast = null;
        this.onEvent = null;
    }

    addPlayer(socketId, name) {
        const colorIdx = Object.keys(this.players).length % PLAYER_COLORS.length;
        // Default to a random spawn until team is assigned
        const spawn = getSpawnPoint(this.players, ARENA_W, ARENA_H);

        this.players[socketId] = {
            id: socketId,
            name: name || 'Player',
            x: spawn.x,
            y: spawn.y,
            angle: 0,
            radius: PLAYER_DEFAULTS.radius,
            speed: PLAYER_DEFAULTS.speed,
            hp: PLAYER_DEFAULTS.hp,
            maxHp: PLAYER_DEFAULTS.maxHp,
            currentWeapon: 0,
            fireCooldown: 0,
            invincible: PLAYER_DEFAULTS.invincibleTime,
            dead: false,
            respawnTimer: 0,
            color: PLAYER_COLORS[colorIdx],
            colorIndex: colorIdx,
            team: null,
            input: { up: false, down: false, left: false, right: false, angle: 0, shooting: false, weapon: 0 },
            kills: 0,
            deaths: 0,
            score: 0,
        };

        this.scores[socketId] = { kills: 0, deaths: 0, score: 0 };
        return this.players[socketId];
    }

    removePlayer(socketId) {
        // Clean up bullets owned by this player
        this.bullets = this.bullets.filter(b => b.ownerId !== socketId);
        delete this.players[socketId];
        delete this.scores[socketId];
    }

    setPlayerInput(socketId, input) {
        const player = this.players[socketId];
        if (player) {
            player.input = input;
            if (input.weapon !== undefined && input.weapon >= 0 && input.weapon < WEAPONS.length) {
                player.currentWeapon = input.weapon;
            }
        }
    }

    startCountdown() {
        this.state = 'countdown';
        this.countdownTimer = 3;

        // Assign teams if needed
        if (this.config.teams) {
            this.assignTeams();
        }

        // Start the tick loop so countdown can tick and broadcast
        if (this.interval) clearInterval(this.interval);
        this.interval = setInterval(() => this.update(1 / TICK_RATE), TICK_MS);
    }

    assignTeams() {
        const playerIds = Object.keys(this.players);
        const teamCount = this.config.teams || 2;
        const teamColors = ['#0088ff', '#ff2d55', '#39ff14', '#ffe600']; // Blue, Red, Green, Yellow
        playerIds.forEach((id, i) => {
            const team = i % teamCount;
            this.players[id].team = team;
            this.players[id].color = teamColors[team];
        });
    }

    start() {
        this.state = 'playing';
        this.matchTimer = this.config.matchDuration || 300;
        this.tick = 0;

        // Reset all players
        for (const p of Object.values(this.players)) {
            const spawn = getSpawnPoint(this.players, ARENA_W, ARENA_H, p.team);
            p.x = spawn.x;
            p.y = spawn.y;
            p.hp = PLAYER_DEFAULTS.hp;
            p.maxHp = PLAYER_DEFAULTS.maxHp;
            p.dead = false;
            p.invincible = PLAYER_DEFAULTS.invincibleTime;
            p.fireCooldown = 0;
            p.kills = 0;
            p.deaths = 0;
            p.score = 0;
        }

        this.bullets = [];
        this.enemies = [];
        this.powerUps = [];
        this.killFeed = [];

        // Start PvE waves
        if (this.mode === 'pve') {
            this.wave = 0;
            this.waveDelay = 2;
        }

        // Start the tick loop (clear first in case already running from countdown)
        if (this.interval) clearInterval(this.interval);
        this.interval = setInterval(() => this.update(1 / TICK_RATE), TICK_MS);
    }

    stop() {
        this.state = 'finished';
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    // ---- MAIN UPDATE ----
    update(dt) {
        if (this.state === 'countdown') {
            this.countdownTimer -= dt;
            if (this.countdownTimer <= 0) {
                this.start();
            }
            this.broadcast();
            return;
        }

        if (this.state !== 'playing') return;

        this.tick++;

        // Match timer
        this.matchTimer -= dt;
        if (this.matchTimer <= 0) {
            this.endMatch();
            return;
        }

        // Update players
        for (const p of Object.values(this.players)) {
            this.updatePlayer(p, dt);
        }

        // Update bullets
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            this.updateBullet(this.bullets[i], dt);
            if (this.bullets[i].dead) this.bullets.splice(i, 1);
        }

        // Update enemies (PvE)
        if (this.mode === 'pve') {
            this.updatePvE(dt);
        }

        // Update power-ups
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            this.powerUps[i].life -= dt;
            if (this.powerUps[i].life <= 0) {
                this.powerUps.splice(i, 1);
                continue;
            }
        }

        // Collision detection
        this.checkCollisions();

        // Check win conditions
        this.checkWinConditions();

        // Broadcast state
        this.broadcast();
    }

    // ---- Player Update ----
    updatePlayer(p, dt) {
        if (p.dead) {
            p.respawnTimer -= dt;
            if (p.respawnTimer <= 0 && this.config.respawnTime >= 0) {
                this.respawnPlayer(p);
            }
            return;
        }

        p.invincible -= dt;
        p.fireCooldown -= dt;

        // Movement
        const input = p.input;
        let dx = 0, dy = 0;
        if (input.up) dy -= 1;
        if (input.down) dy += 1;
        if (input.left) dx -= 1;
        if (input.right) dx += 1;

        if (dx !== 0 || dy !== 0) {
            const len = Math.sqrt(dx * dx + dy * dy);
            dx /= len;
            dy /= len;
            p.x += dx * p.speed * dt;
            p.y += dy * p.speed * dt;
        }

        // Clamp to arena
        p.x = clamp(p.x, p.radius, ARENA_W - p.radius);
        p.y = clamp(p.y, p.radius, ARENA_H - p.radius);

        // Aim angle from client
        p.angle = input.angle || 0;

        // Shooting
        if (input.shooting && p.fireCooldown <= 0) {
            this.playerShoot(p);
        }
    }

    // ---- Shooting ----
    playerShoot(p) {
        const w = WEAPONS[p.currentWeapon];
        p.fireCooldown = w.fireRate;

        const muzzleX = p.x + Math.cos(p.angle) * 24;
        const muzzleY = p.y + Math.sin(p.angle) * 24;

        switch (w.type) {
            case 'pulse':
                this.spawnBullet(p, muzzleX, muzzleY, p.angle, w);
                break;

            case 'spread':
                for (let i = 0; i < (w.count || 5); i++) {
                    const offset = (i - 2) * (w.arc / (w.count - 1));
                    this.spawnBullet(p, muzzleX, muzzleY, p.angle + offset, w);
                }
                break;

            case 'beam':
                this.handleBeam(p, w);
                break;

            case 'rocket':
                this.spawnBullet(p, muzzleX, muzzleY, p.angle, w);
                break;

            case 'homing':
                this.spawnBullet(p, muzzleX, muzzleY, p.angle, w);
                break;

            case 'rail': {
                const bulletCount = w.bulletCount || 3;
                const spread = w.railSpread || 0.06;
                for (let i = 0; i < bulletCount; i++) {
                    const offset = (i - (bulletCount - 1) / 2) * spread;
                    this.spawnBullet(p, muzzleX, muzzleY, p.angle + offset, w);
                }
                break;
            }
        }
    }

    spawnBullet(owner, x, y, angle, weapon) {
        this.bullets.push({
            id: uuidv4().slice(0, 8),
            ownerId: owner.id,
            ownerTeam: owner.team,
            x, y, angle,
            vx: Math.cos(angle) * weapon.speed,
            vy: Math.sin(angle) * weapon.speed,
            speed: weapon.speed,
            radius: weapon.bulletSize || 4,
            damage: weapon.damage,
            color: weapon.color,
            type: weapon.type,
            life: 3,
            dead: false,
            piercing: weapon.piercing || false,
            explosionRadius: weapon.explosionRadius || 0,
            aoeEnabled: weapon.aoeEnabled || false,
            turnSpeed: weapon.turnSpeed || 0,
            target: null,
            bounced: false,
        });
    }

    handleBeam(p, w) {
        const range = w.beamRange || 600;
        const dmg = w.damage * (1 / TICK_RATE) * 60; // DPS-based

        for (const target of Object.values(this.players)) {
            if (target.id === p.id || target.dead) continue;
            if (!this.config.friendlyFire && target.team === p.team && p.team !== null) continue;

            const dx = Math.cos(p.angle);
            const dy = Math.sin(p.angle);
            const toEX = target.x - p.x;
            const toEY = target.y - p.y;
            const proj = toEX * dx + toEY * dy;
            if (proj < 0 || proj > range) continue;
            const perpDist = Math.abs(toEX * dy - toEY * dx);
            if (perpDist < target.radius + (w.beamWidth || 6)) {
                this.damagePlayer(target, dmg, p);
            }
        }
    }

    // ---- Bullet Update ----
    updateBullet(b, dt) {
        // Homing logic
        if (b.type === 'homing' && b.turnSpeed > 0) {
            let closestDist = Infinity;
            let closestTarget = null;

            for (const p of Object.values(this.players)) {
                if (p.id === b.ownerId || p.dead) continue;
                if (!this.config.friendlyFire && p.team === b.ownerTeam && b.ownerTeam !== null) continue;
                const d = distance(b.x, b.y, p.x, p.y);
                if (d < closestDist) {
                    closestDist = d;
                    closestTarget = p;
                }
            }

            if (closestTarget) {
                const desired = angleBetween(b.x, b.y, closestTarget.x, closestTarget.y);
                let diff = desired - b.angle;
                while (diff > Math.PI) diff -= Math.PI * 2;
                while (diff < -Math.PI) diff += Math.PI * 2;
                b.angle += clamp(diff, -b.turnSpeed * dt * 10, b.turnSpeed * dt * 10);
                b.vx = Math.cos(b.angle) * b.speed;
                b.vy = Math.sin(b.angle) * b.speed;
            }
        }

        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.life -= dt;

        // Bounds check
        if (b.x < -50 || b.x > ARENA_W + 50 || b.y < -50 || b.y > ARENA_H + 50) {
            b.dead = true;
        }
        if (b.life <= 0) b.dead = true;
    }

    // ---- Collision Detection ----
    checkCollisions() {
        // Bullets vs Players
        for (let bi = this.bullets.length - 1; bi >= 0; bi--) {
            const b = this.bullets[bi];
            if (b.dead) continue;

            for (const p of Object.values(this.players)) {
                if (p.dead || p.id === b.ownerId) continue;
                if (!this.config.friendlyFire && p.team === b.ownerTeam && b.ownerTeam !== null) continue;

                if (circleCollision(b, p)) {
                    this.damagePlayer(p, b.damage, this.players[b.ownerId]);

                    // AoE explosion (rocket)
                    if (b.aoeEnabled && b.explosionRadius > 0) {
                        this.aoeExplosion(b.x, b.y, b.explosionRadius, b.damage * 0.6, b.ownerId, b.ownerTeam);
                    }

                    if (!b.piercing) {
                        b.dead = true;
                    }
                    break;
                }
            }
        }

        // Bullets vs Enemies (PvE)
        if (this.mode === 'pve') {
            for (let bi = this.bullets.length - 1; bi >= 0; bi--) {
                const b = this.bullets[bi];
                if (b.dead) continue;

                for (let ei = this.enemies.length - 1; ei >= 0; ei--) {
                    const e = this.enemies[ei];
                    if (e.dead) continue;

                    if (circleCollision(b, e)) {
                        e.hp -= b.damage;
                        if (e.hp <= 0) {
                            e.dead = true;
                            this.enemiesRemaining--;
                            // Award score to shooter
                            const shooter = this.players[b.ownerId];
                            if (shooter) {
                                shooter.score += e.score;
                                this.scores[b.ownerId].score += e.score;
                            }
                            this.trySpawnPowerUp(e.x, e.y);
                        }

                        if (b.aoeEnabled && b.explosionRadius > 0) {
                            this.aoeExplosionPvE(b.x, b.y, b.explosionRadius, b.damage * 0.6);
                        }

                        if (!b.piercing) {
                            b.dead = true;
                        }
                        break;
                    }
                }
            }

            // Enemies vs Players
            for (const e of this.enemies) {
                if (e.dead) continue;
                for (const p of Object.values(this.players)) {
                    if (p.dead || p.invincible > 0) continue;
                    if (circleCollision(e, p)) {
                        this.damagePlayer(p, e.damage, null);
                        // Push player away
                        const a = angleBetween(e.x, e.y, p.x, p.y);
                        p.x += Math.cos(a) * 40;
                        p.y += Math.sin(a) * 40;
                        p.x = clamp(p.x, p.radius, ARENA_W - p.radius);
                        p.y = clamp(p.y, p.radius, ARENA_H - p.radius);
                    }
                }
            }

            // Remove dead enemies
            this.enemies = this.enemies.filter(e => !e.dead);
        }

        // Players vs Power-ups
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const pu = this.powerUps[i];
            for (const p of Object.values(this.players)) {
                if (p.dead) continue;
                if (circleCollision(pu, p)) {
                    this.applyPowerUp(pu, p);
                    this.powerUps.splice(i, 1);
                    break;
                }
            }
        }
    }

    aoeExplosion(x, y, radius, damage, ownerId, ownerTeam) {
        for (const p of Object.values(this.players)) {
            if (p.dead || p.id === ownerId) continue;
            if (!this.config.friendlyFire && p.team === ownerTeam && ownerTeam !== null) continue;
            const d = distance(x, y, p.x, p.y);
            if (d < radius) {
                const falloff = 1 - (d / radius) * 0.5;
                this.damagePlayer(p, damage * falloff, this.players[ownerId]);
            }
        }

        if (this.onEvent) {
            this.onEvent('explosion', { x, y, radius });
        }
    }

    aoeExplosionPvE(x, y, radius, damage) {
        for (const e of this.enemies) {
            if (e.dead) continue;
            const d = distance(x, y, e.x, e.y);
            if (d < radius) {
                const falloff = 1 - (d / radius) * 0.5;
                e.hp -= damage * falloff;
                if (e.hp <= 0) {
                    e.dead = true;
                    this.enemiesRemaining--;
                }
            }
        }
    }

    // ---- Damage & Death ----
    damagePlayer(target, amount, attacker) {
        if (target.invincible > 0) return;

        target.hp -= amount;
        if (target.hp <= 0) {
            target.hp = 0;
            target.dead = true;
            target.deaths++;
            target.respawnTimer = this.config.respawnTime || 3;
            target.killedBy = attacker ? attacker.name : 'Environment';

            if (this.scores[target.id]) {
                this.scores[target.id].deaths++;
            }

            if (attacker && attacker.id !== target.id) {
                attacker.kills++;
                attacker.score += 100;
                if (this.scores[attacker.id]) {
                    this.scores[attacker.id].kills++;
                    this.scores[attacker.id].score += 100;
                }
            }

            // Kill feed entry
            const entry = {
                killerId: attacker ? attacker.id : null,
                killerName: attacker ? attacker.name : 'Environment',
                victimId: target.id,
                victimName: target.name,
                weapon: attacker ? WEAPONS[attacker.currentWeapon].name : 'contact',
                timestamp: Date.now(),
            };
            this.killFeed.push(entry);
            if (this.killFeed.length > 10) this.killFeed.shift();

            if (this.onEvent) {
                this.onEvent('player_death', entry);
            }
        }
    }

    respawnPlayer(p) {
        const spawn = getSpawnPoint(this.players, ARENA_W, ARENA_H, p.team);
        p.x = spawn.x;
        p.y = spawn.y;
        p.hp = PLAYER_DEFAULTS.hp;
        p.dead = false;
        p.invincible = PLAYER_DEFAULTS.invincibleTime;
        p.fireCooldown = 0;
        p.killedBy = null;
    }

    // ---- Power-ups ----
    trySpawnPowerUp(x, y) {
        if (Math.random() < 0.2) {
            const types = ['health', 'health', 'shield', 'ammo'];
            const type = types[Math.floor(Math.random() * types.length)];
            const colors = { health: '#39ff14', shield: '#00f0ff', ammo: '#ff6a00' };
            this.powerUps.push({
                id: uuidv4().slice(0, 8),
                x, y,
                type,
                radius: 12,
                color: colors[type],
                life: 15,
            });
        }
    }

    applyPowerUp(pu, player) {
        switch (pu.type) {
            case 'health':
                player.hp = Math.min(player.hp + 30, player.maxHp);
                break;
            case 'shield':
                player.invincible = 8;
                break;
            case 'ammo':
                player.fireCooldown = 0;
                break;
        }
    }

    // ---- PvE Wave System ----
    updatePvE(dt) {
        const playerCount = Object.values(this.players).filter(p => !p.dead).length;

        // Update enemies
        const alivePlayers = Object.values(this.players).filter(p => !p.dead);
        for (const e of this.enemies) {
            if (e.dead) continue;
            this.updateEnemy(e, dt, alivePlayers);
        }

        // Check wave complete
        if (this.enemiesRemaining <= 0 && this.enemies.length === 0) {
            this.waveDelay -= dt;
            if (this.waveDelay <= 0) {
                this.nextPvEWave(playerCount);
            }
        }

        // Check all dead = game over
        if (alivePlayers.length === 0 && Object.keys(this.players).length > 0) {
            this.endMatch();
        }
    }

    nextPvEWave(playerCount) {
        this.wave++;
        this.waveDelay = 2;
        const scale = 1 + (playerCount - 1) * 0.5; // Difficulty scales with player count

        const isBoss = this.wave % 5 === 0;
        if (this.onEvent) {
            this.onEvent('wave_start', { wave: this.wave, isBoss });
        }

        if (isBoss) {
            this.spawnEnemy('boss', scale);
            const extras = Math.min(this.wave, 8);
            for (let i = 0; i < extras * scale; i++) {
                setTimeout(() => this.spawnEnemy('chaser', scale), i * 400);
            }
            this.enemiesRemaining = 1 + Math.floor(extras * scale);
        } else {
            const chaserCount = Math.floor((3 + this.wave * 2) * scale);
            const shooterCount = Math.floor(this.wave * 0.8 * scale);
            this.enemiesRemaining = chaserCount + shooterCount;

            for (let i = 0; i < chaserCount; i++) {
                setTimeout(() => this.spawnEnemy('chaser', scale), i * 300);
            }
            for (let i = 0; i < shooterCount; i++) {
                setTimeout(() => this.spawnEnemy('shooter', scale), chaserCount * 300 + i * 500);
            }
        }
    }

    spawnEnemy(type, scale = 1) {
        if (this.state !== 'playing') return;
        const def = ENEMY_TYPES[type];
        const s = 1 + this.wave * 0.08;

        let x, y;
        const side = Math.floor(Math.random() * 4);
        switch (side) {
            case 0: x = Math.random() * ARENA_W; y = -40; break;
            case 1: x = ARENA_W + 40; y = Math.random() * ARENA_H; break;
            case 2: x = Math.random() * ARENA_W; y = ARENA_H + 40; break;
            case 3: x = -40; y = Math.random() * ARENA_H; break;
        }

        this.enemies.push({
            id: uuidv4().slice(0, 8),
            type,
            x, y,
            radius: def.radius,
            speed: def.speed * s,
            hp: def.hp * s * scale,
            maxHp: def.hp * s * scale,
            damage: def.damage,
            color: def.color,
            score: def.score,
            dead: false,
            fireCooldown: 0,
            fireRate: def.fireRate || 99,
            phaseAngle: 0,
        });
    }

    updateEnemy(e, dt, alivePlayers) {
        if (alivePlayers.length === 0) return;

        // Find closest player
        let closest = alivePlayers[0];
        let closestDist = Infinity;
        for (const p of alivePlayers) {
            const d = distance(e.x, e.y, p.x, p.y);
            if (d < closestDist) {
                closestDist = d;
                closest = p;
            }
        }

        const angle = angleBetween(e.x, e.y, closest.x, closest.y);

        switch (e.type) {
            case 'chaser':
                e.x += Math.cos(angle) * e.speed * dt;
                e.y += Math.sin(angle) * e.speed * dt;
                break;
            case 'shooter':
                if (closestDist > 250) {
                    e.x += Math.cos(angle) * e.speed * dt;
                    e.y += Math.sin(angle) * e.speed * dt;
                } else if (closestDist < 180) {
                    e.x -= Math.cos(angle) * e.speed * 0.5 * dt;
                    e.y -= Math.sin(angle) * e.speed * 0.5 * dt;
                }
                e.fireCooldown -= dt;
                if (e.fireCooldown <= 0) {
                    e.fireCooldown = e.fireRate;
                    this.enemyShoot(e, closest);
                }
                break;
            case 'boss':
                e.phaseAngle += dt * 0.5;
                const tx = ARENA_W / 2 + Math.cos(e.phaseAngle) * 200;
                const ty = 150 + Math.sin(e.phaseAngle * 1.5) * 80;
                e.x += (tx - e.x) * dt * 0.8;
                e.y += (ty - e.y) * dt * 0.8;
                e.fireCooldown -= dt;
                if (e.fireCooldown <= 0) {
                    e.fireCooldown = e.fireRate;
                    this.enemyShoot(e, closest);
                }
                break;
        }

        e.x = clamp(e.x, e.radius, ARENA_W - e.radius);
        e.y = clamp(e.y, e.radius, ARENA_H - e.radius);
    }

    enemyShoot(enemy, target) {
        const angle = angleBetween(enemy.x, enemy.y, target.x, target.y);
        this.bullets.push({
            id: uuidv4().slice(0, 8),
            ownerId: '__enemy__',
            ownerTeam: '__enemy__',
            x: enemy.x,
            y: enemy.y,
            angle,
            vx: Math.cos(angle) * 300,
            vy: Math.sin(angle) * 300,
            speed: 300,
            radius: 4,
            damage: enemy.type === 'boss' ? 20 : 12,
            color: enemy.color,
            type: 'pulse',
            life: 4,
            dead: false,
            piercing: false,
            explosionRadius: 0,
            aoeEnabled: false,
            turnSpeed: 0,
            target: null,
            bounced: false,
        });
    }

    // ---- Win Conditions ----
    checkWinConditions() {
        if (this.mode === 'ffa') {
            // Check score limit
            for (const p of Object.values(this.players)) {
                if (p.kills >= this.config.scoreLimit) {
                    this.endMatch();
                    return;
                }
            }
        }

        if (this.mode === 'tdm') {
            const teamKills = {};
            for (const p of Object.values(this.players)) {
                if (p.team !== null) {
                    teamKills[p.team] = (teamKills[p.team] || 0) + p.kills;
                }
            }
            for (const [team, kills] of Object.entries(teamKills)) {
                if (kills >= this.config.scoreLimit) {
                    this.endMatch();
                    return;
                }
            }
        }

        if (this.mode === 'elimination') {
            // Check if only one team has alive players
            const aliveTeams = new Set();
            for (const p of Object.values(this.players)) {
                if (!p.dead) aliveTeams.add(p.team);
            }
            if (aliveTeams.size <= 1 && Object.keys(this.players).length > 1) {
                const winningTeam = aliveTeams.values().next().value;
                this.roundScores[winningTeam] = (this.roundScores[winningTeam] || 0) + 1;

                if (this.onEvent) {
                    this.onEvent('round_end', { winner: winningTeam, scores: { ...this.roundScores } });
                }

                // Check best-of
                const needed = Math.ceil(this.config.bestOf / 2);
                for (const [team, wins] of Object.entries(this.roundScores)) {
                    if (wins >= needed) {
                        this.endMatch();
                        return;
                    }
                }

                // Start new round
                this.round++;
                setTimeout(() => this.startNewRound(), 3000);
            }
        }
    }

    startNewRound() {
        this.bullets = [];
        for (const p of Object.values(this.players)) {
            const spawn = getSpawnPoint(this.players, ARENA_W, ARENA_H);
            p.x = spawn.x;
            p.y = spawn.y;
            p.hp = PLAYER_DEFAULTS.hp;
            p.dead = false;
            p.invincible = PLAYER_DEFAULTS.invincibleTime;
        }
        if (this.onEvent) {
            this.onEvent('round_start', { round: this.round + 1 });
        }
    }

    endMatch() {
        this.stop();

        // Determine winner
        let winner = null;
        if (this.mode === 'ffa') {
            let maxKills = -1;
            for (const p of Object.values(this.players)) {
                if (p.kills > maxKills) {
                    maxKills = p.kills;
                    winner = { id: p.id, name: p.name, kills: p.kills };
                }
            }
        }

        const results = {
            mode: this.mode,
            winner,
            scores: { ...this.scores },
            players: Object.values(this.players).map(p => ({
                id: p.id, name: p.name, kills: p.kills, deaths: p.deaths,
                score: p.score, team: p.team, color: p.color,
            })),
            wave: this.wave || 0,
        };

        if (this.onEvent) {
            this.onEvent('match_end', results);
        }
    }

    // ---- State Snapshot ----
    getState() {
        // Calculate team scores for TDM
        const teamScores = {};
        if (this.mode === 'tdm') {
            for (const p of Object.values(this.players)) {
                if (p.team !== null) {
                    teamScores[p.team] = (teamScores[p.team] || 0) + p.kills;
                }
            }
        }

        return {
            tick: this.tick,
            state: this.state,
            matchTimer: Math.ceil(this.matchTimer),
            countdownTimer: Math.ceil(this.countdownTimer),
            teamScores,
            roundScores: this.roundScores,
            round: this.round,
            players: Object.values(this.players).map(p => ({
                id: p.id,
                name: p.name,
                x: Math.round(p.x * 10) / 10,
                y: Math.round(p.y * 10) / 10,
                angle: Math.round(p.angle * 100) / 100,
                hp: Math.round(p.hp),
                maxHp: p.maxHp,
                currentWeapon: p.currentWeapon,
                dead: p.dead,
                respawnTimer: Math.ceil(p.respawnTimer * 10) / 10,
                invincible: p.invincible > 0,
                color: p.color,
                colorIndex: p.colorIndex,
                team: p.team,
                kills: p.kills,
                deaths: p.deaths,
                score: p.score,
                shooting: p.input.shooting,
            })),
            bullets: this.bullets.map(b => ({
                id: b.id,
                x: Math.round(b.x * 10) / 10,
                y: Math.round(b.y * 10) / 10,
                angle: Math.round(b.angle * 100) / 100,
                radius: b.radius,
                color: b.color,
                type: b.type,
                ownerId: b.ownerId,
            })),
            enemies: this.enemies.map(e => ({
                id: e.id,
                type: e.type,
                x: Math.round(e.x * 10) / 10,
                y: Math.round(e.y * 10) / 10,
                radius: e.radius,
                hp: Math.round(e.hp),
                maxHp: Math.round(e.maxHp),
                color: e.color,
                dead: e.dead,
            })),
            powerUps: this.powerUps.map(pu => ({
                id: pu.id,
                x: pu.x,
                y: pu.y,
                type: pu.type,
                color: pu.color,
                radius: pu.radius,
            })),
            killFeed: this.killFeed.slice(-5),
            wave: this.wave,
            mode: this.mode,
        };
    }

    broadcast() {
        if (this.onBroadcast) {
            this.onBroadcast(this.getState());
        }
    }
}

module.exports = { GameSimulation };
