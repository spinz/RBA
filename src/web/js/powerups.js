/** Code-native temporary power-up pickups. */
const Powerups = {
    textureKeys: Object.freeze({
        bubble_shield: 'powerup_bubble_shield',
        long_tongue: 'powerup_long_tongue'
    }),

    generateTextures(scene) {
        if (!scene.textures.exists(this.textureKeys.bubble_shield)) {
            const bubble = scene.make.graphics({ x: 0, y: 0, add: false });
            bubble.fillStyle(0x164e63, 1);
            bubble.fillCircle(16, 16, 15);
            bubble.fillStyle(0x67e8f9, 0.35);
            bubble.fillCircle(16, 16, 12);
            bubble.lineStyle(3, 0xa5f3fc, 1);
            bubble.strokeCircle(16, 16, 13);
            bubble.lineStyle(2, 0xffffff, 0.95);
            bubble.beginPath();
            bubble.arc(12, 12, 7, 3.35, 4.8);
            bubble.strokePath();
            bubble.generateTexture(this.textureKeys.bubble_shield, 32, 32);
            bubble.destroy();
        }

        if (!scene.textures.exists(this.textureKeys.long_tongue)) {
            const tongue = scene.make.graphics({ x: 0, y: 0, add: false });
            tongue.fillStyle(0x713f12, 1);
            tongue.fillRoundedRect(2, 6, 28, 20, 8);
            tongue.fillStyle(0xfacc15, 1);
            tongue.fillRoundedRect(4, 8, 24, 16, 7);
            tongue.fillStyle(0xfef08a, 1);
            tongue.fillRoundedRect(7, 10, 18, 4, 2);
            tongue.fillStyle(0x9f1239, 1);
            tongue.fillRoundedRect(8, 17, 19, 5, 2);
            tongue.fillStyle(0xf43f5e, 1);
            tongue.fillRoundedRect(10, 17, 17, 3, 1);
            tongue.generateTexture(this.textureKeys.long_tongue, 32, 32);
            tongue.destroy();
        }
    },

    create(scene, { x, y, type }) {
        const texture = this.textureKeys[type];
        if (!texture) throw new Error(`Unknown power-up type: ${type}`);
        if (!scene.textures.exists(texture)) this.generateTextures(scene);

        const pickup = scene.physics.add.image(x, y, texture).setDepth(8);
        pickup.powerupType = type;
        pickup.setData('powerupType', type);
        pickup.body.setAllowGravity(false);
        pickup.body.setCircle(14, 2, 2);
        pickup.setImmovable(true);

        const settings = window.StorageManager?.load().profile.settings ?? {};
        if (!settings.reducedMotion) {
            scene.tweens.add({
                targets: pickup,
                y: y - 5,
                duration: 850,
                ease: 'Sine.easeInOut',
                yoyo: true,
                repeat: -1
            });
        }

        let claimed = false;
        pickup.onSwallowed = player => {
            if (claimed || !pickup.active || !player || player.isDead) return false;
            claimed = true;
            if (type === 'bubble_shield') player.giveBubbleShield();
            else player.giveLongTongue();

            scene.tweens.killTweensOf(pickup);
            if (pickup.body) pickup.body.enable = false;
            pickup.destroy();
            return true;
        };

        return pickup;
    }
};

window.Powerups = Powerups;
