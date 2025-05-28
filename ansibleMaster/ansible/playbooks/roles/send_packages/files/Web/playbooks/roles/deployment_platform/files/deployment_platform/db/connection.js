// Database connection module
const mysql = require('mysql2/promise');
const net = require('net');

// Database connection status
let isDatabaseConnected = false;
let systemStatus = {
    database: false,
    hosts: {
        '192.168.232.2': false,
        '192.168.234.2': false
    },
    lastChecked: null,
    error: null
};

// Create a connection pool without database for initial connection
const rootPool = mysql.createPool({
    host: '192.168.234.10',
    user: 'admin',
    password: 'network',
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
    connectTimeout: 10000,
    acquireTimeout: 10000
});

// Create a connection pool with database for normal operations
const pool = mysql.createPool({
    host: '192.168.234.10',
    user: 'admin',
    password: 'network',
    database: 'vm_deployment',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 10000, // Increase connection timeout to 10 seconds
    acquireTimeout: 10000  // Increase acquire timeout to 10 seconds
});

// Check if a host is reachable
async function checkHostConnectivity(host, port = 22) {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        const timeout = 5000; // 5 seconds timeout

        // Set timeout
        socket.setTimeout(timeout);

        // Handle connection
        socket.on('connect', () => {
            socket.destroy();
            resolve(true);
        });

        // Handle errors
        socket.on('error', () => {
            socket.destroy();
            resolve(false);
        });

        // Handle timeout
        socket.on('timeout', () => {
            socket.destroy();
            resolve(false);
        });

        // Try to connect
        socket.connect(port, host);
    });
}

// Test connection to the database server
async function testDatabaseConnection() {
    try {
        // Try a simple query to check if the database server is reachable
        await rootPool.query('SELECT 1');
        console.log('Database server connection successful');
        return true;
    } catch (error) {
        console.error('Error connecting to database server:', error);
        return false;
    }
}

// Create database if it doesn't exist
async function createDatabaseIfNotExists() {
    try {
        await rootPool.query('CREATE DATABASE IF NOT EXISTS vm_deployment');
        console.log('Database created or already exists');
        return true;
    } catch (error) {
        console.error('Error creating database:', error);
        return false;
    }
}

// Initialize the database and create all necessary tables
async function initDatabase() {
    try {
        // Test connection to the database server first
        const isConnected = await testDatabaseConnection();
        if (!isConnected) {
            throw new Error('Failed to connect to database server');
        }

        // Create database if it doesn't exist
        const dbCreated = await createDatabaseIfNotExists();
        if (!dbCreated) {
            throw new Error('Failed to create database');
        }

        // Test connection to the database
        await pool.query('SELECT 1');

        console.log('Setting up database schema...');
        
        // Check if vms table exists
        const [tables] = await pool.query("SHOW TABLES LIKE 'vms'");
        
        // Create VMs table if it doesn't exist
        if (tables.length === 0) {
            await pool.query(`
                CREATE TABLE vms (
                    id VARCHAR(36) PRIMARY KEY,
                    name VARCHAR(255) NOT NULL UNIQUE,
                    type VARCHAR(255) NOT NULL,
                    ram INT NOT NULL,
                    cores INT NOT NULL,
                    status VARCHAR(50) NOT NULL,
                    host VARCHAR(255) NOT NULL,
                    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    ip_address VARCHAR(15)
                )
            `);
            console.log('Created vms table');
        } else {
            console.log('vms table already exists');
        }

        // Check if ssh_keys table exists
        const [sshKeyTables] = await pool.query("SHOW TABLES LIKE 'ssh_keys'");
        
        // Create SSH keys table if it doesn't exist
        if (sshKeyTables.length === 0) {
            await pool.query(`
                CREATE TABLE ssh_keys (
                    id VARCHAR(36) PRIMARY KEY,
                    vm_id VARCHAR(36) NOT NULL,
                    username VARCHAR(50) NOT NULL,
                    private_key TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT fk_vm_id FOREIGN KEY (vm_id) 
                        REFERENCES vms(id) 
                        ON DELETE CASCADE
                )
            `);
            console.log('Created ssh_keys table');
        } else {
            console.log('ssh_keys table already exists');
        }

        // Check if the table exists and has expected columns
        
        console.log('Database schema created successfully');

        // Update system status
        systemStatus.database = true;
        systemStatus.error = null;
        systemStatus.lastChecked = new Date();

        // Check host connectivity
        for (const host of Object.keys(systemStatus.hosts)) {
            systemStatus.hosts[host] = await checkHostConnectivity(host);
        }

        isDatabaseConnected = true;
        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Error initializing database:', error);
        console.log('Database connection failed');

        // Update system status
        systemStatus.database = false;
        systemStatus.error = error.message;
        systemStatus.lastChecked = new Date();

        isDatabaseConnected = false;
    }
}

module.exports = {
    pool,
    isDatabaseConnected: () => isDatabaseConnected,
    systemStatus,
    initDatabase,
    checkHostConnectivity
};
