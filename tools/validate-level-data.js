const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const levelsPath = path.join(projectRoot, 'src', 'web', 'data', 'levels.json');
const schemaPath = path.join(projectRoot, 'src', 'web', 'data', 'level.schema.json');
const levels = JSON.parse(fs.readFileSync(levelsPath, 'utf8'));
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
const failures = [];
const fail = (label, message) => failures.push(`${label}: ${message}`);
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const finite = value => typeof value === 'number' && Number.isFinite(value);
const checkKeys = (value, allowed, label) => {
    if (!isObject(value)) {
        fail(label, 'expected object');
        return false;
    }
    for (const key of Object.keys(value)) if (!allowed.includes(key)) fail(`${label}.${key}`, 'unknown property');
    return true;
};
const checkPoint = (value, label, level, validateShape = true) => {
    if (validateShape && !checkKeys(value, ['x', 'y'], label)) return;
    if (!isObject(value)) return;
    if (!finite(value.x) || !finite(value.y)) return fail(label, 'x and y must be finite numbers');
    if (value.x < 0 || value.x > level.width || value.y < 0 || value.y > level.height) fail(label, 'coordinate is outside level bounds');
};
const checkRect = (value, label, level, keys = ['x', 'y', 'w', 'h'], extraKeys = []) => {
    if (!checkKeys(value, [...keys, ...extraKeys], label)) return;
    if (!keys.every(key => finite(value[key]))) return fail(label, 'rectangle coordinates and dimensions must be finite numbers');
    const widthKey = keys.includes('w') ? 'w' : 'width';
    const heightKey = keys.includes('h') ? 'h' : 'height';
    if (value.x < 0 || value.y < 0 || value[widthKey] <= 0 || value[heightKey] <= 0 || value.x + value[widthKey] > level.width || value.y + value[heightKey] > level.height) fail(label, 'rectangle is invalid or outside level bounds');
};
const array = (level, key, label) => {
    if (level[key] === undefined) return [];
    if (!Array.isArray(level[key])) {
        fail(`${label}.${key}`, 'expected array');
        return [];
    }
    return level[key];
};
const checkOptionalPointArray = (level, key, label) => array(level, key, label).forEach((item, i) => checkPoint(item, `${label}.${key}[${i}]`, level));
const checkSurfacePlacement = (level, item, kind, label) => {
    // These body offsets are taken from the authored Arcade objects: charging
    // beetle feet are about y+24, reed-spitter feet y+31, and pickups float.
    const offsets = { chargingBeetles: 24, reedSpitters: 31, powerups: 0 };
    const footY = item.y + offsets[kind];
    const platformSupport = level.platforms.some(platform =>
        item.x >= platform.x - 28 && item.x <= platform.x + platform.w + 28 &&
        Math.abs(footY - platform.y) <= (kind === 'powerups' ? 56 : 16)
    );
    const softSupport = kind === 'powerups' && [...(level.lilypads || []), ...(level.mushrooms || [])].some(surface =>
        Math.abs(item.x - surface.x) <= 36 && Math.abs((item.y + 14) - (surface.y - 8)) <= 30
    );
    const hasNearbyTop = platformSupport || softSupport;
    if (!hasNearbyTop) fail(label, 'placement has no plausible nearby supporting platform');
};

