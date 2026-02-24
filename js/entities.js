/* ============================================
   NEON VORTEX — Entities
   Player, Enemies, Bullets, Power-ups, Weapons
   ============================================ */

// ---- WEAPON DEFINITIONS ----
const WEAPONS = [
    {
        name: 'Pulse Blaster',
        fireRate: 0.12,
        color: '#00f0ff',
        damage: 10,
        speed: 900,
        bulletSize: 4,
        type: 'pulse'
    },
    {
        name: 'Spread Cannon',
        fireRate: 0.35,
        color: '#ff6a00',
        damage: 8,
        speed: 750,
        bulletSize: 3,
        type: 'spread',
        count: 5,
        arc: 0.5
    },
    {
        name: 'Plasma Beam',
        fireRate: 0.016,
        color: '#a855f7',
        damage: 2,
        speed: 0,
        bulletSize: 0,
        type: 'beam',
        beamWidth: 6,
        beamRange: 600
    },
    {
        name: 'Rocket Launcher',
        fireRate: 0.7,
        color: '#ff2d55',
        damage: 60,
        speed: 400,
        bulletSize: 8,
        type: 'rocket',
        explosionRadius: 80
    },
    {
        name: 'Homing Missiles',
        fireRate: 0.4,
        color: '#39ff14',
        damage: 25,
        speed: 350,
        bulletSize: 5,
        type: 'homing',
        turnSpeed: 4
    },
    {
        name: 'Rail Gun',
        fireRate: 0.8,
        color: '#ffe600',
        damage: 45,
        speed: 2000,
        bulletSize: 3,
        type: 'rail',
        piercing: true
    }
];

// ---- AUGMENT DEFINITIONS ----
const AUGMENT_DEFS = [
    {
        id: 'bulletstorm', name: 'Bullet Storm',
        icon: '<svg viewBox="0 0 24 24" width="24" height="24"><path d="M12 2C6.48 2 2 6 2 11c0 3 1.5 5.5 4 7.5l-1 3.5 4-2c1 .3 2 .5 3 .5 5.52 0 10-4 10-9S17.52 2 12 2z" fill="none" stroke="#ff6a00" stroke-width="2"/><circle cx="8" cy="10" r="1.5" fill="#ff6a00"/><circle cx="12" cy="8" r="1.5" fill="#ff8800"/><circle cx="16" cy="10" r="1.5" fill="#ff6a00"/><path d="M8 14l2-2 2 2 2-2 2 2" stroke="#ff4400" stroke-width="1.5" fill="none"/></svg>',
        desc: '+20% fire rate for all weapons', effect: 'fireRate'
    },
    {
        id: 'thickhull', name: 'Thick Hull',
        icon: '<svg viewBox="0 0 24 24" width="24" height="24"><path d="M12 2L3 7v6c0 5.25 3.83 10.16 9 11.38 5.17-1.22 9-6.13 9-11.38V7l-9-5z" fill="none" stroke="#00f0ff" stroke-width="2"/><path d="M12 6l-5 3v4c0 3.5 2.3 6.8 5 7.6 2.7-.8 5-4.1 5-7.6V9l-5-3z" fill="rgba(0,240,255,0.15)" stroke="none"/></svg>',
        desc: '+25 max HP, heal 25 HP', effect: 'hull'
    },
    {
        id: 'magnetism', name: 'Magnetism',
        icon: '<svg viewBox="0 0 24 24" width="24" height="24"><path d="M4 6h4v2H4zM16 6h4v2h-4z" fill="#ff2d95"/><path d="M6 8v4a6 6 0 0 0 12 0V8" stroke="#aaa" stroke-width="2.5" fill="none"/><path d="M4 8h4M16 8h4" stroke="#ff2d95" stroke-width="2"/></svg>',
        desc: 'Auto-collect power-ups from 3x distance', effect: 'magnet'
    },
    {
        id: 'ricochet', name: 'Ricochet',
        icon: '<svg viewBox="0 0 24 24" width="24" height="24"><path d="M4 18l6-8 4 4 6-10" stroke="#ffe600" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="20" cy="4" r="2" fill="#ffe600"/><path d="M3 20l2-2M5 20l-2 0" stroke="#ffe600" stroke-width="1.5"/></svg>',
        desc: 'Bullets bounce once off edges', effect: 'ricochet'
    },
    {
        id: 'adrenaline', name: 'Adrenaline',
        icon: '<svg viewBox="0 0 24 24" width="24" height="24"><polygon points="13,2 3,14 12,14 11,22 21,10 12,10" fill="none" stroke="#39ff14" stroke-width="2" stroke-linejoin="round"/></svg>',
        desc: 'Move 15% faster', effect: 'speed'
    },
    {
        id: 'vampiric', name: 'Vampiric Rounds',
        icon: '<svg viewBox="0 0 24 24" width="24" height="24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="none" stroke="#ff2d55" stroke-width="2"/><circle cx="12" cy="10" r="2" fill="#ff2d55"/></svg>',
        desc: 'Heal 1 HP per kill', effect: 'vampiric'
    },
    {
        id: 'explosive', name: 'Explosive Finale',
        icon: '<svg viewBox="0 0 24 24" width="24" height="24"><circle cx="12" cy="13" r="7" fill="none" stroke="#ff6a00" stroke-width="2"/><line x1="12" y1="6" x2="12" y2="2" stroke="#ff6a00" stroke-width="2"/><path d="M12 2l-2 1h4l-2-1" fill="#ff6a00"/><line x1="7" y1="8" x2="4" y2="5" stroke="#ff8800" stroke-width="1.5"/><line x1="17" y1="8" x2="20" y2="5" stroke="#ff8800" stroke-width="1.5"/></svg>',
        desc: 'Enemies explode on death (AoE)', effect: 'explosive'
    },
    {
        id: 'overcharge', name: 'Overcharge',
        icon: '<svg viewBox="0 0 24 24" width="24" height="24"><rect x="6" y="4" width="12" height="18" rx="2" fill="none" stroke="#a855f7" stroke-width="2"/><rect x="9" y="2" width="6" height="3" rx="1" fill="#a855f7"/><rect x="8" y="10" width="8" height="10" rx="1" fill="rgba(168,85,247,0.3)"/></svg>',
        desc: '+30% bullet size & damage', effect: 'overcharge'
    },
    {
        id: 'luckystar', name: 'Lucky Star',
        icon: '<svg viewBox="0 0 24 24" width="24" height="24"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" fill="none" stroke="#ffe600" stroke-width="2" stroke-linejoin="round"/></svg>',
        desc: '2x power-up drop chance', effect: 'lucky'
    }
];

