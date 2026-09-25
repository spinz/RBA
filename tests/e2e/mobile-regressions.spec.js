const { test, expect, devices } = require('@playwright/test');

test.use({ ...devices['Pixel 7'] });

async function startByTouch(page, stage = 1) {
    await page.goto(`/?dev=1&level=${stage}`);
    await page.waitForFunction(() => window.game?.scene.isActive('TitleScene'));
    const start = page.getByRole('button', { name: 'Continue', exact: true });
    if (await start.isVisible()) {
        const bounds = await start.boundingBox();
        expect(bounds.height).toBeGreaterThanOrEqual(48);
        await start.tap();
    } else {
        const canvas = await page.locator('canvas').boundingBox();
        await page.touchscreen.tap(canvas.x + canvas.width / 2, canvas.y + canvas.height * 355 / 540);
    }
    await page.waitForFunction(() => window.game.scene.isActive('GameScene'));
}

test('Android multi-touch holds movement while jumping and attacking, then releases', async ({ page, context }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await startByTouch(page);
    await page.waitForFunction(() => window.game.scene.getScene('GameScene').player.body.blocked.down);
    const cdp = await context.newCDPSession(page);
    const point = async (name, id) => {
        const box = await page.getByRole('button', { name, exact: true }).boundingBox();
        return { x: box.x + box.width / 2, y: box.y + box.height / 2, id };
    };
    const right = await point('Right', 1);
    const jump = await point('Jump', 2);
    const lash = await point('Tongue attack', 3);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [right] });
    await page.waitForFunction(() => window.game.scene.getScene('GameScene').player.body.velocity.x > 50);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [right, jump, lash] });
    await page.waitForFunction(() => {
        const s = window.game.scene.getScene('GameScene');
        return s.player.body.velocity.x > 50 && s.player.body.velocity.y < -100 && s.player.tongueActive;
    });
    expect(await page.evaluate(() => window.game.scene.getScene('GameScene').ui.touchInputs.right)).toBe(true);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [right] });
    expect(await page.evaluate(() => window.game.scene.getScene('GameScene').ui.touchInputs.right)).toBe(true);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
    expect(await page.evaluate(() => {
        const input = window.game.scene.getScene('GameScene').ui.touchInputs;
        return input.right || input.jump || input.tongue;
    })).toBe(false);
    expect(errors).toEqual([]);
});

for (const attack of ['tongue', 'stomp', 'spitball']) {
    test(`Android actual ${attack} collision defeats Croaker without crashing`, async ({ page }) => {
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await startByTouch(page, 4);
        await page.evaluate(() => {
            const s = window.game.scene.getScene('GameScene');
            s.player.body.reset(1800, 500);
            s.player.isInvincible = true;
            s.triggerBossArena();
        });
        await page.waitForFunction(() => window.game.scene.getScene('GameScene').levelElements.boss.state === 'IDLE');
        await page.evaluate(attack => {
            const s = window.game.scene.getScene('GameScene');
            const boss = s.levelElements.boss;
            boss.hp = 1;
            boss.body.reset(2100, 520);
            boss.nextAttackTime = Infinity;
            if (attack === 'stomp') {
                s.player.body.reset(2100, 450);
                s.player.body.setVelocityY(200);
            } else if (attack === 'tongue') {
                s.player.body.reset(1995, 540);
                s.player.facing = 'right';
            } else {
                s.player.body.reset(1995, 540);
                s.player.facing = 'right';
                s.player.loadSpitProjectile();
            }
        }, attack);
        if (attack !== 'stomp') await page.getByRole('button', { name: 'Tongue attack' }).tap();
        await page.waitForFunction(() => window.game.scene.getScene('GameScene').levelElements.boss.state === 'DEFEATED');
        // A stomp may land directly on the reward, so it can be collected in the
        // same frame it spawns. Either way progression must finish unaided.
        await page.waitForFunction(() => window.game.scene.getScene('GameScene').levelIndex === 4);
        expect(errors).toEqual([]);
    });
}

