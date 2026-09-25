const { test, expect } = require('@playwright/test');

async function startStage(page, level = 1) {
    await page.goto(`/?dev=1&level=${level}`);
    await page.waitForFunction(() => window.game?.scene.isActive('TitleScene'));
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => window.game?.scene.isActive('GameScene'));
}

test('body and tongue collect each power-up exactly once', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await startStage(page);

    const bodyPickup = await page.evaluate(() => {
        const scene = window.game.scene.getScene('GameScene');
        const pickup = window.Powerups.create(scene, {
            x: scene.player.x,
            y: scene.player.y,
            type: 'bubble_shield'
        });
        scene.levelElements.powerupsGroup.add(pickup);
        return pickup.name = 'body-test-shield';
    });
    expect(bodyPickup).toBe('body-test-shield');
    await page.waitForFunction(() => window.game.scene.getScene('GameScene').player.getPowerupStatus().shield);
    expect(await page.evaluate(() => {
        const scene = window.game.scene.getScene('GameScene');
        return scene.children.list.some(child => child.name === 'body-test-shield');
    })).toBe(false);

    await page.evaluate(() => {
        const scene = window.game.scene.getScene('GameScene');
        const player = scene.player;
        player.body.reset(250, 450);
        player.body.setVelocity(0, 0);
        player.facing = 'right';
        player.setFlipX(false);
        const pickup = window.Powerups.create(scene, {
            x: player.x + 80,
            y: player.y + 4,
            type: 'long_tongue'
        });
        pickup.name = 'tongue-test-powerup';
        scene.levelElements.powerupsGroup.add(pickup);
    });
    await page.keyboard.press('x');
    await page.waitForFunction(() => window.game.scene.getScene('GameScene').player.caughtTarget?.name === 'tongue-test-powerup');
    await page.waitForFunction(() => window.game.scene.getScene('GameScene').player.getPowerupStatus().tongueSeconds > 0);
    expect(await page.evaluate(() => {
        const scene = window.game.scene.getScene('GameScene');
        return {
            pickupExists: scene.children.list.some(child => child.name === 'tongue-test-powerup'),
            reach: scene.player.maxTongueLength,
            baseReach: scene.player.baseTongueLength
        };
    })).toEqual({ pickupExists: false, reach: 202.5, baseReach: 135 });
    expect(errors).toEqual([]);
});

test('long tongue refreshes without stacking, expires on scene time, and freezes while paused', async ({ page }) => {
    await startStage(page);
    const initial = await page.evaluate(() => {
        const player = window.game.scene.getScene('GameScene').player;
        player.giveLongTongue(1000);
        return [player.maxTongueLength, player.longTongueExpiresAt];
    });
    await page.waitForTimeout(600);
    const refreshed = await page.evaluate(() => {
        const player = window.game.scene.getScene('GameScene').player;
        player.giveLongTongue(1000);
        return [player.maxTongueLength, player.longTongueExpiresAt];
    });
    expect(refreshed[0]).toBe(initial[0]);
    expect(refreshed[1]).toBeGreaterThan(initial[1]);

    await page.waitForTimeout(550);
    expect(await page.evaluate(() => window.game.scene.getScene('GameScene').player.getPowerupStatus().tongueSeconds)).toBeGreaterThan(0);
    await expect.poll(() => page.evaluate(() => window.game.scene.getScene('GameScene').player.getPowerupStatus().tongueSeconds)).toBe(0);
    expect(await page.evaluate(() => {
        const player = window.game.scene.getScene('GameScene').player;
        return player.maxTongueLength === player.baseTongueLength;
    })).toBe(true);

    await page.evaluate(() => window.game.scene.getScene('GameScene').player.giveLongTongue(1000));
    await page.keyboard.press('p');
    await page.waitForFunction(() => window.game.scene.getScene('GameScene').isPaused);
    const beforePause = await page.evaluate(() => {
        const scene = window.game.scene.getScene('GameScene');
        return [scene.time.now, scene.player.longTongueExpiresAt];
    });
    await page.waitForTimeout(1200);
    const afterPause = await page.evaluate(() => {
        const scene = window.game.scene.getScene('GameScene');
        return [scene.time.now, scene.player.longTongueExpiresAt, scene.player.getPowerupStatus().tongueSeconds];
    });
    expect(afterPause[0]).toBeGreaterThan(beforePause[0]);
    expect(afterPause[1]).toBe(beforePause[1]);
    expect(afterPause[2]).toBeGreaterThan(0);

    // Restart is supported from pause and creates a fresh player with no temporary effects.
    await page.evaluate(() => {
        window.game.scene.getScene('GameScene').player.__powerupTestPreviousPlayer = true;
    });
    await page.keyboard.press('r');
    await page.waitForFunction(() => {
        const scene = window.game.scene.getScene('GameScene');
        return !scene.isPaused && !scene.player.__powerupTestPreviousPlayer && scene.player.body.enable;
    });
    expect(await page.evaluate(() => window.game.scene.getScene('GameScene').player.getPowerupStatus())).toEqual({
        shield: false,
        tongueSeconds: 0
    });
});

test('bubble shield absorbs one enemy hit with grace but cannot prevent void death', async ({ page }) => {
    await startStage(page);
    await page.evaluate(() => {
        const scene = window.game.scene.getScene('GameScene');
        const player = scene.player;
        const beetle = scene.levelElements.beetles[0];
        player.giveBubbleShield();
        player.body.reset(beetle.x, beetle.y);
        player.body.setVelocity(0, 0);
    });
    await page.waitForFunction(() => !window.game.scene.getScene('GameScene').player.getPowerupStatus().shield);
    expect(await page.evaluate(() => {
        const player = window.game.scene.getScene('GameScene').player;
        return { hp: player.hp, grace: player.isInvincible };
    })).toEqual({ hp: 3, grace: true });

    await page.evaluate(() => {
        const scene = window.game.scene.getScene('GameScene');
        scene.player.invincibilityVersion++;
        scene.player.isInvincible = false;
        scene.player.takeDamage(1);
    });
    await page.waitForFunction(() => window.game.scene.getScene('GameScene').player.hp === 2);

    await page.evaluate(() => {
        const scene = window.game.scene.getScene('GameScene');
        const player = scene.player;
        player.isInvincible = false;
        player.giveBubbleShield();
        player.body.reset(player.x, scene.physics.world.bounds.height + 80);
    });
    await page.waitForFunction(() => window.game.scene.getScene('GameScene').player.isDead);
    expect(await page.evaluate(() => window.game.scene.getScene('GameScene').player.getPowerupStatus().shield)).toBe(false);
});
