// --- Core Game Setup ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const minimapCanvas = document.getElementById('minimapCanvas');
const minimapCtx = minimapCanvas.getContext('2d');
const gameContainer = document.querySelector('.game-container');

// --- Game Constants ---
const CONSTANTS = {
    MAP_WIDTH: 60,
    MAP_HEIGHT: 60,
    TILE_SIZE: 32,
    PAGE_SANITY_COST: 20,
    SANITY_REGEN_RATE: 0.2,
    SANITY_REGEN_INTERVAL: 100,
    SANITY_DRAIN_RATE: 0.5,
    SANITY_DRAIN_INTERVAL: 2000,
    FOV_RADIUS: 8,
    SANITY_THRESHOLDS: {
        WHISPERS: 50,
        HEARTBEAT: 25,
        DRAIN_START: 30
    },
    MINIMAP_TILE_SIZE: 4
};

let map = [];
let visibilityMap = [];
let rooms = [];

let player = {
    x: 0, y: 0, speed: 3, width: CONSTANTS.TILE_SIZE * 0.7, height: CONSTANTS.TILE_SIZE * 0.7,
    sanity: 100, pages: 0, direction: { x: 0, y: 1 }, hasMoved: true
};

const camera = { x: 0, y: 0 };
const keys = { w: false, s: false, a: false, d: false, e: false, m: false };
let isMapVisible = false;

const TILE_TYPES = {
    EMPTY: 0, FLOOR: 1, WALL: 2, DOOR: 3, PAGE: 4, FURNITURE: 5, DECOR: 6, FIREPLACE: 7
};

const TILE_GFX = {
    [TILE_TYPES.FLOOR]: { char: '', color: '#3a3a3a' },
    [TILE_TYPES.WALL]: { char: ' ', color: '#454545' },
    [TILE_TYPES.DOOR]: { char: '🚪', color: '#7a5c3d' },
    [TILE_TYPES.PAGE]: { char: '📜', color: '#3a3a3a' },
    [TILE_TYPES.FURNITURE]: { char: '📚', color: '#5a3d2b' },
    [TILE_TYPES.DECOR]: { char: '', color: '#2a2a2a' },
    [TILE_TYPES.FIREPLACE]: { char: '', color: '#e67e22' },
    'PLAYER': { char: '👤', color: '#00FFFF' }
};

const NECRONOMICON_PAGES = [
    "That is not dead which can eternal lie, And with strange aeons even death may die.",
    "The world is indeed comic, but the joke is on mankind.",
    "The oldest and strongest emotion of mankind is fear, and the oldest and strongest kind of fear is fear of the unknown.",
    "Ph'nglui mglw'nafh Cthulhu R'lyeh wgah'nagl fhtagn.",
    "In his house at R'lyeh dead Cthulhu waits dreaming."
];
let foundPages = [];

let gameLoopId;
let isGameRunning = false;
let lastSanityRegenTime = 0;
let lastSanityDrainTime = 0;
let lastFootstepTime = 0;
let screenFlash = 0;

// --- Audio Setup ---
let ambientDrone, heartbeat, whispers;
let audioInitialized = false;

function initAudio() {
    if (audioInitialized) return;
    try {
        Tone.start();
        ambientDrone = new Tone.Noise("brown").toDestination();
        const filter = new Tone.Filter(80, "lowpass").toDestination();
        ambientDrone.connect(filter);
        ambientDrone.volume.value = -40;
        heartbeat = new Tone.MembraneSynth({ pitchDecay: 0.01, octaves: 2, oscillator: { type: "sine" }, envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.01 } }).toDestination();
        heartbeat.volume.value = -10;
        whispers = new Tone.Noise("pink").toDestination();
        const whisperFilter = new Tone.AutoFilter({ frequency: "8n", baseFrequency: 400, octaves: 4 }).toDestination();
        whispers.connect(whisperFilter);
        whispers.volume.value = -60;
        audioInitialized = true;
    } catch (e) {
        console.error("Audio could not be initialized.", e);
    }
}

// --- UI Elements ---
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');
const startScreen = document.getElementById('start-screen');
const endScreen = document.getElementById('end-screen');
const modalOverlay = document.getElementById('modal-overlay');
const modalClose = document.getElementById('modal-close');

