// Vagrant operations module
const fs = require('fs');
const path = require('path');
const {exec} = require('child_process');
const {v4: uuidv4} = require('uuid');
const {format} = require('date-fns');
const db = require('../../db');
const os = require('os');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');

if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, {recursive: true});
}

// Logger function
const logError = (vmId, error) => {
    try {
        const now = new Date();
        const dateStr = format(now, 'yyyy-MM-dd');
        const timeStr = format(now, 'HH:mm:ss');
        const logDir = path.join(logsDir, dateStr);

        // Create date directory if it doesn't exist
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, {recursive: true});
        }

        const logFile = path.join(logDir, `${vmId || 'system'}.log`);
        const logMessage = `[${timeStr}] ${error.stack || error}\n\n`;

        // Append to log file
        fs.appendFileSync(logFile, logMessage, 'utf8');
    } catch (logError) {
        console.error('Failed to write to log file:', logError);
    }
};
// Function to log Ansible output to file
const logAnsibleOutput = (vmId, message) => {
    try {
        if (!message || message.trim() === '') return;  // Skip empty messages

        const now = new Date();
        const dateStr = format(now, 'yyyy-MM-dd');
        const logDir = path.join(logsDir, 'ansible', dateStr);

        // Create directory if it doesn't exist
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, {recursive: true});
        }

        const logFile = path.join(logDir, `${vmId}.log`);

        // Ensure message ends with a newline
        const logMessage = message.endsWith('\n') ? message : `${message}\n`;

        // Append to log file with error handling
        try {
            fs.appendFileSync(logFile, logMessage, {encoding: 'utf8', flag: 'a'});
        } catch (writeError) {
            console.error('Failed to write to log file:', writeError);
            // Try to create the file if it doesn't exist
            if (writeError.code === 'ENOENT') {
                try {
                    fs.writeFileSync(logFile, logMessage, 'utf8');
                } catch (createError) {
                    console.error('Failed to create log file:', createError);
                }
            }
        }
    } catch (logError) {
        console.error('Error in logAnsibleOutput:', logError);
    }
};

// Custom execPromise with logging
const execPromise = (command, vmId = null) => {
    return new Promise((resolve, reject) => {
        const logStream = (data) => {
            if (!data || data.trim() === '') return;

            const timestamp = new Date().toISOString();
            const logMessage = `[${timestamp}] ${data}`.trim();

            // Log to console
            console.log(logMessage);

            // Log to file if vmId is provided
            if (vmId) {
                logAnsibleOutput(vmId, logMessage);
            }
        };

        // Log the command being executed
        logStream(`EXECUTING: ${command}`);

        const child = exec(command, {maxBuffer: 1024 * 1024 * 5}); // 5MB buffer

        // Handle process events
        child.on('error', (error) => {
            logStream(`Process error: ${error.message}`);
            reject(error);
        });

        child.on('exit', (code, signal) => {
            if (code === 0) {
                resolve('');
            } else {
                const error = new Error(`Command failed with code ${code}`);
                error.code = code;
                error.signal = signal;
                logStream(`Process exited with code ${code} and signal ${signal}`);
                reject(error);
            }
        });

        // Handle stdout and stderr
        if (child.stdout) {
            child.stdout.on('data', (data) => {
                const output = data.toString().trim();
                if (output) {
                    logStream(`STDOUT: ${output}`);
                }
            });
        }

        if (child.stderr) {
            child.stderr.on('data', (data) => {
                const output = data.toString().trim();
                if (output) {
                    logStream(`STDERR: ${output}`);
                }
            });
        }
    });
};

// Deployment status store
const deploymentStatus = {};

