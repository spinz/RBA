const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const levelsPath = path.join(projectRoot, 'src', 'web', 'data', 'levels.json');
const schemaPath = path.join(projectRoot, 'src', 'web', 'data', 'level.schema.json');
const levels = JSON.parse(fs.readFileSync(levelsPath, 'utf8'));
JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

const failures = [];
const point = (value, label) => {
    if (!value || !Number.isFinite(value.x) || !Number.isFinite(value.y)) failures.push(`${label}: invalid point`);
};
const rect = (value, label) => {
    if (!value || !Number.isFinite(value.x) || !Number.isFinite(value.y) || !Number.isFinite(value.w) || !Number.isFinite(value.h) || value.w <= 0 || value.h <= 0) failures.push(`${label}: invalid rectangle`);
};

if (!Array.isArray(levels) || levels.length < 5) failures.push('levels.json: expected at least five levels');
const ids = new Set();
for (const [index, level] of (levels || []).entries()) {
    const label = `levels[${index}]`;
    if (!Number.isInteger(level.id) || level.id < 1 || ids.has(level.id)) failures.push(`${label}: duplicate or invalid id`);
    ids.add(level.id);
    if (typeof level.name !== 'string' || !level.name.trim()) failures.push(`${label}: missing name`);
    if (!Number.isFinite(level.width) || !Number.isFinite(level.height) || level.width <= 0 || level.height <= 0) failures.push(`${label}: invalid dimensions`);
    point(level.playerStart, `${label}.playerStart`);
    point(level.goal, `${label}.goal`);
    for (const [itemIndex, platform] of (level.platforms || []).entries()) rect(platform, `${label}.platforms[${itemIndex}]`);
    for (const key of ['waterPits']) for (const [itemIndex, item] of (level[key] || []).entries()) rect(item, `${label}.${key}[${itemIndex}]`);
    for (const key of ['fireflies', 'goldenLotus', 'lilypads', 'mushrooms', 'beetles', 'mosquitoes']) {
        for (const [itemIndex, item] of (level[key] || []).entries()) point(item, `${label}.${key}[${itemIndex}]`);
    }
}
if (failures.length) {
    console.error(failures.join('\n'));
    process.exitCode = 1;
} else {
    console.log(`Validated ${levels.length} canonical levels against the RBA level contract.`);
}
