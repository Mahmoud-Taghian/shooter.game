/* ============================================
   NEON VORTEX — Engine Core
   ============================================ */

const Engine = (() => {
    // ---- Input State ----
    const keys = {};
    const mouse = { x: 0, y: 0, down: false };

    function initInput(canvas) {
        window.addEventListener('keydown', e => {
            keys[e.key.toLowerCase()] = true;
            if (['1','2','3','4','5','6'].includes(e.key)) {
                document.dispatchEvent(new CustomEvent('weaponswitch', { detail: parseInt(e.key) - 1 }));
            }
            if (e.key === 'Escape') {
                document.dispatchEvent(new CustomEvent('togglepause'));
            }
        });
        window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
        canvas.addEventListener('mousemove', e => {
            const rect = canvas.getBoundingClientRect();
            mouse.x = (e.clientX - rect.left) * (canvas.width / rect.width);
            mouse.y = (e.clientY - rect.top) * (canvas.height / rect.height);
        });
        canvas.addEventListener('mousedown', e => { if (e.button === 0) mouse.down = true; });
        canvas.addEventListener('mouseup', e => { if (e.button === 0) mouse.down = false; });
        canvas.addEventListener('contextmenu', e => e.preventDefault());
    }

    // ---- Particles ----
    class Particle {
        constructor(x, y, vx, vy, life, size, color, shape = 'circle') {
            this.x = x; this.y = y;
            this.vx = vx; this.vy = vy;
            this.life = life; this.maxLife = life;
            this.size = size; this.color = color;
            this.shape = shape;
        }
        update(dt) {
            this.x += this.vx * dt;
            this.y += this.vy * dt;
            this.vx *= 0.98;
            this.vy *= 0.98;
            this.life -= dt;
        }
        draw(ctx) {
            const alpha = Math.max(0, this.life / this.maxLife);
            const s = this.size * (0.5 + 0.5 * alpha);
            ctx.globalAlpha = alpha;
            ctx.fillStyle = this.color;
            if (this.shape === 'circle') {
                ctx.beginPath();
                ctx.arc(this.x, this.y, s, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.fillRect(this.x - s/2, this.y - s/2, s, s);
            }
            ctx.globalAlpha = 1;
        }
        get dead() { return this.life <= 0; }
    }

    const particles = [];

    function spawnParticles(x, y, count, opts = {}) {
        const { speed = 200, life = 0.6, size = 3, color = '#ff6600', shape = 'circle', spread = Math.PI * 2 } = opts;
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * spread - spread / 2 + (opts.angle || 0);
            const spd = speed * (0.4 + Math.random() * 0.6);
            particles.push(new Particle(
                x, y,
                Math.cos(angle) * spd, Math.sin(angle) * spd,
                life * (0.5 + Math.random() * 0.5),
                size * (0.5 + Math.random()),
                color, shape
            ));
        }
    }

    function updateParticles(dt) {
        for (let i = particles.length - 1; i >= 0; i--) {
            particles[i].update(dt);
            if (particles[i].dead) particles.splice(i, 1);
        }
    }

    function drawParticles(ctx) {
        particles.forEach(p => p.draw(ctx));
    }

    function clearParticles() {
        particles.length = 0;
    }

    // ---- Collision ----
    function circleCollision(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist < (a.radius || a.size || 10) + (b.radius || b.size || 10);
    }

    function pointInCircle(px, py, cx, cy, r) {
        const dx = px - cx;
        const dy = py - cy;
        return dx * dx + dy * dy < r * r;
    }

    // ---- Screen Shake ----
    let shakeIntensity = 0;
    let shakeDuration = 0;

    function triggerShake(intensity = 8, duration = 0.2) {
        shakeIntensity = intensity;
        shakeDuration = duration;
    }

    function updateShake(dt) {
        if (shakeDuration > 0) {
            shakeDuration -= dt;
            return {
                x: (Math.random() - 0.5) * shakeIntensity * 2,
                y: (Math.random() - 0.5) * shakeIntensity * 2
            };
        }
        shakeIntensity = 0;
        return { x: 0, y: 0 };
    }

    // ---- Starfield ----
    const stars = [];
    function initStarfield(w, h, count = 200) {
        stars.length = 0;
        for (let i = 0; i < count; i++) {
            stars.push({
                x: Math.random() * w,
                y: Math.random() * h,
                size: 0.5 + Math.random() * 2,
                brightness: 0.2 + Math.random() * 0.6,
                twinkleSpeed: 1 + Math.random() * 3
            });
        }
    }

    function drawStarfield(ctx, w, h, time) {
        for (const s of stars) {
            const alpha = s.brightness * (0.5 + 0.5 * Math.sin(time * s.twinkleSpeed));
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    // ---- Utility ----
    function angleBetween(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    }

    function distance(x1, y1, x2, y2) {
        return Math.sqrt((x2-x1)**2 + (y2-y1)**2);
    }

    function lerp(a, b, t) {
        return a + (b - a) * t;
    }

    function clamp(v, min, max) {
        return Math.max(min, Math.min(max, v));
    }

    function randomInRange(min, max) {
        return min + Math.random() * (max - min);
    }

    return {
        keys, mouse, initInput,
        spawnParticles, updateParticles, drawParticles, clearParticles,
        circleCollision, pointInCircle,
        triggerShake, updateShake,
        initStarfield, drawStarfield,
        angleBetween, distance, lerp, clamp, randomInRange
    };
})();
