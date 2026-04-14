const GOOGLE_APP_URL = "https://script.google.com/macros/s/AKfycbwairy0b6eOScpxKCTgh4L9Bs_HOoBAIe9KZ8ZYJ5P6Cp4P8435Y0rXFg7mukbs4_HyjA/exec";

const constellationNames = {"And":"Andromeda","Ant":"Antlia","Aps":"Apus","Aqr":"Aquarius","Aql":"Aquila","Ara":"Ara","Ari":"Aries","Aur":"Auriga","Boo":"Boötes","Cae":"Caelum","Cam":"Camelopardalis","Cnc":"Cancer","CVn":"Canes Venatici","CMa":"Canis Major","CMi":"Canis Minor","Cap":"Capricornus","Car":"Carina","Cas":"Cassiopeia","Cen":"Centaurus","Cep":"Cepheus","Cet":"Cetus","Cha":"Chamaeleon","Cir":"Circinus","Col":"Columba","Com":"Coma Berenices","CrA":"Corona Australis","CrB":"Corona Borealis","Crv":"Corvus","Crt":"Crater","Cru":"Crux","Cyg":"Cygnus","Del":"Delphinus","Dor":"Dorado","Dra":"Draco","Equ":"Equuleus","Eri":"Eridanus","For":"Fornax","Gem":"Gemini","Gru":"Grus","Her":"Hercules","Hor":"Horologium","Hya":"Hydra","Hyi":"Hydrus","Ind":"Indus","Lac":"Lacerta","Leo":"Leo","LMi":"Leo Minor","Lep":"Lepus","Lib":"Libra","Lup":"Lupus","Lyn":"Lynx","Lyr":"Lyra","Men":"Mensa","Mic":"Microscopium","Monoceros":"Mon","Mus":"Musca","Nor":"Norma","Oct":"Octans","Oph":"Ophiuchus","Ori":"Orion","Pav":"Pavo","Peg":"Pegasus","Per":"Perseus","Phe":"Phoenix","Pic":"Pictor","Psc":"Pisces","PsA":"Piscis Austrinus","Pup":"Pupis","Pyx":"Pyxis","Ret":"Reticulum","Sge":"Sagitta","Sgr":"Sagittarius","Sco":"Scorpius","Scl":"Sculptor","Sct":"Scutum","Ser":"Serpens","Sex":"Sextans","Tau":"Taurus","Tel":"Telescopium","Tri":"Triangulum","TrA":"Triangulum Australe","Tuc":"Tucana","UMa":"Ursa Major","UMi":"Ursa Minor","Vel":"Vela","Vir":"Virgo","Vol":"Volans","Vul":"Vulpecula"};

let stars = [];
let globalRegistry = {};
let currentStar = null;

const stellarPalette = ["#9bb0ff", "#aabfff", "#cad7ff", "#f8f7ff", "#fff4ea", "#ffd2a1", "#ffcc6f"];

