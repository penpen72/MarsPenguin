// --- 1. 場景設定 ---
const scene = new THREE.Scene();
// 背景色改亮一點的深紅，避免太黑
scene.background = new THREE.Color(0x1a0d0d);

// ★ 修正：霧氣範圍大幅拉遠 (50, 180)
// 之前的 90 太近了，導致攝影機拉遠後，畫面都在霧裡
scene.fog = new THREE.Fog(0x1a0d0d, 50, 180);

const camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.1, 1000);

const baseOffset = new THREE.Vector3(25, 35, 25);
const cameraOffset = new THREE.Vector3();

function updateCameraOffset() {
    const isPortrait = window.innerHeight > window.innerWidth;
    const scale = isPortrait ? 1.4 : 1.0;
    cameraOffset.copy(baseOffset).multiplyScalar(scale);
}
updateCameraOffset();

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

// --- 燈光調整 ---

// ★ 修正：環境光增強 (0.4 -> 0.7)，讓陰影處看得更清楚
const ambientLight = new THREE.AmbientLight(0xffccaa, 0.7);
scene.add(ambientLight);

// ★ 修正：太陽光增強 (1.2 -> 1.5)
const dirLight = new THREE.DirectionalLight(0xffddaa, 1.5);
dirLight.position.set(-30, 50, -20);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
const d = 100;
dirLight.shadow.camera.left = -d;
dirLight.shadow.camera.right = d;
dirLight.shadow.camera.top = d;
dirLight.shadow.camera.bottom = -d;
scene.add(dirLight);

// --- 2. 地形 ---
function getTerrainHeight(x, z) {
    const scale1 = 0.05;
    const scale2 = 0.15;
    let y = Math.sin(x * scale1) * 2 + Math.cos(z * scale1) * 2;
    y += Math.sin(x * scale2 + z * scale2) * 0.5;
    const distToBase = Math.sqrt((x - 10) * (x - 10) + (z + 10) * (z + 10));
    if (distToBase < 15) {
        y = y * (distToBase / 15);
    }
    return y;
}

const groundGeo = new THREE.PlaneGeometry(300, 300, 128, 128);
const posAttribute = groundGeo.attributes.position;
for (let i = 0; i < posAttribute.count; i++) {
    const x = posAttribute.getX(i);
    const y = posAttribute.getY(i);
    posAttribute.setZ(i, getTerrainHeight(x, -y));
}
groundGeo.computeVertexNormals();
// 地面粗糙度稍微降低 (0.9 -> 0.8)，讓它能反射多一點點光
const ground = new THREE.Mesh(groundGeo, new THREE.MeshStandardMaterial({ color: 0x884433, roughness: 0.8 }));
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// 碎石
const pebbleGeo = new THREE.DodecahedronGeometry(0.2, 0);
const pebbleMat = new THREE.MeshStandardMaterial({ color: 0x553333 });
const pebbleMesh = new THREE.InstancedMesh(pebbleGeo, pebbleMat, 2000);
const dummy = new THREE.Object3D();
for (let i = 0; i < 2000; i++) {
    const x = (Math.random() - 0.5) * 200;
    const z = (Math.random() - 0.5) * 200;
    if (Math.sqrt((x - 10) * (x - 10) + (z + 10) * (z + 10)) > 12) {
        dummy.position.set(x, getTerrainHeight(x, z) + 0.1, z);
        dummy.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
        const s = 0.5 + Math.random();
        dummy.scale.set(s, s, s);
        dummy.updateMatrix();
        pebbleMesh.setMatrixAt(i, dummy.matrix);
    }
}
pebbleMesh.receiveShadow = true;
pebbleMesh.castShadow = true;
scene.add(pebbleMesh);

// --- 3. 企鵝主角 ---
const penguin = new THREE.Group();
const penguinScale = 1.2;
penguin.scale.set(penguinScale, penguinScale, penguinScale);
penguin.position.set(0, 0, 0);