// ---- PLAYER ----
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 18;
        this.speed = 320;
        this.baseSpeed = 320;
        this.angle = 0;
        this.hp = 100;
        this.maxHp = 100;
        this.currentWeapon = 0;
        this.fireCooldown = 0;
        this.invincible = 0;
        this.shieldTimer = 0;
        this.augments = [];
        this.augmentCounts = {};

        // Thruster particles timer
        this.thrusterTimer = 0;
    }

    getFireRate() {
        let rate = WEAPONS[this.currentWeapon].fireRate;
        const stacks = this.augmentCounts['bulletstorm'] || 0;
        if (stacks > 0) rate *= Math.pow(0.8, stacks);
        return rate;
    }

    getDamage() {
        let dmg = WEAPONS[this.currentWeapon].damage;
        const stacks = this.augmentCounts['overcharge'] || 0;
        if (stacks > 0) dmg *= Math.pow(1.3, stacks);
        return dmg;
    }

    getBulletSize() {
        let s = WEAPONS[this.currentWeapon].bulletSize;
        const stacks = this.augmentCounts['overcharge'] || 0;
        if (stacks > 0) s *= Math.pow(1.3, stacks);
        return s;
    }

    addAugment(augId) {
        this.augments.push(augId);
        this.augmentCounts[augId] = (this.augmentCounts[augId] || 0) + 1;

        if (augId === 'thickhull') {
            this.maxHp += 25;
            this.hp = Math.min(this.hp + 25, this.maxHp);
        }
        if (augId === 'adrenaline') {
            this.speed = this.baseSpeed * Math.pow(1.15, this.augmentCounts['adrenaline']);
        }
    }

    hasAugment(augId) {
        return (this.augmentCounts[augId] || 0) > 0;
    }

    update(dt, canvasW, canvasH) {
        // Movement
        let dx = 0, dy = 0;
        if (Engine.keys['w'] || Engine.keys['arrowup']) dy -= 1;
        if (Engine.keys['s'] || Engine.keys['arrowdown']) dy += 1;
        if (Engine.keys['a'] || Engine.keys['arrowleft']) dx -= 1;
        if (Engine.keys['d'] || Engine.keys['arrowright']) dx += 1;

        if (dx !== 0 || dy !== 0) {
            const len = Math.sqrt(dx * dx + dy * dy);
            dx /= len; dy /= len;
            this.x += dx * this.speed * dt;
            this.y += dy * this.speed * dt;

            // Thruster particles
            this.thrusterTimer -= dt;
            if (this.thrusterTimer <= 0) {
                this.thrusterTimer = 0.03;
                const backAngle = this.angle + Math.PI;
                Engine.spawnParticles(
                    this.x + Math.cos(backAngle) * 14,
                    this.y + Math.sin(backAngle) * 14,
                    1,
                    { speed: 80, life: 0.3, size: 3, color: '#00f0ff', angle: backAngle, spread: 0.5 }
                );
            }
        }

        // Clamp to bounds
        this.x = Engine.clamp(this.x, this.radius, canvasW - this.radius);
        this.y = Engine.clamp(this.y, this.radius, canvasH - this.radius);

        // Aim at mouse
        this.angle = Engine.angleBetween(this.x, this.y, Engine.mouse.x, Engine.mouse.y);

        // Fire cooldown
        this.fireCooldown -= dt;
        this.invincible -= dt;
        this.shieldTimer -= dt;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Shield visualization
        if (this.shieldTimer > 0) {
            ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 10, 0, Math.PI * 2);
            ctx.stroke();
            ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 15, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Ship body - a sleek triangle shape
        ctx.fillStyle = this.invincible > 0 && Math.sin(Date.now() * 0.02) > 0 ? 'rgba(255,255,255,0.5)' : '#c8d8ff';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.moveTo(22, 0);
        ctx.lineTo(-14, -14);
        ctx.lineTo(-8, 0);
        ctx.lineTo(-14, 14);
        ctx.closePath();
        ctx.fill();

        // Cockpit glow
        ctx.fillStyle = '#00f0ff';
        ctx.shadowBlur = 30;
        ctx.beginPath();
        ctx.arc(4, 0, 4, 0, Math.PI * 2);
        ctx.fill();

        // Wing accents
        ctx.strokeStyle = '#00f0ff';
        ctx.shadowBlur = 10;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-10, -12);
        ctx.lineTo(14, 0);
        ctx.moveTo(-10, 12);
        ctx.lineTo(14, 0);
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.restore();
    }

    takeDamage(amount) {
        if (this.invincible > 0) return false;
        if (this.shieldTimer > 0) {
            this.shieldTimer = 0;
            Engine.spawnParticles(this.x, this.y, 20, { speed: 250, life: 0.5, size: 4, color: '#00f0ff' });
            this.invincible = 0.5;
            return false;
        }
        this.hp -= amount;
        this.invincible = 0.3;
        Engine.triggerShake(6, 0.15);
        Engine.spawnParticles(this.x, this.y, 8, { speed: 150, life: 0.3, size: 2, color: '#ff2d55' });
        return true;
    }
}

