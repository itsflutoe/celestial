/**
 * EXPLORER.JS - V17 STABLE (CENTER-LOCK + EARTH + FIXED CONTROLS)
 */

let exScene, exCamera, exRenderer, exRaycaster, exMouse, exSprites = [];
let isRotating = true;
let isDragging = false;
let orbitGroup;

window.open3DExplorer = function () {
    if (!stars || stars.length === 0) return;

    const overlay = document.createElement('div');
    overlay.id = "explorer-3d-overlay";
    overlay.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:#020617; z-index:99999;";

    overlay.innerHTML = `
        <div id="ex-ui" style="position:absolute; top:20px; left:20px; z-index:100; pointer-events:none;">
            <h2 style="color:#fff; font-family:'Playfair Display', serif; font-style:italic; margin:0;">Celestial Archive</h2>
            <p style="color:#38bdf8; font-size:0.7rem; text-transform:uppercase;">A Star from Me to You</p>
        </div>

        <button onclick="window.close3DExplorer()" style="position:absolute; top:20px; right:20px; z-index:100; background:rgba(255,255,255,0.1); border:none; color:#fff; width:45px; height:45px; border-radius:50%; font-size:1.5rem; cursor:pointer; backdrop-filter:blur(10px); display:flex; align-items:center; justify-content:center;">✕</button>

        <div id="ex-info-card" style="position:absolute; bottom:40px; left:50%; transform:translateX(-50%); z-index:1000; width:90%; max-width:400px; display:none;"></div>

        <canvas id="exCanvas"></canvas>
    `;

    document.body.appendChild(overlay);
    initExplorer3D();
};

function createStarTexture(color) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;

    const ctx = canvas.getContext('2d');

    const centerX = canvas.width * 0.38;
    const centerY = canvas.height * 0.38;
    const radius = canvas.width / 2.3;

    const glow = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 0, canvas.width/2, canvas.height/2, canvas.width/2);
    glow.addColorStop(0, color);
    glow.addColorStop(0.6, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0,0, canvas.width, canvas.height);

    const grad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.2, '#fff4e0');
    grad.addColorStop(0.5, color);
    grad.addColorStop(0.9, '#1a130c');
    grad.addColorStop(1, '#000000');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(canvas.width/2, canvas.height/2, radius, 0, Math.PI*2);
    ctx.fill();

    return new THREE.CanvasTexture(canvas);
}

function initExplorer3D() {
    const canvas = document.getElementById('exCanvas');

    exScene = new THREE.Scene();
    orbitGroup = new THREE.Group();
    exScene.add(orbitGroup);

    exCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000);
    exCamera.position.set(0, 0, 1500);

    exRenderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    exRenderer.setSize(window.innerWidth, window.innerHeight);

    exRaycaster = new THREE.Raycaster();
    exMouse = new THREE.Vector2();

    // 🌍 EARTH
    const earthGeometry = new THREE.SphereGeometry(120, 32, 32);
    const earthMaterial = new THREE.MeshBasicMaterial({
        map: new THREE.TextureLoader().load('https://threejs.org/examples/textures/land_ocean_ice_cloud_2048.jpg')
    });
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    orbitGroup.add(earth);

    // ⭐ STARS
    Object.values(globalRegistry).forEach((claim) => {
        const s = stars.find(st => st.id === claim.StarID);
        if (!s) return;

        const ra = s.ra * (Math.PI / 180);
        const dec = s.dec * (Math.PI / 180);
        const r = 800;

        const hue = stellarPalette[Math.abs(Math.floor(s.mag)) % stellarPalette.length];

        const sprite = new THREE.Sprite(
            new THREE.SpriteMaterial({ map: createStarTexture(hue) })
        );

        sprite.position.set(
            r * Math.cos(dec) * Math.cos(ra),
            r * Math.cos(dec) * Math.sin(ra),
            r * Math.sin(dec)
        );

        sprite.scale.set(90, 90, 1);
        sprite.userData = { ...s, claim };

        orbitGroup.add(sprite);
        exSprites.push(sprite);
    });

    // 🖱️ ROTATION
    const handleMove = (dx, dy) => {
        if (!isRotating) return;

        orbitGroup.rotation.y += dx * 0.005;
        orbitGroup.rotation.x += dy * 0.005;

        orbitGroup.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, orbitGroup.rotation.x));
    };

    canvas.addEventListener('mousedown', () => isDragging = true);
    canvas.addEventListener('mousemove', (e) => {
        if (isDragging) handleMove(e.movementX, e.movementY);
    });
    window.addEventListener('mouseup', () => isDragging = false);

    // 📱 TOUCH
    let lastTouchX, lastTouchY, initialDist = null;

    canvas.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            lastTouchX = e.touches[0].pageX;
            lastTouchY = e.touches[0].pageY;
        }
    });

    canvas.addEventListener('touchmove', (e) => {
        if (e.touches.length === 1 && isRotating) {
            handleMove(
                e.touches[0].pageX - lastTouchX,
                e.touches[0].pageY - lastTouchY
            );

            lastTouchX = e.touches[0].pageX;
            lastTouchY = e.touches[0].pageY;
        }
    });

    canvas.addEventListener('touchmove', (e) => {
        if (e.touches.length === 2) {
            e.preventDefault();

            const dist = Math.hypot(
                e.touches[0].pageX - e.touches[1].pageX,
                e.touches[0].pageY - e.touches[1].pageY
            );

            if (initialDist !== null) {
                exCamera.position.z += (initialDist - dist) * 3;
                exCamera.position.z = Math.min(Math.max(exCamera.position.z, 400), 3000);
            }

            initialDist = dist;
        }
    }, { passive: false });

    canvas.addEventListener('touchend', () => {
        initialDist = null;
    });

    // 🖱️ ZOOM
    canvas.addEventListener('wheel', (e) => {
        exCamera.position.z += e.deltaY * 1.2;
        exCamera.position.z = Math.min(Math.max(exCamera.position.z, 400), 3000);
    });

    // 🎯 CLICK
    canvas.addEventListener('click', (e) => {
        if (!isRotating) return;

        exMouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        exMouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

        exRaycaster.setFromCamera(exMouse, exCamera);
        const intersects = exRaycaster.intersectObjects(exSprites);

        if (intersects.length > 0) {
            zoomToStar(intersects[0].object);
        }
    });

    animateExplorer();
}

