const { test, expect } = require('@playwright/test');

async function startStage(page, level) {
    await page.goto(`/?dev=1&level=${level}`);
    await page.waitForFunction(() => window.game?.scene.isActive('TitleScene'));
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => window.game?.scene.isActive('GameScene'));
}

test('charging beetle telegraphs and cancels a charge that would cross spawn', async ({ page }) => {
    await startStage(page, 2);
    const result = await page.evaluate(() => {
        const scene = window.game.scene.getScene('GameScene');
        const beetle = scene.levelElements.chargingBeetles[0];
        if (!beetle) throw new Error('Stage 2 must include its charging beetle');

        // Put the beetle just beyond the spawn lane and force the end of its
        // visible wind-up. Its supporting platform still allows a charge.
        beetle.direction = -1;
        beetle.x = scene.currentLevel.playerStart.x + 120;
        beetle.y = 530;
        beetle.body.reset(beetle.x, beetle.y);
        beetle.setState('WINDUP', scene.time.now + 1);
        const hadSupport = beetle.hasSupportAhead();
        beetle.update(scene.time.now + 2);
        return { hadSupport, state: beetle.state, velocity: beetle.body.velocity.x };
    });
    expect(result.hadSupport).toBe(true);
    expect(result.state).toBe('RECOVERY');
    expect(result.velocity).toBe(0);
});

test('reed spit can be caught, fired, and defeat a legacy enemy on collision', async ({ page }) => {
    await startStage(page, 3);
    await page.evaluate(() => {
        const scene = window.game.scene.getScene('GameScene');
        const spitter = scene.levelElements.reedSpitters[0];
        if (!spitter) throw new Error('Stage 3 must include its reed spitter');

        const player = scene.player;
        player.body.reset(spitter.x - 150, spitter.y);
        player.body.setVelocity(0, 0);
        player.facing = 'right';
        player.setFlipX(false);

        // Trigger its normal telegraph and fire path on scene time.
        spitter.state = 'WATCHING';
        spitter.stateUntil = scene.time.now - 1;
        spitter.update(scene.time.now);
        if (spitter.state !== 'WINDUP') throw new Error('Spitter did not enter its telegraph');
        spitter.stateUntil = scene.time.now - 1;
        spitter.update(scene.time.now);
        const projectile = scene.levelElements.enemyProjectiles.getChildren().find(item => item.active);
        if (!projectile) throw new Error('Spitter did not create a projectile');
        projectile.body.setVelocity(0, 0);
        projectile.body.reset(player.x + 24, player.y + 4);

        // Exercise the real tongue-tip/projectile overlap configured by the scene.
        player.tongueActive = true;
        player.tongueState = 'extending';
        player.tongueLength = 20;
        player.tongueAngle = 0;
        player.tongueTip.body.enable = true;
        player.tongueTip.setPosition(player.x + 24, player.y + 4);
    });
    await page.waitForFunction(() => {
        const scene = window.game.scene.getScene('GameScene');
        return scene.player.caughtTarget instanceof window.ReedSpitProjectile;
    });

    await page.evaluate(() => {
        const scene = window.game.scene.getScene('GameScene');
        const player = scene.player;
        player.tongueState = 'retracting';
        player.tongueLength = 1;
    });
    await page.waitForFunction(() => window.game.scene.getScene('GameScene').player.hasSpitProjectile);

    await page.evaluate(() => {
        const scene = window.game.scene.getScene('GameScene');
        const player = scene.player;
        const enemy = new window.MudBeetle(scene, player.x + 115, player.y, 10);
        enemy.body.setAllowGravity(false);
        enemy.body.setVelocity(0, 0);
        scene.depthGameplay.combatEnemies.add(enemy);
        player.shootSpitProjectile();
        window.depthCombatTarget = enemy;
    });
    await page.waitForFunction(() => window.depthCombatTarget?.isDefeated);
    expect(await page.evaluate(() => window.depthCombatTarget.active)).toBe(true);

    // The spitter stays in cooldown after firing, then returns to watching.
    expect(await page.evaluate(() => {
        const scene = window.game.scene.getScene('GameScene');
        return scene.levelElements.reedSpitters[0].state;
    })).toBe('COOLDOWN');
    await page.evaluate(() => {
        const scene = window.game.scene.getScene('GameScene');
        const spitter = scene.levelElements.reedSpitters[0];
        const projectile = new window.ReedSpitProjectile(scene, 200, 200, 100);
        scene.levelElements.enemyProjectiles.add(projectile);
        projectile.body.setVelocity(100, -35);
        projectile.update(projectile.bornAt + projectile.lifespan);
        spitter.update(scene.time.now + 1801);
        window.expiredReedProjectile = projectile;
    });
    expect(await page.evaluate(() => ({
        projectileActive: window.expiredReedProjectile.active,
        spitterState: window.game.scene.getScene('GameScene').levelElements.reedSpitters[0].state
    }))).toEqual({ projectileActive: false, spitterState: 'WATCHING' });
});