// --- Game Initialization ---
function startGame() {
    initAudio();
    startScreen.style.display = 'none';
    endScreen.style.display = 'none';
    gameContainer.style.display = 'flex';
    isGameRunning = true;
    
    player.sanity = 100;
    player.pages = 0;
    player.hasMoved = true;
    foundPages = [];
    updateUI();
    
    generateMap();
    
    if (audioInitialized) ambientDrone.start();
    
    if (gameLoopId) cancelAnimationFrame(gameLoopId);
    gameLoop();
}

function endGame(state) {
    if (!isGameRunning) return;
    isGameRunning = false;
    cancelAnimationFrame(gameLoopId);
    if(audioInitialized) {
        ambientDrone.stop();
        if(whispers.state === 'started') whispers.stop();
    }

    gameContainer.style.display = 'none';
    endScreen.style.display = 'flex';
    
    const endTitle = document.getElementById('end-title');
    const endMessage = document.getElementById('end-message');
    
    if(state === 'win') {
        endTitle.innerText = "The Knowledge is Yours";
        endMessage.innerText = "You have gathered the pages. The terrible truth of the cosmos is laid bare before you... but at what cost to your soul?";
        endTitle.style.color = "#b89b72";
    } else if (state === 'madness') {
        endTitle.innerText = "A Glimpse Beyond the Veil";
        endMessage.innerText = "You hold the forbidden knowledge, but your mind is shattered. You see the patterns in the static, the truth in the chaos. A horrifying, beautiful revelation.";
        endTitle.style.color = "#6a0dad";
    } else {
        endTitle.innerText = "Sanity Lost";
        endMessage.innerText = "The mansion has claimed your mind. You will wander these halls forever, a gibbering spectre haunted by glimpses of the truth.";
        endTitle.style.color = "#a22";
    }
}

// --- Map Generation ---
function generateMap() {
    map = Array.from({ length: CONSTANTS.MAP_HEIGHT }, () => Array(CONSTANTS.MAP_WIDTH).fill(TILE_TYPES.WALL));
    visibilityMap = Array.from({ length: CONSTANTS.MAP_HEIGHT }, () => Array(CONSTANTS.MAP_WIDTH).fill(0));
    rooms = [];
    
    const MIN_ROOMS = 20, MAX_ROOMS = 30;
    const numRooms = Math.floor(Math.random() * (MAX_ROOMS - MIN_ROOMS + 1)) + MIN_ROOMS;
    const numSafeRooms = 3;

    for (let i = 0; i < numRooms; i++) {
        const w = Math.floor(Math.random() * 8) + 5;
        const h = Math.floor(Math.random() * 8) + 5;
        const x = Math.floor(Math.random() * (CONSTANTS.MAP_WIDTH - w - 2)) + 1;
        const y = Math.floor(Math.random() * (CONSTANTS.MAP_HEIGHT - h - 2)) + 1;
        const newRoom = { id: i, x, y, w, h, isSafe: false };
        
        let failed = false;
        for (const otherRoom of rooms) {
            if (rectsIntersect(newRoom, otherRoom)) { failed = true; break; }
        }
        if (!failed) {
            createRoom(newRoom);
            rooms.push(newRoom);
        }
    }
    
    for (let i = 0; i < rooms.length - 1; i++) {
        const centerA = getRoomCenter(rooms[i]);
        const centerB = getRoomCenter(rooms[i+1]);
        createCorridor(centerA, centerB);
    }
    
    addDoors();

    for(let i = 0; i < numSafeRooms; i++) {
        let roomIndex = Math.floor(Math.random() * rooms.length);
        while(rooms[roomIndex].isSafe || roomIndex === 0) {
            roomIndex = Math.floor(Math.random() * rooms.length);
        }
        rooms[roomIndex].isSafe = true;
        createFireplace(rooms[roomIndex]);
    }

    const startRoom = rooms[0];
    player.x = getRoomCenter(startRoom).x * CONSTANTS.TILE_SIZE;
    player.y = getRoomCenter(startRoom).y * CONSTANTS.TILE_SIZE;

    placeItems(TILE_TYPES.PAGE, NECRONOMICON_PAGES.length, rooms);
}

