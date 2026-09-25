/**
 * Level Layouts & Level Builder (V2 HD Upgrade)
 * Generates platforms, water pits, spring mushrooms, floating lilypads, cattails, mist, collectibles, and enemies.
 */
class LevelBuilder {
    static getLevels() {
        const levels = window.RbaLevelData;
        if (!Array.isArray(levels)) throw new Error('Canonical level data is unavailable');
        return structuredClone(levels);
    }

    static build(scene, levelData) {
        // Set world bounds
        scene.physics.world.setBounds(0, 0, levelData.width, levelData.height);
        scene.cameras.main.setBounds(0, 0, levelData.width, levelData.height);

        // Layer 0: High Sky Parallax
        const skyKey = levelData.skyKey || 'bg_sky';
        const bgSky = scene.add.tileSprite(0, 0, levelData.width, levelData.height, skyKey)
            .setOrigin(0, 0)
            .setScrollFactor(0.12, 0.25);

        // Layer 1: Distant Background Parallax
        const treesKey = levelData.treesKey || 'bg_trees';
        const bgTrees = scene.add.tileSprite(0, 140, levelData.width, 384, treesKey)
            .setOrigin(0, 0)
            .setScrollFactor(0.35, 0.65);

        // Decorative Cattails
        if (levelData.cattails) {
            levelData.cattails.forEach(c => {
                scene.add.image(c.x, c.y, 'cattails').setOrigin(0.5, 1).setDepth(2);
            });
        }

        // Decorative Wall Torches
        if (levelData.torches) {
            levelData.torches.forEach(t => {
                const torch = scene.add.image(t.x, t.y, 'boss_torch').setOrigin(0.5, 1).setDepth(3);
                scene.tweens.add({
                    targets: torch,
                    scaleY: 1.08,
                    scaleX: 1.04,
                    duration: 180 + Phaser.Math.Between(-30, 30),
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
            });
        }

        // Decorative Carved Monolith Pillars
        if (levelData.pillars) {
            levelData.pillars.forEach(p => {
                scene.add.image(p.x, p.y, 'boss_pillar').setOrigin(0.5, 1).setDepth(3);
            });
        }

        // Platform Groups
        const platforms = scene.physics.add.staticGroup();
        const mushrooms = scene.physics.add.staticGroup();
        const lilypads = scene.physics.add.staticGroup();
        const waterGroup = scene.physics.add.staticGroup();

        // Build Solid Ground / Platforms
        const grassKey = levelData.grassKey || 'tile_grass';
        const dirtKey = levelData.dirtKey || 'tile_dirt';

        levelData.platforms.forEach(p => {
            const tileSize = 32;
            const cols = Math.ceil(p.w / tileSize);
            const rows = Math.ceil(p.h / tileSize);

            for (let c = 0; c < cols; c++) {
                for (let r = 0; r < rows; r++) {
                    const tx = p.x + c * tileSize + 16;
                    const ty = p.y + r * tileSize + 16;
                    const tileKey = (r === 0) ? grassKey : dirtKey;
                    const tile = platforms.create(tx, ty, tileKey).setDepth(5);
                    tile.refreshBody();
                }
            }
        });

        // Build Floating Lilypads
        if (levelData.lilypads) {
            levelData.lilypads.forEach(lp => {
                const pad = lilypads.create(lp.x, lp.y, 'lilypad').setDepth(6);
                pad.body.setSize(56, 12);
                pad.body.setOffset(4, 4);
                pad.refreshBody();
            });
        }

        // Build Spring Mushrooms (36x36)
        if (levelData.mushrooms) {
            levelData.mushrooms.forEach(m => {
                const shroom = mushrooms.create(m.x, m.y, 'mushroom_spring').setDepth(6);
                shroom.body.setSize(30, 16);
                shroom.body.setOffset(3, 8);
                shroom.refreshBody();
            });
        }

        // Build Water Hazards
        const waterKey = levelData.waterKey || 'tile_water';
        if (levelData.waterPits) {
            levelData.waterPits.forEach(wp => {
                const cols = Math.ceil(wp.w / 32);
                for (let c = 0; c < cols; c++) {
                    const wx = wp.x + c * 32 + 16;
                    const wy = wp.y + 16;
                    const water = waterGroup.create(wx, wy, waterKey).setDepth(7);
                    water.refreshBody();
                }
            });
        }

        // Collectibles: Fireflies
        const firefliesGroup = scene.physics.add.group({
            allowGravity: false,
            immovable: true
        });

        if (levelData.fireflies) {
            levelData.fireflies.forEach(ff => {
                const item = firefliesGroup.create(ff.x, ff.y, 'firefly', 0).setDepth(8);
                item.play('firefly_glow');
                item.body.setSize(16, 16);
                item.onSwallowed = (player) => {
                    scene.events.emit('add_firefly', item.x, item.y);
                    item.destroy();
                };
            });
        }

        // Golden Lotus Power-Up
        const lotusGroup = scene.physics.add.group({
            allowGravity: false,
            immovable: true
        });

        if (levelData.goldenLotus) {
            levelData.goldenLotus.forEach(gl => {
                const lotus = lotusGroup.create(gl.x, gl.y, 'golden_lotus').setDepth(8);
                scene.tweens.add({
                    targets: lotus,
                    y: gl.y - 10,
                    duration: 900,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
                lotus.onSwallowed = (player) => {
                    player.giveStarPower();
                    scene.events.emit('add_score', 500, lotus.x, lotus.y);
                    lotus.destroy();
                };
            });
        }

        // Goal Shrine
        let goal = null;
        if (levelData.goal) {
            goal = scene.physics.add.staticSprite(levelData.goal.x, levelData.goal.y, 'goal_shrine').setDepth(6);
            goal.refreshBody();
            if (levelData.boss) {
                // Goal is unlocked upon defeating King Croaker
                goal.setVisible(false);
                goal.body.enable = false;
            }
        }

        // Arena Gate (Spiked Portcullis)
        let arenaGate = null;
        if (levelData.arenaGate) {
            arenaGate = scene.physics.add.staticSprite(levelData.arenaGate.x, levelData.arenaGate.y, 'boss_gate').setDepth(7);
            arenaGate.refreshBody();
            arenaGate.setVisible(false);
            arenaGate.body.enable = false;
        }

        // Boss King Croaker
        let boss = null;
        if (levelData.boss) {
            boss = new BossKingCroaker(scene, levelData.boss.x, levelData.boss.y);
        }

        // Regular Enemies
        const beetles = [];
        if (levelData.beetles) {
            levelData.beetles.forEach(b => {
                const beetle = new MudBeetle(scene, b.x, b.y, b.patrol);
                beetle.setDepth(6);
                beetles.push(beetle);
            });
        }

        const mosquitoes = [];
        if (levelData.mosquitoes) {
            levelData.mosquitoes.forEach(m => {
                const mosquito = new HoverMosquito(scene, m.x, m.y, m.range);
                mosquito.setDepth(6);
                mosquitoes.push(mosquito);
            });
        }

        const powerupsGroup = scene.physics.add.group({ allowGravity: false, immovable: true });
        for (const data of levelData.powerups || []) {
            powerupsGroup.add(window.Powerups.create(scene, data));
        }

        const enemyProjectiles = scene.physics.add.group({ allowGravity: false });
        const depthEnemies = scene.physics.add.group();
        const chargingBeetles = (levelData.chargingBeetles || []).map(data => {
            const enemy = new window.ChargingBeetle(scene, data.x, data.y, data.patrol);
            depthEnemies.add(enemy);
            return enemy;
        });
        const reedSpitters = (levelData.reedSpitters || []).map(data => {
            const enemy = new window.ReedSpitter(scene, data.x, data.y, enemyProjectiles, data.range);
            depthEnemies.add(enemy);
            return enemy;
        });

        return {
            platforms,
            lilypads,
            mushrooms,
            waterGroup,
            firefliesGroup,
            lotusGroup,
            goal,
            arenaGate,
            boss,
            beetles,
            mosquitoes,
            powerupsGroup,
            enemyProjectiles,
            depthEnemies,
            chargingBeetles,
            reedSpitters
        };
    }
}

window.LevelBuilder = LevelBuilder;
