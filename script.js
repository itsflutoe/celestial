/** * CELESTIAL V13 - FULL DATASET & ARCHIVE ENGINE **/
const GOOGLE_APP_URL = "https://script.google.com/macros/s/AKfycbzxFxXgN9-bwZ8Obd1pdjdakb46QB7U9nz8lVcFB6W4BENo2kENfGG1xpwNMjV95rphmQ/exec";
const STAR_DATA_URL = "https://raw.githubusercontent.com/ofrohn/d3-celestial/master/data/stars.6.json";

let stars = [], globalRegistry = {}, currentStar = null;
let canvas, ctx, points = [];
const stellarPalette = ["#9bb0ff", "#aabfff", "#cad7ff", "#f8f7ff", "#fff4ea", "#ffd2a1", "#ffcc6f"];

// --- 1. CORE DATA & SYNC HANDSHAKE ---
async function loadData() {
  const statusText = document.getElementById('status-text');
  const statusDot = document.getElementById('status-dot');
  
  if(statusText) statusText.innerText = "Connecting to Observatory...";
  if(statusDot) statusDot.classList.remove('online');

  try {
    const [sResp, rResp] = await Promise.all([
      fetch(STAR_DATA_URL),
      fetch(GOOGLE_APP_URL, { redirect: "follow" })
    ]);
    
    const registry = await rResp.json();
    registry.forEach(r => globalRegistry[r.StarID] = r);
    
    const starsData = await sResp.json();
    stars = starsData.features.map(f => ({
      id: `HIP_${f.id}`,
      name: f.properties.name || `HIP ${f.id}`,
      ra: f.geometry.coordinates[0].toFixed(2),
      dec: f.geometry.coordinates[1].toFixed(2),
      mag: parseFloat(f.properties.mag) || 5.0,
      con: f.properties.con || "Deep Space"
    }));

    initBackground();
    updateCounter();

    if(statusDot) statusDot.classList.add('online');
    if(statusText) statusText.innerText = "Connected to Observatory";

    const sharedId = new URLSearchParams(window.location.search).get('star');
    if(sharedId && globalRegistry[sharedId]) renderArchiveView(sharedId);
    else renderBuilder();

  } catch(e) { 
    if(statusText) statusText.innerText = "Connection Failed";
    renderBuilder(); 
  }
}

