const { test, expect } = require('@playwright/test');

async function startStage(page, level = 1) {
    await page.goto(`/?dev=1&level=${level}`);
    await page.waitForFunction(() => window.game?.scene.isActive('TitleScene'));
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => window.game?.scene.isActive('GameScene'));
}

test('boss defeat spawns a reachable reward and progresses to the final stage', async ({ page }, testInfo) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await startStage(page, 4);
    await page.evaluate(() => {
        const scene = window.game.scene.getScene('GameScene');
        scene.player.body.reset(1600, 480);
        scene.player.isInvincible = true;
        scene.triggerBossArena();
    });
    await page.waitForFunction(() => window.game.scene.getScene('GameScene').levelElements.boss.state === 'IDLE');
    await page.screenshot({ path: testInfo.outputPath('boss-encounter.png') });
    await page.evaluate(() => {
        const scene = window.game.scene.getScene('GameScene');
        scene.levelElements.boss.hp = 1;
        scene.levelElements.boss.takeTongueDamage(scene.player);
    });
    await expect.poll(() => page.evaluate(() => {
        const scene = window.game.scene.getScene('GameScene');
        return scene.children.list.some(child => child.active && child.texture?.key === 'golden_lotus' && child.depth === 15);
    })).toBe(true);
    await page.screenshot({ path: testInfo.outputPath('boss-reward.png') });
    expect(errors).toEqual([]);
    await page.evaluate(() => {
        const scene = window.game.scene.getScene('GameScene');
        const lotus = scene.children.list.find(child => child.active && child.texture?.key === 'golden_lotus' && child.depth === 15);
        scene.player.body.reset(lotus.x, lotus.y);
    });
    await page.waitForFunction(() => window.game.scene.getScene('GameScene').levelIndex === 4);
    await page.evaluate(() => {
        const scene = window.game.scene.getScene('GameScene');
        scene.player.body.reset(scene.currentLevel.goal.x, scene.currentLevel.goal.y);
    });
    await page.waitForFunction(() => window.game.scene.isActive('VictoryScene'));
    expect(await page.evaluate(() => window.soundEngine.track)).toBe('victory');
    await page.reload();
    await page.waitForFunction(() => window.game?.scene.isActive('TitleScene'));
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => window.game.scene.isActive('VictoryScene'));
    expect(errors).toEqual([]);
});

test('movement, tongue, pause, and all shrine transitions run without browser errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await startStage(page);
    await page.keyboard.down('ArrowRight');
    await page.waitForFunction(() => window.game.scene.getScene('GameScene').player.x > 130);
    await page.keyboard.up('ArrowRight');
    await page.keyboard.down('Space');
    await page.waitForFunction(() => window.game.scene.getScene('GameScene').player.body.velocity.y < -100);
    await page.keyboard.up('Space');
    await page.keyboard.press('x');
    await page.waitForFunction(() => window.game.scene.getScene('GameScene').player.tongueActive);
    await page.waitForFunction(() => !window.game.scene.getScene('GameScene').player.tongueActive);
    expect(await page.evaluate(() => window.game.scene.getScene('GameScene').player.tongueTip.body.enable)).toBe(false);
    await page.keyboard.press('p');
    await page.waitForFunction(() => window.game.scene.getScene('GameScene').isPaused);
    expect(await page.evaluate(() => [window.soundEngine.paused, window.soundEngine.voices.size])).toEqual([true, 0]);
    await page.keyboard.press('p');
    await page.waitForFunction(() => !window.game.scene.getScene('GameScene').isPaused);
    for (let stage = 0; stage < 3; stage++) {
        await page.evaluate(() => {
            const scene = window.game.scene.getScene('GameScene');
            scene.player.body.reset(scene.currentLevel.goal.x, scene.currentLevel.goal.y);
        });
        await page.waitForFunction(index => window.game.scene.getScene('GameScene').levelIndex === index, stage + 1);
        expect(await page.evaluate(() => window.soundEngine.currentLevelIdx)).toBe(stage + 1);
    }
    expect(errors).toEqual([]);
});

for (const attack of ['executeMeteorSlam', 'executeTongueSweep']) {
    test(`defeat during ${attack} cancels pending attacks`, async ({ page }) => {
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await startStage(page, 4);
        await page.evaluate(method => {
            const scene = window.game.scene.getScene('GameScene');
            scene.player.isInvincible = true;
            const boss = scene.levelElements.boss;
            boss[method]();
            if (method === 'executeMeteorSlam') scene.ui.reducedMotion = true;
        }, attack);
        if (attack === 'executeTongueSweep') {
            await page.waitForFunction(() => window.game.scene.getScene('GameScene').levelElements.boss.tongueSweepActive);
        }
        await page.evaluate(() => {
            const scene = window.game.scene.getScene('GameScene');
            const boss = scene.levelElements.boss;
            boss.hp = 1;
            boss.takeTongueDamage(scene.player);
        });
        await page.waitForFunction(() => Boolean(window.game.scene.getScene('GameScene').victoryLotus?.active));
        expect(await page.evaluate(() => window.game.scene.getScene('GameScene').levelElements.boss.state)).toBe('DEFEATED');
        expect(errors).toEqual([]);
    });
}