// ---- BULLET ----
class Bullet {
    constructor(x, y, angle, weapon, damage, size, owner = 'player') {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.speed = weapon.speed;
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
        this.radius = size;
        this.damage = damage;
        this.color = weapon.color;
        this.type = weapon.type;
        this.owner = owner;
        this.dead = false;
        this.life = 3;
        this.piercing = weapon.piercing || false;
        this.explosionRadius = weapon.explosionRadius || 0;
        this.turnSpeed = weapon.turnSpeed || 0;
        this.target = null;
        this.bounced = false;
        this.trail = [];
    }

    update(dt, canvasW, canvasH, enemies, ricochet) {
        // Homing logic
        if (this.type === 'homing' && this.owner === 'player') {
            if (!this.target || this.target.dead) {
                let minDist = Infinity;
                for (const e of enemies) {
                    if (e.dead) continue;
                    const d = Engine.distance(this.x, this.y, e.x, e.y);
                    if (d < minDist) { minDist = d; this.target = e; }
                }
            }
            if (this.target && !this.target.dead) {
                const desired = Engine.angleBetween(this.x, this.y, this.target.x, this.target.y);
                let diff = desired - this.angle;
                while (diff > Math.PI) diff -= Math.PI * 2;
                while (diff < -Math.PI) diff += Math.PI * 2;
                this.angle += Engine.clamp(diff, -this.turnSpeed * dt * 10, this.turnSpeed * dt * 10);
                this.vx = Math.cos(this.angle) * this.speed;
                this.vy = Math.sin(this.angle) * this.speed;
            }
        }

        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= dt;

        // Trail
        this.trail.push({ x: this.x, y: this.y, age: 0 });
        if (this.trail.length > 8) this.trail.shift();
        for (const t of this.trail) t.age += dt;

        // Bounds check / ricochet
        if (ricochet && !this.bounced) {
            if (this.x < 0 || this.x > canvasW) { this.vx *= -1; this.x = Engine.clamp(this.x, 0, canvasW); this.bounced = true; this.angle = Math.atan2(this.vy, this.vx); }
            if (this.y < 0 || this.y > canvasH) { this.vy *= -1; this.y = Engine.clamp(this.y, 0, canvasH); this.bounced = true; this.angle = Math.atan2(this.vy, this.vx); }
        } else {
            if (this.x < -50 || this.x > canvasW + 50 || this.y < -50 || this.y > canvasH + 50) this.dead = true;
        }

        if (this.life <= 0) this.dead = true;
    }

