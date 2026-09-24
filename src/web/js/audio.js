/**
 * Ribbit's Big Adventure - Original Audio & Procedural Soundtrack Engine (V3)
 * 
 * Features:
 * - 100% Original, zero Mario Bros or copyrighted sound effects.
 * - Organic, swamp-inspired sound effects:
 *   - Resonant biological frog leaps & throat bubbles
 *   - Rubbery trampoline bounce mushroom spring wobbles
 *   - Snappy elastic tongue whip & suction pop
 *   - Luminous crystalline firefly starburst chimes
 *   - Dual-formant authentic bullfrog croaks (ribb-it!)
 *   - Deep swamp water splash & lilypad surface taps
 * - 5 DISTINCT ORIGINAL SONGS (one per level!):
 *   1. Lilypad Lagoon: "Sunlit Shallows" (Calypso Marimba & Woodblocks in F Major)
 *   2. Cattail Canopy: "Breeze in the Reeds" (Airy Celtic-Swamp Panpipe in D Dorian)
 *   3. Mushroom Mire: "Spore Boogie" (Quirky Bouncy Slap-Bass Funk in E Minor)
 *   4. The Sunken Citadel: "Citadel of the Frog King" (Ominous Ancient War March in C Minor)
 *   5. Firefly Marsh: "Bioluminescent Glow" (Dreamy Crystalline Lullaby in G Lydian)
 *   + Boss Track: "Croaker's Wrath" (Urgent High-BPM Battle Drums in F# Diminished)
 * - Zero external files or mp3 dependencies - generated purely via Web Audio API!
 */

class SoundEngine {
    constructor() {
        this.ctx = null;
        this.isMuted = Boolean(window.StorageManager?.load().profile.settings.muted);
        this.musicPlaying = false;
        this.musicTimer = null;
        this.currentStep = 0;
        this.currentLevelIdx = 0;

        this.bossMusicPlaying = false;
        this.isBossMusicActive = false;
        this.bossStep = 0;
        this.bossMusicTimer = null;

        this.setupAutoUnlock();
    }

