let scene, camera, renderer, starPoints;

function init3DSpace(starsData) {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 2000);
    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('starCanvas'), alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);

    const geometry = new THREE.BufferGeometry();
    const positions = [], colors = [];

    starsData.forEach(star => {
        const ra = parseFloat(star.ra) * (Math.PI / 180);
        const dec = parseFloat(star.dec) * (Math.PI / 180);
        const r = 800; 

        positions.push(r * Math.cos(dec) * Math.cos(ra), r * Math.cos(dec) * Math.sin(ra), r * Math.sin(dec));
        const c = new THREE.Color(stellarPalette[Math.floor(Math.random()*7)]);
        colors.push(c.r, c.g, c.b);
    });

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
    starPoints = new THREE.Points(geometry, new THREE.PointsMaterial({ size: 2, vertexColors: true }));
    scene.add(starPoints);
    camera.position.z = 5;

    animate();
}

function animate() {
    requestAnimationFrame(animate);
    starPoints.rotation.y += 0.0003;
    renderer.render(scene, camera);
}

function getScientificLore(star) {
    const dist = Math.pow(10, (star.mag + 5) / 5).toFixed(0);
    return `This star is approximately **${dist} light-years** away. Its light journeyed since the year ${new Date().getFullYear() - dist}.`;
}