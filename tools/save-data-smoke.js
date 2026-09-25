const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'web', 'js', 'save-data.js'), 'utf8');
const store = new Map();
const context = {
    window: {},
    structuredClone,
    localStorage: {
        getItem: key => store.get(key) ?? null,
        setItem: (key, value) => store.set(key, value)
    }
};
vm.runInNewContext(source, context, { filename: 'save-data.js' });
const manager = context.window.StorageManager;

const empty = manager.migrate(null);
assert.equal(empty.version, 2);
assert.equal(empty.profile.unlockedStage, 0);

const migrated = manager.migrate({ highScore: 900, unlockedStage: 2, totalFireflies: 14 });
assert.equal(migrated.profile.bestScore, 900);
assert.equal(migrated.profile.bestFireflyCount, 14);
assert.equal(migrated.unlockedStage, 2);

const malformed = manager.migrate({ profile: { unlockedStage: 'nope' }, run: null });
assert.equal(malformed.profile.unlockedStage, 0);
assert.equal(malformed.run.score, 0);

const future = manager.migrate({ version: 99, profile: { bestScore: 100000 } });
assert.equal(future.profile.bestScore, 0);

manager.save({ score: 1200, fireflies: 8, unlockedStage: 1 });
manager.save({ settings: { muted: true, reducedMotion: true } });
const loaded = manager.load();
assert.equal(loaded.highScore, 1200);
assert.equal(loaded.totalFireflies, 8);
assert.equal(loaded.profile.unlockedStage, 1);
assert.equal(loaded.profile.settings.muted, true);
assert.equal(loaded.profile.settings.reducedMotion, true);
manager.save({ bestScore: 2300, score: 1200, startOfStageScore: 1200, startOfStageFireflies: 8 });
assert.equal(manager.load().run.score, 1200);
assert.equal(manager.load().highScore, 2300);
assert.equal(manager.save({ settings: { muted: false } }).highScore, 2300);
manager.save({ completed: true });
assert.equal(manager.load().run.completed, true);
const newRun = manager.newRun();
assert.equal(newRun.run.score, 0);
assert.equal(newRun.run.completed, false);
assert.equal(newRun.profile.bestScore, 2300);
assert.equal(newRun.profile.unlockedStage, 1);
assert.equal(newRun.profile.settings.reducedMotion, true);
assert.equal(manager.migrate({ version: 2, run: { score: 500, carriedFireflies: 3 } }).run.startOfStageScore, 500);
console.log('Save-data migration checks passed.');