const body = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1, 2.5, 16), new THREE.MeshLambertMaterial({ color: 0x222222 }));
body.position.y = 1.25; body.castShadow = true; penguin.add(body);
const belly = new THREE.Mesh(new THREE.SphereGeometry(0.75, 16, 16), new THREE.MeshLambertMaterial({ color: 0xffffff }));
belly.position.set(0, 1, 0.3); belly.scale.set(1, 1.5, 0.5); penguin.add(belly);

const eyeGeo = new THREE.SphereGeometry(0.1, 8, 8);
const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
const lEye = new THREE.Mesh(eyeGeo, eyeMat); lEye.position.set(-0.3, 2.1, 0.65); penguin.add(lEye);
const rEye = new THREE.Mesh(eyeGeo, eyeMat); rEye.position.set(0.3, 2.1, 0.65); penguin.add(rEye);
const beak = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.5, 16), new THREE.MeshLambertMaterial({ color: 0xffa500 }));
beak.rotation.x = Math.PI / 2; beak.position.set(0, 1.9, 0.9); penguin.add(beak);

const packGeo = new THREE.BoxGeometry(1.2, 1.5, 0.6);
const packMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee });
const backpack = new THREE.Mesh(packGeo, packMat);
backpack.position.set(0, 1.2, -0.6); backpack.castShadow = true; penguin.add(backpack);

const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.8), new THREE.MeshStandardMaterial({ color: 0x888888 }));
ant.position.set(0.4, 2, -0.6); penguin.add(ant);
const antLight = new THREE.Mesh(new THREE.SphereGeometry(0.1), new THREE.MeshBasicMaterial({ color: 0xff0000 }));
antLight.position.set(0, 0.4, 0); ant.add(antLight);

const wGeo = new THREE.BoxGeometry(0.2, 1, 0.6);
const wMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
const wL = new THREE.Mesh(wGeo, wMat); wL.position.set(-0.9, 1.5, 0); wL.rotation.z = 0.3; penguin.add(wL);
const wR = new THREE.Mesh(wGeo, wMat); wR.position.set(0.9, 1.5, 0); wR.rotation.z = -0.3; penguin.add(wR);

const helmet = new THREE.Mesh(new THREE.SphereGeometry(1.4, 32, 32), new THREE.MeshPhongMaterial({ color: 0x88ccff, opacity: 0.25, transparent: true, shininess: 150 }));
helmet.position.y = 1.8; penguin.add(helmet);

const flashLight = new THREE.SpotLight(0xffffff, 1, 40, Math.PI / 6, 0.5, 1);
flashLight.position.set(0, 3, 0);
flashLight.target.position.set(0, 1, 5);
penguin.add(flashLight); penguin.add(flashLight.target);

scene.add(penguin);

const clickMarker = new THREE.Mesh(new THREE.RingGeometry(0.4, 0.6, 32), new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0, side: THREE.DoubleSide }));
clickMarker.rotation.x = -Math.PI / 2;
scene.add(clickMarker);

// --- 4. 物件生成 ---
const objects = [];
const discoveryLog = document.getElementById('log-list');

const missionItems = [
    { id: 'base', name: "火星前哨站", desc: "這是我的家，溫暖又安全。", x: 10, z: -10, type: 'base' },
    { id: 'rover1', name: "好奇號殘骸", desc: "看起來還能修好...大概吧？", x: 35, z: -40, type: 'rover' },
    { id: 'crystal', name: "能量水晶群", desc: "發出神祕的嗡嗡聲。", x: -45, z: 20, type: 'crystal' },
    { id: 'monolith', name: "黑色石碑", desc: "不知道是誰放在這裡的。", x: 60, z: 50, type: 'monolith' },
    { id: 'skeleton', name: "巨大化石", desc: "這骨頭...看起來像恐龍？", x: -60, z: -50, type: 'skeleton' },
    { id: 'solar', name: "太陽能陣列", desc: "為基地提供電力的來源。", x: -5, z: 15, type: 'solar' }
];

missionItems.forEach(item => {
    const li = document.createElement('li');
    li.id = 'log-' + item.id;
    li.innerText = "???";
    discoveryLog.appendChild(li);
});

