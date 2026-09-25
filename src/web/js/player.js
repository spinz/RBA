/**
 * Player Controller: Ribbit the Frog (V2 HD Upgrade)
 * Implements Mario-style responsive platformer physics:
 * - Coyote time & jump buffering
 * - Variable jump height
 * - Squash & stretch juice
 * - Running & leaping animations with drop shadow
 * - Enhanced segmented elastic tongue with suction cup
 */
class FrogPlayer extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'frog', 0);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.scene = scene;

        // Ground drop shadow (gives 3D depth against platforms)
        this.shadow = scene.add.image(x, y + 22, 'shadow').setDepth(this.depth - 1);

        // Hitbox tuning for 48x48 sprite
        this.body.setSize(22, 26);
        this.body.setOffset(13, 18);
        this.body.setMaxVelocity(250, 680);

        // Movement constants
        this.MOVE_SPEED = window.RbaPhysics.runSpeed;
        this.ACCEL = window.RbaPhysics.acceleration;
        this.DRAG = window.RbaPhysics.drag;
        this.JUMP_SPEED = window.RbaPhysics.jumpVelocity;
        this.SUPER_JUMP_SPEED = window.RbaPhysics.springVelocity;

        // Platforming feel timers
        this.coyoteTime = window.RbaPhysics.coyoteTimeMs;
        this.jumpBufferTime = window.RbaPhysics.jumpBufferMs;
        this.lastGroundedTime = -Infinity;
        this.lastJumpPressedTime = -Infinity;
        this.wasOnGround = true;

        // Tongue mechanic state
        this.tongueActive = false;
        this.tongueState = 'idle'; // 'extending', 'retracting', 'idle'
        this.tongueLength = 0;
        this.baseTongueLength = window.RbaPhysics.tongueReach;
        this.maxTongueLength = this.baseTongueLength;
        this.tongueSpeed = window.RbaPhysics.tongueSpeed;
        this.tongueAngle = 0;
        this.caughtTarget = null;

        // Graphics container for rendering the tongue line
        this.tongueGfx = scene.add.graphics().setDepth(this.depth + 1);
        this.tongueTip = scene.physics.add.image(x, y, 'tongue_tip').setDepth(this.depth + 2);
        this.tongueTip.setVisible(false);
        this.tongueTip.body.setAllowGravity(false);
        this.tongueTip.body.setCircle(7);
        this.tongueTip.body.enable = false;

        // Player Stats & Status
        this.hp = 3;
        this.maxHp = 3;
        this.isInvincible = false;
        this.starPower = false;
        this.starTimer = 0;
        this.facing = 'right';
        this.isDead = false;
        const settings = window.StorageManager.load().profile.settings;
        this.reducedMotion = Boolean(settings.reducedMotion);
        this.reducedFlashing = Boolean(settings.reducedFlashing);
        this.bubbleShield = false;
        this.longTongueExpiresAt = 0;
        this.shieldGfx = null;
        this.tonguePowerGfx = null;
        this.invincibilityVersion = 0;
        this.powerupPausedAt = null;

        // Yoshi-style Spitback mechanic
        this.hasSpitProjectile = false;
        this.mouthGlow = null;

        // Create player animations
        this.initAnimations();
    }

    initAnimations() {
        const anims = this.scene.anims;
        if (!anims.exists('frog_idle')) {
            anims.create({
                key: 'frog_idle',
                frames: anims.generateFrameNumbers('frog', { frames: [0, 1] }),
                frameRate: 2.5,
                repeat: -1
            });
        }
        if (!anims.exists('frog_run')) {
            anims.create({
                key: 'frog_run',
                frames: anims.generateFrameNumbers('frog', { frames: [2, 3] }),
                frameRate: 7,
                repeat: -1
            });
        }
        if (!anims.exists('frog_jump')) {
            anims.create({
                key: 'frog_jump',
                frames: [{ key: 'frog', frame: 4 }],
                frameRate: 1
            });
        }
        if (!anims.exists('frog_fall')) {
            anims.create({
                key: 'frog_fall',
                frames: [{ key: 'frog', frame: 5 }],
                frameRate: 1
            });
        }
        if (!anims.exists('frog_hurt')) {
            anims.create({
                key: 'frog_hurt',
                frames: [{ key: 'frog', frame: 6 }],
                frameRate: 1
            });
        }
        this.play('frog_idle');
    }

    update(time, delta, inputs) {
        if (this.isDead) return;

        // Scene clock freezes while paused; the raw update clock does not.
        this.updatePowerups(this.scene.time.now);

        const onGround = this.body.blocked.down || this.body.touching.down;

        // Shadow tracking
        if (this.shadow) {
            this.shadow.setPosition(this.x, this.y + 21);
            this.shadow.setAlpha(onGround ? 0.6 : Math.max(0.1, 0.6 - (this.body.velocity.y < 0 ? 0.3 : 0)));
            this.shadow.setScale(onGround ? 1 : 0.85);
        }

        // Coyote Time
        if (onGround) {
            this.lastGroundedTime = time;
            if (!this.wasOnGround) {
                // Landing event: squash & dust
                this.onLanding();
            }
        }
        this.wasOnGround = onGround;

        // Jump Buffer
        if (inputs.jumpJustPressed) {
            this.lastJumpPressedTime = time;
        }

        // Horizontal Movement
        let moveX = 0;
        if (inputs.left) moveX -= 1;
        if (inputs.right) moveX += 1;

        const currentSpeed = (this.starPower ? this.MOVE_SPEED * 1.35 : this.MOVE_SPEED);

        if (moveX !== 0) {
            this.body.setAccelerationX(moveX * this.ACCEL);
            this.facing = moveX > 0 ? 'right' : 'left';
            this.setFlipX(this.facing === 'left');

            // Running footstep dust
            if (onGround && Math.random() < 0.12) {
                this.emitDust(1);
            }
        } else {
            this.body.setAccelerationX(0);
            this.body.setDragX(this.DRAG);
        }

        // Check Jump Execution
        const canJump = (time - this.lastGroundedTime < this.coyoteTime);
        const bufferedJump = (time - this.lastJumpPressedTime < this.jumpBufferTime);

        if (bufferedJump && canJump && this.body.velocity.y >= 0) {
            this.executeJump(this.JUMP_SPEED);
            this.lastJumpPressedTime = -Infinity; // Consume buffer
            this.lastGroundedTime = -Infinity;
        }

        // Variable Jump Height (Mario-style cutoff on key release)
        if (inputs.jumpReleased && this.body.velocity.y < -100) {
            this.body.setVelocityY(this.body.velocity.y * 0.48);
        }

        // Flashing hurt/invincibility
        if (this.reducedFlashing) {
            this.setAlpha(this.isInvincible ? 0.65 : 1);
        } else if (!this.isInvincible || time % 100 > 50) {
            this.setAlpha(1);
        } else {
            this.setAlpha(0.3);
        }

        // Star Power rainbow aura
        if (this.starPower) {
            const hue = this.reducedFlashing ? 50 : (time * 0.6) % 360;
            const color = Phaser.Display.Color.HSVToRGB(hue / 360, 0.85, 1).color;
            this.setTint(color);

            // Sparkle trails
            if (Math.random() < 0.3) {
                const sp = this.scene.add.image(this.x + Phaser.Math.Between(-10, 10), this.y + Phaser.Math.Between(-10, 10), 'sparkle');
                this.scene.tweens.add({
                    targets: sp,
                    scale: 0,
                    alpha: 0,
                    duration: 250,
                    onComplete: () => sp.destroy()
                });
            }
        } else {
            this.clearTint();
        }

        // Animation states
        if (!onGround) {
            if (this.body.velocity.y < 0) {
                this.play('frog_jump', true);
            } else {
                this.play('frog_fall', true);
            }
        } else if (Math.abs(this.body.velocity.x) > 25) {
            this.play('frog_run', true);
        } else {
            this.play('frog_idle', true);
        }

        // Tongue Logic
        this.updateTongue(inputs, delta);

        // Mouth glow position for spit projectile
        if (this.mouthGlow) {
            this.mouthGlow.setPosition(this.x + (this.facing === 'right' ? 14 : -14), this.y + 4);
        }

        // Star power countdown
        if (this.starPower && time > this.starTimer) {
            this.starPower = false;
        }

        // Fall into pit
        if (this.y > this.scene.physics.world.bounds.height + 40) {
            this.die();
        }
    }

    executeJump(velocity) {
        this.body.setVelocityY(velocity);
        window.soundEngine.playJump(velocity < this.JUMP_SPEED);

        // Squash & stretch: stretch vertically
        this.setScale(0.8, 1.25);
        this.scene.tweens.add({
            targets: this,
            scaleX: 1,
            scaleY: 1,
            duration: 250,
            ease: 'Back.easeOut'
        });

        this.emitDust(3);
    }

    bounceOffMushroom() {
        this.executeJump(this.SUPER_JUMP_SPEED);
    }

    bounceOffEnemy() {
        this.body.setVelocityY(this.JUMP_SPEED * 0.85);
        window.soundEngine.playStomp();
    }

    onLanding() {
        // Squash horizontally on impact
        this.setScale(1.25, 0.8);
        this.scene.tweens.add({
            targets: this,
            scaleX: 1,
            scaleY: 1,
            duration: 180,
            ease: 'Quad.easeOut'
        });
        this.emitDust(4);
    }

    emitDust(qty = 3) {
        const emitter = this.scene.add.particles(this.x, this.y + 18, 'dust', {
            emitting: false,
            speed: { min: 20, max: 65 },
            angle: { min: 200, max: 340 },
            scale: { start: 0.9, end: 0 },
            lifespan: 260,
            quantity: qty
        });
        emitter.explode(qty);
        this.scene.time.delayedCall(300, () => emitter.destroy());
    }

    // --- TONGUE MECHANIC ---
    updateTongue(inputs, delta) {
        const mouthX = this.x + (this.facing === 'right' ? 12 : -12);
        const mouthY = this.y + 4;

        if (inputs.tongueJustPressed) {
            // If holding a caught venom projectile, spit it back like a cannon!
            if (this.hasSpitProjectile) {
                this.shootSpitProjectile();
                return;
            }

            if (!this.tongueActive) {
                this.tongueActive = true;
                this.tongueState = 'extending';
                this.tongueLength = 0;
                this.caughtTarget = null;
                this.tongueTip.setVisible(true);
                this.tongueTip.body.enable = true;
                this.tongueTip.setPosition(mouthX, mouthY);

                // Determine angle: straight or 45 degree upward
                if (inputs.up) {
                    this.tongueAngle = this.facing === 'right' ? -Math.PI / 4 : -3 * Math.PI / 4;
                } else {
                    this.tongueAngle = this.facing === 'right' ? 0 : Math.PI;
                }

                window.soundEngine.playTongue();
            }
        }

        if (this.tongueActive) {
            const speed = (this.tongueSpeed * delta) / 1000;

            if (this.tongueState === 'extending') {
                this.tongueLength += speed;
                if (this.tongueLength >= this.maxTongueLength) {
                    this.tongueState = 'retracting';
                }
            } else if (this.tongueState === 'retracting') {
                this.tongueLength -= speed * 1.5;
                if (this.tongueLength <= 0) {
                    this.tongueLength = 0;
                    this.tongueActive = false;
                    this.tongueState = 'idle';
                    this.tongueTip.setVisible(false);
                    this.tongueTip.body.enable = false;

                    // Swallow caught target
                    if (this.caughtTarget?.active) {
                        this.swallowTarget(this.caughtTarget);
                        this.caughtTarget = null;
                    }
                }
            }

            // Update Tip Position
            const tipX = mouthX + Math.cos(this.tongueAngle) * this.tongueLength;
            const tipY = mouthY + Math.sin(this.tongueAngle) * this.tongueLength;
            this.tongueTip.setPosition(tipX, tipY);

            if (this.caughtTarget?.active) {
                this.caughtTarget.setPosition(tipX, tipY);
            }

            // Draw High-Detail Stylized Tongue Line
            this.tongueGfx.clear();
            if (this.tongueActive && this.tongueLength > 2) {
                // Outer dark fleshy border
                this.tongueGfx.lineStyle(5.5, this.longTongueExpiresAt > this.scene.time.now ? 0x92400e : 0x9f1239, 1);
                this.tongueGfx.beginPath();
                this.tongueGfx.moveTo(mouthX, mouthY);
                this.tongueGfx.lineTo(tipX, tipY);
                this.tongueGfx.strokePath();

                // Fleshy pink body
                this.tongueGfx.lineStyle(3.5, this.longTongueExpiresAt > this.scene.time.now ? 0xfacc15 : 0xf43f5e, 1);
                this.tongueGfx.beginPath();
                this.tongueGfx.moveTo(mouthX, mouthY);
                this.tongueGfx.lineTo(tipX, tipY);
                this.tongueGfx.strokePath();

                // Wet glistening specular top highlight
                this.tongueGfx.lineStyle(1.5, this.longTongueExpiresAt > this.scene.time.now ? 0xfef9c3 : 0xfecdd3, 0.95);
                this.tongueGfx.beginPath();
                this.tongueGfx.moveTo(mouthX, mouthY - 1);
                this.tongueGfx.lineTo(tipX, tipY - 1);
                this.tongueGfx.strokePath();
            }
        } else {
            this.tongueGfx.clear();
        }
    }

    grabObject(obj) {
        if (!this.caughtTarget && this.tongueState === 'extending') {
            this.caughtTarget = obj;
            this.tongueState = 'retracting';
            this.scene.tweens.killTweensOf(obj);
            obj.onGrabbed?.(this);
            if (obj.body) obj.body.enable = false;
        }
    }

    swallowTarget(obj) {
        if (!obj?.active) return;
        const p = this.scene.add.particles(this.x, this.y, 'sparkle', {
            emitting: false,
            speed: { min: 50, max: 130 },
            lifespan: 380,
            quantity: 10
        });
        p.explode(10);
        this.scene.time.delayedCall(400, () => p.destroy());

        if (obj.onSwallowed) {
            obj.onSwallowed(this);
        } else {
            obj.destroy();
        }
    }

    loadSpitProjectile() {
        this.hasSpitProjectile = true;
        if (!this.mouthGlow) {
            this.mouthGlow = this.scene.add.image(this.x, this.y, 'sparkle').setScale(1.4).setTint(0xfde047).setDepth(15);
            this.scene.tweens.add({
                targets: this.mouthGlow,
                scale: 1.8,
                alpha: 0.6,
                duration: 200,
                yoyo: true,
                repeat: -1
            });
        }
    }

    shootSpitProjectile() {
        this.hasSpitProjectile = false;
        if (this.mouthGlow) {
            this.scene.tweens.killTweensOf(this.mouthGlow);
            this.mouthGlow.destroy();
            this.mouthGlow = null;
        }

        const mouthX = this.x + (this.facing === 'right' ? 18 : -18);
        const mouthY = this.y + 2;
        const dir = this.facing === 'right' ? 1 : -1;

        window.soundEngine.playJump(true);
        if (window.PlayerSpitball) {
            const spitball = new window.PlayerSpitball(this.scene, mouthX, mouthY, dir);
            this.scene.spitballs?.add(spitball);
            spitball.body.setVelocityX(dir * 520);
        }
    }

    takeDamage(amount = 1) {
        if (this.isInvincible || this.isDead || this.scene.isLevelCompleted || this.scene.bossDefeated) return;

        if (this.bubbleShield) {
            this.bubbleShield = false;
            this.destroyShieldVisual();
            this.setDamageGrace(700);
            this.showShieldPop();
            return;
        }

        this.hp -= amount;
        if (this.scene.ui) {
            this.scene.ui.updateHealth(this.hp);
        }
        if (this.hp > 0) window.soundEngine.playHurt();

        // Screen shake
        window.rbaCameraShake(this.scene.cameras.main, 180, 0.015);

        if (this.hp <= 0) {
            this.die();
        } else {
            // Knockback impulse
            this.body.setVelocityY(-260);
            this.body.setVelocityX(this.facing === 'right' ? -180 : 180);

            // Invincibility cooldown
            this.setDamageGrace(1500);
        }
    }

    setDamageGrace(durationMs) {
        const version = ++this.invincibilityVersion;
        this.isInvincible = true;
        this.scene.time.delayedCall(durationMs, () => {
            if (this.active && !this.isDead && version === this.invincibilityVersion) {
                this.isInvincible = false;
            }
        });
    }

    showShieldPop() {
        const burst = this.scene.add.particles(this.x, this.y, 'sparkle', {
            emitting: false,
            speed: this.reducedMotion ? 25 : { min: 45, max: 110 },
            tint: [0x67e8f9, 0xc4b5fd],
            lifespan: 320,
            quantity: this.reducedMotion ? 4 : 10
        });
        burst.explode(this.reducedMotion ? 4 : 10);
        this.scene.time.delayedCall(350, () => burst.destroy());
    }

    giveBubbleShield() {
        if (this.isDead) return;
        this.bubbleShield = true;
        if (!this.shieldGfx) {
            this.shieldGfx = this.scene.add.graphics().setDepth(this.depth + 1);
        }
        this.drawShieldVisual(this.scene.time.now);
    }

    giveLongTongue(durationMs = 15000) {
        if (this.isDead) return;
        const duration = Math.max(0, Number(durationMs) || 0);
        this.longTongueExpiresAt = this.getPowerupClock() + duration;
        this.maxTongueLength = this.baseTongueLength * 1.5;
        if (!this.tonguePowerGfx) {
            this.tonguePowerGfx = this.scene.add.graphics().setDepth(this.depth);
        }
        this.drawTonguePowerVisual(this.getPowerupClock());
    }

    getPowerupClock() {
        return this.powerupPausedAt ?? this.scene?.time?.now ?? 0;
    }

    setPowerupsPaused(paused) {
        const now = this.scene?.time?.now ?? 0;
        if (paused && this.powerupPausedAt === null) {
            this.powerupPausedAt = now;
        } else if (!paused && this.powerupPausedAt !== null) {
            const pausedFor = Math.max(0, now - this.powerupPausedAt);
            if (this.longTongueExpiresAt > 0) this.longTongueExpiresAt += pausedFor;
            if (this.starPower) this.starTimer += pausedFor;
            this.powerupPausedAt = null;
        }
    }

    getPowerupStatus() {
        const now = this.getPowerupClock();
        this.expireLongTongue(now);
        return {
            shield: this.bubbleShield,
            tongueSeconds: Math.max(0, Math.ceil((this.longTongueExpiresAt - now) / 1000))
        };
    }

    updatePowerups(time) {
        this.expireLongTongue(time);
        if (this.bubbleShield) this.drawShieldVisual(time);
        if (this.longTongueExpiresAt > time) this.drawTonguePowerVisual(time);
    }

    expireLongTongue(time) {
        if (this.longTongueExpiresAt <= 0 || time < this.longTongueExpiresAt) return;
        this.longTongueExpiresAt = 0;
        this.powerupPausedAt = null;
        this.maxTongueLength = this.baseTongueLength;
        if (this.tongueState === 'extending' && this.tongueLength >= this.maxTongueLength) {
            this.tongueState = 'retracting';
        }
        if (this.tonguePowerGfx) {
            this.tonguePowerGfx.destroy();
            this.tonguePowerGfx = null;
        }
    }

    drawShieldVisual(time) {
        if (!this.shieldGfx) return;
        const animated = !this.reducedMotion && !this.reducedFlashing;
        const pulse = animated ? Math.sin(time / 180) * 1.5 : 0;
        this.shieldGfx.clear();
        this.shieldGfx.fillStyle(0x67e8f9, 0.12);
        this.shieldGfx.fillCircle(0, 0, 27 + pulse);
        this.shieldGfx.lineStyle(3, 0xa5f3fc, 0.9);
        this.shieldGfx.strokeCircle(0, 0, 27 + pulse);
        this.shieldGfx.lineStyle(2, 0xffffff, 0.8);
        this.shieldGfx.beginPath();
        this.shieldGfx.arc(-6, -7, 13 + pulse * 0.3, 3.65, 4.75);
        this.shieldGfx.strokePath();
        this.shieldGfx.setPosition(this.x, this.y);
    }

    drawTonguePowerVisual(time) {
        if (!this.tonguePowerGfx) return;
        const animated = !this.reducedMotion && !this.reducedFlashing;
        const lift = animated ? Math.sin(time / 220) * 1.5 : 0;
        this.tonguePowerGfx.clear();
        this.tonguePowerGfx.fillStyle(0xfacc15, 0.9);
        this.tonguePowerGfx.fillCircle(-17, -13 + lift, 2.5);
        this.tonguePowerGfx.fillCircle(18, -8 - lift, 2);
        this.tonguePowerGfx.lineStyle(2, 0xfef08a, 0.75);
        this.tonguePowerGfx.beginPath();
        this.tonguePowerGfx.arc(0, 0, 25, 0.15, 1.15);
        this.tonguePowerGfx.strokePath();
        this.tonguePowerGfx.setPosition(this.x, this.y);
    }

    destroyShieldVisual() {
        if (!this.shieldGfx) return;
        this.shieldGfx.destroy();
        this.shieldGfx = null;
    }

    clearTemporaryPowerups() {
        this.bubbleShield = false;
        this.longTongueExpiresAt = 0;
        this.powerupPausedAt = null;
        this.maxTongueLength = this.baseTongueLength;
        this.destroyShieldVisual();
        if (this.tonguePowerGfx) {
            this.tonguePowerGfx.destroy();
            this.tonguePowerGfx = null;
        }
    }

    giveStarPower(durationMs = 8000) {
        this.starPower = true;
        this.starTimer = this.scene.time.now + durationMs;
        window.soundEngine.playWin();
    }

    die() {
        if (this.isDead) return;
        this.isDead = true;
        this.invincibilityVersion++;
        this.isInvincible = false;
        this.clearTemporaryPowerups();
        this.body.enable = false;
        this.tongueActive = false;
        this.tongueTip.body.enable = false;
        this.tongueTip.setVisible(false);
        this.tongueGfx.clear();
        if (this.shadow) this.shadow.destroy();
        this.play('frog_hurt', true);
        window.soundEngine.playHurt();

        // Dramatic death leap
        this.scene.tweens.add({
            targets: this,
            y: this.y - 90,
            duration: 350,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                this.scene.tweens.add({
                    targets: this,
                    y: this.y + 450,
                    duration: 650,
                    ease: 'Cubic.easeIn',
                    onComplete: () => {
                        this.scene.events.emit('player_died');
                    }
                });
            }
        });
    }

    destroy() {
        this.clearTemporaryPowerups();
        if (this.mouthGlow) this.scene?.tweens.killTweensOf(this.mouthGlow);
        if (this.mouthGlow) this.mouthGlow.destroy();
        if (this.shadow) this.shadow.destroy();
        if (this.tongueGfx) this.tongueGfx.destroy();
        if (this.tongueTip) this.tongueTip.destroy();
        super.destroy();
    }
}

window.FrogPlayer = FrogPlayer;
