const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from current directory
app.use(express.static('.', {
    // Set proper MIME types for game assets
    setHeaders: (res, path) => {
        if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        } else if (path.endsWith('.png')) {
            res.setHeader('Content-Type', 'image/png');
        } else if (path.endsWith('.html')) {
            res.setHeader('Content-Type', 'text/html');
        }
    }
}));

// Handle any requests that don't match a file - serve index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🦋 Ephemera: Digital Garden is blooming on port ${PORT}`);
    console.log(`✨ Visit your butterfly garden at http://localhost:${PORT}`);
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