function createBase(x, z) {
    const y = getTerrainHeight(x, z);
    const group = new THREE.Group(); group.position.set(x, y, z);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(5, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, metalness: 0.5 }));
    group.add(dome);
    const door = new THREE.Mesh(new THREE.BoxGeometry(2, 3, 1), new THREE.MeshStandardMaterial({ color: 0x333333 }));
    door.position.set(0, 1.5, 4.8); group.add(door);
    const light = new THREE.PointLight(0x00ffff, 1, 15); light.position.set(0, 2, 0); group.add(light);
    group.castShadow = true; group.receiveShadow = true;
    group.userData = { msg: "火星前哨站：任務開始的地方。", id: "base", radarColor: "#ffffff" };
    scene.add(group); objects.push(group);
}

function createSolarPanel(x, z) {
    const y = getTerrainHeight(x, z);
    const group = new THREE.Group(); group.position.set(x, y, z);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 3), new THREE.MeshStandardMaterial({ color: 0x888888 })); pole.position.y = 1.5; group.add(pole);
    const panel = new THREE.Mesh(new THREE.BoxGeometry(4, 0.1, 2), new THREE.MeshStandardMaterial({ color: 0x111133 })); panel.position.set(0, 3, 0); panel.rotation.x = Math.PI / 4; group.add(panel);
    group.userData = { msg: "太陽能板：運作效率 98%。", id: "solar", radarColor: "#5555ff" };
    scene.add(group); objects.push(group);
}

function createGenericObject(item) {
    const y = getTerrainHeight(item.x, item.z);
    const group = new THREE.Group(); group.position.set(item.x, y, item.z);
    let mesh, colorForRadar = "#ff0000";
    if (item.type === 'rover') {
        const chassis = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 3), new THREE.MeshStandardMaterial({ color: 0xaaaaaa }));
        chassis.position.y = 0.8; group.add(chassis); colorForRadar = "#ffaa00";
    } else if (item.type === 'crystal') {
        for (let i = 0; i < 3; i++) {
            const c = new THREE.Mesh(new THREE.ConeGeometry(0.4, 2 + i * 0.5, 5), new THREE.MeshPhongMaterial({ color: 0x00ffff, emissive: 0x003333 }));
            c.position.set((i - 1) * 0.5, 1, (Math.random() - 0.5)); c.rotation.x = (Math.random() - 0.5) * 0.5; group.add(c);
        }
        const l = new THREE.PointLight(0x00ffff, 1, 5); l.position.y = 1; group.add(l); colorForRadar = "#00ffff";
    } else if (item.type === 'monolith') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 6, 0.5), new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8 }));
        mesh.position.y = 3; group.add(mesh); colorForRadar = "#ffffff";
    } else if (item.type === 'skeleton') {
        const mat = new THREE.MeshStandardMaterial({ color: 0xdddddd });
        for (let i = 0; i < 5; i++) {
            const rib = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.15, 8, 16, Math.PI), mat);
            rib.position.set(0, 0, i * 1.5 - 3); rib.rotation.y = Math.PI / 2; group.add(rib);
        }
        colorForRadar = "#aaaaaa";
    }
    group.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
    group.userData = { msg: item.desc, id: item.id, radarColor: colorForRadar };
    scene.add(group); objects.push(group);
}

missionItems.forEach(item => {
    if (item.type === 'base') createBase(item.x, item.z);
    else if (item.type === 'solar') createSolarPanel(item.x, item.z);
    else createGenericObject(item);
});

for (let i = 0; i < 20; i++) {
    const rx = (Math.random() - 0.5) * 150; const rz = (Math.random() - 0.5) * 150;
    if (Math.sqrt((rx - 10) ** 2 + (rz + 10) ** 2) > 15) {
        const s = new THREE.Mesh(new THREE.DodecahedronGeometry(Math.random() * 0.8 + 0.5), new THREE.MeshStandardMaterial({ color: 0x553333 }));
        s.position.set(rx, getTerrainHeight(rx, rz) + 0.5, rz); s.castShadow = true; scene.add(s);
        const g = new THREE.Group(); g.position.copy(s.position); g.userData = { msg: "普通石頭" }; objects.push(g);
    }
}