function createRoom(room) {
    for (let y = room.y; y < room.y + room.h; y++) {
        for (let x = room.x; x < room.x + room.w; x++) {
            map[y][x] = TILE_TYPES.FLOOR;
        }
    }
    if (room.w > 7 && room.h > 7) createLibrary(room);
    else createStudy(room);
}

function createLibrary(room) {
    for (let i = room.x + 1; i < room.x + room.w - 1; i++) {
        if(Math.random() > 0.3) map[room.y + 1][i] = TILE_TYPES.FURNITURE;
        if(Math.random() > 0.3) map[room.y + room.h - 2][i] = TILE_TYPES.FURNITURE;
    }
    const rugX = room.x + Math.floor(room.w/2) - 1;
    const rugY = room.y + Math.floor(room.h/2) - 1;
    map[rugY][rugX] = TILE_TYPES.DECOR; map[rugY+1][rugX] = TILE_TYPES.DECOR;
    map[rugY][rugX+1] = TILE_TYPES.DECOR; map[rugY+1][rugX+1] = TILE_TYPES.DECOR;
}

function createStudy(room) {
     map[room.y + 1][room.x + 1] = TILE_TYPES.FURNITURE;
     map[room.y + 1][room.x + 2] = TILE_TYPES.FURNITURE;
}

function createFireplace(room) {
    const potentialSpots = [
        { wallX: room.x + Math.floor(room.w / 2), wallY: room.y - 1, floorX: room.x + Math.floor(room.w / 2), floorY: room.y },
        { wallX: room.x + Math.floor(room.w / 2), wallY: room.y + room.h, floorX: room.x + Math.floor(room.w / 2), floorY: room.y + room.h - 1 },
        { wallX: room.x - 1, wallY: room.y + Math.floor(room.h / 2), floorX: room.x, floorY: room.y + Math.floor(room.h / 2) },
        { wallX: room.x + room.w, wallY: room.y + Math.floor(room.h / 2), floorX: room.x + room.w - 1, floorY: room.y + Math.floor(room.h / 2) }
    ];

    for (let i = potentialSpots.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [potentialSpots[i], potentialSpots[j]] = [potentialSpots[j], potentialSpots[i]];
    }

    for (const spot of potentialSpots) {
        if (map[spot.wallY] && map[spot.wallY][spot.wallX] === TILE_TYPES.WALL) {
            map[spot.floorY][spot.floorX] = TILE_TYPES.FIREPLACE;
            return; 
        }
    }
}

function getRoomCenter(room) { return { x: Math.floor(room.x + room.w / 2), y: Math.floor(room.y + room.h / 2) }; }

function createCorridor(start, end) {
    let x = start.x;
    let y = start.y;
    while (x !== end.x || y !== end.y) {
        map[y][x] = TILE_TYPES.FLOOR;
        const moveHorizontally = (x !== end.x && (y === end.y || Math.random() > 0.5));
        if (moveHorizontally) {
            x += Math.sign(end.x - x);
        } else if (y !== end.y) {
            y += Math.sign(end.y - y);
        }
    }
    map[end.y][end.x] = TILE_TYPES.FLOOR;
}

function rectsIntersect(r1, r2) { return !(r2.x > r1.x + r1.w || r2.x + r2.w < r1.x || r2.y > r1.y + r1.h || r2.y + r2.h < r1.y); }

function addDoors() { 
    for (let y = 1; y < CONSTANTS.MAP_HEIGHT - 1; y++) { 
        for (let x = 1; x < CONSTANTS.MAP_WIDTH - 1; x++) { 
            const isHorizontalDoorway = map[y][x] === TILE_TYPES.WALL && map[y][x-1] === TILE_TYPES.FLOOR && map[y][x+1] === TILE_TYPES.FLOOR && map[y-1][x] === TILE_TYPES.WALL && map[y+1][x] === TILE_TYPES.WALL;
            const isVerticalDoorway = map[y][x] === TILE_TYPES.WALL && map[y-1][x] === TILE_TYPES.FLOOR && map[y+1][x] === TILE_TYPES.FLOOR && map[y][x-1] === TILE_TYPES.WALL && map[y][x+1] === TILE_TYPES.WALL;
            if (isHorizontalDoorway || isVerticalDoorway) {
                map[y][x] = TILE_TYPES.DOOR;
            }
        } 
    } 
}

