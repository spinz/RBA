/**
 * Advanced Procedural Pixel-Art & Visuals Engine (V2 HD Upgrade)
 * Upgrades all sprites and tiles to rich, shaded, multi-tone pixel art with:
 * - 48x48 detailed character sprites with lighting, highlights, and secondary motion
 * - Curated 16-bit retro swamp color palettes with ambient occlusion & dithering
 * - Multi-layer animated tiles (mossy grass, striated earth, glowing water caustics)
 * - Atmospheric effects: drifting swamp mist, glowing firefly halos, hanging Spanish moss
 */
class AssetGenerator {
    static generateAll(scene) {
        this.generateFrog(scene);
        this.generateEnemies(scene);
        this.generateTiles(scene);
        this.generateDecorations(scene);
        this.generateCollectibles(scene);
        this.generateVFX(scene);
        this.generateBackgrounds(scene);
        this.generateBoss(scene);
        this.generateBossTiles(scene);
        this.generateBossVFX(scene);
        this.generateBossBackgrounds(scene);
    }

    // --- 1. UPGRADED FROG HERO (48x48) ---
    static generateFrog(scene) {
        const frameW = 48;
        const frameH = 48;
        const numFrames = 7; // 0: Idle1, 1: Idle2 (Throat puff), 2: Run1, 3: Run2, 4: Jump, 5: Fall, 6: Hurt
        const canvas = document.createElement('canvas');
        canvas.width = frameW * numFrames;
        canvas.height = frameH;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        // Rich 16-bit Palette
        const Pal = {
            outline: '#062d14',
            darkShadow: '#0d4a22',
            baseGreen: '#16a34a',
            midGreen: '#22c55e',
            brightGreen: '#4ade4a',
            highlightGreen: '#86efac',
            bellyShadow: '#ca8a04',
            bellyMid: '#facc15',
            bellyLight: '#fef08a',
            bellyGlow: '#fef9c3',
            mouthPink: '#e11d48',
            cheekPink: '#f43f5e',
            eyeWhite: '#ffffff',
            eyeShine: '#f8fafc',
            pupil: '#022c22',
            throatPuffGlow: '#fde047'
        };

        const drawFrog = (frameIdx, { puff = 0, legPose = 'sit', eyePose = 'normal', yOffset = 0 }) => {
            const ox = frameIdx * frameW;
            const oy = yOffset;

            // --- 1. FAR HIND LEG (Background Left) ---
            ctx.fillStyle = Pal.darkShadow;
            if (legPose === 'sit') {
                ctx.beginPath();
                ctx.ellipse(ox + 9, oy + 35, 6, 4, -0.2, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillRect(ox + 5, oy + 38, 6, 3);
            } else if (legPose === 'run1') {
                ctx.beginPath();
                ctx.ellipse(ox + 5, oy + 37, 7, 3, -0.4, 0, Math.PI * 2);
                ctx.fill();
            } else if (legPose === 'jump') {
                ctx.beginPath();
                ctx.ellipse(ox + 5, oy + 39, 4, 8, 0.5, 0, Math.PI * 2);
                ctx.fill();
            }

            // --- 2. FAR FRONT ARM (Background Right) ---
            ctx.fillStyle = Pal.darkShadow;
            if (legPose === 'jump') {
                ctx.fillRect(ox + 29, oy + 25, 7, 4);
                ctx.fillRect(ox + 35, oy + 26, 3, 3);
            } else {
                ctx.fillRect(ox + 25, oy + 33, 4, 7);
                ctx.fillRect(ox + 25, oy + 39, 5, 2);
            }

            // --- 3. MAIN BODY & BACK CURVE (Facing Right) ---
            ctx.fillStyle = Pal.outline;
            ctx.beginPath();
            ctx.ellipse(ox + 21, oy + 28, 14, legPose === 'jump' ? 11 : 13.5, 0.1, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(ox + 29, oy + 23, 9, 7.5, 0.1, 0, Math.PI * 2);
            ctx.fill();

            // Dark shadow volume
            ctx.fillStyle = Pal.darkShadow;
            ctx.beginPath();
            ctx.ellipse(ox + 21, oy + 28, 13, legPose === 'jump' ? 10 : 12.5, 0.1, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(ox + 29, oy + 23, 8, 6.5, 0.1, 0, Math.PI * 2);
            ctx.fill();

            // Mid green gradient volume
            ctx.fillStyle = Pal.baseGreen;
            ctx.beginPath();
            ctx.ellipse(ox + 21, oy + 26.5, 11.5, legPose === 'jump' ? 9 : 11, 0.1, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(ox + 29, oy + 22, 7.2, 5.8, 0.1, 0, Math.PI * 2);
            ctx.fill();

            // Top highlight curvature
            ctx.fillStyle = Pal.brightGreen;
            ctx.beginPath();
            ctx.ellipse(ox + 20, oy + 23.5, 9.5, legPose === 'jump' ? 7.5 : 9, 0.1, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(ox + 28, oy + 20.5, 5.8, 4.5, 0.1, 0, Math.PI * 2);
            ctx.fill();

            // Specular back rim (along upper spine)
            ctx.fillStyle = Pal.highlightGreen;
            ctx.fillRect(ox + 12, oy + 17, 7, 2);
            ctx.fillRect(ox + 11, oy + 19, 8, 1);

            // --- 4. BELLY & THROAT SAC (Puffing forward-right) ---
            const throatW = 8 + puff * 5;
            const throatH = 7 + puff * 4;
            const throatX = 26 + puff * 2;
            const throatY = 29 + puff * 1.5;

            // Belly shadow
            ctx.fillStyle = Pal.bellyShadow;
            ctx.beginPath();
            ctx.ellipse(ox + throatX, oy + throatY + 1, throatW + 1, throatH + 1, 0.2, 0, Math.PI * 2);
            ctx.fill();

            // Belly main
            ctx.fillStyle = puff > 0 ? Pal.throatPuffGlow : Pal.bellyMid;
            ctx.beginPath();
            ctx.ellipse(ox + throatX, oy + throatY, throatW, throatH, 0.2, 0, Math.PI * 2);
            ctx.fill();

            // Belly shine
            ctx.fillStyle = Pal.bellyLight;
            ctx.beginPath();
            ctx.ellipse(ox + throatX + 1, oy + throatY - 1.5, throatW * 0.65, throatH * 0.6, 0.2, 0, Math.PI * 2);
            ctx.fill();

            // --- 5. NEAR HIND THIGH & FOOT (Foreground Left) ---
            ctx.fillStyle = Pal.outline;
            if (legPose === 'sit') {
                ctx.beginPath();
                ctx.ellipse(ox + 13, oy + 33, 9, 7.5, -0.3, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = Pal.baseGreen;
                ctx.beginPath();
                ctx.ellipse(ox + 13, oy + 33, 8, 6.5, -0.3, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = Pal.brightGreen;
                ctx.beginPath();
                ctx.ellipse(ox + 13, oy + 31, 6, 4.5, -0.3, 0, Math.PI * 2);
                ctx.fill();
                // Back foot flat on ground
                ctx.fillStyle = Pal.outline;
                ctx.fillRect(ox + 9, oy + 39, 11, 4);
                ctx.fillStyle = Pal.brightGreen;
                ctx.fillRect(ox + 10, oy + 40, 9, 2);
                ctx.fillStyle = Pal.highlightGreen;
                ctx.fillRect(ox + 17, oy + 40, 3, 2);
            } else if (legPose === 'run1') {
                ctx.beginPath();
                ctx.ellipse(ox + 10, oy + 36, 8, 5, -0.4, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = Pal.baseGreen;
                ctx.beginPath();
                ctx.ellipse(ox + 10, oy + 35, 7, 4, -0.4, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = Pal.brightGreen;
                ctx.fillRect(ox + 3, oy + 38, 5, 2);
            } else if (legPose === 'jump') {
                ctx.beginPath();
                ctx.ellipse(ox + 9, oy + 39, 5, 9, 0.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = Pal.baseGreen;
                ctx.beginPath();
                ctx.ellipse(ox + 9, oy + 38, 4, 8, 0.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = Pal.highlightGreen;
                ctx.fillRect(ox + 4, oy + 43, 4, 2);
            }

            // --- 6. NEAR FRONT ARM & HAND (Foreground Right) ---
            ctx.fillStyle = Pal.outline;
            if (legPose === 'jump') {
                ctx.beginPath();
                ctx.ellipse(ox + 33, oy + 24, 7, 3.5, 0.2, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = Pal.brightGreen;
                ctx.beginPath();
                ctx.ellipse(ox + 33, oy + 24, 6, 2.5, 0.2, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = Pal.highlightGreen;
                ctx.fillRect(ox + 38, oy + 23, 3, 3);
            } else {
                ctx.beginPath();
                ctx.ellipse(ox + 29, oy + 34, 3.5, 6, 0.15, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = Pal.baseGreen;
                ctx.beginPath();
                ctx.ellipse(ox + 29, oy + 34, 2.5, 5, 0.15, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = Pal.brightGreen;
                ctx.fillRect(ox + 28, oy + 31, 2, 7);
                // Cute webbed toes
                ctx.fillStyle = Pal.outline;
                ctx.fillRect(ox + 28, oy + 39, 8, 3);
                ctx.fillStyle = Pal.highlightGreen;
                ctx.fillRect(ox + 30, oy + 40, 5, 2);
            }

            // --- 7. FAR EYE (Peeking behind head at top-left) ---
            const drawFarEye = (ex, ey) => {
                ctx.fillStyle = Pal.outline;
                ctx.beginPath();
                ctx.arc(ex, ey, 5.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = Pal.brightGreen;
                ctx.beginPath();
                ctx.arc(ex, ey, 4.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = Pal.eyeWhite;
                ctx.beginPath();
                ctx.arc(ex + 0.5, ey, 3.5, 0, Math.PI * 2);
                ctx.fill();

                if (eyePose === 'hurt') {
                    ctx.strokeStyle = Pal.pupil;
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.moveTo(ex - 2, ey - 2); ctx.lineTo(ex + 2, ey + 2);
                    ctx.moveTo(ex + 2, ey - 2); ctx.lineTo(ex - 2, ey + 2);
                    ctx.stroke();
                } else {
                    ctx.fillStyle = Pal.pupil;
                    ctx.beginPath();
                    ctx.arc(ex + 1.8, ey, 2.2, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = Pal.eyeShine;
                    ctx.fillRect(ex + 1, ey - 1.5, 1.5, 1.5);
                }
            };
            drawFarEye(ox + 20, oy + 12);

            // --- 8. NEAR EYE (Prominent foreground eye, facing right) ---
            const drawNearEye = (ex, ey) => {
                ctx.fillStyle = Pal.outline;
                ctx.beginPath();
                ctx.arc(ex, ey, 7.5, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = Pal.brightGreen;
                ctx.beginPath();
                ctx.arc(ex, ey, 6.5, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = Pal.eyeWhite;
                ctx.beginPath();
                ctx.arc(ex + 0.5, ey, 5, 0, Math.PI * 2);
                ctx.fill();

                if (eyePose === 'hurt') {
                    ctx.strokeStyle = Pal.pupil;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(ex - 3, ey - 2); ctx.lineTo(ex + 3, ey + 3);
                    ctx.moveTo(ex + 3, ey - 2); ctx.lineTo(ex - 3, ey + 3);
                    ctx.stroke();
                } else {
                    ctx.fillStyle = Pal.pupil;
                    ctx.beginPath();
                    ctx.arc(ex + 2, ey + 0.5, 3.2, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.fillStyle = Pal.eyeShine;
                    ctx.fillRect(ex + 1.5, ey - 1.5, 2, 2);
                    ctx.fillRect(ex + 3, ey + 0.5, 1, 1);
                }
            };
            drawNearEye(ox + 30, oy + 13);

            // --- 9. CHEEK BLUSH & HAPPY PROFILE MOUTH ---
            ctx.fillStyle = Pal.cheekPink;
            ctx.fillRect(ox + 30, oy + 22, 4, 3);

            ctx.fillStyle = Pal.outline;
            if (eyePose === 'hurt') {
                ctx.fillRect(ox + 28, oy + 26, 8, 2);
            } else {
                ctx.beginPath();
                ctx.arc(ox + 31, oy + 23, 6, 0.2, 1.4);
                ctx.lineWidth = 2;
                ctx.strokeStyle = Pal.outline;
                ctx.stroke();

                ctx.fillStyle = Pal.mouthPink;
                ctx.fillRect(ox + 34, oy + 24, 2, 2);
            }
        };

        // Render frames:
        // 0: Idle 1
        drawFrog(0, { puff: 0, legPose: 'sit', yOffset: 0 });
        // 1: Idle 2 (Deep Ribbit Throat Puff)
        drawFrog(1, { puff: 1.2, legPose: 'sit', yOffset: -1 });
        // 2: Run Frame 1 (Push off)
        drawFrog(2, { puff: 0, legPose: 'run1', yOffset: 0 });
        // 3: Run Frame 2 (Hop stride)
        drawFrog(3, { puff: 0.3, legPose: 'sit', yOffset: -2 });
        // 4: Jump (Aerodynamic Leap)
        drawFrog(4, { puff: 0, legPose: 'jump', yOffset: -4 });
        // 5: Fall (Tucked landing posture)
        drawFrog(5, { puff: 0, legPose: 'sit', yOffset: 1 });
        // 6: Hurt (Dizzy eyes)
        drawFrog(6, { puff: 0, legPose: 'sit', eyePose: 'hurt', yOffset: 0 });

        if (scene.textures.exists('frog')) scene.textures.remove('frog');
        scene.textures.addSpriteSheet('frog', canvas, {
            frameWidth: frameW,
            frameHeight: frameH
        });

        // --- Upgraded Tongue Tip (Glossy fleshy bulb with suction rim) ---
        const tCanvas = document.createElement('canvas');
        tCanvas.width = 16;
        tCanvas.height = 16;
        const tCtx = tCanvas.getContext('2d');

        // Shadow ring
        tCtx.fillStyle = '#9f1239';
        tCtx.beginPath();
        tCtx.arc(8, 8, 7, 0, Math.PI * 2);
        tCtx.fill();

        // Main bulb
        tCtx.fillStyle = '#f43f5e';
        tCtx.beginPath();
        tCtx.arc(8, 8, 6, 0, Math.PI * 2);
        tCtx.fill();

        // Highlight
        tCtx.fillStyle = '#fda4af';
        tCtx.beginPath();
        tCtx.arc(6, 6, 3, 0, Math.PI * 2);
        tCtx.fill();

        // Wet glint
        tCtx.fillStyle = '#ffffff';
        tCtx.fillRect(5, 5, 2, 2);

        if (scene.textures.exists('tongue_tip')) scene.textures.remove('tongue_tip');
        scene.textures.addCanvas('tongue_tip', tCanvas);

        // Ground shadow (placed underneath player for grounded 3D depth)
        const sCanvas = document.createElement('canvas');
        sCanvas.width = 32;
        sCanvas.height = 12;
        const sCtx = sCanvas.getContext('2d');
        const sGrad = sCtx.createRadialGradient(16, 6, 2, 16, 6, 14);
        sGrad.addColorStop(0, 'rgba(0, 0, 0, 0.45)');
        sGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        sCtx.fillStyle = sGrad;
        sCtx.beginPath();
        sCtx.ellipse(16, 6, 14, 5, 0, 0, Math.PI * 2);
        sCtx.fill();
        if (scene.textures.exists('shadow')) scene.textures.remove('shadow');
        scene.textures.addCanvas('shadow', sCanvas);
    }

    // --- 2. UPGRADED ENEMIES (Mud Beetle & Jewel Dragonfly) ---
    static generateEnemies(scene) {
        // --- Mud Beetle (48x36, 3 frames: Walk1, Walk2, Squashed) ---
        const bCanvas = document.createElement('canvas');
        bCanvas.width = 48 * 3;
        bCanvas.height = 36;
        const bCtx = bCanvas.getContext('2d');
        bCtx.imageSmoothingEnabled = false;

        const drawBeetle = (ox, oy, step, squashed) => {
            if (squashed) {
                // Flattened comic pancake
                bCtx.fillStyle = '#271202';
                bCtx.fillRect(ox + 4, oy + 28, 40, 7);
                bCtx.fillStyle = '#854d0e';
                bCtx.fillRect(ox + 8, oy + 26, 32, 4);
                // Dizzy swirl stars
                bCtx.fillStyle = '#fde047';
                bCtx.fillRect(ox + 12, oy + 16, 4, 4);
                bCtx.fillRect(ox + 28, oy + 14, 3, 3);
                bCtx.fillRect(ox + 34, oy + 18, 4, 4);
                return;
            }

            // Segmented jointed legs
            bCtx.fillStyle = '#1c1917';
            if (step) {
                bCtx.fillRect(ox + 6, oy + 26, 5, 9);
                bCtx.fillRect(ox + 21, oy + 28, 6, 7);
                bCtx.fillRect(ox + 36, oy + 26, 5, 9);
            } else {
                bCtx.fillRect(ox + 8, oy + 28, 5, 7);
                bCtx.fillRect(ox + 21, oy + 26, 6, 9);
                bCtx.fillRect(ox + 34, oy + 28, 5, 7);
            }

            // Bronze / Amber Armored Shell (Metallic gradients)
            bCtx.fillStyle = '#451a03';
            bCtx.beginPath();
            bCtx.ellipse(ox + 24, oy + 18, 16, 12, 0, 0, Math.PI * 2);
            bCtx.fill();

            bCtx.fillStyle = '#78350f';
            bCtx.beginPath();
            bCtx.ellipse(ox + 24, oy + 16, 14, 10, 0, 0, Math.PI * 2);
            bCtx.fill();

            // Shell specular sheen
            bCtx.fillStyle = '#d97706';
            bCtx.beginPath();
            bCtx.ellipse(ox + 24, oy + 13, 11, 6, 0, 0, Math.PI * 2);
            bCtx.fill();

            bCtx.fillStyle = '#fef08a';
            bCtx.fillRect(ox + 20, oy + 9, 8, 2);

            // Shell seam
            bCtx.fillStyle = '#1c1917';
            bCtx.fillRect(ox + 23, oy + 6, 2, 22);

            // Armored Mandible Head
            bCtx.fillStyle = '#1c1917';
            bCtx.fillRect(ox + 4, oy + 15, 8, 10);

            // Glowing angry amber eye
            bCtx.fillStyle = '#ef4444';
            bCtx.fillRect(ox + 6, oy + 17, 4, 4);
            bCtx.fillStyle = '#fef08a';
            bCtx.fillRect(ox + 7, oy + 18, 2, 2);

            // Horn / Antennae
            bCtx.fillStyle = '#292524';
            bCtx.fillRect(ox + 2, oy + 10, 3, 7);
            bCtx.fillRect(ox + 1, oy + 8, 3, 3);
        };

        drawBeetle(0, 0, false, false);
        drawBeetle(48, 0, true, false);
        drawBeetle(96, 0, false, true);

        if (scene.textures.exists('beetle')) scene.textures.remove('beetle');
        scene.textures.addSpriteSheet('beetle', bCanvas, {
            frameWidth: 48,
            frameHeight: 36
        });

        // --- Upgraded Jewel Dragonfly / Mosquito (36x32, 2 frames) ---
        const dCanvas = document.createElement('canvas');
        dCanvas.width = 36 * 2;
        dCanvas.height = 32;
        const dCtx = dCanvas.getContext('2d');
        dCtx.imageSmoothingEnabled = false;

        const drawDragonfly = (ox, oy, wingUp) => {
            // Glowing jewel body (Emerald & Cyan)
            dCtx.fillStyle = '#065f46';
            dCtx.beginPath();
            dCtx.ellipse(ox + 18, oy + 18, 10, 5, 0, 0, Math.PI * 2);
            dCtx.fill();

            dCtx.fillStyle = '#059669';
            dCtx.beginPath();
            dCtx.ellipse(ox + 18, oy + 17, 8, 3.5, 0, 0, Math.PI * 2);
            dCtx.fill();

            // Long needle tail
            dCtx.fillStyle = '#10b981';
            dCtx.fillRect(ox + 27, oy + 16, 8, 2);
            dCtx.fillStyle = '#34d399';
            dCtx.fillRect(ox + 34, oy + 17, 2, 1);

            // Large red compound eye
            dCtx.fillStyle = '#dc2626';
            dCtx.beginPath();
            dCtx.arc(ox + 8, oy + 16, 4, 0, Math.PI * 2);
            dCtx.fill();
            dCtx.fillStyle = '#fca5a5';
            dCtx.fillRect(ox + 7, oy + 14, 2, 2);

            // Proboscis stinger
            dCtx.fillStyle = '#0f172a';
            dCtx.fillRect(ox + 2, oy + 18, 6, 2);

            // Shimmering iridescent wings
            dCtx.fillStyle = 'rgba(165, 243, 252, 0.75)';
            dCtx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
            dCtx.lineWidth = 1;

            if (wingUp) {
                dCtx.beginPath();
                dCtx.ellipse(ox + 15, oy + 7, 10, 5, -0.3, 0, Math.PI * 2);
                dCtx.fill();
                dCtx.stroke();

                dCtx.beginPath();
                dCtx.ellipse(ox + 22, oy + 6, 8, 4, 0.2, 0, Math.PI * 2);
                dCtx.fill();
                dCtx.stroke();
            } else {
                dCtx.beginPath();
                dCtx.ellipse(ox + 16, oy + 14, 11, 4, 0.1, 0, Math.PI * 2);
                dCtx.fill();
                dCtx.stroke();
            }
        };

        drawDragonfly(0, 0, true);
        drawDragonfly(36, 0, false);

        if (scene.textures.exists('mosquito')) scene.textures.remove('mosquito');
        scene.textures.addSpriteSheet('mosquito', dCanvas, {
            frameWidth: 36,
            frameHeight: 32
        });
    }

    // --- 3. UPGRADED TILES & LUSH TERRAIN ---
    static generateTiles(scene) {
        const createTile = (key, w, h, drawFn) => {
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = false;
            drawFn(ctx, w, h);
            if (scene.textures.exists(key)) scene.textures.remove(key);
            scene.textures.addCanvas(key, canvas);
        };

        // 1. Mossy Grass Top (32x32) with wild grass blades, clovers & rich shadow
        createTile('tile_grass', 32, 32, (ctx, w, h) => {
            // Deep earth base
            ctx.fillStyle = '#3e2723';
            ctx.fillRect(0, 0, w, h);

            // Rich loam texture variations
            ctx.fillStyle = '#2e1c18';
            ctx.fillRect(4, 18, 8, 8);
            ctx.fillRect(18, 22, 10, 6);
            ctx.fillRect(2, 27, 6, 4);

            // Earth roots
            ctx.fillStyle = '#6d4c41';
            ctx.fillRect(8, 14, 2, 8);
            ctx.fillRect(10, 20, 3, 2);

            // Embedded pebbles
            ctx.fillStyle = '#9e9e9e';
            ctx.fillRect(22, 16, 4, 3);
            ctx.fillStyle = '#757575';
            ctx.fillRect(22, 19, 4, 1);

            // Grass root shadow
            ctx.fillStyle = '#1b3815';
            ctx.fillRect(0, 11, w, 3);

            // Mid grass foliage
            ctx.fillStyle = '#15803d';
            ctx.fillRect(0, 4, w, 8);

            // Vibrant top lawn
            ctx.fillStyle = '#22c55e';
            ctx.fillRect(0, 0, w, 5);

            // Sunlight highlight edge
            ctx.fillStyle = '#86efac';
            ctx.fillRect(0, 0, w, 2);

            // Wild hanging blades & sprouts
            ctx.fillStyle = '#22c55e';
            for (let x = 1; x < w; x += 5) {
                ctx.fillRect(x, 5, 2, 4);
                ctx.fillRect(x + 1, 9, 1, 3);
            }

            // Tiny yellow clover blossom
            ctx.fillStyle = '#fde047';
            ctx.fillRect(12, 1, 2, 2);
            ctx.fillRect(11, 2, 4, 1);
        });

        // 2. Deep Sub-Soil (32x32)
        createTile('tile_dirt', 32, 32, (ctx, w, h) => {
            ctx.fillStyle = '#3e2723';
            ctx.fillRect(0, 0, w, h);

            // Rich rock and soil mottling
            ctx.fillStyle = '#2e1c18';
            ctx.fillRect(6, 6, 12, 8);
            ctx.fillRect(22, 18, 7, 7);
            ctx.fillRect(3, 22, 8, 6);

            // Golden fossil speck
            ctx.fillStyle = '#f59e0b';
            ctx.fillRect(14, 14, 2, 2);

            // Embedded stone
            ctx.fillStyle = '#616161';
            ctx.fillRect(18, 8, 6, 5);
            ctx.fillStyle = '#424242';
            ctx.fillRect(18, 12, 6, 2);
        });

        // 3. Luxurious Lilypad Platform (64x20)
        createTile('lilypad', 64, 20, (ctx, w, h) => {
            // Water drop shadow beneath lilypad
            ctx.fillStyle = 'rgba(2, 44, 34, 0.5)';
            ctx.beginPath();
            ctx.ellipse(32, 14, 30, 5, 0, 0, Math.PI * 2);
            ctx.fill();

            // Outer dark rim
            ctx.fillStyle = '#14532d';
            ctx.beginPath();
            ctx.ellipse(32, 9, 29, 7.5, 0, 0, Math.PI * 2);
            ctx.fill();

            // Lush emerald leaf surface
            ctx.fillStyle = '#16a34a';
            ctx.beginPath();
            ctx.ellipse(32, 8, 27, 6.5, 0, 0, Math.PI * 2);
            ctx.fill();

            // Radiant leaf venation (vein lines)
            ctx.strokeStyle = '#4ade4a';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(32, 8); ctx.lineTo(10, 5);
            ctx.moveTo(32, 8); ctx.lineTo(16, 11);
            ctx.moveTo(32, 8); ctx.lineTo(48, 5);
            ctx.moveTo(32, 8); ctx.lineTo(48, 11);
            ctx.stroke();

            // Natural notch cut
            ctx.fillStyle = '#0369a1';
            ctx.beginPath();
            ctx.moveTo(32, 8);
            ctx.lineTo(52, 0);
            ctx.lineTo(58, 9);
            ctx.closePath();
            ctx.fill();

            // Dew drop glistening on pad
            ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
            ctx.fillRect(20, 5, 2, 2);

            // Beautiful pink water lotus blossom
            ctx.fillStyle = '#f43f5e';
            ctx.beginPath();
            ctx.arc(14, 5, 5, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#fda4af';
            ctx.beginPath();
            ctx.arc(14, 4, 3, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#fef08a';
            ctx.fillRect(13, 4, 2, 2);
        });

        // 4. Amanita Spring Mushroom (36x36)
        createTile('mushroom_spring', 36, 36, (ctx, w, h) => {
            // Textured wooden / fungal stem
            ctx.fillStyle = '#e7e5e4';
            ctx.fillRect(14, 16, 8, 18);
            ctx.fillStyle = '#d6d3d1';
            ctx.fillRect(14, 16, 2, 18);
            // Frilly stem ring
            ctx.fillStyle = '#f5f5f4';
            ctx.fillRect(12, 22, 12, 3);

            // Shaded Red Dome Cap
            ctx.fillStyle = '#991b1b';
            ctx.beginPath();
            ctx.ellipse(18, 15, 16, 12, 0, Math.PI, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#dc2626';
            ctx.beginPath();
            ctx.ellipse(18, 14, 14.5, 10.5, 0, Math.PI, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.ellipse(18, 11, 11, 6, 0, Math.PI, Math.PI * 2);
            ctx.fill();

            // Crisp 3D white polka dots
            const drawDot = (dx, dy, r) => {
                ctx.fillStyle = '#f5f5f4';
                ctx.beginPath();
                ctx.arc(dx, dy, r, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#e5e5e5';
                ctx.fillRect(dx - r * 0.5, dy + r * 0.3, r, r * 0.6);
            };

            drawDot(18, 7, 3.5);
            drawDot(9, 12, 2.8);
            drawDot(27, 12, 2.8);
            drawDot(13, 13, 2);
            drawDot(23, 13, 2);
        });

        // 5. Water Tile with Dynamic Caustics (32x32)
        createTile('tile_water', 32, 32, (ctx, w, h) => {
            const grad = ctx.createLinearGradient(0, 0, 0, 32);
            grad.addColorStop(0, 'rgba(14, 165, 233, 0.85)');
            grad.addColorStop(0.3, 'rgba(2, 132, 199, 0.88)');
            grad.addColorStop(1, 'rgba(3, 105, 161, 0.95)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, w, h);

            // Foam ripple crest
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.fillRect(0, 0, w, 2);
            ctx.fillStyle = 'rgba(224, 242, 254, 0.7)';
            ctx.fillRect(0, 2, w, 2);

            // Sub-surface sunlight caustics
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.fillRect(4, 8, 8, 3);
            ctx.fillRect(16, 14, 10, 3);
            ctx.fillRect(6, 22, 12, 2);
        });

        // 6. Grand Golden Lotus Victory Shrine (40x56)
        createTile('goal_shrine', 40, 56, (ctx, w, h) => {
            // Mossy stone shrine base
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(4, 34, 32, 20);
            ctx.fillStyle = '#334155';
            ctx.fillRect(6, 36, 28, 16);
            ctx.fillStyle = '#15803d'; // Moss patch
            ctx.fillRect(6, 36, 8, 3);

            // Pedestal column
            ctx.fillStyle = '#475569';
            ctx.fillRect(12, 22, 16, 12);
            ctx.fillStyle = '#64748b';
            ctx.fillRect(14, 23, 12, 10);

            // Golden Lotus Trophy (Glorious multi-petaled bloom)
            ctx.fillStyle = '#b45309';
            ctx.beginPath();
            ctx.arc(20, 14, 12, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.arc(20, 14, 9.5, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#fde047';
            ctx.beginPath();
            ctx.arc(20, 13, 6.5, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(20, 11, 3, 0, Math.PI * 2);
            ctx.fill();

            // Sparkling aura star
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(19, 0, 2, 6);
            ctx.fillRect(17, 2, 6, 2);
        });
    }

    // --- 4. SCENERY DECORATIONS (Cattails, Ferns, Vines) ---
    static generateDecorations(scene) {
        // Cattails Swamp Reeds (24x48)
        const cCanvas = document.createElement('canvas');
        cCanvas.width = 24;
        cCanvas.height = 48;
        const cCtx = cCanvas.getContext('2d');

        // Stems
        cCtx.fillStyle = '#15803d';
        cCtx.fillRect(8, 12, 2, 36);
        cCtx.fillRect(15, 18, 2, 30);

        // Brown fuzzy heads
        cCtx.fillStyle = '#451a03';
        cCtx.fillRect(7, 6, 4, 14);
        cCtx.fillRect(14, 12, 4, 12);

        // Highlights
        cCtx.fillStyle = '#78350f';
        cCtx.fillRect(8, 7, 2, 12);
        cCtx.fillRect(15, 13, 2, 10);

        // Leaf fronds
        cCtx.fillStyle = '#22c55e';
        cCtx.fillRect(4, 24, 4, 2);
        cCtx.fillRect(2, 20, 2, 4);
        cCtx.fillRect(18, 30, 4, 2);

        if (scene.textures.exists('cattails')) scene.textures.remove('cattails');
        scene.textures.addCanvas('cattails', cCanvas);
    }

    // --- 5. GLOWING COLLECTIBLES ---
    static generateCollectibles(scene) {
        // Firefly with pulsating radial halo (24x24, 4 animation frames)
        const fCanvas = document.createElement('canvas');
        fCanvas.width = 24 * 4;
        fCanvas.height = 24;
        const fCtx = fCanvas.getContext('2d');

        for (let i = 0; i < 4; i++) {
            const ox = i * 24;
            const haloR = 7 + Math.sin((i / 4) * Math.PI * 2) * 3;

            // Warm golden glow
            const grad = fCtx.createRadialGradient(ox + 12, 12, 1, ox + 12, 12, haloR);
            grad.addColorStop(0, 'rgba(254, 240, 138, 0.95)');
            grad.addColorStop(0.4, 'rgba(234, 179, 8, 0.6)');
            grad.addColorStop(1, 'rgba(202, 138, 4, 0)');
            fCtx.fillStyle = grad;
            fCtx.beginPath();
            fCtx.arc(ox + 12, 12, haloR, 0, Math.PI * 2);
            fCtx.fill();

            // Tiny insect body
            fCtx.fillStyle = '#1c1917';
            fCtx.fillRect(ox + 11, 11, 2, 4);

            // Shimmering wing
            fCtx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            fCtx.fillRect(ox + 9, 10, 2, 2);
            fCtx.fillRect(ox + 13, 10, 2, 2);

            // Blazing golden core
            fCtx.fillStyle = '#ffffff';
            fCtx.fillRect(ox + 11, 12, 2, 2);
        }

        if (scene.textures.exists('firefly')) scene.textures.remove('firefly');
        scene.textures.addSpriteSheet('firefly', fCanvas, {
            frameWidth: 24,
            frameHeight: 24
        });

        // Golden Lotus Power-Up (32x32)
        const lCanvas = document.createElement('canvas');
        lCanvas.width = 32;
        lCanvas.height = 32;
        const lCtx = lCanvas.getContext('2d');

        const lGrad = lCtx.createRadialGradient(16, 16, 2, 16, 16, 15);
        lGrad.addColorStop(0, '#fef08a');
        lGrad.addColorStop(0.5, '#f59e0b');
        lGrad.addColorStop(1, 'rgba(217, 119, 6, 0)');
        lCtx.fillStyle = lGrad;
        lCtx.beginPath();
        lCtx.arc(16, 16, 15, 0, Math.PI * 2);
        lCtx.fill();

        lCtx.fillStyle = '#fde047';
        lCtx.beginPath();
        lCtx.arc(16, 16, 9, 0, Math.PI * 2);
        lCtx.fill();

        lCtx.fillStyle = '#ffffff';
        lCtx.beginPath();
        lCtx.arc(16, 14, 5, 0, Math.PI * 2);
        lCtx.fill();

        if (scene.textures.exists('golden_lotus')) scene.textures.remove('golden_lotus');
        scene.textures.addCanvas('golden_lotus', lCanvas);

        // Heart Icon (20x20)
        const hCanvas = document.createElement('canvas');
        hCanvas.width = 20;
        hCanvas.height = 20;
        const hCtx = hCanvas.getContext('2d');

        // Heart drop shadow
        hCtx.fillStyle = '#7f1d1d';
        hCtx.beginPath();
        hCtx.moveTo(10, 18);
        hCtx.bezierCurveTo(2, 12, 2, 4, 10, 8);
        hCtx.bezierCurveTo(18, 4, 18, 12, 10, 18);
        hCtx.fill();

        // Vibrant Red Heart
        hCtx.fillStyle = '#ef4444';
        hCtx.beginPath();
        hCtx.moveTo(10, 16.5);
        hCtx.bezierCurveTo(3, 11, 3, 5, 10, 8.5);
        hCtx.bezierCurveTo(17, 5, 17, 11, 10, 16.5);
        hCtx.fill();

        // Specular glint
        hCtx.fillStyle = '#fecaca';
        hCtx.fillRect(6, 6, 3, 3);
        hCtx.fillStyle = '#ffffff';
        hCtx.fillRect(7, 7, 1, 1);

        if (scene.textures.exists('heart')) scene.textures.remove('heart');
        scene.textures.addCanvas('heart', hCanvas);
    }

    // --- 6. RICH VFX PARTICLES & MIST ---
    static generateVFX(scene) {
        // Sparkle Star (10x10)
        const sCanvas = document.createElement('canvas');
        sCanvas.width = 10;
        sCanvas.height = 10;
        const sCtx = sCanvas.getContext('2d');
        sCtx.fillStyle = '#fef08a';
        sCtx.fillRect(4, 0, 2, 10);
        sCtx.fillRect(0, 4, 10, 2);
        sCtx.fillStyle = '#ffffff';
        sCtx.fillRect(4, 4, 2, 2);
        if (scene.textures.exists('sparkle')) scene.textures.remove('sparkle');
        scene.textures.addCanvas('sparkle', sCanvas);

        // Landing Dust Puffs (12x12)
        const dCanvas = document.createElement('canvas');
        dCanvas.width = 12;
        dCanvas.height = 12;
        const dCtx = dCanvas.getContext('2d');
        dCtx.fillStyle = 'rgba(214, 211, 209, 0.8)';
        dCtx.beginPath();
        dCtx.arc(6, 6, 5, 0, Math.PI * 2);
        dCtx.fill();
        dCtx.fillStyle = 'rgba(245, 245, 244, 0.9)';
        dCtx.beginPath();
        dCtx.arc(5, 5, 3, 0, Math.PI * 2);
        dCtx.fill();
        if (scene.textures.exists('dust')) scene.textures.remove('dust');
        scene.textures.addCanvas('dust', dCanvas);

        // Water Splash Drops (8x8)
        const wCanvas = document.createElement('canvas');
        wCanvas.width = 8;
        wCanvas.height = 8;
        const wCtx = wCanvas.getContext('2d');
        wCtx.fillStyle = '#38bdf8';
        wCtx.beginPath();
        wCtx.arc(4, 4, 3.5, 0, Math.PI * 2);
        wCtx.fill();
        wCtx.fillStyle = '#ffffff';
        wCtx.fillRect(3, 3, 2, 2);
        if (scene.textures.exists('water_drop')) scene.textures.remove('water_drop');
        scene.textures.addCanvas('water_drop', wCanvas);

        // Volumetric Drifting Swamp Mist Cloud (128x64)
        const mCanvas = document.createElement('canvas');
        mCanvas.width = 128;
        mCanvas.height = 64;
        const mCtx = mCanvas.getContext('2d');
        const mGrad = mCtx.createRadialGradient(64, 32, 5, 64, 32, 60);
        mGrad.addColorStop(0, 'rgba(167, 243, 208, 0.18)');
        mGrad.addColorStop(0.5, 'rgba(134, 239, 172, 0.08)');
        mGrad.addColorStop(1, 'rgba(134, 239, 172, 0)');
        mCtx.fillStyle = mGrad;
        mCtx.fillRect(0, 0, 128, 64);
        if (scene.textures.exists('mist')) scene.textures.remove('mist');
        scene.textures.addCanvas('mist', mCanvas);
    }

    // --- 7. MULTI-LAYERED PARALLAX ATMOSPHERE ---
    static generateBackgrounds(scene) {
        // Layer 1: High Sky with Celestial Moon & Nebula (512x384)
        const skyCanvas = document.createElement('canvas');
        skyCanvas.width = 512;
        skyCanvas.height = 384;
        const sCtx = skyCanvas.getContext('2d');

        const skyGrad = sCtx.createLinearGradient(0, 0, 0, 384);
        skyGrad.addColorStop(0, '#090d16'); // Deep cosmic night
        skyGrad.addColorStop(0.4, '#1e1b4b'); // Twilight indigo
        skyGrad.addColorStop(0.75, '#4c1d95'); // Mysterious purple
        skyGrad.addColorStop(0.95, '#be185d'); // Swamp sunset magenta
        skyGrad.addColorStop(1, '#f97316'); // Golden horizon
        sCtx.fillStyle = skyGrad;
        sCtx.fillRect(0, 0, 512, 384);

        // Glowing Giant Moon
        const moonGrad = sCtx.createRadialGradient(420, 70, 5, 420, 70, 45);
        moonGrad.addColorStop(0, '#ffffff');
        moonGrad.addColorStop(0.3, '#fef08a');
        moonGrad.addColorStop(0.7, 'rgba(254, 240, 138, 0.35)');
        moonGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
        sCtx.fillStyle = moonGrad;
        sCtx.beginPath();
        sCtx.arc(420, 70, 45, 0, Math.PI * 2);
        sCtx.fill();

        // Moon disc
        sCtx.fillStyle = '#fef08a';
        sCtx.beginPath();
        sCtx.arc(420, 70, 24, 0, Math.PI * 2);
        sCtx.fill();

        // Lunar crater details
        sCtx.fillStyle = '#fde047';
        sCtx.beginPath();
        sCtx.arc(414, 64, 5, 0, Math.PI * 2);
        sCtx.arc(426, 78, 4, 0, Math.PI * 2);
        sCtx.arc(428, 62, 3, 0, Math.PI * 2);
        sCtx.fill();

        // Twinkling multi-colored stars
        for (let i = 0; i < 50; i++) {
            const sx = (i * 47) % 512;
            const sy = (i * 29) % 220;
            const isGold = (i % 3 === 0);
            sCtx.fillStyle = isGold ? '#fef08a' : '#ffffff';
            sCtx.fillRect(sx, sy, (i % 2) + 1, (i % 2) + 1);
        }

        if (scene.textures.exists('bg_sky')) scene.textures.remove('bg_sky');
        scene.textures.addCanvas('bg_sky', skyCanvas);

        // Layer 2: Distant Cypress & Willow Swamp Forest (512x384)
        const treesCanvas = document.createElement('canvas');
        treesCanvas.width = 512;
        treesCanvas.height = 384;
        const tCtx = treesCanvas.getContext('2d');

        // Atmospheric haze
        tCtx.fillStyle = 'rgba(15, 23, 42, 0.4)';
        tCtx.fillRect(0, 0, 512, 384);

        // Distant rolling swamp ridges
        tCtx.fillStyle = '#064e3b';
        for (let x = 0; x < 512; x += 85) {
            tCtx.beginPath();
            tCtx.ellipse(x + 40, 350, 70, 45, 0, 0, Math.PI * 2);
            tCtx.fill();

            // Cypress tree trunks with knobby bases
            tCtx.fillRect(x + 36, 210, 12, 130);

            // Layered willow canopies
            tCtx.beginPath();
            tCtx.arc(x + 42, 200, 48, 0, Math.PI * 2);
            tCtx.fill();

            // Hanging Spanish moss tendrils
            tCtx.fillStyle = '#047857';
            tCtx.fillRect(x + 10, 210, 4, 55);
            tCtx.fillRect(x + 24, 220, 5, 70);
            tCtx.fillRect(x + 50, 225, 5, 65);
            tCtx.fillRect(x + 68, 215, 4, 50);
            tCtx.fillStyle = '#064e3b';
        }

        if (scene.textures.exists('bg_trees')) scene.textures.remove('bg_trees');
        scene.textures.addCanvas('bg_trees', treesCanvas);
    }

    // --- 8. BOSS: KING CROAKER SPRITESHEET (96x80, 7 frames) ---
    static generateBoss(scene) {
        const frameW = 96;
        const frameH = 80;
        const numFrames = 7; // 0: Idle1, 1: Idle2 (Puff), 2: Crouch, 3: Slam, 4: Roar, 5: Stunned, 6: Hurt
        const canvas = document.createElement('canvas');
        canvas.width = frameW * numFrames;
        canvas.height = frameH;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        const Pal = {
            outline: '#0f051d',
            bodyDark: '#1e1b4b',
            skinShadow: '#064e3b',
            skinMid: '#047857',
            skinBright: '#10b981',
            skinHighlight: '#6ee7b7',
            wartViolet: '#7c3aed',
            wartLight: '#a855f7',
            bellyShadow: '#78350f',
            bellyMid: '#d97706',
            bellyLight: '#fbbf24',
            bellyGlow: '#fef08a',
            mouthDark: '#4c0519',
            mouthPink: '#e11d48',
            eyeSclera: '#fef08a',
            eyePupil: '#450a0a',
            eyeGlow: '#ef4444',
            crownDark: '#854d0e',
            crownGold: '#eab308',
            crownBright: '#fef08a',
            gemRed: '#dc2626',
            gemGlow: '#f87171'
        };

        const drawBossFrame = (frameIdx, pose) => {
            const ox = frameIdx * frameW;
            const oy = pose === 'crouch' ? 8 : (pose === 'slam' ? -4 : 0);

            // --- 1. HIND LEGS & WEBBED FEET ---
            ctx.fillStyle = Pal.skinShadow;
            if (pose === 'slam') {
                // Diving limbs kicked upward
                ctx.beginPath();
                ctx.ellipse(ox + 18, oy + 32, 10, 20, -0.4, 0, Math.PI * 2);
                ctx.ellipse(ox + 78, oy + 32, 10, 20, 0.4, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // Massive seated thighs
                ctx.beginPath();
                ctx.ellipse(ox + 16, oy + 56, 14, 18, -0.3, 0, Math.PI * 2);
                ctx.ellipse(ox + 80, oy + 56, 14, 18, 0.3, 0, Math.PI * 2);
                ctx.fill();

                // Sprawled clawed feet
                ctx.fillStyle = Pal.skinMid;
                ctx.fillRect(ox + 4, oy + 68, 22, 9);
                ctx.fillRect(ox + 70, oy + 68, 22, 9);
                ctx.fillStyle = Pal.skinHighlight;
                ctx.fillRect(ox + 2, oy + 73, 5, 4);
                ctx.fillRect(ox + 89, oy + 73, 5, 4);
            }

            // --- 2. MAIN BODY TRUNK ---
            ctx.fillStyle = Pal.outline;
            ctx.beginPath();
            ctx.ellipse(ox + 48, oy + 46, 32, pose === 'crouch' ? 24 : 28, 0, 0, Math.PI * 2);
            ctx.fill();

            // Dark royal volume
            ctx.fillStyle = Pal.skinShadow;
            ctx.beginPath();
            ctx.ellipse(ox + 48, oy + 46, 30, pose === 'crouch' ? 22 : 26, 0, 0, Math.PI * 2);
            ctx.fill();

            // Emerald mid tone
            ctx.fillStyle = Pal.skinMid;
            ctx.beginPath();
            ctx.ellipse(ox + 48, oy + 44, 27, pose === 'crouch' ? 19 : 23, 0, 0, Math.PI * 2);
            ctx.fill();

            // Vibrant armor back
            ctx.fillStyle = Pal.skinBright;
            ctx.beginPath();
            ctx.ellipse(ox + 48, oy + 40, 22, pose === 'crouch' ? 15 : 18, 0, 0, Math.PI * 2);
            ctx.fill();

            // Poisonous glowing warty studs
            ctx.fillStyle = Pal.wartViolet;
            ctx.beginPath();
            ctx.arc(ox + 30, oy + 32, 4, 0, Math.PI * 2);
            ctx.arc(ox + 66, oy + 32, 4, 0, Math.PI * 2);
            ctx.arc(ox + 26, oy + 46, 5, 0, Math.PI * 2);
            ctx.arc(ox + 70, oy + 46, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = Pal.wartLight;
            ctx.fillRect(ox + 29, oy + 30, 2, 2);
            ctx.fillRect(ox + 65, oy + 30, 2, 2);
            ctx.fillRect(ox + 25, oy + 44, 2, 2);
            ctx.fillRect(ox + 69, oy + 44, 2, 2);

            // --- 3. MASSIVE BELLY / VOCAL SAC ---
            const bellySwell = pose === 'idle2' ? 6 : (pose === 'roar' ? 10 : 0);
            ctx.fillStyle = Pal.bellyShadow;
            ctx.beginPath();
            ctx.ellipse(ox + 48, oy + 54, 22 + bellySwell, 16 + bellySwell * 0.7, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = Pal.bellyMid;
            ctx.beginPath();
            ctx.ellipse(ox + 48, oy + 53, 19 + bellySwell, 13 + bellySwell * 0.6, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = Pal.bellyLight;
            ctx.beginPath();
            ctx.ellipse(ox + 48, oy + 51, 14 + bellySwell, 9 + bellySwell * 0.5, 0, 0, Math.PI * 2);
            ctx.fill();

            if (pose === 'idle2' || pose === 'roar') {
                ctx.fillStyle = Pal.bellyGlow;
                ctx.beginPath();
                ctx.ellipse(ox + 48, oy + 50, 10 + bellySwell, 6, 0, 0, Math.PI * 2);
                ctx.fill();
            }

            // --- 4. FOREARMS & GOLDEN BRACERS ---
            ctx.fillStyle = Pal.skinMid;
            ctx.fillRect(ox + 20, oy + 46, 9, 20);
            ctx.fillRect(ox + 67, oy + 46, 9, 20);

            // Spiked Gold Bracers
            ctx.fillStyle = Pal.crownGold;
            ctx.fillRect(ox + 18, oy + 56, 13, 8);
            ctx.fillRect(ox + 65, oy + 56, 13, 8);
            ctx.fillStyle = Pal.crownBright;
            ctx.fillRect(ox + 18, oy + 56, 13, 2);
            ctx.fillRect(ox + 65, oy + 56, 13, 2);
            // Bracer spikes
            ctx.fillStyle = Pal.crownBright;
            ctx.fillRect(ox + 15, oy + 59, 3, 2);
            ctx.fillRect(ox + 78, oy + 59, 3, 2);

            // Front webbed hands resting on floor
            ctx.fillStyle = Pal.skinShadow;
            ctx.fillRect(ox + 16, oy + 68, 16, 7);
            ctx.fillRect(ox + 64, oy + 68, 16, 7);

            // --- 5. HEAD & FACIAL FEATURES ---
            const headY = oy + 24;

            if (pose === 'roar') {
                // Giant gaping maw
                ctx.fillStyle = Pal.mouthDark;
                ctx.beginPath();
                ctx.ellipse(ox + 48, headY + 12, 24, 15, 0, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = Pal.mouthPink;
                ctx.beginPath();
                ctx.ellipse(ox + 48, headY + 14, 18, 10, 0, 0, Math.PI * 2);
                ctx.fill();

                // Razor fangs
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(ox + 34, headY + 4, 4, 5);
                ctx.fillRect(ox + 42, headY + 3, 4, 6);
                ctx.fillRect(ox + 50, headY + 3, 4, 6);
                ctx.fillRect(ox + 58, headY + 4, 4, 5);
                ctx.fillRect(ox + 38, headY + 19, 4, 5);
                ctx.fillRect(ox + 54, headY + 19, 4, 5);
            } else if (pose === 'stunned') {
                // Lolling tongue
                ctx.fillStyle = Pal.mouthPink;
                ctx.fillRect(ox + 42, headY + 15, 12, 16);
                ctx.fillRect(ox + 44, headY + 28, 10, 6);
                ctx.fillStyle = '#f43f5e';
                ctx.fillRect(ox + 46, headY + 16, 4, 16);
            }

            // Eyes
            const eyeY = headY - (pose === 'crouch' ? 2 : 6);
            if (pose === 'stunned') {
                // Spiral / Cross eyes
                ctx.strokeStyle = '#fef08a';
                ctx.lineWidth = 2.5;
                // Left X
                ctx.beginPath();
                ctx.moveTo(ox + 31, eyeY - 4); ctx.lineTo(ox + 39, eyeY + 4);
                ctx.moveTo(ox + 39, eyeY - 4); ctx.lineTo(ox + 31, eyeY + 4);
                ctx.stroke();
                // Right X
                ctx.beginPath();
                ctx.moveTo(ox + 57, eyeY - 4); ctx.lineTo(ox + 65, eyeY + 4);
                ctx.moveTo(ox + 65, eyeY - 4); ctx.lineTo(ox + 57, eyeY + 4);
                ctx.stroke();

                // Orbiting Stun Stars above crown
                ctx.fillStyle = '#fde047';
                ctx.fillRect(ox + 22, oy + 4, 6, 6);
                ctx.fillRect(ox + 70, oy + 6, 5, 5);
                ctx.fillRect(ox + 46, oy - 2, 7, 7);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(ox + 24, oy + 5, 2, 2);
                ctx.fillRect(ox + 48, oy - 1, 2, 2);
            } else {
                // Fierce Glowing Crowned Eyes
                // Eye sockets
                ctx.fillStyle = Pal.skinShadow;
                ctx.beginPath();
                ctx.arc(ox + 34, eyeY, 9, 0, Math.PI * 2);
                ctx.arc(ox + 62, eyeY, 9, 0, Math.PI * 2);
                ctx.fill();

                // Yellow sclera
                ctx.fillStyle = pose === 'hurt' ? '#ffffff' : Pal.eyeSclera;
                ctx.beginPath();
                ctx.arc(ox + 34, eyeY, 7, 0, Math.PI * 2);
                ctx.arc(ox + 62, eyeY, 7, 0, Math.PI * 2);
                ctx.fill();

                // Slit pupils & Red aura
                ctx.fillStyle = Pal.eyeGlow;
                ctx.fillRect(ox + 32, eyeY - 5, 4, 10);
                ctx.fillRect(ox + 60, eyeY - 5, 4, 10);
                ctx.fillStyle = Pal.eyePupil;
                ctx.fillRect(ox + 33, eyeY - 4, 2, 8);
                ctx.fillRect(ox + 61, eyeY - 4, 2, 8);
            }

            // --- 6. MAJESTIC ROYAL CROWN ---
            const crownY = headY - 14 + (pose === 'crouch' ? 3 : 0);
            const crownTilt = pose === 'stunned' ? -0.18 : 0;

            ctx.save();
            ctx.translate(ox + 48, crownY);
            ctx.rotate(crownTilt);

            // Crown Base rim
            ctx.fillStyle = Pal.crownDark;
            ctx.fillRect(-22, 0, 44, 7);
            ctx.fillStyle = Pal.crownGold;
            ctx.fillRect(-20, 1, 40, 5);
            ctx.fillStyle = Pal.crownBright;
            ctx.fillRect(-20, 1, 40, 2);

            // 5 Crown Spikes
            // Center tall spike
            ctx.fillStyle = Pal.crownGold;
            ctx.beginPath();
            ctx.moveTo(-7, 0); ctx.lineTo(0, -16); ctx.lineTo(7, 0);
            ctx.fill();
            // Flanking mid spikes
            ctx.beginPath();
            ctx.moveTo(-16, 0); ctx.lineTo(-12, -12); ctx.lineTo(-7, 0);
            ctx.moveTo(7, 0); ctx.lineTo(12, -12); ctx.lineTo(16, 0);
            ctx.fill();
            // Outer small spikes
            ctx.beginPath();
            ctx.moveTo(-21, 0); ctx.lineTo(-19, -8); ctx.lineTo(-15, 0);
            ctx.moveTo(15, 0); ctx.lineTo(19, -8); ctx.lineTo(21, 0);
            ctx.fill();

            // Gold highlight rims
            ctx.fillStyle = Pal.crownBright;
            ctx.fillRect(-1, -16, 2, 14);
            ctx.fillRect(-13, -12, 2, 10);
            ctx.fillRect(11, -12, 2, 10);

            // Large Center Ruby Gem
            ctx.fillStyle = Pal.gemRed;
            ctx.beginPath();
            ctx.arc(0, 3, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = Pal.gemGlow;
            ctx.fillRect(-1, 1, 2, 2);

            // Flanking small emeralds
            ctx.fillStyle = '#059669';
            ctx.fillRect(-14, 2, 3, 3);
            ctx.fillRect(11, 2, 3, 3);

            ctx.restore();

            // Hurt flash overlay
            if (pose === 'hurt') {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
                ctx.beginPath();
                ctx.ellipse(ox + 48, oy + 40, 36, 32, 0, 0, Math.PI * 2);
                ctx.fill();
            }
        };

        drawBossFrame(0, 'idle1');
        drawBossFrame(1, 'idle2');
        drawBossFrame(2, 'crouch');
        drawBossFrame(3, 'slam');
        drawBossFrame(4, 'roar');
        drawBossFrame(5, 'stunned');
        drawBossFrame(6, 'hurt');

        if (scene.textures.exists('boss_croaker')) scene.textures.remove('boss_croaker');
        scene.textures.addSpriteSheet('boss_croaker', canvas, {
            frameWidth: frameW,
            frameHeight: frameH
        });
    }

    // --- 9. BOSS VFX & OBJECTS ---
    static generateBossVFX(scene) {
        const createGraphic = (key, w, h, drawFn) => {
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = false;
            drawFn(ctx, w, h);
            if (scene.textures.exists(key)) scene.textures.remove(key);
            scene.textures.addCanvas(key, canvas);
        };

        // 1. Boss Ground Shockwave (48x32)
        createGraphic('boss_shockwave', 48, 32, (ctx, w, h) => {
            // Jagged rising stone teeth
            ctx.fillStyle = '#1e1b4b';
            ctx.beginPath();
            ctx.moveTo(0, h); ctx.lineTo(12, 14); ctx.lineTo(18, 22); ctx.lineTo(28, 4); ctx.lineTo(38, 18); ctx.lineTo(48, h);
            ctx.fill();

            // Sharp stone mid
            ctx.fillStyle = '#334155';
            ctx.beginPath();
            ctx.moveTo(2, h); ctx.lineTo(12, 16); ctx.lineTo(18, 24); ctx.lineTo(28, 7); ctx.lineTo(36, 20); ctx.lineTo(46, h);
            ctx.fill();

            // Glowing purple energy aura
            ctx.fillStyle = '#a855f7';
            ctx.fillRect(11, 12, 3, 5);
            ctx.fillRect(27, 2, 3, 6);
            ctx.fillRect(35, 15, 3, 5);

            // Crest sparks
            ctx.fillStyle = '#fde047';
            ctx.fillRect(27, 0, 3, 2);
            ctx.fillRect(11, 10, 2, 2);
        });

        // 2. Boss Venom Spitball (24x24)
        createGraphic('venom_ball', 24, 24, (ctx, w, h) => {
            const rad = ctx.createRadialGradient(12, 12, 2, 12, 12, 11);
            rad.addColorStop(0, '#fef08a');
            rad.addColorStop(0.3, '#a855f7');
            rad.addColorStop(0.7, '#7c3aed');
            rad.addColorStop(1, 'rgba(124, 58, 237, 0)');
            ctx.fillStyle = rad;
            ctx.beginPath();
            ctx.arc(12, 12, 11, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ec4899';
            ctx.beginPath();
            ctx.arc(12, 12, 6, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.fillRect(9, 8, 3, 3);
        });

        // 3. Spiked Iron Portcullis Arena Gate (32x160)
        createGraphic('boss_gate', 32, 160, (ctx, w, h) => {
            // Stone lintel arch header
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, w, 20);
            ctx.fillStyle = '#334155';
            ctx.fillRect(2, 2, w - 4, 16);
            // Skull emblem
            ctx.fillStyle = '#94a3b8';
            ctx.fillRect(12, 5, 8, 7);
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(13, 8, 2, 2);
            ctx.fillRect(17, 8, 2, 2);

            // Vertical iron grate bars
            const bars = [4, 11, 18, 25];
            bars.forEach(bx => {
                ctx.fillStyle = '#1e293b';
                ctx.fillRect(bx, 20, 4, 125);
                ctx.fillStyle = '#475569';
                ctx.fillRect(bx + 1, 20, 2, 125);
                // Vicious pointed spike at bottom
                ctx.fillStyle = '#94a3b8';
                ctx.beginPath();
                ctx.moveTo(bx - 1, 145); ctx.lineTo(bx + 2, 158); ctx.lineTo(bx + 5, 145);
                ctx.fill();
            });

            // Horizontal crossbeams
            [40, 75, 110, 140].forEach(by => {
                ctx.fillStyle = '#0f172a';
                ctx.fillRect(0, by, w, 6);
                ctx.fillStyle = '#334155';
                ctx.fillRect(0, by + 1, w, 4);
                // Rivets
                ctx.fillStyle = '#cbd5e1';
                ctx.fillRect(5, by + 2, 2, 2);
                ctx.fillRect(12, by + 2, 2, 2);
                ctx.fillRect(19, by + 2, 2, 2);
                ctx.fillRect(26, by + 2, 2, 2);
            });
        });

        // 4. Ancient Wall Torch Sconce (24x36)
        createGraphic('boss_torch', 24, 36, (ctx, w, h) => {
            // Stone bracket mounted on wall
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(8, 20, 8, 14);
            ctx.fillStyle = '#475569';
            ctx.fillRect(6, 18, 12, 5);

            // Brazier cup
            ctx.fillStyle = '#64748b';
            ctx.fillRect(5, 14, 14, 5);

            // Blazing violet/amber torch flame
            ctx.fillStyle = '#a855f7';
            ctx.beginPath();
            ctx.moveTo(6, 14); ctx.lineTo(12, 2); ctx.lineTo(18, 14);
            ctx.fill();

            ctx.fillStyle = '#ec4899';
            ctx.beginPath();
            ctx.moveTo(8, 14); ctx.lineTo(12, 5); ctx.lineTo(16, 14);
            ctx.fill();

            ctx.fillStyle = '#fef08a';
            ctx.beginPath();
            ctx.moveTo(10, 14); ctx.lineTo(12, 8); ctx.lineTo(14, 14);
            ctx.fill();
        });

        // 5. Ancient Carved Monolith Pillar (40x140)
        createGraphic('boss_pillar', 40, 140, (ctx, w, h) => {
            // Column Base
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, h - 24, w, 24);
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(3, h - 21, w - 6, 18);
            ctx.fillStyle = '#334155';
            ctx.fillRect(6, h - 18, w - 12, 6);

            // Column Capital top
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, w, 20);
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(3, 3, w - 6, 14);

            // Fluted Column Shaft
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(6, 20, 28, h - 44);

            // Vertical flutes
            for (let x = 8; x <= 28; x += 6) {
                ctx.fillStyle = '#0f172a';
                ctx.fillRect(x, 20, 2, h - 44);
                ctx.fillStyle = '#334155';
                ctx.fillRect(x + 2, 20, 3, h - 44);
            }

            // Glowing engraved purple runes down the center
            ctx.fillStyle = '#a855f7';
            const runes = [35, 55, 75, 95];
            runes.forEach(ry => {
                ctx.fillRect(17, ry, 6, 2);
                ctx.fillRect(19, ry + 2, 2, 8);
                ctx.fillRect(17, ry + 10, 6, 2);
                ctx.fillStyle = '#fde047';
                ctx.fillRect(19, ry + 4, 2, 2);
                ctx.fillStyle = '#a855f7';
            });
        });

        // 6. Boss Heart Pip for HUD (20x20)
        createGraphic('boss_heart', 20, 20, (ctx, w, h) => {
            // Spiked gold casing
            ctx.fillStyle = '#ca8a04';
            ctx.fillRect(3, 3, 14, 14);
            ctx.fillRect(1, 7, 18, 6);
            ctx.fillRect(7, 1, 6, 18);

            // Crimson ruby jewel
            ctx.fillStyle = '#dc2626';
            ctx.fillRect(4, 4, 12, 12);
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(5, 5, 10, 10);
            ctx.fillStyle = '#fca5a5';
            ctx.fillRect(6, 6, 3, 3);
        });
    }

    // --- 10. BOSS ARENA TILES ---
    static generateBossTiles(scene) {
        const createTile = (key, w, h, drawFn) => {
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = false;
            drawFn(ctx, w, h);
            if (scene.textures.exists(key)) scene.textures.remove(key);
            scene.textures.addCanvas(key, canvas);
        };

        // 1. Dark Citadel Top Brick (32x32) with weathered slate slab & glowing purple moss
        createTile('tile_boss_brick', 32, 32, (ctx, w, h) => {
            // Dark masonry base
            ctx.fillStyle = '#090d16';
            ctx.fillRect(0, 0, w, h);

            // Main stone brick
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(1, 1, w - 2, h - 2);

            // Top weathered slab
            ctx.fillStyle = '#334155';
            ctx.fillRect(1, 1, w - 2, 8);
            ctx.fillStyle = '#475569';
            ctx.fillRect(1, 1, w - 2, 3);

            // Glowing purple mystic moss & runes on the top surface
            ctx.fillStyle = '#7c3aed';
            ctx.fillRect(3, 4, 8, 3);
            ctx.fillRect(18, 4, 10, 3);
            ctx.fillStyle = '#c084fc';
            ctx.fillRect(5, 5, 4, 1);
            ctx.fillRect(20, 5, 5, 1);

            // Chiseled mortar lines
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 16, w, 2);
            ctx.fillRect(15, 18, 2, 14);

            // Embedded cracked stone fissure
            ctx.fillStyle = '#020617';
            ctx.fillRect(8, 20, 2, 5);
            ctx.fillRect(10, 25, 2, 4);
        });

        // 2. Sub-Fortress Basalt Stone (32x32)
        createTile('tile_boss_sub', 32, 32, (ctx, w, h) => {
            ctx.fillStyle = '#090d16';
            ctx.fillRect(0, 0, w, h);

            ctx.fillStyle = '#1e293b';
            ctx.fillRect(1, 1, 14, 14);
            ctx.fillRect(17, 1, 14, 14);
            ctx.fillRect(1, 17, 30, 14);

            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 15, w, 2);
            ctx.fillRect(15, 0, 2, 15);

            // Subtle dungeon brick texture
            ctx.fillStyle = '#334155';
            ctx.fillRect(3, 3, 4, 3);
            ctx.fillRect(19, 3, 5, 3);
            ctx.fillRect(5, 19, 6, 3);
            ctx.fillRect(22, 20, 6, 3);
        });

        // 3. Toxic Cursed Violet Water (32x32)
        createTile('tile_boss_water', 32, 32, (ctx, w, h) => {
            // Deep abyssal purple
            ctx.fillStyle = '#2e1065';
            ctx.fillRect(0, 0, w, h);

            // Toxic bioluminescent water layer
            ctx.fillStyle = '#581c87';
            ctx.fillRect(0, 4, w, h - 4);

            // Glowing wavy caustics
            ctx.fillStyle = '#a855f7';
            ctx.fillRect(0, 1, 8, 3);
            ctx.fillRect(12, 0, 10, 4);
            ctx.fillRect(26, 2, 6, 2);

            // Specular pink foam
            ctx.fillStyle = '#f472b6';
            ctx.fillRect(14, 0, 6, 1);
            ctx.fillRect(2, 1, 4, 1);

            // Rising toxic bubbles
            ctx.fillStyle = '#c084fc';
            ctx.fillRect(6, 14, 3, 3);
            ctx.fillRect(22, 20, 4, 4);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(7, 15, 1, 1);
            ctx.fillRect(23, 21, 1, 1);
        });
    }

    // --- 11. BOSS BACKGROUNDS (Blood Moon Eclipse & Sunken Citadel Ruins) ---
    static generateBossBackgrounds(scene) {
        // Sky (512x384): Blood Moon Eclipse
        const skyCanvas = document.createElement('canvas');
        skyCanvas.width = 512;
        skyCanvas.height = 384;
        const sCtx = skyCanvas.getContext('2d');

        const skyGrad = sCtx.createLinearGradient(0, 0, 0, 384);
        skyGrad.addColorStop(0, '#090514');
        skyGrad.addColorStop(0.35, '#2e1065');
        skyGrad.addColorStop(0.65, '#581c87');
        skyGrad.addColorStop(0.85, '#831843');
        skyGrad.addColorStop(1, '#450a0a');
        sCtx.fillStyle = skyGrad;
        sCtx.fillRect(0, 0, 512, 384);

        // Huge Eerie Blood Moon with Corona
        const moonGrad = sCtx.createRadialGradient(256, 110, 5, 256, 110, 65);
        moonGrad.addColorStop(0, '#fecdd3');
        moonGrad.addColorStop(0.3, '#f43f5e');
        moonGrad.addColorStop(0.65, 'rgba(190, 24, 93, 0.4)');
        moonGrad.addColorStop(1, 'rgba(190, 24, 93, 0)');
        sCtx.fillStyle = moonGrad;
        sCtx.beginPath();
        sCtx.arc(256, 110, 65, 0, Math.PI * 2);
        sCtx.fill();

        // Moon disc
        sCtx.fillStyle = '#e11d48';
        sCtx.beginPath();
        sCtx.arc(256, 110, 34, 0, Math.PI * 2);
        sCtx.fill();

        // Eclipse shadow / basalt craters
        sCtx.fillStyle = '#881337';
        sCtx.beginPath();
        sCtx.arc(248, 104, 8, 0, Math.PI * 2);
        sCtx.arc(266, 118, 10, 0, Math.PI * 2);
        sCtx.arc(244, 122, 6, 0, Math.PI * 2);
        sCtx.fill();

        // Crimson cosmic stars
        for (let i = 0; i < 60; i++) {
            const sx = (i * 53) % 512;
            const sy = (i * 31) % 230;
            sCtx.fillStyle = (i % 2 === 0) ? '#fda4af' : '#c084fc';
            sCtx.fillRect(sx, sy, (i % 2) + 1, (i % 2) + 1);
        }

        if (scene.textures.exists('bg_sky_boss')) scene.textures.remove('bg_sky_boss');
        scene.textures.addCanvas('bg_sky_boss', skyCanvas);

        // Ruins (512x384): Gothic Sunken Citadel Silhouette
        const rCanvas = document.createElement('canvas');
        rCanvas.width = 512;
        rCanvas.height = 384;
        const rCtx = rCanvas.getContext('2d');

        // Dark fortress spires & crumbling arches
        rCtx.fillStyle = '#0f0b1f';
        rCtx.beginPath();
        // Left castle tower
        rCtx.fillRect(20, 140, 60, 244);
        rCtx.fillRect(10, 125, 80, 25);
        // Tower battlements
        rCtx.fillRect(10, 110, 18, 20);
        rCtx.fillRect(41, 110, 18, 20);
        rCtx.fillRect(72, 110, 18, 20);

        // Mid grand cathedral ruin arch
        rCtx.fillRect(140, 190, 30, 194);
        rCtx.fillRect(290, 190, 30, 194);
        rCtx.beginPath();
        rCtx.arc(230, 210, 75, Math.PI, 0);
        rCtx.lineTo(320, 230);
        rCtx.arc(230, 210, 45, 0, Math.PI, true);
        rCtx.closePath();
        rCtx.fill();

        // Right spire
        rCtx.fillRect(380, 120, 50, 264);
        rCtx.beginPath();
        rCtx.moveTo(370, 120); rCtx.lineTo(405, 50); rCtx.lineTo(440, 120);
        rCtx.fill();

        // Glowing braziers on towers
        rCtx.fillStyle = '#ec4899';
        rCtx.fillRect(45, 120, 10, 6);
        rCtx.fillRect(400, 114, 10, 6);
        rCtx.fillStyle = '#fef08a';
        rCtx.fillRect(48, 122, 4, 3);
        rCtx.fillRect(403, 116, 4, 3);

        // Rising ominous purple ground mist
        const mistGrad = rCtx.createLinearGradient(0, 280, 0, 384);
        mistGrad.addColorStop(0, 'rgba(124, 58, 237, 0)');
        mistGrad.addColorStop(1, 'rgba(88, 28, 135, 0.7)');
        rCtx.fillStyle = mistGrad;
        rCtx.fillRect(0, 280, 512, 104);

        if (scene.textures.exists('bg_ruins_boss')) scene.textures.remove('bg_ruins_boss');
        scene.textures.addCanvas('bg_ruins_boss', rCanvas);
    }
}

window.AssetGenerator = AssetGenerator;