test('six real projectile hits finish the encounter and the ending requires an explicit action', async ({ page }, testInfo) => {
    test.setTimeout(45000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await startByTouch(page, 4);
    await page.evaluate(() => {
        const s = window.game.scene.getScene('GameScene');
        s.player.body.reset(1800, 500);
        s.player.isInvincible = true;
        s.triggerBossArena();
        // This test isolates firing/collision/invulnerability/reward behavior.
        // The attack state machine has separate coverage; random jumps can dodge
        // a scripted shot between recovery ending and the next browser action.
        s.levelElements.boss.decideNextAttack = () => {};
    });
    await page.waitForFunction(() => window.game.scene.getScene('GameScene').levelElements.boss.state === 'IDLE');
    for (let hp = 6; hp > 0; hp--) {
        await page.evaluate(() => {
            const s = window.game.scene.getScene('GameScene');
            const b = s.levelElements.boss;
            b.body.reset(2200, 520);
            b.nextAttackTime = Infinity;
            s.player.body.reset(2100, 540);
            s.player.facing = 'right';
            s.player.loadSpitProjectile();
        });
        await page.getByRole('button', { name: 'Tongue attack' }).tap();
        await page.waitForFunction(hp => window.game.scene.getScene('GameScene').levelElements.boss.hp === hp, hp - 1);
        if (hp > 1) await page.waitForFunction(() => !window.game.scene.getScene('GameScene').levelElements.boss.isInvincible);
    }
    await page.waitForFunction(() => window.game.scene.getScene('GameScene').levelIndex === 4);
    await page.evaluate(() => {
        const s = window.game.scene.getScene('GameScene');
        s.player.body.reset(s.currentLevel.goal.x, s.currentLevel.goal.y);
    });
    await page.waitForFunction(() => window.game.scene.isActive('VictoryScene'));
    await page.screenshot({ path: testInfo.outputPath('android-ending.png') });
    const canvas = await page.locator('canvas').boundingBox();
    await page.touchscreen.tap(canvas.x + 20, canvas.y + 20);
    await page.evaluate(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', code: 'Space', keyCode: 32, repeat: true })));
    expect(await page.evaluate(() => window.game.scene.isActive('VictoryScene'))).toBe(true);
    await page.getByRole('button', { name: 'Main menu', exact: true }).tap();
    await page.waitForFunction(() => window.game.scene.isActive('TitleScene'));
    expect(errors).toEqual([]);
});

test('masked touch hints and unavailable pointer capture still permit play', async ({ page }) => {
    await page.addInitScript(() => {
        Object.defineProperty(navigator, 'maxTouchPoints', { get: () => 0 });
        const matchMedia = window.matchMedia.bind(window);
        window.matchMedia = query => query.includes('pointer: coarse') ? { matches: false } : matchMedia(query);
        Element.prototype.setPointerCapture = () => { throw new Error('Capture unavailable'); };
    });
    await startByTouch(page);
    // Starting by touch is enough to reveal controls, even with masked hints.
    await expect(page.getByRole('button', { name: 'Jump', exact: true })).toBeVisible();
    await page.waitForFunction(() => window.game.scene.getScene('GameScene').player.body.blocked.down);
    await page.getByRole('button', { name: 'Jump', exact: true }).tap();
    await page.waitForFunction(() => window.game.scene.getScene('GameScene').player.body.velocity.y < 0);
    await page.getByRole('button', { name: 'Pause or resume (touch)' }).tap();
    await page.waitForFunction(() => window.game.scene.getScene('GameScene').isPaused);
    await page.getByRole('button', { name: 'Pause or resume (touch)' }).tap();
    await page.waitForFunction(() => !window.game.scene.getScene('GameScene').isPaused);
});

test('rotation and fullscreen retain reachable controls and a working pause button', async ({ page }) => {
    await startByTouch(page);
    await page.setViewportSize({ width: 839, height: 412 });
    await page.getByRole('button', { name: 'Toggle fullscreen' }).tap();
    await page.waitForFunction(() => Boolean(document.fullscreenElement));
    for (const name of ['Left', 'Right', 'Jump', 'Tongue attack', 'Pause or resume (touch)']) {
        const button = page.getByRole('button', { name, exact: true });
        await expect(button).toBeVisible();
        expect(await button.evaluate(el => {
            const r = el.getBoundingClientRect();
            return document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2) === el;
        })).toBe(true);
    }
    await page.getByRole('button', { name: 'Pause or resume (touch)' }).tap();
    await page.waitForFunction(() => window.game.scene.getScene('GameScene').isPaused);
    await page.getByRole('button', { name: 'Pause or resume (touch)' }).tap();
    await page.waitForFunction(() => !window.game.scene.getScene('GameScene').isPaused);
    await page.evaluate(() => document.exitFullscreen());
});

test('combat bursts are finite and destroyed shockwaves leave no looping tweens', async ({ page }) => {
    await startByTouch(page, 4);
    expect(await page.evaluate(() => {
        const s = window.game.scene.getScene('GameScene');
        s.levelElements.boss.emitDust(14);
        const burst = s.children.list.at(-1);
        s.testWave = new window.BossShockwave(s, 500, 400);
        s.testWave.destroy();
        return { emitting: burst.emitting, particles: burst.getAliveParticleCount() };
    })).toEqual({ emitting: false, particles: 14 });
    await page.waitForFunction(() => {
        const s = window.game.scene.getScene('GameScene');
        return s.tweens.getTweensOf(s.testWave).length === 0;
    });
});
