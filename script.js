const GOOGLE_APP_URL = "https://script.google.com/macros/s/AKfycbwairy0b6eOScpxKCTgh4L9Bs_HOoBAIe9KZ8ZYJ5P6Cp4P8435Y0rXFg7mukbs4_HyjA/exec";

const constellationNames = {"And":"Andromeda","Ant":"Antlia","Aps":"Apus","Aqr":"Aquarius","Aql":"Aquila","Ara":"Ara","Ari":"Aries","Aur":"Auriga","Boo":"Boötes","Cae":"Caelum","Cam":"Camelopardalis","Cnc":"Cancer","CVn":"Canes Venatici","CMa":"Canis Major","CMi":"Canis Minor","Cap":"Capricornus","Car":"Carina","Cas":"Cassiopeia","Cen":"Centaurus","Cep":"Cepheus","Cet":"Cetus","Cha":"Chamaeleon","Cir":"Circinus","Col":"Columba","Com":"Coma Berenices","CrA":"Corona Australis","CrB":"Corona Borealis","Crv":"Corvus","Crt":"Crater","Cru":"Crux","Cyg":"Cygnus","Del":"Delphinus","Dor":"Dorado","Dra":"Draco","Equ":"Equuleus","Eri":"Eridanus","For":"Fornax","Gem":"Gemini","Gru":"Grus","Her":"Hercules","Hor":"Horologium","Hya":"Hydra","Hyi":"Hydrus","Ind":"Indus","Lac":"Lacerta","Leo":"Leo","LMi":"Leo Minor","Lep":"Lepus","Lib":"Libra","Lup":"Lupus","Lyn":"Lynx","Lyr":"Lyra","Men":"Mensa","Mic":"Microscopium","Mon":"Monoceros","Mus":"Musca","Nor":"Norma","Oct":"Octans","Oph":"Ophiuchus","Ori":"Orion","Pav":"Pavo","Peg":"Pegasus","Per":"Perseus","Phe":"Phoenix","Pic":"Pictor","Psc":"Pisces","PsA":"Piscis Austrinus","Pup":"Puppis","Pyx":"Pyxis","Ret":"Reticulum","Sge":"Sagitta","Sgr":"Sagittarius","Sco":"Scorpius","Scl":"Sculptor","Sct":"Scutum","Ser":"Serpens","Sex":"Sextans","Tau":"Taurus","Tel":"Telescopium","Tri":"Triangulum","TrA":"Triangulum Australe","Tuc":"Tucana","UMa":"Ursa Major","UMi":"Ursa Minor","Vel":"Vela","Vir":"Virgo","Vol":"Volans","Vul":"Vulpecula"};

let stars = [];
let globalRegistry = {};
let currentStar = null;

// --- LIVE TWINKLE BACKGROUND ---
const canvas = document.getElementById('starCanvas');
const ctx = canvas.getContext('2d');
let points = [];

function initBackground() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  points = [];
  for(let i=0; i<200; i++) {
    points.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 1.5,
      blink: Math.random() * 0.05
    });
  }
}

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "white";
  points.forEach(p => {
    p.blink += 0.01;
    let alpha = (Math.sin(p.blink) + 1) / 2;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
    ctx.fill();
    p.y -= 0.2;
    if(p.y < 0) p.y = canvas.height;
  });
  requestAnimationFrame(animate);
}

// --- DATA LOGIC ---
async function loadData() {
  const statusText = document.getElementById('status-text');
  const statusDot = document.getElementById('status-dot');
  try {
    const [sResp, nResp, rResp] = await Promise.all([
      fetch('https://raw.githubusercontent.com/ofrohn/d3-celestial/master/data/stars.6.json'),
      fetch('https://raw.githubusercontent.com/ofrohn/d3-celestial/master/data/starnames.json'),
      fetch(GOOGLE_APP_URL, { redirect: "follow" })
    ]);
    
    const registry = await rResp.json();
    registry.forEach(r => globalRegistry[r.StarID] = r);
    
    const starsData = await sResp.json();
    const names = await nResp.json();

    stars = starsData.features.map(f => {
      const id = f.id;
      const props = f.properties;
      let rawName = names[id] || names[String(id)] || `HIP ${id}`;
      let finalName = "";

      if (typeof rawName === 'string') finalName = rawName;
      else if (Array.isArray(rawName)) finalName = rawName[0];
      else if (typeof rawName === 'object' && rawName !== null) {
        finalName = rawName.en || rawName.name || Object.values(rawName).find(v => typeof v === 'string') || `HIP ${id}`;
      } else finalName = `HIP ${id}`;

      if (!finalName.includes(id)) finalName = `${finalName} (${id})`;

      return {
        id: `HIP_${id}`,
        name: finalName,
        ra: f.geometry.coordinates[0].toFixed(2),
        dec: f.geometry.coordinates[1].toFixed(2),
        con: constellationNames[props.con] || "Unknown Space",
        mag: props.mag
      };
    });

    statusDot.classList.add('online');
    statusText.innerText = "Connected to Global Observatory (5,044 stars)";
    document.getElementById('named-count').innerText = registry.length;
    document.getElementById('btn-date').disabled = false;
    document.getElementById('btn-rand').disabled = false;
  } catch(e) { 
    console.error(e); 
    statusText.innerText = "Stars didn't appear";
  }
}

