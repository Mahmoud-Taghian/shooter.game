/* ============================================
   NEON VORTEX — Main Game
   State management, game loop, wave spawning
   ============================================ */

const Game = (() => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    // Game state
    let state = 'menu'; // menu | playing | paused | gameover | augment
    let player, bullets, enemies, powerUps, enemyBullets;
    let score, combo, comboTimer, wave, enemiesRemaining, waveDelay;
    let time = 0;
    let highScore = parseInt(localStorage.getItem('neonVortexHighScore') || '0');

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

        // Button handlers
        document.getElementById('btn-start').addEventListener('click', startGame);
        document.getElementById('btn-resume').addEventListener('click', resumeGame);
        document.getElementById('btn-quit').addEventListener('click', quitToMenu);
        document.getElementById('btn-restart').addEventListener('click', startGame);
        document.getElementById('btn-menu').addEventListener('click', quitToMenu);

        // Pause button in HUD
        const pauseBtn = document.getElementById('btn-pause');
        if (pauseBtn) {
            pauseBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (state === 'playing') pauseGame();
            });
        }

        // Weapon switch from keys
        document.addEventListener('weaponswitch', e => {
            if (state === 'playing' && player) {
                player.currentWeapon = e.detail;
            }
        });

        // Weapon switch from clicking weapon bar
        document.querySelectorAll('.weapon-slot').forEach(slot => {
            slot.addEventListener('click', () => {
                if (state === 'playing' && player) {
                    player.currentWeapon = parseInt(slot.dataset.weapon);
                }
            });
        });

        // Pause
        document.addEventListener('togglepause', () => {
            if (state === 'playing') pauseGame();
            else if (state === 'paused') resumeGame();
        });

        // Start loop
        requestAnimationFrame(loop);
    }

    // ---- Start Game ----
    function startGame() {
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

        nextWave();
    }

    // ---- Wave System ----
    function nextWave() {
        wave++;
        waveDelay = 2;

        const isBoss = wave % 5 === 0;
        UI.announceWave(wave, isBoss);
        if (isBoss) Sound.boss_alert(); else Sound.wave_start();

        if (isBoss) {
            // Boss wave
            spawnEnemy('boss');
            // Plus some chasers
            const extras = Math.min(wave, 8);
            for (let i = 0; i < extras; i++) {
                setTimeout(() => spawnEnemy('chaser'), i * 400);
            }
            enemiesRemaining = 1 + extras;
        } else {
            const chaserCount = 3 + wave * 2;
            const shooterCount = Math.floor(wave * 0.8);
            const total = chaserCount + shooterCount;
            enemiesRemaining = total;

            for (let i = 0; i < chaserCount; i++) {
                setTimeout(() => spawnEnemy('chaser'), i * 300);
            }
            for (let i = 0; i < shooterCount; i++) {
                setTimeout(() => spawnEnemy('shooter'), chaserCount * 300 + i * 500);
            }
        }
    }

    function spawnEnemy(type) {
        if (state !== 'playing' && state !== 'augment') return;
        // Spawn from edges
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

    // ---- Shooting ----
    function playerShoot() {
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
                // Beam handled in update
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
                // Fire multiple rail bullets in a tight spread
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

    function enemyShoot(enemy) {
        const angle = Engine.angleBetween(enemy.x, enemy.y, player.x, player.y);
        const bul = new Bullet(enemy.x, enemy.y, angle, {
            speed: 300,
            color: enemy.color,
            type: 'pulse',
            bulletSize: 4
        }, enemy.type === 'boss' ? 20 : 12, 4, 'enemy');
        enemyBullets.push(bul);
        Sound.enemy_shoot();
    }

    // ---- Power-up Spawning ----
    function trySpawnPowerUp(x, y) {
        let chance = 0.15;
        if (player.hasAugment('luckystar')) {
            const stacks = player.augmentCounts['luckystar'] || 0;
            chance *= Math.pow(2, stacks);
        }
        if (Math.random() < chance) {
            const types = ['health', 'health', 'shield', 'ammo'];
            powerUps.push(new PowerUp(x, y, types[Math.floor(Math.random() * types.length)]));
        }
    }

    // ---- Augment Selection ----
    function offerAugments() {
        state = 'augment';
        // Pick 3 random augments
        const shuffled = [...AUGMENT_DEFS].sort(() => Math.random() - 0.5);
        const choices = shuffled.slice(0, 3);
        UI.showAugmentSelection(wave, choices, augId => {
            player.addAugment(augId);
            Sound.augment_select();
            state = 'playing';
            nextWave();
        });
    }

    // ---- Update ----
    function update(dt) {
        if (state !== 'playing') return;

        time += dt;
        player.update(dt, canvas.width, canvas.height);

        // Shooting
        if (Engine.mouse.down) {
            playerShoot();
        }

        // Beam weapon special handling
        if (Engine.mouse.down && WEAPONS[player.currentWeapon].type === 'beam') {
            handleBeam(dt);
        }

        // Combo decay
        comboTimer -= dt;
        if (comboTimer <= 0) {
            combo = 1;
        }

        // Update bullets
        const hasRicochet = player.hasAugment('ricochet');
        for (let i = bullets.length - 1; i >= 0; i--) {
            bullets[i].update(dt, canvas.width, canvas.height, enemies, hasRicochet);
            if (bullets[i].dead) bullets.splice(i, 1);
        }

        // Update enemy bullets
        for (let i = enemyBullets.length - 1; i >= 0; i--) {
            enemyBullets[i].update(dt, canvas.width, canvas.height, [], false);
            if (enemyBullets[i].dead) enemyBullets.splice(i, 1);
        }

        // Update enemies
        for (const enemy of enemies) {
            enemy.update(dt, player, canvas.width, canvas.height);

            // Enemy shooting
            if ((enemy.type === 'shooter' || enemy.type === 'boss') && enemy.fireCooldown <= 0) {
                enemy.fireCooldown = enemy.fireRate;
                enemyShoot(enemy);

                // Boss shoots more bullets
                if (enemy.type === 'boss') {
                    for (let i = 0; i < 3; i++) {
                        setTimeout(() => {
                            if (!enemy.dead && state === 'playing') {
                                enemyShoot(enemy);
                            }
                        }, i * 100);
                    }
                }
            }
        }

        // Update power-ups
        const magnetRange = player.hasAugment('magnetism') ? 200 * Math.pow(3, player.augmentCounts['magnetism'] || 0) : 60;
        for (let i = powerUps.length - 1; i >= 0; i--) {
            const pu = powerUps[i];
            pu.update(dt);

            // Magnet attraction
            const d = Engine.distance(player.x, player.y, pu.x, pu.y);
            if (d < magnetRange) {
                const angle = Engine.angleBetween(pu.x, pu.y, player.x, player.y);
                const pullSpeed = 300 * (1 - d / magnetRange);
                pu.x += Math.cos(angle) * pullSpeed * dt;
                pu.y += Math.sin(angle) * pullSpeed * dt;
            }

            if (pu.dead) powerUps.splice(i, 1);
        }

        // ---- Collisions ----

        // Player bullets vs enemies
        for (let bi = bullets.length - 1; bi >= 0; bi--) {
            const b = bullets[bi];
            for (let ei = enemies.length - 1; ei >= 0; ei--) {
                const e = enemies[ei];
                if (e.dead) continue;
                if (Engine.circleCollision(b, e)) {
                    e.takeDamage(b.damage);
                    Sound.hit_enemy();
                    Engine.spawnParticles(b.x, b.y, 4, { speed: 100, life: 0.2, size: 2, color: b.color });

                    if (!b.piercing) {
                        b.dead = true;
                    }

                    // Rocket AoE explosion on impact
                    if (b.aoeEnabled && b.explosionRadius > 0) {
                        rocketExplosion(b.x, b.y, b.explosionRadius, b.damage * 0.6);
                    } else if (b.explosionRadius > 0 && !b.piercing) {
                        rocketExplosion(b.x, b.y, b.explosionRadius, b.damage * 0.5);
                    }

                    if (e.dead) {
                        onEnemyKilled(e);
                    }
                    break;
                }
            }
            if (b.dead) bullets.splice(bi, 1);
        }

        // Enemy bullets vs player
        for (let i = enemyBullets.length - 1; i >= 0; i--) {
            const b = enemyBullets[i];
            if (Engine.circleCollision(b, player)) {
                player.takeDamage(b.damage);
                Sound.hit_player();
                b.dead = true;
                enemyBullets.splice(i, 1);
            }
        }

        // Enemies vs player (contact damage)
        for (const e of enemies) {
            if (e.dead) continue;
            if (Engine.circleCollision(e, player)) {
                if (player.takeDamage(e.damage)) {
                    // push player away
                    const angle = Engine.angleBetween(e.x, e.y, player.x, player.y);
                    player.x += Math.cos(angle) * 40;
                    player.y += Math.sin(angle) * 40;
                }
            }
        }

        // Player vs power-ups
        for (let i = powerUps.length - 1; i >= 0; i--) {
            const pu = powerUps[i];
            if (Engine.circleCollision(pu, player)) {
                applyPowerUp(pu);
                Sound.powerup_collect();
                Engine.spawnParticles(pu.x, pu.y, 10, { speed: 120, life: 0.4, size: 3, color: pu.color });
                powerUps.splice(i, 1);
            }
        }

        // Remove dead enemies
        for (let i = enemies.length - 1; i >= 0; i--) {
            if (enemies[i].dead) enemies.splice(i, 1);
        }

        // Check wave complete
        if (enemiesRemaining <= 0 && enemies.length === 0) {
            waveDelay -= dt;
            if (waveDelay <= 0) {
                if (wave % 3 === 0) {
                    offerAugments();
                } else {
                    nextWave();
                }
            }
        }

        // Check death
        if (player.hp <= 0) {
            gameOver();
        }

        // Update particles
        Engine.updateParticles(dt);

        // Update HUD
        UI.updateHUD(score, wave, combo, player.hp, player.maxHp, player.currentWeapon, player.augments);
    }

    // ---- Beam Weapon ----
    function handleBeam(dt) {
        const w = WEAPONS[2]; // Plasma Beam
        if (player.currentWeapon !== 2) return;

        const range = w.beamRange || 600;
        const dmg = player.getDamage() * dt * 60; // DPS-based

        // Check enemies in beam path
        for (const e of enemies) {
            if (e.dead) continue;
            // Point-to-line distance
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
                if (e.dead) onEnemyKilled(e);
            }
        }
    }

    // ---- Rocket Explosion (AoE) ----
    function rocketExplosion(x, y, radius, damage) {
        // Visual AoE ring
        Engine.spawnParticles(x, y, 30, { speed: 300, life: 0.6, size: 5, color: '#ff6600' });
        Engine.spawnParticles(x, y, 20, { speed: 180, life: 0.5, size: 4, color: '#ff2d55' });
        Engine.spawnParticles(x, y, 10, { speed: 100, life: 0.4, size: 3, color: '#ffaa00' });
        Engine.triggerShake(12, 0.3);
        Sound.rocket_aoe();

        // Damage all enemies in the AoE radius
        for (const e of enemies) {
            if (e.dead) continue;
            const dist = Engine.distance(x, y, e.x, e.y);
            if (dist < radius) {
                // Damage falloff based on distance from center
                const falloff = 1 - (dist / radius) * 0.5;
                e.takeDamage(damage * falloff);
                // Knockback effect via particles
                Engine.spawnParticles(e.x, e.y, 5, { speed: 150, life: 0.3, size: 3, color: '#ff8800' });
                if (e.dead) onEnemyKilled(e);
            }
        }
    }

    // ---- Enemy Death ----
    function onEnemyKilled(enemy) {
        // Score + combo
        combo = Math.min(combo + 1, 20);
        comboTimer = 3;
        score += enemy.score * combo;

        // Particles + sound
        Engine.spawnParticles(enemy.x, enemy.y, 15, { speed: 200, life: 0.5, size: 4, color: enemy.color });
        Engine.spawnParticles(enemy.x, enemy.y, 8, { speed: 100, life: 0.3, size: 2, color: '#ffffff' });
        Sound.explosion_small();

        // Explosive augment
        if (player.hasAugment('explosive')) {
            const stacks = player.augmentCounts['explosive'] || 0;
            const aoeRadius = 50 * stacks;
            const aoeDmg = 15 * stacks;
            for (const e of enemies) {
                if (e.dead || e === enemy) continue;
                if (Engine.distance(enemy.x, enemy.y, e.x, e.y) < aoeRadius) {
                    e.takeDamage(aoeDmg);
                    if (e.dead) {
                        // Don't recurse infinitely - just score it
                        score += e.score;
                        Engine.spawnParticles(e.x, e.y, 10, { speed: 150, life: 0.4, size: 3, color: e.color });
                    }
                }
            }
            Engine.spawnParticles(enemy.x, enemy.y, 12, { speed: 180, life: 0.4, size: 3, color: '#ff6600' });
        }

        // Vampiric augment
        if (player.hasAugment('vampiric')) {
            const stacks = player.augmentCounts['vampiric'] || 0;
            player.hp = Math.min(player.hp + stacks, player.maxHp);
        }

        // Power-up drop
        trySpawnPowerUp(enemy.x, enemy.y);

        enemiesRemaining--;
    }

    // ---- Power-up Application ----
    function applyPowerUp(pu) {
        switch (pu.type) {
            case 'health':
                player.hp = Math.min(player.hp + 30, player.maxHp);
                break;
            case 'shield':
                player.shieldTimer = 8;
                break;
            case 'ammo':
                // Temporary fire rate boost
                player.fireCooldown = 0;
                break;
        }
    }

    // ---- Game Over ----
    function gameOver() {
        state = 'gameover';
        Sound.game_over();
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('neonVortexHighScore', highScore.toString());
        }
        UI.hide('hud');
        UI.showGameOver(score, wave, highScore);
    }

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
        UI.hide('hud');
        UI.hide('pause-menu');
        UI.hide('gameover-screen');
        UI.hide('augment-screen');
        UI.show('main-menu');
    }

    // ---- Draw ----
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Background gradient
        const grad = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width * 0.7);
        grad.addColorStop(0, '#0d0d2b');
        grad.addColorStop(1, '#050510');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Starfield
        Engine.drawStarfield(ctx, canvas.width, canvas.height, time);

        if (state === 'playing' || state === 'paused' || state === 'augment') {
            const shake = Engine.updateShake(state === 'playing' ? 0.016 : 0);
            ctx.save();
            ctx.translate(shake.x, shake.y);

            // Draw beam weapon if active
            if (state === 'playing' && Engine.mouse.down && player.currentWeapon === 2) {
                drawBeam();
            }

            // Draw AoE indicators for rocket explosions
            // (handled visually via particles)

            // Power-ups
            powerUps.forEach(p => p.draw(ctx));

            // Enemy bullets
            enemyBullets.forEach(b => b.draw(ctx));

            // Player bullets
            bullets.forEach(b => b.draw(ctx));

            // Enemies
            enemies.forEach(e => e.draw(ctx));

            // Player
            player.draw(ctx);

            // Particles
            Engine.drawParticles(ctx);

            ctx.restore();
        }
    }

    function drawBeam() {
        const w = WEAPONS[2];
        const range = w.beamRange || 600;
        const endX = player.x + Math.cos(player.angle) * range;
        const endY = player.y + Math.sin(player.angle) * range;

        // Beam glow
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

        // Beam core
        ctx.lineWidth = w.beamWidth || 6;
        ctx.globalAlpha = 0.8;
        ctx.stroke();

        // Inner bright core
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.6;
        ctx.stroke();

        ctx.restore();
    }

    // ---- Game Loop ----
    let lastTime = 0;

    function loop(timestamp) {
        const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
        lastTime = timestamp;

        update(dt);
        draw();

        requestAnimationFrame(loop);
    }

    // ---- Start ----
    init();

    return { canvas, ctx };
})();