    setupAutoUnlock() {
        const unlock = () => {
            this.init();
            if (this.ctx && this.ctx.state === 'running') {
                ['touchstart', 'touchend', 'pointerdown', 'keydown'].forEach(evt => {
                    window.removeEventListener(evt, unlock);
                    document.removeEventListener(evt, unlock);
                });
            }
        };
        ['touchstart', 'touchend', 'pointerdown', 'keydown'].forEach(evt => {
            window.addEventListener(evt, unlock, { passive: true });
            document.addEventListener(evt, unlock, { passive: true });
        });
    }

    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioCtx();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        window.StorageManager?.save({ settings: { muted: this.isMuted } });
        if (this.isMuted) {
            this.stopMusic();
            this.stopBossMusic();
        } else {
            if (this.isBossMusicActive) {
                this.startBossMusic();
            } else {
                this.startMusic(this.currentLevelIdx);
            }
        }
        return this.isMuted;
    }

    setMuted(isMuted) {
        if (Boolean(isMuted) !== this.isMuted) this.toggleMute();
        return this.isMuted;
    }

    // ==========================================
    // 1. ORIGINAL SWAMP SOUND EFFECTS
    // ==========================================

    /**
     * Organic Frog Jump:
     * Gentle resonant throat pop with air woosh (no 8-bit square ramps!)
     */
    playJump(big = false) {
        if (this.isMuted) return;
        this.init();
        const now = this.ctx.currentTime;

        if (big) {
            // Super Bounce (Mushroom / Spring):
            // Rubbery elastic boing with dual harmonic wobble
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(140, now);
            osc.frequency.exponentialRampToValueAtTime(580, now + 0.14);
            osc.frequency.linearRampToValueAtTime(320, now + 0.28);
            osc.frequency.exponentialRampToValueAtTime(440, now + 0.38);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(1200, now);
            filter.Q.setValueAtTime(4.0, now);

            gain.gain.setValueAtTime(0.24, now);
            gain.gain.exponentialRampToValueAtTime(0.005, now + 0.42);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.42);
        } else {
            // Standard Natural Hop:
            // Soft throat pop + warm lowpass resonant rise
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(85, now);
            osc.frequency.exponentialRampToValueAtTime(260, now + 0.12);

            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(350, now);
            filter.Q.setValueAtTime(2.5, now);

            gain.gain.setValueAtTime(0.20, now);
            gain.gain.exponentialRampToValueAtTime(0.005, now + 0.16);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.16);

            // Subtle secondary breath bubble
            const bubbleOsc = this.ctx.createOscillator();
            const bubbleGain = this.ctx.createGain();
            bubbleOsc.type = 'triangle';
            bubbleOsc.frequency.setValueAtTime(220, now + 0.02);
            bubbleOsc.frequency.exponentialRampToValueAtTime(420, now + 0.09);
            bubbleGain.gain.setValueAtTime(0.08, now + 0.02);
            bubbleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.10);
            bubbleOsc.connect(bubbleGain);
            bubbleGain.connect(this.ctx.destination);
            bubbleOsc.start(now + 0.02);
            bubbleOsc.stop(now + 0.10);
        }
    }

    /**
     * Authentic Bullfrog Croak ("Ribb-it!"):
     * Dual formant synthesis with vocal sac flutter tremolo
     */
    playRibbit() {
        if (this.isMuted) return;
        this.init();
        const now = this.ctx.currentTime;

        [0, 0.09].forEach((offset, idx) => {
            const osc1 = this.ctx.createOscillator();
            const osc2 = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            // Dual formants
            osc1.type = 'sawtooth';
            osc2.type = 'triangle';
            const baseFreq = idx === 0 ? 175 : 130;
            osc1.frequency.setValueAtTime(baseFreq, now + offset);
            osc1.frequency.linearRampToValueAtTime(baseFreq * 0.75, now + offset + 0.08);

            osc2.frequency.setValueAtTime(baseFreq * 1.5, now + offset);
            osc2.frequency.linearRampToValueAtTime(baseFreq * 1.1, now + offset + 0.08);

            gain.gain.setValueAtTime(0.14, now + offset);
            gain.gain.exponentialRampToValueAtTime(0.005, now + offset + 0.085);

            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(this.ctx.destination);

            osc1.start(now + offset);
            osc2.start(now + offset);
            osc1.stop(now + offset + 0.085);
            osc2.stop(now + offset + 0.085);
        });
    }

    /**
     * Elastic Tongue Whip & Snap:
     * High velocity elastic air-cut with a sticky suction pop
     */
    playTongue() {
        if (this.isMuted) return;
        this.init();
        const now = this.ctx.currentTime;

        // 1. Elastic whip-cut
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(450, now);
        osc.frequency.exponentialRampToValueAtTime(1800, now + 0.06);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.12);

        gain.gain.setValueAtTime(0.16, now);
        gain.gain.exponentialRampToValueAtTime(0.005, now + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.12);

        // 2. Whip-crack noise burst
        this.playFilteredNoise(now, 0.03, 'highpass', 4500, 0.04);
    }

    /**
     * Firefly / Starburst Chime:
     * Crystalline, shimmering glass-harp arpeggio (Replaces Mario B5-E6 coin!)
     */
    playCoin() {
        this.playFireflyChime();
    }

    playEat() {
        this.playFireflyChime();
    }

    playFireflyChime() {
        if (this.isMuted) return;
        this.init();
        const now = this.ctx.currentTime;

        // Shimmering Pentatonic Cascade (D5, A5, D6, F#6, A6)
        const notes = [587.33, 880.00, 1174.66, 1479.98, 1760.00];
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const start = now + idx * 0.024;
            const dur = 0.22 - idx * 0.02;

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, start);

            gain.gain.setValueAtTime(0.11, start);
            gain.gain.exponentialRampToValueAtTime(0.002, start + dur);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(start);
            osc.stop(start + dur);
        });
    }

    /**
     * Stomp / Slap Impact:
     * Wet, squishy mud thud
     */
    playStomp() {
        if (this.isMuted) return;
        this.init();
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(240, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.14);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.005, now + 0.15);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);

        this.playFilteredNoise(now, 0.04, 'bandpass', 1200, 0.06);
    }

    /**
     * Rubber Trampoline / Bounce:
     */
    playBounce() {
        this.playJump(true);
    }

    /**
     * Water Splash / Plop:
     */
    playSplash() {
        if (this.isMuted) return;
        this.init();
        const now = this.ctx.currentTime;

        // Low plop
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(110, now);
        osc.frequency.exponentialRampToValueAtTime(35, now + 0.22);
        gain.gain.setValueAtTime(0.28, now);
        gain.gain.exponentialRampToValueAtTime(0.005, now + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.25);

        // Water droplet noise
        this.playFilteredNoise(now, 0.09, 'bandpass', 1400, 0.12);
    }

    /**
     * Hurt / Fall Gulp:
     */
    playHurt() {
        if (this.isMuted) return;
        this.init();
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.linearRampToValueAtTime(70, now + 0.25);

        gain.gain.setValueAtTime(0.26, now);
        gain.gain.exponentialRampToValueAtTime(0.005, now + 0.28);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.28);
    }

    /**
     * Stage Victory / Golden Lotus Fanfare:
     * Warm tropical marimba & kalimba chord progression
     */
    playWin() {
        if (this.isMuted) return;
        this.init();
        const now = this.ctx.currentTime;

        // F Major -> A minor -> Bb -> C -> F Maj7
        const chords = [
            { t: 0.00, notes: [349.23, 440.00, 523.25] }, // F Maj
            { t: 0.16, notes: [440.00, 523.25, 659.25] }, // A min
            { t: 0.32, notes: [466.16, 587.33, 698.46] }, // Bb Maj
            { t: 0.48, notes: [523.25, 659.25, 783.99] }, // C Maj
            { t: 0.68, notes: [349.23, 523.25, 659.25, 880.00] } // F Maj9
        ];

        chords.forEach(chord => {
            chord.notes.forEach(freq => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                const start = now + chord.t;
                const dur = (chord.t >= 0.68) ? 0.6 : 0.16;

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, start);

                gain.gain.setValueAtTime(0.12, start);
                gain.gain.exponentialRampToValueAtTime(0.002, start + dur);

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start(start);
                osc.stop(start + dur);
            });
        });
    }

    // ==========================================
    // 2. FIVE ORIGINAL LEVEL SOUNDTRACKS
    // ==========================================

    /**
     * Starts the procedural track tailored specifically to the given level index (0 to 4)
     */
    startMusic(levelIdx = 0) {
        if (this.isMuted) return;
        this.init();

        if (this.musicPlaying && this.currentLevelIdx === levelIdx) return;
        this.stopMusic();

        this.musicPlaying = true;
        this.currentLevelIdx = levelIdx;
        this.currentStep = 0;

        const song = this.getLevelSong(levelIdx);
        const stepTime = (60 / song.tempo) / 4; // 16th-note ticks

        const scheduleStep = () => {
            if (!this.musicPlaying || this.isMuted) return;
            const now = this.ctx.currentTime;
            const step = this.currentStep;

            // 1. Play Lead Instrument
            const mFreq = song.melody[step % song.melody.length];
            if (mFreq > 0) {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = song.leadWave || 'triangle';
                osc.frequency.setValueAtTime(mFreq, now);

                gain.gain.setValueAtTime(song.leadVol || 0.045, now);
                gain.gain.exponentialRampToValueAtTime(0.003, now + stepTime * 0.88);

                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + stepTime * 0.88);
            }

            // 2. Play Bassline
            const bFreq = song.bass[step % song.bass.length];
            if (bFreq > 0) {
                const bOsc = this.ctx.createOscillator();
                const bGain = this.ctx.createGain();
                bOsc.type = song.bassWave || 'sine';
                bOsc.frequency.setValueAtTime(bFreq, now);

                bGain.gain.setValueAtTime(song.bassVol || 0.08, now);
                bGain.gain.exponentialRampToValueAtTime(0.004, now + stepTime * 0.95);

                bOsc.connect(bGain);
                bGain.connect(this.ctx.destination);
                bOsc.start(now);
                bOsc.stop(now + stepTime * 0.95);
            }

            // 3. Play Percussion / Rhythm Accents
            if (song.percussion) {
                song.percussion(now, step, this);
            }

            this.currentStep++;
            this.musicTimer = setTimeout(scheduleStep, stepTime * 1000);
        };

        scheduleStep();
    }

    stopMusic() {
        this.musicPlaying = false;
        if (this.musicTimer) {
            clearTimeout(this.musicTimer);
            this.musicTimer = null;
        }
    }

    /**
     * Level Soundtrack Compositions:
     */
    getLevelSong(idx) {
        switch (idx) {
            // ----------------------------------------------------
            // LEVEL 1: Lilypad Lagoon — "Sunlit Shallows"
            // Tropical Calypso Marimba in F Major (126 BPM)
            // ----------------------------------------------------
            case 0:
                return {
                    tempo: 126,
                    leadWave: 'triangle',
                    leadVol: 0.05,
                    bassWave: 'sine',
                    bassVol: 0.09,
                    melody: [
                        // Bar 1
                        349.23, 0, 440.00, 0, 523.25, 0, 440.00, 0,
                        587.33, 0, 523.25, 0, 440.00, 392.00, 349.23, 0,
                        // Bar 2
                        392.00, 0, 440.00, 0, 523.25, 0, 587.33, 0,
                        523.25, 0, 440.00, 0, 349.23, 0, 0, 0,
                        // Bar 3
                        587.33, 0, 587.33, 0, 523.25, 0, 440.00, 0,
                        392.00, 0, 440.00, 523.25, 440.00, 0, 349.23, 0,
                        // Bar 4
                        392.00, 0, 392.00, 440.00, 392.00, 0, 349.23, 0,
                        349.23, 0, 0, 0, 523.25, 0, 0, 0
                    ],
                    bass: [
                        174.61, 0, 174.61, 0, 220.00, 0, 261.63, 0,
                        196.00, 0, 196.00, 0, 174.61, 0, 130.81, 0,
                        174.61, 0, 174.61, 0, 220.00, 0, 261.63, 0,
                        196.00, 0, 220.00, 0, 174.61, 0, 174.61, 0
                    ],
                    percussion: (now, step, engine) => {
                        // Woodblock clicks on offbeats
                        if (step % 4 === 2) {
                            engine.playWoodblock(now, 850);
                        } else if (step % 8 === 4) {
                            engine.playWoodblock(now, 1150);
                        }
                    }
                };

            // ----------------------------------------------------
            // LEVEL 2: Cattail Canopy — "Breeze in the Reeds"
            // Whimsical Panpipe Folk in D Dorian (134 BPM)
            // ----------------------------------------------------
            case 1:
                return {
                    tempo: 134,
                    leadWave: 'sine',
                    leadVol: 0.052,
                    bassWave: 'triangle',
                    bassVol: 0.08,
                    melody: [
                        // Bar 1
                        293.66, 0, 349.23, 0, 440.00, 0, 523.25, 587.33,
                        523.25, 0, 440.00, 0, 349.23, 0, 293.66, 0,
                        // Bar 2
                        440.00, 0, 523.25, 0, 587.33, 0, 659.25, 0,
                        587.33, 0, 523.25, 0, 440.00, 0, 0, 0,
                        // Bar 3
                        659.25, 0, 587.33, 0, 523.25, 0, 440.00, 0,
                        392.00, 0, 440.00, 0, 523.25, 0, 587.33, 0,
                        // Bar 4
                        440.00, 0, 392.00, 0, 349.23, 0, 329.63, 0,
                        293.66, 0, 0, 0, 293.66, 0, 0, 0
                    ],
                    bass: [
                        146.83, 0, 146.83, 0, 174.61, 0, 220.00, 0,
                        196.00, 0, 196.00, 0, 146.83, 0, 220.00, 0,
                        174.61, 0, 174.61, 0, 220.00, 0, 246.94, 0,
                        146.83, 0, 146.83, 0, 146.83, 0, 0, 0
                    ],
                    percussion: (now, step, engine) => {
                        // Soft shaker on every 16th note, light snare on beat 3
                        if (step % 2 === 0) engine.playFilteredNoise(now, 0.015, 'highpass', 8500, 0.01);
                        if (step % 8 === 4) engine.playFilteredNoise(now, 0.035, 'bandpass', 2400, 0.035);
                    }
                };

            // ----------------------------------------------------
            // LEVEL 3: Mushroom Mire — "Spore Boogie"
            // Quirky Slap-Bass Funk in E Minor (118 BPM)
            // ----------------------------------------------------
            case 2:
                return {
                    tempo: 118,
                    leadWave: 'square',
                    leadVol: 0.035,
                    bassWave: 'triangle',
                    bassVol: 0.12,
                    melody: [
                        // Bubbly funk stabs
                        0, 329.63, 0, 392.00, 0, 440.00, 466.16, 493.88,
                        0, 493.88, 0, 466.16, 0, 440.00, 0, 392.00,
                        329.63, 0, 0, 329.63, 0, 392.00, 0, 440.00,
                        0, 587.33, 0, 493.88, 392.00, 0, 329.63, 0
                    ],
                    bass: [
                        // Bouncy slap bass groove
                        82.41, 0, 82.41, 164.81, 0, 82.41, 98.00, 103.83,
                        110.00, 0, 110.00, 146.83, 0, 123.47, 98.00, 0,
                        82.41, 0, 82.41, 164.81, 0, 82.41, 123.47, 0,
                        110.00, 0, 98.00, 0, 82.41, 0, 82.41, 0
                    ],
                    percussion: (now, step, engine) => {
                        // Tight reggae-swamp rimshot on beats 2 & 4
                        if (step % 8 === 4) engine.playWoodblock(now, 1450, 0.08);
                        if (step % 4 === 0) engine.playFilteredNoise(now, 0.015, 'highpass', 9000, 0.015);
                    }
                };

            // ----------------------------------------------------
            // LEVEL 4: The Sunken Citadel — "Ruin of the Frog King"
            // Dramatic Subterranean March in C Minor (142 BPM)
            // ----------------------------------------------------
            case 3:
                return {
                    tempo: 142,
                    leadWave: 'sawtooth',
                    leadVol: 0.042,
                    bassWave: 'triangle',
                    bassVol: 0.11,
                    melody: [
                        // Ominous dramatic war horns
                        261.63, 0, 261.63, 0, 311.13, 0, 329.63, 0,
                        349.23, 0, 311.13, 0, 261.63, 0, 246.94, 0,
                        261.63, 0, 0, 261.63, 392.00, 0, 369.99, 0,
                        349.23, 0, 311.13, 0, 293.66, 0, 261.63, 0
                    ],
                    bass: [
                        // Heavy marching war bass
                        65.41, 65.41, 0, 65.41, 77.78, 0, 82.41, 0,
                        87.31, 0, 77.78, 0, 65.41, 0, 61.74, 0,
                        65.41, 65.41, 0, 65.41, 98.00, 0, 92.50, 0,
                        87.31, 0, 77.78, 0, 73.42, 0, 65.41, 0
                    ],
                    percussion: (now, step, engine) => {
                        // Heavy war drum on beats 1 & 3, gated crash on 4
                        if (step % 8 === 0) engine.playBassThud(now);
                        if (step % 8 === 4) engine.playFilteredNoise(now, 0.06, 'bandpass', 1100, 0.05);
                    }
                };

            // ----------------------------------------------------
            // LEVEL 5: Firefly Marsh — "Bioluminescent Glow"
            // Magical Lydian Lullaby & Music Box in G Lydian (106 BPM)
            // ----------------------------------------------------
            case 4:
            default:
                return {
                    tempo: 106,
                    leadWave: 'sine',
                    leadVol: 0.048,
                    bassWave: 'sine',
                    bassVol: 0.08,
                    melody: [
                        // Ethereal music box arpeggio (G, B, D, F#, A)
                        392.00, 493.88, 587.33, 739.99, 880.00, 739.99, 587.33, 493.88,
                        440.00, 523.25, 659.25, 783.99, 880.00, 783.99, 659.25, 523.25,
                        369.99, 440.00, 554.37, 659.25, 739.99, 659.25, 554.37, 440.00,
                        392.00, 493.88, 587.33, 739.99, 987.77, 0, 0, 0
                    ],
                    bass: [
                        // Soothing deep ambient sub-pulse
                        98.00, 0, 0, 0, 98.00, 0, 0, 0,
                        110.00, 0, 0, 0, 110.00, 0, 0, 0,
                        92.50, 0, 0, 0, 92.50, 0, 0, 0,
                        98.00, 0, 0, 0, 98.00, 0, 0, 0
                    ],
                    percussion: (now, step, engine) => {
                        // Gentle midnight cricket clicks
                        if (step % 4 === 1 || step % 4 === 3) {
                            engine.playFilteredNoise(now, 0.008, 'highpass', 9500, 0.01);
                        }
                    }
                };
        }
    }

    // ==========================================
    // 3. PROCEDURAL INSTRUMENT HELPERS
    // ==========================================

    playWoodblock(time, freq = 900, gainVal = 0.05) {
        if (!this.ctx || this.isMuted) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(gainVal, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.035);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(time);
        osc.stop(time + 0.035);
    }

    playBassThud(time) {
        if (!this.ctx || this.isMuted) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(110, time);
        osc.frequency.exponentialRampToValueAtTime(35, time + 0.18);
        gain.gain.setValueAtTime(0.18, time);
        gain.gain.exponentialRampToValueAtTime(0.005, time + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(time);
        osc.stop(time + 0.2);
    }

    playFilteredNoise(time, duration, filterType, freq, gainVal) {
        if (!this.ctx || this.isMuted) return;
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = filterType;
        filter.frequency.setValueAtTime(freq, time);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(gainVal, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start(time);
    }

    // ==========================================
    // 4. BOSS BATTLE AUDIO FX & MUSIC
    // ==========================================

    playBossRoar() {
        if (this.isMuted) return;
        this.init();
        const now = this.ctx.currentTime;
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc1.type = 'sawtooth';
        osc2.type = 'triangle';
        osc1.frequency.setValueAtTime(130, now);
        osc1.frequency.exponentialRampToValueAtTime(35, now + 0.55);

        osc2.frequency.setValueAtTime(95, now);
        osc2.frequency.exponentialRampToValueAtTime(30, now + 0.55);

        gain.gain.setValueAtTime(0.32, now);
        gain.gain.exponentialRampToValueAtTime(0.005, now + 0.6);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.6);
        osc2.stop(now + 0.6);
    }

    playBossSlam() {
        if (this.isMuted) return;
        this.init();
        const now = this.ctx.currentTime;
        this.playBassThud(now);
        this.playFilteredNoise(now, 0.15, 'lowpass', 600, 0.22);
    }

    playBossHurt() {
        if (this.isMuted) return;
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(310, now);
        osc.frequency.linearRampToValueAtTime(80, now + 0.32);

        gain.gain.setValueAtTime(0.32, now);
        gain.gain.exponentialRampToValueAtTime(0.005, now + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
    }

    playShockwave() {
        if (this.isMuted) return;
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(280, now);
        osc.frequency.exponentialRampToValueAtTime(70, now + 0.22);

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.005, now + 0.24);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.24);
    }

    playGateSlam() {
        if (this.isMuted) return;
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(90, now);
        osc.frequency.exponentialRampToValueAtTime(25, now + 0.3);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.005, now + 0.3);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
    }

    startBossMusic() {
        if (this.isMuted) return;
        this.stopMusic();
        this.stopBossMusic();
        this.init();

        this.bossMusicPlaying = true;
        this.isBossMusicActive = true;
        this.bossStep = 0;
        const bossTempo = 160;

        // Dark dramatic boss tension melody in F# Diminished
        const bossMelody = [
            185.00, 0, 220.00, 0, 261.63, 277.18, 0, 261.63,
            220.00, 0, 185.00, 0, 174.61, 0, 185.00, 0,
            370.00, 0, 349.23, 0, 329.63, 0, 311.13, 0,
            293.66, 277.18, 261.63, 246.94, 220.00, 0, 207.65, 0
        ];

        const bossBass = [
            92.50, 92.50, 0, 92.50, 110.00, 0, 92.50, 123.47,
            92.50, 92.50, 0, 92.50, 87.31, 0, 92.50, 0,
            92.50, 92.50, 0, 92.50, 110.00, 0, 92.50, 123.47,
            92.50, 92.50, 103.83, 110.00, 123.47, 110.00, 103.83, 87.31
        ];

        const stepTime = (60 / bossTempo) / 4;

        const scheduleBossNote = () => {
            if (!this.bossMusicPlaying || this.isMuted) return;
            const now = this.ctx.currentTime;

            const mFreq = bossMelody[this.bossStep % bossMelody.length];
            if (mFreq > 0) {
                const mOsc = this.ctx.createOscillator();
                const mGain = this.ctx.createGain();
                mOsc.type = 'sawtooth';
                mOsc.frequency.setValueAtTime(mFreq, now);

                mGain.gain.setValueAtTime(0.045, now);
                mGain.gain.exponentialRampToValueAtTime(0.005, now + stepTime * 0.85);

                mOsc.connect(mGain);
                mGain.connect(this.ctx.destination);
                mOsc.start(now);
                mOsc.stop(now + stepTime * 0.85);
            }

            const bFreq = bossBass[this.bossStep % bossBass.length];
            if (bFreq > 0) {
                const bOsc = this.ctx.createOscillator();
                const bGain = this.ctx.createGain();
                bOsc.type = 'triangle';
                bOsc.frequency.setValueAtTime(bFreq, now);

                bGain.gain.setValueAtTime(0.10, now);
                bGain.gain.exponentialRampToValueAtTime(0.006, now + stepTime * 0.95);

                bOsc.connect(bGain);
                bGain.connect(this.ctx.destination);
                bOsc.start(now);
                bOsc.stop(now + stepTime * 0.95);
            }

            if (this.bossStep % 2 === 0) {
                this.playFilteredNoise(now, 0.04, 'bandpass', 1800, 0.03);
            }

            this.bossStep++;
            this.bossMusicTimer = setTimeout(scheduleBossNote, stepTime * 1000);
        };

        scheduleBossNote();
    }

    stopBossMusic() {
        this.bossMusicPlaying = false;
        this.isBossMusicActive = false;
        if (this.bossMusicTimer) {
            clearTimeout(this.bossMusicTimer);
            this.bossMusicTimer = null;
        }
    }
}

// Global single instance
window.soundEngine = new SoundEngine();
