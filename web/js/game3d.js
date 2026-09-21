/**
 * Ribbit's Big Adventure - 3D Three.js Diorama Engine
 * 
 * Features:
 * - 2.5D Tilt-Shift Miniature Terrarium aesthetic
 * - Procedural 3D Ribbit model with animated throat puffs, eye blinks, leg articulation & squash-and-stretch
 * - Dynamic translucent water with animated sine wave ripples & underwater depth
 * - Responsive lilypads that tilt, dip, and bob with expanding circular ripple rings
 * - Elastic bounce mushrooms with spring-compression physics
 * - Glowing 3D fireflies with real-time point lights and particle halos
 * - Volumetric swamp lighting, soft shadows (PCFSoftShadowMap), and moody atmospheric fog
 * - Physical 3D tongue whip / grapple for catching collectibles
 * - Direct integration with LevelBuilder.getLevels() (Levels 1-5, JEV verified)
 * - SoundEngine Web Audio integration
 */

class FrogGame3D {
    constructor() {
        this.container = document.getElementById('game-container');
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = new THREE.Clock();

        // Level data
        this.levels = LevelBuilder.getLevels();
        this.currentLevelIdx = 0;
        this.currentLevel = this.levels[this.currentLevelIdx];

        // World scale: 1 unit in 3D = 40 pixels in 2D
        this.SCALE = 0.025; // 1 / 40
        this.WATER_Y = 0.0;

        // Player state
        this.player = {
            mesh: null,
            body: null,
            head: null,
            belly: null,
            throat: null,
            leftEye: null,
            rightEye: null,
            leftPupil: null,
            rightPupil: null,
            leftLeg: null,
            rightLeg: null,
            leftFoot: null,
            rightFoot: null,
            tongueMesh: null,
            // Physics
            x: 2.0,
            y: 3.0,
            z: 0.0,
            vx: 0.0,
            vy: 0.0,
            isGrounded: false,
            facing: 1, // 1: right, -1: left
            coyoteTimer: 0.0,
            jumpBufferTimer: 0.0,
            isSuperJumping: false,
            // Animation
            squashY: 1.0,
            squashTarget: 1.0,
            breathPhase: 0.0,
            blinkTimer: 3.0,
            isTongueOut: false,
            tongueProgress: 0.0,
            tongueTarget: null,
            // Gameplay stats
            fireflies: 0,
            maxFireflies: 0,
            goldenLotusCollected: false,
            respawns: 0
        };

        // Input state
        this.keys = {
            left: false,
            right: false,
            jump: false,
            tongue: false,
            sprint: false
        };

        // Interactive entities
        this.platforms = [];
        this.lilypads = [];
        this.mushrooms = [];
        this.fireflies = [];
        this.waterRipples = [];
        this.particles = [];
        this.torches = [];
        this.enemies = [];

        // Camera settings
        this.cameraMode = 'diorama'; // 'diorama', 'sidescroll', 'free'
        this.camOffset = new THREE.Vector3(2.5, 4.5, 14.0);
        this.camLookOffset = new THREE.Vector3(1.0, 1.2, 0.0);
        this.camCurrentPos = new THREE.Vector3();
        this.camCurrentLook = new THREE.Vector3();

        // Audio
        this.soundEngine = window.soundEngine || new SoundEngine();

        // Init
        this.initThree();
        this.buildLevel(this.currentLevelIdx);
        this.setupInputs();
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    // ==========================================
    // 1. THREE.JS SCENE SETUP & LIGHTING
    // ==========================================
    initThree() {
        const width = this.container.clientWidth || window.innerWidth;
        const height = this.container.clientHeight || window.innerHeight;

        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x061113);
        this.scene.fog = new THREE.FogExp2(0x061517, 0.015);

        // Camera
        this.camera = new THREE.PerspectiveCamera(40, width / height, 0.2, 200);
        this.camera.position.set(2, 5, 14);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.15;
        this.container.appendChild(this.renderer.domElement);

        // Resize handler
        window.addEventListener('resize', () => {
            const w = this.container.clientWidth || window.innerWidth;
            const h = this.container.clientHeight || window.innerHeight;
            this.camera.aspect = w / h;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(w, h);
        });

        // --- LIGHTING ---
        // 1. Ambient Light (Moody deep swamp bioluminescence)
        const ambientLight = new THREE.AmbientLight(0x0f2b23, 1.3);
        this.scene.add(ambientLight);

        // 2. Directional Moonlight (High above-behind, casting soft shadows)
        this.sunLight = new THREE.DirectionalLight(0x93c5fd, 1.6);
        this.sunLight.position.set(10, 20, 12);
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.width = 2048;
        this.sunLight.shadow.mapSize.height = 2048;
        this.sunLight.shadow.camera.near = 0.5;
        this.sunLight.shadow.camera.far = 80;
        this.sunLight.shadow.camera.left = -25;
        this.sunLight.shadow.camera.right = 25;
        this.sunLight.shadow.camera.top = 20;
        this.sunLight.shadow.camera.bottom = -15;
        this.sunLight.shadow.bias = -0.0005;
        this.scene.add(this.sunLight);

        // 3. Hemisphere Swamp Bounce Light
        const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x052e16, 0.6);
        this.scene.add(hemiLight);

        // Create Materials Cache
        this.initMaterials();

