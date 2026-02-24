/* ============================================
   NEON VORTEX — UI Manager
   ============================================ */

const UI = (() => {
    const els = {};

    function init() {
        els.hud = document.getElementById('hud');
        els.scoreValue = document.getElementById('score-value');
        els.waveValue = document.getElementById('wave-value');
        els.comboValue = document.getElementById('combo-value');
        els.healthBarFill = document.getElementById('health-bar-fill');
        els.healthText = document.getElementById('health-text');
        els.weaponName = document.getElementById('weapon-name');
        els.augmentIcons = document.getElementById('augment-icons');
        els.weaponSlots = document.querySelectorAll('.weapon-slot');

        els.mainMenu = document.getElementById('main-menu');
        els.pauseMenu = document.getElementById('pause-menu');
        els.gameoverScreen = document.getElementById('gameover-screen');
        els.augmentScreen = document.getElementById('augment-screen');
        els.augmentChoices = document.getElementById('augment-choices');
        els.augmentWave = document.getElementById('augment-wave');

        els.finalScore = document.getElementById('final-score');
        els.finalWave = document.getElementById('final-wave');
        els.highScore = document.getElementById('high-score');

        els.waveAnnounce = document.getElementById('wave-announce');
        els.waveAnnounceText = document.getElementById('wave-announce-text');
    }

    function show(id) {
        const el = typeof id === 'string' ? document.getElementById(id) : id;
        if (el) el.classList.remove('hidden');
    }

    function hide(id) {
        const el = typeof id === 'string' ? document.getElementById(id) : id;
        if (el) el.classList.add('hidden');
    }

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

        els.weaponName.textContent = WEAPONS[weaponIdx].name;

        els.weaponSlots.forEach((slot, i) => {
            slot.classList.toggle('active', i === weaponIdx);
        });

        // Augment icons
        els.augmentIcons.innerHTML = '';
        const seen = {};
        for (const augId of augments) {
            if (!seen[augId]) seen[augId] = 0;
            seen[augId]++;
        }
        for (const [augId, count] of Object.entries(seen)) {
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

    function showGameOver(score, wave, highScore) {
        els.finalScore.textContent = score.toLocaleString();
        els.finalWave.textContent = wave;
        els.highScore.textContent = highScore.toLocaleString();
        show('gameover-screen');
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

    function announceWave(waveNum, isBoss) {
        els.waveAnnounceText.textContent = isBoss ? '⚠ BOSS WAVE ' + waveNum : 'WAVE ' + waveNum;
        els.waveAnnounceText.style.color = isBoss ? '#ffe600' : '#00f0ff';
        show('wave-announce');
        // Re-trigger animation
        els.waveAnnounceText.style.animation = 'none';
        void els.waveAnnounceText.offsetWidth;
        els.waveAnnounceText.style.animation = 'waveAnnounce 2s ease forwards';
        setTimeout(() => hide('wave-announce'), 2200);
    }

    return { init, show, hide, updateHUD, showGameOver, showAugmentSelection, announceWave, els };
})();