function placeItems(itemType, count, rooms) { 
    let placed = 0; 
    while (placed < count) { 
        const room = rooms[Math.floor(Math.random() * rooms.length)]; 
        const x = Math.floor(Math.random() * (room.w - 2)) + room.x + 1; 
        const y = Math.floor(Math.random() * (room.h - 2)) + room.y + 1; 
        if (map[y][x] === TILE_TYPES.FLOOR) { 
            map[y][x] = itemType; 
            placed++; 
        } 
    } 
}

// --- Game Loop and Updates ---
function gameLoop() {
    if (!isGameRunning) return;
    update();
    render();
    gameLoopId = requestAnimationFrame(gameLoop);
}

function update() {
    movePlayer();
    updateCamera();
    updateVisibility();
    updateSanity();
    
    const playerGridX = Math.floor((player.x + player.width / 2) / CONSTANTS.TILE_SIZE);
    const playerGridY = Math.floor((player.y + player.height / 2) / CONSTANTS.TILE_SIZE);
    if (map[playerGridY] && map[playerGridY][playerGridX] === TILE_TYPES.PAGE) {
        collectPage(playerGridX, playerGridY);
    }
}

function playFootstep() {
    if (!audioInitialized) return;
    const now = performance.now();
    if (now - lastFootstepTime > 300) {
        const footstep = new Tone.MembraneSynth({
            pitchDecay: 0.008,
            octaves: 1,
            envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.01 }
        }).toDestination();
        footstep.volume.value = -25;
        footstep.triggerAttackRelease("C1", "32n");
        lastFootstepTime = now;
    }
}

function movePlayer() {
    let dx = 0; let dy = 0;
    if (keys.w) dy -= player.speed; if (keys.s) dy += player.speed;
    if (keys.a) dx -= player.speed; if (keys.d) dx += player.speed;
    
    if(dx !== 0 || dy !== 0) {
        player.hasMoved = true;
        playFootstep();
        if (dx !== 0 && dy !== 0) { const mag = Math.sqrt(dx*dx + dy*dy); dx = (dx / mag) * player.speed; dy = (dy / mag) * player.speed; }
        player.direction.x = Math.round(dx / player.speed); player.direction.y = Math.round(dy / player.speed);
    }

    const newX = player.x + dx; const newY = player.y + dy;
    if (!isColliding(newX, player.y)) { player.x = newX; }
    if (!isColliding(player.x, newY)) { player.y = newY; }
}

function isColliding(x, y) {
    const corners = [{x: x, y: y}, {x: x + player.width, y: y}, {x: x, y: y + player.height}, {x: x + player.width, y: y + player.height}];
    for(const corner of corners) {
        const mapX = Math.floor(corner.x / CONSTANTS.TILE_SIZE); const mapY = Math.floor(corner.y / CONSTANTS.TILE_SIZE);
        if (mapX < 0 || mapX >= CONSTANTS.MAP_WIDTH || mapY < 0 || mapY >= CONSTANTS.MAP_HEIGHT) return true;
        const tile = map[mapY][mapX];
        if (tile === TILE_TYPES.WALL || tile === TILE_TYPES.DOOR || tile === TILE_TYPES.FURNITURE || tile === TILE_TYPES.FIREPLACE) {
            return true;
        }
    }
    return false;
}

function interact() {
    const lookGridX = Math.floor((player.x + player.width / 2) / CONSTANTS.TILE_SIZE) + player.direction.x;
    const lookGridY = Math.floor((player.y + player.height / 2) / CONSTANTS.TILE_SIZE) + player.direction.y;
    
    if (map[lookGridY] && map[lookGridY][lookGridX] === TILE_TYPES.DOOR) {
        map[lookGridY][lookGridX] = TILE_TYPES.FLOOR; 
        player.hasMoved = true;
        if(audioInitialized) {
            const synth = new Tone.Synth().toDestination();
            synth.triggerAttackRelease("C2", "8n");
        }
    }
}

