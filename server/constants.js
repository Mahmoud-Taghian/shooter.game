/* ============================================
   NEON VORTEX — Shared Constants
   Used by both server and client
   ============================================ */

const TICK_RATE = 20; // Server ticks per second
const TICK_MS = 1000 / TICK_RATE;
const ARENA_W = 1920;
const ARENA_H = 1080;

// ---- Player Colors (up to 16 distinct neon colors) ----
const PLAYER_COLORS = [
    '#00f0ff', // Cyan
    '#ff2d95', // Pink
    '#39ff14', // Green
    '#ff6a00', // Orange
    '#a855f7', // Purple
    '#ffe600', // Yellow
    '#ff2d55', // Red
    '#00ff88', // Mint
    '#ff8800', // Amber
    '#4488ff', // Blue
    '#ff44ff', // Magenta
    '#88ff00', // Lime
    '#ff4444', // Scarlet
    '#44ffff', // Aqua
    '#ffaa44', // Gold
    '#aa88ff', // Lavender
];

// ---- Weapon Definitions (mirrored from entities.js) ----
const WEAPONS = [
    {
        name: 'Pulse Blaster', fireRate: 0.12, color: '#00f0ff',
        damage: 10, speed: 900, bulletSize: 4, type: 'pulse'
    },
    {
        name: 'Spread Cannon', fireRate: 0.35, color: '#ff6a00',
        damage: 8, speed: 750, bulletSize: 3, type: 'spread',
        count: 5, arc: 0.5
    },
    {
        name: 'Plasma Beam', fireRate: 0.016, color: '#a855f7',
        damage: 2, speed: 0, bulletSize: 0, type: 'beam',
        beamWidth: 6, beamRange: 600
    },
    {
        name: 'Rocket Launcher', fireRate: 0.7, color: '#ff2d55',
        damage: 60, speed: 400, bulletSize: 8, type: 'rocket',
        explosionRadius: 140, aoeEnabled: true
    },
    {
        name: 'Homing Missiles', fireRate: 0.18, color: '#39ff14',
        damage: 25, speed: 420, bulletSize: 5, type: 'homing',
        turnSpeed: 5
    },
    {
        name: 'Rail Gun', fireRate: 0.6, color: '#ffe600',
        damage: 45, speed: 2400, bulletSize: 4, type: 'rail',
        piercing: true, bulletCount: 3, railSpread: 0.06
    }
];

// ---- Game Mode Configs ----
const MODES = {
    ffa: {
        name: 'Free For All',
        minPlayers: 1,
        maxPlayers: 8,
        respawnTime: 3,
        matchDuration: 300,    // 5 minutes
        scoreLimit: 30,
        friendlyFire: true,
    },
    tdm: {
        name: 'Team Deathmatch',
        minPlayers: 1,
        maxPlayers: 8,
        respawnTime: 3,
        matchDuration: 300,
        scoreLimit: 50,
        friendlyFire: false,
        teams: 2,
    },
    elimination: {
        name: 'Elimination',
        minPlayers: 1,
        maxPlayers: 6,
        respawnTime: -1,        // No respawn
        roundDuration: 90,
        bestOf: 5,
        friendlyFire: false,
        teams: 2,
    },
    pve: {
        name: 'Co-op PvE',
        minPlayers: 1,
        maxPlayers: 4,
        respawnTime: 5,
        friendlyFire: false,
        reviveTime: 3,
    },
    prophunt: {
        name: 'Prop Hunt',
        minPlayers: 4,
        maxPlayers: 16,
        hideTime: 30,
        seekTime: 180,
        bestOf: 2,
        teams: 2,
    }
};

// ---- Player Defaults ----
const PLAYER_DEFAULTS = {
    radius: 18,
    speed: 320,
    hp: 100,
    maxHp: 100,
    invincibleTime: 2,      // Respawn invincibility
};

// ---- PvE Enemy Definitions ----
const ENEMY_TYPES = {
    chaser: { radius: 14, speed: 120, hp: 30, damage: 15, score: 100, color: '#ff2d95' },
    shooter: { radius: 16, speed: 60, hp: 40, damage: 10, score: 150, color: '#a855f7', fireRate: 1.5 },
    boss: { radius: 40, speed: 50, hp: 500, damage: 25, score: 1000, color: '#ffe600', fireRate: 0.4 },
};

if (typeof module !== 'undefined') {
    module.exports = {
        TICK_RATE, TICK_MS, ARENA_W, ARENA_H,
        PLAYER_COLORS, WEAPONS, MODES, PLAYER_DEFAULTS, ENEMY_TYPES
    };
}
