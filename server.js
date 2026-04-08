const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

// Get the dynamic URL from Railway environment variables
const getBaseUrl = () => {
    // Railway provides RAILWAY_STATIC_URL or RAILWAY_PUBLIC_DOMAIN
    if (process.env.RAILWAY_STATIC_URL) {
        return process.env.RAILWAY_STATIC_URL;
    }
    if (process.env.RAILWAY_PUBLIC_DOMAIN) {
        return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
    }
    // Fallback for local development
    return `http://localhost:${PORT}`;
};

const BASE_URL = getBaseUrl();

// Serve static files from current directory (excluding index.html)
app.use(express.static('.', {
    // Set proper MIME types for game assets and social media preview
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        } else if (filePath.endsWith('.png')) {
            res.setHeader('Content-Type', 'image/png');
            // Cache images for better social media crawling
            res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 day
        } else if (filePath.endsWith('.html')) {
            res.setHeader('Content-Type', 'text/html');
        }
    },
    // Don't serve index.html as static - we'll handle it dynamically
    index: false
}));

// Dynamic HTML serving with URL injection
app.get('/', (req, res) => {
    serveDynamicHTML(res);
});

// Handle any other routes - serve dynamic HTML
app.get('*', (req, res) => {
    // Check if it's a request for a static file that doesn't exist
    const filePath = path.join(__dirname, req.path);
    if (fs.existsSync(filePath) && !fs.statSync(filePath).isDirectory()) {
        // Let express static handle it
        return res.status(404).send('File not found');
    }
    
    // Otherwise serve the dynamic HTML (SPA behavior)
    serveDynamicHTML(res);
});

// Function to serve HTML with dynamic URL injection
function serveDynamicHTML(res) {
    try {
        const htmlPath = path.join(__dirname, 'index.html');
        let html = fs.readFileSync(htmlPath, 'utf8');
        
        // Replace placeholder URLs with actual BASE_URL
        html = html.replace(/https:\/\/ephemera-baghdad\.up\.railway\.app/g, BASE_URL);
        
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
    } catch (error) {
        console.error('Error serving HTML:', error);
        res.status(500).send('Error loading page');
    }
}

app.listen(PORT, () => {
    console.log(`🦋 Papilionem: Digital Garden is blooming on port ${PORT}`);
    console.log(`✨ Visit your butterfly garden at ${BASE_URL}`);
    console.log(`📱 Social media previews will use: ${BASE_URL}/preview.png`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🌅 Garden is going to sleep...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🌅 Garden is going to sleep...');
    process.exit(0);
});