function updateCamera() {
    camera.x = player.x - canvas.width / 2; camera.y = player.y - canvas.height / 2;
    camera.x = Math.max(0, Math.min(camera.x, CONSTANTS.MAP_WIDTH * CONSTANTS.TILE_SIZE - canvas.width));
    camera.y = Math.max(0, Math.min(camera.y, CONSTANTS.MAP_HEIGHT * CONSTANTS.TILE_SIZE - canvas.height));
}

function updateVisibility() {
    if (!player.hasMoved) return;

    for (let y = 0; y < CONSTANTS.MAP_HEIGHT; y++) {
        for (let x = 0; x < CONSTANTS.MAP_WIDTH; x++) {
            if (visibilityMap[y][x] === 2) visibilityMap[y][x] = 1;
        }
    }

    const playerGridX = Math.floor((player.x + player.width / 2) / CONSTANTS.TILE_SIZE);
    const playerGridY = Math.floor((player.y + player.height / 2) / CONSTANTS.TILE_SIZE);

    const currentRoom = getCurrentRoom();
    if (currentRoom) {
        for (let y = currentRoom.y - 1; y <= currentRoom.y + currentRoom.h; y++) {
            for (let x = currentRoom.x - 1; x <= currentRoom.x + currentRoom.w; x++) {
                 if (y >= 0 && y < CONSTANTS.MAP_HEIGHT && x >= 0 && x < CONSTANTS.MAP_WIDTH) {
                    visibilityMap[y][x] = 2;
                }
            }
        }
    } else {
        calculateFieldOfView(playerGridX, playerGridY, CONSTANTS.FOV_RADIUS);
    }
    player.hasMoved = false;
}

function calculateFieldOfView(startX, startY, radius) {
    visibilityMap[startY][startX] = 2;
    for (let angle = 0; angle < 360; angle += 2) {
        const rad = angle * (Math.PI / 180);
        castLine(startX, startY, startX + Math.cos(rad) * radius, startY + Math.sin(rad) * radius);
    }
}

function castLine(x0, y0, x1, y1) {
    x0 = Math.round(x0); y0 = Math.round(y0);
    x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = (x0 < x1) ? 1 : -1;
    const sy = (y0 < y1) ? 1 : -1;
    let err = dx - dy;

    while (true) {
        if (x0 < 0 || x0 >= CONSTANTS.MAP_WIDTH || y0 < 0 || y0 >= CONSTANTS.MAP_HEIGHT) return;
        
        visibilityMap[y0][x0] = 2;
        const tileType = map[y0][x0];
        if (tileType === TILE_TYPES.WALL || tileType === TILE_TYPES.DOOR) {
            return;
        }

        if ((x0 === x1) && (y0 === y1)) break;
        const e2 = 2 * err;
        if (e2 > -dy) { err -= dy; x0 += sx; }
        if (e2 < dx) { err += dx; y0 += sy; }
    }
}

function getCurrentRoom() {
    const playerGridX = Math.floor((player.x + player.width / 2) / CONSTANTS.TILE_SIZE);
    const playerGridY = Math.floor((player.y + player.height / 2) / CONSTANTS.TILE_SIZE);
    for (const room of rooms) {
        if (playerGridX >= room.x && playerGridX < room.x + room.w &&
            playerGridY >= room.y && playerGridY < room.y + room.h) {
            return room;
        }
    }
    return null;
}

function collectPage(x, y) {
    map[y][x] = TILE_TYPES.FLOOR; player.pages++;
    screenFlash = 15; // Trigger screen flash for 15 frames

    if(audioInitialized) {
        const chord = new Tone.PolySynth(Tone.Synth).toDestination();
        chord.volume.value = -12;
        chord.triggerAttackRelease(["C2", "Eb2", "G2"], "1n");
    }

    const unreadPages = NECRONOMICON_PAGES.filter(p => !foundPages.includes(p));
    const pageText = unreadPages[Math.floor(Math.random() * unreadPages.length)];
    foundPages.push(pageText);
    showPageModal(pageText);
    player.sanity -= CONSTANTS.PAGE_SANITY_COST;
    if (player.sanity < 0) player.sanity = 0;
    updateUI();
    if (player.pages >= NECRONOMICON_PAGES.length) {
        if (player.sanity <= 0) {
            setTimeout(() => endGame('madness'), 1000);
        } else {
            setTimeout(() => endGame('win'), 1000);
        }
    }
}

