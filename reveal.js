/**
 * GALACTIC REVEAL ENGINE
 * Handles the cinematic travel to the dedicated star.
 */

function triggerReveal(starData) {
    // 1. Create the Loading/Travel Overlay
    const overlay = document.createElement('div');
    overlay.id = "reveal-overlay";
    overlay.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:#020617; z-index:10000; display:flex; flex-direction:column; align-items:center; justify-content:center; color:#d4af37; font-family:serif; overflow:hidden;";
    
    overlay.innerHTML = `
        <div id="warp-container" style="position:absolute; top:0; left:0; width:100%; height:100%;"></div>
        <div id="reveal-text" style="z-index:10001; text-align:center; transition: opacity 1s;">
            <p style="letter-spacing:5px; font-size:0.8rem; color:#94a3b8; margin-bottom:20px;">INCOMING TRANSMISSION</p>
            <h2 style="font-style:italic; font-size:2rem;">Searching the Archives...</h2>
        </div>
    `;
    document.body.appendChild(overlay);

    // 2. Start Warp Animation
    let speed = 20;
    const originalPoints = [...points]; // Copy current star positions
    
    const warpInterval = setInterval(() => {
        points.forEach(p => {
            p.y += speed; // Move stars down fast
            if (p.y > canvas.height) p.y = 0;
        });
        speed *= 0.98; // Gradually slow down

        if (speed < 0.5) {
            clearInterval(warpInterval);
            finishReveal(starData, overlay);
        }
    }, 30);
}

function finishReveal(starData, overlay) {
    const text = document.getElementById('reveal-text');
    text.style.opacity = '0';
    
    setTimeout(() => {
        text.innerHTML = `
            <p style="color:#94a3b8; font-size:0.8rem; letter-spacing:3px;">DESTINATION REACHED</p>
            <h1 style="font-size:3rem; margin:10px 0;">${starData.star.name}</h1>
            <p style="font-style:italic; color:#d4af37;">Dedicated to ${starData.name}</p>
            <button onclick="dismissReveal()" style="margin-top:30px; padding:12px 40px; border:1px solid #d4af37; background:none; color:#d4af37; cursor:pointer; text-transform:uppercase; letter-spacing:2px;">View Certificate</button>
        `;
        text.style.opacity = '1';
        
        // Add a "Super Glow" to the background stars
        ctx.shadowBlur = 20;
        ctx.shadowColor = "#60a5fa";
    }, 1000);
}

function dismissReveal() {
    const ov = document.getElementById('reveal-overlay');
    ov.style.opacity = '0';
    ov.style.transition = 'opacity 1.5s';
    setTimeout(() => {
        ov.remove();
        ctx.shadowBlur = 0; // Reset background glow
    }, 1500);
}