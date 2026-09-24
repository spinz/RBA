const fs = require('fs');
const path = require('path');
const vm = require('vm');

const projectRoot = path.resolve(__dirname, '..');
const sourceRoot = path.join(projectRoot, 'src', 'web');
const firstPartyScripts = fs.readdirSync(path.join(sourceRoot, 'js'))
    .filter(name => name.endsWith('.js'))
    .filter(name => name !== 'constants.js');

const failures = [];
for (const name of firstPartyScripts) {
    const filename = path.join(sourceRoot, 'js', name);
    try {
        new vm.Script(fs.readFileSync(filename, 'utf8'), { filename });
    } catch (error) {
        failures.push(`${name}: ${error.message}`);
    }
}

const html = fs.readFileSync(path.join(sourceRoot, 'index.html'), 'utf8');
for (const required of ['game-canvas-container', 'crt-toggle-btn', 'fullscreen-btn']) {
    if (!html.includes(`id="${required}"`)) failures.push(`index.html: missing #${required}`);
}

const gameplayChecks = [
    ['enemies.js', "if (this.body.velocity.y >= 0)"],
    ['enemies.js', 'this.shockwaves.splice(i, 1)'],
    ['player.js', 'this.tongueTip.body.enable = false'],
    ['game.js', 'this.wasd.up.isDown']
];
for (const [name, expected] of gameplayChecks) {
    const source = fs.readFileSync(path.join(sourceRoot, 'js', name), 'utf8');
    if (!source.includes(expected)) failures.push(`${name}: missing regression guard ${expected}`);
}

if (!html.includes('src="/entry-2d.js"')) failures.push('index.html: missing Vite entry');
if (/src="phaser\.min\.js"/.test(html)) {
    failures.push('HTML still loads a committed vendor blob');
}
const gameSource = fs.readFileSync(path.join(sourceRoot, 'js', 'game.js'), 'utf8');
for (const label of ['CONTINUE', 'NEW ADVENTURE', 'STAGE MAP', 'SETTINGS']) {
    if (!gameSource.includes(label)) failures.push(`game.js: missing campaign menu item ${label}`);
}
if (!html.includes('data-dev-only')) failures.push('index.html: missing development-only stage controls');
for (const required of ['game-announcements', 'orientation-hint', 'aria-live="polite"']) {
    if (!html.includes(required)) failures.push(`index.html: missing accessibility element ${required}`);
}
for (const setting of ['reducedFlashing', 'screenShake', 'touchOpacity']) {
    if (!gameSource.includes(setting)) failures.push(`game.js: missing setting ${setting}`);
}
for (const tutorialText of ['MOVE WITH A / D', 'PRESS X OR SHIFT', 'TUTORIAL COMPLETE']) {
    if (!gameSource.includes(tutorialText)) failures.push(`game.js: missing onboarding prompt ${tutorialText}`);
}
for (const bossGuard of ['this.arenaTransitioning = true', 'startBossEncounter', 'spawnVictoryLotus(this.x, this.y - 28)']) {
    const source = bossGuard.startsWith('spawn') ? fs.readFileSync(path.join(sourceRoot, 'js', 'enemies.js'), 'utf8') : gameSource;
    if (!source.includes(bossGuard)) failures.push(`boss flow: missing regression guard ${bossGuard}`);
}

if (failures.length) {
    console.error(failures.join('\n'));
    process.exitCode = 1;
} else {
    console.log(`Checked ${firstPartyScripts.length} first-party scripts, gameplay guards, and the web shell.`);
}
