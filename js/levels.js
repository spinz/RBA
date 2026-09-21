/**
 * Level Layouts & Level Builder (V2 HD Upgrade)
 * Generates platforms, water pits, spring mushrooms, floating lilypads, cattails, mist, collectibles, and enemies.
 */
class LevelBuilder {
    static getLevels() {
        return [
            // --- LEVEL 1: Lilypad Lagoon ---
            {
                id: 1,
                name: "Lilypad Lagoon",
                width: 2800,
                height: 600,
                playerStart: { x: 90, y: 430 },
                platforms: [
                    // Start ground
                    { x: 0, y: 500, w: 500, h: 100, type: 'ground' },
                    // Step 1
                    { x: 380, y: 440, w: 120, h: 40, type: 'ground' },
                    // Island 1
                    { x: 640, y: 480, w: 220, h: 120, type: 'ground' },
                    // Floating elevated grass ledge
                    { x: 740, y: 350, w: 160, h: 32, type: 'grass' },
                    // High secret ledge
                    { x: 880, y: 220, w: 140, h: 32, type: 'grass' },
                    // Island 2
                    { x: 1120, y: 500, w: 320, h: 100, type: 'ground' },
                    // Low step
                    { x: 1340, y: 420, w: 100, h: 80, type: 'ground' },
                    // Floating ledge 2
                    { x: 1560, y: 380, w: 160, h: 32, type: 'grass' },
                    // Island 3
                    { x: 1840, y: 480, w: 260, h: 120, type: 'ground' },
                    // Final stretch ground
                    { x: 2320, y: 480, w: 500, h: 120, type: 'ground' }
                ],
                lilypads: [
                    // Crossing 1
                    { x: 570, y: 512 },
                    // Crossing 2
                    { x: 960, y: 512 },
                    { x: 1045, y: 508 },
                    // Crossing 3 (Fixed: Added stepping lilypad at 1620 to bridge 260px gap)
                    { x: 1490, y: 512 },
                    { x: 1620, y: 512 },
                    { x: 1750, y: 512 },
                    // Final lake crossing
                    { x: 2160, y: 512 },
                    { x: 2250, y: 508 }
                ],
                mushrooms: [
                    { x: 720, y: 462 },
                    { x: 1390, y: 402 },
                    // Recovery mushroom on lilypad to leap to high grass ledge
                    { x: 1490, y: 494 }
                ],
                cattails: [
                    { x: 470, y: 476 },
                    { x: 650, y: 456 },
                    { x: 830, y: 456 },
                    { x: 1140, y: 476 },
                    { x: 1410, y: 476 },
                    { x: 1860, y: 456 },
                    { x: 2340, y: 456 }
                ],
                waterPits: [
                    { x: 500, y: 530, w: 140, h: 70 },
                    { x: 860, y: 530, w: 260, h: 70 },
                    { x: 1440, y: 530, w: 400, h: 70 },
                    { x: 2100, y: 530, w: 220, h: 70 }
                ],
                fireflies: [
                    { x: 300, y: 440 }, { x: 340, y: 390 }, { x: 380, y: 360 },
                    { x: 550, y: 450 }, { x: 570, y: 420 }, { x: 590, y: 450 },
                    { x: 890, y: 170 }, { x: 920, y: 170 }, { x: 950, y: 170 }, { x: 980, y: 170 },
                    { x: 1160, y: 450 }, { x: 1200, y: 450 }, { x: 1240, y: 450 },
                    { x: 1440, y: 280 }, { x: 1500, y: 220 }, { x: 1560, y: 280 },
                    { x: 2160, y: 450 }, { x: 2200, y: 410 }, { x: 2250, y: 450 }
                ],
                goldenLotus: [
                    { x: 950, y: 130 }
                ],
                beetles: [
                    { x: 260, y: 482, patrol: 100 },
                    { x: 740, y: 462, patrol: 60 },
                    { x: 1220, y: 482, patrol: 70 },
                    { x: 1920, y: 462, patrol: 80 }
                ],
                mosquitoes: [
                    { x: 1000, y: 370, range: 60 },
                    { x: 1660, y: 290, range: 70 },
                    { x: 2200, y: 350, range: 60 }
                ],
                goal: { x: 2670, y: 424 }
            },

            // --- LEVEL 2: Cattail Canopy ---
            {
                id: 2,
                name: "Cattail Canopy",
                width: 3400,
                height: 650,
                playerStart: { x: 90, y: 480 },
                platforms: [
                    // Start
                    { x: 0, y: 550, w: 380, h: 100, type: 'ground' },
                    // Stepping towers
                    { x: 440, y: 470, w: 140, h: 180, type: 'ground' },
                    { x: 650, y: 390, w: 140, h: 260, type: 'ground' },
                    // Elevated sky bridges
                    { x: 860, y: 320, w: 180, h: 32, type: 'grass' },
                    { x: 1100, y: 250, w: 150, h: 32, type: 'grass' },
                    // Rest island
                    { x: 1340, y: 520, w: 320, h: 130, type: 'ground' },
                    // Floating stair jumps
                    { x: 1720, y: 440, w: 120, h: 32, type: 'grass' },
                    { x: 1920, y: 350, w: 120, h: 32, type: 'grass' },
                    { x: 2120, y: 260, w: 120, h: 32, type: 'grass' },
                    // High Canopy Plateau
                    { x: 2320, y: 200, w: 280, h: 32, type: 'grass' },
                    // Descent ledges (JEV-optimized: smoothed drops, wider landings)
                    { x: 2650, y: 310, w: 160, h: 32, type: 'grass' },
                    { x: 2860, y: 410, w: 160, h: 32, type: 'grass' },
                    // Final Goal Island
                    { x: 3080, y: 500, w: 320, h: 150, type: 'ground' }
                ],
                lilypads: [
                    { x: 410, y: 562 },
                    { x: 615, y: 562 },
                    { x: 825, y: 562 },
                    { x: 1280, y: 562 },
                    { x: 1700, y: 562 },
                    { x: 1870, y: 562 },
                    { x: 2070, y: 562 },
                    { x: 3045, y: 562 }
                ],
                mushrooms: [
                    { x: 720, y: 372 },
                    { x: 1500, y: 502 },
                    { x: 2420, y: 182 }
                ],
                cattails: [
                    { x: 350, y: 526 },
                    { x: 450, y: 446 },
                    { x: 660, y: 366 },
                    { x: 1360, y: 496 },
                    { x: 1620, y: 496 },
                    { x: 3100, y: 476 }
                ],
                waterPits: [
                    { x: 380, y: 580, w: 960, h: 70 },
                    { x: 1660, y: 580, w: 1420, h: 70 }
                ],
                fireflies: [
                    { x: 200, y: 480 }, { x: 240, y: 450 }, { x: 280, y: 480 },
                    { x: 480, y: 410 }, { x: 510, y: 410 },
                    { x: 900, y: 260 }, { x: 940, y: 260 }, { x: 980, y: 260 },
                    { x: 1140, y: 190 }, { x: 1180, y: 190 },
                    { x: 1440, y: 460 }, { x: 1480, y: 380 }, { x: 1520, y: 300 },
                    { x: 1960, y: 290 }, { x: 2160, y: 200 },
                    { x: 2360, y: 140 }, { x: 2400, y: 140 }, { x: 2440, y: 140 },
                    { x: 2720, y: 260 }, { x: 2920, y: 360 }
                ],
                goldenLotus: [
                    { x: 2460, y: 130 }
                ],
                beetles: [
                    { x: 180, y: 532, patrol: 80 },
                    { x: 500, y: 452, patrol: 40 },
                    { x: 1420, y: 502, patrol: 70 },
                    { x: 2500, y: 182, patrol: 60 }
                ],
                mosquitoes: [
                    { x: 880, y: 220, range: 60 },
                    { x: 1150, y: 180, range: 60 },
                    { x: 1780, y: 320, range: 60 },
                    { x: 2200, y: 180, range: 60 },
                    { x: 2800, y: 300, range: 60 }
                ],
                goal: { x: 3260, y: 444 }
            },

            // --- LEVEL 3: Mushroom Mire ---
            {
                id: 3,
                name: "Mushroom Mire",
                width: 3600,
                height: 650,
                playerStart: { x: 90, y: 480 },
                platforms: [
                    // Start ground
                    { x: 0, y: 540, w: 420, h: 110, type: 'ground' },
                    // High ridge 1
                    { x: 500, y: 460, w: 160, h: 190, type: 'ground' },
                    // Floating grass shelf
                    { x: 740, y: 360, w: 160, h: 32, type: 'grass' },
                    // Intermediate stepping shelf (eliminates 300px vertical leap trap)
                    { x: 925, y: 310, w: 85, h: 32, type: 'grass' },
                    // High bounce platform
                    { x: 1030, y: 260, w: 150, h: 32, type: 'grass' },
                    // Central Island
                    { x: 1260, y: 500, w: 360, h: 150, type: 'ground' },
                    // Stepping towers
                    { x: 1720, y: 420, w: 120, h: 230, type: 'ground' },
                    { x: 1940, y: 340, w: 120, h: 310, type: 'ground' },
                    { x: 2160, y: 260, w: 140, h: 390, type: 'ground' },
                    // High canopy jump
                    { x: 2400, y: 200, w: 220, h: 32, type: 'grass' },
                    // Far Island
                    { x: 2740, y: 480, w: 300, h: 170, type: 'ground' },
                    // Final Ground
                    { x: 3160, y: 520, w: 440, h: 130, type: 'ground' }
                ],
                lilypads: [
                    { x: 450, y: 560 },
                    { x: 680, y: 560 },
                    { x: 1140, y: 560 },
                    { x: 1220, y: 560 },
                    { x: 1645, y: 560 },
                    { x: 2660, y: 560 },
                    { x: 3080, y: 560 }
                ],
                mushrooms: [
                    { x: 580, y: 440 },
                    { x: 820, y: 340 },
                    { x: 1400, y: 480 },
                    { x: 1645, y: 540 },
                    { x: 2480, y: 180 },
                    { x: 2880, y: 460 }
                ],
                cattails: [
                    { x: 380, y: 516 },
                    { x: 520, y: 436 },
                    { x: 1280, y: 476 },
                    { x: 1560, y: 476 },
                    { x: 2760, y: 456 },
                    { x: 3200, y: 496 }
                ],
                waterPits: [
                    { x: 420, y: 580, w: 840, h: 70 },
                    { x: 1620, y: 580, w: 1120, h: 70 },
                    { x: 3040, y: 580, w: 120, h: 70 }
                ],
                fireflies: [
                    { x: 200, y: 470 }, { x: 240, y: 440 }, { x: 280, y: 470 },
                    { x: 580, y: 370 }, { x: 580, y: 310 },
                    { x: 760, y: 300 }, { x: 800, y: 270 }, { x: 840, y: 300 },
                    { x: 1040, y: 200 }, { x: 1080, y: 170 }, { x: 1120, y: 200 },
                    { x: 1340, y: 430 }, { x: 1380, y: 430 }, { x: 1420, y: 430 },
                    { x: 1760, y: 360 }, { x: 1980, y: 280 }, { x: 2200, y: 200 },
                    { x: 2460, y: 130 }, { x: 2500, y: 100 }, { x: 2540, y: 130 },
                    { x: 2800, y: 410 }, { x: 2840, y: 360 }, { x: 2880, y: 410 },
                    { x: 3260, y: 460 }, { x: 3300, y: 430 }, { x: 3340, y: 460 }
                ],
                goldenLotus: [
                    { x: 1090, y: 190 }
                ],
                beetles: [
                    { x: 240, y: 522, patrol: 80 },
                    { x: 1380, y: 482, patrol: 70 },
                    { x: 2860, y: 462, patrol: 60 }
                ],
                mosquitoes: [
                    { x: 780, y: 290, range: 50 },
                    { x: 1080, y: 330, range: 60 },
                    { x: 1800, y: 350, range: 50 },
                    { x: 2220, y: 200, range: 60 },
                    { x: 2900, y: 380, range: 60 }
                ],
                goal: { x: 3460, y: 464 }
            },

            // --- LEVEL 4: The Sunken Citadel (BOSS STAGE) ---
            {
                id: 4,
                name: "The Sunken Citadel",
                skyKey: 'bg_sky_boss',
                treesKey: 'bg_ruins_boss',
                grassKey: 'tile_boss_brick',
                dirtKey: 'tile_boss_sub',
                waterKey: 'tile_boss_water',
                width: 2800,
                height: 700,
                playerStart: { x: 90, y: 500 },
                arenaGate: { x: 1440, y: 480, triggerX: 1470 },
                arenaBounds: { x: 1440, y: 0, width: 1360, height: 700 },
                boss: { x: 2180, y: 510, maxHp: 6 },
                platforms: [
                    // --- PART 1: The Ruined Citadel Causeway (0 to 1440) ---
                    // Starting Citadel Bastion
                    { x: 0, y: 560, w: 320, h: 140, type: 'ground' },
                    // Broken causeway stepping slab
                    { x: 380, y: 500, w: 120, h: 32, type: 'grass' },
                    // High stone archway pillar
                    { x: 560, y: 420, w: 140, h: 280, type: 'ground' },
                    // High secret sky ruin arch (leads to secret Golden Lotus)
                    { x: 600, y: 220, w: 200, h: 32, type: 'grass' },
                    // Suspended causeway span
                    { x: 840, y: 460, w: 160, h: 32, type: 'grass' },
                    // Stepping ruin pillar (widened to 140px for reliable landing)
                    { x: 1040, y: 420, w: 140, h: 280, type: 'ground' },
                    // Floating ruin ledge
                    { x: 1220, y: 460, w: 120, h: 32, type: 'grass' },
                    // Citadel gatehouse threshold
                    { x: 1360, y: 540, w: 80, h: 160, type: 'ground' },

                    // --- PART 2: The Grand Boss Arena (1440 to 2800) ---
                    // Solid dark stone arena floor
                    { x: 1440, y: 560, w: 1220, h: 140, type: 'ground' },
                    // Left elevated ruin terrace
                    { x: 1600, y: 410, w: 160, h: 32, type: 'grass' },
                    // Right elevated ruin terrace
                    { x: 2320, y: 410, w: 160, h: 32, type: 'grass' },
                    // High central throne arch
                    { x: 1940, y: 290, w: 240, h: 32, type: 'grass' },
                    // Far right citadel vault wall
                    { x: 2660, y: 440, w: 140, h: 260, type: 'ground' }
                ],
                lilypads: [
                    // None in arena - platforms and mushrooms are used for aerial combat!
                ],
                mushrooms: [
                    // Causeway launch to secret sky arch
                    { x: 630, y: 400 },
                    // Arena Left Launcher (leap to Left Terrace or high air stomp)
                    { x: 1530, y: 540 },
                    // Arena Left Terrace Super-Leap (launch to Central Throne Arch)
                    { x: 1710, y: 390 },
                    // Arena Center Launcher (leap to Central Throne Arch)
                    { x: 2040, y: 540 },
                    // Arena Right Terrace Super-Leap (launch to Central Throne Arch)
                    { x: 2360, y: 390 },
                    // Arena Right Launcher (leap to Right Terrace)
                    { x: 2550, y: 540 }
                ],
                cattails: [
                    // Sparse withered cattails near start
                    { x: 120, y: 536 },
                    { x: 280, y: 536 }
                ],
                torches: [
                    { x: 160, y: 530 },
                    { x: 580, y: 390 },
                    { x: 880, y: 430 },
                    { x: 1380, y: 510 },
                    { x: 1660, y: 380 },
                    { x: 1980, y: 260 },
                    { x: 2140, y: 260 },
                    { x: 2460, y: 380 }
                ],
                pillars: [
                    { x: 60, y: 560 },
                    { x: 1100, y: 420 },
                    { x: 1500, y: 560 },
                    { x: 1880, y: 560 },
                    { x: 2240, y: 560 },
                    { x: 2620, y: 560 }
                ],
                waterPits: [
                    // Toxic violet mire gaps along causeway
                    { x: 320, y: 620, w: 240, h: 80 },
                    { x: 700, y: 620, w: 360, h: 80 },
                    { x: 1160, y: 620, w: 200, h: 80 }
                ],
                fireflies: [
                    { x: 200, y: 490 }, { x: 240, y: 460 },
                    { x: 410, y: 440 }, { x: 450, y: 440 },
                    { x: 630, y: 160 }, { x: 670, y: 130 }, { x: 710, y: 160 },
                    { x: 880, y: 400 }, { x: 920, y: 400 },
                    { x: 1090, y: 360 }, { x: 1250, y: 400 },
                    { x: 1660, y: 350 }, { x: 1700, y: 350 },
                    { x: 2020, y: 230 }, { x: 2060, y: 230 }, { x: 2100, y: 230 },
                    { x: 2380, y: 350 }, { x: 2420, y: 350 }
                ],
                goldenLotus: [
                    // Secret lotus atop high sky ruin arch on the causeway
                    { x: 700, y: 170 }
                ],
                beetles: [
                    { x: 200, y: 542, patrol: 60 },
                    { x: 890, y: 442, patrol: 50 }
                ],
                mosquitoes: [
                    { x: 450, y: 390, range: 40 },
                    { x: 780, y: 320, range: 50 },
                    { x: 1180, y: 360, range: 40 }
                ],
                goal: { x: 2680, y: 500 }
            }
,
            // --- LEVEL 5: Firefly Marsh (Generated & Balanced by JEV System 1) ---
            {
                "id": 5,
                "name": "Firefly Marsh",
                "width": 3050,
                "height": 600,
                "playerStart": {
                                "x": 90,
                                "y": 430
                },
                "platforms": [
                                {
                                                "x": 0,
                                                "y": 500,
                                                "w": 480,
                                                "h": 100,
                                                "type": "ground"
                                },
                                {
                                                "x": 580,
                                                "y": 440,
                                                "w": 160,
                                                "h": 60,
                                                "type": "ground"
                                },
                                {
                                                "x": 1020,
                                                "y": 440,
                                                "w": 220,
                                                "h": 100,
                                                "type": "ground"
                                },
                                {
                                                "x": 1310,
                                                "y": 500,
                                                "w": 260,
                                                "h": 100,
                                                "type": "ground"
                                },
                                {
                                                "x": 1670,
                                                "y": 440,
                                                "w": 160,
                                                "h": 60,
                                                "type": "ground"
                                },
                                {
                                                "x": 2110,
                                                "y": 440,
                                                "w": 220,
                                                "h": 100,
                                                "type": "ground"
                                },
                                {
                                                "x": 2490,
                                                "y": 480,
                                                "w": 460,
                                                "h": 120,
                                                "type": "ground"
                                }
                ],
                "lilypads": [
                                {
                                                "x": 830,
                                                "y": 512
                                },
                                {
                                                "x": 930,
                                                "y": 508
                                },
                                {
                                                "x": 1920,
                                                "y": 512
                                },
                                {
                                                "x": 2020,
                                                "y": 508
                                },
                                {
                                                "x": 2405,
                                                "y": 512
                                }
                ],
                "mushrooms": [],
                "cattails": [
                                {
                                                "x": 120,
                                                "y": 476
                                },
                                {
                                                "x": 420,
                                                "y": 476
                                },
                                {
                                                "x": 1040,
                                                "y": 416
                                },
                                {
                                                "x": 1340,
                                                "y": 476
                                },
                                {
                                                "x": 1510,
                                                "y": 476
                                },
                                {
                                                "x": 2130,
                                                "y": 416
                                },
                                {
                                                "x": 2530,
                                                "y": 456
                                },
                                {
                                                "x": 2890,
                                                "y": 456
                                }
                ],
                "waterPits": [
                                {
                                                "x": 480,
                                                "y": 530,
                                                "w": 100,
                                                "h": 70
                                },
                                {
                                                "x": 740,
                                                "y": 530,
                                                "w": 280,
                                                "h": 70
                                },
                                {
                                                "x": 1240,
                                                "y": 530,
                                                "w": 70,
                                                "h": 70
                                },
                                {
                                                "x": 1570,
                                                "y": 530,
                                                "w": 100,
                                                "h": 70
                                },
                                {
                                                "x": 1830,
                                                "y": 530,
                                                "w": 280,
                                                "h": 70
                                },
                                {
                                                "x": 2330,
                                                "y": 530,
                                                "w": 160,
                                                "h": 70
                                }
                ],
                "fireflies": [
                                {
                                                "x": 770.0,
                                                "y": 348.2
                                },
                                {
                                                "x": 800.0,
                                                "y": 372.2
                                },
                                {
                                                "x": 970.0,
                                                "y": 434.0
                                },
                                {
                                                "x": 1010.0,
                                                "y": 411.3
                                },
                                {
                                                "x": 1860.0,
                                                "y": 348.2
                                },
                                {
                                                "x": 1890.0,
                                                "y": 372.2
                                },
                                {
                                                "x": 2060.0,
                                                "y": 434.0
                                },
                                {
                                                "x": 2100.0,
                                                "y": 411.3
                                }
                ],
                "goldenLotus": [
                                {
                                                "x": 2670,
                                                "y": 360
                                }
                ],
                "beetles": [
                                {
                                                "x": 260,
                                                "y": 482,
                                                "patrol": 80
                                },
                                {
                                                "x": 620,
                                                "y": 422,
                                                "patrol": 60
                                },
                                {
                                                "x": 1710,
                                                "y": 422,
                                                "patrol": 60
                                }
                ],
                "mosquitoes": [
                                {
                                                "x": 1730,
                                                "y": 350,
                                                "range": 50
                                }
                ],
                "goal": {
                                "x": 2840,
                                "y": 424
                }
}

        ];
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
            mosquitoes
        };
    }
}

window.LevelBuilder = LevelBuilder;