// --- FINAL VERSION: STAR FACT PAGE WITH CSS FALLBACK ---
async function showStarFactSheet(data) {
  const star = data.star;
  const hipId = star.id.replace('HIP_', '');
  const starHue = stellarPalette[Math.abs(Math.floor(star.mag)) % stellarPalette.length];

  const overlay = document.createElement('div');
  overlay.id = "fact-sheet-overlay";
  overlay.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(2, 6, 23, 0.98); z-index:20000; display:flex; align-items:center; justify-content:center; padding:20px; overflow-y:auto; backdrop-filter:blur(10px);";
  
  overlay.innerHTML = `
    <div class="card" style="border-top: 5px solid ${starHue}; max-width: 600px; width: 100%; animation: slideUp 0.4s ease-out;">
      <h2 style="color:${starHue}; text-align:center; margin-bottom:5px;">${star.name}</h2>
      <p style="text-align:center; font-size:0.7rem; color:#64748b; letter-spacing:2px; text-transform:uppercase; margin-bottom:15px;">Live Archive Deep-Link</p>
      
      <div id="aladin-lite-div" style="width:100%; height:300px; background:#000; border-radius:15px; border:1px solid rgba(255,255,255,0.1); overflow:hidden; margin-bottom:20px; display:flex; align-items:center; justify-content:center;">
          <div id="fallback-visual" style="width:80px; height:80px; background:${starHue}; border-radius:50%; box-shadow: 0 0 50px ${starHue}; display:none;"></div>
          <span id="loading-msg" style="color:#64748b; font-size:0.8rem;">Connecting to Telescope...</span>
      </div>
      
      <div class="data-grid" style="margin-bottom:20px;">
        <div class="data-item"><div class="label">NASA Surface Temp</div><div id="nasa-temp" class="val">Fetching...</div></div>
        <div class="data-item"><div class="label">Stellar Mass</div><div id="nasa-mass" class="val">Fetching...</div></div>
      </div>

      <div style="background:rgba(255,255,255,0.03); padding:15px; border-radius:12px; border-left:4px solid ${starHue};">
        <p style="font-size:0.9rem; line-height:1.6; color:#cbd5e1;">
          <b>Registry Note:</b> This celestial body is formally dedicated to <b>${data.name}</b>. 
          Its current magnitude is ${star.mag}, visible in the constellation of ${star.con}.
        </p>
      </div>

      <button class="btn-ghost" style="margin-top:25px; width:100%;" onclick="document.getElementById('fact-sheet-overlay').remove()">Return to Observatory</button>
    </div>
  `;
  document.body.appendChild(overlay);

  // Aladin Init with Safety Fallback
  setTimeout(() => {
    if (window.A && window.A.aladin) {
      window.A.aladin('#aladin-lite-div', {
        survey: "P/DSS2/color",
        fov: 0.15,
        target: `${star.ra} ${star.dec}`
      });
      document.getElementById('loading-msg').style.display = 'none';
    } else {
      document.getElementById('loading-msg').style.display = 'none';
      document.getElementById('fallback-visual').style.display = 'block';
    }
  }, 1000);

  // NASA Data Fetch
  try {
    const query = `select st_teff,st_mass from ps where hip_name='HIP ${hipId}'`;
    const url = `https://exoplanetarchive.ipac.caltech.edu/TAP/sync?query=${encodeURIComponent(query)}&format=json`;
    const response = await fetch(url);
    const results = await response.json();
    if (results && results.length > 0) {
      document.getElementById('nasa-temp').innerText = results[0].st_teff ? `${results[0].st_teff}K` : 'N/A';
      document.getElementById('nasa-mass').innerText = results[0].st_mass ? `${results[0].st_mass} M☉` : 'N/A';
    } else {
        document.getElementById('nasa-temp').innerText = 'N/A';
        document.getElementById('nasa-mass').innerText = 'N/A';
    }
  } catch (e) {
    document.getElementById('nasa-temp').innerText = 'Offline';
    document.getElementById('nasa-mass').innerText = 'Offline';
  }
}

// --- REST OF SCRIPT REMAINS UNCHANGED ---
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
    renderRecentLog(registry); 
    
    const starsData = await sResp.json();
    const names = await nResp.json();

    stars = starsData.features.map(f => {
      const id = f.id;
      const props = f.properties;
      let rawName = names[id] || names[String(id)] || `HIP ${id}`;
      let finalName = (typeof rawName === 'string') ? rawName : (Array.isArray(rawName) ? rawName[0] : (rawName.en || `HIP ${id}`));

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

    if (typeof init3DSpace === 'function') {
        init3DSpace(stars);
    }

    statusDot.classList.add('online');
    statusText.innerText = "Observatory Live: 5,044 Stars Tracked";
    updateCounter(); 
    document.getElementById('btn-date').disabled = false;
    document.getElementById('btn-rand').disabled = false;
  } catch(e) { 
    console.error(e); 
    if(statusText) statusText.innerText = "Connection lost to archives";
  }
}

function updateCounter() {
  const count = Object.keys(globalRegistry).length;
  const counterEl = document.getElementById('named-count');
  if(counterEl) counterEl.innerText = count.toLocaleString();
}

