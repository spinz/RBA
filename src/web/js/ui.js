/**
 * HUD & On-Screen Touch Controls
 * Displays Hearts, Fireflies, Score, Level Banner, floating popups, and virtual D-pad.
 */
class GameUI {
    constructor(scene) {
        this.scene = scene;
        this.hearts = [];
        this.score = 0;
        this.fireflies = 0;
        this.lastAnnouncedHealth = null;
        this.reducedMotion = Boolean(window.StorageManager?.load().profile.settings.reducedMotion);
        this.touchOpacity = Number(window.StorageManager?.load().profile.settings.touchOpacity) || 0.55;

        this.initHUD();
        this.initTouchControls();
        this.initPauseOverlay();
    }

    initHUD() {
        // UI Container fixed to camera
        this.container = this.scene.add.container(0, 0).setScrollFactor(0).setDepth(100);

        // Dark banner backdrop behind top bar
        const topBar = this.scene.add.graphics();
        topBar.fillStyle(0x0f172a, 0.65);
        topBar.fillRoundedRect(10, 10, 520, 42, 8);
        this.container.add(topBar);

        // 1. Health Hearts
        for (let i = 0; i < 3; i++) {
            const heart = this.scene.add.image(30 + i * 24, 30, 'heart').setScale(1.3);
            this.hearts.push(heart);
            this.container.add(heart);
        }

        // 2. Firefly Counter
        const ffIcon = this.scene.add.image(135, 30, 'firefly', 0).setScale(1.5);
        this.container.add(ffIcon);

        this.ffText = this.scene.add.text(152, 22, 'x 00', {
            fontFamily: '"Press Start 2P", monospace, sans-serif',
            fontSize: '14px',
            color: '#fef08a'
        });
        this.container.add(this.ffText);

        // 3. Score
        this.scoreText = this.scene.add.text(250, 22, 'SCORE: 00000', {
            fontFamily: '"Press Start 2P", monospace, sans-serif',
            fontSize: '14px',
            color: '#ffffff'
        });
        this.container.add(this.scoreText);

        // 4. Mute Button
        this.muteBtn = this.scene.add.text(470, 22, '[SND]', {
            fontFamily: '"Press Start 2P", monospace, sans-serif',
            fontSize: '11px',
            color: '#a7f3d0'
        }).setInteractive({ useHandCursor: true });
        this.muteBtn.setText(window.soundEngine.isMuted ? '[MUT]' : '[SND]');

        this.muteBtn.on('pointerdown', () => {
            const isMuted = window.soundEngine.toggleMute();
            this.muteBtn.setText(isMuted ? '[MUT]' : '[SND]');
        });
        this.container.add(this.muteBtn);
    }

    updateHealth(hp) {
        for (let i = 0; i < 3; i++) {
            if (i < hp) {
                this.hearts[i].setAlpha(1);
                this.hearts[i].setScale(1.3);
            } else {
                this.hearts[i].setAlpha(0.2);
                this.hearts[i].setScale(1.0);
            }
        }
        if (this.lastAnnouncedHealth !== hp) {
            this.lastAnnouncedHealth = hp;
            this.announce(`${hp} ${hp === 1 ? 'heart' : 'hearts'} remaining`);
        }
    }

    addScore(amount) {
        this.score += amount;
        const formatted = String(this.score).padStart(5, '0');
        this.scoreText.setText(`SCORE: ${formatted}`);
    }

    addFirefly() {
        this.fireflies++;
        this.renderFireflies();
        this.addScore(50);
        this.announce(`Firefly collected. ${this.fireflies} carried.`);
    }

    setFireflies(amount) {
        this.fireflies = Math.max(0, Number(amount) || 0);
        this.renderFireflies();
    }

    renderFireflies() {
        const formatted = String(this.fireflies).padStart(2, '0');
        this.ffText.setText(`x ${formatted}`);
    }