test.describe('touch and layout', () => {
    test.use({ hasTouch: true });
    for (const viewport of [{ width: 1440, height: 900 }, { width: 844, height: 390 }, { width: 390, height: 844 }]) {
        test(`controls remain usable at ${viewport.width}x${viewport.height}`, async ({ page }, testInfo) => {
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.setViewportSize(viewport);
            await page.goto('/');
            await page.waitForFunction(() => window.game?.scene.isActive('TitleScene'));
            await page.screenshot({ path: testInfo.outputPath('title.png') });
            await page.evaluate(() => window.game.scene.getScene('TitleScene').showSettings());
            await page.getByLabel('Reduced motion').check();
            await page.screenshot({ path: testInfo.outputPath('settings.png') });
            await page.getByRole('button', { name: 'Back to menu' }).tap();
            await page.keyboard.press('Enter');
            await page.waitForFunction(() => window.game.scene.isActive('GameScene'));
            for (const label of ['Left', 'Right', 'Tongue attack', 'Jump']) {
                const bounds = await page.getByRole('button', { name: label, exact: true }).boundingBox();
                expect(bounds.width).toBeGreaterThanOrEqual(48);
                expect(bounds.height).toBeGreaterThanOrEqual(48);
            }
            await page.waitForFunction(() => window.game.scene.getScene('GameScene').player.body.blocked.down);
            await page.getByRole('button', { name: 'Jump', exact: true }).tap();
            await page.waitForFunction(() => window.game.scene.getScene('GameScene').player.body.velocity.y < 0);
            await page.getByRole('button', { name: 'Pause or resume game' }).tap();
            await page.waitForFunction(() => window.game.scene.getScene('GameScene').isPaused);
            await page.screenshot({ path: testInfo.outputPath('paused.png') });
            await page.getByRole('button', { name: 'Restart stage' }).tap();
            await page.waitForFunction(() => !window.game.scene.getScene('GameScene').isPaused);
            await expect(page.locator('.touch-controls')).toHaveCount(1);
            await page.screenshot({ path: testInfo.outputPath('gameplay.png') });
            expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
            expect(errors).toEqual([]);
        });
    }
});

test('an unavailable audio device does not prevent gameplay', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => {
        window.AudioContext = undefined;
        window.webkitAudioContext = undefined;
    });
    await startStage(page);
    await page.keyboard.press('Space');
    await page.keyboard.press('x');
    await page.evaluate(() => window.game.scene.getScene('GameScene').completeLevel());
    await page.waitForFunction(() => window.game.scene.getScene('GameScene').levelIndex === 1);
    expect(errors).toEqual([]);
});

test('restart, death, retry and reload keep stage checkpoints and a single score listener', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await startStage(page);
    await page.evaluate(() => {
        const scene = window.game.scene.getScene('GameScene');
        scene.scene.restart({ levelIndex: 1, score: 1250, fireflies: 4 });
    });
    await page.waitForFunction(() => window.game.scene.getScene('GameScene').levelIndex === 1);
    for (let attempt = 0; attempt < 3; attempt++) {
        await page.evaluate(() => {
            const scene = window.game.scene.getScene('GameScene');
            scene.events.emit('add_firefly', scene.player.x, scene.player.y);
        });
        expect(await page.evaluate(() => {
            const scene = window.game.scene.getScene('GameScene');
            return [scene.ui.score, scene.ui.fireflies, scene.events.listenerCount('add_firefly')];
        })).toEqual([1300, 5, 1]);
        await page.keyboard.press('r');
        await page.waitForFunction(() => window.game.scene.getScene('GameScene').ui.score === 1250);
    }
    await page.evaluate(() => {
        const scene = window.game.scene.getScene('GameScene');
        scene.ui.addScore(250);
        scene.player.die();
    });
    await page.waitForFunction(() => window.game.scene.isActive('GameOverScene'));
    await page.keyboard.press('Space');
    await page.waitForFunction(() => window.game.scene.isActive('GameScene'));
    expect(await page.evaluate(() => window.game.scene.getScene('GameScene').ui.score)).toBe(1250);
    await page.evaluate(() => window.StorageManager.save({ unlockedStage: 1 }));
    await page.goto('/');
    await page.waitForFunction(() => window.game?.scene.isActive('TitleScene'));
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => window.game.scene.isActive('GameScene'));
    expect(await page.evaluate(() => {
        const scene = window.game.scene.getScene('GameScene');
        return [scene.levelIndex, scene.ui.score, scene.ui.fireflies];
    })).toEqual([1, 1250, 4]);
    expect(errors).toEqual([]);
});

