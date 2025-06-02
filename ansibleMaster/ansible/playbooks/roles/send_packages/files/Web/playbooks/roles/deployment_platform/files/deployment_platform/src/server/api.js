// API request handler
const db = require('../../db');
const vagrant = require('./vagrant');

// Handle API requests
function handleRequest(req, res, pathname) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle OPTIONS requests (for CORS)
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // Check for VM status endpoint with ID parameter
    if (pathname.startsWith('/api/vm/status/')) {
        const vmId = pathname.split('/').pop();
        handleVMStatus(req, res, vmId).then();
        return;
    }

    // Check for SSH keys endpoint with VM ID parameter
    if (pathname.startsWith('/api/ssh-keys/')) {
        const param = pathname.split('/').pop();
        if (param === 'students') {
            handleStudentSSHKeys(req, res).then();
        } else {
            handleSSHKeys(req, res, param).then();
        }
        return;
    }

    // Handle API endpoints
    switch (pathname) {
        case '/api/system-status':
            handleSystemStatus(req, res).then();
            break;
        case '/api/vagrantfiles':
            handleVagrantFiles(req, res);
            break;
        case '/api/vms':
            handleVMs(req, res);
            break;
        case '/api/vms/destroy':
            handleVMDestroy(req, res);
            break;
        case '/api/ssh-keys':
            handleSSHKeys(req, res).then();
            break;
        case '/api/export/student-ssh-keys':
            handleExportStudentSSHKeys(req, res).then();
            break;
        default:
            res.writeHead(404, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({error: 'API endpoint not found'}));
    }
}

// Handle system status endpoint
async function handleSystemStatus(req, res) {
    if (req.method === 'GET') {
        try {
            const status = await db.checkSystemStatus();
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify(status));
        } catch (error) {
            res.writeHead(500, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({error: 'Failed to check system status'}));
        }
    } else {
        res.writeHead(405, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({error: 'Method not allowed'}));
    }
}

// Handle vagrantfiles endpoint
function handleVagrantFiles(req, res) {
    if (req.method === 'GET') {
        const vagrantFiles = vagrant.getVagrantFiles();
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(vagrantFiles));
    } else {
        res.writeHead(405, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({error: 'Method not allowed'}));
    }
}

// Handle VMs endpoint
function handleVMs(req, res) {
    if (req.method === 'GET') {
        // Get all VMs
        db.getVMs()
            .then(vms => {
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(JSON.stringify(vms));
            })
            .catch(error => {
                console.error('Error getting VMs:', error);
                res.writeHead(500, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({error: 'Failed to get VMs'}));
            });
    } else if (req.method === 'POST') {
        // Deploy new VMs
        let body = '';

        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            try {
                const config = JSON.parse(body);
                vagrant.deployVM(config, (error, deployedVMs) => {
                    if (error) {
                        console.error('Error deploying VMs:', error);
                        res.writeHead(500, {'Content-Type': 'application/json'});
                        res.end(JSON.stringify({error: 'Failed to deploy VMs'}));
                    } else {
                        res.writeHead(200, {'Content-Type': 'application/json'});
                        res.end(JSON.stringify(deployedVMs));
                    }
                }).then();
            } catch (error) {
                console.error('Error parsing request body:', error);
                res.writeHead(400, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({error: 'Invalid request body'}));
            }
        });
    } else {
        res.writeHead(405, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({error: 'Method not allowed'}));
    }
}

// Handle VM destroy endpoint
function handleVMDestroy(req, res) {
    if (req.method === 'DELETE') {
        let body = '';

        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', async () => {
            try {
                console.log('Received destroy request with body:', body);
                let data;
                try {
                    data = JSON.parse(body);
                    console.log('Parsed request data:', data);
                } catch (parseError) {
                    console.error('Error parsing request body:', parseError);
                    res.writeHead(400, {'Content-Type': 'application/json'});
                    return res.end(JSON.stringify({error: 'Invalid JSON in request body'}));
                }
                
                const vmId = data.id || data.vmId; // Support both formats for backward compatibility
                console.log('Extracted VM ID:', vmId);
                
                if (!vmId) {
                    console.error('No VM ID provided in request');
                    res.writeHead(400, {'Content-Type': 'application/json'});
                    return res.end(JSON.stringify({error: 'VM ID is required', receivedData: data}));
                }
                
                console.log('Destroying VM with ID:', vmId);

                await vagrant.destroyVM(vmId, (error, result) => {
                    if (error) {
                        console.error('Error destroying VM:', error);
                        res.writeHead(500, {'Content-Type': 'application/json'});
                        res.end(JSON.stringify({error: 'Failed to destroy VM'}));
                    } else {
                        res.writeHead(200, {'Content-Type': 'application/json'});
                        res.end(JSON.stringify(result));
                    }
                });
            } catch (error) {
                console.error('Error parsing request body:', error);
                res.writeHead(400, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({error: 'Invalid request body'}));
            }
        });
    } else {
        res.writeHead(405, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({error: 'Method not allowed'}));
    }
}