    draw(ctx) {
        // Trail
        for (let i = 0; i < this.trail.length; i++) {
            const t = this.trail[i];
            const alpha = (i / this.trail.length) * 0.4;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(t.x, t.y, this.radius * 0.6, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Main bullet
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15;
        ctx.beginPath();

        if (this.type === 'rocket') {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle);
            ctx.fillRect(-this.radius, -this.radius * 0.5, this.radius * 2, this.radius);
            ctx.restore();
        } else {
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.shadowBlur = 0;
    }
}

// ---- ENEMIES ----
class Enemy {
    constructor(x, y, type, wave) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.dead = false;
        this.flashTimer = 0;

        const s = 1 + wave * 0.08; // difficulty scaling
        switch (type) {
            case 'chaser':
                this.radius = 14;
                this.speed = 120 * s;
                this.hp = 30 * s;
                this.maxHp = this.hp;
                this.damage = 15;
                this.color = '#ff2d95';
                this.score = 100;
                break;
            case 'shooter':
                this.radius = 16;
                this.speed = 60 * s;
                this.hp = 40 * s;
                this.maxHp = this.hp;
                this.damage = 10;
                this.color = '#a855f7';
                this.score = 150;
                this.fireCooldown = 0;
                this.fireRate = Math.max(0.6, 1.5 - wave * 0.05);
                break;
            case 'boss':
                this.radius = 40;
                this.speed = 50 * Math.min(s, 2);
                this.hp = 500 * s;
                this.maxHp = this.hp;
                this.damage = 25;
                this.color = '#ffe600';
                this.score = 1000;
                this.fireCooldown = 0;
                this.fireRate = 0.4;
                this.phaseAngle = 0;
                break;
        }
    }

    update(dt, player, canvasW, canvasH) {
        this.flashTimer -= dt;
        const angle = Engine.angleBetween(this.x, this.y, player.x, player.y);

        switch (this.type) {
            case 'chaser':
                this.x += Math.cos(angle) * this.speed * dt;
                this.y += Math.sin(angle) * this.speed * dt;
                break;
            case 'shooter':
                const dist = Engine.distance(this.x, this.y, player.x, player.y);
                if (dist > 250) {
                    this.x += Math.cos(angle) * this.speed * dt;
                    this.y += Math.sin(angle) * this.speed * dt;
                } else if (dist < 180) {
                    this.x -= Math.cos(angle) * this.speed * 0.5 * dt;
                    this.y -= Math.sin(angle) * this.speed * 0.5 * dt;
                }
                this.fireCooldown -= dt;
                break;
            case 'boss':
                this.phaseAngle += dt * 0.5;
                const targetX = canvasW / 2 + Math.cos(this.phaseAngle) * 200;
                const targetY = 150 + Math.sin(this.phaseAngle * 1.5) * 80;
                this.x = Engine.lerp(this.x, targetX, dt * 0.8);
                this.y = Engine.lerp(this.y, targetY, dt * 0.8);
                this.fireCooldown -= dt;
                break;
        }

        // Clamp to bounds
        this.x = Engine.clamp(this.x, this.radius, canvasW - this.radius);
        this.y = Engine.clamp(this.y, this.radius, canvasH - this.radius);
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        const flash = this.flashTimer > 0;
        ctx.fillStyle = flash ? '#ffffff' : this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = flash ? 30 : 15;

        switch (this.type) {
            case 'chaser':
                // Pointed triangle
                ctx.beginPath();
                const a = Engine.angleBetween(0, 0, Engine.mouse.x - this.x, Engine.mouse.y - this.y);
                for (let i = 0; i < 3; i++) {
                    const angle = (i / 3) * Math.PI * 2 - Math.PI / 2;
                    ctx.lineTo(Math.cos(angle) * this.radius, Math.sin(angle) * this.radius);
                }
                ctx.closePath();
                ctx.fill();
                break;
            case 'shooter':
                // Diamond
                ctx.beginPath();
                ctx.moveTo(0, -this.radius);
                ctx.lineTo(this.radius * 0.7, 0);
                ctx.lineTo(0, this.radius);
                ctx.lineTo(-this.radius * 0.7, 0);
                ctx.closePath();
                ctx.fill();
                // Eye
                ctx.fillStyle = '#ffffff';
                ctx.shadowBlur = 0;
                ctx.beginPath();
                ctx.arc(0, 0, 3, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'boss':
                // Large hexagon
                ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const angle = (i / 6) * Math.PI * 2;
                    ctx.lineTo(Math.cos(angle) * this.radius, Math.sin(angle) * this.radius);
                }
                ctx.closePath();
                ctx.fill();
                // Inner ring
                ctx.strokeStyle = flash ? '#ffffff' : '#ff8800';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(0, 0, this.radius * 0.55, 0, Math.PI * 2);
                ctx.stroke();
                // HP bar
                const hpPct = this.hp / this.maxHp;
                ctx.fillStyle = 'rgba(0,0,0,0.5)';
                ctx.fillRect(-30, -this.radius - 14, 60, 6);
                ctx.fillStyle = hpPct > 0.3 ? '#39ff14' : '#ff2d55';
                ctx.fillRect(-30, -this.radius - 14, 60 * hpPct, 6);
                break;
        }

        ctx.shadowBlur = 0;
        ctx.restore();
    }

    takeDamage(amount) {
        this.hp -= amount;
        this.flashTimer = 0.08;
        if (this.hp <= 0) {
            this.dead = true;
        }
    }
}

// ---- POWER-UP ----
class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.radius = 12;
        this.dead = false;
        this.life = 10;
        this.bobPhase = Math.random() * Math.PI * 2;

