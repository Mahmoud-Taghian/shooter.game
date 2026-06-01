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
        explosionRadius: 140,
        aoeEnabled: true
    },
    {
        name: 'Homing Missiles',
        fireRate: 0.18,
        color: '#39ff14',
        damage: 25,
        speed: 420,
        bulletSize: 5,
        type: 'homing',
        turnSpeed: 5
    },
    {
        name: 'Rail Gun',
        fireRate: 0.6,
        color: '#ffe600',
        damage: 45,
        speed: 2400,
        bulletSize: 4,
        type: 'rail',
        piercing: true,
        bulletCount: 3,
        railSpread: 0.06
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

        // Animation timers
        this.thrusterTimer = 0;
        this.enginePulse = 0;
        this.wingFlap = 0;
        this.shieldRotation = 0;
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

        const isMoving = dx !== 0 || dy !== 0;

        if (isMoving) {
            const len = Math.sqrt(dx * dx + dy * dy);
            dx /= len; dy /= len;
            this.x += dx * this.speed * dt;
            this.y += dy * this.speed * dt;

            // Thruster particles
            this.thrusterTimer -= dt;
            if (this.thrusterTimer <= 0) {
                this.thrusterTimer = 0.025;
                const backAngle = this.angle + Math.PI;
                Engine.spawnParticles(
                    this.x + Math.cos(backAngle) * 16,
                    this.y + Math.sin(backAngle) * 16,
                    2,
                    { speed: 100, life: 0.35, size: 3.5, color: '#00f0ff', angle: backAngle, spread: 0.4 }
                );
                // Secondary orange thruster
                Engine.spawnParticles(
                    this.x + Math.cos(backAngle) * 14,
                    this.y + Math.sin(backAngle) * 14,
                    1,
                    { speed: 60, life: 0.2, size: 2, color: '#ff8800', angle: backAngle, spread: 0.3 }
                );
            }
        }

        // Animate
        this.enginePulse += dt * 8;
        this.wingFlap += dt * (isMoving ? 12 : 4);
        this.shieldRotation += dt * 2;

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

        const pulseVal = Math.sin(this.enginePulse) * 0.5 + 0.5;
        const isFlashing = this.invincible > 0 && Math.sin(Date.now() * 0.02) > 0;

        // Shield visualization
        if (this.shieldTimer > 0) {
            ctx.save();
            ctx.rotate(-this.angle + this.shieldRotation);
            // Outer shield hex ring
            ctx.strokeStyle = `rgba(0, 240, 255, ${0.25 + pulseVal * 0.2})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const a = (i / 6) * Math.PI * 2;
                const r = this.radius + 14 + Math.sin(this.shieldRotation * 3 + i) * 2;
                if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
                else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
            }
            ctx.closePath();
            ctx.stroke();
            // Inner shield circle
            ctx.strokeStyle = `rgba(0, 240, 255, ${0.15 + pulseVal * 0.1})`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 8, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        // Engine glow (behind ship)
        const engineGlow = 12 + pulseVal * 8;
        const engineGlowGrad = ctx.createRadialGradient(-12, 0, 0, -12, 0, engineGlow);
        engineGlowGrad.addColorStop(0, `rgba(0, 200, 255, ${0.3 + pulseVal * 0.15})`);
        engineGlowGrad.addColorStop(0.5, `rgba(0, 120, 255, ${0.1 + pulseVal * 0.05})`);
        engineGlowGrad.addColorStop(1, 'rgba(0, 80, 255, 0)');
        ctx.fillStyle = engineGlowGrad;
        ctx.beginPath();
        ctx.arc(-12, 0, engineGlow, 0, Math.PI * 2);
        ctx.fill();

        // Ship body outline glow
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = isFlashing ? 35 : 18;

        // Wing panels (back fins)
        const flapOffset = Math.sin(this.wingFlap) * 1.5;
        ctx.fillStyle = isFlashing ? 'rgba(255,255,255,0.6)' : '#6880aa';
        ctx.beginPath();
        ctx.moveTo(-16, -16 - flapOffset);
        ctx.lineTo(-8, -10);
        ctx.lineTo(-14, -6);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-16, 16 + flapOffset);
        ctx.lineTo(-8, 10);
        ctx.lineTo(-14, 6);
        ctx.closePath();
        ctx.fill();

        // Main hull - sleek fighter shape
        ctx.fillStyle = isFlashing ? 'rgba(255,255,255,0.7)' : '#b0c4e8';
        ctx.beginPath();
        ctx.moveTo(24, 0);         // Nose
        ctx.lineTo(10, -6);
        ctx.lineTo(-4, -12);
        ctx.lineTo(-14, -14);      // Left wing tip
        ctx.lineTo(-10, -4);
        ctx.lineTo(-12, 0);
        ctx.lineTo(-10, 4);
        ctx.lineTo(-14, 14);       // Right wing tip
        ctx.lineTo(-4, 12);
        ctx.lineTo(10, 6);
        ctx.closePath();
        ctx.fill();

        // Hull panel lines
        ctx.strokeStyle = isFlashing ? 'rgba(255,255,255,0.3)' : 'rgba(0, 200, 255, 0.25)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(20, 0);
        ctx.lineTo(-8, -8);
        ctx.moveTo(20, 0);
        ctx.lineTo(-8, 8);
        ctx.stroke();

        // Engine nozzles
        ctx.fillStyle = `rgba(0, 200, 255, ${0.6 + pulseVal * 0.4})`;
        ctx.fillRect(-13, -5, 4, 3);
        ctx.fillRect(-13, 2, 4, 3);

        // Cockpit canopy
        ctx.shadowBlur = 25;
        ctx.shadowColor = '#00f0ff';
        const cockpitGrad = ctx.createRadialGradient(8, 0, 0, 8, 0, 6);
        cockpitGrad.addColorStop(0, '#66ffff');
        cockpitGrad.addColorStop(0.5, '#00d4ff');
        cockpitGrad.addColorStop(1, 'rgba(0, 180, 255, 0.3)');
        ctx.fillStyle = cockpitGrad;
        ctx.beginPath();
        ctx.ellipse(8, 0, 5, 3.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Wing edge neon accents
        ctx.strokeStyle = `rgba(0, 240, 255, ${0.6 + pulseVal * 0.3})`;
        ctx.shadowBlur = 12;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-14, -14);
        ctx.lineTo(6, -5);
        ctx.lineTo(22, 0);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-14, 14);
        ctx.lineTo(6, 5);
        ctx.lineTo(22, 0);
        ctx.stroke();

        // Weapon indicator dots on wings
        const weaponColor = WEAPONS[this.currentWeapon].color;
        ctx.fillStyle = weaponColor;
        ctx.shadowColor = weaponColor;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(0, -8, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0, 8, 1.5, 0, Math.PI * 2);
        ctx.fill();

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
        this.aoeEnabled = weapon.aoeEnabled || false;
        this.turnSpeed = weapon.turnSpeed || 0;
        this.target = null;
        this.bounced = false;
        this.trail = [];
        this.age = 0;
    }

    update(dt, canvasW, canvasH, enemies, ricochet) {
        this.age += dt;

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
        if (this.trail.length > 10) this.trail.shift();
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
            const alpha = (i / this.trail.length) * 0.45;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(t.x, t.y, this.radius * 0.5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Main bullet drawing by type
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 18;

        if (this.type === 'rocket') {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle);

            // Rocket body
            ctx.fillStyle = '#cc2244';
            ctx.beginPath();
            ctx.moveTo(this.radius * 1.2, 0);
            ctx.lineTo(-this.radius, -this.radius * 0.45);
            ctx.lineTo(-this.radius * 0.6, 0);
            ctx.lineTo(-this.radius, this.radius * 0.45);
            ctx.closePath();
            ctx.fill();

            // Rocket nose
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.radius * 0.6, 0, this.radius * 0.3, 0, Math.PI * 2);
            ctx.fill();

            // Fins
            ctx.fillStyle = '#ff6688';
            ctx.beginPath();
            ctx.moveTo(-this.radius * 0.8, -this.radius * 0.45);
            ctx.lineTo(-this.radius * 1.2, -this.radius * 0.7);
            ctx.lineTo(-this.radius * 0.4, -this.radius * 0.3);
            ctx.closePath();
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(-this.radius * 0.8, this.radius * 0.45);
            ctx.lineTo(-this.radius * 1.2, this.radius * 0.7);
            ctx.lineTo(-this.radius * 0.4, this.radius * 0.3);
            ctx.closePath();
            ctx.fill();

            // Exhaust glow
            const exGrad = ctx.createRadialGradient(-this.radius, 0, 0, -this.radius, 0, this.radius * 0.8);
            exGrad.addColorStop(0, 'rgba(255, 200, 100, 0.8)');
            exGrad.addColorStop(0.5, 'rgba(255, 100, 0, 0.3)');
            exGrad.addColorStop(1, 'rgba(255, 50, 0, 0)');
            ctx.fillStyle = exGrad;
            ctx.beginPath();
            ctx.arc(-this.radius, 0, this.radius * 0.8, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        } else if (this.type === 'homing') {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle);

            // Missile shape
            ctx.fillStyle = '#22cc44';
            ctx.beginPath();
            ctx.moveTo(this.radius * 1.5, 0);
            ctx.lineTo(-this.radius * 0.8, -this.radius * 0.5);
            ctx.lineTo(-this.radius * 0.5, 0);
            ctx.lineTo(-this.radius * 0.8, this.radius * 0.5);
            ctx.closePath();
            ctx.fill();

            // Seeker head
            ctx.fillStyle = this.color;
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.arc(this.radius * 0.7, 0, this.radius * 0.35, 0, Math.PI * 2);
            ctx.fill();

            // Exhaust
            const hmGrad = ctx.createRadialGradient(-this.radius * 0.5, 0, 0, -this.radius * 0.5, 0, this.radius * 0.6);
            hmGrad.addColorStop(0, 'rgba(57, 255, 20, 0.6)');
            hmGrad.addColorStop(1, 'rgba(57, 255, 20, 0)');
            ctx.fillStyle = hmGrad;
            ctx.beginPath();
            ctx.arc(-this.radius * 0.5, 0, this.radius * 0.6, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        } else if (this.type === 'rail') {
            // Elongated energy bolt
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle);

            // Core streak
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 20;
            ctx.beginPath();
            ctx.ellipse(0, 0, this.radius * 3, this.radius * 0.6, 0, 0, Math.PI * 2);
            ctx.fill();

            // Outer glow
            ctx.fillStyle = this.color;
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.ellipse(0, 0, this.radius * 4, this.radius * 1.2, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;

            ctx.restore();
        } else {
            // Default bullet (pulse, spread, enemy)
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();

            // Inner bright core
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = 0.6;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius * 0.4, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
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
        this.animPhase = Math.random() * Math.PI * 2;
        this.eyeTrackAngle = 0;

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
        this.animPhase += dt * 4;
        const angle = Engine.angleBetween(this.x, this.y, player.x, player.y);
        this.eyeTrackAngle = angle;

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
        const pulse = Math.sin(this.animPhase) * 0.5 + 0.5;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = flash ? 35 : 15 + pulse * 5;

        switch (this.type) {
            case 'chaser': {
                const faceAngle = this.eyeTrackAngle;
                ctx.rotate(faceAngle + Math.PI / 2);

                // Outer aura
                ctx.globalAlpha = 0.15 + pulse * 0.1;
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(0, 0, this.radius + 6 + pulse * 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;

                // Body - organic spiky shape
                ctx.fillStyle = flash ? '#ffffff' : '#cc1870';
                ctx.beginPath();
                const spikes = 5;
                for (let i = 0; i < spikes * 2; i++) {
                    const a = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
                    const r = i % 2 === 0
                        ? this.radius + Math.sin(this.animPhase + i) * 2
                        : this.radius * 0.6;
                    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
                }
                ctx.closePath();
                ctx.fill();

                // Inner body
                ctx.fillStyle = flash ? '#ffccee' : this.color;
                ctx.beginPath();
                ctx.arc(0, 0, this.radius * 0.55, 0, Math.PI * 2);
                ctx.fill();

                // Eyes (two menacing dots)
                ctx.fillStyle = '#ffffff';
                ctx.shadowBlur = 8;
                ctx.shadowColor = '#ffffff';
                ctx.beginPath();
                ctx.arc(-3, -2, 2.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(3, -2, 2.5, 0, Math.PI * 2);
                ctx.fill();

                // Pupils
                ctx.fillStyle = '#220011';
                ctx.shadowBlur = 0;
                ctx.beginPath();
                ctx.arc(-3, -2.5, 1.2, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(3, -2.5, 1.2, 0, Math.PI * 2);
                ctx.fill();

                // Angry mouth
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(0, 3, 4, 0.2, Math.PI - 0.2);
                ctx.stroke();
                break;
            }
            case 'shooter': {
                // Rotating turret enemy
                const turretAngle = this.eyeTrackAngle;

                // Outer energy ring
                ctx.globalAlpha = 0.12 + pulse * 0.08;
                ctx.strokeStyle = this.color;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(0, 0, this.radius + 8, 0, Math.PI * 2);
                ctx.stroke();
                ctx.globalAlpha = 1;

                // Diamond body with detail
                ctx.fillStyle = flash ? '#ffffff' : '#7733bb';
                ctx.beginPath();
                ctx.moveTo(0, -this.radius);
                ctx.lineTo(this.radius * 0.75, 0);
                ctx.lineTo(0, this.radius);
                ctx.lineTo(-this.radius * 0.75, 0);
                ctx.closePath();
                ctx.fill();

                // Inner diamond
                ctx.fillStyle = flash ? '#eeddff' : '#9955dd';
                ctx.beginPath();
                const innerR = this.radius * 0.55;
                ctx.moveTo(0, -innerR);
                ctx.lineTo(innerR * 0.75, 0);
                ctx.lineTo(0, innerR);
                ctx.lineTo(-innerR * 0.75, 0);
                ctx.closePath();
                ctx.fill();

                // Cannon barrel pointing at player
                ctx.save();
                ctx.rotate(turretAngle - this.eyeTrackAngle); // Cancel parent rotation
                ctx.rotate(turretAngle);
                ctx.fillStyle = flash ? '#ffffff' : '#bb88ff';
                ctx.fillRect(0, -2, this.radius * 0.9, 4);
                // Barrel tip glow
                ctx.fillStyle = this.color;
                ctx.shadowColor = this.color;
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.arc(this.radius * 0.9, 0, 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();

                // Central eye
                ctx.fillStyle = '#ffffff';
                ctx.shadowColor = '#ffffff';
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.arc(0, 0, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = this.color;
                ctx.shadowBlur = 5;
                ctx.beginPath();
                ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
                ctx.fill();
                break;
            }
            case 'boss': {
                const bossAngle = this.phaseAngle || 0;

                // Menacing outer aura
                ctx.globalAlpha = 0.08 + pulse * 0.06;
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(0, 0, this.radius + 20 + pulse * 8, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;

                // Rotating hex body
                ctx.save();
                ctx.rotate(bossAngle * 0.3);
                ctx.fillStyle = flash ? '#ffffff' : '#cc9900';
                ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const a = (i / 6) * Math.PI * 2;
                    const r = this.radius + Math.sin(this.animPhase + i * 0.5) * 3;
                    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
                }
                ctx.closePath();
                ctx.fill();

                // Inner armored panels
                ctx.fillStyle = flash ? '#ffffcc' : '#ddaa00';
                ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
                    ctx.lineTo(Math.cos(a) * this.radius * 0.7, Math.sin(a) * this.radius * 0.7);
                }
                ctx.closePath();
                ctx.fill();

                // Panel detail lines
                ctx.strokeStyle = flash ? '#ffffff' : 'rgba(255, 200, 0, 0.4)';
                ctx.lineWidth = 1;
                for (let i = 0; i < 6; i++) {
                    const a = (i / 6) * Math.PI * 2;
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(Math.cos(a) * this.radius * 0.95, Math.sin(a) * this.radius * 0.95);
                    ctx.stroke();
                }
                ctx.restore();

                // Central core (animated)
                const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius * 0.35);
                coreGrad.addColorStop(0, '#ffffff');
                coreGrad.addColorStop(0.4, this.color);
                coreGrad.addColorStop(1, 'rgba(255, 100, 0, 0.3)');
                ctx.fillStyle = coreGrad;
                ctx.shadowColor = this.color;
                ctx.shadowBlur = 25;
                ctx.beginPath();
                ctx.arc(0, 0, this.radius * 0.3 + pulse * 3, 0, Math.PI * 2);
                ctx.fill();

                // Orbiting energy orbs
                for (let i = 0; i < 3; i++) {
                    const orbAngle = bossAngle * 2 + (i / 3) * Math.PI * 2;
                    const orbR = this.radius * 0.6;
                    const ox = Math.cos(orbAngle) * orbR;
                    const oy = Math.sin(orbAngle) * orbR;
                    ctx.fillStyle = '#ff8800';
                    ctx.shadowColor = '#ff8800';
                    ctx.shadowBlur = 10;
                    ctx.beginPath();
                    ctx.arc(ox, oy, 4 + pulse * 2, 0, Math.PI * 2);
                    ctx.fill();
                }

                // HP bar
                const hpPct = this.hp / this.maxHp;
                ctx.shadowBlur = 0;
                ctx.fillStyle = 'rgba(0,0,0,0.6)';
                ctx.fillRect(-35, -this.radius - 18, 70, 8);
                ctx.strokeStyle = 'rgba(255,255,255,0.15)';
                ctx.lineWidth = 1;
                ctx.strokeRect(-35, -this.radius - 18, 70, 8);
                const hpGrad = ctx.createLinearGradient(-35, 0, -35 + 70 * hpPct, 0);
                if (hpPct > 0.3) {
                    hpGrad.addColorStop(0, '#39ff14');
                    hpGrad.addColorStop(1, '#66ff66');
                } else {
                    hpGrad.addColorStop(0, '#ff2d55');
                    hpGrad.addColorStop(1, '#ff6666');
                }
                ctx.fillStyle = hpGrad;
                ctx.fillRect(-35, -this.radius - 18, 70 * hpPct, 8);
                break;
            }
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
        this.spinAngle = 0;

        switch (type) {
            case 'health': this.color = '#39ff14'; break;
            case 'shield': this.color = '#00f0ff'; break;
            case 'ammo': this.color = '#ff6a00'; break;
        }
    }

    update(dt) {
        this.life -= dt;
        this.bobPhase += dt * 3;
        this.spinAngle += dt * 2;
        if (this.life <= 0) this.dead = true;
    }

    draw(ctx) {
        const bobY = Math.sin(this.bobPhase) * 4;
        const pulse = Math.sin(this.bobPhase * 2) * 0.5 + 0.5;
        ctx.save();
        ctx.translate(this.x, this.y + bobY);

        // Outer ring (animated)
        ctx.save();
        ctx.rotate(this.spinAngle);
        ctx.strokeStyle = this.color;
        ctx.globalAlpha = 0.2 + pulse * 0.15;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(0, 0, this.radius + 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        // Glow
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 20 + pulse * 10;
        ctx.fillStyle = this.color;
        ctx.globalAlpha = 0.15 + pulse * 0.1;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius + 6, 0, Math.PI * 2);
        ctx.fill();

        // Body
        ctx.globalAlpha = 1;
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
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
        ctx.shadowBlur = 8;

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

// ---- REMOTE PLAYER ----
class RemotePlayer {
    constructor(state) {
        this.updateState(state);
        // Animation timers
        this.thrusterTimer = 0;
        this.enginePulse = 0;
        this.wingFlap = 0;
        this.shieldRotation = 0;
    }

    updateState(state) {
        this.id = state.id;
        this.name = state.name;
        this.x = state.x;
        this.y = state.y;
        this.angle = state.angle;
        this.hp = state.hp;
        this.maxHp = state.maxHp;
        this.currentWeapon = state.currentWeapon;
        this.dead = state.dead;
        this.invincible = state.invincible;
        this.color = state.color;
        this.team = state.team;
        this.shooting = state.shooting;
        this.radius = 18;
    }

    update(dt) {
        if (this.dead) return;

        // Animations
        this.enginePulse += dt * 8;
        this.wingFlap += dt * 4;
        this.shieldRotation += dt * 2;

        // Thruster particles (simulate based on velocity or just generic if alive)
        this.thrusterTimer -= dt;
        if (this.thrusterTimer <= 0) {
            this.thrusterTimer = 0.05;
            const backAngle = this.angle + Math.PI;
            Engine.spawnParticles(
                this.x + Math.cos(backAngle) * 16,
                this.y + Math.sin(backAngle) * 16,
                1,
                { speed: 80, life: 0.2, size: 3, color: this.color, angle: backAngle, spread: 0.4 }
            );
        }
    }

    draw(ctx) {
        if (this.dead) return;

        ctx.save();
        ctx.translate(this.x, this.y);

        // Nametag
        ctx.save();
        ctx.font = '10px "Inter", sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.textAlign = 'center';
        ctx.fillText(this.name, 0, -32);
        
        // HP Bar
        if (this.hp < this.maxHp) {
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(-15, -28, 30, 4);
            ctx.fillStyle = this.color;
            ctx.fillRect(-15, -28, 30 * (this.hp / this.maxHp), 4);
        }
        ctx.restore();

        ctx.rotate(this.angle);

        const pulseVal = Math.sin(this.enginePulse) * 0.5 + 0.5;
        const isFlashing = this.invincible && Math.sin(Date.now() * 0.02) > 0;

        // Shield visualization
        if (this.invincible) {
            ctx.save();
            ctx.rotate(-this.angle + this.shieldRotation);
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.25 + pulseVal * 0.2})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 8, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        // Engine glow
        const engineGlow = 12 + pulseVal * 8;
        const engineGlowGrad = ctx.createRadialGradient(-12, 0, 0, -12, 0, engineGlow);
        engineGlowGrad.addColorStop(0, `rgba(255, 255, 255, ${0.3 + pulseVal * 0.15})`);
        engineGlowGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = engineGlowGrad;
        ctx.beginPath();
        ctx.arc(-12, 0, engineGlow, 0, Math.PI * 2);
        ctx.fill();

        // Ship body outline glow
        ctx.shadowColor = this.color;
        ctx.shadowBlur = isFlashing ? 35 : 18;

        // Wing panels
        const flapOffset = Math.sin(this.wingFlap) * 1.5;
        ctx.fillStyle = isFlashing ? 'rgba(255,255,255,0.6)' : '#445577';
        ctx.beginPath();
        ctx.moveTo(-16, -16 - flapOffset);
        ctx.lineTo(-8, -10);
        ctx.lineTo(-14, -6);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-16, 16 + flapOffset);
        ctx.lineTo(-8, 10);
        ctx.lineTo(-14, 6);
        ctx.closePath();
        ctx.fill();

        // Main hull
        ctx.fillStyle = isFlashing ? 'rgba(255,255,255,0.7)' : '#8899bb';
        ctx.beginPath();
        ctx.moveTo(24, 0);         
        ctx.lineTo(10, -6);
        ctx.lineTo(-4, -12);
        ctx.lineTo(-14, -14);      
        ctx.lineTo(-10, -4);
        ctx.lineTo(-12, 0);
        ctx.lineTo(-10, 4);
        ctx.lineTo(-14, 14);       
        ctx.lineTo(-4, 12);
        ctx.lineTo(10, 6);
        ctx.closePath();
        ctx.fill();

        // Cockpit canopy
        ctx.shadowBlur = 25;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.ellipse(8, 0, 5, 3.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Wing edge neon accents
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.6 + pulseVal * 0.3})`;
        ctx.shadowBlur = 12;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-14, -14);
        ctx.lineTo(6, -5);
        ctx.lineTo(22, 0);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-14, 14);
        ctx.lineTo(6, 5);
        ctx.lineTo(22, 0);
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.restore();
    }
}
