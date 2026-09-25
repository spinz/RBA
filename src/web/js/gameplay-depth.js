/** Integration of data-authored pickups, encounters and route teaching. */
class GameplayDepth {
    constructor(scene) {
        this.scene = scene;
        this.hints = (scene.currentLevel.routeHints || []).map(hint => ({ ...hint, shown: false }));
        this.nextHintAt = scene.time.now + 3000;
        const { player, levelElements: world } = scene;

        scene.physics.add.overlap(player, world.powerupsGroup, (frog, item) => item.onSwallowed(frog),
            () => !player.isDead && !scene.isLevelCompleted);
        scene.physics.add.overlap(player.tongueTip, world.powerupsGroup, (tip, item) => player.grabObject(item),
            () => player.tongueActive && !player.isDead && !scene.isLevelCompleted);

        scene.physics.add.collider(world.depthEnemies, world.platforms);
        scene.physics.add.collider(world.depthEnemies, world.lilypads);
        scene.physics.add.overlap(player, world.depthEnemies, (frog, enemy) => {
            if (frog.starPower) enemy.starDefeat();
            else if (frog.body.velocity.y > 0 && frog.body.bottom <= enemy.body.top + 16) enemy.squash(frog);
            else frog.takeDamage(1);
        }, (frog, enemy) => !frog.isDead && !scene.isLevelCompleted && enemy.active && !enemy.isDefeated);
        scene.physics.add.overlap(player.tongueTip, world.depthEnemies, (tip, enemy) => player.grabObject(enemy),
            (tip, enemy) => player.tongueActive && !player.isDead && !scene.isLevelCompleted && !enemy.isDefeated);

        // Catch before body damage, so a tongue interception wins a same-frame overlap.
        scene.physics.add.overlap(player.tongueTip, world.enemyProjectiles, (tip, seed) => player.grabObject(seed),
            () => player.tongueActive && !player.isDead && !scene.isLevelCompleted);
        scene.physics.add.overlap(player, world.enemyProjectiles, (frog, seed) => {
            frog.takeDamage(1);
            seed.destroy();
        }, () => !player.isDead && !scene.isLevelCompleted);
        scene.physics.add.collider(world.enemyProjectiles, world.platforms, seed => seed.destroy());

        // A non-physics group preserves the existing enemies' body configuration.
        this.combatEnemies = scene.add.group([
            ...world.beetles, ...world.mosquitoes, ...world.chargingBeetles, ...world.reedSpitters
        ]);
        scene.physics.add.overlap(scene.spitballs, this.combatEnemies, (first, second) => {
            const shot = first instanceof window.PlayerSpitball ? first : second;
            const enemy = shot === first ? second : first;
            enemy.takeSpitballDamage(shot);
        }, (first, second) => {
            const shot = first instanceof window.PlayerSpitball ? first : second;
            const enemy = shot === first ? second : first;
            return shot.active && enemy.active && !enemy.isDefeated;
        });
        scene.physics.add.collider(scene.spitballs, world.platforms, shot => shot.destroy());

        this.intro = scene.time.delayedCall(2600, () => {
            if (scene.currentLevel.intro && !scene.tutorial && !scene.isLevelCompleted && !player.isDead) {
                this.showHint(scene.currentLevel.intro);
            }
        });
    }

    showHint(text) {
        const scene = this.scene;
        this.clearHint?.remove();
        scene.ui.showTutorialPrompt(text);
        this.clearHint = scene.time.delayedCall(5000, () => scene.ui.clearTutorialPrompt());
        this.nextHintAt = scene.time.now + 5500;
    }

    update(time, delta) {
        const scene = this.scene;
        const world = scene.levelElements;
        // Enemy clocks use scene time so manual pause cannot skip a telegraph.
        world.depthEnemies.getChildren().forEach(enemy => {
            if (enemy.active && enemy.body?.enable) enemy.update(scene.time.now, delta);
        });
        scene.ui.updatePowerups(scene.player.getPowerupStatus(), scene.player.hasSpitProjectile);
        if (scene.tutorial || scene.hasTriggeredArena || scene.time.now < this.nextHintAt) return;
        const hint = this.hints.find(item => !item.shown && Math.abs(scene.player.x - item.x) < 130 && Math.abs(scene.player.y - item.y) < 160);
        if (hint) {
            hint.shown = true;
            this.showHint(hint.text);
        }
    }
}

window.GameplayDepth = GameplayDepth;
