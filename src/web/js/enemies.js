/**
 * Upgraded Enemies: Armored Mud Beetle and Jewel Dragonfly (V2 HD)
 * Handles physics hitboxes, walking animations, drop shadows, and interactions.
 */
class MudBeetle extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, patrolDistance = 140) {
        super(scene, x, y, 'beetle', 0);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.scene = scene;
        this.startX = x;
        this.patrolDistance = patrolDistance;
        this.speed = 55;
        this.direction = -1;
        this.isDefeated = false;

        // Shadow beneath beetle
        this.shadow = scene.add.image(x, y + 16, 'shadow').setScale(0.9, 0.7).setAlpha(0.45);

        // Adjusted hitbox for 48x36 sprite
        this.body.setSize(30, 24);
        this.body.setOffset(9, 12);
        this.body.setVelocityX(this.speed * this.direction);

        this.initAnims();
    }

    initAnims() {
        const anims = this.scene.anims;
        if (!anims.exists('beetle_walk')) {
            anims.create({
                key: 'beetle_walk',
                frames: anims.generateFrameNumbers('beetle', { frames: [0, 1] }),
                frameRate: 4.5,
                repeat: -1
            });
        }
        this.play('beetle_walk');
    }

    update() {
        if (this.isDefeated) return;

        if (this.shadow) {
            this.shadow.setPosition(this.x, this.y + 16);
        }

        // Patrol bounds
        if (this.x < this.startX - this.patrolDistance) {
            this.direction = 1;
            this.setFlipX(true);
        } else if (this.x > this.startX + this.patrolDistance) {
            this.direction = -1;
            this.setFlipX(false);
        }

        if (this.body.blocked.left) {
            this.direction = 1;
            this.setFlipX(true);
        } else if (this.body.blocked.right) {
            this.direction = -1;
            this.setFlipX(false);
        }

        this.body.setVelocityX(this.speed * this.direction);
    }

    squash(player) {
        if (this.isDefeated) return;
        this.isDefeated = true;
        this.body.enable = false;
        if (this.shadow) this.shadow.destroy();
        this.stop();
        this.setFrame(2); // Squashed pancake frame

        player.bounceOffEnemy();
        this.scene.events.emit('add_score', 100, this.x, this.y);

        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            duration: 450,
            delay: 150,
            onComplete: () => this.destroy()
        });
    }

    onSwallowed(player) {
        this.isDefeated = true;
        if (this.shadow) this.shadow.destroy();
        this.scene.events.emit('add_score', 250, this.x, this.y);
        this.destroy();
    }

    starDefeat() {
        if (this.isDefeated) return;
        this.isDefeated = true;
        this.body.enable = false;
        if (this.shadow) this.shadow.destroy();
        window.soundEngine.playStomp();
        this.scene.events.emit('add_score', 200, this.x, this.y);

        this.scene.tweens.add({
            targets: this,
            y: this.y - 140,
            angle: 360,
            duration: 500,
            ease: 'Cubic.easeOut',
            onComplete: () => this.destroy()
        });
    }

    destroy() {
        if (this.shadow) this.shadow.destroy();
        super.destroy();
    }
}

class HoverMosquito extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, rangeX = 120) {
        super(scene, x, y, 'mosquito', 0);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.scene = scene;
        this.startX = x;
        this.startY = y;
        this.rangeX = rangeX;
        this.speedX = 70;
        this.direction = -1;
        this.isDefeated = false;

        this.body.setAllowGravity(false);
        this.body.setSize(24, 20);
        this.body.setOffset(6, 6);

