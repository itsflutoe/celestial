/**
 * CELESTIAL CERTIFICATE ENGINE - VINTAGE PREMIER CALIBRATED V3
 */
console.log("Recalibrated Vintage Engine V3 Loaded!");

async function createStarCertificate(data) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = 2400; 
    canvas.height = 1700;

    const bgImage = new Image();
    bgImage.src = 'cert_bg.jpg'; 

    bgImage.onload = () => {
        ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);

        // UPDATED COLORS
        const inkColor = '#2b2118';
        const goldAccent = '#c6a85a';
        const softInk = '#5a4632';
        const mutedGray = '#8b7355';

        ctx.textAlign = "center";
        
        // 1. TOP HEADER
        ctx.fillStyle = softInk;
        ctx.font = "500 46px 'Times New Roman', serif";
        ctx.fillText("INTERNATIONAL STAR REGISTRY", 1200, 350); 
        
        // 2. MAIN TITLE
        ctx.fillStyle = inkColor;
        ctx.font = "italic 105px 'Playfair Display', serif"; 
        ctx.fillText("Certificate of Dedication", 1200, 500); 

        // 3. BODY TEXT
        ctx.fillStyle = softInk;
        ctx.font = "38px 'Georgia', serif";
        ctx.fillText("This official document confirms that the star identified as", 1200, 630);

        // 4. STAR CATALOG NAME
        ctx.fillStyle = inkColor;
        ctx.font = "bold 100px 'Georgia', serif";
        ctx.fillText(data.star.name, 1200, 760);

        ctx.fillStyle = softInk;
        ctx.font = "38px 'Georgia', serif";
        ctx.fillText("has been formally recorded in the archives for", 1200, 890);

        // 5. RECIPIENT NAME
        ctx.fillStyle = goldAccent;
        ctx.font = "italic 150px 'Playfair Display', serif";
        ctx.fillText(data.name, 1200, 1050);

        // ----------------------------------------------------------------------
        // --- TECHNICAL DATA BLOCK ---
        // ----------------------------------------------------------------------
        
        // Coordinates
        ctx.fillStyle = softInk;
        ctx.font = "bold 40px 'Georgia', serif";
        ctx.fillText(`COORDINATES: RA ${data.star.ra} / DEC ${data.star.dec}`, 1200, 1150);

        // Registry ID
        ctx.fillStyle = mutedGray;
        ctx.font = "28px 'Courier New', monospace";
        ctx.fillText(`OFFICIAL REGISTRY ID: ${data.star.id}`, 1200, 1210);

        // ----------------------------------------------------------------------
        // --- BOTTOM DATA FIELDS ---
        // ----------------------------------------------------------------------
        const dataY = 1300; 
        ctx.font = "bold 28px 'Georgia', serif";
        ctx.fillStyle = mutedGray; 
        
        const leftCol = 750;
        const rightCol = 1650;

        // Labels
        ctx.fillText("CONSTELLATION", leftCol, dataY);
        ctx.fillText("DATE OF ENTRY", rightCol, dataY);

        // Values
        ctx.fillStyle = inkColor;
        ctx.font = "bold 40px 'Georgia', serif";
        ctx.fillText(data.star.con.toUpperCase(), leftCol, dataY + 60);
        ctx.fillText(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), rightCol, dataY + 60);

        // 6. TRIGGER DOWNLOAD
        const link = document.createElement('a');
        link.download = `Celestial_Archive_${data.name.replace(/\s+/g, '_')}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    bgImage.onerror = () => {
        alert("Make sure 'cert_bg.jpg' is in the folder!");
    };
}