function getSanityStatus() {
    if (player.sanity >= 80) return "Clear";
    if (player.sanity >= 60) return "Uneasy";
    if (player.sanity >= 40) return "Disturbed";
    if (player.sanity >= 20) return "Terrified";
    return "Madness";
}

function updateUI() {
    document.getElementById('pages-found').innerText = `Pages: ${player.pages} / ${NECRONOMICON_PAGES.length}`;
    document.getElementById('sanity-label').innerText = `Sanity: ${getSanityStatus()}`;
    const sanityBar = document.getElementById('sanity-bar');
    sanityBar.style.width = `${player.sanity}%`;
    if (player.sanity < 30) { sanityBar.style.background = 'linear-gradient(90deg, #7f0000, #a22, #d44)'; } 
    else if (player.sanity < 60) { sanityBar.style.background = 'linear-gradient(90deg, #b89b72, #dabd9a, #fce9c5)'; } 
    else { sanityBar.style.background = 'linear-gradient(90deg, #0f4c75, #3282b8, #bbe1fa)'; }
}

function showPageModal(text) { document.getElementById('page-text').innerText = text; modalOverlay.style.opacity = 1; modalOverlay.style.pointerEvents = 'auto'; }
function showMessage(text, duration = 3000) { const msgLog = document.getElementById('message-log'); msgLog.innerText = text; msgLog.style.opacity = 1; setTimeout(() => { msgLog.style.opacity = 0; }, duration); }

// --- Sanity Effects & Regeneration ---
let lastSanityEffectTime = 0;
let screenShake = 0;
let colorTwist = 0;

function updateSanity() {
    const now = performance.now();
    
    const currentRoom = getCurrentRoom();
    if (currentRoom && currentRoom.isSafe) {
        if (now - lastSanityRegenTime > CONSTANTS.SANITY_REGEN_INTERVAL) {
            if (player.sanity < 100) {
                player.sanity += CONSTANTS.SANITY_REGEN_RATE;
                if (player.sanity > 100) player.sanity = 100;
                updateUI();
            }
            lastSanityRegenTime = now;
        }
    } else if (!currentRoom && player.sanity > CONSTANTS.SANITY_THRESHOLDS.DRAIN_START) {
        if (now - lastSanityDrainTime > CONSTANTS.SANITY_DRAIN_INTERVAL) {
            player.sanity -= CONSTANTS.SANITY_DRAIN_RATE;
            updateUI();
            lastSanityDrainTime = now;
        }
    }

    if (!audioInitialized) return;
    ambientDrone.volume.value = -40 + (100 - player.sanity) * 0.15;
    if (player.sanity < CONSTANTS.SANITY_THRESHOLDS.WHISPERS && whispers.state !== 'started') { whispers.start(); } 
    else if (player.sanity >= CONSTANTS.SANITY_THRESHOLDS.WHISPERS && whispers.state === 'started') { whispers.stop(); }
    whispers.volume.value = -60 + (CONSTANTS.SANITY_THRESHOLDS.WHISPERS - player.sanity) * 0.8;
    if (player.sanity < CONSTANTS.SANITY_THRESHOLDS.HEARTBEAT) { const beatInterval = 0.5 + (player.sanity / CONSTANTS.SANITY_THRESHOLDS.HEARTBEAT) * 0.5; if (Tone.Transport.state !== 'started') { Tone.Transport.scheduleRepeat(time => { heartbeat.triggerAttackRelease("C1", "8n", time); }, beatInterval); Tone.Transport.start(); } else { Tone.Transport.bpm.rampTo(60 / beatInterval, 0.5); } } 
    else { if (Tone.Transport.state === 'started') { Tone.Transport.stop(); Tone.Transport.cancel(); } }
    
    if (now - lastSanityEffectTime > 5000 && Math.random() < (100 - player.sanity) / 200) { triggerRandomSanityEvent(); lastSanityEffectTime = now; }
    if (screenShake > 0) screenShake -= 0.5;
    if (colorTwist > 0) colorTwist -= 1;
    if (player.sanity <= 0 && isGameRunning) { endGame('lose'); }
}

