/**
 * STELLAR COMPASS ENGINE - VINTAGE NAVIGATION V5 (GRAVITY CALIBRATED)
 * This version uses a simplified 0-180 mapping to ensure 'Up' is always skyward.
 */

async function locateStar(starData) {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        try {
            const permission = await DeviceOrientationEvent.requestPermission();
            if (permission !== 'granted') return alert("Permission Denied.");
        } catch (e) { console.error(e); }
    }

    const overlay = document.createElement('div');
    overlay.id = "compass-overlay";
    overlay.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:radial-gradient(circle, rgba(15, 23, 42, 0.98) 0%, #020617 100%); z-index:9999; display:flex; flex-direction:column; align-items:center; justify-content:center; color:#d4af37; font-family:serif; text-align:center; padding:20px;";
    
    overlay.innerHTML = `
        <div style="border: 1px solid rgba(212, 175, 55, 0.3); padding: 40px 20px; border-radius: 20px; background: rgba(255,255,255,0.02); max-width: 440px; width: 95%;">
            <p style="font-size:0.7rem; color:#94a3b8; letter-spacing:4px; margin-bottom:10px; text-transform:uppercase;">Celestial Navigation</p>
            <h2 style="font-size: 1.8rem; margin-bottom:5px; font-style: italic; color:#d4af37;">${starData.star.name}</h2>
            <p style="font-size:0.75rem; color:#64748b; margin-bottom:30px; font-family:monospace;">TARGET: RA ${starData.star.ra} / DEC ${starData.star.dec}</p>
            
            <div style="display:flex; align-items:center; justify-content:center; gap:25px; margin-top:10px;">
                <div style="width:25px; height:220px; border:1px solid rgba(212, 175, 55, 0.4); position:relative; background:rgba(212,175,55,0.05); border-radius: 4px;">
                   <div id="dec-indicator" style="width:100%; height:4px; background:#fff; position:absolute; bottom:0%; box-shadow: 0 0 10px #fff; transition: bottom 0.1s;"></div>
                   <div style="position:absolute; width:100%; height:1px; background:rgba(212,175,55,0.2); bottom:50%;"></div>
                   <span style="position:absolute; top:-22px; left:50%; transform:translateX(-50%); font-size:10px; color:#94a3b8;">SKY</span>
                   <span style="position:absolute; bottom:-22px; left:50%; transform:translateX(-50%); font-size:10px; color:#94a3b8;">EARTH</span>
                </div>

                <div id="compass-dial" style="width:220px; height:220px; border:4px double #d4af37; border-radius:50%; position:relative; background: rgba(212, 175, 55, 0.05);">
                    <div id="compass-needle" style="width:100%; height:100%; position:absolute; top:0; left:0; transition: transform 0.1s ease-out;">
                        <div style="width:0; height:0; border-left:12px solid transparent; border-right:12px solid transparent; border-bottom:80px solid #d4af37; position:absolute; top:20px; left:50%; transform:translateX(-50%);"></div>
                        <div style="width:0; height:0; border-left:12px solid transparent; border-right:12px solid transparent; border-top:80px solid rgba(212, 175, 55, 0.2); position:absolute; bottom:20px; left:50%; transform:translateX(-50%);"></div>
                    </div>
                </div>
            </div>

            <p id="compass-instruction" style="margin-top:45px; font-size:1rem; color:#f8fafc; font-style:italic; min-height: 3em;">Aligning instruments...</p>
            <button onclick="document.getElementById('compass-overlay').remove()" style="margin-top:30px; padding:12px 40px; border-radius:4px; border:1px solid #d4af37; background:none; color:#d4af37; text-transform:uppercase; letter-spacing:2px;">Exit Observatory</button>
        </div>
    `;
    document.body.appendChild(overlay);

    const needle = document.getElementById('compass-needle');
    const decBar = document.getElementById('dec-indicator');
    const instruction = document.getElementById('compass-instruction');

    window.addEventListener('deviceorientation', (event) => {
        let heading = event.webkitCompassHeading || (360 - event.alpha);
        
        // Beta is tilt (front to back). 
        // We normalize it so that pointing the top of the phone 
        // at the ceiling always results in a high bar percentage.
        let rawPitch = event.beta; 
        let normalizedPitch = Math.max(0, Math.min(180, rawPitch + 90));
        let barPercentage = (normalizedPitch / 180) * 100;

        if (heading !== null) {
            const targetRA = parseFloat(starData.star.ra);
            const targetDEC = parseFloat(starData.star.dec);
            
            // RA Logic
            const raDiff = (targetRA - heading + 360) % 360;
            needle.style.transform = `rotate(${raDiff}deg)`;

            // DEC Logic (Simplified mapping)
            decBar.style.bottom = `${barPercentage}%`;

            const raLocked = (raDiff < 15 || raDiff > 345);
            // Lock on if the bar is in the top half (skyward) and RA is correct
            if (raLocked && barPercentage > 60) {
                instruction.innerText = "⭐ STAR ACQUIRED ⭐\nLOOK DIRECTLY UP";
                instruction.style.color = "#d4af37";
            } else if (raLocked) {
                instruction.innerText = "Bearing Correct.\nNow tilt phone UP toward the SKY.";
                instruction.style.color = "#60a5fa";
            } else {
                instruction.innerText = "Rotate your device until the\ngolden needle points North.";
                instruction.style.color = "#f8fafc";
            }
        }
    }, true);
}