function renderBuilder() {
  document.getElementById("main-content").innerHTML = `
    <h1>✨Dedicate A Star✨</h1>
    <div class="card">
      <div class="status-badge"><div class="dot" id="status-dot"></div><span id="status-text">Connecting to Global Observatory...</span></div>
      <div class="input-row">
        <input type="number" id="dd" placeholder="DD" inputmode="numeric">
        <input type="number" id="mm" placeholder="MM" inputmode="numeric">
        <input type="number" id="yy" placeholder="YYYY" inputmode="numeric">
      </div>
      <div class="btn-row">
        <button id="btn-date" class="btn-main" onclick="selectStar('date')" disabled>Find Star 🔍</button>
        <button id="btn-rand" class="btn-ghost" onclick="selectStar('rand')" disabled>Adopt a Star 💫</button>
      </div>
    </div>
    <div id="display-area"></div>
  `;
  loadData();
}

function selectStar(mode) {
  if(mode === 'date') {
    const d=document.getElementById('dd').value, m=document.getElementById('mm').value, y=document.getElementById('yy').value;
    if(!d || !m || !y) return alert("Fill all fields");
    currentStar = stars[Math.abs(new Date(y, m-1, d).getTime()) % stars.length];
  } else {
    currentStar = stars[Math.floor(Math.random()*stars.length)];
  }
  
  const claim = globalRegistry[currentStar.id];
  let html = `
    <div class="card">
      <div class="star-name">${currentStar.name}</div>
      <div class="data-grid">
        <div class="data-item"><div class="label">Constellation</div><div class="val">${currentStar.con}</div></div>
        <div class="data-item"><div class="label">Magnitude</div><div class="val">${currentStar.mag}</div></div>
        <div class="data-item"><div class="label">RA</div><div class="val">${currentStar.ra}°</div></div>
        <div class="data-item"><div class="label">DEC</div><div class="val">${currentStar.dec}°</div></div>
      </div>
  `;

  if(claim) {
    html += `<p style="text-align:center; margin-top:20px; color:#94a3b8; font-size:0.8rem">This Star is already owned by <b>${claim.RecipientName}</b></p></div>`;
  } else {
    html += `
      <div style="margin-top:20px">
        <input type="text" id="rec-name" placeholder="Dedicate To">
        <textarea id="rec-msg" placeholder="Something to say before sending this star?..."></textarea>
        <button id="sub-btn" class="btn-primary" onclick="submitClaim()">Claim this Star</button>
      </div></div><div id="link-area"></div>`;
  }
  document.getElementById('display-area').innerHTML = html;
}

async function submitClaim() {
  const name = document.getElementById('rec-name').value;
  const msg = document.getElementById('rec-msg').value;
  if(!name) return alert("Enter a name");
  const btn = document.getElementById('sub-btn');
  btn.disabled = true; btn.innerText = "Transmitting...";
  const linkId = "L_" + Date.now().toString(36);
  const data = { StarID: currentStar.id, RecipientName: name, Message: msg };

  try {
    await fetch(GOOGLE_APP_URL, { method: 'POST', body: JSON.stringify(data), headers: { 'Content-Type': 'text/plain' }});
    localStorage.setItem(linkId, JSON.stringify({star: currentStar, name, msg}));
    const link = window.location.href.split('?')[0] + "?id=" + linkId;
    document.getElementById('link-area').innerHTML = `<div class="card" style="border-color:var(--primary)">
      <p style="font-size:0.8rem; margin-bottom:10px">Link Created:</p>
      <a href="${link}" style="color:var(--primary); font-size:0.8rem; word-break:all">${link}</a>
    </div>`;
  } catch(e) { alert("Error claiming"); btn.disabled = false; btn.innerText = "Claim Star"; }
}

function init() {
  window.addEventListener('resize', initBackground);
  initBackground();
  animate();
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id');
  if(id) {
    const d = JSON.parse(localStorage.getItem(id));
    if(d) {
      document.getElementById("main-content").innerHTML = `
        <h1>Celestial</h1>
        <div class="card" style="text-align:center">
          <p class="label">For</p><h2 style="margin-bottom:20px">${d.name}</h2>
          <div class="star-name">${d.star.name}</div>
          <p style="margin-top:20px; font-style:italic">"${d.msg}"</p>
          <button class="btn-ghost" style="margin-top:20px" onclick="window.location.href=window.location.pathname">Observatory</button>
        </div>`;
      return;
    }
  }
  renderBuilder();
}
init();