    showScorePopup(x, y, text, color = '#fde047') {
        const popup = this.scene.add.text(x, y, text, {
            fontFamily: '"Press Start 2P", monospace, sans-serif',
            fontSize: '12px',
            color: color,
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(99);

        if (this.reducedMotion) {
            banner.setScale(1);
            this.scene.time.delayedCall(500, () => banner.destroy());
            return;
        }
        this.scene.tweens.add({
            targets: popup,
            y: y - 35,
            alpha: 0,
            duration: 700,
            ease: 'Quad.easeOut',
            onComplete: () => popup.destroy()
        });
    }

    showLevelBanner(title) {
        this.announce(title);
        const banner = this.scene.add.container(400, 180).setScrollFactor(0).setDepth(100);

        const bg = this.scene.add.graphics();
        bg.fillStyle(0x022c22, 0.85);
        bg.lineStyle(3, 0x22c55e, 1);
        bg.fillRoundedRect(-200, -35, 400, 70, 12);
        bg.strokeRoundedRect(-200, -35, 400, 70, 12);

        const text = this.scene.add.text(0, 0, title, {
            fontFamily: '"Press Start 2P", monospace, sans-serif',
            fontSize: '18px',
            color: '#86efac'
        }).setOrigin(0.5);

        banner.add([bg, text]);
        banner.setScale(0);

        this.scene.tweens.add({
            targets: banner,
            scaleX: 1,
            scaleY: 1,
            duration: 350,
            ease: 'Back.easeOut',
            onComplete: () => {
                this.scene.time.delayedCall(1600, () => {
                    this.scene.tweens.add({
                        targets: banner,
                        alpha: 0,
                        duration: 400,
                        onComplete: () => banner.destroy()
                    });
                });
            }
        });
    }

    // --- Boss Encounter Health HUD ---
    createBossHealthBar(bossTitle = 'KING CROAKER', maxHp = 6) {
        if (this.bossContainer) this.bossContainer.destroy();

        const w = this.scene.scale.width;
        this.bossHearts = [];
        this.bossContainer = this.scene.add.container(w / 2, 68).setScrollFactor(0).setDepth(100);

        // Ornate dark stone banner
        const bg = this.scene.add.graphics();
        bg.fillStyle(0x0f172a, 0.9);
        bg.lineStyle(2, 0xeab308, 1);
        bg.fillRoundedRect(-180, -20, 360, 44, 8);
        bg.strokeRoundedRect(-180, -20, 360, 44, 8);
        this.bossContainer.add(bg);

        // Title
        const titleText = this.scene.add.text(0, -9, bossTitle, {
            fontFamily: '"Press Start 2P", monospace, sans-serif',
            fontSize: '11px',
            color: '#fde047',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        this.bossContainer.add(titleText);

        // Heart pips
        const pipSpacing = 28;
        const startX = -((maxHp - 1) * pipSpacing) / 2;

        for (let i = 0; i < maxHp; i++) {
            const heart = this.scene.add.image(startX + i * pipSpacing, 11, 'boss_heart').setScale(1.1);
            this.bossHearts.push(heart);
            this.bossContainer.add(heart);
        }

        // Entrance slide-down tween
        this.bossContainer.setY(-30);
        this.scene.tweens.add({
            targets: this.bossContainer,
            y: 68,
            duration: 450,
            ease: 'Back.easeOut'
        });
    }

    updateBossHealth(hp) {
        if (!this.bossHearts) return;
        for (let i = 0; i < this.bossHearts.length; i++) {
            if (i < hp) {
                this.bossHearts[i].setAlpha(1);
                this.bossHearts[i].setScale(1.1);
            } else {
                this.bossHearts[i].setAlpha(0.18);
                this.bossHearts[i].setScale(0.8);
            }
        }

        // Shake HUD container on damage
        if (this.bossContainer) {
            this.scene.tweens.add({
                targets: this.bossContainer,
                x: this.scene.scale.width / 2 + 5,
                duration: 40,
                yoyo: true,
                repeat: 3
            });
        }
    }

    removeBossHealthBar() {
        if (this.bossContainer) {
            this.scene.tweens.add({
                targets: this.bossContainer,
                y: -60,
                alpha: 0,
                duration: 500,
                onComplete: () => {
                    if (this.bossContainer) {
                        this.bossContainer.destroy();
                        this.bossContainer = null;
                    }
                }
            });
        }
    }

    initPauseOverlay() {
        const w = this.scene.scale.width;
        const h = this.scene.scale.height;
        this.pauseContainer = this.scene.add.container(w / 2, h / 2)
            .setScrollFactor(0)
            .setDepth(1000)
            .setVisible(false);

        const backdrop = this.scene.add.rectangle(0, 0, w, h, 0x020617, 0.78)
            .setInteractive({ useHandCursor: true });
        const panel = this.scene.add.rectangle(0, 0, 360, 150, 0x052e16, 0.96)
            .setStrokeStyle(3, 0x4ade80, 1);
        const title = this.scene.add.text(0, -30, 'PAUSED', {
            fontFamily: '"Press Start 2P", monospace, sans-serif',
            fontSize: '28px',
            color: '#f0fdf4'
        }).setOrigin(0.5);
        const hint = this.scene.add.text(0, 30, 'P / ESC OR TAP TO RESUME', {
            fontFamily: '"Press Start 2P", monospace, sans-serif',
            fontSize: '10px',
            color: '#86efac'
        }).setOrigin(0.5);

        backdrop.on('pointerdown', () => this.scene.togglePause(false));
        this.pauseContainer.add([backdrop, panel, title, hint]);
    }

    setPaused(isPaused) {
        if (this.pauseContainer) this.pauseContainer.setVisible(isPaused);
        this.announce(isPaused ? 'Game paused' : 'Game resumed');
    }

    announce(message) {
        if (typeof window.announceGame === 'function') window.announceGame(message);
    }

    initTouchControls() {
        // Virtual Touch Controls for Mobile / Tablets
        this.touchInputs = {
            left: false,
            right: false,
            jump: false,
            tongue: false
        };

        const hasCoarsePointer = window.matchMedia && window.matchMedia('(hover: none) and (pointer: coarse)').matches;
        const isNarrowTouchScreen = window.innerWidth <= 720 && navigator.maxTouchPoints > 0;
        const isTouchDevice = hasCoarsePointer || isNarrowTouchScreen;
        if (!isTouchDevice) return;

        const touchContainer = this.scene.add.container(0, 0).setScrollFactor(0).setDepth(100);

        // Helper to draw virtual circular button
        const makeBtn = (x, y, radius, label, color, onDown, onUp) => {
            const circle = this.scene.add.circle(x, y, radius, color, this.touchOpacity)
                .setInteractive({ useHandCursor: true });
            circle.setStrokeStyle(2, 0xffffff, 0.6);

            const txt = this.scene.add.text(x, y, label, {
                fontFamily: 'sans-serif',
                fontSize: `${radius * 0.62}px`,
                fontStyle: 'bold',
                color: '#ffffff'
            }).setOrigin(0.5);

            circle.on('pointerdown', () => {
                circle.setFillStyle(color, 0.8);
                onDown();
            });
            circle.on('pointerup', () => {
                circle.setFillStyle(color, this.touchOpacity);
                onUp();
            });
            circle.on('pointerout', () => {
                circle.setFillStyle(color, this.touchOpacity);
                onUp();
            });

            touchContainer.add([circle, txt]);
        };

        const screenH = this.scene.scale.height;
        const screenW = this.scene.scale.width;

        // D-Pad Left / Right
        makeBtn(70, screenH - 66, 46, '<', 0x334155,
            () => this.touchInputs.left = true,
            () => this.touchInputs.left = false
        );
        makeBtn(170, screenH - 66, 46, '>', 0x334155,
            () => this.touchInputs.right = true,
            () => this.touchInputs.right = false
        );

        // Action B (Tongue)
        makeBtn(screenW - 170, screenH - 66, 46, 'LASH', 0xec4899,
            () => this.touchInputs.tongue = true,
            () => this.touchInputs.tongue = false
        );

        // Action A (Jump)
        makeBtn(screenW - 65, screenH - 66, 50, '^', 0x22c55e,
            () => this.touchInputs.jump = true,
            () => this.touchInputs.jump = false
        );
    }
}

window.GameUI = GameUI;