// --- 5. 遊戲邏輯 ---
const keys = { w: false, a: false, s: false, d: false };
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let targetPosition = null;
let isAutoMoving = false;
const discoveredSet = new Set();

let startTime = Date.now();
let isGameCompleted = false;
let isEndlessMode = false;

const timerDisplay = document.getElementById('timer-display');
const victoryModal = document.getElementById('victory-modal');
const finalTimeText = document.getElementById('final-time');

window.addEventListener('keydown', (e) => {
    if (isGameCompleted && !isEndlessMode) return;
    if (['w', 'a', 's', 'd'].includes(e.key) || e.key.startsWith('Arrow')) {
        isAutoMoving = false;
        if (e.key === 'w' || e.key === 'ArrowUp') keys.w = true; if (e.key === 'a' || e.key === 'ArrowLeft') keys.a = true;
        if (e.key === 's' || e.key === 'ArrowDown') keys.s = true; if (e.key === 'd' || e.key === 'ArrowRight') keys.d = true;
    }
});
window.addEventListener('keyup', (e) => {
    if (e.key === 'w' || e.key === 'ArrowUp') keys.w = false; if (e.key === 'a' || e.key === 'ArrowLeft') keys.a = false;
    if (e.key === 's' || e.key === 'ArrowDown') keys.s = false; if (e.key === 'd' || e.key === 'ArrowRight') keys.d = false;
});
window.addEventListener('pointerdown', (event) => {
    if (isGameCompleted && !isEndlessMode) return;
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(ground);
    if (intersects.length > 0) {
        targetPosition = intersects[0].point;
        isAutoMoving = true;
        clickMarker.position.copy(targetPosition);
        clickMarker.position.y = getTerrainHeight(targetPosition.x, targetPosition.z) + 0.2;
        clickMarker.scale.set(1, 1, 1);
        clickMarker.material.opacity = 1;
    }
});

const radarCanvas = document.getElementById('radar-canvas');
const radarCtx = radarCanvas.getContext('2d');
const radarScale = radarCanvas.width / 120;
const radarCenter = radarCanvas.width / 2;

function updateRadar() {
    radarCtx.clearRect(0, 0, radarCanvas.width, radarCanvas.height);
    radarCtx.strokeStyle = "rgba(60, 100, 60, 0.5)";
    radarCtx.beginPath(); radarCtx.arc(radarCenter, radarCenter, 20, 0, Math.PI * 2); radarCtx.stroke();
    radarCtx.beginPath(); radarCtx.arc(radarCenter, radarCenter, 40, 0, Math.PI * 2); radarCtx.stroke();
    objects.forEach(obj => {
        if (obj.userData.radarColor) {
            const dx = obj.position.x - penguin.position.x;
            const dz = obj.position.z - penguin.position.z;
            if (dx * dx + dz * dz < 3600) {
                radarCtx.fillStyle = obj.userData.radarColor;
                radarCtx.beginPath();
                radarCtx.arc(radarCenter + dx * radarScale, radarCenter + dz * radarScale, 2.5, 0, Math.PI * 2);
                radarCtx.fill();
            }
        }
    });
    radarCtx.fillStyle = "#00ff00";
    radarCtx.beginPath(); radarCtx.arc(radarCenter, radarCenter, 3, 0, Math.PI * 2); radarCtx.fill();
    radarCtx.save(); radarCtx.translate(radarCenter, radarCenter); radarCtx.rotate(-penguin.rotation.y);
    radarCtx.fillStyle = "rgba(0, 255, 0, 0.5)"; radarCtx.beginPath(); radarCtx.moveTo(0, -8); radarCtx.lineTo(4, 4); radarCtx.lineTo(-4, 4); radarCtx.fill(); radarCtx.restore();
}