// Handle SSH keys endpoint
async function handleSSHKeys(req, res, vmId = null) {
    try {
        if (req.method === 'GET') {
            if (vmId) {
                // Get SSH keys for a specific VM
                const keys = await db.getSSHKeys(vmId);
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(JSON.stringify(keys));
            } else {
                res.writeHead(400, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({error: 'VM ID is required'}));
            }
        } else if (req.method === 'POST') {
            // Add a new SSH key
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });

            req.on('end', async () => {
                try {
                    const {vmId: postVmId, username, privateKey} = JSON.parse(body);
                    if (!postVmId || !username || !privateKey) {
                        res.writeHead(400, {'Content-Type': 'application/json'});
                        res.end(JSON.stringify({error: 'vmId, username, and privateKey are required'}));
                        return;
                    }

                    const result = await db.addSSHKey(postVmId, username, privateKey);
                    res.writeHead(201, {'Content-Type': 'application/json'});
                    res.end(JSON.stringify({id: result.insertId, vmId: result.vmId, username}));
                } catch (error) {
                    console.error('Error adding SSH key:', error);
                    if (error.code === 'VM_NOT_FOUND') {
                        res.writeHead(404, {'Content-Type': 'application/json'});
                        res.end(JSON.stringify({error: error.message}));
                    } else if (error.code === 'ER_NO_REFERENCED_ROW_2') {
                        res.writeHead(400, {'Content-Type': 'application/json'});
                        res.end(JSON.stringify({error: 'Invalid VM ID: the specified VM does not exist'}));
                    } else {
                        res.writeHead(500, {'Content-Type': 'application/json'});
                        res.end(JSON.stringify({error: 'Failed to add SSH key', details: error.message}));
                    }
                }
            });
        } else if (req.method === 'DELETE' && vmId) {
            // Delete SSH keys for a VM
            const count = await db.deleteSSHKeys(vmId);
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({deletedCount: count}));
        } else {
            res.writeHead(405, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({error: 'Method not allowed'}));
        }
    } catch (error) {
        console.error('Error handling SSH keys:', error);
        res.writeHead(500, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({error: 'Internal server error', details: error.message}));
    }
}

// Handle VM status endpoint
async function handleVMStatus(req, res, vmId) {
    if (req.method === 'GET') {
        try {
            // Get deployment status from vagrant module
            const deploymentStatus = vagrant.getDeploymentStatus(vmId);
            
            // If the deployment status indicates the VM was destroyed, return that status
            if (deploymentStatus.status === 'Completed' && deploymentStatus.message && 
                (deploymentStatus.message.includes('destroyed') || 
                 deploymentStatus.message.includes('cleaned up'))) {
                res.writeHead(200, {'Content-Type': 'application/json'});
                return res.end(JSON.stringify({
                    ...deploymentStatus,
                    dbStatus: 'Destroyed',
                    status: 'Destroyed'
                }));
            }

            // Get VM status from database
            let dbStatus = 'Unknown';
            try {
                // Check if the database connection is available
                if (!db.pool) {
                    console.warn('Database connection not available');
                } else {
                    const [vms] = await db.pool.query('SELECT status FROM vms WHERE id = ?', [vmId]);
                    if (vms.length > 0) {
                        dbStatus = vms[0].status;
                    }
                }
            } catch (dbError) {
                console.error('Error getting VM status from database:', dbError);
                // Continue with deployment status if database query fails
            }
            
            // If we have a deployment status but no database status, use the deployment status
            if (dbStatus === 'Unknown' && deploymentStatus.status) {
                dbStatus = deploymentStatus.status;
            }
            
            // Combine deployment status with database status
            const status = {
                ...deploymentStatus,
                dbStatus: dbStatus,
                // If deployment is completed/failed, use database status as the main status
                status: ['Completed', 'Failed', 'Destroyed'].includes(deploymentStatus.status) ? dbStatus : deploymentStatus.status
            };
            
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify(status));
        } catch (error) {
            console.error('Error getting VM status:', error);
            res.writeHead(500, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({error: 'Failed to get VM status', details: error.message}));
        }
    } else {
        res.writeHead(405, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({error: 'Method not allowed'}));
    }
}

// Handle student SSH keys endpoint (JSON format)
async function handleStudentSSHKeys(req, res) {
    if (req.method === 'GET') {
        try {
            const sshKeys = await db.getAllStudentSSHKeys();
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify(sshKeys));
        } catch (error) {
            console.error('Error getting student SSH keys:', error);
            res.writeHead(500, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({error: 'Failed to get student SSH keys'}));
        }
    } else {
        res.writeHead(405, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({error: 'Method not allowed'}));
    }
}

// Handle export student SSH keys endpoint
async function handleExportStudentSSHKeys(req, res) {
    if (req.method === 'GET') {
        try {
            const sshKeys = await db.getAllStudentSSHKeys();

            // Format as CSV
            let csvContent = 'vm_ip,username,private_key\r\n';

            sshKeys.forEach(key => {
                const row = [
                    `"${key.ip_address}"`,
                    `"${key.username}"`,
                    `"${key.private_key.replace(/"/g, '""')}\n"`
                ];
                csvContent += row.join(',') + '\r\n';
            });

            // Set headers for file download
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=student_ssh_keys.csv');
            res.writeHead(200);
            res.end(csvContent);
        } catch (error) {
            console.error('Error exporting student SSH keys:', error);
            res.writeHead(500, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({error: 'Failed to export student SSH keys'}));
        }
    } else {
        res.writeHead(405, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({error: 'Method not allowed'}));
    }
}

module.exports = {
    handleRequest
};
