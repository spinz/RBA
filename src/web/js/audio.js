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
        this.paused = false;
        this.hidden = document.hidden;
        document.addEventListener('visibilitychange', () => {
            this.hidden = document.hidden;
            this.syncPlayback();
        });
        this.track = null;
        this.currentLevelIdx = 0;
        this.currentStep = 0;
        this.musicTimer = null;
        this.musicPlaying = false;
        this.bossMusicPlaying = false;
        this.isBossMusicActive = false;
        this.voices = new Map();
        this.schedulingMusic = false;
        this.setupAutoUnlock();
    }

    setupAutoUnlock() {
        const unlock = () => {
            if (this.init()) this.syncPlayback();
        };
        // Keep these lightweight handlers: mobile browsers can suspend audio again.
        ['pointerdown', 'keydown', 'touchend'].forEach(event => {
            window.addEventListener(event, unlock, { passive: true });
        });
    }

    init() {
        try {
            if (!this.ctx) {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (!AudioCtx) return false;
                this.ctx = new AudioCtx();
                this.master = this.ctx.createGain();
                this.musicBus = this.ctx.createGain();
                this.effectsBus = this.ctx.createGain();
                const tone = this.ctx.createBiquadFilter();
                tone.type = 'lowpass';
                tone.frequency.value = 4200;
                const limiter = this.ctx.createDynamicsCompressor();
                limiter.threshold.value = -18;
                limiter.knee.value = 18;
                limiter.ratio.value = 4;
                this.musicBus.gain.value = 0.65;
                this.effectsBus.gain.value = 0.45;
                this.master.gain.value = this.isMuted || this.paused ? 0 : 0.8;
                this.musicBus.connect(tone);
                tone.connect(this.master);
                this.effectsBus.connect(this.master);
                this.master.connect(limiter);
                limiter.connect(this.ctx.destination);
            }
            if (this.ctx.state === 'suspended') {
                this.ctx.resume().then(() => this.syncPlayback()).catch(() => {});
            }
            return true;
        } catch {
            // Audio is optional; an unavailable device must never stop the game.
            return false;
        }
    }

    canPlay() {
        return Boolean(this.ctx && this.ctx.state === 'running' && !this.isMuted && !this.paused && !this.hidden);
    }

    get output() {
        return this.schedulingMusic ? this.musicBus : this.effectsBus;
    }

    createSource(kind) {
        const source = kind === 'noise' ? this.ctx.createBufferSource() : this.ctx.createOscillator();
        this.voices.set(source, this.schedulingMusic ? 'music' : 'effect');
        source.onended = () => {
            source.disconnect();
            this.voices.delete(source);
        };
        return source;
    }

    stopVoices(kind) {
        for (const [source, voiceKind] of this.voices) {
            if (kind && kind !== voiceKind) continue;
            try { source.stop(); } catch { /* Already ended. */ }
            source.disconnect();
            this.voices.delete(source);
        }
    }

    toggleMute() {
        return this.setMuted(!this.isMuted);
    }

    setMuted(muted) {
        this.isMuted = Boolean(muted);
        window.StorageManager?.save({ settings: { muted: this.isMuted } });
        this.syncPlayback();
        return this.isMuted;
    }

    setPaused(paused) {
        this.paused = Boolean(paused);
        this.syncPlayback();
    }

    setTrack(track, levelIdx = this.currentLevelIdx) {
        if (this.track === track && this.currentLevelIdx === levelIdx) {
            this.syncPlayback();
            return;
        }
        this.stopScheduler();
        this.stopVoices('music');
        this.track = track;
        this.currentLevelIdx = levelIdx;
        this.currentStep = 0;
        this.isBossMusicActive = track === 'boss';
        this.syncPlayback();
    }

    stopScheduler() {
        if (this.musicTimer !== null) clearTimeout(this.musicTimer);
        this.musicTimer = null;
        this.musicPlaying = false;
        this.bossMusicPlaying = false;
    }

    syncPlayback() {
        if (this.master) {
            this.master.gain.setTargetAtTime(this.isMuted || this.paused || this.hidden ? 0 : 0.8, this.ctx.currentTime, 0.025);
        }
        if (!this.canPlay() || !this.track) {
            this.stopScheduler();
            this.stopVoices();
            return;
        }
        if (this.musicTimer !== null) return;
        const song = this.getTrackSong();
        const stepTime = (60 / song.tempo) / 4;
        this.musicPlaying = this.track !== 'boss';
        this.bossMusicPlaying = this.track === 'boss';
        const schedule = () => {
            if (!this.canPlay() || !this.track) { this.stopScheduler(); return; }
            const now = this.ctx.currentTime + 0.01;
            this.schedulingMusic = true;
            try {
                const note = (frequency, wave, volume) => {
                    if (!frequency) return;
                    const osc = this.createSource();
                    const gain = this.ctx.createGain();
                    osc.type = wave;
                    osc.frequency.setValueAtTime(frequency, now);
                    gain.gain.setValueAtTime(0.001, now);
                    gain.gain.linearRampToValueAtTime(volume * (song.mix || 1), now + 0.008);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + stepTime * 0.92);
                    osc.connect(gain);
                    gain.connect(this.musicBus);
                    osc.start(now);
                    osc.stop(now + stepTime);
                };
                // Shared instrument palette and mix across the whole campaign.
                note(song.melody[this.currentStep % song.melody.length], 'triangle', 0.065);
                note(song.bass[this.currentStep % song.bass.length], 'sine', 0.095);
                song.percussion?.(now, this.currentStep, this);
            } finally {
                this.schedulingMusic = false;
            }
            this.currentStep++;
            this.musicTimer = setTimeout(schedule, stepTime * 1000);
        };
        schedule();
    }

    getTrackSong() {
        if (this.track === 'boss') {
            return {
                tempo: 152,
                melody: [185, 0, 220, 0, 261.63, 277.18, 0, 261.63, 220, 0, 185, 0, 174.61, 0, 185, 0],
                bass: [92.5, 0, 92.5, 0, 110, 0, 123.47, 0, 92.5, 0, 92.5, 0, 87.31, 0, 92.5, 0],
                percussion: (now, step, engine) => {
                    if (step % 8 === 0) engine.playBassThud(now);
                    if (step % 4 === 2) engine.playWoodblock(now, 650, 0.035);
                }
            };
        }
        const song = this.getLevelSong(this.track === 'stage' ? this.currentLevelIdx : 4);
        if (this.track === 'stage') return song;
        // Title, reward and ending are quieter variations of the final marsh motif.
        return { ...song, mix: 0.6, tempo: this.track === 'gameover' ? 72 : 92, percussion: null,
            melody: song.melody.map((frequency, index) => index % 2 ? 0 : frequency / 2) };
    }

    // ==========================================
    // 1. ORIGINAL SWAMP SOUND EFFECTS
    // ==========================================

    /**
     * Organic Frog Jump:
     * Gentle resonant throat pop with air woosh (no 8-bit square ramps!)
     */
    playJump(big = false) {
        if (!this.canPlay()) return;
        const now = this.ctx.currentTime;

        if (big) {
            // Super Bounce (Mushroom / Spring):
            // Rubbery elastic boing with dual harmonic wobble
            const osc = this.createSource();
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
            gain.connect(this.output);

            osc.start(now);
            osc.stop(now + 0.42);
        } else {
            // Standard Natural Hop:
            // Soft throat pop + warm lowpass resonant rise
            const osc = this.createSource();
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
            gain.connect(this.output);

            osc.start(now);
            osc.stop(now + 0.16);

            // Subtle secondary breath bubble
            const bubbleOsc = this.createSource();
            const bubbleGain = this.ctx.createGain();
            bubbleOsc.type = 'triangle';
            bubbleOsc.frequency.setValueAtTime(220, now + 0.02);
            bubbleOsc.frequency.exponentialRampToValueAtTime(420, now + 0.09);
            bubbleGain.gain.setValueAtTime(0.08, now + 0.02);
            bubbleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.10);
            bubbleOsc.connect(bubbleGain);
            bubbleGain.connect(this.output);
            bubbleOsc.start(now + 0.02);
            bubbleOsc.stop(now + 0.10);
        }
    }

    /**
     * Authentic Bullfrog Croak ("Ribb-it!"):
     * Dual formant synthesis with vocal sac flutter tremolo
     */
    playRibbit() {
        if (!this.canPlay()) return;
        const now = this.ctx.currentTime;

        [0, 0.09].forEach((offset, idx) => {
            const osc1 = this.createSource();
            const osc2 = this.createSource();
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
            gain.connect(this.output);

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
        if (!this.canPlay()) return;
        const now = this.ctx.currentTime;

        // 1. Elastic whip-cut
        const osc = this.createSource();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(450, now);
        osc.frequency.exponentialRampToValueAtTime(1800, now + 0.06);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.12);

        gain.gain.setValueAtTime(0.16, now);
        gain.gain.exponentialRampToValueAtTime(0.005, now + 0.12);

        osc.connect(gain);
        gain.connect(this.output);
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
        if (!this.canPlay()) return;
        const now = this.ctx.currentTime;

        // Shimmering Pentatonic Cascade (D5, A5, D6, F#6, A6)
        const notes = [587.33, 880.00, 1174.66, 1479.98, 1760.00];
        notes.forEach((freq, idx) => {
            const osc = this.createSource();
            const gain = this.ctx.createGain();
            const start = now + idx * 0.024;
            const dur = 0.22 - idx * 0.02;

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, start);

            gain.gain.setValueAtTime(0.11, start);
            gain.gain.exponentialRampToValueAtTime(0.002, start + dur);

            osc.connect(gain);
            gain.connect(this.output);

            osc.start(start);
            osc.stop(start + dur);
        });
    }

    /**
     * Stomp / Slap Impact:
     * Wet, squishy mud thud
     */
    playStomp() {
        if (!this.canPlay()) return;
        const now = this.ctx.currentTime;

        const osc = this.createSource();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(240, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.14);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.005, now + 0.15);

        osc.connect(gain);
        gain.connect(this.output);
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
        if (!this.canPlay()) return;
        const now = this.ctx.currentTime;

        // Low plop
        const osc = this.createSource();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(110, now);
        osc.frequency.exponentialRampToValueAtTime(35, now + 0.22);
        gain.gain.setValueAtTime(0.28, now);
        gain.gain.exponentialRampToValueAtTime(0.005, now + 0.25);
        osc.connect(gain);
        gain.connect(this.output);
        osc.start(now);
        osc.stop(now + 0.25);

        // Water droplet noise
        this.playFilteredNoise(now, 0.09, 'bandpass', 1400, 0.12);
    }

    /**
     * Hurt / Fall Gulp:
     */
    playHurt() {
        if (!this.canPlay()) return;
        const now = this.ctx.currentTime;

        const osc = this.createSource();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.linearRampToValueAtTime(70, now + 0.25);

        gain.gain.setValueAtTime(0.26, now);
        gain.gain.exponentialRampToValueAtTime(0.005, now + 0.28);

        osc.connect(gain);
        gain.connect(this.output);
        osc.start(now);
        osc.stop(now + 0.28);
    }

    /**
     * Stage Victory / Golden Lotus Fanfare:
     * Warm tropical marimba & kalimba chord progression
     */
    playWin() {
        if (!this.canPlay()) return;
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
                const osc = this.createSource();
                const gain = this.ctx.createGain();
                const start = now + chord.t;
                const dur = (chord.t >= 0.68) ? 0.6 : 0.16;

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, start);

                gain.gain.setValueAtTime(0.065, start);
                gain.gain.exponentialRampToValueAtTime(0.002, start + dur);

                osc.connect(gain);
                gain.connect(this.output);

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
        this.setTrack('stage', levelIdx);
    }

    stopMusic() {
        if (this.track !== 'boss') this.setTrack(null);
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
        if (!this.canPlay()) return;
        const osc = this.createSource();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(gainVal, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.035);
        osc.connect(gain);
        gain.connect(this.output);
        osc.start(time);
        osc.stop(time + 0.035);
    }

    playBassThud(time) {
        if (!this.canPlay()) return;
        const osc = this.createSource();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(110, time);
        osc.frequency.exponentialRampToValueAtTime(35, time + 0.18);
        gain.gain.setValueAtTime(0.18, time);
        gain.gain.exponentialRampToValueAtTime(0.005, time + 0.2);
        osc.connect(gain);
        gain.connect(this.output);
        osc.start(time);
        osc.stop(time + 0.2);
    }

    playFilteredNoise(time, duration, filterType, freq, gainVal) {
        if (!this.canPlay()) return;
        const bufferSize = Math.max(1, Math.ceil(this.ctx.sampleRate * duration));
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.createSource('noise');
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = filterType;
        filter.frequency.setValueAtTime(freq, time);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(gainVal, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.output);

        noise.start(time);
        noise.stop(time + duration);
    }

    // ==========================================
    // 4. BOSS BATTLE AUDIO FX & MUSIC
    // ==========================================

    playBossRoar() {
        if (!this.canPlay()) return;
        const now = this.ctx.currentTime;
        const osc1 = this.createSource();
        const osc2 = this.createSource();
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
        gain.connect(this.output);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.6);
        osc2.stop(now + 0.6);
    }

    playBossSlam() {
        if (!this.canPlay()) return;
        const now = this.ctx.currentTime;
        this.playBassThud(now);
        this.playFilteredNoise(now, 0.15, 'lowpass', 600, 0.22);
    }

    playBossHurt() {
        if (!this.canPlay()) return;
        const now = this.ctx.currentTime;
        const osc = this.createSource();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(310, now);
        osc.frequency.linearRampToValueAtTime(80, now + 0.32);

        gain.gain.setValueAtTime(0.32, now);
        gain.gain.exponentialRampToValueAtTime(0.005, now + 0.35);

        osc.connect(gain);
        gain.connect(this.output);
        osc.start(now);
        osc.stop(now + 0.35);
    }

    playShockwave() {
        if (!this.canPlay()) return;
        const now = this.ctx.currentTime;
        const osc = this.createSource();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(280, now);
        osc.frequency.exponentialRampToValueAtTime(70, now + 0.22);

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.005, now + 0.24);

        osc.connect(gain);
        gain.connect(this.output);
        osc.start(now);
        osc.stop(now + 0.24);
    }

    playGateSlam() {
        if (!this.canPlay()) return;
        const now = this.ctx.currentTime;
        const osc = this.createSource();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(90, now);
        osc.frequency.exponentialRampToValueAtTime(25, now + 0.3);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.005, now + 0.3);

        osc.connect(gain);
        gain.connect(this.output);
        osc.start(now);
        osc.stop(now + 0.3);
    }

    startBossMusic() {
        this.setTrack('boss');
    }

    stopBossMusic() {
        if (this.track === 'boss') this.setTrack(null);
    }
}

// Global single instance
window.soundEngine = new SoundEngine();