        this.initAnims();
    }

    initAnims() {
        const anims = this.scene.anims;
        if (!anims.exists('mosquito_fly')) {
            anims.create({
                key: 'mosquito_fly',
                frames: anims.generateFrameNumbers('mosquito', { frames: [0, 1] }),
                frameRate: 12,
                repeat: -1
            });
        }
        this.play('mosquito_fly');
    }

    update(time) {
        if (this.isDefeated) return;

        // Sine wave vertical bobbing
        const hoverOffset = Math.sin(time * 0.005) * 20;
        this.y = this.startY + hoverOffset;

        // Horizontal patrol
        if (this.x < this.startX - this.rangeX) {
            this.direction = 1;
            this.setFlipX(true);
        } else if (this.x > this.startX + this.rangeX) {
            this.direction = -1;
            this.setFlipX(false);
        }

        this.body.setVelocityX(this.speedX * this.direction);
    }

    squash(player) {
        if (this.isDefeated) return;
        this.isDefeated = true;
        this.body.enable = false;
        player.bounceOffEnemy();
        this.scene.events.emit('add_score', 150, this.x, this.y);

        this.scene.tweens.add({
            targets: this,
            y: this.y + 40,
            alpha: 0,
            duration: 250,
            onComplete: () => this.destroy()
        });
    }

    onSwallowed(player) {
        this.isDefeated = true;
        this.scene.events.emit('add_score', 300, this.x, this.y);
        this.destroy();
    }

    starDefeat() {
        if (this.isDefeated) return;
        this.isDefeated = true;
        this.body.enable = false;
        window.soundEngine.playStomp();
        this.scene.events.emit('add_score', 200, this.x, this.y);

        this.scene.tweens.add({
            targets: this,
            y: this.y - 140,
            angle: 360,
            duration: 500,
            ease: 'Cubic.easeOut',
            onComplete: () => this.destroy()
        });
    }
}

// --- 3. BOSS: KING CROAKER - LORD OF THE SUNKEN CITADEL ---

class BossShockwave extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, direction = 1, speed = 230) {
        super(scene, x, y, 'boss_shockwave');
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.scene = scene;
        this.direction = direction;
        this.body.setAllowGravity(false);
        this.body.setSize(40, 24);
        this.body.setOffset(4, 8);
        this.body.setVelocityX(speed * direction);
        this.setFlipX(direction < 0);
        this.setDepth(8);

        this.lifespan = 2400;
        this.bornTime = scene.time.now;

        scene.tweens.add({
            targets: this,
            scaleY: 1.25,
            scaleX: 1.1,
            duration: 120,
            yoyo: true,
            repeat: -1
        });
    }

    update(time) {
        if (time - this.bornTime > this.lifespan) {
            this.destroy();
        }
    }

    destroy() {
        this.scene?.tweens.killTweensOf(this);
        super.destroy();
    }
}

class BossVenomBall extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, vx, vy) {
        super(scene, x, y, 'venom_ball');
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.scene = scene;
        this.body.setBounce(0.65);
        this.body.setCollideWorldBounds(false);
        this.body.setSize(18, 18);
        this.body.setVelocity(vx, vy);
        this.setDepth(9);

        this.trailTimer = scene.time.addEvent({
            delay: 110,
            repeat: -1,
            callback: () => {
                if (!this.active) return;
                const drop = scene.add.image(this.x, this.y, 'water_drop').setScale(0.8).setTint(0xa855f7);
                scene.tweens.add({
                    targets: drop,
                    alpha: 0,
                    scale: 0.2,
                    duration: 250,
                    onComplete: () => drop.destroy()
                });
            }
        });

        scene.time.delayedCall(5000, () => {
            if (this.active) this.destroy();
        });
    }

    onSwallowed(player) {
        if (!this.active) return;
        window.soundEngine.playEat();
        this.scene.events.emit('add_score', 150, this.x, this.y);
        this.scene.ui.showScorePopup(this.x, this.y, 'CAUGHT! PRESS TONGUE TO SPIT!', '#fde047');
        if (player && player.loadSpitProjectile) {
            player.loadSpitProjectile();
        }
        this.destroy();
    }

    destroy() {
        if (this.trailTimer) this.trailTimer.remove();
        super.destroy();
    }
}

class PlayerSpitball extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, direction = 1) {
        super(scene, x, y, 'venom_ball');
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.scene = scene;
        this.setTint(0xfde047);
        this.setScale(1.25);
        this.body.setAllowGravity(false);
        this.body.setSize(22, 22);
        this.body.setVelocityX(direction * 520);
        this.setDepth(14);