function showNotification(text) {
    const el = document.createElement('div'); el.className = 'notification'; el.innerText = text;
    document.body.appendChild(el); setTimeout(() => el.remove(), 2000);
}

function finishGame() {
    isGameCompleted = true;
    const finalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    finalTimeText.innerText = finalTime + "s";
    victoryModal.style.display = 'flex';
}

window.continueGame = function () {
    victoryModal.style.display = 'none';
    isGameCompleted = false;
    isEndlessMode = true;
    timerDisplay.innerText = "Free Roam";
    timerDisplay.style.color = "#00ff00";
};

const msgBox = document.getElementById('message-box');
let walkTime = 0;

function animate() {
    requestAnimationFrame(animate);

    if (!isGameCompleted && !isEndlessMode) {
        if (discoveredSet.size < missionItems.length) {
            const t = ((Date.now() - startTime) / 1000).toFixed(1);
            timerDisplay.innerText = t + "s";
        } else {
            finishGame();
        }
    }

    if (!isGameCompleted) {
        let moveX = 0, moveZ = 0, isMoving = false;
        let targetAngle = penguin.rotation.y;

        if (keys.w || keys.s || keys.a || keys.d) {
            if (keys.w) moveZ = -1; if (keys.s) moveZ = 1; if (keys.a) moveX = -1; if (keys.d) moveX = 1;
            isMoving = true; targetAngle = Math.atan2(moveX, moveZ);
        } else if (isAutoMoving && targetPosition) {
            const dx = targetPosition.x - penguin.position.x;
            const dz = targetPosition.z - penguin.position.z;
            if (dx * dx + dz * dz > 0.1) {
                isMoving = true; targetAngle = Math.atan2(dx, dz);
                moveX = Math.sin(targetAngle); moveZ = Math.cos(targetAngle);
            } else isAutoMoving = false;
        }

        if (isMoving) {
            let diff = targetAngle - penguin.rotation.y;
            while (diff > Math.PI) diff -= Math.PI * 2; while (diff < -Math.PI) diff += Math.PI * 2;
            penguin.rotation.y += diff * 0.15;
            penguin.position.x += moveX * 0.2;
            penguin.position.z += moveZ * 0.2;
            walkTime += 0.25;
            penguin.rotation.z = Math.sin(walkTime) * 0.1;
        } else {
            penguin.rotation.z *= 0.8;
        }
    }

    const ty = getTerrainHeight(penguin.position.x, penguin.position.z);
    penguin.position.y = ty + 1.25 + Math.abs(Math.sin(walkTime)) * 0.2;

    flashLight.target.position.set(penguin.position.x + Math.sin(penguin.rotation.y) * 5, penguin.position.y, penguin.position.z + Math.cos(penguin.rotation.y) * 5);
    flashLight.target.updateMatrixWorld();

    camera.position.lerp(new THREE.Vector3(
        penguin.position.x + cameraOffset.x,
        penguin.position.y + cameraOffset.y,
        penguin.position.z + cameraOffset.z
    ), 0.1);
    camera.lookAt(penguin.position.x, penguin.position.y + 1, penguin.position.z);

    updateRadar();
    if (clickMarker.material.opacity > 0) {
        clickMarker.scale.multiplyScalar(0.92); clickMarker.material.opacity -= 0.08;
    }

    let nearMsg = null;
    objects.forEach(obj => {
        if (penguin.position.distanceTo(obj.position) < 6) {
            nearMsg = obj.userData.msg;
            const objId = obj.userData.id;
            if (objId && !discoveredSet.has(objId)) {
                discoveredSet.add(objId);
                const li = document.getElementById('log-' + objId);
                const itemData = missionItems.find(i => i.id === objId);
                if (li && itemData) {
                    li.innerText = itemData.name; li.className = 'found';
                    showNotification("發現: " + itemData.name);
                }
            }
        }
    });

    if (nearMsg) { msgBox.innerText = nearMsg; msgBox.style.display = 'block'; msgBox.style.opacity = 1; }
    else { msgBox.style.display = 'none'; }

    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    updateCameraOffset();
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
animate();