// Vagrant interface
const vagrant = {
    // Get deployment status for a VM
    getDeploymentStatus: function (vmId) {
        return deploymentStatus[vmId] || {status: 'Unknown', progress: 0, message: 'Status not available'};
    },

    // Update deployment status for a VM
    updateDeploymentStatus: function (vmId, status, progress, message) {
        deploymentStatus[vmId] = {status, progress, message, timestamp: new Date()};
        console.log(`Deployment status updated for VM ${vmId}: ${status} (${progress}%) - ${message}`);
        return deploymentStatus[vmId];
    },

    // Check if SSH keys exist for the current user
    checkSSHKeys: async function () {
        console.log('os.homedir():', os.homedir());
        const sshDir = path.join(os.homedir(), '.ssh');
        const privateKeyPath = path.join(sshDir, 'id_rsa');
        const publicKeyPath = path.join(sshDir, 'id_rsa.pub');

        try {
            // Check if SSH directory exists
            if (!fs.existsSync(sshDir)) {
                console.log('SSH directory does not exist, creating it...');
                fs.mkdirSync(sshDir, {recursive: true, mode: 0o700});
            }

            // Check if private and public keys exist
            const privateKeyExists = fs.existsSync(privateKeyPath);
            const publicKeyExists = fs.existsSync(publicKeyPath);

            // Save keys in .ssh directory
            if (!privateKeyExists) {
                fs.writeFileSync(privateKeyPath, 'private key content');
            }
            if (!publicKeyExists) {
                fs.writeFileSync(publicKeyPath, 'public key content');
            }

            return {
                exists: privateKeyExists && publicKeyExists, privateKeyPath, publicKeyPath
            };
        } catch (error) {
            console.error('Error checking SSH keys:', error);
            throw error;
        }
    },

    // Generate SSH keys if they don't exist
    generateSSHKeys: async function () {
        try {
            const {exists, privateKeyPath, publicKeyPath} = await this.checkSSHKeys();

            if (exists) {
                console.log('SSH keys already exist');
                return {privateKeyPath, publicKeyPath};
            }

            console.log('Generating SSH keys...');
            await execPromise(`ssh-keygen -t rsa -b 4096 -f "${privateKeyPath}" -N "" -C "etudis@deployment-server"`);

            // Set correct permissions
            fs.chmodSync(privateKeyPath, 0o600);
            fs.chmodSync(publicKeyPath, 0o644);

            console.log('SSH keys generated successfully');
            return {privateKeyPath, publicKeyPath};
        } catch (error) {
            console.error('Error generating SSH keys:', error);
            throw error;
        }
    },

    // Copy public key to target machine
    copyPublicKeyToHost: async function (host) {
        console.log(`[copyPublicKeyToHost] Starting process to copy key to ${host}`);
        const tempSshConfigPath = path.join(os.tmpdir(), `ssh_config_${Date.now()}`);
        const tempCmdPath = path.join(os.tmpdir(), `ssh_cmd_${Date.now()}.sh`);
        const password = "N3twork!"; // Hardcoded password

        console.log(`[copyPublicKeyToHost] Temp file paths:
            - SSH config: ${tempSshConfigPath}
            - Command script: ${tempCmdPath}`);

        try {
            // Verify SSH keys exist first
            console.log(`[copyPublicKeyToHost] Checking SSH keys...`);
            const {exists, publicKeyPath} = await this.checkSSHKeys();

            if (!exists) {
                console.log(`[copyPublicKeyToHost] SSH keys don't exist, generating new ones...`);
                await this.generateSSHKeys();
                console.log(`[copyPublicKeyToHost] SSH keys generated`);
            } else {
                console.log(`[copyPublicKeyToHost] Using existing SSH keys at ${publicKeyPath}`);
            }

            // Verify the file exists before reading
            if (!fs.existsSync(publicKeyPath)) {
                throw new Error(`Public key file does not exist at path: ${publicKeyPath}`);
            }

            console.log(`[copyPublicKeyToHost] Reading public key from ${publicKeyPath}`);
            const publicKey = fs.readFileSync(publicKeyPath, 'utf8');
            console.log(`[copyPublicKeyToHost] Public key loaded: ${publicKey.substring(0, 30)}...`);

            // Create temporary SSH config file
            console.log(`[copyPublicKeyToHost] Creating temporary SSH config file`);
            const sshConfig = `Host ${host}
              User etudis
              StrictHostKeyChecking no
              PreferredAuthentications password
              PubkeyAuthentication no
            `;
            fs.writeFileSync(tempSshConfigPath, sshConfig, {mode: 0o600});
            console.log(`[copyPublicKeyToHost] SSH config file created at ${tempSshConfigPath}`);

            // Create temporary command file
            console.log(`[copyPublicKeyToHost] Creating temporary command script`);
            const sshCmd = `#!/bin/bash
                mkdir -p ~/.ssh
                chmod 700 ~/.ssh
                echo '${publicKey}' >> ~/.ssh/authorized_keys
                chmod 600 ~/.ssh/authorized_keys
                `;
            fs.writeFileSync(tempCmdPath, sshCmd, {mode: 0o700});
            console.log(`[copyPublicKeyToHost] Command script created at ${tempCmdPath}`);

            // Execute SSH command using spawn
            const {spawn} = require('child_process');
            return new Promise((resolve, reject) => {
                console.log(`[copyPublicKeyToHost] Spawning SSH process with command: ssh -F ${tempSshConfigPath} etudis@${host} bash -s`);

                const sshProcess = spawn('ssh', ['-F', tempSshConfigPath, `etudis@${host}`, 'bash -s'], {
                    stdio: ['pipe', 'pipe', 'pipe'], shell: true // Add shell option for Windows
                });

                let stdoutData = '';
                let stderrData = '';

                sshProcess.stdout.on('data', (data) => {
                    stdoutData += data.toString();
                    console.log(`[copyPublicKeyToHost] SSH stdout: ${data}`);
                });

                sshProcess.stderr.on('data', (data) => {
                    stderrData += data.toString();
                    console.log(`[copyPublicKeyToHost] SSH stderr: ${data}`);

                    // Check for password prompt
                    if (data.toString().includes('password:')) {
                        console.log(`[copyPublicKeyToHost] Detected password prompt, sending password`);
                        sshProcess.stdin.write(`${password}\n`);
                    }
                });

                sshProcess.on('error', (error) => {
                    console.error(`[copyPublicKeyToHost] SSH process error: ${error.message}`);

                    // Clean up temporary files
                    cleanupFiles();

                    reject(new Error(`SSH process error: ${error.message}`));
                });

                sshProcess.on('close', (code) => {
                    console.log(`[copyPublicKeyToHost] SSH process exited with code: ${code}`);

                    // Clean up temporary files
                    cleanupFiles();

                    if (code === 0) {
                        console.log(`[copyPublicKeyToHost] Public key copied to ${host} successfully`);
                        resolve(true);
                    } else {
                        console.error(`[copyPublicKeyToHost] SSH failed with code ${code}`);
                        console.error(`[copyPublicKeyToHost] stdout: ${stdoutData}`);
                        console.error(`[copyPublicKeyToHost] stderr: ${stderrData}`);
                        reject(new Error(`SSH failed with code ${code}: ${stderrData}`));
                    }
                });

                // Read script content and send it to SSH stdin
                console.log(`[copyPublicKeyToHost] Reading command script content`);
                const scriptContent = fs.readFileSync(tempCmdPath, 'utf8');
                console.log(`[copyPublicKeyToHost] Sending script to SSH process`);
                sshProcess.stdin.write(scriptContent);
                sshProcess.stdin.end();

                // Function to clean up temporary files
                function cleanupFiles() {
                    console.log(`[copyPublicKeyToHost] Cleaning up temporary files`);
                    if (fs.existsSync(tempSshConfigPath)) {
                        console.log(`[copyPublicKeyToHost] Removing SSH config file: ${tempSshConfigPath}`);
                        fs.unlinkSync(tempSshConfigPath);
                    }
                    if (fs.existsSync(tempCmdPath)) {
                        console.log(`[copyPublicKeyToHost] Removing command script: ${tempCmdPath}`);
                        fs.unlinkSync(tempCmdPath);
                    }
                }
            });
        } catch (error) {
            console.error(`[copyPublicKeyToHost] Error copying public key to ${host}:`, error);

            // Clean up temporary files in case of error
            if (fs.existsSync(tempSshConfigPath)) {
                console.log(`[copyPublicKeyToHost] Removing SSH config file: ${tempSshConfigPath}`);
                fs.unlinkSync(tempSshConfigPath);
            }
            if (fs.existsSync(tempCmdPath)) {
                console.log(`[copyPublicKeyToHost] Removing command script: ${tempCmdPath}`);
                fs.unlinkSync(tempCmdPath);
            }
            throw error;
        }
    },

    // Ensure SSH key authentication is set up for a host
    ensureSSHKeyAuth: async function (host, vmId) {
        try {
            if (vmId) {
                this.updateDeploymentStatus(vmId, 'Preparing', 5, 'Setting up SSH key authentication');
            }

            // Check if we can connect using key authentication
            try {
                await execPromise(`ssh -o BatchMode=yes -o StrictHostKeyChecking=no -o ConnectTimeout=5 etudis@${host} "echo SSH key authentication successful"`);
                console.log(`SSH key authentication already set up for ${host}`);
                return true;
            } catch (error) {
                console.log(`SSH key authentication not set up for ${host}, setting it up...`);

                // Generate keys if they don't exist
                await this.generateSSHKeys();

                // Copy public key to host
                const success = await this.copyPublicKeyToHost(host);

                if (success) {
                    console.log(`SSH key authentication set up for ${host}`);
                    if (vmId) {
                        this.updateDeploymentStatus(vmId, 'Preparing', 10, 'SSH key authentication set up successfully');
                    }
                    return true;
                } else {
                    console.error(`Failed to set up SSH key authentication for ${host}`);
                    if (vmId) {
                        this.updateDeploymentStatus(vmId, 'Failed', 5, `Failed to set up SSH key authentication for ${host}`);
                    }
                    return false;
                }
            }
        } catch (error) {
            console.error(`Error ensuring SSH key authentication for ${host}:`, error);
            if (vmId) {
                this.updateDeploymentStatus(vmId, 'Failed', 5, `Error setting up SSH key authentication: ${error.message}`);
            }
            return false;
        }
    },

    // Get available Vagrantfiles
    getVagrantFiles: function () {
        return [{
            id: 'java',
            name: 'Java/Tomcat Server',
            path: './vagrantfiles/Java',
            host: '192.168.232.2',
            useAnsible: true,
            type: 'java'
        }, {
            id: 'lamp',
            name: 'LAMP Stack',
            path: './vagrantfiles/web',
            host: '192.168.232.2',
            useAnsible: true,
            type: 'lamp'
        }, {
            id: 'mariadb',
            name: 'MariaDB Database',
            path: './vagrantfiles/database',
            host: '192.168.234.2',
            dbType: 'mariadb',
            useAnsible: true,
            type: 'mariadb'
        }, {
            id: 'postgres',
            name: 'PostgreSQL Database',
            path: './vagrantfiles/database',
            host: '192.168.234.2',
            dbType: 'postgres',
            useAnsible: true,
            type: 'postgres'
        }];
    },

    // Get Vagrant file configuration by type
    getVagrantFileConfig: function (vmType) {
        const vagrantFiles = this.getVagrantFiles();
        // Try to find a matching config by type (case insensitive)
        const typeLower = vmType.toLowerCase();
        return vagrantFiles.find(file =>
            file.type === typeLower ||
            file.id === typeLower ||
            file.name.toLowerCase().includes(typeLower)
        );
    },

    // Deploy a VM using Ansible
    deployVM: async function (config, callback) {
        const {vmCount, vmRam, vmCores, vagrantFile} = config;

        // Find the Vagrantfile
        const vagrantFileConfig = this.getVagrantFiles().find(file => file.id === vagrantFile);
        if (!vagrantFileConfig) {
            return callback(new Error('Vagrantfile not found'));
        }

        // Check if the target host is accessible
        const systemStatus = db.getSystemStatus();
        if (!systemStatus.hosts[vagrantFileConfig.host]) {
            return callback(new Error(`Target host ${vagrantFileConfig.host} is not accessible. Cannot deploy VMs.`));
        }

        console.log(`Deploying ${vmCount} VMs with ${vmRam}MB RAM and ${vmCores} cores using ${vagrantFileConfig.name}`);

        try {
            const deployedVMs = [];

            for (let i = 0; i < vmCount; i++) {
                const vmId = uuidv4();
                const vmName = `vm-${vagrantFile}-${Date.now()}-${i + 1}`;
                const workDir = path.join(__dirname, '../../tmp', vmId);

                // Create a temporary directory
                fs.mkdirSync(workDir, {recursive: true});

                // Create a VM object
                const vm = {
                    id: vmId,
                    name: vmName,
                    type: vagrantFileConfig.name,
                    ram: vmRam,
                    cores: vmCores,
                    status: 'Deploying',
                    host: vagrantFileConfig.host,
                    created: new Date()
                    // IP address will be allocated by the database module
                };

                // Add to database
                await db.addVM(vm);
                deployedVMs.push(vm);

                // Deploy using Ansible
                await this.deployWithAnsible(vm, vagrantFileConfig, workDir);
            }

            callback(null, deployedVMs);
        } catch (error) {
            console.error('Error deploying VMs:', error);
            callback(error);
        }
    },


    // Deploy a VM using Ansible
    deployWithAnsible: async function (vm, vagrantFileConfig, workDir) {
        return new Promise(async (resolve, reject) => {
            try {
                // Initialize deployment status
                this.updateDeploymentStatus(vm.id, 'Preparing', 5, 'Creating directory structure');

                // Ensure SSH key authentication is set up for the target host
                const sshKeyAuthSetup = await this.ensureSSHKeyAuth(vm.host, vm.id);
                if (!sshKeyAuthSetup) {
                    throw new Error(`Failed to set up SSH key authentication for ${vm.host}`);
                }

                // Create ansible directory structure
                const ansibleDir = path.join(workDir, 'ansible');
                const variablesDir = path.join(ansibleDir, 'variables');
                const playbooksDir = path.join(ansibleDir, 'playbooks');
                const etudiantDir = path.join(ansibleDir, 'etudiant.ansible');

                fs.mkdirSync(variablesDir, {recursive: true});
                fs.mkdirSync(playbooksDir, {recursive: true});
                fs.mkdirSync(etudiantDir, {recursive: true});

                this.updateDeploymentStatus(vm.id, 'Preparing', 15, 'Copying Ansible playbooks');

                // Copy Ansible playbooks
                const sourcePlaybooksDir = path.join(vagrantFileConfig.path, 'playbooks');
                const sourceVariablesDir = path.join(vagrantFileConfig.path, 'variables');
                const sourceEtudiantDir = path.join(vagrantFileConfig.path, 'etudiant.ansible');

                // Copy playbooks
                fs.readdirSync(sourcePlaybooksDir).forEach(file => {
                    const sourcePath = path.join(sourcePlaybooksDir, file);
                    const destPath = path.join(playbooksDir, file);

                    if (fs.lstatSync(sourcePath).isDirectory()) {
                        this.copyFolderRecursiveSync(sourcePath, playbooksDir);
                    } else {
                        fs.copyFileSync(sourcePath, destPath);

                        // Mettre à jour le node.yml si c'est le bon fichier
                        if (file === 'node.yml') {
                            const remoteDir = `/home/etudis/ansible_${vm.id}`;
                            this.updateNodeYaml(destPath, remoteDir);
                        }
                    }
                });

                this.updateDeploymentStatus(vm.id, 'Preparing', 25, 'Copying Ansible variables');

                // Copy variables except inventory.ini which we'll create
                fs.readdirSync(sourceVariablesDir).forEach(file => {
                    if (file !== 'inventory.ini') {
                        const sourcePath = path.join(sourceVariablesDir, file);
                        const destPath = path.join(variablesDir, file);
                        fs.copyFileSync(sourcePath, destPath);
                    }
                });

                this.updateDeploymentStatus(vm.id, 'Preparing', 35, 'Creating inventory file');

                // Create inventory.ini with the VM's IP address
                const inventoryContent = `[web]\n${vm.ip_address}\n\n[all:vars]\nansible_user=vagrant\nansible_ssh_private_key_file=/home/etudis/.ssh/id_rsa\nansible_ssh_common_args='-o StrictHostKeyChecking=no'\n\n[localhost]\n127.0.0.1\n\n[localhost:vars]\nansible_user=etudis\nansible_connection=local\n`;
                fs.writeFileSync(path.join(variablesDir, 'inventory.ini'), inventoryContent);

                this.updateDeploymentStatus(vm.id, 'Preparing', 45, 'Copying Vagrant configuration');

                // Copy etudiant.ansible directory
                this.copyFolderRecursiveSync(sourceEtudiantDir, ansibleDir);

                this.updateDeploymentStatus(vm.id, 'Preparing', 55, 'Configuring Vagrantfile');

                // Modify the Vagrantfile to use the allocated IP and set RAM/CPU
                const vagrantFilePath = path.join(etudiantDir, 'Vagrantfile');
                let vagrantFileContent = fs.readFileSync(vagrantFilePath, 'utf8');

                // Update RAM and CPU
                vagrantFileContent = vagrantFileContent.replace(/v\.customize \["modifyvm", :id, "--memory", \d+]/, `v.customize ["modifyvm", :id, "--memory", ${vm.ram}]`);
                vagrantFileContent = vagrantFileContent.replace(/v\.customize \["modifyvm", :id, "--cpus", "\d+"]/, `v.customize ["modifyvm", :id, "--cpus", "${vm.cores}"]`);

                // Update IP address in the Vagrantfile
                // This is a bit tricky as the Vagrantfile uses a loop to create multiple VMs
                // We'll modify it to create just one VM with our allocated IP
                vagrantFileContent = vagrantFileContent.replace(/numNodes = \d+/, 'numNodes = 1');

                // Update the IP address pattern
                const ipPattern = /node\.vm\.network :public_network, bridge:"[^"]+", ip: ipAddrPrefix1 \+ \(num \+ 2\)\.to_s/;
                if (ipPattern.test(vagrantFileContent)) {
                    vagrantFileContent = vagrantFileContent.replace(ipPattern, `node.vm.network :public_network, bridge:"eno1", ip: "${vm.ip_address}"`);
                }

                // Update VM name in the Vagrantfile
                vagrantFileContent = this.updateVagrantfileVmNames(vagrantFileContent, vm.name);

                // Write the modified Vagrantfile
                fs.writeFileSync(vagrantFilePath, vagrantFileContent);

                this.updateDeploymentStatus(vm.id, 'Deploying', 65, 'Transferring files to target host');

                console.log(`Running Ansible playbook for VM ${vm.name} with IP ${vm.ip_address}`);
                // Instead of running locally, we'll run on the target machine using SSH
                // First, create a remote directory and copy the necessary files
                const remoteDir = `/home/etudis/ansible_${vm.id}`;

                try {
                    // Use SSH key authentication for all commands
                    // Create remote directory
                    this.updateDeploymentStatus(vm.id, 'Deploying', 70, 'Creating remote directory');
                    await execPromise(`ssh -o StrictHostKeyChecking=no etudis@${vm.host} "mkdir -p ${remoteDir}"`, vm.id);

                    // Copy files to remote host
                    this.updateDeploymentStatus(vm.id, 'Deploying', 75, 'Copying files to target host');
                    await execPromise(`scp -o StrictHostKeyChecking=no -r ${ansibleDir}/* etudis@${vm.host}:${remoteDir}/`, vm.id);

                    // Run Ansible playbook
                    this.updateDeploymentStatus(vm.id, 'Deploying', 85, 'Running Ansible playbook');
                    // Add -v (verbose) flag to get more detailed output from Ansible
                    await execPromise(
                        `ssh -o StrictHostKeyChecking=no etudis@${vm.host} ` +
                        `"cd ${remoteDir} && ANSIBLE_FORCE_COLOR=1 ansible-playbook -v -i variables/inventory.ini playbooks/node.yml"`,
                        vm.id
                    );

                    console.log(`VM ${vm.name} deployed successfully with Ansible`);
                    this.updateDeploymentStatus(vm.id, 'Completed', 100, 'VM deployed successfully');
                    await db.updateVMStatus(vm.id, 'Running');
                    resolve();
                } catch (error) {
                    logError(vm.id, error);
                    console.error(`Error deploying VM ${vm.name} with Ansible:`, error);
                    this.updateDeploymentStatus(vm.id, 'Failed', 85, `Failed to deploy VM: ${error.message}`);
                    await db.updateVMStatus(vm.id, 'Failed');
                    reject(error);
                }
            } catch (error) {
                logError(vm.id, error);
                console.error(`Error setting up Ansible deployment for VM ${vm.name}:`, error);
                this.updateDeploymentStatus(vm.id, 'Failed', 0, `Error: ${error.message}`);
                db.updateVMStatus(vm.id, 'Failed');
                reject(error);
            }
        });
    },

    // Update node.yml with correct paths
    updateNodeYaml: function (nodeYamlPath, remoteDir) {
        try {
            let content = fs.readFileSync(nodeYamlPath, 'utf8');
            // Mettre à jour le chemin du répertoire de travail
            content = content.replace(
                /chdir: \/home\/etudis\/Bureau\/etudiant\.ansible\//g,
                `chdir: ${remoteDir}/etudiant.ansible/`
            );
            content = content.replace(
                'include_tasks: ../../roles/users/tasks/store_ssh_keys.yml',
                `include_tasks: ${remoteDir}/playbooks/roles/users/tasks/store_ssh_keys.yml`
            );

            fs.writeFileSync(nodeYamlPath, content, 'utf8');
            return true;
        } catch (error) {
            console.error('Error updating node.yml:', error);
            return false;
        }
    },

    // Update VM names in Vagrantfile content
    updateVagrantfileVmNames: function (vagrantFileContent, vmName) {
        try {
            // Mettre à jour le nom de la VM principale
            let updatedContent = vagrantFileContent.replace(
                /v\.name\s*=\s*"[^"]*"/g,
                `v.name = "${vmName}"`
            );

            // Mettre à jour le hostname
            updatedContent = updatedContent.replace(
                /node\.vm\.host_name\s*=\s*[^\n]+/g,
                `node.vm.host_name = "${vmName}"`
            );

            return updatedContent;
        } catch (error) {
            console.error('Error updating Vagrantfile VM names:', error);
            return vagrantFileContent; // Return original content if error
        }
    },

    // Helper function to copy a folder recursively
    copyFolderRecursiveSync: function (source, target) {
        const targetFolder = path.join(target, path.basename(source));
        if (!fs.existsSync(targetFolder)) {
            fs.mkdirSync(targetFolder, {recursive: true});
        }

        if (fs.lstatSync(source).isDirectory()) {
            const files = fs.readdirSync(source);
            files.forEach(file => {
                const curSource = path.join(source, file);
                if (fs.lstatSync(curSource).isDirectory()) {
                    this.copyFolderRecursiveSync(curSource, targetFolder);
                } else {
                    const destPath = path.join(targetFolder, file);
                    fs.copyFileSync(curSource, destPath);

                    // Mettre à jour le node.yml si c'est le bon fichier
                    if (file === 'node.yml') {
                        const vmId = path.basename(path.dirname(path.dirname(targetFolder)));
                        const remoteDir = `/home/etudis/ansible_${vmId}`;
                        this.updateNodeYaml(destPath, remoteDir);
                    }
                }
            });
        }
    },

    // Destroy a VM using Ansible
    destroyVM: async function (vmId, callback) {
        console.log(`[destroyVM] ======= Starting destruction of VM with ID: ${vmId} =======`);

        // Ensure callback is a function
        const cb = typeof callback === 'function' ? callback : async (err, result) => {
            if (err) {
                console.error('[destroyVM] Error in callback:', err);
                console.error(err.stack);
            } else {
                console.log('[destroyVM] Callback called with result:', result);
            }
        };
        
        // Ensure db is available
        if (!db) {
            const error = new Error('Database not initialized');
            console.error('[destroyVM]', error.message);
            return cb(error);
        }

        try {
            // Validate VM ID
            if (!vmId || typeof vmId !== 'string') {
                const error = new Error(`Invalid VM ID: ${vmId}`);
                console.error('[destroyVM]', error.message);
                return cb(error);
            }

            console.log('[destroyVM] Valid VM ID format');
            // Find the VM in the database
            console.log('[destroyVM] Fetching VMs from database...');
            try {
                const vms = await db.getVMs();
                console.log(`[destroyVM] Successfully retrieved ${vms.length} VMs from database`);

                const vm = vms.find(vm => vm && vm.id === vmId);

                if (!vm) {
                    const error = new Error(`VM with ID ${vmId} not found in database`);
                    console.error(`[destroyVM] ${error.message}`);
                    return cb(error);
                }

                // Ensure vm has required properties
                if (!vm.host || !vm.name) {
                    const error = new Error(`VM with ID ${vmId} is missing required properties (host or name)`);
                    console.error(`[destroyVM] ${error.message}`, vm);
                    return cb(error);
                }

                console.log(`[destroyVM] Found VM: ${JSON.stringify(vm, null, 2)}`);

                // Initialize deployment status for destruction
                console.log('[destroyVM] Updating deployment status to "Destroying"...');
                this.updateDeploymentStatus(vmId, 'Destroying', 10, 'Starting VM destruction process');

                // Update VM status in database
                console.log('[destroyVM] Updating VM status in database to "Destroying"...');
                try {
                    await db.updateVMStatus(vmId, 'Destroying');
                    console.log('[destroyVM] Successfully updated VM status in database');
                } catch (dbError) {
                    console.error('[destroyVM] Error updating VM status in database:', dbError);
                    throw new Error(`Failed to update VM status: ${dbError.message}`);
                }

                // Find the VM's directory
                const workDir = path.join(__dirname, '../../tmp', vmId);
                console.log(`[destroyVM] Checking if work directory exists: ${workDir}`);

                // Check if the directory exists
                if (fs.existsSync(workDir)) {
                    console.log('[destroyVM] Work directory exists, proceeding with destruction');
                    this.updateDeploymentStatus(vmId, 'Destroying', 30, 'Found VM directory');

                    // For Ansible-deployed VMs
                    const ansibleDir = path.join(workDir, 'ansible');
                    const etudiantDir = path.join(ansibleDir, 'etudiant.ansible');
                    console.log(`[destroyVM] Ansible dir: ${ansibleDir}`);
                    console.log(`[destroyVM] Etudiant dir: ${etudiantDir}`);

                    if (fs.existsSync(etudiantDir)) {
                        console.log('[destroyVM] Ansible deployment detected, setting up SSH key authentication');
                        this.updateDeploymentStatus(vmId, 'Destroying', 40, 'Setting up SSH key authentication');

                        try {
                            // Ensure SSH key authentication is set up for the target host
                            console.log(`[destroyVM] Ensuring SSH key authentication for host: ${vm.host}`);
                            const sshKeyAuthSetup = await this.ensureSSHKeyAuth(vm.host, vmId);
                            if (!sshKeyAuthSetup) {
                                const error = new Error(`Failed to set up SSH key authentication for ${vm.host}`);
                                console.error(`[destroyVM] ${error.message}`);
                                throw error;
                            }
                            console.log('[destroyVM] SSH key authentication set up successfully');

                            this.updateDeploymentStatus(vmId, 'Destroying', 60, 'Connecting to target host');
                            console.log('[destroyVM] Connected to target host, preparing to destroy VMs');

                            // Instead of running locally, we'll run on the target machine using SSH
                            const remoteDir = `/home/etudis/ansible_${vm.id}`;
                            console.log(`[destroyVM] Remote directory: ${remoteDir}`);

                            this.updateDeploymentStatus(vmId, 'Destroying', 70, 'Running vagrant destroy command');
                            console.log('[destroyVM] Starting VM destruction process');

                            // Get list of VMs in the project group
                            this.updateDeploymentStatus(vmId, 'Destroying', 70, 'Finding project VMs');
                            console.log('[destroyVM] Looking for VMs in project group...');

                            // Get list of all VMs in the project group
                            const listVMsCmd = `ssh -o StrictHostKeyChecking=no etudis@${vm.host} "VBoxManage list vms -l | grep -A 1 '^Groups:.*/projet-CSS-S8-deployment/' | grep '^Name:' | cut -d':' -f2 | tr -d ' '"`;
                            console.log(`[destroyVM] Executing command: ${listVMsCmd}`);

                            const vmsListOutput = await execPromise(listVMsCmd, vmId);
                            const vmsList = vmsListOutput.trim().split('\n').filter(name => name.trim() !== '');
                            console.log(`[destroyVM] Found ${vmsList.length} VMs in project group:`, vmsList);

                            if (vmsList.length > 0) {
                                this.updateDeploymentStatus(vmId, 'Destroying', 75, `Stopping ${vmsList.length} project VMs`);
                                console.log(`[destroyVM] Stopping ${vmsList.length} VMs...`);

                                // Stop each VM in the project group
                                console.log(`[destroyVM] Stopping ${vmsList.length} VMs...`);
                                for (const vmName of vmsList) {
                                    try {
                                        console.log(`[destroyVM] Stopping VM: ${vmName}`);
                                        const stopCmd = `ssh -o StrictHostKeyChecking=no etudis@${vm.host} "VBoxManage controlvm '${vmName}' poweroff 2>/dev/null || true"`;
                                        console.log(`[destroyVM] Executing: ${stopCmd}`);
                                        const output = await execPromise(stopCmd, vmId);
                                        if (output) console.log(`[destroyVM] Stop output: ${output}`);
                                        console.log(`[destroyVM] Successfully stopped VM: ${vmName}`);
                                    } catch (e) {
                                        // Ignore errors if VM is already stopped
                                        console.log(`[destroyVM] Could not stop VM ${vmName}, it might be already stopped:`, e.message);
                                    }
                                }

                                // Unregister and delete VMs
                                this.updateDeploymentStatus(vmId, 'Destroying', 80, `Removing ${vmsList.length} project VMs`);
                                console.log(`[destroyVM] Unregistering and removing ${vmsList.length} VMs...`);
                                
                                for (const vmName of vmsList) {
                                    console.log(`[destroyVM] Processing VM: ${vmName}`);
                                    
                                    try {
                                        // Get VM info to find its files
                                        const vmInfoCmd = `ssh -o StrictHostKeyChecking=no etudis@${vm.host} "VBoxManage showvminfo '${vmName}' --machinereadable | grep '^CfgFile=' | cut -d'=' -f2 | tr -d '\"'"`;
                                        console.log(`[destroyVM] Getting VM info: ${vmInfoCmd}`);
                                        
                                        const cfgFile = (await execPromise(vmInfoCmd, vmId)).trim();
                                        const vmDir = path.dirname(cfgFile);
                                        console.log(`[destroyVM] VM config file: ${cfgFile}, VM directory: ${vmDir}`);

                                        // Unregister VM
                                        console.log(`[destroyVM] Unregistering VM: ${vmName}`);
                                        const unregisterCmd = `ssh -o StrictHostKeyChecking=no etudis@${vm.host} "VBoxManage unregistervm '${vmName}' --delete 2>/dev/null || true"`;
                                        console.log(`[destroyVM] Executing: ${unregisterCmd}`);
                                        const unregisterOutput = await execPromise(unregisterCmd, vmId);
                                        if (unregisterOutput) console.log(`[destroyVM] Unregister output: ${unregisterOutput}`);

                                        // Remove VM directory if it exists
                                        if (vmDir && vmDir !== '.') {
                                            console.log(`[destroyVM] Removing VM directory: ${vmDir}`);
                                            const rmCmd = `ssh -o StrictHostKeyChecking=no etudis@${vm.host} "rm -rf '${vmDir}' 2>/dev/null || true"`;
                                            console.log(`[destroyVM] Executing: ${rmCmd}`);
                                            const rmOutput = await execPromise(rmCmd, vmId);
                                            if (rmOutput) console.log(`[destroyVM] Remove output: ${rmOutput}`);
                                            console.log(`[destroyVM] Successfully removed directory: ${vmDir}`);
                                        } else {
                                            console.log(`[destroyVM] No valid directory to remove for VM: ${vmName}`);
                                        }
                                        
                                        console.log(`[destroyVM] Successfully processed VM: ${vmName}`);
                                    } catch (e) {
                                        console.error(`[destroyVM] Error removing VM ${vmName}:`, e);
                                        // Continue with next VM even if one fails
                                    }
                                }
                            } else {
                                console.log('[destroyVM] No project VMs found to remove');
                                this.updateDeploymentStatus(vmId, 'Destroying', 80, 'No project VMs found to remove');
                            }

                            // Run vagrant destroy in case there are any remaining resources
                            this.updateDeploymentStatus(vmId, 'Destroying', 85, 'Running vagrant destroy');
                            try {
                                const vagrantDestroyCmd = `ssh -o StrictHostKeyChecking=no etudis@${vm.host} "cd ${remoteDir}/etudiant.ansible && vagrant destroy -f || true"`;
                                console.log(`[destroyVM] Executing vagrant destroy: ${vagrantDestroyCmd}`);
                                const destroyOutput = await execPromise(vagrantDestroyCmd, vmId);
                                console.log(`[destroyVM] Vagrant destroy output: ${destroyOutput}`);
                            } catch (e) {
                                console.error('[destroyVM] Error during vagrant destroy:', e);
                                // Continue with cleanup even if vagrant destroy fails
                            }

                            // Clean up remote directory
                            this.updateDeploymentStatus(vmId, 'Destroying', 90, 'Cleaning up remote files');
                            try {
                                const cleanupCmd = `ssh -o StrictHostKeyChecking=no etudis@${vm.host} "rm -rf ${remoteDir} 2>/dev/null || true"`;
                                console.log(`[destroyVM] Cleaning up remote directory: ${cleanupCmd}`);
                                const cleanupOutput = await execPromise(cleanupCmd, vmId);
                                console.log(`[destroyVM] Cleanup output: ${cleanupOutput}`);
                            } catch (e) {
                                console.error(`[destroyVM] Error cleaning up remote directory:`, e);
                                // Continue with local cleanup even if remote cleanup fails
                            }

                            console.log(`[destroyVM] Ansible-deployed VM ${vm.name} destroyed successfully`);
                            this.updateDeploymentStatus(vmId, 'Destroying', 95, 'Final cleanup');

                            // Remove from database
                            try {
                                console.log(`[destroyVM] Removing VM ${vmId} from database`);
                                await db.removeVM(vmId);
                                console.log(`[destroyVM] Successfully removed VM ${vmId} from database`);
                            } catch (dbError) {
                                console.error(`[destroyVM] Error removing VM ${vmId} from database:`, dbError);
                                // Continue with local cleanup even if database removal fails
                            }

                            // Clean up the local directory
                            if (fs.existsSync(workDir)) {
                                console.log(`[destroyVM] Removing local directory: ${workDir}`);
                                try {
                                    fs.rmSync(workDir, {recursive: true, force: true});
                                    console.log(`[destroyVM] Successfully removed local directory: ${workDir}`);
                                } catch (fsError) {
                                    console.error(`[destroyVM] Error removing local directory ${workDir}:`, fsError);
                                }
                            } else {
                                console.log(`[destroyVM] Local directory does not exist: ${workDir}`);
                            }

                            this.updateDeploymentStatus(vmId, 'Completed', 100, 'VM and all related resources have been cleaned up');
                            console.log(`[destroyVM] VM ${vmId} destruction completed successfully`);
                            callback(null, {
                                success: true,
                                message: `VM ${vm.name} and all related resources have been destroyed`
                            });
                        } catch (error) {
                            const errorMsg = `Error destroying Ansible-deployed VM ${vm.name}: ${error.message}`;
                            console.error(`[destroyVM] ${errorMsg}`, error);
                            this.updateDeploymentStatus(vmId, 'Failed', 70, `Failed to destroy VM on target host: ${error.message}`);
                            try {
                                await db.updateVMStatus(vmId, 'Failed to destroy');
                                console.log(`[destroyVM] Updated VM ${vmId} status to 'Failed to destroy'`);
                            } catch (dbError) {
                                console.error(`[destroyVM] Error updating VM ${vmId} status:`, dbError);
                            }
                            callback(new Error(errorMsg));
                        }
                    } else {
                        console.warn(`[destroyVM] Ansible directory not found for VM ${vm.name}, removing from database`);
                        this.updateDeploymentStatus(vmId, 'Destroying', 80, 'Ansible directory not found, removing from database');

                        try {
                            await db.removeVM(vmId);
                            console.log(`[destroyVM] Removed VM ${vmId} from database`);
                            
                            if (fs.existsSync(workDir)) {
                                console.log(`[destroyVM] Removing local directory: ${workDir}`);
                                fs.rmdirSync(workDir, {recursive: true});
                                console.log(`[destroyVM] Removed local directory: ${workDir}`);
                            } else {
                                console.log(`[destroyVM] Local directory does not exist: ${workDir}`);
                            }

                            this.updateDeploymentStatus(vmId, 'Completed', 100, 'VM removed from database');
                            console.log(`[destroyVM] Successfully cleaned up VM ${vmId} (Ansible directory not found)`);
                            callback(null, {success: true, message: `VM ${vm.name} removed from database`});
                        } catch (cleanupError) {
                            const errorMsg = `Error cleaning up VM ${vmId} (Ansible directory not found): ${cleanupError.message}`;
                            console.error(`[destroyVM] ${errorMsg}`, cleanupError);
                            this.updateDeploymentStatus(vmId, 'Failed', 90, 'Error during cleanup');
                            callback(new Error(errorMsg));
                        }
                    }
                } else {
                    // If the directory doesn't exist, just remove from database
                    console.log(`[destroyVM] VM directory not found, removing VM ${vmId} from database`);
                    this.updateDeploymentStatus(vmId, 'Destroying', 80, 'VM directory not found, removing from database');

                    try {
                        await db.removeVM(vmId);
                        console.log(`[destroyVM] Successfully removed VM ${vmId} from database (no directory found)`);
                        this.updateDeploymentStatus(vmId, 'Completed', 100, 'VM removed from database');
                        callback(null, {success: true, message: `VM ${vm.name} removed from database`});
                    } catch (dbError) {
                        const errorMsg = `Error removing VM ${vmId} from database: ${dbError.message}`;
                        console.error(`[destroyVM] ${errorMsg}`, dbError);
                        this.updateDeploymentStatus(vmId, 'Failed', 90, 'Error removing from database');
                        callback(new Error(errorMsg));
                    }
                }
            } catch (error) {
                const errorMsg = `Error during VM destruction: ${error.message}`;
                console.error(`[destroyVM] ${errorMsg}`, error);
                this.updateDeploymentStatus(vmId, 'Failed', 0, `Error: ${error.message}`);
                
                try {
                    if (vmId) {
                        await db.updateVMStatus(vmId, 'Failed to destroy');
                        console.log(`[destroyVM] Updated VM ${vmId} status to 'Failed to destroy' after error`);
                    } else {
                        console.error('[destroyVM] Cannot update VM status: vmId is not defined');
                    }
                } catch (dbError) {
                    console.error(`[destroyVM] Error updating VM ${vmId || 'unknown'} status after error:`, dbError);
                }
                
                // Ensure we don't call callback multiple times
                if (typeof callback === 'function') {
                    callback(new Error(errorMsg));
                } else {
                    console.error('[destroyVM] Callback is not a function, cannot report error');
                }
            }
        } catch (error) {
            console.error('[destroyVM] Error during VM destruction:', error);
            
            // Update deployment status if vmId is available
            if (vmId) {
                this.updateDeploymentStatus(vmId, 'Failed', 0, `Error: ${error.message}`);
            } else {
                console.error('[destroyVM] Cannot update deployment status: vmId is not defined');
            }
            
            // Update VM status in database if vmId is available
            if (vmId) {
                try {
                    await db.updateVMStatus(vmId, 'Failed to destroy');
                    console.log(`[destroyVM] Updated VM ${vmId} status to 'Failed to destroy' after error`);
                } catch (dbError) {
                    console.error(`[destroyVM] Error updating VM ${vmId} status after error:`, dbError);
                }
            } else {
                console.error('[destroyVM] Cannot update VM status: vmId is not defined');
            }
            
            // Ensure we don't call callback multiple times and it's a function
            if (typeof callback === 'function') {
                callback(error);
            } else {
                console.error('[destroyVM] Callback is not a function, cannot report error');
                // If we can't call the callback, we should at least log the error
                throw error;
            }
        }
    }
};

// Export the vagrant interface
module.exports = vagrant;