        // Glowing trail
        this.trailTimer = scene.time.addEvent({
            delay: 45,
            repeat: -1,
            callback: () => {
                if (!this.active) return;
                const sp = scene.add.image(this.x, this.y, 'sparkle').setScale(0.9).setTint(0xfacc15);
                scene.tweens.add({
                    targets: sp,
                    alpha: 0,
                    scale: 0.1,
                    duration: 220,
                    onComplete: () => sp.destroy()
                });
            }
        });

        scene.time.delayedCall(2500, () => {
            if (this.active) this.destroy();
        });
    }

    destroy() {
        if (this.trailTimer) this.trailTimer.remove();
        super.destroy();
    }
}

class BossKingCroaker extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'boss_croaker', 0);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.scene = scene;
        this.maxHp = 6;
        this.hp = 6;
        this.reducedFlashing = Boolean(window.StorageManager.load().profile.settings.reducedFlashing);
        this.state = 'WAITING'; // WAITING, INTRO, IDLE, WINDUP, JUMP_UP, AIR_AIM, SLAM_DOWN, STUNNED, SPIT, TONGUE, HURT, DEFEATED
        this.isInvincible = false;
        this.invincibleUntil = 0;
        this.arenaXMin = 1460;
        this.arenaXMax = 2620;
        this.arenaFloorY = 560;

        // Custom Hitbox for 96x80 sprite
        this.body.setSize(68, 56);
        this.body.setOffset(14, 24);
        this.body.setCollideWorldBounds(true);
        this.setDepth(7);

        // Ground Shadow
        this.shadow = scene.add.image(x, y + 36, 'shadow').setScale(2.4, 1.4).setAlpha(0.55).setDepth(6);

        // Shockwaves & Projectiles
        this.shockwaves = scene.physics.add.group({ allowGravity: false });
        this.venomBalls = scene.physics.add.group({ bounceX: 0.65, bounceY: 0.65 });

        // Stun stars container
        this.stunStars = scene.add.container(x, y - 32).setVisible(false).setDepth(15);
        for (let i = 0; i < 4; i++) {
            const star = scene.add.text(0, 0, '*', {
                fontSize: '16px',
                color: '#fef08a'
            }).setOrigin(0.5);
            this.stunStars.add(star);
        }

        // Stun crown prompt
        this.stompPrompt = scene.add.text(x, y - 52, '▼ WHIP TONGUE OR STOMP! ▼', {
            fontFamily: '"Press Start 2P", monospace, sans-serif',
            fontSize: '10px',
            color: '#fde047',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setVisible(false).setDepth(15);

        // Tongue Sweep graphic
        this.bossTongueGfx = scene.add.graphics().setDepth(8);
        this.tongueSweepActive = false;

        this.initAnims();
        this.nextAttackTime = 0;
    }

    initAnims() {
        const anims = this.scene.anims;
        if (!anims.exists('boss_idle')) {
            anims.create({
                key: 'boss_idle',
                frames: anims.generateFrameNumbers('boss_croaker', { frames: [0, 1] }),
                frameRate: 2.2,
                repeat: -1
            });
        }
        if (!anims.exists('boss_crouch')) {
            anims.create({
                key: 'boss_crouch',
                frames: [{ key: 'boss_croaker', frame: 2 }],
                frameRate: 1
            });
        }
        if (!anims.exists('boss_slam')) {
            anims.create({
                key: 'boss_slam',
                frames: [{ key: 'boss_croaker', frame: 3 }],
                frameRate: 1
            });
        }
        if (!anims.exists('boss_roar')) {
            anims.create({
                key: 'boss_roar',
                frames: [{ key: 'boss_croaker', frame: 4 }],
                frameRate: 1
            });
        }
        if (!anims.exists('boss_stunned')) {
            anims.create({
                key: 'boss_stunned',
                frames: [{ key: 'boss_croaker', frame: 5 }],
                frameRate: 1
            });
        }
        if (!anims.exists('boss_hurt')) {
            anims.create({
                key: 'boss_hurt',
                frames: [{ key: 'boss_croaker', frame: 6 }],
                frameRate: 1
            });
        }
        this.play('boss_idle');
    }

    activateEncounter() {
        if (this.state !== 'WAITING') return;
        this.state = 'INTRO';

        window.soundEngine.playBossRoar();
        this.play('boss_roar');
        window.rbaCameraShake(this.scene.cameras.main, 500, 0.02);

        this.scene.time.delayedCall(900, () => {
            if (!this.active || this.state !== 'INTRO') return;
            this.play('boss_idle');
            this.state = 'IDLE';
            this.nextAttackTime = this.scene.time.now + 1400;
        });
    }

    update(time, delta) {
        if (this.state === 'WAITING' || this.state === 'DEFEATED') return;

        // Shadow tracking
        if (this.shadow) {
            this.shadow.setPosition(this.x, this.arenaFloorY + 18);
            const heightAboveGround = Math.max(0, this.arenaFloorY - this.y);
            const scaleFactor = Math.max(0.6, 2.4 - heightAboveGround * 0.0035);
            this.shadow.setScale(scaleFactor, scaleFactor * 0.55);
            this.shadow.setAlpha(Math.max(0.15, 0.6 - heightAboveGround * 0.0015));
        }

        this.shockwaves.getChildren().forEach(shockwave => shockwave.update(time));

        // Facing direction toward player
        if (['IDLE', 'WINDUP', 'STUNNED', 'SPIT'].includes(this.state)) {
            const playerX = this.scene.player.x;
            this.setFlipX(playerX < this.x);
        }

        // Stun stars orbiting animation
        if (this.state === 'STUNNED') {
            this.stunStars.setPosition(this.x, this.y - 32);
            this.stompPrompt.setPosition(this.x, this.y - 52);
            this.stunStars.setVisible(true);
            this.stompPrompt.setVisible(this.reducedFlashing || time % 400 > 150);

            this.stunStars.list.forEach((star, idx) => {
                const angle = (time * 0.006) + (idx * (Math.PI / 2));
                star.setPosition(Math.cos(angle) * 28, Math.sin(angle) * 10);
            });
        } else {
            this.stunStars.setVisible(false);
            this.stompPrompt.setVisible(false);
        }

        // Invincibility flashing
        if (this.isInvincible) {
            if (time > this.invincibleUntil) {
                this.isInvincible = false;
                this.setAlpha(1);
            } else {
                this.setAlpha(this.reducedFlashing ? 0.65 : (time % 120 > 60 ? 0.35 : 1));
            }
        }

        // Enrage visual aura in Phase 2 & 3
        if (this.hp <= 4 && this.state !== 'STUNNED' && this.state !== 'HURT') {
            this.setTint(this.hp <= 2 ? 0xff4444 : 0xff7777);
            if (Math.random() < 0.25) {
                const steam = this.scene.add.image(this.x + Phaser.Math.Between(-20, 20), this.y - 10, 'dust')
                    .setScale(0.8)
                    .setTint(0xef4444);
                this.scene.tweens.add({
                    targets: steam,
                    y: steam.y - 30,
                    alpha: 0,
                    duration: 350,
                    onComplete: () => steam.destroy()
                });
            }
        } else if (!this.isInvincible) {
            this.clearTint();
        }

        // State Machine
        switch (this.state) {
            case 'IDLE':
                if (time > this.nextAttackTime) {
                    this.decideNextAttack(time);
                }
                break;

            case 'JUMP_UP':
                // The velocity sign change is the reachable apex. The old y < -30
                // check was impossible from the arena floor and soft-locked the fight.
                if (this.body.velocity.y >= 0) {
                    this.state = 'AIR_AIM';
                    this.body.setAllowGravity(false);
                    this.body.setVelocity(0, 0);

                    const targetX = Phaser.Math.Clamp(this.scene.player.x, this.arenaXMin + 60, this.arenaXMax - 60);

                    this.scene.time.delayedCall(this.hp <= 2 ? 350 : 650, () => {
                        if (!this.active || this.state !== 'AIR_AIM') return;
                        this.x = targetX;
                        this.state = 'SLAM_DOWN';
                        this.play('boss_slam');
                        this.body.setAllowGravity(true);
                        this.body.setVelocityY(this.hp <= 2 ? 900 : 750);
                    });
                }
                break;

            case 'SLAM_DOWN':
                if (this.body.blocked.down || this.body.touching.down || this.y >= this.arenaFloorY - 20) {
                    this.onGroundSlamImpact();
                }
                break;
        }
    }

    decideNextAttack(time) {
        const rand = Math.random();
        const isPhase2 = this.hp <= 4;

        if (isPhase2 && rand < 0.35) {
            this.executeTongueSweep();
        } else if (rand < 0.65) {
            this.executeMeteorSlam();
        } else {
            this.executeVenomSpit();
        }
    }

    executeMeteorSlam() {
        this.state = 'WINDUP';
        this.play('boss_crouch');
        this.body.setVelocity(0, 0);

        window.soundEngine.playJump(true);
        this.emitDust(6);

        this.scene.time.delayedCall(this.hp <= 2 ? 350 : 550, () => {
            if (!this.active || this.state !== 'WINDUP') return;
            this.state = 'JUMP_UP';
            this.play('boss_slam');
            this.body.setVelocityY(-720);
            this.body.setVelocityX(Phaser.Math.Between(-80, 80));
        });
    }

    onGroundSlamImpact() {
        this.state = 'STUNNED';
        this.body.setVelocity(0, 0);
        this.play('boss_stunned');

        window.soundEngine.playBossSlam();
        window.soundEngine.playShockwave();
        window.rbaCameraShake(this.scene.cameras.main, 320, this.hp <= 2 ? 0.025 : 0.018);
        this.emitDust(14);

        const speed = this.hp <= 2 ? 280 : 220;
        const swLeft = new BossShockwave(this.scene, this.x - 30, this.arenaFloorY + 12, -1, speed);
        const swRight = new BossShockwave(this.scene, this.x + 30, this.arenaFloorY + 12, 1, speed);
        this.shockwaves.addMultiple([swLeft, swRight]);
        swLeft.body.setVelocityX(-speed);
        swRight.body.setVelocityX(speed);

        const stunDuration = this.hp <= 2 ? 1900 : (this.hp <= 4 ? 2400 : 2900);

        this.scene.time.delayedCall(stunDuration, () => {
            if (this.state === 'STUNNED') {
                this.state = 'IDLE';
                this.play('boss_idle');
                this.nextAttackTime = this.scene.time.now + 600;
            }
        });
    }

    executeVenomSpit() {
        this.state = 'SPIT';
        this.play('boss_roar');
        window.soundEngine.playBossRoar();

        const count = this.hp <= 2 ? 4 : (this.hp <= 4 ? 3 : 2);
        let spawned = 0;

        this.scene.time.addEvent({
            delay: 350,
            repeat: count - 1,
            callback: () => {
                if (this.state !== 'SPIT' || this.state === 'DEFEATED') return;
                const mouthX = this.x + (this.flipX ? -28 : 28);
                const mouthY = this.y - 4;

                const targetX = this.scene.player.x;
                const dx = targetX - mouthX;
                const vx = Phaser.Math.Clamp(dx * 1.6, -320, 320);
                const vy = Phaser.Math.Between(-340, -220);

                const venom = new BossVenomBall(this.scene, mouthX, mouthY, vx, vy);
                this.venomBalls.add(venom);
                venom.body.setVelocity(vx, vy);
                window.soundEngine.playTongue();

                spawned++;
                if (spawned >= count) {
                    this.scene.time.delayedCall(500, () => {
                        if (this.state === 'SPIT') {
                            this.state = 'IDLE';
                            this.play('boss_idle');
                            this.nextAttackTime = this.scene.time.now + 800;
                        }
                    });
                }
            }
        });
    }

    executeTongueSweep() {
        this.state = 'TONGUE';
        this.play('boss_roar');
        window.soundEngine.playRibbit();

        const warning = this.scene.add.text(this.x, this.y - 45, 'TONGUE SWEEP! JUMP HIGH!', {
            fontFamily: '"Press Start 2P", monospace, sans-serif',
            fontSize: '9px',
            color: '#ef4444',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);

        this.scene.tweens.add({
            targets: warning,
            alpha: this.reducedFlashing ? 1 : 0.2,
            yoyo: true,
            repeat: 3,
            duration: 150,
            onComplete: () => warning.destroy()
        });

        this.scene.time.delayedCall(700, () => {
            if (this.state !== 'TONGUE' || this.state === 'DEFEATED') return;

            window.soundEngine.playTongue();
            this.tongueSweepActive = true;

            const sweepDir = this.flipX ? -1 : 1;
            const startX = this.x + (sweepDir * 20);
            const sweepDistance = 480;

            let progress = 0;
            this.scene.time.addEvent({
                delay: 20,
                repeat: 25,
                callback: () => {
                    if (!this.active || this.state !== 'TONGUE') {
                        if (this.bossTongueGfx?.active) this.bossTongueGfx.clear();
                        this.tongueSweepActive = false;
                        return;
                    }
                    progress += 0.04;
                    const currentX = startX + (sweepDir * sweepDistance * Math.sin(progress * Math.PI));
                    const currentY = this.arenaFloorY - 4;

                    this.bossTongueGfx.clear();
                    this.bossTongueGfx.lineStyle(8, 0x581c87, 1);
                    this.bossTongueGfx.beginPath();
                    this.bossTongueGfx.moveTo(startX, this.y);
                    this.bossTongueGfx.lineTo(currentX, currentY);
                    this.bossTongueGfx.strokePath();

                    this.bossTongueGfx.lineStyle(4, 0xec4899, 1);
                    this.bossTongueGfx.beginPath();
                    this.bossTongueGfx.moveTo(startX, this.y);
                    this.bossTongueGfx.lineTo(currentX, currentY);
                    this.bossTongueGfx.strokePath();

                    const player = this.scene.player;
                    if (player.y > this.arenaFloorY - 30) {
                        const minX = Math.min(startX, currentX);
                        const maxX = Math.max(startX, currentX);
                        if (player.x >= minX && player.x <= maxX) {
                            player.takeDamage(1);
                            this.scene.ui.updateHealth(player.hp);
                        }
                    }

                    if (progress >= 1) {
                        this.bossTongueGfx.clear();
                        this.tongueSweepActive = false;
                        this.state = 'IDLE';
                        this.play('boss_idle');
                        this.nextAttackTime = this.scene.time.now + 900;
                    }
                }
            });
        });
    }

    takeTongueDamage(player) {
        if (!this.active || ['WAITING', 'INTRO', 'DEFEATED', 'AIR_AIM'].includes(this.state)) return;

        // Force player tongue to retract with snap impact
        if (player) {
            player.tongueState = 'retracting';
        }

        // If boss is in i-frame recovery, give deflect audio/visual feedback
        if (this.isInvincible) {
            window.soundEngine.playFilteredNoise(window.soundEngine.ctx?.currentTime || 0, 0.03, 'highpass', 4200, 0.04);
            const spark = this.scene.add.image(this.x, this.y - 10, 'sparkle').setScale(0.8).setTint(0x94a3b8);
            this.scene.tweens.add({
                targets: spark,
                alpha: 0,
                duration: 150,
                onComplete: () => spark.destroy()
            });
            return;
        }

        const isCritical = this.state === 'STUNNED';
        const damage = isCritical ? 2 : 1;
        this.hp -= damage;
        this.isInvincible = true;
        this.invincibleUntil = this.scene.time.now + 1000;
        this.state = 'HURT';
        this.play('boss_hurt');

        window.soundEngine.playBossHurt();
        window.soundEngine.playTongue();
        window.soundEngine.playStomp();

        window.rbaCameraShake(this.scene.cameras.main, isCritical ? 320 : 240, isCritical ? 0.024 : 0.018);
        this.scene.events.emit('add_score', isCritical ? 2000 : 1000, this.x, this.y - 20, false);
        this.scene.ui.showScorePopup(
            this.x, 
            this.y - 35, 
            isCritical ? 'CRITICAL TONGUE SMASH! -2 HP' : 'TONGUE WHIP! -1 HP', 
            isCritical ? '#fde047' : '#f43f5e'
        );
        this.scene.ui.updateBossHealth(this.hp);

        const burst = this.scene.add.particles(this.x, this.y - 15, 'sparkle', {
            emitting: false,
            speed: { min: 80, max: isCritical ? 240 : 180 },
            scale: { start: isCritical ? 2.2 : 1.6, end: 0 },
            lifespan: 450,
            quantity: isCritical ? 35 : 20
        });
        burst.explode(this.scene.ui.reducedMotion ? 6 : (isCritical ? 35 : 20));
        this.scene.time.delayedCall(500, () => burst.destroy());

        if (this.hp <= 0) {
            this.defeat();
        } else {
            this.scene.time.delayedCall(550, () => {
                if (this.state === 'HURT') {
                    this.state = 'IDLE';
                    this.play('boss_idle');
                    this.nextAttackTime = this.scene.time.now + 400;
                }
            });
        }
    }

    takeSpitballDamage(spitball) {
        if (!this.active || this.isInvincible || ['WAITING', 'INTRO', 'DEFEATED', 'AIR_AIM'].includes(this.state)) return;
        spitball.destroy();

        this.hp -= 1;
        this.isInvincible = true;
        this.invincibleUntil = this.scene.time.now + 1000;
        this.state = 'HURT';
        this.play('boss_hurt');

        window.soundEngine.playBossHurt();
        window.soundEngine.playBossSlam();

        window.rbaCameraShake(this.scene.cameras.main, 320, 0.025);
        this.scene.events.emit('add_score', 1500, this.x, this.y - 20, false);
        this.scene.ui.showScorePopup(this.x, this.y - 45, 'SPITBALL BOOM! -1 HP', '#fde047');
        this.scene.ui.updateBossHealth(this.hp);

        const boom = this.scene.add.particles(this.x, this.y - 15, 'sparkle', {
            emitting: false,
            speed: { min: 100, max: 260 },
            scale: { start: 2.0, end: 0 },
            lifespan: 550,
            quantity: 30
        });
        boom.explode(this.scene.ui.reducedMotion ? 6 : 30);
        this.scene.time.delayedCall(600, () => boom.destroy());

        if (this.hp <= 0) {
            this.defeat();
        } else {
            this.scene.time.delayedCall(550, () => {
                if (this.state === 'HURT') {
                    this.state = 'IDLE';
                    this.play('boss_idle');
                    this.nextAttackTime = this.scene.time.now + 400;
                }
            });
        }
    }

    takeStompDamage(player) {
        if (!this.active || this.isInvincible || ['WAITING', 'INTRO', 'DEFEATED', 'AIR_AIM'].includes(this.state)) return;

        const isCritical = this.state === 'STUNNED';
        const damage = isCritical ? 2 : 1;
        this.hp -= damage;
        this.isInvincible = true;
        this.invincibleUntil = this.scene.time.now + 1000;
        this.state = 'HURT';
        this.play('boss_hurt');

        window.soundEngine.playBossHurt();
        window.soundEngine.playStomp();
        player.bounceOffEnemy();
        player.body.setVelocityY(-560);

        window.rbaCameraShake(this.scene.cameras.main, isCritical ? 320 : 260, 0.025);
        this.scene.events.emit('add_score', isCritical ? 2000 : 1000, this.x, this.y - 20, false);
        this.scene.ui.showScorePopup(
            this.x, 
            this.y - 35, 
            isCritical ? 'CRITICAL CROWN STOMP! -2 HP' : 'CROWN STOMP! -1 HP', 
            '#fde047'
        );
        this.scene.ui.updateBossHealth(this.hp);

        const burst = this.scene.add.particles(this.x, this.y - 24, 'sparkle', {
            emitting: false,
            speed: { min: 80, max: 220 },
            scale: { start: isCritical ? 2.2 : 1.8, end: 0 },
            lifespan: 500,
            quantity: isCritical ? 35 : 25
        });
        burst.explode(this.scene.ui.reducedMotion ? 6 : (isCritical ? 35 : 25));
        this.scene.time.delayedCall(500, () => burst.destroy());

        if (this.hp <= 0) {
            this.defeat();
        } else {
            this.scene.time.delayedCall(550, () => {
                if (this.state === 'HURT') {
                    this.state = 'IDLE';
                    this.play('boss_idle');
                    this.nextAttackTime = this.scene.time.now + 400;
                }
            });
        }
    }

    defeat() {
        if (!this.active || this.state === 'DEFEATED') return;
        const scene = this.scene;
        // Capture a reachable ground reward position before the death tween moves
        // the sprite. Phaser clears this.scene when the sprite is destroyed.
        const rewardX = Phaser.Math.Clamp(this.x, this.arenaXMin + 80, this.arenaXMax - 80);
        const rewardY = this.arenaFloorY - 48;
        this.state = 'DEFEATED';
        this.hp = 0;
        this.tongueSweepActive = false;
        this.body.enable = false;
        if (this.shadow) this.shadow.destroy();
        this.stunStars.setVisible(false);
        this.stompPrompt.setVisible(false);
        this.bossTongueGfx.clear();

        this.shockwaves.clear(true, true);
        this.venomBalls.clear(true, true);
        // The encounter is won; no late hazard may steal the reward sequence.
        scene.bossDefeated = true;

        window.soundEngine.setTrack('reward');
        window.soundEngine.playWin();

        this.play('boss_hurt');
        window.rbaCameraShake(this.scene.cameras.main, 800, 0.03);
        window.rbaCameraFlash(this.scene.cameras.main, 400, 255, 255, 255);

        const winParticles = this.scene.add.particles(this.x, this.y, 'sparkle', {
            emitting: false,
            speed: { min: 80, max: 320 },
            angle: { min: 0, max: 360 },
            scale: { start: 2.2, end: 0 },
            lifespan: 1200,
            quantity: 60
        });
        winParticles.explode(60);
        scene.time.delayedCall(1300, () => winParticles.destroy());

        this.scene.events.emit('add_score', 5000, this.x, this.y - 40);
        this.scene.ui.showLevelBanner('KING CROAKER DEFEATED!');
        this.scene.ui.removeBossHealthBar();

        this.scene.tweens.add({
            targets: this,
            y: this.y - 80,
            angle: scene.ui.reducedMotion ? 0 : 720,
            scaleX: 0,
            scaleY: 0,
            duration: scene.ui.reducedMotion ? 300 : 1600,
            ease: 'Cubic.easeIn',
            onComplete: () => this.destroy()
        });
        // Progression belongs to the scene, not to a disposable visual effect.
        scene.time.delayedCall(scene.ui.reducedMotion ? 300 : 1600, () => {
            if (scene.sys.isActive()) scene.spawnVictoryLotus(rewardX, rewardY);
        });
    }

    emitDust(qty = 8) {
        const emitter = this.scene.add.particles(this.x, this.arenaFloorY + 8, 'dust', {
            emitting: false,
            speed: { min: 40, max: 120 },
            angle: { min: 180, max: 360 },
            scale: { start: 1.4, end: 0 },
            lifespan: 400,
            quantity: qty
        });
        emitter.explode(this.scene.ui.reducedMotion ? 2 : qty);
        this.scene.time.delayedCall(450, () => emitter.destroy());
    }

    destroy() {
        if (this.shadow) this.shadow.destroy();
        if (this.stunStars) this.stunStars.destroy();
        if (this.stompPrompt) this.stompPrompt.destroy();
        if (this.bossTongueGfx) this.bossTongueGfx.destroy();
        super.destroy();
    }
}

window.MudBeetle = MudBeetle;
window.HoverMosquito = HoverMosquito;
window.BossShockwave = BossShockwave;
window.BossVenomBall = BossVenomBall;
window.PlayerSpitball = PlayerSpitball;
window.BossKingCroaker = BossKingCroaker;
