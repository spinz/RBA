/**
 * Main Phaser Game Scenes (V2 HD Upgrade):
 * - BootScene: Generates all pixel assets
 * - TitleScene: Atmospheric title with glowing moon, animated frog, and fireflies
 * - GameScene: Full platformer gameplay loop with ambient mist and particle spores
 * - VictoryScene: Ending stage celebration with fireworks & trophies
 * - GameOverScene: Retry screen
 */

// --- 1. BOOT SCENE ---
class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    create() {
        // Generate all procedural pixel textures and backgrounds
        window.AssetGenerator.generateAll(this);

        // Global firefly glow animation
        if (!this.anims.exists('firefly_glow')) {
            this.anims.create({
                key: 'firefly_glow',
                frames: this.anims.generateFrameNumbers('firefly', { frames: [0, 1, 2, 3] }),
                frameRate: 6,
                repeat: -1
            });
        }

        this.scene.start('TitleScene');
    }
}

// --- 2. TITLE SCENE ---
class TitleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TitleScene' });
    }

    create() {
        const w = this.scale.width;
        const h = this.scale.height;

        // Multi-Layered Parallax Sky & Forest
        this.add.tileSprite(0, 0, w, h, 'bg_sky').setOrigin(0, 0);
        this.add.tileSprite(0, 100, w, 384, 'bg_trees').setOrigin(0, 0);

        // Drifting mist
        this.mist = this.add.tileSprite(0, h - 160, w, 120, 'mist').setOrigin(0, 0).setAlpha(0.65);

        // Title Box Container
        const titleBox = this.add.container(w / 2, 125);

        const titleShadow = this.add.text(4, 4, "RIBBIT'S\nBIG ADVENTURE", {
            fontFamily: '"Press Start 2P", monospace, sans-serif',
            fontSize: '36px',
            color: '#062d14',
            align: 'center',
            lineSpacing: 14
        }).setOrigin(0.5);

        const titleText = this.add.text(0, 0, "RIBBIT'S\nBIG ADVENTURE", {
            fontFamily: '"Press Start 2P", monospace, sans-serif',
            fontSize: '36px',
            color: '#4ade4a',
            align: 'center',
            stroke: '#022c22',
            strokeThickness: 8,
            lineSpacing: 14
        }).setOrigin(0.5);

        titleBox.add([titleShadow, titleText]);

        // Floating Title Tween
        this.tweens.add({
            targets: titleBox,
            y: 135,
            duration: 1800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Center Animated Frog on Lilypad
        this.add.image(w / 2, 290, 'lilypad').setScale(1.8);
        const frog = this.add.sprite(w / 2, 260, 'frog', 0).setScale(2);

        // Frog throat puff animation
        this.anims.create({
            key: 'title_frog_croak',
            frames: this.anims.generateFrameNumbers('frog', { frames: [0, 1] }),
            frameRate: 2,
            repeat: -1
        });
        frog.play('title_frog_croak');

        // Fireflies floating around
        for (let i = 0; i < 18; i++) {
            const rx = Phaser.Math.Between(40, w - 40);
            const ry = Phaser.Math.Between(40, h - 80);
            const ff = this.add.sprite(rx, ry, 'firefly', 0).setScale(1.3);
            ff.play('firefly_glow');
            this.tweens.add({
                targets: ff,
                y: ry + Phaser.Math.Between(-25, 25),
                x: rx + Phaser.Math.Between(-30, 30),
                duration: Phaser.Math.Between(1800, 3200),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }

        const save = StorageManager.load();
        if (save.highScore > 0) this.add.text(w / 2, 325, `BEST SCORE: ${String(save.highScore).padStart(5, '0')}`, {
            fontFamily: '"Press Start 2P", monospace, sans-serif', fontSize: '12px', color: '#fde047',
            stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5);

        this.menuItems = [];
        const begin = (levelIndex, fresh = false) => {
            window.soundEngine.init();
            const current = fresh ? StorageManager.reset() : StorageManager.load();
            const score = fresh ? 0 : current.run.score;
            const fireflies = fresh ? 0 : current.run.carriedFireflies;
            StorageManager.save({ currentStage: levelIndex, score, fireflies, startOfStageFireflies: fireflies });
            window.soundEngine.startMusic(levelIndex);
            window.soundEngine.playJump();
            this.scene.start('GameScene', { levelIndex, score, fireflies });
        };
        const addMenuItem = (label, y, callback) => {
            const item = this.add.text(w / 2, y, label, {
                fontFamily: '"Press Start 2P", monospace, sans-serif', fontSize: '15px', color: '#fef08a',
                stroke: '#000000', strokeThickness: 3, padding: { left: 12, right: 12, top: 8, bottom: 8 }
            }).setOrigin(0.5).setInteractive({ useHandCursor: true });
            item.on('pointerover', () => item.setColor('#ffffff'));
            item.on('pointerout', () => item.setColor('#fef08a'));
            item.on('pointerdown', callback);
            this.menuItems.push({ item, callback });
        };
        addMenuItem('CONTINUE', 355, () => {
            const current = StorageManager.load();
            begin(Math.min(current.run.currentStage, current.profile.unlockedStage), false);
        });
        addMenuItem('NEW ADVENTURE', 390, () => {
            const current = StorageManager.load();
            const hasProgress = current.profile.unlockedStage > 0 || current.profile.bestScore > 0 || current.profile.bestFireflyCount > 0;
            if (!hasProgress || window.confirm('Start a new adventure and reset your saved progress?')) begin(0, true);
        });
        addMenuItem('STAGE MAP', 425, () => this.showStageMap());
        addMenuItem('SETTINGS', 460, () => this.showSettings());
        this.menuIndex = 0;
        this.updateMenuFocus();
        this.input.keyboard.on('keydown-UP', () => this.moveMenu(-1));
        this.input.keyboard.on('keydown-DOWN', () => this.moveMenu(1));
        this.input.keyboard.on('keydown-ENTER', () => this.menuItems[this.menuIndex].callback());
        this.input.keyboard.on('keydown-SPACE', () => this.menuItems[this.menuIndex].callback());
        this.add.text(w / 2, h - 28, 'ARROWS/WASD: MOVE  |  SPACE: JUMP  |  X / SHIFT: TONGUE', {
            fontFamily: '"Press Start 2P", monospace, sans-serif', fontSize: '10px', color: '#a7f3d0'
        }).setOrigin(0.5);
    }

    moveMenu(delta) {
        this.menuIndex = (this.menuIndex + delta + this.menuItems.length) % this.menuItems.length;
        this.updateMenuFocus();
    }

    updateMenuFocus() {
        this.menuItems.forEach((entry, index) => entry.item.setColor(index === this.menuIndex ? '#ffffff' : '#fef08a'));
    }

    showStageMap() {
        const save = StorageManager.load();
        const levels = window.LevelBuilder.getLevels();
        const panel = this.add.container(this.scale.width / 2, 260).setDepth(20);
        const backdrop = this.add.rectangle(0, 0, 570, 390, 0x022c22, 0.97).setStrokeStyle(3, 0x4ade80, 1);
        panel.add(backdrop);
        panel.add(this.add.text(0, -160, 'STAGE MAP', {
            fontFamily: '"Press Start 2P", monospace, sans-serif', fontSize: '18px', color: '#fef08a'
        }).setOrigin(0.5));
        levels.forEach((level, index) => {
            const unlocked = index <= save.profile.unlockedStage;
            const item = this.add.text(-220, -110 + index * 42, `${unlocked ? '▶' : '🔒'}  ${index + 1}. ${level.name}`, {
                fontFamily: '"Press Start 2P", monospace, sans-serif', fontSize: '12px',
                color: unlocked ? '#d1fae5' : '#64748b', padding: { left: 8, right: 8, top: 6, bottom: 6 }
            });
            if (unlocked) {
                item.setInteractive({ useHandCursor: true });
                item.on('pointerover', () => item.setColor('#ffffff'));
                item.on('pointerout', () => item.setColor('#d1fae5'));
                item.on('pointerdown', () => {
                    StorageManager.save({ currentStage: index });
                    window.soundEngine.init();
                    window.soundEngine.startMusic(index);
                    panel.destroy();
                    this.scene.start('GameScene', { levelIndex: index, score: save.run.score, fireflies: save.run.carriedFireflies });
                });
            }
            panel.add(item);
        });
        panel.add(this.add.text(0, 155, 'SELECT A STAGE  ·  ESC TO CLOSE', {
            fontFamily: '"Press Start 2P", monospace, sans-serif', fontSize: '10px', color: '#86efac'
        }).setOrigin(0.5));
        const close = () => { panel.destroy(); this.input.keyboard.off('keydown-ESC', close); };
        this.input.keyboard.once('keydown-ESC', close);
    }

    showSettings() {
        const save = StorageManager.load();
        const reduced = Boolean(save.profile.settings.reducedMotion);
        const flashing = Boolean(save.profile.settings.reducedFlashing);
        const shake = save.profile.settings.screenShake !== false;
        const muted = Boolean(save.profile.settings.muted);
        const touchOpacity = Number(save.profile.settings.touchOpacity) || 0.55;
        const panel = this.add.text(this.scale.width / 2, 270, `SETTINGS\n\nREDUCED MOTION: ${reduced ? 'ON' : 'OFF'}\nREDUCED FLASHING: ${flashing ? 'ON' : 'OFF'}\nSCREEN SHAKE: ${shake ? 'ON' : 'OFF'}\nSOUND: ${muted ? 'OFF' : 'ON'}\nTOUCH OPACITY: ${Math.round(touchOpacity * 100)}%\n\nR MOTION  F FLASH  S SHAKE\nM SOUND  T TOUCH  ESC CLOSE`, {
            fontFamily: '"Press Start 2P", monospace, sans-serif', fontSize: '12px', color: '#d1fae5',
            backgroundColor: '#022c22', padding: { left: 20, right: 20, top: 16, bottom: 16 }, align: 'center', lineSpacing: 8
        }).setOrigin(0.5).setDepth(20);
        const toggle = () => {
            const next = !Boolean(StorageManager.load().profile.settings.reducedMotion);
            StorageManager.save({ settings: { reducedMotion: next } });
            const current = StorageManager.load().profile.settings;
            panel.setText(this.settingsSummary({ ...current, reducedMotion: next }));
        };
        const soundToggle = () => {
            window.soundEngine.toggleMute();
            panel.setText(this.settingsSummary(StorageManager.load().profile.settings));
        };
        const flashToggle = () => {
            const current = StorageManager.load().profile.settings;
            StorageManager.save({ settings: { reducedFlashing: !current.reducedFlashing } });
            panel.setText(this.settingsSummary(StorageManager.load().profile.settings));
        };
        const shakeToggle = () => {
            const current = StorageManager.load().profile.settings;
            StorageManager.save({ settings: { screenShake: current.screenShake === false } });
            panel.setText(this.settingsSummary(StorageManager.load().profile.settings));
        };
        const touchCycle = () => {
            const current = Number(StorageManager.load().profile.settings.touchOpacity) || 0.55;
            const next = current >= 0.95 ? 0.35 : current + 0.2;
            StorageManager.save({ settings: { touchOpacity: Number(next.toFixed(2)) } });
            panel.setText(this.settingsSummary(StorageManager.load().profile.settings));
        };
        const close = () => {
            panel.destroy();
            this.input.keyboard.off('keydown-R', toggle);
            this.input.keyboard.off('keydown-M', soundToggle);
            this.input.keyboard.off('keydown-F', flashToggle);
            this.input.keyboard.off('keydown-S', shakeToggle);
            this.input.keyboard.off('keydown-T', touchCycle);
        };
        this.input.keyboard.on('keydown-R', toggle);
        this.input.keyboard.on('keydown-M', soundToggle);
        this.input.keyboard.on('keydown-F', flashToggle);
        this.input.keyboard.on('keydown-S', shakeToggle);
        this.input.keyboard.on('keydown-T', touchCycle);
        this.input.keyboard.once('keydown-ESC', close);
    }

    settingsSummary(settings) {
        const touchOpacity = Number(settings.touchOpacity) || 0.55;
        return `SETTINGS\n\nREDUCED MOTION: ${settings.reducedMotion ? 'ON' : 'OFF'}\nREDUCED FLASHING: ${settings.reducedFlashing ? 'ON' : 'OFF'}\nSCREEN SHAKE: ${settings.screenShake === false ? 'OFF' : 'ON'}\nSOUND: ${window.soundEngine.isMuted ? 'OFF' : 'ON'}\nTOUCH OPACITY: ${Math.round(touchOpacity * 100)}%\n\nR MOTION  F FLASH  S SHAKE\nM SOUND  T TOUCH  ESC CLOSE`;
    }

    update() {
        if (this.mist) {
            this.mist.tilePositionX += 0.3;
        }
    }
}

// --- 3. GAME SCENE ---
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    init(data) {
        const urlParams = new URLSearchParams(window.location.search);
        const urlLevel = urlParams.get('level');
        const requestedLevel = Number.parseInt(urlLevel, 10);
        if (!window.__rbaLevelQueryConsumed && urlLevel !== null && Number.isFinite(requestedLevel)) {
            this.levelIndex = Math.max(0, requestedLevel - 1);
            window.__rbaLevelQueryConsumed = true;
        } else {
            this.levelIndex = Math.max(0, Number(data.levelIndex) || 0);
        }
        this.carriedScore = data.score || 0;
        this.carriedFireflies = data.fireflies || 0;
        this.isLevelCompleted = false;
        this.hasTriggeredArena = false;
        this.arenaTransitioning = false;
    }

    create() {
        const levels = window.LevelBuilder.getLevels();
        this.levelIndex = Phaser.Math.Clamp(this.levelIndex, 0, levels.length - 1);
        this.currentLevel = levels[this.levelIndex];
        this.isPaused = false;

        // 1. Build level geometry, hazards, collectibles, enemies
        this.levelElements = window.LevelBuilder.build(this, this.currentLevel);

        // 2. Spawn Player (Depth 10)
        this.player = new window.FrogPlayer(
            this,
            this.currentLevel.playerStart.x,
            this.currentLevel.playerStart.y
        ).setDepth(10);

        // 3. Drifting atmospheric mist across foreground (Depth 12)
        this.ambientMist = this.add.tileSprite(0, this.currentLevel.height - 180, this.scale.width, 140, 'mist')
            .setOrigin(0, 0)
            .setScrollFactor(0)
            .setDepth(12)
            .setAlpha(0.45);

        // 4. Ambient floating swamp spores (Depth 11)
        this.spores = this.add.particles(0, 0, 'sparkle', {
            x: { min: 0, max: this.scale.width },
            y: { min: 0, max: this.scale.height },
            speedX: { min: -15, max: 15 },
            speedY: { min: -10, max: -30 },
            scale: { start: 0.6, end: 0 },
            alpha: { start: 0.6, end: 0 },
            lifespan: 2500,
            frequency: 180,
            quantity: 1
        }).setScrollFactor(0).setDepth(11);

        // 5. Camera setup
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
        this.cameras.main.setDeadzone(60, 40);

        // 6. UI Overlay
        this.ui = new window.GameUI(this);
        this.ui.score = this.carriedScore;
        this.ui.addScore(0);
        this.ui.setFireflies(this.carriedFireflies);
        this.ui.setObjective(
            this.currentLevel.boss ? 'DEFEAT KING CROAKER' : 'REACH THE GOLDEN SHRINE',
            this.currentLevel.fireflies?.length || 0
        );
        this.ui.showLevelBanner(`LEVEL ${this.currentLevel.id}: ${this.currentLevel.name}`);
        this.setupTutorial();

        // 7. Setup Collisions & Triggers
        this.setupCollisions();

        // 8. Setup Inputs
        this.setupInputs();

        this.handleVisibilityChange = () => {
            if (document.hidden && !this.isPaused) this.togglePause(true);
        };
        document.addEventListener('visibilitychange', this.handleVisibilityChange);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        });

        // 9. Event listeners
        this.events.on('add_score', (pts, x, y) => {
            this.ui.addScore(pts);
            this.ui.showScorePopup(x, y, `+${pts}`);
        });

        this.events.on('add_firefly', (x, y) => {
            window.soundEngine.playCoin();
            this.ui.addFirefly();
            this.ui.showScorePopup(x, y, '+50', '#fef08a');
        });

        this.events.on('player_died', () => {
            window.soundEngine.stopBossMusic();
            window.soundEngine.stopMusic();
            this.scene.start('GameOverScene', {
                levelIndex: this.levelIndex,
                score: this.ui.score,
                fireflies: this.carriedFireflies
            });
        });

        // Ensure music is playing for current level
        window.soundEngine.startMusic(this.levelIndex);
    }

    setupInputs() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            space: Phaser.Input.Keyboard.KeyCodes.SPACE,
            x: Phaser.Input.Keyboard.KeyCodes.X,
            shift: Phaser.Input.Keyboard.KeyCodes.SHIFT
        });

        this.prevJumpDown = false;
        this.prevTongueDown = false;
        this.pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
        this.escapeKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    }

    setupTutorial() {
        const flags = StorageManager.load().profile.tutorialFlags;
        this.tutorial = this.levelIndex === 0 && !flags.level1Complete ? { step: 0 } : null;
        if (this.tutorial) this.ui.showTutorialPrompt('MOVE WITH A / D OR THE ARROW KEYS');
    }

    updateTutorial() {
        if (!this.tutorial || !this.player) return;
        const x = this.player.x;
        const prompts = [
            [260, 'PRESS X OR SHIFT TO LASH THE GLOWING FIREFLY'],
            [500, 'HOLD SPACE, W, OR UP TO JUMP HIGHER'],
            [820, 'CROSS WATER WITH SHORT, FORGIVING HOPS'],
            [1120, 'WATCH FOR ENEMIES — TOUCHING ONE COSTS A HEART'],
            [1450, 'OPTIONAL HIGH ROUTE: USE THE SPRING MUSHROOM']
        ];
        while (this.tutorial.step < prompts.length && x >= prompts[this.tutorial.step][0]) {
            this.tutorial.step += 1;
            if (this.tutorial.step < prompts.length) this.ui.showTutorialPrompt(prompts[this.tutorial.step][1]);
        }
        if (this.tutorial.step >= prompts.length) {
            StorageManager.save({ tutorialFlags: { level1Complete: true } });
            this.ui.showTutorialPrompt('TUTORIAL COMPLETE — EXPLORE THE SWAMP!');
            this.tutorial = null;
            this.time.delayedCall(1800, () => this.ui.clearTutorialPrompt());
        }
    }

    togglePause(forcePaused) {
        const shouldPause = typeof forcePaused === 'boolean' ? forcePaused : !this.isPaused;
        if (shouldPause === this.isPaused) return;

        this.isPaused = shouldPause;
        if (shouldPause) {
            this.physics.world.pause();
            this.tweens.pauseAll();
            this.time.paused = true;
        } else {
            this.physics.world.resume();
            this.tweens.resumeAll();
            this.time.paused = false;
        }
        this.ui.setPaused(shouldPause);
    }

    setupCollisions() {
        const { platforms, lilypads, mushrooms, waterGroup, firefliesGroup, lotusGroup, goal, beetles, mosquitoes, boss, arenaGate } = this.levelElements;

        // Player vs Solid Platforms & Lilypads
        this.physics.add.collider(this.player, platforms);
        if (lilypads) this.physics.add.collider(this.player, lilypads);

        // Player vs Arena Gate
        if (arenaGate) {
            this.physics.add.collider(this.player, arenaGate);
        }

        // Beetles vs Platforms
        beetles.forEach(b => {
            this.physics.add.collider(b, platforms);
        });

        // Player vs Bouncy Spring Mushrooms
        if (mushrooms) {
            this.physics.add.overlap(this.player, mushrooms, (player, shroom) => {
                if (player.body.velocity.y > 0 && player.y < shroom.y) {
                    player.bounceOffMushroom();
                    this.tweens.add({
                        targets: shroom,
                        scaleY: 0.6,
                        duration: 100,
                        yoyo: true,
                        ease: 'Quad.easeInOut'
                    });
                }
            });
        }

        // Player vs Water
        this.physics.add.overlap(this.player, waterGroup, (player, water) => {
            if (player.y > water.y - 6) {
                const splash = this.add.particles(player.x, water.y, 'water_drop', {
                    speed: { min: 40, max: 120 },
                    angle: { min: 220, max: 320 },
                    lifespan: 300,
                    quantity: 6
                });
                this.time.delayedCall(350, () => splash.destroy());
                player.takeDamage(1);
                player.body.setVelocityY(-350);
            }
        });

        // Player vs Fireflies
        this.physics.add.overlap(this.player, firefliesGroup, (player, item) => {
            if (item.onSwallowed) item.onSwallowed(player);
        });

        // Tongue Tip vs Fireflies
        this.physics.add.overlap(this.player.tongueTip, firefliesGroup, (tip, item) => {
            if (this.player.tongueActive) this.player.grabObject(item);
        });

        // Player vs Golden Lotus
        this.physics.add.overlap(this.player, lotusGroup, (player, item) => {
            if (item.onSwallowed) item.onSwallowed(player);
        });

        // Tongue Tip vs Golden Lotus
        this.physics.add.overlap(this.player.tongueTip, lotusGroup, (tip, item) => {
            if (this.player.tongueActive) this.player.grabObject(item);
        });

        // Player vs Goal Shrine (if unlocked)
        if (goal) {
            this.physics.add.overlap(this.player, goal, () => {
                this.completeLevel();
            });
        }

        // Player vs Beetles
        beetles.forEach(beetle => {
            this.physics.add.overlap(this.player, beetle, (player, b) => {
                if (b.isDefeated) return;

                if (player.starPower) {
                    b.starDefeat();
                } else if (player.body.velocity.y > 0 && player.bottom <= b.y + 12) {
                    b.squash(player);
                } else {
                    player.takeDamage(1);
                    this.ui.updateHealth(player.hp);
                }
            });

            // Tongue Tip vs Beetle
            this.physics.add.overlap(this.player.tongueTip, beetle, (tip, b) => {
                if (this.player.tongueActive && !b.isDefeated) {
                    this.player.grabObject(b);
                }
            });
        });

        // Player vs Mosquitoes
        mosquitoes.forEach(mosquito => {
            this.physics.add.overlap(this.player, mosquito, (player, m) => {
                if (m.isDefeated) return;

                if (player.starPower) {
                    m.starDefeat();
                } else if (player.body.velocity.y > 0 && player.bottom <= m.y + 8) {
                    m.squash(player);
                } else {
                    player.takeDamage(1);
                    this.ui.updateHealth(player.hp);
                }
            });

            // Tongue Tip vs Mosquito
            this.physics.add.overlap(this.player.tongueTip, mosquito, (tip, m) => {
                if (this.player.tongueActive && !m.isDefeated) {
                    this.player.grabObject(m);
                }
            });
        });

        // Boss Collisions & Interactions
        if (boss) {
            this.physics.add.collider(boss, platforms);

            // Player vs Boss Body / Stomp
            this.physics.add.overlap(this.player, boss, (player, b) => {
                if (b.state === 'DEFEATED' || b.state === 'WAITING') return;

                const isFalling = player.body.velocity.y > 0;
                const isAboveCrown = player.bottom <= b.y + 16;

                if (player.starPower) {
                    b.takeStompDamage(player);
                } else if (isFalling && isAboveCrown) {
                    b.takeStompDamage(player);
                } else if (!b.isInvincible && b.state !== 'HURT') {
                    player.takeDamage(1);
                    this.ui.updateHealth(player.hp);
                }
            });

            // Tongue Tip vs Boss (Tongue Whip Damage!)
            this.physics.add.overlap(this.player.tongueTip, boss, (tip, b) => {
                if (this.player.tongueActive) b.takeTongueDamage(this.player);
            });

            // Player Spat Projectiles vs Boss
            this.events.on('player_shot_spitball', (spitball) => {
                this.physics.add.overlap(spitball, boss, (sb, b) => {
                    b.takeSpitballDamage(sb);
                });
            });

            // Player vs Shockwaves
            this.physics.add.overlap(this.player, boss.shockwaves, (player, sw) => {
                if (player.isInvincible || player.isDead) return;
                player.takeDamage(1);
                this.ui.updateHealth(player.hp);
            });

            // Player vs Venom Balls
            this.physics.add.overlap(this.player, boss.venomBalls, (player, vb) => {
                if (player.isInvincible || player.isDead) return;
                player.takeDamage(1);
                this.ui.updateHealth(player.hp);
                vb.destroy();
            });

            // Tongue Tip vs Venom Balls (Catch & eat!)
            this.physics.add.overlap(this.player.tongueTip, boss.venomBalls, (tip, vb) => {
                if (this.player.tongueActive) this.player.grabObject(vb);
            });

            // Venom balls bounce on platforms
            this.physics.add.collider(boss.venomBalls, platforms);
        }
    }

    triggerBossArena() {
        if (this.hasTriggeredArena) return;
        this.hasTriggeredArena = true;
        this.arenaTransitioning = true;
        this.player.body.setVelocity(0, 0);

        // Restore player health to 3 hearts for the showdown
        if (this.player && !this.player.isDead) {
            this.player.hp = 3;
            this.ui.updateHealth(3);
            this.ui.showScorePopup(this.player.x, this.player.y - 25, 'HEALTH RESTORED!', '#4ade80');
        }

        const gate = this.levelElements.arenaGate;
        if (gate) {
            gate.setVisible(true);
            gate.body.enable = false;
            gate.y = this.currentLevel.arenaGate.y - 120;
            this.tweens.add({
                targets: gate,
                y: this.currentLevel.arenaGate.y,
                duration: 650,
                ease: 'Bounce.easeOut',
                onComplete: () => {
                    gate.body.enable = true;
                    this.arenaTransitioning = false;
                    window.soundEngine.playGateSlam();
                    window.rbaCameraShake(this.cameras.main, 260, 0.02);
                    this.ui.showLevelBanner('KING CROAKER APPROACHES!');
                }
            });
        } else {
            this.arenaTransitioning = false;
        }

        // Lock camera to arena after the gate closes so the transition does not
        // snap the player into the boss room before the barrier is visible.
        const bounds = this.currentLevel.arenaBounds;
        if (bounds) {
            this.time.delayedCall(650, () => {
                this.cameras.main.setBounds(bounds.x, bounds.y, bounds.width, bounds.height);
            });
        }

        // Boss HUD and encounter begin only after the gate has finished closing.
        const startBossEncounter = () => {
            this.ui.createBossHealthBar('KING CROAKER', this.levelElements.boss ? this.levelElements.boss.maxHp : 6);
            this.ui.showLevelBanner('BOSS: KING CROAKER');
            window.soundEngine.startBossMusic();
            if (this.levelElements.boss) this.levelElements.boss.activateEncounter();
        };
        this.time.delayedCall(gate ? 700 : 0, startBossEncounter);
    }

    spawnVictoryLotus(x, y) {
        const lotus = this.physics.add.sprite(x, y, 'golden_lotus').setDepth(15).setScale(1.6);
        lotus.body.setAllowGravity(false);

        // Halo sparkles
        this.tweens.add({
            targets: lotus,
            y: y - 16,
            duration: 850,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        const prompt = this.add.text(x, y - 40, 'CLAIM THE GOLDEN LOTUS!', {
            fontFamily: '"Press Start 2P", monospace, sans-serif',
            fontSize: '11px',
            color: '#fef08a',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(16);

        this.tweens.add({
            targets: prompt,
            alpha: 0.3,
            duration: 500,
            yoyo: true,
            repeat: -1
        });

        this.physics.add.overlap(this.player, lotus, () => {
            lotus.destroy();
            prompt.destroy();
            this.completeLevel();
        });

        this.physics.add.overlap(this.player.tongueTip, lotus, () => {
            lotus.destroy();
            prompt.destroy();
            this.completeLevel();
        });
    }

    completeLevel() {
        if (this.isLevelCompleted) return;
        this.isLevelCompleted = true;

        this.player.body.setVelocity(0, 0);
        this.player.body.enable = false;
        window.soundEngine.stopBossMusic();
        window.soundEngine.stopMusic();
        window.soundEngine.playWin();

        this.ui.showLevelBanner('STAGE CLEAR!');

        // Sparkle fireworks celebration
        const winParticles = this.add.particles(this.player.x, this.player.y - 20, 'sparkle', {
            speed: { min: 80, max: 240 },
            angle: { min: 0, max: 360 },
            scale: { start: 1.6, end: 0 },
            lifespan: 650,
            quantity: 40
        });

        this.time.delayedCall(2200, () => {
            const nextLevel = this.levelIndex + 1;
            StorageManager.save({
                currentStage: nextLevel,
                unlockedStage: nextLevel,
                score: this.ui.score + 1000,
                fireflies: this.ui.fireflies,
                startOfStageFireflies: this.ui.fireflies
            });

            const levels = window.LevelBuilder.getLevels();
            if (nextLevel < levels.length) {
                this.scene.start('GameScene', {
                    levelIndex: nextLevel,
                    score: this.ui.score + 1000,
                    fireflies: this.ui.fireflies
                });
            } else {
                this.scene.start('VictoryScene', {
                    score: this.ui.score + 5000,
                    fireflies: this.ui.fireflies
                });
            }
        });
    }

    update(time, delta) {
        if (
            Phaser.Input.Keyboard.JustDown(this.pauseKey) ||
            Phaser.Input.Keyboard.JustDown(this.escapeKey)
        ) {
            this.togglePause();
            return;
        }

        if (this.isPaused) return;

        // Collect keyboard + touch inputs
        const touch = this.ui.touchInputs;

        const left = this.cursors.left.isDown || this.wasd.left.isDown || touch.left;
        const right = this.cursors.right.isDown || this.wasd.right.isDown || touch.right;
        const up = this.cursors.up.isDown || this.wasd.up.isDown;

        const jumpDown = this.cursors.space.isDown || this.wasd.space.isDown || this.cursors.up.isDown || this.wasd.up.isDown || touch.jump;
        const jumpJustPressed = jumpDown && !this.prevJumpDown;
        const jumpReleased = !jumpDown && this.prevJumpDown;
        this.prevJumpDown = jumpDown;

        const tongueDown = this.wasd.x.isDown || this.wasd.shift.isDown || touch.tongue;
        const tongueJustPressed = tongueDown && !this.prevTongueDown;
        this.prevTongueDown = tongueDown;

        const inputs = {
            left,
            right,
            up,
            jumpDown,
            jumpJustPressed,
            jumpReleased,
            tongueJustPressed
        };

        this.updateTutorial();

        // Check Arena Gate Trigger
        if (!this.hasTriggeredArena && this.currentLevel.arenaGate) {
            if (this.player.x >= this.currentLevel.arenaGate.triggerX) {
                this.triggerBossArena();
            }
        }

        // Update player
        const effectiveInputs = this.arenaTransitioning ? {
            left: false, right: false, up: false, jumpDown: false,
            jumpJustPressed: false, jumpReleased: false, tongueJustPressed: false
        } : inputs;
        this.player.update(time, delta, effectiveInputs);

        // Update enemies
        this.levelElements.beetles.forEach(b => b.update());
        this.levelElements.mosquitoes.forEach(m => m.update(time));

        // Update Boss
        if (this.levelElements.boss) {
            this.levelElements.boss.update(time, delta);
        }

        // Drift atmospheric mist
        if (this.ambientMist) {
            this.ambientMist.tilePositionX += 0.35;
        }
    }
}

// --- 4. VICTORY SCENE ---
class VictoryScene extends Phaser.Scene {
    constructor() {
        super({ key: 'VictoryScene' });
    }

    init(data) {
        this.finalScore = data.score || 0;
        this.finalFlies = data.fireflies || 0;
    }

    create() {
        const w = this.scale.width;
        const h = this.scale.height;

        this.add.tileSprite(0, 0, w, h, 'bg_sky').setOrigin(0, 0);

        this.add.text(w / 2, 70, 'CONGRATULATIONS!', {
            fontFamily: '"Press Start 2P", monospace, sans-serif',
            fontSize: '28px',
            color: '#fde047',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        this.add.text(w / 2, 115, 'YOU FOUND THE GOLDEN LOTUS!', {
            fontFamily: '"Press Start 2P", monospace, sans-serif',
            fontSize: '14px',
            color: '#86efac'
        }).setOrigin(0.5);

        this.add.image(w / 2, 230, 'lilypad').setScale(2.2);
        this.add.image(w / 2, 175, 'golden_lotus').setScale(2);
        this.add.sprite(w / 2, 200, 'frog', 0).setScale(2);

        this.time.addEvent({
            delay: 350,
            repeat: -1,
            callback: () => {
                const rx = Phaser.Math.Between(100, w - 100);
                const ry = Phaser.Math.Between(50, 250);
                const p = this.add.particles(rx, ry, 'sparkle', {
                    speed: { min: 50, max: 140 },
                    lifespan: 500,
                    quantity: 14
                });
                this.time.delayedCall(600, () => p.destroy());
            }
        });

        const card = this.add.graphics();
        card.fillStyle(0x022c22, 0.85);
        card.fillRoundedRect(w / 2 - 180, 260, 360, 100, 10);

        const prev = StorageManager.load();
        const isNewHigh = this.finalScore > prev.highScore;
        const updated = StorageManager.save({ score: this.finalScore, unlockedStage: 4, fireflies: this.finalFlies });

        this.add.text(w / 2, 280, `FINAL SCORE: ${String(this.finalScore).padStart(5, '0')}`, {
            fontFamily: '"Press Start 2P", monospace, sans-serif',
            fontSize: '14px',
            color: '#ffffff'
        }).setOrigin(0.5);

        if (isNewHigh) {
            this.add.text(w / 2, 303, 'NEW HIGH SCORE RECORD!', {
                fontFamily: '"Press Start 2P", monospace, sans-serif',
                fontSize: '11px',
                color: '#fde047'
            }).setOrigin(0.5);
        }

        this.add.text(w / 2, 328, `FIREFLIES CAUGHT: ${this.finalFlies}`, {
            fontFamily: '"Press Start 2P", monospace, sans-serif',
            fontSize: '13px',
            color: '#fef08a'
        }).setOrigin(0.5);

        const restartBtn = this.add.text(w / 2, 400, 'PRESS SPACE TO PLAY AGAIN', {
            fontFamily: '"Press Start 2P", monospace, sans-serif',
            fontSize: '14px',
            color: '#6ee7b7'
        }).setOrigin(0.5);

        this.tweens.add({
            targets: restartBtn,
            alpha: 0.3,
            duration: 600,
            yoyo: true,
            repeat: -1
        });

        const replay = () => {
            this.scene.start('GameScene', { levelIndex: 0, score: 0, fireflies: 0 });
        };
        this.input.keyboard.once('keydown-SPACE', replay);
        this.input.once('pointerdown', replay);
    }
}

// --- 5. GAME OVER SCENE ---
class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    init(data) {
        this.levelIndex = data.levelIndex || 0;
        this.score = data.score || 0;
        this.fireflies = data.fireflies || 0;
    }

    create() {
        const w = this.scale.width;
        const h = this.scale.height;

        this.cameras.main.setBackgroundColor('#09090b');

        this.add.text(w / 2, 125, 'GAME OVER', {
            fontFamily: '"Press Start 2P", monospace, sans-serif',
            fontSize: '36px',
            color: '#ef4444',
            stroke: '#7f1d1d',
            strokeThickness: 6
        }).setOrigin(0.5);

        this.add.sprite(w / 2, 205, 'frog', 6).setScale(2.5); // Hurt frog

        const prev = StorageManager.load();
        const isNewHigh = this.score > prev.highScore;
        const updated = StorageManager.updateHighScore(this.score);

        this.add.text(w / 2, 275, `SCORE: ${String(this.score).padStart(5, '0')}`, {
            fontFamily: '"Press Start 2P", monospace, sans-serif',
            fontSize: '15px',
            color: '#94a3b8'
        }).setOrigin(0.5);

        this.add.text(w / 2, 305, isNewHigh ? 'NEW HIGH SCORE!' : `BEST: ${String(updated.highScore).padStart(5, '0')}`, {
            fontFamily: '"Press Start 2P", monospace, sans-serif',
            fontSize: '12px',
            color: isNewHigh ? '#fde047' : '#64748b'
        }).setOrigin(0.5);

        const prompt = this.add.text(w / 2, 350, 'PRESS SPACE OR TAP TO RETRY', {
            fontFamily: '"Press Start 2P", monospace, sans-serif',
            fontSize: '14px',
            color: '#fef08a'
        }).setOrigin(0.5);

        this.tweens.add({
            targets: prompt,
            alpha: 0.3,
            duration: 600,
            yoyo: true,
            repeat: -1
        });

        const retry = () => {
            this.scene.start('GameScene', {
                levelIndex: this.levelIndex,
                score: 0,
                fireflies: this.fireflies
            });
        };

        this.input.keyboard.once('keydown-SPACE', retry);
        this.input.once('pointerdown', retry);
    }
}

// Game Configuration
const config = {
    type: Phaser.AUTO,
    width: 960,
    height: 540,
    parent: 'game-canvas-container',
    pixelArt: true,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: window.RbaPhysics.gravity },
            debug: false
        }
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [BootScene, TitleScene, GameScene, VictoryScene, GameOverScene]
};

function startGame() {
    window.game = new Phaser.Game(config);
}

if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', startGame, { once: true });
} else {
    startGame();
}
