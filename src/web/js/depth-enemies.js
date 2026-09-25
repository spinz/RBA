/**
 * Depth-pass enemy archetypes. LevelBuilder owns construction and GameScene owns
 * the managed groups/colliders; these classes only own their local state/VFX.
 */
(function () {
    const readSettings = () => {
        try {
            return window.StorageManager?.load()?.profile?.settings || {};
        } catch (error) {
            return {};
        }
    };

    const makeCanvasTexture = (scene, key, width, height, draw) => {
        if (scene.textures.exists(key)) return;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');
        context.imageSmoothingEnabled = false;
        draw(context);
        scene.textures.addCanvas(key, canvas);
    };

    const generateTextures = (scene) => {
        makeCanvasTexture(scene, 'charging_beetle', 52, 38, (ctx) => {
            ctx.fillStyle = '#24110a';
            ctx.fillRect(5, 17, 42, 15);
            ctx.fillRect(11, 10, 30, 24);
            ctx.fillStyle = '#713f12';
            ctx.fillRect(8, 18, 36, 11);
            ctx.fillStyle = '#b45309';
            ctx.fillRect(13, 12, 25, 14);
            ctx.fillStyle = '#f59e0b';
            ctx.fillRect(15, 13, 9, 3);
            ctx.fillStyle = '#422006';
            ctx.fillRect(25, 12, 3, 16);
            ctx.fillRect(7, 31, 9, 4);
            ctx.fillRect(35, 31, 9, 4);
            ctx.fillStyle = '#fef3c7';
            ctx.fillRect(39, 16, 4, 4);
            ctx.fillStyle = '#7f1d1d';
            ctx.fillRect(41, 17, 2, 2);
            ctx.fillStyle = '#d97706';
            ctx.fillRect(2, 20, 6, 3);
            ctx.fillRect(44, 20, 6, 3);
        });

        makeCanvasTexture(scene, 'reed_spitter', 42, 54, (ctx) => {
            ctx.fillStyle = '#052e16';
            ctx.fillRect(17, 24, 9, 29);
            ctx.fillStyle = '#166534';
            ctx.fillRect(20, 26, 5, 27);
            ctx.fillStyle = '#14532d';
            ctx.fillRect(5, 17, 32, 20);
            ctx.fillStyle = '#22c55e';
            ctx.fillRect(9, 12, 24, 21);
            ctx.fillStyle = '#4ade80';
            ctx.fillRect(12, 14, 16, 5);
            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(12, 20, 5, 5);
            ctx.fillRect(25, 20, 5, 5);
            ctx.fillStyle = '#111827';
            ctx.fillRect(14, 22, 2, 2);
            ctx.fillRect(26, 22, 2, 2);
            ctx.fillStyle = '#701a75';
            ctx.fillRect(16, 28, 11, 4);
        });

        makeCanvasTexture(scene, 'reed_spit', 20, 20, (ctx) => {
            ctx.fillStyle = '#3b0764';
            ctx.fillRect(3, 5, 14, 11);
            ctx.fillRect(5, 3, 10, 15);
            ctx.fillStyle = '#a3e635';
            ctx.fillRect(5, 5, 10, 10);
            ctx.fillStyle = '#ecfccb';
            ctx.fillRect(7, 6, 5, 4);
        });
    };

    class ChargingBeetle extends Phaser.Physics.Arcade.Sprite {
        constructor(scene, x, y, patrol = 80) {
            super(scene, x, y, 'charging_beetle');
            scene.add.existing(this);
            scene.physics.add.existing(this);

            this.scene = scene;
            this.startX = x;
            this.patrolDistance = Math.max(24, Number(patrol) || 80);
            this.direction = -1;
            this.state = 'PATROL';
            this.stateUntil = 0;
            this.isDefeated = false;
            this.patrolSpeed = 45;
            this.chargeSpeed = 235;
            this.reducedMotion = Boolean(readSettings().reducedMotion);
            this.reducedFlashing = Boolean(readSettings().reducedFlashing);

            this.body.setSize(40, 24);
            this.body.setOffset(6, 12);
            this.body.setVelocityX(-this.patrolSpeed);
            this.setDepth(6);

            this.shadow = scene.add.image(x, y + 17, 'shadow').setScale(0.95, 0.55).setAlpha(0.4).setDepth(5);
            this.tell = scene.add.text(x, y - 27, '!', {
                fontFamily: 'monospace, sans-serif',
                fontSize: '18px',
                fontStyle: 'bold',
                color: '#fef08a',
                stroke: '#451a03',
                strokeThickness: 4
            }).setOrigin(0.5).setVisible(false).setDepth(12);
        }

        hasSupportAhead(direction = this.direction) {
            if (!this.body?.enable) return false;
            const probeX = direction < 0 ? this.body.left - 8 : this.body.right + 4;
            const probeY = this.body.bottom + 2;
            const authoredSupport = (this.scene.currentLevel?.platforms || []).some(platform =>
                probeX >= platform.x && probeX <= platform.x + platform.w &&
                Math.abs(this.body.bottom - platform.y) <= 24);
            if (authoredSupport) return true;
            const bodies = this.scene.physics.overlapRect(probeX, probeY, 6, 12, true, true);
            return bodies.some((body) => body.enable && body.gameObject !== this && (body.immovable || !body.allowGravity));
        }

        playerIsChargeable() {
            const player = this.scene.player;
            if (!player?.active || player.isDead) return false;
            const dx = player.body.center.x - this.body.center.x;
            const dy = Math.abs(player.body.bottom - this.body.bottom);
            return Math.abs(dx) <= 250 && Math.abs(dx) >= 46 && dy <= 45 && Math.sign(dx) === this.direction;
        }

        wouldChargeIntoSpawn() {
            const spawn = this.scene.currentLevel?.playerStart;
            if (!spawn) return false;
            const chargeEnd = this.body.center.x + this.direction * this.chargeSpeed * 0.62;
            const pathMin = Math.min(this.body.center.x, chargeEnd);
            const pathMax = Math.max(this.body.center.x, chargeEnd);
            const safetyRadius = 96;
            return pathMax >= spawn.x - safetyRadius && pathMin <= spawn.x + safetyRadius;
        }

        setState(state, until = 0) {
            this.state = state;
            this.stateUntil = until;
            this.tell.setVisible(state === 'WINDUP');
            if (state === 'WINDUP') {
                this.body.setVelocityX(0);
                this.setTint(0xfacc15);
                this.setScale(1.08, 0.9);
            } else if (state === 'CHARGE') {
                this.clearTint();
                this.setScale(1);
                this.body.setVelocityX(this.direction * this.chargeSpeed);
            } else if (state === 'RECOVERY') {
                this.body.setVelocityX(0);
                this.setTint(0x94a3b8);
                this.setScale(1, 0.82);
            } else {
                this.clearTint();
                this.setScale(1);
            }
        }

        update(time) {
            if (this.isDefeated || !this.body?.enable) return;
            this.shadow?.setPosition(this.x, this.y + 17);
            this.tell?.setPosition(this.x, this.y - 27);

            const hitWall = this.body.blocked.left || this.body.blocked.right;
            const atPatrolLimit = Math.abs(this.x - this.startX) >= this.patrolDistance;
            const supported = this.hasSupportAhead();

            if (this.state === 'PATROL') {
                if (hitWall || atPatrolLimit || !supported) {
                    this.direction *= -1;
                    this.setFlipX(this.direction > 0);
                } else if (this.playerIsChargeable() && !this.wouldChargeIntoSpawn()) {
                    this.setState('WINDUP', time + 650);
                    return;
                }
                this.body.setVelocityX(this.direction * this.patrolSpeed);
                return;
            }

            if (this.state === 'WINDUP') {
                this.body.setVelocityX(0);
                // Shape/scale and a steady icon carry the tell without flashing.
                if (!this.reducedMotion) this.setAngle(Math.sin(time * 0.04) * 3);
                if (time >= this.stateUntil) {
                    this.setAngle(0);
                    const canCharge = supported && !this.wouldChargeIntoSpawn();
                    this.setState(canCharge ? 'CHARGE' : 'RECOVERY', time + (canCharge ? 620 : 500));
                }
                return;
            }

            if (this.state === 'CHARGE') {
                if (hitWall || !supported || time >= this.stateUntil) {
                    this.setState('RECOVERY', time + 600);
                } else {
                    this.body.setVelocityX(this.direction * this.chargeSpeed);
                }
                return;
            }

            if (time >= this.stateUntil) {
                if (hitWall || !supported) this.direction *= -1;
                this.setFlipX(this.direction > 0);
                this.setState('PATROL');
            }
        }

        defeat(score, player) {
            if (this.isDefeated) return;
            this.isDefeated = true;
            this.tell?.setVisible(false);
            if (this.body) this.body.enable = false;
            this.scene.events.emit('add_score', score, this.x, this.y);
            if (player?.bounceOffEnemy) player.bounceOffEnemy();
            this.scene.tweens.add({
                targets: this,
                alpha: 0,
                scaleY: 0.25,
                duration: this.reducedMotion ? 100 : 350,
                onComplete: () => this.destroy()
            });
        }

        squash(player) { this.defeat(175, player); }
        onSwallowed() { this.defeat(300); }
        starDefeat() { this.defeat(250); }

        takeSpitballDamage(projectile) {
            if (this.isDefeated) return;
            projectile?.destroy();
            this.defeat(300);
        }

        destroy(fromScene) {
            this.scene?.tweens.killTweensOf(this);
            this.shadow?.destroy();
            this.tell?.destroy();
            this.shadow = null;
            this.tell = null;
            super.destroy(fromScene);
        }
    }

    class ReedSpitProjectile extends Phaser.Physics.Arcade.Sprite {
        constructor(scene, x, y, velocityX, velocityY = -40) {
            super(scene, x, y, 'reed_spit');
            scene.add.existing(this);
            scene.physics.add.existing(this);
            this.scene = scene;
            this.bornAt = scene.time.now;
            this.lifespan = 3200;
            this.body.setAllowGravity(false);
            this.body.setSize(14, 14);
            this.body.setOffset(3, 3);
            this.body.setVelocity(velocityX, velocityY);
            this.setDepth(9);
            this.expiryTimer = scene.time.delayedCall(this.lifespan, () => {
                if (this.active) this.destroy();
            });
        }

        update(time) {
            if (time - this.bornAt >= this.lifespan) this.destroy();
        }

        onSwallowed(player) {
            if (!this.active) return;
            player?.loadSpitProjectile?.();
            this.scene.events.emit('add_score', 100, this.x, this.y);
            this.scene.ui?.showScorePopup?.(this.x, this.y, 'CAUGHT! TONGUE AGAIN TO SPIT', '#d9f99d');
            this.destroy();
        }

        destroy(fromScene) {
            this.expiryTimer?.remove();
            this.expiryTimer = null;
            super.destroy(fromScene);
        }
    }

    class ReedSpitter extends Phaser.Physics.Arcade.Sprite {
        constructor(scene, x, y, projectileGroup, range = 360) {
            super(scene, x, y, 'reed_spitter');
            scene.add.existing(this);
            scene.physics.add.existing(this);

            this.scene = scene;
            this.projectileGroup = projectileGroup;
            this.range = Math.max(120, Number(range) || 360);
            this.state = 'WATCHING';
            this.stateUntil = scene.time.now + 500;
            this.isDefeated = false;
            this.reducedMotion = Boolean(readSettings().reducedMotion);
            this.body.setSize(28, 42);
            this.body.setOffset(7, 10);
            this.body.setImmovable(true);
            this.setDepth(6);

            this.tell = scene.add.text(x, y - 40, '●', {
                fontFamily: 'monospace, sans-serif',
                fontSize: '18px',
                color: '#bef264',
                stroke: '#3b0764',
                strokeThickness: 4
            }).setOrigin(0.5).setVisible(false).setDepth(12);
        }

        playerInRange() {
            const player = this.scene.player;
            if (!player?.active || player.isDead) return false;
            return Math.abs(player.body.center.x - this.body.center.x) <= this.range &&
                Math.abs(player.body.center.y - this.body.center.y) <= 180;
        }

        update(time) {
            if (this.isDefeated || !this.body?.enable) return;
            this.tell?.setPosition(this.x, this.y - 40);
            const player = this.scene.player;
            if (player?.active) this.setFlipX(player.body.center.x < this.body.center.x);

            if (this.state === 'WATCHING' && time >= this.stateUntil && this.playerInRange()) {
                this.state = 'WINDUP';
                this.stateUntil = time + 800;
                this.tell.setVisible(true);
                this.setTint(0xa3e635);
                this.setScale(1.12, 0.9);
                return;
            }

            if (this.state === 'WINDUP' && time >= this.stateUntil) {
                this.fireProjectile();
                this.state = 'COOLDOWN';
                this.stateUntil = time + 1800;
                this.tell.setVisible(false);
                this.clearTint();
                this.setScale(1);
                return;
            }

            if (this.state === 'COOLDOWN' && time >= this.stateUntil) {
                this.state = 'WATCHING';
                this.stateUntil = time + 250;
            }
        }

        fireProjectile() {
            if (!this.projectileGroup || !this.active) return null;
            const player = this.scene.player;
            const direction = player?.body.center.x < this.body.center.x ? -1 : 1;
            const velocityX = direction * 205;
            const projectile = new ReedSpitProjectile(this.scene, this.x + direction * 24, this.y - 8, velocityX, -35);
            this.projectileGroup.add(projectile);
            // Phaser group defaults can replace constructor velocity on insertion.
            projectile.body.setAllowGravity(false);
            projectile.body.setVelocity(velocityX, -35);
            return projectile;
        }

        defeat(score, player) {
            if (this.isDefeated) return;
            this.isDefeated = true;
            if (this.body) this.body.enable = false;
            this.tell?.setVisible(false);
            this.scene.events.emit('add_score', score, this.x, this.y);
            if (player?.bounceOffEnemy) player.bounceOffEnemy();
            this.scene.tweens.add({
                targets: this,
                alpha: 0,
                y: this.y + (this.reducedMotion ? 8 : 28),
                duration: this.reducedMotion ? 100 : 300,
                onComplete: () => this.destroy()
            });
        }

        squash(player) { this.defeat(200, player); }
        onSwallowed() { this.defeat(325); }
        starDefeat() { this.defeat(275); }

        takeSpitballDamage(projectile) {
            if (this.isDefeated) return;
            projectile?.destroy();
            this.defeat(325);
        }

        destroy(fromScene) {
            this.scene?.tweens.killTweensOf(this);
            this.tell?.destroy();
            this.tell = null;
            super.destroy(fromScene);
        }
    }

    window.DepthEnemies = { generateTextures };
    window.ChargingBeetle = ChargingBeetle;
    window.ReedSpitter = ReedSpitter;
    window.ReedSpitProjectile = ReedSpitProjectile;
}());