// ADDED: Global hook for the Explorer
window.renderArchiveView = function(starId) {
    const star = stars.find(s => s.id === starId);
    if(!star) return renderBuilder();
    
    const claim = globalRegistry[starId];
    const starHue = stellarPalette[Math.abs(Math.floor(star.mag)) % stellarPalette.length];
    const dist = Math.pow(10, (star.mag + 5) / 5).toFixed(0);
    const lightYearOrigin = new Date().getFullYear() - dist;
    
    window.currentStarData = { star: star, name: claim.RecipientName, msg: claim.Message };

    document.getElementById("main-content").innerHTML = `
        <div class="archive-header" style="text-align:center; margin-bottom:30px; animation: fadeIn 1.5s;">
            <p style="letter-spacing:6px; color:var(--primary); font-size:0.65rem; text-transform:uppercase;">Permanent Archive Record</p>
            <h1 style="margin:0; background:none; -webkit-text-fill-color:white; font-family:'Playfair Display', serif; font-style:italic;">Celestial Legacy</h1>
        </div>

        <div class="card" style="text-align:center; border: 1px solid rgba(255,255,255,0.1); padding: 50px 20px; background: rgba(10, 15, 30, 0.9);">
            <div class="star-system" style="height: 180px; display: flex; align-items: center; justify-content: center; margin-bottom: 35px; position: relative;">
                <div style="position: absolute; width: 130px; height: 130px; background: ${starHue}; filter: blur(50px); opacity: 0.25; border-radius: 50%;"></div>
                <div class="star-sphere" style="width: 85px; height: 85px; background: radial-gradient(circle at 35% 35%, #fff 0%, ${starHue} 35%, #1a1a1a 95%); border-radius: 50%; box-shadow: inset -5px -5px 15px rgba(0,0,0,0.8), 0 0 25px ${starHue}; position: relative;"></div>
            </div>

            <p class="label" style="color:var(--primary); letter-spacing:3px;">Star named after</p>
            <h2 style="font-size:2.5rem; color:#fff; margin: 10px 0; font-family:'Playfair Display', serif;">${claim.RecipientName}</h2>
            <div style="font-size:1.1rem; color:${starHue}; letter-spacing:2px; font-weight:600; margin-bottom:20px; text-transform:uppercase;">${star.name}</div>
            <p style="font-size:0.75rem; color:#64748b; margin-bottom:25px;">Light from this body left its source in <b>${lightYearOrigin}</b>.</p>
            
            <div style="background:rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08); padding:30px; border-radius:20px; margin-bottom:30px;">
                <p style="font-style:italic; color:#94a3b8; line-height:1.8; font-size:1.05rem;">"${claim.Message}"</p>
            </div>

            <div class="data-grid" style="grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom:30px;">
                <div class="data-item"><div class="label">Sector</div><div class="val">${star.con}</div></div>
                <div class="data-item"><div class="label">Mag</div><div class="val">${star.mag}</div></div>
                <div class="data-item"><div class="label">Dist</div><div class="val">${dist} LY</div></div>
                <div class="data-item"><div class="label">Catalog</div><div class="val">${star.id}</div></div>
                <div class="data-item"><div class="label">RA</div><div class="val">${star.ra}°</div></div>
                <div class="data-item"><div class="label">DEC</div><div class="val">${star.dec}°</div></div>
            </div>

            <button class="btn-certificate" onclick="createStarCertificate(window.currentStarData)">📜 Grab Certificate</button>
            <button class="btn-ghost" style="margin-top:20px; width:100%;" onclick="window.location.href=window.location.pathname">✨ Return to Observatory</button>
        </div>
    `;
}

// --- 3. UI BUILDER ---
function renderBuilder() {
  const container = document.getElementById("main-content");
  if(!container) return;
  container.innerHTML = `
    <h1 style="font-family:'Playfair Display', serif; font-style:italic;">Star Registry</h1>
    <div class="card">
      <div class="status-badge"><div class="dot" id="status-dot"></div><span id="status-text">Connected to Observatory</span></div>
      <div class="input-row">
        <input type="number" id="dd" placeholder="DD"><input type="number" id="mm" placeholder="MM"><input type="number" id="yy" placeholder="YYYY">
      </div>
      <div class="btn-row">
        <button class="btn-main" onclick="selectStar('date')">Find Star 🔍</button>
        <button class="btn-ghost" onclick="selectStar('rand')">Random 💫</button>
      </div>
    </div><div id="display-area"></div>`;
    if(stars.length > 0) document.getElementById('status-dot')?.classList.add('online');
}

// --- 4. BACKGROUND WARP ---
function initBackground() {
  canvas = document.getElementById('starCanvas');
  ctx = canvas.getContext('2d');
  resize();
  window.addEventListener('resize', resize);
  points = [];
  for(let i=0; i<150; i++) points.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, z: Math.random() * canvas.width });
  animate();
}

function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }

function animate() {
  ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#fff";
  points.forEach(p => {
    p.z -= 1.2; if (p.z <= 0) p.z = canvas.width;
    const sx = (p.x - canvas.width/2) * (canvas.width/p.z) + canvas.width/2;
    const sy = (p.y - canvas.height/2) * (canvas.width/p.z) + canvas.height/2;
    const size = (1 - p.z/canvas.width) * 2.5;
    ctx.beginPath(); ctx.arc(sx, sy, size, 0, Math.PI*2); ctx.fill();
  });
  requestAnimationFrame(animate);
}

// --- 5. DATA HELPERS ---
function selectStar(mode) {
  if(mode === 'date') {
    const d=document.getElementById('dd').value, m=document.getElementById('mm').value, y=document.getElementById('yy').value;
    if(!d || !m || !y) return alert("Enter a full date.");
    currentStar = stars[Math.abs(new Date(y, m-1, d).getTime()) % stars.length];
  } else currentStar = stars[Math.floor(Math.random()*stars.length)];
  displayStarDetails(currentStar);
}