if (!Array.isArray(levels) || levels.length !== 5) fail('levels.json', 'expected exactly five canonical levels');
if (schema.maxItems !== 5 || schema.minItems !== 5) fail('level.schema.json', 'schema must require exactly five levels');
const topLevelKeys = ['id', 'name', 'objective', 'intro', 'width', 'height', 'playerStart', 'platforms', 'goal', 'boss', 'arenaGate', 'arenaBounds', 'waterPits', 'fireflies', 'goldenLotus', 'lilypads', 'mushrooms', 'beetles', 'mosquitoes', 'powerups', 'chargingBeetles', 'reedSpitters', 'routeHints', 'cattails', 'torches', 'pillars', 'skyKey', 'treesKey', 'grassKey', 'dirtKey', 'waterKey'];
const ids = new Set();
for (const [index, level] of (Array.isArray(levels) ? levels : []).entries()) {
    const label = `levels[${index}]`;
    if (!checkKeys(level, topLevelKeys, label)) continue;
    if (!Number.isInteger(level.id) || level.id < 1 || ids.has(level.id)) fail(`${label}.id`, 'must be a unique positive integer');
    ids.add(level.id);
    if (level.id !== index + 1) fail(`${label}.id`, 'the first five campaign levels must be ordered 1 through 5');
    if (typeof level.name !== 'string' || !level.name.trim()) fail(`${label}.name`, 'must be a non-empty string');
    for (const key of ['objective', 'intro']) if (level[key] !== undefined && (typeof level[key] !== 'string' || !level[key].trim())) fail(`${label}.${key}`, 'must be a non-empty string when provided');
    if (!finite(level.width) || !finite(level.height) || level.width <= 0 || level.height <= 0) {
        fail(label, 'width and height must be positive finite numbers');
        continue;
    }
    checkPoint(level.playerStart, `${label}.playerStart`, level);
    checkPoint(level.goal, `${label}.goal`, level);
    const platforms = array(level, 'platforms', label);
    platforms.forEach((platform, i) => {
        const pLabel = `${label}.platforms[${i}]`;
        checkRect(platform, pLabel, level, ['x', 'y', 'w', 'h'], ['type']);
        if (!isObject(platform)) return;
        if (platform.type !== 'ground' && platform.type !== 'grass') fail(`${pLabel}.type`, 'must be ground or grass');
    });
    array(level, 'waterPits', label).forEach((item, i) => checkRect(item, `${label}.waterPits[${i}]`, level));
    for (const key of ['fireflies', 'goldenLotus', 'lilypads', 'mushrooms', 'cattails', 'torches', 'pillars']) checkOptionalPointArray(level, key, label);

    for (const key of ['beetles', 'chargingBeetles']) array(level, key, label).forEach((item, i) => {
        const itemLabel = `${label}.${key}[${i}]`;
        if (!checkKeys(item, ['x', 'y', 'patrol'], itemLabel)) return;
        checkPoint(item, itemLabel, level, false);
        if (item.patrol !== undefined && (!finite(item.patrol) || item.patrol < 0)) fail(`${itemLabel}.patrol`, 'must be a non-negative finite number');
        if (key === 'chargingBeetles') checkSurfacePlacement(level, item, key, itemLabel);
    });
    for (const key of ['mosquitoes', 'reedSpitters']) array(level, key, label).forEach((item, i) => {
        const itemLabel = `${label}.${key}[${i}]`;
        if (!checkKeys(item, ['x', 'y', 'range'], itemLabel)) return;
        checkPoint(item, itemLabel, level, false);
        if (item.range !== undefined && (!finite(item.range) || item.range <= 0)) fail(`${itemLabel}.range`, 'must be a positive finite number');
        if (key === 'reedSpitters') checkSurfacePlacement(level, item, key, itemLabel);
    });
    array(level, 'powerups', label).forEach((item, i) => {
        const itemLabel = `${label}.powerups[${i}]`;
        if (!checkKeys(item, ['x', 'y', 'type'], itemLabel)) return;
        checkPoint(item, itemLabel, level, false);
        if (!['bubble_shield', 'long_tongue'].includes(item.type)) fail(`${itemLabel}.type`, 'unsupported power-up type');
        checkSurfacePlacement(level, item, 'powerups', itemLabel);
    });
    array(level, 'routeHints', label).forEach((hint, i) => {
        const hintLabel = `${label}.routeHints[${i}]`;
        if (!checkKeys(hint, ['x', 'y', 'text'], hintLabel)) return;
        checkPoint(hint, hintLabel, level, false);
        if (typeof hint.text !== 'string' || !hint.text.trim()) fail(`${hintLabel}.text`, 'must be a non-empty string');
    });
    if (level.boss !== undefined) {
        if (!checkKeys(level.boss, ['x', 'y', 'maxHp'], `${label}.boss`)) continue;
        checkPoint(level.boss, `${label}.boss`, level, false);
        if (!Number.isInteger(level.boss.maxHp) || level.boss.maxHp < 1) fail(`${label}.boss.maxHp`, 'must be a positive integer');
    }
    if (level.arenaGate !== undefined) {
        if (!checkKeys(level.arenaGate, ['x', 'y', 'triggerX'], `${label}.arenaGate`)) continue;
        for (const key of ['x', 'y', 'triggerX']) if (!finite(level.arenaGate[key]) || level.arenaGate[key] < 0 || level.arenaGate[key] > level.width) fail(`${label}.arenaGate.${key}`, 'must be a finite in-bounds number');
    }
    if (level.arenaBounds !== undefined) checkRect(level.arenaBounds, `${label}.arenaBounds`, level, ['x', 'y', 'width', 'height']);
    for (const key of ['skyKey', 'treesKey', 'grassKey', 'dirtKey', 'waterKey']) if (level[key] !== undefined && (typeof level[key] !== 'string' || !level[key].trim())) fail(`${label}.${key}`, 'must be a non-empty string');
}

if (failures.length) {
    console.error(failures.join('\n'));
    process.exitCode = 1;
} else {
    console.log(`Validated ${levels.length} canonical levels: schema shape, coordinates, types, bounds, and new-mechanic surfaces.`);
}
