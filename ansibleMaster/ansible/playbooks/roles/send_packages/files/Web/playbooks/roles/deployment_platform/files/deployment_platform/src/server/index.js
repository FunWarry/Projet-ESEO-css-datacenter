// Main server entry point
const http = require('http');
const url = require('url');
const db = require('../../db');
const routes = require('./routes');
const api = require('./api');

// Initialize the database
db.init().then((success) => {
    if (success) {
        console.log('Database initialized successfully');
    } else {
        console.log('Database connection failed - application will not function properly until database is available');

        // Set up periodic reconnection attempts
        setInterval(() => {
            db.reconnect().then(success => {
                if (success) {
                    console.log('Successfully reconnected to database');
                }
            });
        }, 30000); // Try to reconnect every 30 seconds
    }
}).catch(err => {
    console.error('Failed to initialize database:', err);
    console.log('Database connection failed - application will not function properly until database is available');
});

// Create the server
const server = http.createServer((req, res) => {
    // Parse the URL
    const parsedUrl = url.parse(req.url, true);
    let pathname = parsedUrl.pathname;

    // Handle API requests
    if (pathname.startsWith('/api/')) {
        return api.handleRequest(req, res, pathname);
    }

    // Handle static files
    routes.handleStaticFiles(req, res, pathname);
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Export the server for testing
module.exports = server;