function displayStarDetails(star) {
  currentStar = star;
  const starHue = stellarPalette[Math.abs(Math.floor(star.mag)) % stellarPalette.length];
  const dist = Math.pow(10, (star.mag + 5) / 5).toFixed(0);
  const claim = globalRegistry[star.id];

  document.getElementById('display-area').innerHTML = `
    <div class="card" style="border-top: 4px solid ${starHue}; animation: slideUp 0.5s ease-out;">
      <div class="star-name" style="color:${starHue}">${star.name}</div>
      <div class="data-grid" style="grid-template-columns: 1fr 1fr 1fr; gap: 8px;">
        <div class="data-item"><div class="label">ID</div><div class="val" style="font-size:0.7rem;">${star.id}</div></div>
        <div class="data-item"><div class="label">Sector</div><div class="val">${star.con}</div></div>
        <div class="data-item"><div class="label">Dist</div><div class="val">${dist} LY</div></div>
        <div class="data-item"><div class="label">RA</div><div class="val">${star.ra}°</div></div>
        <div class="data-item"><div class="label">DEC</div><div class="val">${star.dec}°</div></div>
        <div class="data-item"><div class="label">Mag</div><div class="val">${star.mag}</div></div>
      </div>
      ${claim ? `<p style="text-align:center; color:#94a3b8; margin-top:20px;">Dedicated to <b>${claim.RecipientName}</b></p>` : `
      <div style="margin-top:20px">
        <input type="text" id="rec-name" placeholder="Dedicate To">
        <textarea id="rec-msg" placeholder="Legacy Message"></textarea>
        <button class="btn-primary" onclick="submitClaim()">Finalize Claim</button>
      </div>`}
    </div><div id="link-area"></div>`;
}

async function submitClaim() {
  const name = document.getElementById('rec-name').value;
  const msg = document.getElementById('rec-msg').value;
  if(!name) return alert("Name required.");
  const btn = document.querySelector('.btn-primary');
  if(btn) { btn.disabled = true; btn.innerText = "Transmitting..."; }

  try {
    const data = { StarID: currentStar.id, RecipientName: name, Message: msg };
    await fetch(GOOGLE_APP_URL, { method: 'POST', body: JSON.stringify(data), headers: { 'Content-Type': 'text/plain' }});
    globalRegistry[currentStar.id] = data;
    const shareLink = window.location.href.split('?')[0] + "?star=" + currentStar.id;
    document.getElementById('link-area').innerHTML = `
      <div class="card" style="border-color:var(--primary); margin-top:15px; text-align:center;">
        <p style="font-size:0.7rem; color:var(--primary); letter-spacing:2px;">TRANSMISSION VERIFIED</p>
        <input type="text" value="${shareLink}" readonly style="width:100%; background:rgba(255,255,255,0.05); border:1px solid #334155; color:#fff; padding:12px; border-radius:10px; margin:15px 0; font-size:0.8rem; text-align:center;">
        <button class="btn-certificate" onclick="window.renderArchiveView('${currentStar.id}')">🌌 View Memorial Archive</button>
      </div>`;
    updateCounter();
  } catch(e) { alert("Error."); if(btn) btn.disabled = false; }
}

// ADDED: onclick for the 3D Explorer
function updateCounter() {
  const count = Object.keys(globalRegistry).length;
  const container = document.querySelector('.counter');
  
  if(container) {
      container.innerHTML = `
        <button onclick="window.open3DExplorer()" style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:#fff; padding:8px 15px; border-radius:30px; cursor:pointer; font-family:'Inter', sans-serif; font-size:0.8rem; backdrop-filter:blur(5px); display:flex; align-items:center;">
            Named Stars: <b id="named-count" style="color:#38bdf8; margin-left:5px;">${count.toLocaleString()}</b> ✨
        </button>
      `;
  }
}

document.addEventListener('DOMContentLoaded', loadData);