// Routes for static file serving
const fs = require('fs');
const path = require('path');

// MIME types for serving static files
const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif'
};

// Handle static file requests
function handleStaticFiles(req, res, pathname) {
    // If the path is '/' or empty, serve index.html
    if (pathname === '/' || pathname === '') {
        pathname = '/index.html';
    }

    // Get the file path
    const filePath = path.join(__dirname, '../../public', pathname);

    // Get the file extension
    const extname = path.extname(filePath);

    // Get the MIME type
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    // Read the file
    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                // File not found
                fs.readFile(path.join(__dirname, '../../public', '404.html'), (err, content) => {
                    res.writeHead(404, { 'Content-Type': 'text/html' });
                    res.end(content, 'utf-8');
                });
            } else {
                // Server error
                res.writeHead(500);
                res.end(`Server Error: ${err.code}`);
            }
        } else {
            // Success
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
}

module.exports = {
    handleStaticFiles
};