test('audio remembers silent stage changes, pauses, and clears all voices', async ({ page }) => {
    await startStage(page);
    expect(await page.evaluate(() => {
        const sound = window.soundEngine;
        sound.setMuted(true);
        sound.startMusic(2);
        sound.startBossMusic();
        sound.setPaused(true);
        sound.setMuted(false);
        return [sound.track, sound.voices.size, sound.musicTimer];
    })).toEqual(['boss', 0, null]);
    await page.evaluate(() => window.soundEngine.setPaused(false));
    expect(await page.evaluate(() => window.soundEngine.bossMusicPlaying)).toBe(true);
    await page.evaluate(() => window.soundEngine.setTrack('victory'));
    expect(await page.evaluate(() => window.soundEngine.bossMusicPlaying)).toBe(false);
    await page.evaluate(() => { window.soundEngine.playWin(); window.soundEngine.setMuted(true); });
    expect(await page.evaluate(() => window.soundEngine.voices.size)).toBe(0);
});

test('ten simulated minutes of boss attacks recover in all three health phases', async ({ page }) => {
    await startStage(page, 4);
    const result = await page.evaluate(() => {
        const game = window.game;
        const scene = game.scene.getScene('GameScene');
        const boss = scene.levelElements.boss;
        game.loop.stop();
        window.soundEngine.setMuted(true);
        scene.player.isInvincible = true;
        scene.player.body.reset(1750, 480);
        boss.activateEncounter();
        const visited = new Set();
        let idleCount = 0;
        let lastState = boss.state;
        let stateSince = scene.time.now;
        let longestState = 0;
        const start = scene.time.now;
        let attack = 0;
        boss.decideNextAttack = () => {
            [() => boss.executeMeteorSlam(), () => boss.executeVenomSpit(), () => boss.executeTongueSweep()][attack++ % 3]();
        };
        for (let frame = 1; frame <= 36000; frame++) {
            const now = start + frame * (1000 / 60);
            boss.hp = frame <= 12000 ? 6 : frame <= 24000 ? 4 : 2;
            scene.time.preUpdate(now, 1000 / 60);
            scene.time.update(now, 1000 / 60);
            scene.physics.world.update(now, 1000 / 60);
            scene.physics.world.postUpdate();
            boss.update(now, 1000 / 60);
            visited.add(boss.state);
            if (lastState !== boss.state) {
                longestState = Math.max(longestState, now - stateSince);
                if (boss.state === 'IDLE') idleCount++;
                lastState = boss.state;
                stateSince = now;
            }
            if (now - stateSince > 8000) throw new Error(`Boss stuck in ${boss.state}`);
        }
        boss.defeat();
        const activeHazards = boss.shockwaves.countActive() + boss.venomBalls.countActive();
        return { visited: [...visited], idleCount, longestState, activeHazards };
    });
    expect(result.visited).toEqual(expect.arrayContaining(['IDLE', 'WINDUP', 'JUMP_UP', 'AIR_AIM', 'SLAM_DOWN', 'STUNNED', 'SPIT', 'TONGUE']));
    expect(result.idleCount).toBeGreaterThan(60);
    expect(result.longestState).toBeLessThan(8000);
    expect(result.activeHazards).toBe(0);
});

test('settings and stage map work by keyboard without activating the menu underneath', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => window.game?.scene.isActive('TitleScene'));
    await page.keyboard.press('ArrowUp');
    await page.waitForFunction(() => window.game.scene.getScene('TitleScene').menuIndex === 3);
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog', { name: 'Settings' });
    await expect(dialog).toBeVisible();
    await page.getByLabel('Reduced flashing').check();
    await page.getByLabel('Mute audio').check();
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await page.keyboard.press('ArrowUp');
    await page.waitForFunction(() => window.game.scene.getScene('TitleScene').menuIndex === 2);
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog', { name: 'Stage map' })).toBeVisible();
    await expect(page.getByRole('button', { name: '2. Cattail Canopy — Locked' })).toBeDisabled();
    await page.getByRole('button', { name: '1. Lilypad Lagoon' }).click();
    await page.waitForFunction(() => window.game.scene.isActive('GameScene'));
    expect(await page.evaluate(() => window.StorageManager.load().profile.settings.reducedFlashing)).toBe(true);
});

test('muting and unmuting preserves the boss soundtrack', async ({ page }) => {
    await startStage(page, 4);
    const state = await page.evaluate(() => {
        const sound = window.soundEngine;
        sound.startBossMusic();
        sound.setMuted(true);
        sound.setMuted(false);
        return { boss: sound.bossMusicPlaying, stage: sound.musicPlaying };
    });
    expect(state).toEqual({ boss: true, stage: false });
});