function zoomToStar(sprite) {
    const worldPos = new THREE.Vector3();
    sprite.getWorldPosition(worldPos);

    const dir = worldPos.clone().normalize();
    const targetPos = worldPos.clone().add(dir.multiplyScalar(250));

    const start = exCamera.position.clone();
    let t = 0;

    isRotating = false;

    const anim = () => {
        t += 0.04;

        exCamera.position.lerpVectors(start, targetPos, t);
        exCamera.lookAt(worldPos);

        if (t < 1) requestAnimationFrame(anim);
        else showExplorerCard(sprite.userData);
    };

    anim();
}

window.unpopCard = function () {
    document.getElementById('ex-info-card').style.display = 'none';

    exCamera.position.set(0, 0, 1500);
    exCamera.lookAt(0, 0, 0);

    isRotating = true;
};

function showExplorerCard(s) {
    const card = document.getElementById('ex-info-card');
    const hue = stellarPalette[Math.abs(Math.floor(s.mag)) % stellarPalette.length];

    card.style.display = "block";

    card.innerHTML = `
        <div class="card" style="border-top: 4px solid ${hue}; background:rgba(10,15,30,0.95); text-align:center; padding:30px; position:relative;">
            <button onclick="window.unpopCard()" style="position:absolute; top:10px; right:15px; background:none; border:none; color:#fff; cursor:pointer; font-size:1.2rem;">✕</button>

            <div style="font-size:0.6rem; color:${hue}; text-transform:uppercase; letter-spacing:2px;">${s.name}</div>

            <h2 style="margin:10px 0; color:#fff; font-family:'Playfair Display', serif;">
                Dedicated to ${s.claim.RecipientName}
            </h2>

            <p style="font-style:italic; color:#94a3b8;">
                "${s.claim.Message}"
            </p>

            <button class="btn-primary" style="width:100%; margin-top:20px;"
                onclick="window.renderArchiveView('${s.id}'); window.close3DExplorer();">
                View Full Archive
            </button>
        </div>
    `;
}

function animateExplorer() {
    if (!document.getElementById('exCanvas')) return;

    requestAnimationFrame(animateExplorer);

    if (isRotating) orbitGroup.rotation.y += 0.0003;

    exRenderer.render(exScene, exCamera);
}

window.close3DExplorer = function () {
    const el = document.getElementById('explorer-3d-overlay');
    if (el) el.remove();

    exSprites = [];
    isRotating = true;

    if (exRenderer) exRenderer.dispose();
};