function triggerRandomSanityEvent() {
    const sanityEvents = [
        () => showMessage("The shadows writhe."), () => showMessage("You are not alone."),
        () => showMessage("It sees you."), () => showMessage("The floorboards whisper your name."),
        () => { screenShake = 10; }, () => { colorTwist = 180; },
        () => { const originalBg = canvas.style.backgroundColor; canvas.style.backgroundColor = "#222"; setTimeout(() => canvas.style.backgroundColor = "#000", 100); }
    ];
    sanityEvents[Math.floor(Math.random() * sanityEvents.length)]();
}

// --- Rendering ---
function render() {
    resizeCanvas();
    ctx.save();
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (screenFlash > 0) {
        const flashAlpha = (screenFlash / 15) * 0.7;
        ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha})`;
        ctx.fillRect(0,0, canvas.width, canvas.height);
        screenFlash--;
    }

    if (screenShake > 0) { ctx.translate((Math.random() - 0.5) * screenShake, (Math.random() - 0.5) * screenShake); }
    if (colorTwist > 0) { ctx.filter = `hue-rotate(${colorTwist}deg) saturate(1.5)`; }
    ctx.translate(-camera.x, -camera.y);

    const startCol = Math.floor(camera.x / CONSTANTS.TILE_SIZE);
    const endCol = startCol + (canvas.width / CONSTANTS.TILE_SIZE) + 2;
    const startRow = Math.floor(camera.y / CONSTANTS.TILE_SIZE);
    const endRow = startRow + (canvas.height / CONSTANTS.TILE_SIZE) + 2;

    ctx.font = `${CONSTANTS.TILE_SIZE * 0.8}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const currentRoom = getCurrentRoom();

    for (let y = startRow; y < endRow; y++) {
        for (let x = startCol; x < endCol; x++) {
            if (x < 0 || x >= CONSTANTS.MAP_WIDTH || y < 0 || y >= CONSTANTS.MAP_HEIGHT) continue;
            const visibility = visibilityMap[y][x];
            if (visibility > 0) {
                const tileType = map[y][x];
                const gfx = TILE_GFX[tileType] || TILE_GFX[TILE_TYPES.FLOOR];
                ctx.globalAlpha = (visibility === 2) ? 1.0 : 0.3;
                
                if (currentRoom && currentRoom.isSafe && tileType === TILE_TYPES.FLOOR) {
                    ctx.fillStyle = '#4a413a'; // Warmer floor for safe rooms
                } else {
                    ctx.fillStyle = gfx.color;
                }
                ctx.fillRect(x * CONSTANTS.TILE_SIZE, y * CONSTANTS.TILE_SIZE, CONSTANTS.TILE_SIZE, CONSTANTS.TILE_SIZE);
                
                if (tileType === TILE_TYPES.FIREPLACE && visibility === 2) {
                    const gradient = ctx.createRadialGradient(
                        x * CONSTANTS.TILE_SIZE + CONSTANTS.TILE_SIZE / 2, y * CONSTANTS.TILE_SIZE + CONSTANTS.TILE_SIZE / 2, 0,
                        x * CONSTANTS.TILE_SIZE + CONSTANTS.TILE_SIZE / 2, y * CONSTANTS.TILE_SIZE + CONSTANTS.TILE_SIZE / 2, CONSTANTS.TILE_SIZE * 2
                    );
                    gradient.addColorStop(0, 'rgba(255, 165, 0, 0.5)');
                    gradient.addColorStop(1, 'rgba(255, 165, 0, 0)');
                    ctx.fillStyle = gradient;
                    ctx.fillRect(x * CONSTANTS.TILE_SIZE - CONSTANTS.TILE_SIZE * 1.5, y * CONSTANTS.TILE_SIZE - CONSTANTS.TILE_SIZE * 1.5, CONSTANTS.TILE_SIZE * 4, CONSTANTS.TILE_SIZE * 4);
                }

                if (gfx.char) {
                    ctx.fillStyle = '#fff';
                    ctx.fillText(gfx.char, x * CONSTANTS.TILE_SIZE + CONSTANTS.TILE_SIZE / 2, y * CONSTANTS.TILE_SIZE + CONSTANTS.TILE_SIZE / 2 + 2);
                }
            }
        }
    }
    
    ctx.globalAlpha = 1.0;
    const playerGfx = TILE_GFX['PLAYER'];
    ctx.fillStyle = playerGfx.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);
    ctx.fillStyle = '#000';
    ctx.fillText(playerGfx.char, player.x + player.width/2, player.y + player.height/2 + 2);

    ctx.restore();
    
    if (isMapVisible) {
        renderMinimap();
    }
}