function renderBuilder() {
  document.getElementById("main-content").innerHTML = `
    <h1>✨Dedicate A Star✨</h1>
    <div class="card">
      <div class="status-badge"><div class="dot" id="status-dot"></div><span id="status-text">Connecting...</span></div>
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
    
    if(typeof calculateStellarDrift === 'function') calculateStellarDrift(parseInt(y));
    currentStar = stars[Math.abs(new Date(y, m-1, d).getTime()) % stars.length];
  } else {
    currentStar = stars[Math.floor(Math.random()*stars.length)];
  }
  
  selectStarFromUniverse(currentStar);
}

function selectStarFromUniverse(star) {
  currentStar = star;
  const lore = typeof getScientificLore === 'function' ? getScientificLore(star) : `Magnitude: ${star.mag}`;
  const starHue = stellarPalette[Math.abs(Math.floor(star.mag)) % stellarPalette.length];
  const claim = globalRegistry[star.id];

  let html = `
    <div class="card" style="border-top: 4px solid ${starHue}">
      <div class="star-name" style="text-shadow: 0 0 15px ${starHue}">${star.name}</div>
      <p style="font-size: 0.85rem; line-height: 1.6; margin: 15px 0; color: #cbd5e1;">${lore}</p>
      <div class="data-grid">
        <div class="data-item"><div class="label">Constellation</div><div class="val">${star.con}</div></div>
        <div class="data-item"><div class="label">Magnitude</div><div class="val" style="color:${starHue}">${star.mag}</div></div>
      </div>
  `;

  if(claim) {
    html += `<p style="text-align:center; margin-top:20px; color:#94a3b8; font-size:0.8rem">Already owned by <b>${claim.RecipientName}</b></p></div>`;
  } else {
    html += `
      <div style="margin-top:20px">
        <input type="text" id="rec-name" placeholder="Dedicate To">
        <textarea id="rec-msg" placeholder="Write a message..."></textarea>
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
    if(window.SpaceAudio) SpaceAudio.playSuccess();

    globalRegistry[currentStar.id] = { StarID: currentStar.id, RecipientName: name, Message: msg };
    updateCounter();
    renderRecentLog(Object.values(globalRegistry));

    const certData = {star: currentStar, name, msg};
    localStorage.setItem(linkId, JSON.stringify(certData));
    const link = window.location.href.split('?')[0] + "?id=" + linkId;
    
    document.getElementById('rec-name').style.display = 'none';
    document.getElementById('rec-msg').style.display = 'none';
    btn.style.display = 'none';

    window.currentStarData = certData;

    document.getElementById('link-area').innerHTML = `
      <div class="card" style="border-color:var(--primary); margin-top: 15px;">
        <p style="text-transform:uppercase; letter-spacing:1px; font-size:0.7rem;">Transmission Successful</p>
        <a href="${link}" target="_blank" style="color:var(--primary); font-size:0.8rem; word-break:all;">${link}</a>
        <button class="btn-certificate" onclick="createStarCertificate(window.currentStarData)">📜 Certificate</button>
        <button class="btn-ghost" style="margin-top: 10px; width: 100%;" onclick="showStarFactSheet(window.currentStarData)">📖 Star Facts</button>
      </div>`;
  } catch(e) { alert("Error"); btn.disabled = false; btn.innerText = "Claim Star"; }
}

function init() {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id');
  if(id) {
    const d = JSON.parse(localStorage.getItem(id));
    if(d) {
      window.currentStarData = d;
      document.getElementById("main-content").innerHTML = `
        <div class="card" style="text-align:center">
          <p class="label">For</p><h2>${d.name}</h2>
          <div class="star-name">${d.star.name}</div>
          <p style="font-style:italic">"${d.msg}"</p>
          <button class="btn-certificate" onclick="createStarCertificate(window.currentStarData)">📜 Certificate</button>
          <button class="btn-ghost" onclick="showStarFactSheet(window.currentStarData)">📖 Star Facts</button>
          <button class="btn-ghost" onclick="window.location.href=window.location.pathname">Home</button>
        </div>`;
      loadData();
      return;
    }
  }
  renderBuilder();
}

function renderRecentLog(registryArray) {
  const logContainer = document.getElementById('recent-log-container');
  if (!logContainer || registryArray.length === 0) return;
  const recentClaims = [...registryArray].reverse().slice(0, 10);
  let logHTML = `<div class="log-title">Named Celestial Bodies</div>`;
  recentClaims.forEach(claim => {
    logHTML += `<div class="log-card"><span>${claim.RecipientName}</span><span style="color: var(--primary); font-size: 0.75rem;">${claim.StarID.replace('HIP_', 'HIP ')}</span></div>`;
  });
  logContainer.innerHTML = logHTML;
}

init();