        switch (type) {
            case 'health': this.color = '#39ff14'; break;
            case 'shield': this.color = '#00f0ff'; break;
            case 'ammo': this.color = '#ff6a00'; break;
        }
    }

    update(dt) {
        this.life -= dt;
        this.bobPhase += dt * 3;
        if (this.life <= 0) this.dead = true;
    }

    draw(ctx) {
        const bobY = Math.sin(this.bobPhase) * 4;
        ctx.save();
        ctx.translate(this.x, this.y + bobY);

        // Glow
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 20;
        ctx.fillStyle = this.color;
        ctx.globalAlpha = 0.2;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius + 6, 0, Math.PI * 2);
        ctx.fill();

        // Body
        ctx.globalAlpha = 1;
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Icon (canvas-drawn, no text)
        ctx.fillStyle = this.color;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 1.5;

        if (this.type === 'health') {
            // Cross / plus sign
            ctx.fillRect(-2, -6, 4, 12);
            ctx.fillRect(-6, -2, 12, 4);
        } else if (this.type === 'shield') {
            // Small shield shape
            ctx.beginPath();
            ctx.moveTo(0, -7);
            ctx.lineTo(6, -3);
            ctx.lineTo(6, 2);
            ctx.quadraticCurveTo(0, 9, 0, 9);
            ctx.quadraticCurveTo(0, 9, -6, 2);
            ctx.lineTo(-6, -3);
            ctx.closePath();
            ctx.stroke();
        } else if (this.type === 'ammo') {
            // Stacked bullets
            ctx.fillRect(-3, -6, 6, 3);
            ctx.fillRect(-3, -1, 6, 3);
            ctx.fillRect(-3, 4, 6, 3);
        }

        ctx.shadowBlur = 0;
        ctx.restore();
    }
}