function renderMinimap() {
    const mapTileSize = CONSTANTS.MINIMAP_TILE_SIZE;
    minimapCanvas.width = CONSTANTS.MAP_WIDTH * mapTileSize;
    minimapCanvas.height = CONSTANTS.MAP_HEIGHT * mapTileSize;

    minimapCtx.fillStyle = 'rgba(0,0,0,0.75)';
    minimapCtx.fillRect(0, 0, minimapCanvas.width, minimapCanvas.height);

    for (let y = 0; y < CONSTANTS.MAP_HEIGHT; y++) {
        for (let x = 0; x < CONSTANTS.MAP_WIDTH; x++) {
            if (visibilityMap[y][x] > 0) {
                const tileType = map[y][x];
                let color = 'transparent';
                switch(tileType) {
                    case TILE_TYPES.FLOOR:
                    case TILE_TYPES.DECOR:
                        color = '#666'; break;
                    case TILE_TYPES.DOOR:
                        color = '#b89b72'; break;
                    case TILE_TYPES.FIREPLACE:
                        color = '#e67e22'; break;
                    case TILE_TYPES.PAGE:
                        color = '#FFD700'; break;
                }
                if (color !== 'transparent') {
                    minimapCtx.fillStyle = color;
                    minimapCtx.fillRect(x * mapTileSize, y * mapTileSize, mapTileSize, mapTileSize);
                }
            }
        }
    }
    
    minimapCtx.strokeStyle = '#e67e22';
    minimapCtx.lineWidth = 1;
    for (const room of rooms) {
        if (room.isSafe) {
            let roomIsVisible = false;
            for (let ry = room.y; ry < room.y + room.h; ry++) {
                if (visibilityMap[ry][room.x] > 0) { roomIsVisible = true; break; }
            }
            if (roomIsVisible) {
                 minimapCtx.strokeRect(room.x * mapTileSize, room.y * mapTileSize, room.w * mapTileSize, room.h * mapTileSize);
            }
        }
    }

    const playerMapX = Math.floor((player.x + player.width / 2) / CONSTANTS.TILE_SIZE);
    const playerMapY = Math.floor((player.y + player.height / 2) / CONSTANTS.TILE_SIZE);
    minimapCtx.fillStyle = '#00FFFF';
    minimapCtx.fillRect(playerMapX * mapTileSize, playerMapY * mapTileSize, mapTileSize, mapTileSize);
}


// --- Utility Functions ---
function resizeCanvas() {
    const containerW = gameContainer.clientWidth; const containerH = gameContainer.clientHeight;
    const aspectRatio = 4/3; let newWidth, newHeight;
    if (containerW / containerH > aspectRatio) { newHeight = containerH * 0.9; newWidth = newHeight * aspectRatio; } 
    else { newWidth = containerW * 0.9; newHeight = newWidth / aspectRatio; }
    canvas.width = Math.floor(newWidth / 2); canvas.height = Math.floor(newHeight / 2);
    canvas.style.width = `${newWidth}px`; canvas.style.height = `${newHeight}px`;
}

// --- Event Listeners ---
window.addEventListener('keydown', (e) => { 
    const key = e.key.toLowerCase(); 
    if (keys[key] !== undefined && !keys[key]) {
        if (key === 'm') {
            isMapVisible = !isMapVisible;
            minimapCanvas.style.display = isMapVisible ? 'block' : 'none';
        }
    }
    if (keys[key] !== undefined) keys[key] = true; 
    if (key === 'e') interact(); 
});
window.addEventListener('keyup', (e) => { 
    const key = e.key.toLowerCase();
    if (keys[key] !== undefined) keys[key] = false; 
});
window.addEventListener('resize', () => { if(isGameRunning) resizeCanvas(); });
startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);
modalClose.addEventListener('click', () => { modalOverlay.style.opacity = 0; modalOverlay.style.pointerEvents = 'none'; });