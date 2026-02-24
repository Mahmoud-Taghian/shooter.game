/* ============================================
   NEON VORTEX — Sound System (Web Audio API)
   Procedural sound effects — no external files
   ============================================ */

const Sound = (() => {
    let ctx;
    let masterGain;
    let muted = false;

    function init() {
        try {
            ctx = new (window.AudioContext || window.webkitAudioContext)();
            masterGain = ctx.createGain();
            masterGain.gain.value = 0.4;
            masterGain.connect(ctx.destination);
        } catch (e) {
            console.warn('Web Audio API not available');
        }
    }

    function resume() {
        if (ctx && ctx.state === 'suspended') ctx.resume();
    }

    function toggleMute() {
        muted = !muted;
        if (masterGain) masterGain.gain.value = muted ? 0 : 0.4;
        return muted;
    }

    // --- Utility oscillator builder ---
    function playTone(freq, type, duration, volume = 0.3, detune = 0) {
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        osc.detune.value = detune;
        gain.gain.setValueAtTime(volume, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + duration);
    }

    function playNoise(duration, volume = 0.15, filterFreq = 3000) {
        if (!ctx) return;
        const bufSize = ctx.sampleRate * duration;
        const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const src = ctx.createBufferSource();
        src.buffer = buf;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = filterFreq;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(volume, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

        src.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);
        src.start(ctx.currentTime);
        src.stop(ctx.currentTime + duration);
    }

    // ====== GAME SOUND EFFECTS ======

    function shoot_pulse() {
        playTone(880, 'square', 0.08, 0.12);
        playTone(660, 'sine', 0.06, 0.08);
    }

    function shoot_spread() {
        playTone(400, 'sawtooth', 0.1, 0.15);
        playNoise(0.06, 0.1, 4000);
    }

    function shoot_beam() {
        // Continuous hum — call sparingly
        playTone(220, 'sine', 0.05, 0.06);
        playTone(223, 'sine', 0.05, 0.06);
    }

    function shoot_rocket() {
        playTone(120, 'sawtooth', 0.2, 0.2);
        playNoise(0.25, 0.15, 1500);
    }

    function shoot_homing() {
        playTone(600, 'triangle', 0.12, 0.12);
        playTone(900, 'sine', 0.08, 0.08);
    }

    function shoot_rail() {
        playTone(200, 'sawtooth', 0.15, 0.2);
        playTone(1200, 'square', 0.08, 0.1);
        playNoise(0.12, 0.12, 6000);
    }

    function explosion_small() {
        playNoise(0.3, 0.2, 2000);
        playTone(80, 'sine', 0.3, 0.15);
    }

    function explosion_large() {
        playNoise(0.5, 0.3, 1500);
        playTone(50, 'sine', 0.5, 0.25);
        playTone(70, 'sawtooth', 0.4, 0.1);
    }

    function hit_enemy() {
        playTone(300, 'square', 0.04, 0.08);
    }

    function hit_player() {
        playTone(150, 'sawtooth', 0.15, 0.2);
        playNoise(0.1, 0.15, 2000);
    }

    function powerup_collect() {
        playTone(523, 'sine', 0.1, 0.15);
        setTimeout(() => playTone(659, 'sine', 0.1, 0.15), 60);
        setTimeout(() => playTone(784, 'sine', 0.15, 0.15), 120);
    }

    function wave_start() {
        playTone(330, 'triangle', 0.2, 0.12);
        setTimeout(() => playTone(440, 'triangle', 0.2, 0.12), 150);
        setTimeout(() => playTone(550, 'triangle', 0.3, 0.15), 300);
    }

    function boss_alert() {
        for (let i = 0; i < 4; i++) {
            setTimeout(() => {
                playTone(100 + i * 30, 'sawtooth', 0.2, 0.15);
                playTone(200, 'square', 0.15, 0.08);
            }, i * 200);
        }
    }

    function augment_select() {
        playTone(440, 'sine', 0.1, 0.12);
        setTimeout(() => playTone(660, 'sine', 0.1, 0.12), 80);
        setTimeout(() => playTone(880, 'sine', 0.15, 0.15), 160);
        setTimeout(() => playTone(1100, 'sine', 0.25, 0.12), 240);
    }

    function menu_click() {
        playTone(700, 'sine', 0.08, 0.1);
    }

    function game_over() {
        playTone(440, 'sine', 0.3, 0.15);
        setTimeout(() => playTone(370, 'sine', 0.3, 0.15), 250);
        setTimeout(() => playTone(330, 'sine', 0.3, 0.15), 500);
        setTimeout(() => playTone(220, 'sine', 0.6, 0.2), 750);
    }

    function enemy_shoot() {
        playTone(250, 'square', 0.06, 0.06);
    }

    return {
        init, resume, toggleMute,
        shoot_pulse, shoot_spread, shoot_beam, shoot_rocket, shoot_homing, shoot_rail,
        explosion_small, explosion_large,
        hit_enemy, hit_player,
        powerup_collect, wave_start, boss_alert,
        augment_select, menu_click, game_over, enemy_shoot
    };
})();
