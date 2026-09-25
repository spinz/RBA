/**
 * Main Phaser Game Scenes (V2 HD Upgrade):
 * - BootScene: Generates all pixel assets
 * - TitleScene: Atmospheric title with glowing moon, animated frog, and fireflies
 * - GameScene: Full platformer gameplay loop with ambient mist and particle spores
 * - VictoryScene: Ending stage celebration with fireworks & trophies
 * - GameOverScene: Retry screen
 */

// CSS-sized actions stay tappable when the canvas is scaled down on a phone.
function createSceneActions(scene, actions, label = 'End screen actions') {
    const panel = document.createElement('nav');
    panel.className = 'scene-actions';
    panel.setAttribute('aria-label', label);
    for (const [label, action] of actions) {
        const button = document.createElement('button');
        button.textContent = label;
        button.addEventListener('click', action);
        button.addEventListener('keydown', event => event.stopPropagation());
        button.addEventListener('keyup', event => event.stopPropagation());
        panel.append(button);
    }
    document.getElementById('game-wrapper').append(panel);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => panel.remove());
    return panel;
}

// --- 1. BOOT SCENE ---
class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    create() {
        // Generate all procedural pixel textures and backgrounds
        window.AssetGenerator.generateAll(this);
        window.Powerups.generateTextures(this);
        window.DepthEnemies.generateTextures(this);

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
        this.reducedMotion = Boolean(StorageManager.load().profile.settings.reducedMotion);
        window.soundEngine.setPaused(false);
        window.soundEngine.setTrack('title');
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
        if (!this.reducedMotion) this.tweens.add({
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
        if (!this.anims.exists('title_frog_croak')) this.anims.create({
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
            if (!this.reducedMotion) this.tweens.add({
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
            const current = fresh ? StorageManager.newRun() : StorageManager.load();
            if (!fresh && current.run.completed) {
                this.scene.start('VictoryScene', { score: current.run.score, fireflies: current.run.carriedFireflies });
                return;
            }
            const score = fresh ? 0 : current.run.score;
            const fireflies = fresh ? 0 : current.run.carriedFireflies;
            StorageManager.save({ currentStage: levelIndex, score, fireflies, startOfStageScore: score, startOfStageFireflies: fireflies });
            window.soundEngine.startMusic(levelIndex);
            window.soundEngine.playJump();
            this.scene.start('GameScene', { levelIndex, score, fireflies, stageStartScore: score, stageStartFireflies: fireflies });
        };
        const addMenuItem = (label, y, callback) => {
            const item = this.add.text(w / 2, y, label, {
                fontFamily: '"Press Start 2P", monospace, sans-serif', fontSize: '15px', color: '#fef08a',
                stroke: '#000000', strokeThickness: 3, padding: { left: 12, right: 12, top: 8, bottom: 8 }
            }).setOrigin(0.5).setInteractive({ useHandCursor: true });
            item.on('pointerover', () => item.setColor('#ffffff'));
            item.on('pointerout', () => item.setColor('#fef08a'));
            item.on('pointerdown', pointer => {
                window.__rbaTouchUsed = Boolean(window.__rbaTouchUsed || pointer.wasTouch);
                callback();
            });
            this.menuItems.push({ item, callback });
        };
        addMenuItem('CONTINUE', 355, () => {
            const current = StorageManager.load();
            begin(Math.min(current.run.currentStage, current.profile.unlockedStage), false);
        });
        addMenuItem('NEW ADVENTURE', 390, () => {
            const current = StorageManager.load();
            const hasProgress = current.run.currentStage > 0 || current.run.score > 0;
            if (!hasProgress || window.confirm('Start a new adventure? Your records, unlocked stages and settings will be kept.')) begin(0, true);
        });
        addMenuItem('STAGE MAP', 425, () => this.showStageMap());
        addMenuItem('SETTINGS', 460, () => this.showSettings());
        const touchMenu = window.__rbaTouchUsed || window.matchMedia('(any-pointer: coarse)').matches || navigator.maxTouchPoints > 0;
        if (touchMenu) {
            this.menuItems.forEach(entry => entry.item.setVisible(false));
            const labels = ['Continue', 'New adventure', 'Stage map', 'Settings'];
            createSceneActions(this, this.menuItems.map((entry, i) => [labels[i], entry.callback]), 'Main menu')
                .classList.add('scene-actions--menu');
        }
        this.menuIndex = 0;
        this.updateMenuFocus();
        this.input.keyboard.on('keydown-UP', () => this.moveMenu(-1));
        this.input.keyboard.on('keydown-DOWN', () => this.moveMenu(1));
        this.input.keyboard.on('keydown-ENTER', () => { if (!this.menuDialog?.open) this.menuItems[this.menuIndex].callback(); });
        this.input.keyboard.on('keydown-SPACE', () => { if (!this.menuDialog?.open) this.menuItems[this.menuIndex].callback(); });
        this.add.text(w / 2, h - 28, 'ARROWS/WASD: MOVE  |  SPACE: JUMP  |  X / SHIFT: TONGUE', {
            fontFamily: '"Press Start 2P", monospace, sans-serif', fontSize: '10px', color: '#a7f3d0'
        }).setOrigin(0.5).setVisible(!touchMenu);
    }

    moveMenu(delta) {
        if (this.menuDialog?.open) return;
        this.menuIndex = (this.menuIndex + delta + this.menuItems.length) % this.menuItems.length;
        this.updateMenuFocus();
    }

    updateMenuFocus() {
        this.menuItems.forEach((entry, index) => entry.item.setColor(index === this.menuIndex ? '#ffffff' : '#fef08a'));
    }

    openDialog(title) {
        if (this.menuDialog?.open) return null;
        const dialog = document.createElement('dialog');
        dialog.className = 'game-dialog';
        const heading = document.createElement('h2');
        heading.id = 'game-dialog-title';
        heading.textContent = title;
        heading.tabIndex = -1;
        dialog.setAttribute('aria-labelledby', heading.id);
        dialog.append(heading);
        const close = document.createElement('button');
        close.textContent = 'Back to menu';
        close.addEventListener('click', () => dialog.close());
        dialog.append(close);
        dialog.addEventListener('keydown', event => event.stopPropagation());
        dialog.addEventListener('keyup', event => event.stopPropagation());
        const cleanup = () => {
            dialog.remove();
            this.menuDialog = null;
            this.input.keyboard.resetKeys();
        };
        dialog.addEventListener('close', cleanup, { once: true });
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => dialog.remove());
        document.getElementById('game-wrapper').append(dialog);
        this.menuDialog = dialog;
        dialog.showModal();
        heading.focus();
        return { dialog, close };
    }

    showStageMap() {
        const panel = this.openDialog('Stage map');
        if (!panel) return;
        const save = StorageManager.load();
        window.LevelBuilder.getLevels().forEach((level, index) => {
            const button = document.createElement('button');
            button.disabled = index > save.profile.unlockedStage;
            button.textContent = `${index + 1}. ${level.name}${button.disabled ? ' — Locked' : ''}`;
            button.addEventListener('click', () => {
                panel.dialog.close();
                window.soundEngine.init();
                // Stage selection starts a standalone attempt, without importing
                // points from a later stage into an earlier one.
                this.scene.start('GameScene', { levelIndex: index, score: 0, fireflies: 0 });
            });
            panel.dialog.insertBefore(button, panel.close);
        });
    }

    showSettings() {
        const panel = this.openDialog('Settings');
        if (!panel) return;
        const settings = StorageManager.load().profile.settings;
        for (const [key, label, initial] of [
            ['reducedMotion', 'Reduced motion', settings.reducedMotion],
            ['reducedFlashing', 'Reduced flashing', settings.reducedFlashing],
            ['screenShake', 'Screen shake', settings.screenShake !== false],
            ['muted', 'Mute audio', window.soundEngine.isMuted]
        ]) {
            const row = document.createElement('label');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = Boolean(initial);
            checkbox.addEventListener('change', () => {
                StorageManager.save({ settings: { [key]: checkbox.checked } });
                if (key === 'muted') window.soundEngine.setMuted(checkbox.checked);
                if (key === 'reducedMotion') {
                    this.reducedMotion = checkbox.checked;
                    if (this.reducedMotion) this.tweens.pauseAll();
                    else this.tweens.resumeAll();
                }
            });
            row.append(checkbox, document.createTextNode(label));
            panel.dialog.insertBefore(row, panel.close);
        }
        const row = document.createElement('label');
        row.textContent = 'Touch control opacity ';
        const opacity = document.createElement('input');
        opacity.type = 'range';
        opacity.min = '0.35';
        opacity.max = '0.95';
        opacity.step = '0.1';
        opacity.value = String(settings.touchOpacity || 0.55);
        opacity.setAttribute('aria-label', 'Touch control opacity');
        opacity.addEventListener('input', () => StorageManager.save({ settings: { touchOpacity: Number(opacity.value) } }));
        row.append(opacity);
        panel.dialog.insertBefore(row, panel.close);
    }

    update() {
        if (this.mist && !this.reducedMotion) {
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
        this.stageStartScore = Math.max(0, Number(data.stageStartScore ?? this.carriedScore) || 0);
        this.stageStartFireflies = Math.max(0, Number(data.stageStartFireflies ?? this.carriedFireflies) || 0);
        this.isLevelCompleted = false;
        this.hasTriggeredArena = false;
        this.arenaTransitioning = false;
    }

    create() {
        const levels = window.LevelBuilder.getLevels();
        this.levelIndex = Phaser.Math.Clamp(this.levelIndex, 0, levels.length - 1);
        this.currentLevel = levels[this.levelIndex];
        this.isPaused = false;
        this.time.paused = false;
        this.physics.world.resume();
        window.soundEngine.setPaused(false);
        this.victoryLotus = null;
        this.bossDefeated = false;
        StorageManager.save({ completed: false, currentStage: this.levelIndex, score: this.stageStartScore,
            fireflies: this.stageStartFireflies, startOfStageScore: this.stageStartScore,
            startOfStageFireflies: this.stageStartFireflies });

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
            this.currentLevel.objective || (this.currentLevel.boss ? 'DEFEAT KING CROAKER' : 'REACH THE GOLDEN SHRINE'),
            this.currentLevel.fireflies?.length || 0
        );
        this.ui.showLevelBanner(`LEVEL ${this.currentLevel.id}: ${this.currentLevel.name}`);
        this.setupTutorial();

        // 7. Setup Collisions & Triggers
        this.setupCollisions();
        this.depthGameplay = new window.GameplayDepth(this);

        // 8. Setup Inputs
        this.setupInputs();

        this.handleVisibilityChange = () => {
            if (document.hidden && !this.isPaused) this.togglePause(true);
        };
        document.addEventListener('visibilitychange', this.handleVisibilityChange);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            document.removeEventListener('visibilitychange', this.handleVisibilityChange);
            for (const event of ['add_score', 'add_firefly', 'player_died']) this.events.removeAllListeners(event);
            window.soundEngine.setTrack(null);
            window.soundEngine.setPaused(false);
        });

        // 9. Event listeners
        this.events.on('add_score', (pts, x, y, showPopup = true) => {
            this.ui.addScore(pts);
            if (showPopup) this.ui.showScorePopup(x, y, `+${pts}`);
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
                fireflies: this.stageStartFireflies,
                stageStartScore: this.stageStartScore
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
        this.restartKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    }

    restartStage() {
        if (this.isLevelCompleted || this.arenaTransitioning || this.player.isDead) return;
        if (this.isPaused) this.togglePause(false);
        this.ui.announce('Restarting stage');
        window.soundEngine.stopBossMusic();
        window.soundEngine.stopMusic();
        StorageManager.save({
            currentStage: this.levelIndex,
            score: this.stageStartScore,
            fireflies: this.stageStartFireflies,
            startOfStageScore: this.stageStartScore,
            startOfStageFireflies: this.stageStartFireflies
        });
        this.scene.restart({
            levelIndex: this.levelIndex,
            score: this.stageStartScore,
            fireflies: this.stageStartFireflies,
            stageStartScore: this.stageStartScore,
            stageStartFireflies: this.stageStartFireflies
        });
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
            this.ui.showTutorialPrompt(prompts[this.tutorial.step][1]);
            this.tutorial.step += 1;
        }
        if (this.tutorial.step >= prompts.length && x >= 1800) {
            StorageManager.save({ tutorialFlags: { level1Complete: true } });
            this.ui.showTutorialPrompt('TUTORIAL COMPLETE — EXPLORE THE SWAMP!');
            this.tutorial = null;
            this.time.delayedCall(1800, () => this.ui.clearTutorialPrompt());
        }
    }

    togglePause(forcePaused) {
        if (this.isLevelCompleted || this.player.isDead) return;
        const shouldPause = typeof forcePaused === 'boolean' ? forcePaused : !this.isPaused;
        if (shouldPause === this.isPaused) return;

        this.isPaused = shouldPause;
        this.player.setPowerupsPaused(shouldPause);
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
        window.soundEngine.setPaused(shouldPause);
    }

    setupCollisions() {
        const { platforms, lilypads, mushrooms, waterGroup, firefliesGroup, lotusGroup, goal, beetles, mosquitoes, boss, arenaGate } = this.levelElements;
        // Returned seeds are a normal campaign ability, not boss-only plumbing.
        this.spitballs = this.physics.add.group({ allowGravity: false });

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
                    emitting: false,
                    speed: { min: 40, max: 120 },
                    angle: { min: 220, max: 320 },
                    lifespan: 300,
                    quantity: 6
                });
                splash.explode(6);
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
                } else if (player.body.velocity.y > 0 && player.body.bottom <= b.body.top + 16) {
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
                } else if (player.body.velocity.y > 0 && player.body.bottom <= m.body.top + 16) {
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
                const isAboveCrown = player.body.bottom <= b.body.top + 20;

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
            // Arcade normalizes sprite-vs-group callbacks to sprite first.
            this.physics.add.overlap(boss, this.spitballs, (b, sb) => b.takeSpitballDamage(sb));

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
        this.ui.clearTutorialPrompt();
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
                }
            });
        } else {
            this.arenaTransitioning = false;
        }

        // Lock camera to arena after the gate closes so the transition does not
        // snap the player into the boss room before the barrier is visible.
        const bounds = this.currentLevel.arenaBounds;
        if (bounds) {
            this.cameras.main.stopFollow();
            if (!this.ui.reducedMotion) this.cameras.main.pan(bounds.x + this.scale.width / 2, bounds.y + bounds.height / 2, 650, 'Sine.easeInOut');
            this.time.delayedCall(650, () => {
                this.cameras.main.setBounds(bounds.x, bounds.y, bounds.width, bounds.height);
                this.cameras.main.startFollow(this.player, true, 0.04, 0.04);
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
        if (this.victoryLotus || this.isLevelCompleted) return;
        // Keep the reward in view, even for a distant projectile kill.
        const camera = this.cameras.main;
        x = Phaser.Math.Clamp(x, camera.scrollX + 100, camera.scrollX + camera.width - 100);
        y = Phaser.Math.Clamp(y, camera.scrollY + 150, camera.scrollY + camera.height - 70);
        const lotus = this.physics.add.sprite(x, y, 'golden_lotus').setDepth(15).setScale(1.6);
        this.victoryLotus = lotus;
        lotus.body.setAllowGravity(false);
        this.ui.updateObjective('CROAKER DEFEATED — NEXT: FIREFLY MARSH');

        // Halo sparkles
        if (!this.ui.reducedMotion) this.tweens.add({
            targets: lotus,
            y: y - 16,
            duration: 850,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        const prompt = this.add.text(x, y - 40, 'GOLDEN LOTUS RECOVERED!', {
            fontFamily: '"Press Start 2P", monospace, sans-serif',
            fontSize: '11px',
            color: '#fef08a',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(16);

        if (!this.ui.reducedMotion) this.tweens.add({
            targets: prompt,
            alpha: 0.3,
            duration: 500,
            yoyo: true,
            repeat: -1
        });

        const claim = () => {
            if (!lotus.active || this.player.isDead || this.isLevelCompleted) return;
            this.tweens.killTweensOf([lotus, prompt]);
            lotus.destroy();
            prompt.destroy();
            this.completeLevel();
        };
        this.physics.add.overlap(this.player, lotus, claim);
        this.physics.add.overlap(this.player.tongueTip, lotus, claim,
            () => this.player.tongueActive && !this.player.isDead);
        // Progression must not depend on finding a small collectible after combat.
        this.time.delayedCall(2000, claim);
    }

    completeLevel() {
        if (this.isLevelCompleted || this.player.isDead) return;
        this.isLevelCompleted = true;

        this.player.body.setVelocity(0, 0);
        this.player.body.enable = false;
        this.player.tongueTip.body.enable = false;
        this.ui.clearTutorialPrompt();
        window.soundEngine.stopBossMusic();
        window.soundEngine.stopMusic();
        window.soundEngine.playWin();

        const nextName = window.LevelBuilder.getLevels()[this.levelIndex + 1]?.name;
        this.ui.showLevelBanner(nextName ? `STAGE CLEAR!\nNEXT: ${nextName}` : 'ADVENTURE COMPLETE!');

        // Sparkle fireworks celebration
        const winParticles = this.add.particles(this.player.x, this.player.y - 20, 'sparkle', {
            emitting: false,
            speed: { min: 80, max: 240 },
            angle: { min: 0, max: 360 },
            scale: { start: 1.6, end: 0 },
            lifespan: 650,
            quantity: 40
        });
        winParticles.explode(this.ui.reducedMotion ? 8 : 40);

        this.time.delayedCall(2200, () => {
            const nextLevel = this.levelIndex + 1;
            StorageManager.save({
                currentStage: Math.min(nextLevel, window.LevelBuilder.getLevels().length - 1),
                unlockedStage: Math.min(nextLevel, window.LevelBuilder.getLevels().length - 1),
                score: this.ui.score + 1000,
                fireflies: this.ui.fireflies,
                startOfStageScore: this.ui.score + 1000,
                startOfStageFireflies: this.ui.fireflies
            });

            const levels = window.LevelBuilder.getLevels();
            if (nextLevel < levels.length) {
                this.scene.start('GameScene', {
                    levelIndex: nextLevel,
                    score: this.ui.score + 1000,
                    fireflies: this.ui.fireflies,
                    stageStartScore: this.ui.score + 1000,
                    stageStartFireflies: this.ui.fireflies
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

        if (Phaser.Input.Keyboard.JustDown(this.restartKey)) {
            this.restartStage();
            return;
        }

        if (this.isPaused || this.isLevelCompleted || this.player.isDead) return;

        // Collect keyboard + touch inputs
        const touch = this.ui.touchInputs;

        const left = this.cursors.left.isDown || this.wasd.left.isDown || touch.left;
        const right = this.cursors.right.isDown || this.wasd.right.isDown || touch.right;
        const up = this.cursors.up.isDown || this.wasd.up.isDown;

        const jumpDown = this.cursors.space.isDown || this.wasd.space.isDown || this.cursors.up.isDown || this.wasd.up.isDown || touch.jump;
        const jumpJustPressed = (jumpDown && !this.prevJumpDown) || touch.jumpQueued;
        const jumpReleased = !jumpDown && (this.prevJumpDown || touch.jumpQueued);
        this.prevJumpDown = jumpDown;

        const tongueDown = this.wasd.x.isDown || this.wasd.shift.isDown || touch.tongue;
        const tongueJustPressed = (tongueDown && !this.prevTongueDown) || touch.tongueQueued;
        this.prevTongueDown = tongueDown;
        touch.jumpQueued = false;
        touch.tongueQueued = false;

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
        this.depthGameplay.update(time, delta);

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
        window.soundEngine.setTrack('victory');
        window.announceGame?.('Adventure complete! You found the Golden Lotus.');
        const w = this.scale.width;
        const h = this.scale.height;

        this.add.image(0, 0, 'bg_sky').setOrigin(0, 0).setDisplaySize(w, h);

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

        if (!StorageManager.load().profile.settings.reducedMotion) this.time.addEvent({
            delay: 350,
            repeat: -1,
            callback: () => {
                const rx = Phaser.Math.Between(100, w - 100);
                const ry = Phaser.Math.Between(50, 250);
                const p = this.add.particles(rx, ry, 'sparkle', {
                    emitting: false,
                    speed: { min: 50, max: 140 },
                    lifespan: 500,
                    quantity: 14
                });
                p.explode(14);
                this.time.delayedCall(600, () => p.destroy());
            }
        });

        const card = this.add.graphics();
        card.fillStyle(0x022c22, 0.85);
        card.fillRoundedRect(w / 2 - 180, 260, 360, 100, 10);

        const prev = StorageManager.load();
        const isNewHigh = this.finalScore > prev.highScore;
        StorageManager.save({ completed: true, score: this.finalScore, unlockedStage: 4, fireflies: this.finalFlies });

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

        this.add.text(w / 2, 385, 'THE SWAMPS ARE SAFE. THANKS FOR PLAYING!', {
            fontFamily: '"Press Start 2P", monospace, sans-serif',
            fontSize: '14px',
            color: '#6ee7b7'
        }).setOrigin(0.5);

        const replay = () => {
            StorageManager.newRun();
            this.scene.start('GameScene', { levelIndex: 0, score: 0, fireflies: 0 });
        };
        // A held jump key or an incidental tap must not dismiss the ending.
        this.input.keyboard.on('keydown-SPACE', event => { if (!event.repeat) replay(); });
        createSceneActions(this, [['Play again', replay], ['Main menu', () => this.scene.start('TitleScene')]]);
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
        this.stageStartScore = data.stageStartScore || 0;
    }

    create() {
        const w = this.scale.width;
        const h = this.scale.height;

        this.cameras.main.setBackgroundColor('#09090b');
        window.soundEngine.setTrack('gameover');
        window.announceGame?.('Game over. Choose Retry stage or press Space.');

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
        const updated = StorageManager.save({ bestScore: this.score, score: this.stageStartScore,
            fireflies: this.fireflies, startOfStageScore: this.stageStartScore });

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

        this.add.text(w / 2, 350, 'YOUR STAGE CHECKPOINT IS SAFE', {
            fontFamily: '"Press Start 2P", monospace, sans-serif',
            fontSize: '14px',
            color: '#fef08a'
        }).setOrigin(0.5);

        const retry = () => {
            this.scene.start('GameScene', {
                levelIndex: this.levelIndex,
                score: this.stageStartScore,
                fireflies: this.fireflies
            });
        };

        this.input.keyboard.on('keydown-SPACE', event => { if (!event.repeat) retry(); });
        createSceneActions(this, [['Retry stage', retry], ['Main menu', () => this.scene.start('TitleScene')]]);
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
