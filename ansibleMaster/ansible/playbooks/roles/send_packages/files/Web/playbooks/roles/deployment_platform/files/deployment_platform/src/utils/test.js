/**
 * Test script for the VM Deployment Application
 * This script tests the server API endpoints
 */

const http = require('http');
const assert = require('assert');

// Configuration
const HOST = 'localhost';
const PORT = 3000;
const BASE_URL = `http://${HOST}:${PORT}`;

// Test data
const testDeployment = {
    vmCount: 1,
    vmRam: 1024,
    vmCores: 1,
    vagrantFile: 'java'
};

// Helper function to make HTTP requests
function request(options, data = null) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                try {
                    const parsedData = responseData ? JSON.parse(responseData) : {};
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        data: parsedData
                    });
                } catch (error) {
                    reject(new Error(`Failed to parse response: ${error.message}`));
                }
            });
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        if (data) {
            req.write(JSON.stringify(data));
        }
        
        req.end();
    });
}

// Test functions
async function testGetVagrantFiles() {
    console.log('Testing GET /api/vagrantfiles');
    
    const options = {
        hostname: HOST,
        port: PORT,
        path: '/api/vagrantfiles',
        method: 'GET'
    };
    
    try {
        const response = await request(options);
        
        assert.strictEqual(response.statusCode, 200, 'Status code should be 200');
        assert(Array.isArray(response.data), 'Response should be an array');
        assert(response.data.length > 0, 'Response array should not be empty');
        assert(response.data.some(file => file.id === 'java'), 'Response should include Java Vagrantfile');
        
        console.log('✓ GET /api/vagrantfiles test passed');
        return response.data;
    } catch (error) {
        console.error('✗ GET /api/vagrantfiles test failed:', error.message);
        throw error;
    }
}

async function testSystemStatus() {
    console.log('Testing GET /api/system-status');
    
    const options = {
        hostname: HOST,
        port: PORT,
        path: '/api/system-status',
        method: 'GET'
    };
    
    try {
        const response = await request(options);
        
        assert.strictEqual(response.statusCode, 200, 'Status code should be 200');
        assert(typeof response.data === 'object', 'Response should be an object');
        assert(typeof response.data.database === 'boolean', 'Response should include database status');
        
        console.log('✓ GET /api/system-status test passed');
        return response.data;
    } catch (error) {
        console.error('✗ GET /api/system-status test failed:', error.message);
        throw error;
    }
}

async function testDeployVMs() {
    console.log('Testing POST /api/vms');
    
    const options = {
        hostname: HOST,
        port: PORT,
        path: '/api/vms',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    };
    
    try {
        const response = await request(options, testDeployment);
        
        assert.strictEqual(response.statusCode, 200, 'Status code should be 200');
        assert(Array.isArray(response.data), 'Response should be an array');
        assert.strictEqual(response.data.length, testDeployment.vmCount, 'Response should contain the requested number of VMs');
        
        console.log('✓ POST /api/vms test passed');
        return response.data;
    } catch (error) {
        console.error('✗ POST /api/vms test failed:', error.message);
        throw error;
    }
}

async function testGetVMs() {
    console.log('Testing GET /api/vms');
    
    const options = {
        hostname: HOST,
        port: PORT,
        path: '/api/vms',
        method: 'GET'
    };
    
    try {
        const response = await request(options);
        
        assert.strictEqual(response.statusCode, 200, 'Status code should be 200');
        assert(Array.isArray(response.data), 'Response should be an array');
        
        console.log('✓ GET /api/vms test passed');
        return response.data;
    } catch (error) {
        console.error('✗ GET /api/vms test failed:', error.message);
        throw error;
    }
}

async function testDestroyVM(vmId) {
    console.log(`Testing POST /api/vm/destroy for VM ${vmId}`);
    
    const options = {
        hostname: HOST,
        port: PORT,
        path: '/api/vm/destroy',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    };
    
    try {
        const response = await request(options, { vmId });
        
        assert.strictEqual(response.statusCode, 200, 'Status code should be 200');
        assert(response.data.success, 'Response should indicate success');
        
        console.log('✓ POST /api/vm/destroy test passed');
        return response.data;
    } catch (error) {
        console.error('✗ POST /api/vm/destroy test failed:', error.message);
        throw error;
    }
}

// Run all tests
async function runTests() {
    console.log('Starting tests...');
    
    try {
        // Test system status
        await testSystemStatus();
        
        // Test getting Vagrantfiles
        await testGetVagrantFiles();
        
        // Test deploying VMs
        const deployedVMs = await testDeployVMs();
        console.log(`Deployed ${deployedVMs.length} VMs`);
        
        // Test getting VMs
        const vms = await testGetVMs();
        console.log(`Found ${vms.length} VMs`);
        
        // Test destroying VMs
        if (vms.length > 0) {
            const vmToDestroy = vms[0].id;
            await testDestroyVM(vmToDestroy);
            console.log(`Destroyed VM ${vmToDestroy}`);
        }
        
        console.log('All tests passed!');
    } catch (error) {
        console.error('Tests failed:', error);
        process.exit(1);
    }
}

// Check if server is running before starting tests
function checkServerStatus() {
    return new Promise((resolve, reject) => {
        const req = http.request({
            hostname: HOST,
            port: PORT,
            path: '/',
            method: 'HEAD'
        }, (res) => {
            if (res.statusCode === 200 || res.statusCode === 404) {
                resolve(true);
            } else {
                reject(new Error(`Server returned status code ${res.statusCode}`));
            }
        });
        
        req.on('error', () => {
            reject(new Error('Server is not running'));
        });
        
        req.end();
    });
}

// Main function
async function main() {
    try {
        console.log(`Checking if server is running at ${BASE_URL}...`);
        await checkServerStatus();
        console.log('Server is running. Starting tests...');
        await runTests();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        console.log('Please start the server with "npm start" before running tests.');
        process.exit(1);
    }
}

// Run the main function if this file is executed directly
if (require.main === module) {
    main();
}

// Export functions for use in other modules
module.exports = {
    testSystemStatus,
    testGetVagrantFiles,
    testDeployVMs,
    testGetVMs,
    testDestroyVM,
    runTests
};