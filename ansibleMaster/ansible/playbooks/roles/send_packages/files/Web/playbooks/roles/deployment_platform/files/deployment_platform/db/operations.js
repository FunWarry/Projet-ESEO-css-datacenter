// Database operations module
const dbConnection = require('./connection');
const {v4: uuidv4} = require('uuid');

// IP address ranges
const IP_RANGES = {
    WEB: {
        start: '192.168.232.10',
        end: '192.168.233.254'
    },
    DB: {
        start: '192.168.234.10',
        end: '192.168.235.254'
    }
};

// Convert IP to numeric value for comparison
function ipToNumber(ip) {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}

// Convert numeric value to IP
function numberToIp(num) {
    return [
        (num >>> 24) & 0xff,
        (num >>> 16) & 0xff,
        (num >>> 8) & 0xff,
        num & 0xff
    ].join('.');
}

// Database operations
const dbOperations = {
    // Allocate an IP address for a VM by finding the first available IP in the range
    allocateIP: async function (vmType) {
        if (!dbConnection.isDatabaseConnected()) {
            const error = new Error('Database not connected');
            console.error('Error allocating IP:', error);
            throw error;
        }

        try {
            // Determine IP range based on VM type
            let ipRange;
            if (vmType.includes('Database')) {
                ipRange = IP_RANGES.DB;
            } else {
                ipRange = IP_RANGES.WEB;
            }


            // Get all used IPs in the range
            const [rows] = await dbConnection.pool.query(
                'SELECT ip_address FROM vms WHERE ip_address IS NOT NULL AND ip_address BETWEEN ? AND ?',
                [ipRange.start, ipRange.end]
            );
            const usedIPs = new Set(rows.map(row => row.ip_address));

            // Convert range to numbers for comparison
            const startNum = ipToNumber(ipRange.start);
            const endNum = ipToNumber(ipRange.end);

            // Find the first available IP in the range
            for (let ipNum = startNum; ipNum <= endNum; ipNum++) {
                const currentIP = numberToIp(ipNum);
                if (!usedIPs.has(currentIP)) {
                    console.log(`Allocated IP ${currentIP} for VM type ${vmType}`);
                    return currentIP;
                }
            }


            // No available IPs in the range
            throw new Error(`Aucune adresse IP disponible dans la plage ${ipRange.start} - ${ipRange.end} pour le type de VM: ${vmType}`);
        } catch (error) {
            console.error('Erreur lors de l\'allocation d\'une adresse IP:', error);
            throw error;
        }
    },
    // Initialize the database
    init: async function () {
        try {
            await dbConnection.initDatabase();
            return dbConnection.isDatabaseConnected();
        } catch (error) {
            console.error('Failed to initialize database:', error);
            return false;
        }
    },

    // Get system status
    getSystemStatus: function () {
        return dbConnection.systemStatus;
    },

    // Check system status (database and host connectivity)
    checkSystemStatus: async function () {
        try {
            // Check database connectivity
            try {
                await dbConnection.pool.query('SELECT 1');
                dbConnection.systemStatus.database = true;
                dbConnection.systemStatus.error = null;
            } catch (error) {
                dbConnection.systemStatus.database = false;
                dbConnection.systemStatus.error = error.message;
                console.error('Database connectivity check failed:', error);
            }

            // Check host connectivity
            for (const host of Object.keys(dbConnection.systemStatus.hosts)) {
                dbConnection.systemStatus.hosts[host] = await dbConnection.checkHostConnectivity(host);
            }

            dbConnection.systemStatus.lastChecked = new Date();
            return dbConnection.systemStatus;
        } catch (error) {
            console.error('Error checking system status:', error);
            dbConnection.systemStatus.error = error.message;
            dbConnection.systemStatus.lastChecked = new Date();
            return dbConnection.systemStatus;
        }
    },

    // Add a VM to the database
    addVM: async function (vm) {
        if (!dbConnection.isDatabaseConnected()) {
            const error = new Error('Database not connected');
            console.error('Error adding VM:', error);
            throw error;
        }

        try {
            // Allocate an IP address if not provided
            if (!vm.ip_address) {
                try {
                    vm.ip_address = await this.allocateIP(vm.type);
                    console.log(`Allocated IP address ${vm.ip_address} for VM ${vm.name}`);
                } catch (ipError) {
                    console.error(`Failed to allocate IP address for VM ${vm.name}:`, ipError);
                    throw ipError;
                }
            }

            const [result] = await dbConnection.pool.query(
                'INSERT INTO vms (id, name, type, ram, cores, status, host, created, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [vm.id, vm.name, vm.type, vm.ram, vm.cores, vm.status, vm.host, new Date(), vm.ip_address]
            );
            console.log(`VM added to database: ${vm.name} with IP ${vm.ip_address}`);
            return vm;
        } catch (error) {
            console.error('Error adding VM:', error);
            throw error;
        }
    },

    // Get all VMs from the database
    getVMs: async function () {
        if (!dbConnection.isDatabaseConnected()) {
            const error = new Error('Database not connected');
            console.error('Error getting VMs:', error);
            throw error;
        }

        try {
            const [rows] = await dbConnection.pool.query('SELECT * FROM vms');
            return rows;
        } catch (error) {
            console.error('Error getting VMs:', error);
            throw error;
        }
    },

    // Remove a VM from the database
    removeVM: async function (vmId) {
        if (!dbConnection.isDatabaseConnected()) {
            const error = new Error('Database not connected');
            console.error('Error removing VM:', error);
            throw error;
        }

        try {
            const [result] = await dbConnection.pool.query('DELETE FROM vms WHERE id = ?', [vmId]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error removing VM:', error);
            throw error;
        }
    },

    // Update VM status
    updateVMStatus: async function (vmId, status) {
        if (!dbConnection.isDatabaseConnected()) {
            const error = new Error('Database not connected');
            console.error('Error updating VM status:', error);
            throw error;
        }

        try {
            const [result] = await dbConnection.pool.query('UPDATE vms SET status = ? WHERE id = ?', [status, vmId]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error updating VM status:', error);
            throw error;
        }
    },

    // Try to reconnect to the database
    reconnect: async function () {
        console.log('Attempting to reconnect to database...');
        try {
            await dbConnection.initDatabase();
            return dbConnection.isDatabaseConnected();
        } catch (error) {
            console.error('Failed to reconnect to database:', error);
            return false;
        }
    },

    // Add an SSH key for a VM user
    addSSHKey: async function(vmIdentifier, username, publicKey) {
        if (!dbConnection.isDatabaseConnected()) {
            const error = new Error('Database not connected');
            console.error('Error adding SSH key:', error);
            throw error;
        }

        try {
            let vmId = vmIdentifier;
            let query = 'SELECT id FROM vms WHERE id = ?';
            let params = [vmIdentifier];

            // Check if the identifier is an IP address (contains dots)
            if (vmIdentifier.includes('.')) {
                query = 'SELECT id FROM vms WHERE ip_address = ?';
            }

            // Check if the VM exists
            const [vmRows] = await dbConnection.pool.query(query, params);

            if (vmRows.length === 0) {
                const error = new Error(`VM with ID or IP ${vmIdentifier} not found`);
                error.code = 'VM_NOT_FOUND';
                throw error;
            }

            // Use the VM ID from the database
            vmId = vmRows[0].id;

            // Add the SSH key
            const [result] = await dbConnection.pool.query(
                'INSERT INTO ssh_keys (id, vm_id, username, private_key, created_at) VALUES (?, ?, ?, ?, ?)',
                [uuidv4(), vmId, username, publicKey, new Date()]
            );
            return { insertId: result.insertId, vmId };
        } catch (error) {
            console.error('Error adding SSH key:', error);
            throw error;
        }
    },

    // Get SSH keys for a VM
    getSSHKeys: async function(vmId) {
        if (!dbConnection.isDatabaseConnected()) {
            const error = new Error('Database not connected');
            console.error('Error getting SSH keys:', error);
            throw error;
        }

        try {
            const [rows] = await dbConnection.pool.query(
                'SELECT * FROM ssh_keys WHERE vm_id = ? ORDER BY username',
                [vmId]
            );
            return rows;
        } catch (error) {
            console.error('Error getting SSH keys:', error);
            throw error;
        }
    },

    // Delete SSH keys for a VM
    deleteSSHKeys: async function(vmId) {
        if (!dbConnection.isDatabaseConnected()) {
            const error = new Error('Database not connected');
            console.error('Error deleting SSH keys:', error);
            throw error;
        }

        try {
            const [result] = await dbConnection.pool.query(
                'DELETE FROM ssh_keys WHERE vm_id = ?',
                [vmId]
            );
            return result.affectedRows;
        } catch (error) {
            console.error('Error deleting SSH keys:', error);
            throw error;
        }
    },

    // Get all student SSH keys
    getAllStudentSSHKeys: async function() {
        if (!dbConnection.isDatabaseConnected()) {
            const error = new Error('Database not connected');
            console.error('Error getting student SSH keys:', error);
            throw error;
        }

        try {
            const [rows] = await dbConnection.pool.query(
                'SELECT ip_address, username, private_key FROM ssh_keys JOIN vms ON ssh_keys.vm_id = vms.id WHERE username LIKE ? ORDER BY vm_id, username',
                ['etudiant%']
            );
            return rows;
        } catch (error) {
            console.error('Error getting student SSH keys:', error);
            throw error;
        }
    }
};

module.exports = dbOperations;