        // Create Environment Background & Water
        this.createEnvironment();
    }

    initMaterials() {
        this.materials = {
            // Frog
            frogGreen: new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.35, metalness: 0.05 }),
            frogBelly: new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.4 }),
            frogThroat: new THREE.MeshStandardMaterial({ color: 0xfef9c3, emissive: 0xca8a04, emissiveIntensity: 0.15 }),
            eyeWhite: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1 }),
            eyePupil: new THREE.MeshBasicMaterial({ color: 0x022c22 }),
            eyeShine: new THREE.MeshBasicMaterial({ color: 0xffffff }),
            tongue: new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.2, emissive: 0x881337, emissiveIntensity: 0.2 }),
            // Platforms
            mossGrass: new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.8, metalness: 0.0 }),
            dirtStrata: new THREE.MeshStandardMaterial({ color: 0x3f2213, roughness: 0.95, metalness: 0.0 }),
            ancientStone: new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.85, metalness: 0.1 }),
            ruinBrick: new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8, metalness: 0.15 }),
            // Foliage & Mushrooms
            lilypadLeaf: new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.4, side: THREE.DoubleSide }),
            lilyFlower: new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.3 }),
            shroomStalk: new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 }),
            shroomCap: new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.25, emissive: 0x7f1d1d, emissiveIntensity: 0.15 }),
            shroomSpot: new THREE.MeshBasicMaterial({ color: 0xffedd5 }),
            cattailStem: new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.6 }),
            cattailHead: new THREE.MeshStandardMaterial({ color: 0x582914, roughness: 0.9 }),
            // Collectibles
            fireflyGlow: new THREE.MeshBasicMaterial({ color: 0xa7f3d0 }),
            goldenLotus: new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.2, metalness: 0.6, emissive: 0xca8a04, emissiveIntensity: 0.5 }),
            torchFlame: new THREE.MeshBasicMaterial({ color: 0xfbbf24 }),
            // Water
            water: new THREE.MeshStandardMaterial({
                color: 0x064e3b,
                roughness: 0.1,
                metalness: 0.15,
                transparent: true,
                opacity: 0.82
            })
        };
    }

    createEnvironment() {
        // --- 1. WATER PLANE ---
        const waterGeo = new THREE.PlaneGeometry(160, 40, 64, 32);
        waterGeo.rotateX(-Math.PI / 2);
        this.waterMesh = new THREE.Mesh(waterGeo, this.materials.water);
        this.waterMesh.position.set(40, this.WATER_Y, 0);
        this.waterMesh.receiveShadow = true;
        this.scene.add(this.waterMesh);

        // Water ripple container
        this.rippleGroup = new THREE.Group();
        this.scene.add(this.rippleGroup);

        // --- 2. SUBMERGED MARSH FLOOR (Depth layer beneath water) ---
        const swampBedGeo = new THREE.PlaneGeometry(160, 40);
        swampBedGeo.rotateX(-Math.PI / 2);
        const swampBedMat = new THREE.MeshBasicMaterial({ color: 0x031811 });
        const swampBed = new THREE.Mesh(swampBedGeo, swampBedMat);
        swampBed.position.set(40, this.WATER_Y - 2.5, 0);
        this.scene.add(swampBed);

        // --- 3. DISTANT SILHOUETTED CYPRESS TREES (Background Parallax) ---
        const treeGroup = new THREE.Group();
        const treeMat = new THREE.MeshBasicMaterial({ color: 0x041814 });
        
        for (let i = -10; i < 90; i += 7) {
            const trunkHeight = 12 + Math.random() * 8;
            const trunkGeo = new THREE.CylinderGeometry(0.3, 0.6, trunkHeight, 6);
            const trunk = new THREE.Mesh(trunkGeo, treeMat);
            trunk.position.set(i + Math.random() * 2, trunkHeight / 2 - 1, -12 - Math.random() * 6);
            treeGroup.add(trunk);

            // Canopy foliage
            const foliageGeo = new THREE.ConeGeometry(3.5 + Math.random() * 2, 8, 6);
            const foliage = new THREE.Mesh(foliageGeo, treeMat);
            foliage.position.set(trunk.position.x, trunk.position.y + trunkHeight * 0.4, trunk.position.z);
            treeGroup.add(foliage);
        }
        this.scene.add(treeGroup);

        // --- 4. GIANT FULL MOON ---
        const moonGeo = new THREE.CircleGeometry(8, 32);
        const moonMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe, fog: false });
        const moon = new THREE.Mesh(moonGeo, moonMat);
        moon.position.set(45, 26, -30);
        this.scene.add(moon);
    }

    // ==========================================
    // 2. RIBBIT 3D CHARACTER MODEL
    // ==========================================
    createPlayer() {
        const frogGroup = new THREE.Group();

        // 1. Torso Body (Egg-shaped smoothed mesh)
        const bodyGeo = new THREE.SphereGeometry(0.42, 16, 14);
        bodyGeo.scale(1.15, 0.9, 1.0);
        const body = new THREE.Mesh(bodyGeo, this.materials.frogGreen);
        body.castShadow = true;
        body.receiveShadow = true;
        frogGroup.add(body);
        this.player.body = body;

        // 2. Creamy Belly Oval
        const bellyGeo = new THREE.SphereGeometry(0.34, 14, 12);
        bellyGeo.scale(0.85, 0.75, 0.5);
        const belly = new THREE.Mesh(bellyGeo, this.materials.frogBelly);
        belly.position.set(0.12, -0.06, 0.22);
        belly.rotation.x = 0.2;
        frogGroup.add(belly);
        this.player.belly = belly;

        // 3. Throat Puff Sac (Puffs in & out when idle)
        const throatGeo = new THREE.SphereGeometry(0.2, 12, 10);
        throatGeo.scale(0.9, 0.7, 0.6);
        const throat = new THREE.Mesh(throatGeo, this.materials.frogThroat);
        throat.position.set(0.26, 0.04, 0.15);
        frogGroup.add(throat);
        this.player.throat = throat;

        // 4. Bulging Eye Turrets
        const eyeSocketGeo = new THREE.SphereGeometry(0.16, 12, 10);
        
        // Left Eye Socket
        const leftSocket = new THREE.Mesh(eyeSocketGeo, this.materials.frogGreen);
        leftSocket.position.set(0.12, 0.32, -0.16);
        frogGroup.add(leftSocket);

        // Right Eye Socket
        const rightSocket = new THREE.Mesh(eyeSocketGeo, this.materials.frogGreen);
        rightSocket.position.set(0.12, 0.32, 0.16);
        frogGroup.add(rightSocket);

        // Eyeballs
        const eyeballGeo = new THREE.SphereGeometry(0.11, 12, 10);
        const pupilGeo = new THREE.SphereGeometry(0.05, 8, 8);
        const shineGeo = new THREE.SphereGeometry(0.02, 6, 6);

        // Left Eye
        const leftEyeball = new THREE.Mesh(eyeballGeo, this.materials.eyeWhite);
        leftEyeball.position.set(0.16, 0.34, -0.16);
        frogGroup.add(leftEyeball);
        const leftPupil = new THREE.Mesh(pupilGeo, this.materials.eyePupil);
        leftPupil.position.set(0.24, 0.35, -0.16);
        frogGroup.add(leftPupil);
        const leftShine = new THREE.Mesh(shineGeo, this.materials.eyeShine);
        leftShine.position.set(0.26, 0.37, -0.18);
        frogGroup.add(leftShine);

        // Right Eye
        const rightEyeball = new THREE.Mesh(eyeballGeo, this.materials.eyeWhite);
        rightEyeball.position.set(0.16, 0.34, 0.16);
        frogGroup.add(rightEyeball);
        const rightPupil = new THREE.Mesh(pupilGeo, this.materials.eyePupil);
        rightPupil.position.set(0.24, 0.35, 0.16);
        frogGroup.add(rightPupil);
        const rightShine = new THREE.Mesh(shineGeo, this.materials.eyeShine);
        rightShine.position.set(0.26, 0.37, 0.14);
        frogGroup.add(rightShine);

        this.player.leftPupil = leftPupil;
        this.player.rightPupil = rightPupil;

        // 5. Articulated Hind Legs
        const thighGeo = new THREE.SphereGeometry(0.18, 10, 8);
        thighGeo.scale(1.2, 0.6, 0.7);
        const footGeo = new THREE.BoxGeometry(0.22, 0.05, 0.18);

        // Left Thigh & Foot
        const leftThigh = new THREE.Mesh(thighGeo, this.materials.frogGreen);
        leftThigh.position.set(-0.2, -0.12, -0.28);
        leftThigh.rotation.set(-0.3, 0.2, -0.4);
        frogGroup.add(leftThigh);
        this.player.leftLeg = leftThigh;

        const leftFoot = new THREE.Mesh(footGeo, this.materials.frogGreen);
        leftFoot.position.set(0.05, -0.32, -0.25);
        frogGroup.add(leftFoot);
        this.player.leftFoot = leftFoot;

        // Right Thigh & Foot
        const rightThigh = new THREE.Mesh(thighGeo, this.materials.frogGreen);
        rightThigh.position.set(-0.2, -0.12, 0.28);
        rightThigh.rotation.set(0.3, -0.2, -0.4);
        frogGroup.add(rightThigh);
        this.player.rightLeg = rightThigh;

        const rightFoot = new THREE.Mesh(footGeo, this.materials.frogGreen);
        rightFoot.position.set(0.05, -0.32, 0.25);
        frogGroup.add(rightFoot);
        this.player.rightFoot = rightFoot;

        // 6. Tongue Cylinder Mesh (hidden until tongue is activated)
        const tongueGeo = new THREE.CylinderGeometry(0.04, 0.07, 1.0, 8);
        tongueGeo.rotateZ(Math.PI / 2);
        tongueGeo.translate(0.5, 0, 0);
        const tongue = new THREE.Mesh(tongueGeo, this.materials.tongue);
        tongue.visible = false;
        tongue.position.set(0.3, 0.05, 0);
        frogGroup.add(tongue);
        this.player.tongueMesh = tongue;

        this.player.mesh = frogGroup;
        this.scene.add(frogGroup);
    }

    // ==========================================
    // 3. PROCEDURAL 3D LEVEL BUILDER
    // ==========================================
    buildLevel(levelIdx) {
        // Clear previous entities
        if (this.player.mesh) this.scene.remove(this.player.mesh);
        this.platforms.forEach(p => this.scene.remove(p.mesh));
        this.lilypads.forEach(l => this.scene.remove(l.mesh));
        this.mushrooms.forEach(m => this.scene.remove(m.mesh));
        this.fireflies.forEach(f => {
            this.scene.remove(f.mesh);
            if (f.light) this.scene.remove(f.light);
        });
        this.torches.forEach(t => {
            this.scene.remove(t.mesh);
            if (t.light) this.scene.remove(t.light);
        });
        this.enemies.forEach(e => this.scene.remove(e.mesh));

        this.platforms = [];
        this.lilypads = [];
        this.mushrooms = [];
        this.fireflies = [];
        this.torches = [];
        this.enemies = [];

        this.currentLevelIdx = levelIdx;
        this.currentLevel = this.levels[levelIdx];

        // 1. Create Player
        this.createPlayer();
        const start = this.currentLevel.playerStart || { x: 90, y: 430 };
        this.player.x = start.x * this.SCALE;
        this.player.y = (600 - start.y) * this.SCALE + 0.6;
        this.player.z = 0;
        this.player.vx = 0;
        this.player.vy = 0;
        this.player.isGrounded = false;
        this.player.fireflies = 0;
        this.player.goldenLotusCollected = false;

        // 2. Build Platforms
        const isRuins = this.currentLevel.id === 4;
        (this.currentLevel.platforms || []).forEach(p => {
            const w = p.w * this.SCALE;
            const h = p.h * this.SCALE;
            const x = (p.x + p.w / 2) * this.SCALE;
            const y = (600 - p.y - p.h / 2) * this.SCALE;
            const depth = p.type === 'grass' ? 2.6 : 3.6;

            const platformGroup = new THREE.Group();

            // Main base block
            const baseGeo = new THREE.BoxGeometry(w, h, depth);
            const mat = isRuins ? this.materials.ruinBrick : (p.type === 'grass' ? this.materials.dirtStrata : this.materials.ancientStone);
            const baseMesh = new THREE.Mesh(baseGeo, mat);
            baseMesh.castShadow = true;
            baseMesh.receiveShadow = true;
            platformGroup.add(baseMesh);

            // Mossy Top Slab for Grass/Ground
            if (p.type === 'grass' || !isRuins) {
                const topGeo = new THREE.BoxGeometry(w + 0.08, 0.16, depth + 0.12);
                const topMesh = new THREE.Mesh(topGeo, this.materials.mossGrass);
                topMesh.position.y = h / 2 + 0.04;
                topMesh.receiveShadow = true;
                topMesh.castShadow = true;
                platformGroup.add(topMesh);
            }

            platformGroup.position.set(x, y, 0);
            this.scene.add(platformGroup);

            this.platforms.push({
                mesh: platformGroup,
                left: p.x * this.SCALE,
                right: (p.x + p.w) * this.SCALE,
                top: (600 - p.y) * this.SCALE,
                bottom: (600 - p.y - p.h) * this.SCALE,
                type: p.type
            });
        });

        // 3. Build Lilypads
        (this.currentLevel.lilypads || []).forEach(lp => {
            const x = (lp.x + 28) * this.SCALE;
            const y = (600 - lp.y) * this.SCALE;
            const radius = 1.1;

            const lilyGroup = new THREE.Group();

            // Notched circle disc (Cylinder with thetaLength = 5.8 rad to give classic pie notch)
            const padGeo = new THREE.CylinderGeometry(radius, radius, 0.08, 24, 1, false, 0.25, 5.8);
            const padMesh = new THREE.Mesh(padGeo, this.materials.lilypadLeaf);
            padMesh.castShadow = true;
            padMesh.receiveShadow = true;
            lilyGroup.add(padMesh);

            // Water lily flower in center
            const flowerGeo = new THREE.ConeGeometry(0.2, 0.25, 6);
            const flower = new THREE.Mesh(flowerGeo, this.materials.lilyFlower);
            flower.position.set(0, 0.12, 0);
            lilyGroup.add(flower);

            lilyGroup.position.set(x, y, 0);
            this.scene.add(lilyGroup);

            this.lilypads.push({
                mesh: lilyGroup,
                baseY: y,
                x: x,
                y: y,
                radius: radius,
                tiltX: 0,
                tiltZ: 0,
                dipY: 0,
                bobPhase: Math.random() * Math.PI * 2
            });
        });

        // 4. Build Spring Bounce Mushrooms
        (this.currentLevel.mushrooms || []).forEach(m => {
            const x = (m.x + 16) * this.SCALE;
            const y = (600 - m.y) * this.SCALE;

            const shroomGroup = new THREE.Group();

            // Stem
            const stemGeo = new THREE.CylinderGeometry(0.18, 0.28, 0.7, 10);
            const stem = new THREE.Mesh(stemGeo, this.materials.shroomStalk);
            stem.position.y = 0.35;
            stem.castShadow = true;
            shroomGroup.add(stem);

            // Cap (Red dome)
            const capGeo = new THREE.SphereGeometry(0.55, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55);
            const cap = new THREE.Mesh(capGeo, this.materials.shroomCap);
            cap.position.y = 0.65;
            cap.castShadow = true;
            shroomGroup.add(cap);

            // Cap spots
            const spotGeo = new THREE.CircleGeometry(0.1, 8);
            spotGeo.rotateX(-Math.PI / 4);
            const spot1 = new THREE.Mesh(spotGeo, this.materials.shroomSpot);
            spot1.position.set(0.25, 0.95, 0.25);
            shroomGroup.add(spot1);
            const spot2 = new THREE.Mesh(spotGeo, this.materials.shroomSpot);
            spot2.position.set(-0.25, 0.95, -0.15);
            shroomGroup.add(spot2);

            shroomGroup.position.set(x, y, 0);
            this.scene.add(shroomGroup);

            this.mushrooms.push({
                mesh: shroomGroup,
                capMesh: cap,
                x: x,
                topY: y + 1.1,
                squash: 1.0,
                elasticVel: 0.0
            });
        });

        // 5. Build Fireflies (Glowing 3D orbs with real-time point lights)
        this.player.maxFireflies = (this.currentLevel.fireflies || []).length;
        (this.currentLevel.fireflies || []).forEach(f => {
            const x = f.x * this.SCALE;
            const y = (600 - f.y) * this.SCALE;

            const fGroup = new THREE.Group();

            // Luminous core
            const coreGeo = new THREE.SphereGeometry(0.12, 10, 8);
            const core = new THREE.Mesh(coreGeo, this.materials.fireflyGlow);
            fGroup.add(core);

            // Attached glowing point light
            const light = new THREE.PointLight(0x4ade80, 1.2, 4.5);
            light.position.set(0, 0, 0);
            fGroup.add(light);

            fGroup.position.set(x, y, 0);
            this.scene.add(fGroup);

            this.fireflies.push({
                mesh: fGroup,
                light: light,
                baseX: x,
                baseY: y,
                floatPhase: Math.random() * Math.PI * 2,
                collected: false
            });
        });

        // 6. Build Golden Lotus
        if (this.currentLevel.goldenLotus && this.currentLevel.goldenLotus.length > 0) {
            const lotusData = this.currentLevel.goldenLotus[0];
            const x = lotusData.x * this.SCALE;
            const y = (600 - lotusData.y) * this.SCALE;

            const lotusGroup = new THREE.Group();
            const petalGeo = new THREE.ConeGeometry(0.3, 0.6, 8);
            const lotusMesh = new THREE.Mesh(petalGeo, this.materials.goldenLotus);
            lotusMesh.castShadow = true;
            lotusGroup.add(lotusMesh);

            const lotusLight = new THREE.PointLight(0xfacc15, 2.0, 6.0);
            lotusGroup.add(lotusLight);

            lotusGroup.position.set(x, y, 0);
            this.scene.add(lotusGroup);
            this.goldenLotus = { mesh: lotusGroup, x: x, y: y, collected: false };
        } else {
            this.goldenLotus = null;
        }

        // 7. Torches (Level 4 Ruins)
        (this.currentLevel.torches || []).forEach(t => {
            const x = t.x * this.SCALE;
            const y = (600 - t.y) * this.SCALE;

            const torchGroup = new THREE.Group();
            const flameGeo = new THREE.SphereGeometry(0.14, 8, 8);
            flameGeo.scale(0.8, 1.4, 0.8);
            const flame = new THREE.Mesh(flameGeo, this.materials.torchFlame);
            torchGroup.add(flame);

            const light = new THREE.PointLight(0xf59e0b, 1.8, 7.0);
            light.castShadow = true;
            light.shadow.bias = -0.002;
            torchGroup.add(light);

            torchGroup.position.set(x, y, 0.4);
            this.scene.add(torchGroup);
            this.torches.push({ mesh: torchGroup, flame: flame, light: light, baseIntensity: 1.8 });
        });

        this.updateHUD();

        // Switch to the level-specific music track
        if (this.soundEngine) {
            this.soundEngine.startMusic(this.currentLevelIdx);
        }
    }

    // ==========================================
    // 4. INPUT HANDLING
    // ==========================================
    setupInputs() {
        const unlockAudio = () => {
            if (this.soundEngine) {
                this.soundEngine.init();
                if (!this.soundEngine.musicPlaying && !this.soundEngine.isMuted) {
                    this.soundEngine.startMusic(this.currentLevelIdx);
                }
            }
        };
        window.addEventListener('pointerdown', unlockAudio);
        window.addEventListener('keydown', unlockAudio);

        window.addEventListener('keydown', (e) => {
            if (['Space', 'ArrowUp', 'KeyW'].includes(e.code)) {
                this.keys.jump = true;
                this.player.jumpBufferTimer = 0.15; // 150ms buffer window
            }
            if (['ArrowLeft', 'KeyA'].includes(e.code)) this.keys.left = true;
            if (['ArrowRight', 'KeyD'].includes(e.code)) this.keys.right = true;
            if (['KeyJ', 'KeyX', 'ShiftLeft', 'ShiftRight'].includes(e.code)) {
                this.triggerTongue();
            }
            if (['KeyC'].includes(e.code)) {
                this.cycleCameraMode();
            }
            if (['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5'].includes(e.code)) {
                const idx = parseInt(e.code.replace('Digit', ''), 10) - 1;
                this.buildLevel(idx);
            }
        });

        window.addEventListener('keyup', (e) => {
            if (['Space', 'ArrowUp', 'KeyW'].includes(e.code)) this.keys.jump = false;
            if (['ArrowLeft', 'KeyA'].includes(e.code)) this.keys.left = false;
            if (['ArrowRight', 'KeyD'].includes(e.code)) this.keys.right = false;
        });

        // Click to shoot tongue toward pointer
        window.addEventListener('pointerdown', (e) => {
            if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'A') {
                this.triggerTongue();
            }
        });
    }

    triggerTongue() {
        if (this.player.isTongueOut) return;
        this.player.isTongueOut = true;
        this.player.tongueProgress = 0.0;
        this.soundEngine.init();
        this.soundEngine.playTongue();

        // Find nearest firefly within reach (8 units)
        let nearest = null;
        let minDist = 8.0;
        this.fireflies.forEach(f => {
            if (!f.collected) {
                const dx = f.mesh.position.x - this.player.x;
                const dy = f.mesh.position.y - this.player.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < minDist && (dx * this.player.facing >= -0.5)) {
                    minDist = dist;
                    nearest = f;
                }
            }
        });
        this.player.tongueTarget = nearest;
    }

    cycleCameraMode() {
        if (this.cameraMode === 'diorama') {
            this.cameraMode = 'sidescroll';
            this.camOffset.set(1.5, 2.5, 16.0);
        } else if (this.cameraMode === 'sidescroll') {
            this.cameraMode = 'diorama';
            this.camOffset.set(2.5, 4.5, 14.0);
        }
    }

    // ==========================================
    // 5. PHYSICS & COLLISION KINEMATICS
    // ==========================================
    updatePhysics(dt) {
        const p = this.player;

        // Gravity: ~25 m/s²
        const GRAVITY = 26.0;
        const RUN_SPEED = 7.5;
        const NORMAL_JUMP = 11.5;
        const SUPER_JUMP = 17.0;

        // Horizontal Movement
        let moveDir = 0;
        if (this.keys.left) moveDir -= 1;
        if (this.keys.right) moveDir += 1;

        if (moveDir !== 0) {
            p.vx = moveDir * RUN_SPEED;
            p.facing = moveDir;
        } else {
            p.vx *= 0.82; // Friction deceleration
        }

        // Apply Gravity
        p.vy -= GRAVITY * dt;

        // Variable Jump: Cutting jump early if button released
        if (!this.keys.jump && p.vy > 4.0 && !p.isSuperJumping) {
            p.vy *= 0.88;
        }

        // Coyote Time & Jump Buffering
        if (p.isGrounded) {
            p.coyoteTimer = 0.12; // 120ms leeway
        } else {
            p.coyoteTimer -= dt;
        }
        p.jumpBufferTimer -= dt;

        // Execute Jump
        if (p.jumpBufferTimer > 0 && p.coyoteTimer > 0) {
            p.vy = NORMAL_JUMP;
            p.isGrounded = false;
            p.coyoteTimer = 0;
            p.jumpBufferTimer = 0;
            p.squashTarget = 1.35; // Stretch vertically
            this.soundEngine.init();
            this.soundEngine.playJump(false);
            this.createDustPuff(p.x, p.y - 0.35);
        }

        // Step Position
        const nextX = p.x + p.vx * dt;
        const nextY = p.y + p.vy * dt;

        // --- COLLISION RESOLUTION ---
        let wasGrounded = p.isGrounded;
        p.isGrounded = false;

        const frogRadius = 0.38;

        // 1. Platform Collisions (AABB)
        for (const plat of this.platforms) {
            if (nextX + frogRadius > plat.left && nextX - frogRadius < plat.right) {
                // Landing on platform top
                if (p.y >= plat.top - 0.1 && nextY <= plat.top) {
                    p.y = plat.top;
                    p.vy = 0;
                    p.isGrounded = true;
                    p.isSuperJumping = false;
                    if (!wasGrounded) {
                        p.squashTarget = 0.65; // Squash on impact
                        this.createDustPuff(p.x, p.y);
                    }
                    break;
                }
            }
        }

        // 2. Lilypad Collisions (Interactive Floating Pads)
        if (!p.isGrounded) {
            for (const pad of this.lilypads) {
                const dx = nextX - pad.x;
                if (Math.abs(dx) < pad.radius * 0.9) {
                    if (p.y >= pad.baseY - 0.1 && nextY <= pad.baseY + 0.15 && p.vy <= 0) {
                        p.y = pad.baseY + 0.08;
                        p.vy = 0;
                        p.isGrounded = true;
                        p.isSuperJumping = false;

                        // Dynamic Lilypad Reaction
                        pad.dipY = -0.22;
                        pad.tiltX = dx * 0.35;
                        this.createWaterRipple(pad.x, pad.baseY, 1.4);
                        if (!wasGrounded) {
                            p.squashTarget = 0.7;
                        }
                        break;
                    }
                }
            }
        }

        // 3. Bounce Mushroom Collisions (Spring Launch)
        for (const shroom of this.mushrooms) {
            const dx = Math.abs(p.x - shroom.x);
            if (dx < 0.6 && p.y >= shroom.topY - 0.25 && p.y <= shroom.topY + 0.35 && p.vy <= 2.0) {
                p.y = shroom.topY + 0.2;
                p.vy = SUPER_JUMP;
                p.isGrounded = false;
                p.isSuperJumping = true;
                p.squashTarget = 1.45; // Huge stretch

                // Mushroom spring compress
                shroom.squash = 0.35;
                shroom.elasticVel = -8.0;

                this.soundEngine.init();
                this.soundEngine.playJump(true); // Super bounce sound
                this.createDustPuff(shroom.x, shroom.topY);
                break;
            }
        }

        if (!p.isGrounded) {
            p.y = nextY;
        }
        p.x = nextX;

        // 4. Water Pit Hazard Check
        if (p.y < this.WATER_Y - 0.2) {
            // Sunk into deep swamp water
            this.soundEngine.playSplash();
            this.createWaterRipple(p.x, this.WATER_Y, 2.5);
            this.respawnPlayer();
        }

        // 5. Firefly Collection
        this.fireflies.forEach(f => {
            if (!f.collected) {
                const dist = Math.sqrt((p.x - f.mesh.position.x) ** 2 + (p.y - f.mesh.position.y) ** 2);
                if (dist < 0.85) {
                    f.collected = true;
                    this.scene.remove(f.mesh);
                    this.createSparkleBurst(f.mesh.position.x, f.mesh.position.y, 0x4ade80);
                    this.soundEngine.playCoin();
                    p.fireflies += 1;
                    this.updateHUD();
                }
            }
        });

        // 6. Golden Lotus Collection
        if (this.goldenLotus && !this.goldenLotus.collected) {
            const dist = Math.sqrt((p.x - this.goldenLotus.x) ** 2 + (p.y - this.goldenLotus.y) ** 2);
            if (dist < 1.0) {
                this.goldenLotus.collected = true;
                this.scene.remove(this.goldenLotus.mesh);
                this.createSparkleBurst(this.goldenLotus.x, this.goldenLotus.y, 0xfacc15, 24);
                this.soundEngine.playWin();
                p.goldenLotusCollected = true;
                this.updateHUD();
            }
        }

        // 7. Stage Goal Reach Check
        const goal = this.currentLevel.goal || { x: 2670, y: 424 };
        const goalX = goal.x * this.SCALE;
        if (p.x >= goalX - 1.0) {
            this.nextStage();
        }
    }

    respawnPlayer() {
        const start = this.currentLevel.playerStart || { x: 90, y: 430 };
        this.player.x = start.x * this.SCALE;
        this.player.y = (600 - start.y) * this.SCALE + 0.6;
        this.player.vx = 0;
        this.player.vy = 0;
        this.player.isGrounded = false;
        this.player.respawns += 1;
        this.updateHUD();
    }

    nextStage() {
        const nextIdx = (this.currentLevelIdx + 1) % this.levels.length;
        this.buildLevel(nextIdx);
    }

    // ==========================================
    // 6. VISUAL EFFECTS & ANIMATIONS
    // ==========================================
    updateVisuals(dt, time) {
        const p = this.player;

        // 1. Squash & Stretch Lerp
        p.squashY += (p.squashTarget - p.squashY) * 18.0 * dt;
        p.squashTarget += (1.0 - p.squashTarget) * 12.0 * dt;
        const squashXZ = 1.0 / Math.sqrt(p.squashY);

        if (p.mesh) {
            p.mesh.position.set(p.x, p.y + 0.38 * p.squashY, p.z);
            p.mesh.scale.set(squashXZ * (p.facing > 0 ? 1 : -1), p.squashY, squashXZ);

            // Throat Puff Animation during idle
            p.breathPhase += dt * 4.0;
            const puff = Math.sin(p.breathPhase) * 0.12;
            if (p.throat) {
                p.throat.scale.set(0.9 + puff, 0.7 + puff, 0.6 + puff);
            }

            // Eye Blinking
            p.blinkTimer -= dt;
            if (p.blinkTimer <= 0) {
                if (p.leftPupil && p.rightPupil) {
                    p.leftPupil.scale.y = 0.1;
                    p.rightPupil.scale.y = 0.1;
                }
                if (p.blinkTimer <= -0.12) {
                    if (p.leftPupil && p.rightPupil) {
                        p.leftPupil.scale.y = 1.0;
                        p.rightPupil.scale.y = 1.0;
                    }
                    p.blinkTimer = 2.5 + Math.random() * 3.5;
                }
            }
        }

        // 2. Tongue Whip Animation
        if (p.isTongueOut && p.tongueMesh) {
            p.tongueProgress += dt * 5.0; // Quick 200ms whip
            if (p.tongueProgress < 1.0) {
                p.tongueMesh.visible = true;
                const reach = Math.sin(p.tongueProgress * Math.PI) * 4.5;
                p.tongueMesh.scale.set(reach, 1, 1);

                // If targeting a firefly, pull it in!
                if (p.tongueTarget && !p.tongueTarget.collected && p.tongueProgress > 0.4) {
                    p.tongueTarget.collected = true;
                    this.scene.remove(p.tongueTarget.mesh);
                    this.createSparkleBurst(p.tongueTarget.mesh.position.x, p.tongueTarget.mesh.position.y, 0x4ade80);
                    this.soundEngine.playCoin();
                    p.fireflies += 1;
                    this.updateHUD();
                }
            } else {
                p.tongueMesh.visible = false;
                p.isTongueOut = false;
                p.tongueTarget = null;
            }
        }

        // 3. Lilypad Physics (Bobbing & Tilt Recovery)
        this.lilypads.forEach(pad => {
            pad.bobPhase += dt * 1.8;
            pad.dipY += (0.0 - pad.dipY) * 6.0 * dt;
            pad.tiltX += (0.0 - pad.tiltX) * 8.0 * dt;

            const idleBob = Math.sin(pad.bobPhase) * 0.04;
            pad.mesh.position.y = pad.baseY + pad.dipY + idleBob;
            pad.mesh.rotation.z = pad.tiltX;
        });

        // 4. Mushroom Spring Wobble
        this.mushrooms.forEach(shroom => {
            shroom.elasticVel += (1.0 - shroom.squash) * 40.0 * dt;
            shroom.elasticVel *= 0.88; // Damping
            shroom.squash += shroom.elasticVel * dt;
            shroom.capMesh.scale.set(1.0 / Math.sqrt(shroom.squash), shroom.squash, 1.0 / Math.sqrt(shroom.squash));
        });

        // 5. Fireflies Floating in 3D Lissajous Waves
        this.fireflies.forEach(f => {
            if (!f.collected) {
                f.floatPhase += dt * 2.2;
                f.mesh.position.y = f.baseY + Math.sin(f.floatPhase) * 0.25;
                f.mesh.position.x = f.baseX + Math.cos(f.floatPhase * 0.7) * 0.2;
                f.mesh.position.z = Math.sin(f.floatPhase * 1.3) * 0.35;
                if (f.light) {
                    f.light.intensity = 1.0 + Math.sin(f.floatPhase * 3.0) * 0.3;
                }
            }
        });

        // 6. Water Surface Ripple Waves
        if (this.waterMesh && this.waterMesh.geometry) {
            const pos = this.waterMesh.geometry.attributes.position;
            for (let i = 0; i < pos.count; i++) {
                const u = pos.getX(i);
                const w = pos.getZ(i);
                const wave = Math.sin(u * 0.8 + time * 2.5) * 0.04 + Math.cos(w * 0.6 + time * 1.8) * 0.03;
                pos.setY(i, wave);
            }
            this.waterMesh.geometry.computeVertexNormals();
            this.waterMesh.geometry.attributes.position.needsUpdate = true;
        }

        // 7. Expand & Fade Circular Water Ripples
        for (let i = this.waterRipples.length - 1; i >= 0; i--) {
            const r = this.waterRipples[i];
            r.scale += dt * 3.5;
            r.opacity -= dt * 1.6;
            r.mesh.scale.set(r.scale, r.scale, r.scale);
            r.mesh.material.opacity = Math.max(0, r.opacity);
            if (r.opacity <= 0) {
                this.rippleGroup.remove(r.mesh);
                this.waterRipples.splice(i, 1);
            }
        }

        // 8. Torches Flickering
        this.torches.forEach(t => {
            const flick = (Math.sin(time * 15.0) + Math.cos(time * 23.0)) * 0.15;
            t.light.intensity = t.baseIntensity + flick;
            t.flame.scale.set(0.8 + flick * 0.5, 1.4 + flick * 0.8, 0.8 + flick * 0.5);
        });

        // 9. Update Active Sparkle Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const pObj = this.particles[i];
            pObj.x += pObj.vx * dt;
            pObj.y += pObj.vy * dt;
            pObj.z += pObj.vz * dt;
            pObj.life -= dt;
            pObj.mesh.position.set(pObj.x, pObj.y, pObj.z);
            pObj.mesh.scale.multiplyScalar(0.96);
            if (pObj.life <= 0) {
                this.scene.remove(pObj.mesh);
                this.particles.splice(i, 1);
            }
        }

        // 10. Smooth Cinematic Camera Follow
        const targetCamX = p.x + this.camOffset.x;
        const targetCamY = Math.max(3.0, p.y + this.camOffset.y);
        const targetCamZ = this.camOffset.z;

        this.camCurrentPos.x += (targetCamX - this.camCurrentPos.x) * 6.0 * dt;
        this.camCurrentPos.y += (targetCamY - this.camCurrentPos.y) * 5.0 * dt;
        this.camCurrentPos.z += (targetCamZ - this.camCurrentPos.z) * 5.0 * dt;

        this.camera.position.copy(this.camCurrentPos);

        const lookTarget = new THREE.Vector3(p.x + this.camLookOffset.x, p.y + this.camLookOffset.y, 0);
        this.camCurrentLook.lerp(lookTarget, 7.0 * dt);
        this.camera.lookAt(this.camCurrentLook);

        // Sun light tracks player to keep high-res shadow coverage
        this.sunLight.position.set(p.x + 10, 20, 12);
        this.sunLight.target.position.set(p.x, p.y, 0);
        this.sunLight.target.updateMatrixWorld();
    }

    createWaterRipple(x, y, maxScale = 1.8) {
        const ringGeo = new THREE.RingGeometry(0.3, 0.45, 24);
        ringGeo.rotateX(-Math.PI / 2);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x86efac, transparent: true, opacity: 0.75, side: THREE.DoubleSide });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.position.set(x, y + 0.02, 0);
        this.rippleGroup.add(ringMesh);

        this.waterRipples.push({
            mesh: ringMesh,
            scale: 0.5,
            opacity: 0.8
        });
    }

    createDustPuff(x, y) {
        for (let i = 0; i < 6; i++) {
            const dustGeo = new THREE.SphereGeometry(0.08, 6, 6);
            const dustMat = new THREE.MeshBasicMaterial({ color: 0xa7f3d0, transparent: true, opacity: 0.6 });
            const dustMesh = new THREE.Mesh(dustGeo, dustMat);
            dustMesh.position.set(x + (Math.random() - 0.5) * 0.3, y + 0.05, (Math.random() - 0.5) * 0.3);
            this.scene.add(dustMesh);

            this.particles.push({
                mesh: dustMesh,
                x: dustMesh.position.x,
                y: dustMesh.position.y,
                z: dustMesh.position.z,
                vx: (Math.random() - 0.5) * 2.0,
                vy: 0.5 + Math.random() * 1.5,
                vz: (Math.random() - 0.5) * 2.0,
                life: 0.35
            });
        }
    }

    createSparkleBurst(x, y, color = 0x4ade80, count = 12) {
        for (let i = 0; i < count; i++) {
            const sparkleGeo = new THREE.SphereGeometry(0.09, 6, 6);
            const sparkleMat = new THREE.MeshBasicMaterial({ color: color });
            const mesh = new THREE.Mesh(sparkleGeo, sparkleMat);
            mesh.position.set(x, y, 0);
            this.scene.add(mesh);

            const angle = (i / count) * Math.PI * 2;
            const speed = 2.5 + Math.random() * 3.0;
            this.particles.push({
                mesh: mesh,
                x: x,
                y: y,
                z: 0,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                vz: (Math.random() - 0.5) * 2.0,
                life: 0.6
            });
        }
    }

    updateHUD() {
        const levelNameEl = document.getElementById('level-name');
        const fireflyCountEl = document.getElementById('firefly-count');
        const stageBadgeEl = document.getElementById('stage-badge');

        if (levelNameEl) levelNameEl.textContent = this.currentLevel.name || `Level ${this.currentLevelIdx + 1}`;
        if (fireflyCountEl) fireflyCountEl.textContent = `${this.player.fireflies} / ${this.player.maxFireflies}`;
        if (stageBadgeEl) stageBadgeEl.textContent = `STAGE ${this.currentLevelIdx + 1} OF ${this.levels.length}`;

        document.querySelectorAll('.btn-stage').forEach((btn, idx) => {
            if (idx === this.currentLevelIdx) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    // ==========================================
    // 7. MAIN RENDER LOOP
    // ==========================================
    animate() {
        requestAnimationFrame(this.animate);
        const dt = Math.min(this.clock.getDelta(), 0.05); // Cap to 50ms to prevent physics explosion
        const time = this.clock.getElapsedTime();

        this.updatePhysics(dt);
        this.updateVisuals(dt, time);

        this.renderer.render(this.scene, this.camera);
    }
}

// Global bootstrap
window.addEventListener('DOMContentLoaded', () => {
    window.frog3d = new FrogGame3D();
});
