/* ============================================
   NEON VORTEX — Sound System (Web Audio API)
   Professional procedural sound effects
   ============================================ */

const Sound = (() => {
    let ctx;
    let masterGain;
    let compressor;
    let muted = false;

    function init() {
        try {
            ctx = new (window.AudioContext || window.webkitAudioContext)();
            // Dynamics compressor for professional mastering
            compressor = ctx.createDynamicsCompressor();
            compressor.threshold.value = -24;
            compressor.knee.value = 12;
            compressor.ratio.value = 4;
            compressor.attack.value = 0.003;
            compressor.release.value = 0.15;
            compressor.connect(ctx.destination);

            masterGain = ctx.createGain();
            masterGain.gain.value = 0.45;
            masterGain.connect(compressor);
        } catch (e) {
            console.warn('Web Audio API not available');
        }
    }

    function resume() {
        if (ctx && ctx.state === 'suspended') ctx.resume();
    }

    function toggleMute() {
        muted = !muted;
        if (masterGain) masterGain.gain.value = muted ? 0 : 0.45;
        return muted;
    }

    // --- Enhanced oscillator builder with envelope ---
    function playTone(freq, type, duration, volume = 0.3, detune = 0, opts = {}) {
        if (!ctx) return;
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        osc.detune.value = detune;

        // Attack-Decay-Sustain-Release envelope
        const attack = opts.attack || 0.005;
        const decay = opts.decay || duration * 0.2;
        const sustain = opts.sustain !== undefined ? opts.sustain : volume * 0.6;
        const release = opts.release || duration * 0.3;

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(volume, t + attack);
        gain.gain.linearRampToValueAtTime(sustain, t + attack + decay);
        gain.gain.setValueAtTime(sustain, t + duration - release);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

        // Frequency sweep
        if (opts.freqEnd) {
            osc.frequency.setValueAtTime(freq, t);
            osc.frequency.exponentialRampToValueAtTime(opts.freqEnd, t + duration);
        }

        // Optional filter
        if (opts.filter) {
            const filter = ctx.createBiquadFilter();
            filter.type = opts.filter.type || 'lowpass';
            filter.frequency.value = opts.filter.freq || 2000;
            filter.Q.value = opts.filter.Q || 1;
            if (opts.filter.freqEnd) {
                filter.frequency.setValueAtTime(opts.filter.freq, t);
                filter.frequency.exponentialRampToValueAtTime(opts.filter.freqEnd, t + duration);
            }
            osc.connect(filter);
            filter.connect(gain);
        } else {
            osc.connect(gain);
        }

        gain.connect(masterGain);
        osc.start(t);
        osc.stop(t + duration + 0.01);
    }

    // --- Enhanced noise generator ---
    function playNoise(duration, volume = 0.15, filterFreq = 3000, opts = {}) {
        if (!ctx) return;
        const t = ctx.currentTime;
        const bufSize = Math.floor(ctx.sampleRate * duration);
        const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
        const data = buf.getChannelData(0);

        // Colored noise generation
        const noiseType = opts.noiseType || 'white';
        if (noiseType === 'pink') {
            let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
            for (let i = 0; i < bufSize; i++) {
                const white = Math.random() * 2 - 1;
                b0 = 0.99886 * b0 + white * 0.0555179;
                b1 = 0.99332 * b1 + white * 0.0750759;
                b2 = 0.96900 * b2 + white * 0.1538520;
                b3 = 0.86650 * b3 + white * 0.3104856;
                b4 = 0.55000 * b4 + white * 0.5329522;
                b5 = -0.7616 * b5 - white * 0.0168980;
                data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
                b6 = white * 0.115926;
            }
        } else {
            for (let i = 0; i < bufSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
        }

        const src = ctx.createBufferSource();
        src.buffer = buf;

        const filter = ctx.createBiquadFilter();
        filter.type = opts.filterType || 'lowpass';
        filter.frequency.value = filterFreq;
        filter.Q.value = opts.Q || 1;

        if (opts.filterEnd) {
            filter.frequency.setValueAtTime(filterFreq, t);
            filter.frequency.exponentialRampToValueAtTime(opts.filterEnd, t + duration);
        }

        const gain = ctx.createGain();
        const attack = opts.attack || 0.003;
        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(volume, t + attack);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

        src.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);
        src.start(t);
        src.stop(t + duration + 0.01);
    }

    // ====== GAME SOUND EFFECTS ======

    function shoot_pulse() {
        // Sharp electronic zap
        playTone(1200, 'square', 0.07, 0.1, 0, { freqEnd: 600, attack: 0.001 });
        playTone(880, 'sine', 0.06, 0.08, 5);
        playNoise(0.04, 0.04, 8000, { filterEnd: 2000 });
    }

    function shoot_spread() {
        // Shotgun-style burst
        playNoise(0.08, 0.12, 6000, { filterEnd: 1000, noiseType: 'pink' });
        playTone(350, 'sawtooth', 0.1, 0.12, 0, { freqEnd: 200, attack: 0.001 });
        playTone(500, 'square', 0.06, 0.06, -10);
    }

    function shoot_beam() {
        // Continuous energy hum with beating
        playTone(220, 'sine', 0.06, 0.05, 0);
        playTone(223, 'sine', 0.06, 0.05, 0);
        playTone(440, 'triangle', 0.04, 0.02, 0);
    }

    function shoot_rocket() {
        // Deep launch with whoosh
        playTone(80, 'sawtooth', 0.25, 0.18, 0, {
            freqEnd: 40,
            filter: { type: 'lowpass', freq: 800, freqEnd: 200 }
        });
        playNoise(0.3, 0.14, 2000, { filterEnd: 400, noiseType: 'pink' });
        playTone(200, 'square', 0.05, 0.06, 0, { freqEnd: 100 });
    }

    function shoot_homing() {
        // Tech lock-on chirp
        playTone(500, 'triangle', 0.08, 0.1, 0, { freqEnd: 1200 });
        playTone(800, 'sine', 0.1, 0.07, 8);
        setTimeout(() => {
            if (ctx) playTone(1000, 'sine', 0.05, 0.05, 0);
        }, 50);
    }

    function shoot_rail() {
        // Electromagnetic railgun crack
        playTone(100, 'sawtooth', 0.2, 0.18, 0, {
            freqEnd: 50,
            filter: { type: 'lowpass', freq: 1200, freqEnd: 200 }
        });
        playTone(2400, 'square', 0.04, 0.08, 0, { freqEnd: 800 });
        playNoise(0.15, 0.15, 10000, { filterEnd: 1000, attack: 0.001 });
        playTone(150, 'sine', 0.2, 0.1, 0, { freqEnd: 60 });
    }

    function explosion_small() {
        playNoise(0.35, 0.22, 2500, { filterEnd: 300, noiseType: 'pink' });
        playTone(70, 'sine', 0.35, 0.18, 0, { freqEnd: 30 });
        playTone(120, 'sawtooth', 0.15, 0.06, 0, { freqEnd: 40 });
    }

    function explosion_large() {
        // Multi-layered explosion
        playNoise(0.6, 0.3, 2000, { filterEnd: 150, noiseType: 'pink', attack: 0.001 });
        playNoise(0.4, 0.15, 5000, { filterEnd: 500 });
        playTone(40, 'sine', 0.6, 0.25, 0, { freqEnd: 20 });
        playTone(60, 'sawtooth', 0.5, 0.12, 0, {
            freqEnd: 25,
            filter: { type: 'lowpass', freq: 600, freqEnd: 100 }
        });
        setTimeout(() => {
            if (ctx) {
                playTone(50, 'sine', 0.4, 0.1, 0, { freqEnd: 20 });
                playNoise(0.3, 0.08, 1000, { filterEnd: 200 });
            }
        }, 80);
    }

    function hit_enemy() {
        playTone(400, 'square', 0.04, 0.07, 0, { freqEnd: 200 });
        playNoise(0.03, 0.04, 4000, { filterEnd: 1000 });
    }

    function hit_player() {
        // Impactful crunch
        playTone(120, 'sawtooth', 0.15, 0.18, 0, { freqEnd: 60 });
        playNoise(0.12, 0.18, 3000, { filterEnd: 400, noiseType: 'pink' });
        playTone(300, 'square', 0.04, 0.06, 0, { freqEnd: 100 });
    }

    function powerup_collect() {
        // Ascending sparkle arpeggio
        playTone(523, 'sine', 0.12, 0.12, 0, { attack: 0.003 });
        playTone(523, 'triangle', 0.12, 0.06, 5);
        setTimeout(() => {
            if (ctx) {
                playTone(659, 'sine', 0.12, 0.12, 0);
                playTone(659, 'triangle', 0.1, 0.06, 5);
            }
        }, 70);
        setTimeout(() => {
            if (ctx) {
                playTone(784, 'sine', 0.15, 0.14, 0);
                playTone(784, 'triangle', 0.12, 0.07, 5);
            }
        }, 140);
        setTimeout(() => {
            if (ctx) playTone(1047, 'sine', 0.2, 0.1, 0);
        }, 210);
    }

    function wave_start() {
        // Dramatic rising horn
        playTone(220, 'sawtooth', 0.25, 0.08, 0, {
            freqEnd: 330,
            filter: { type: 'lowpass', freq: 1000, freqEnd: 3000 }
        });
        setTimeout(() => {
            if (ctx) {
                playTone(330, 'sawtooth', 0.25, 0.1, 0, {
                    freqEnd: 440,
                    filter: { type: 'lowpass', freq: 1200, freqEnd: 4000 }
                });
            }
        }, 200);
        setTimeout(() => {
            if (ctx) {
                playTone(440, 'sawtooth', 0.35, 0.12, 0, {
                    filter: { type: 'lowpass', freq: 2000, freqEnd: 5000 }
                });
                playTone(440, 'sine', 0.35, 0.08, 3);
            }
        }, 400);
    }

    function boss_alert() {
        // Ominous warning siren
        for (let i = 0; i < 4; i++) {
            setTimeout(() => {
                if (!ctx) return;
                playTone(80 + i * 20, 'sawtooth', 0.22, 0.14, 0, {
                    filter: { type: 'lowpass', freq: 800 + i * 200, freqEnd: 300 }
                });
                playTone(160 + i * 20, 'square', 0.18, 0.06, 0);
                playNoise(0.08, 0.04, 1500, { filterEnd: 300 });
            }, i * 220);
        }
        // Final deep boom
        setTimeout(() => {
            if (ctx) {
                playTone(50, 'sine', 0.5, 0.15, 0, { freqEnd: 25 });
                playNoise(0.3, 0.1, 1000, { filterEnd: 200, noiseType: 'pink' });
            }
        }, 880);
    }

    function augment_select() {
        // Magical power-up shimmer
        playTone(440, 'sine', 0.12, 0.1, 0);
        playTone(440, 'triangle', 0.12, 0.05, 7);
        setTimeout(() => {
            if (ctx) {
                playTone(660, 'sine', 0.12, 0.1, 0);
                playTone(660, 'triangle', 0.1, 0.05, 7);
            }
        }, 90);
        setTimeout(() => {
            if (ctx) {
                playTone(880, 'sine', 0.15, 0.12, 0);
                playTone(880, 'triangle', 0.12, 0.06, 7);
            }
        }, 180);
        setTimeout(() => {
            if (ctx) {
                playTone(1320, 'sine', 0.3, 0.1, 0);
                playNoise(0.15, 0.03, 8000, { filterEnd: 2000 });
            }
        }, 270);
    }

    function menu_click() {
        playTone(800, 'sine', 0.06, 0.08, 0, { freqEnd: 600 });
        playTone(600, 'triangle', 0.04, 0.04, 0);
    }

    function game_over() {
        // Dramatic descending death
        playTone(440, 'sine', 0.35, 0.14, 0, { attack: 0.01 });
        playTone(440, 'sawtooth', 0.3, 0.05, 0, {
            filter: { type: 'lowpass', freq: 2000, freqEnd: 500 }
        });
        setTimeout(() => {
            if (ctx) {
                playTone(370, 'sine', 0.35, 0.14, 0);
                playTone(370, 'sawtooth', 0.3, 0.04, 0, {
                    filter: { type: 'lowpass', freq: 1500, freqEnd: 400 }
                });
            }
        }, 300);
        setTimeout(() => {
            if (ctx) playTone(330, 'sine', 0.35, 0.14, 0);
        }, 600);
        setTimeout(() => {
            if (ctx) {
                playTone(220, 'sine', 0.7, 0.18, 0);
                playTone(220, 'sawtooth', 0.6, 0.06, 0, {
                    filter: { type: 'lowpass', freq: 1000, freqEnd: 200 }
                });
                playNoise(0.5, 0.05, 600, { filterEnd: 100, noiseType: 'pink' });
            }
        }, 900);
    }

    function enemy_shoot() {
        playTone(280, 'square', 0.06, 0.05, 0, { freqEnd: 180 });
        playNoise(0.03, 0.03, 3000, { filterEnd: 800 });
    }

    function pause_open() {
        playTone(600, 'sine', 0.1, 0.1, 0, { freqEnd: 400 });
        playTone(400, 'triangle', 0.15, 0.06, 0);
    }

    function pause_close() {
        playTone(400, 'sine', 0.08, 0.1, 0, { freqEnd: 700 });
        playTone(600, 'triangle', 0.1, 0.06, 0);
    }

    // AoE explosion for rocket
    function rocket_aoe() {
        playNoise(0.5, 0.25, 1800, { filterEnd: 200, noiseType: 'pink', attack: 0.001 });
        playTone(50, 'sine', 0.5, 0.2, 0, { freqEnd: 20 });
        playTone(100, 'sawtooth', 0.3, 0.08, 0, {
            freqEnd: 30,
            filter: { type: 'lowpass', freq: 800, freqEnd: 100 }
        });
    }

    return {
        init, resume, toggleMute,
        shoot_pulse, shoot_spread, shoot_beam, shoot_rocket, shoot_homing, shoot_rail,
        explosion_small, explosion_large,
        hit_enemy, hit_player,
        powerup_collect, wave_start, boss_alert,
        augment_select, menu_click, game_over, enemy_shoot,
        pause_open, pause_close, rocket_aoe
    };
})();
