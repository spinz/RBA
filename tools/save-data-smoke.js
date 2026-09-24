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
console.log('Save-data migration checks passed.');
