// Global variables
let systemStatus = {
    database: false,
    hosts: {},
    lastChecked: null,
    error: null
};

// Status polling variables
let activeOperationVmId = null;
let statusPollingInterval = null;

// DOM elements
let statusIndicator, statusMessage, vmForm, vagrantFileSelect, vmList, noVmsMessage, statusOverlay, statusTitle,
    progressBar, statusMessageDetail, statusPercentage;

// Initialize DOM elements
function initializeDOMElements() {
    statusIndicator = document.getElementById('status-indicator');
    statusMessage = document.getElementById('status-message');
    vmForm = document.getElementById('vm-form');
    vagrantFileSelect = document.getElementById('vagrant-file');
    vmList = document.getElementById('vm-list');
    noVmsMessage = document.getElementById('no-vms-message');
    statusOverlay = document.getElementById('status-overlay');
    statusTitle = document.getElementById('status-title');
    progressBar = document.getElementById('progress-bar');
    statusMessageDetail = document.getElementById('status-message-detail');
    statusPercentage = document.getElementById('status-percentage');
}

// Check if we're on the status page
const isStatusPage = window.location.pathname.includes('status.html');
const databaseStatus = document.getElementById('database-status');
const databaseMessage = document.getElementById('database-message');
const databaseError = document.getElementById('database-error');
const hostStatusContainer = document.getElementById('host-status-container');
const lastChecked = document.getElementById('last-checked');

// Initialize the application
window.addEventListener('load', () => {
    console.log('DOM and all resources loaded');

    // Initialize DOM elements
    initializeDOMElements();


    // Add event listener for VPN download button
    const downloadVpnBtn = document.getElementById('download-vpn-config');
    if (downloadVpnBtn) {
        downloadVpnBtn.addEventListener('click', downloadVpnConfig);
    }

    // Vérifier si nous sommes sur la page de statut
    const isStatusPage = window.location.pathname.includes('status.html');
    console.log('Is status page:', isStatusPage);

    // Ensure status overlay is hidden
    if (statusOverlay) {
        statusOverlay.classList.add('hidden');
        statusOverlay.style.display = 'none';
    }

    // Check system status
    checkSystemStatus().then();

    // If we're on the main page
    if (!isStatusPage) {
        console.log('Loading main page components');
        // Load Vagrantfiles
        loadVagrantFiles().then();

        // Load VMs
        loadVMs().then();

        // Add event listener for form submission
        if (vmForm) {
            vmForm.addEventListener('submit', deployVM);
        }
    } else {
        console.log('Loading status page components');
        // On status page, load VMs
        setTimeout(() => {
            console.log('Loading VMs for status page');
            loadVMs().then();
        }, 100);

        // Add event listener for refresh button
        const refreshStatusButton = document.getElementById('refresh-status');
        if (refreshStatusButton) {
            refreshStatusButton.addEventListener('click', () => {
                console.log('Refresh button clicked');
                checkSystemStatus().then();
                loadVMs().then();
            });
        }

        // Set up event listeners for select all/deselect all buttons
        const selectAllBtn = document.getElementById('select-all');
        const deselectAllBtn = document.getElementById('deselect-all');
        const destroySelectedBtn = document.getElementById('destroy-selected');
        const selectAllCheckbox = document.getElementById('select-all-checkbox');

        if (selectAllBtn) {
            selectAllBtn.addEventListener('click', () => toggleSelectAll(true));
        }

        if (deselectAllBtn) {
            deselectAllBtn.addEventListener('click', () => toggleSelectAll(false));
        }

        if (destroySelectedBtn) {
            destroySelectedBtn.addEventListener('click', destroySelectedVMs);
        }

        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', (e) => {
                toggleSelectAll(e.target.checked);
            });
        }

        // Update the destroy button state when checkboxes change
        document.addEventListener('change', (e) => {
            if (e.target.matches('.vm-checkbox')) {
                updateDestroyButtonState();
            }
        });
    }
});

// Show status overlay with initial message
function showStatusOverlay(title, message) {
    // Ensure DOM elements are initialized
    if (!statusTitle || !statusMessageDetail || !statusPercentage || !progressBar || !statusOverlay) {
        initializeDOMElements();
    }

    try {
        if (statusTitle) statusTitle.textContent = title;
        if (statusMessageDetail) statusMessageDetail.textContent = message;
        if (statusPercentage) statusPercentage.textContent = '0%';
        if (progressBar) {
            progressBar.style.width = '0%';
            progressBar.classList.remove('completed', 'failed');
        }

        if (statusOverlay) {
            statusOverlay.classList.remove('hidden');
            statusOverlay.style.display = 'flex';
        }
    } catch (error) {
        console.error('Error in showStatusOverlay:', error);
    }
}

// Hide status overlay
function hideStatusOverlay() {
    // Ensure DOM elements are initialized
    if (!statusOverlay) {
        initializeDOMElements();
    }

    try {
        if (statusOverlay) {
            statusOverlay.classList.add('hidden');
            // Use setTimeout to allow CSS transitions to complete
            setTimeout(() => {
                if (statusOverlay) {
                    statusOverlay.style.display = 'none';
                }
            }, 300); // Match this with the CSS transition duration
        }
    } catch (error) {
        console.error('Error in hideStatusOverlay:', error);
    }

    // Stop polling for status updates
    stopStatusPolling();
}

// Map status to user-friendly messages
const statusMessages = {
    'Preparing': 'Préparation du déploiement',
    'Deploying': 'Déploiement en cours',
    'Destroying': 'Suppression en cours',
    'Running': 'Machine virtuelle en cours d\'exécution',
    'Stopped': 'Machine virtuelle arrêtée',
    'Error': 'Erreur',
    'Completed': 'Terminé',
    'Failed': 'Échec'
};

// Map status to progress bar colors
const statusColors = {
    'Preparing': '#3498db',    // Blue
    'Deploying': '#2ecc71',   // Green
    'Destroying': '#e74c3c',  // Red
    'Running': '#2ecc71',     // Green
    'Stopped': '#f39c12',     // Orange
    'Error': '#e74c3c',       // Red
    'Completed': '#2ecc71',   // Green
    'Failed': '#e74c3c'       // Red
};

// Update VM status in the UI
function updateVMStatusInUI(vmId, status, message = '') {
    const vmCard = document.querySelector(`.vm-card[data-vm-id="${vmId}"]`);
    if (!vmCard) return;

    // Update status badge
    const statusBadge = vmCard.querySelector('.vm-status');
    if (statusBadge) {
        statusBadge.textContent = statusMessages[status] || status;
        statusBadge.className = `vm-status status-${status.toLowerCase()}`;
    }

    // Update last status message
    const statusMessage = vmCard.querySelector('.vm-status-message');
    if (statusMessage) {
        const timestamp = new Date().toLocaleTimeString();
        statusMessage.textContent = message ? `${message} [${timestamp}]` : '';
    }

    // Update action buttons based on status
    const deployBtn = vmCard.querySelector('.deploy-btn');
    const destroyBtn = vmCard.querySelector('.destroy-btn');

    if (deployBtn && destroyBtn) {
        // Disable both buttons during operations
        deployBtn.disabled = ['Preparing', 'Deploying', 'Destroying'].includes(status);
        destroyBtn.disabled = ['Preparing', 'Deploying', 'Destroying'].includes(status);

        // Show/hide buttons based on VM state
        if (['Running', 'Stopped', 'Error', 'Failed'].includes(status)) {
            deployBtn.style.display = status === 'Running' ? 'none' : 'inline-block';
            destroyBtn.style.display = 'inline-block';
        }
    }
}

// Update status display with new information
function updateStatusDisplay(status) {
    // Ensure DOM elements are initialized
    if (!statusPercentage || !progressBar || !statusMessageDetail || !statusTitle) {
        initializeDOMElements();
    }

    try {
        // Update progress bar
        const progress = status.progress || 0;
        if (statusPercentage) statusPercentage.textContent = `${progress}%`;
        if (progressBar) progressBar.style.width = `${progress}%`;

        // Update status message with timestamp if available
        const timestamp = status.timestamp ? new Date(status.timestamp).toLocaleTimeString() : '';
        const timestampText = timestamp ? ` [${timestamp}]` : '';
        if (statusMessageDetail) {
            statusMessageDetail.textContent = `${status.message || 'Aucun message'}${timestampText}`;
        }

        // Update title and progress bar color based on status
        const statusKey = status.status || 'Unknown';
        if (statusTitle) statusTitle.textContent = statusMessages[statusKey] || statusKey;

        // Reset all status classes
        if (progressBar) {
            progressBar.className = 'progress-bar';

            // Add appropriate status class
            if (statusKey === 'Completed' || statusKey === 'Destroyed') {
                progressBar.classList.add('completed');
                // Reload the page after a short delay to show the final state
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else if (statusKey === 'Failed') {
                progressBar.classList.add('failed');
                // Keep the error message visible for a while
                setTimeout(hideStatusOverlay, 5000);
            } else if (statusColors && statusColors[statusKey]) {
                // For in-progress states, set the color based on status
                progressBar.style.backgroundColor = statusColors[statusKey];
            } else if (progressBar) {
                // Default color if no specific color is defined
                progressBar.style.backgroundColor = '#3498db';
            }
        }


        // Update the VM card status if we have a VM ID and the status is final
        if (activeOperationVmId && ['Completed', 'Failed', 'Running', 'Stopped', 'Error', 'Destroyed'].includes(statusKey)) {
            updateVMStatusInUI(activeOperationVmId, statusKey, status.message);
        }
    } catch (error) {
        console.error('Error in updateStatusDisplay:', error);
    }
}

// Start polling for VM status updates
function startStatusPolling(vmId) {
    // Set the active VM ID
    activeOperationVmId = vmId;

    // Clear any existing interval
    if (statusPollingInterval) {
        clearInterval(statusPollingInterval);
    }

    // Immediately fetch status
    fetchVMStatus(vmId).then();

    // Set up polling interval (every 500ms for smoother progress updates)
    statusPollingInterval = setInterval(() => {
        fetchVMStatus(vmId).then();
    }, 500);
}

// Stop polling for status updates
function stopStatusPolling() {
    if (statusPollingInterval) {
        clearInterval(statusPollingInterval);
        statusPollingInterval = null;
    }
    activeOperationVmId = null;
}

// Fetch VM status from the server
async function fetchVMStatus(vmId) {
    try {
        const response = await fetch(`/api/vm/status/${vmId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch VM status');
        }

        const status = await response.json();
        updateStatusDisplay(status);

        // If the operation is complete, failed, or VM is destroyed, stop polling
        if (['Completed', 'Failed', 'Destroyed'].includes(status.status)) {
            stopStatusPolling();
        }
    } catch (error) {
        console.error('Error fetching VM status:', error);
        // If there's an error, update the status to show the error
        updateStatusDisplay({
            status: 'Error',
            progress: 0,
            message: 'Error fetching VM status: ' + error.message
        });
        stopStatusPolling();
    }
}

// Check system status
async function checkSystemStatus() {
    try {
        const response = await fetch('/api/system-status');
        systemStatus = await response.json();

        // Update status indicator
        updateSystemStatusIndicator();

        // If we're on the status page, update the detailed status
        if (isStatusPage) {
            updateDetailedStatus();
        }
    } catch (error) {
        console.error('Error checking system status:', error);
        systemStatus.database = false;
        systemStatus.error = 'Failed to connect to server';
        updateSystemStatusIndicator();
    }
}

// Update system status indicator
function updateSystemStatusIndicator() {
    if (statusIndicator && statusMessage) {
        const deployButton = document.getElementById('deploy-button');

        // Check if database is connected
        if (systemStatus.database) {
            statusIndicator.classList.remove('offline');
            statusIndicator.classList.add('online');

            // Check if all hosts are accessible
            const allHostsAccessible = Object.values(systemStatus.hosts).every(status => status === true);

            if (allHostsAccessible) {
                statusMessage.textContent = 'System is online';
                document.getElementById('system-status-banner').classList.remove('offline');
                document.getElementById('system-status-banner').classList.add('online');

                // Enable deploy button if it exists
                if (deployButton) {
                    deployButton.disabled = false;
                    deployButton.title = '';
                }
            } else {
                statusMessage.textContent = 'System is partially online: Some target hosts are not accessible';
                document.getElementById('system-status-banner').classList.remove('online');
                document.getElementById('system-status-banner').classList.add('offline');

                // Disable deploy button if it exists
                if (deployButton) {
                    deployButton.disabled = true;
                    deployButton.title = 'Cannot deploy VMs: Target hosts are not accessible';
                }
            }
        } else {
            statusIndicator.classList.remove('online');
            statusIndicator.classList.add('offline');
            statusMessage.textContent = 'System is offline: ' + (systemStatus.error || 'Unknown error');
            document.getElementById('system-status-banner').classList.remove('online');
            document.getElementById('system-status-banner').classList.add('offline');

            // Disable deploy button if it exists
            if (deployButton) {
                deployButton.disabled = true;
                deployButton.title = 'Cannot deploy VMs: System is offline';
            }
        }
    }
}

// Update detailed status (for status page)
function updateDetailedStatus() {
    if (databaseStatus && databaseMessage && databaseError) {
        if (systemStatus.database) {
            databaseStatus.classList.remove('offline');
            databaseStatus.classList.add('online');
            databaseMessage.textContent = 'Database is connected';
            databaseError.textContent = '';
        } else {
            databaseStatus.classList.remove('online');
            databaseStatus.classList.add('offline');
            databaseMessage.textContent = 'Database is disconnected';
            databaseError.textContent = systemStatus.error || 'Unknown error';
        }
    }

    if (hostStatusContainer) {
        hostStatusContainer.innerHTML = '';
        for (const [host, status] of Object.entries(systemStatus.hosts)) {
            const hostStatusElement = document.createElement('div');
            hostStatusElement.className = 'host-status';

            const hostStatusIndicator = document.createElement('div');
            hostStatusIndicator.className = `status-indicator ${status ? 'online' : 'offline'}`;

            const hostStatusText = document.createElement('p');
            hostStatusText.textContent = `${host}: ${status ? 'Reachable' : 'Unreachable'}`;

            hostStatusElement.appendChild(hostStatusIndicator);
            hostStatusElement.appendChild(hostStatusText);
            hostStatusContainer.appendChild(hostStatusElement);
        }
    }

    if (lastChecked) {
        if (systemStatus.lastChecked) {
            const date = new Date(systemStatus.lastChecked);
            lastChecked.textContent = date.toLocaleString();
        } else {
            lastChecked.textContent = 'Never';
        }
    }
}

// Load Vagrantfiles
async function loadVagrantFiles() {
    if (!vagrantFileSelect) return;

    try {
        const response = await fetch('/api/vagrantfiles');
        const vagrantFiles = await response.json();

        // Clear existing options
        vagrantFileSelect.innerHTML = '<option value="" disabled selected>Select VM Type</option>';

        // Add options for each Vagrantfile
        vagrantFiles.forEach(file => {
            const option = document.createElement('option');
            option.value = file.id;
            option.textContent = file.name;
            vagrantFileSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading Vagrantfiles:', error);
    }
}

// Load VMs
async function loadVMs() {
    console.log('=== loadVMs() called ===');

    // Ajouter un délai pour s'assurer que le DOM est prêt
    await new Promise(resolve => setTimeout(resolve, 100));

    console.log('Loading VMs...');

    // Vérifier si nous sommes sur la page de statut ou d'index
    const isStatusPage = window.location.pathname.includes('status.html');

    // Éléments pour la page de statut
    const vmTableBody = document.getElementById('vm-table-body');
    const noVMsMessage = isStatusPage ?
        document.getElementById('no-vms-message') :
        document.getElementById('no-vms-message');

    console.log('DOM Elements:', {
        isStatusPage,
        vmTableBody: !!vmTableBody,
        noVMsMessage: !!noVMsMessage
    });

    try {
        const response = await fetch('/api/vms');
        if (!response.ok) {
            throw new Error(`Failed to fetch VMs: ${response.status} ${response.statusText}`);
        }

        const vms = await response.json();

        if (isStatusPage) {
            // Logique pour la page de statut
            if (!vmTableBody || !noVMsMessage) {
                console.error('Required elements not found for status page');
                return;
            }

            // Vider le tableau
            vmTableBody.innerHTML = '';

            if (!vms || vms.length === 0) {
                noVMsMessage.classList.add('visible');
                const selectAllBtn = document.getElementById('select-all');
                const deselectAllBtn = document.getElementById('deselect-all');
                if (selectAllBtn) selectAllBtn.disabled = true;
                if (deselectAllBtn) deselectAllBtn.disabled = true;
                return;
            }

            // Cacher le message "Aucune VM"
            noVMsMessage.classList.remove('visible');

            // Trier les VMs par nom
            const sortedVMs = [...vms].sort((a, b) => (a.name || '').localeCompare(b.name || ''));

            // Ajouter les VMs au tableau
            sortedVMs.forEach(vm => {
                if (vm && vm.id) {
                    addVMToTable(vm);
                }
            });

            // Mettre à jour l'état du bouton de suppression
            updateDestroyButtonState();
        } else {
            // Logique pour la page d'accueil
            const vmList = document.getElementById('vm-list');
            const noVMsMsg = document.getElementById('no-vms-message');

            if (!vmList) {
                console.error('VM list element not found');
                return;
            }

            // Vider la liste
            vmList.innerHTML = '';

            if (!vms || vms.length === 0) {
                if (noVMsMsg) noVMsMsg.style.display = 'block';
                return;
            }

            // Cacher le message "Aucune VM"
            if (noVMsMsg) noVMsMsg.style.display = 'none';

            // Ajouter chaque VM à la liste
            vms.forEach(vm => {
                if (vm && vm.id) {
                    const vmElement = document.createElement('div');
                    vmElement.className = 'vm-card';

                    // Échapper les caractères spéciaux pour éviter les problèmes XSS
                    const escapeHtml = (unsafe) => {
                        return unsafe
                            .replace(/&/g, "&amp;")
                            .replace(/</g, "&lt;")
                            .replace(/>/g, "&gt;")
                            .replace(/"/g, "&quot;")
                            .replace(/'/g, "&#039;");
                    };

                    const vmName = escapeHtml(vm.name || 'Unnamed VM');
                    const status = escapeHtml(vm.status || 'unknown');
                    const ip = escapeHtml(vm.ip_address || 'N/A');
                    const type = escapeHtml(vm.type || 'N/A');
                    const statusClass = status.toLowerCase() === 'running' ? 'status-running' : 'status-stopped';

                    vmElement.innerHTML = `
                        <h3>${vmName}</h3>
                        <p>Status: <span class="status-badge ${statusClass}">${status}</span></p>
                        <p>IP: ${ip}</p>
                        <p>Type: ${type}</p>
                        <button class="button button-small" onclick="destroyVM('${vm.id}')">Destroy</button>
                    `;
                    vmList.appendChild(vmElement);
                }
            });
        }
    } catch (error) {
        console.error('Error loading VMs:', error);
        // Afficher un message d'erreur
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = 'Failed to load VMs. Please try again later.';
        document.body.prepend(errorDiv);
    }
}

// Track deployment status for multiple VMs
const deploymentStatus = {
    total: 0,
    completed: 0,
    failed: 0,
    inProgress: 0,
    vms: {}
};

// Update the deployment status display
function updateDeploymentStatus() {
    if (deploymentStatus.total === 0) return;

    const completed = deploymentStatus.completed + deploymentStatus.failed;
    const progress = Math.round((completed / deploymentStatus.total) * 100);

    updateStatusDisplay({
        status: 'Deploying',
        progress: progress,
        message: `Deploying VMs: ${completed} of ${deploymentStatus.total} (${deploymentStatus.failed} failed)`
    });

    // If all VMs are done, stop polling after a delay
    if (completed === deploymentStatus.total) {
        setTimeout(() => {
            if (deploymentStatus.failed > 0) {
                updateStatusDisplay({
                    status: 'Completed with errors',
                    progress: 100,
                    message: `Deployment completed with ${deploymentStatus.failed} failure(s)`
                });
            } else {
                updateStatusDisplay({
                    status: 'Completed',
                    progress: 100,
                    message: 'All VMs deployed successfully!'
                });
            }
            setTimeout(hideStatusOverlay, 3000);
        }, 1000);
    }
}

// Deploy multiple VMs with a single request
async function deployVM(event) {
    event.preventDefault();

    // Check if the deploy button is disabled (target hosts not accessible)
    const deployButton = document.getElementById('deploy-button');
    if (deployButton && deployButton.disabled) {
        alert(deployButton.title || 'Cannot deploy VMs: Target hosts are not accessible');
        return;
    }

    // Get form values
    const vagrantFile = vagrantFileSelect.value;
    const vmCount = parseInt(document.getElementById('vm-count').value, 10);
    const vmRam = document.getElementById('vm-ram').value;
    const vmCores = document.getElementById('vm-cores').value;

    // Validate form
    if (!vagrantFile) {
        alert('Please select a VM type');
        return;
    }

    if (vmCount < 1) {
        alert('Number of VMs must be at least 1');
        return;
    }

    // Initialize deployment status
    deploymentStatus.total = vmCount;
    deploymentStatus.completed = 0;
    deploymentStatus.failed = 0;
    deploymentStatus.inProgress = 0;
    deploymentStatus.vms = {};

    // Show status overlay with initial message
    showStatusOverlay('Preparing Deployment', `Preparing to deploy ${vmCount} VMs...`);

    try {
        // Check system status again to ensure hosts are still accessible
        await checkSystemStatus();

        // Verify all hosts are accessible
        const allHostsAccessible = Object.values(systemStatus.hosts).every(status => status === true);
        if (!allHostsAccessible) {
            throw new Error('Target hosts are not accessible. Cannot deploy VMs.');
        }

        // Update UI to show deployment in progress
        for (let i = 0; i < vmCount; i++) {
            const vmNumber = i + 1;
            deploymentStatus.vms[`vm${vmNumber}`] = 'pending';
        }
        deploymentStatus.inProgress = vmCount;
        updateDeploymentStatus();

        try {
            // Send a single request to deploy all VMs
            const response = await fetch('/api/vms', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    vagrantFile,
                    vmCount: vmCount,  // Send the total number of VMs to deploy
                    vmRam,
                    vmCores
                })
            });


            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to deploy VMs');
            }


            const deployedVMs = await response.json();

            // Update deployment status
            deploymentStatus.completed = deployedVMs.length;
            deploymentStatus.inProgress = 0;

            // Update individual VM statuses
            deployedVMs.forEach((vm, index) => {
                const vmNumber = index + 1;
                deploymentStatus.vms[`vm${vmNumber}`] = 'completed';

                // Start polling for status updates
                if (vm && vm.id) {
                    startStatusPolling(vm.id);
                }
            });

            // Reload VMs to show the new ones
            await loadVMs();

        } catch (error) {
            console.error('Error during bulk deployment:', error);
            deploymentStatus.failed = vmCount - (deploymentStatus.completed || 0);
            deploymentStatus.inProgress = 0;

            // Update UI to show failed status
            for (let i = 0; i < vmCount; i++) {
                const vmNumber = i + 1;
                if (deploymentStatus.vms[`vm${vmNumber}`] !== 'completed') {
                    deploymentStatus.vms[`vm${vmNumber}`] = 'failed';
                }
            }

            throw error; // Re-throw to be caught by the outer catch
        } finally {
            updateDeploymentStatus();
        }

    } catch (error) {
        console.error('Error in deployment process:', error);

        // Update status to show error
        updateStatusDisplay({
            status: 'Error',
            progress: 0,
            message: 'Error during deployment: ' + error.message
        });

        // Hide status overlay after a delay
        setTimeout(hideStatusOverlay, 5000);
    }
}

// Show a message with a specific type (success, error, warning, info)
function showMessage(message, type = 'info') {
    // Log to console based on message type
    switch (type) {
        case 'error':
            console.error('Error:', message);
            break;
        case 'warning':
            console.warn('Warning:', message);
            break;
        case 'success':
            console.log('Success:', message);
            break;
        default:
            console.log('Info:', message);
    }

    // Create message element
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message`;
    messageDiv.textContent = message;

    // Add to the top of the body
    document.body.prepend(messageDiv);

    // Remove after 5 seconds
    setTimeout(() => {
        messageDiv.classList.add('fade-out');
        // Remove from DOM after animation completes
        setTimeout(() => {
            messageDiv.remove();
        }, 300);
    }, 5000);
}

// Helper functions for common message types
function showError(message) {
    showMessage(message, 'error');
}

function showSuccess(message) {
    showMessage(message, 'success');
}

// Destroy a VM
async function destroyVM(vmId, showStatus = true, skipConfirmation = false) {
    if (!vmId) {
        console.error('No VM ID provided to destroyVM');
        showError('No VM ID provided');
        return;
    }

    // Skip confirmation if called from destroySelectedVMs or if explicitly told to skip
    if (!skipConfirmation) {
        showConfirmationDialog().then(async (confirmed) => {
            if (!confirmed) {
                console.log('User cancelled the destroy operation');
            }
        });
    }

    console.log('Destroying VM with ID:', vmId);

    if (showStatus) {
        showStatusOverlay('Destroying VM', 'Sending destroy request...');
        updateStatusDisplay({
            status: 'Destroying',
            progress: 10,
            message: 'Sending destroy request...'
        });
    }

    try {
        // Send request to destroy VM
        console.log('Sending DELETE request to /api/vms/destroy with VM ID:', vmId);
        const response = await fetch('/api/vms/destroy', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({id: vmId})
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to destroy VM');
        }

        console.log('VM destroyed successfully, removing from UI');

        // Remove the VM from the UI
        const row = document.querySelector(`tr[data-vm-id="${vmId}"]`);
        const detailsRow = document.getElementById(`vm-details-${vmId}`);
        const vmCard = document.getElementById(`vm-card-${vmId}`);

        if (row) row.remove();
        if (detailsRow) detailsRow.remove();
        if (vmCard) vmCard.remove();

        // Show success message
        const successMessage = 'VM supprimée avec succès';
        showSuccess(successMessage);

        if (showStatus) {
            updateStatusDisplay({
                status: 'Success',
                progress: 100,
                message: successMessage
            });
            setTimeout(hideStatusOverlay, 2000);
        }

        // Check if any VMs are left
        const remainingVMs = document.querySelectorAll('.vm-row, .vm-card').length;
        console.log('Remaining VMs:', remainingVMs);

        const noVMsMessage = document.getElementById('no-vms-message');
        if (noVMsMessage) {
            noVMsMessage.classList.toggle('visible', remainingVMs === 0);
        }

        const selectAllBtn = document.getElementById('select-all');
        const deselectAllBtn = document.getElementById('deselect-all');
        if (selectAllBtn) selectAllBtn.disabled = remainingVMs === 0;
        if (deselectAllBtn) deselectAllBtn.disabled = remainingVMs === 0;

    } catch (error) {
        console.error('Error destroying VM:', error);
        const errorMessage = `Failed to destroy VM: ${error.message || 'Unknown error'}`;

        if (showStatus) {
            updateStatusDisplay({
                status: 'Failed',
                progress: 0,
                message: errorMessage
            });
            setTimeout(hideStatusOverlay, 5000);
        } else {
            showError(errorMessage);
        }
    }
}

// Add a VM to the table
function addVMToTable(vm) {
    const tbody = document.getElementById('vm-table-body');
    const template = document.getElementById('vm-details-template');

    // Create main row
    const row = document.createElement('tr');
    row.className = 'vm-row';
    row.dataset.vmId = vm.id;

    // Create checkbox cell
    const checkboxCell = document.createElement('td');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'vm-checkbox';
    checkbox.dataset.vmId = vm.id;
    checkbox.addEventListener('change', updateDestroyButtonState);
    checkboxCell.appendChild(checkbox);

    // Create name cell
    const nameCell = document.createElement('td');
    nameCell.textContent = vm.name;
    nameCell.className = 'vm-name';

    // Create type cell
    const typeCell = document.createElement('td');
    typeCell.textContent = vm.type || 'N/A';

    // Create status cell with badge
    const statusCell = document.createElement('td');
    const statusBadge = document.createElement('span');
    statusBadge.className = `status-badge status-${vm.status ? vm.status.toLowerCase() : 'stopped'}`;
    statusBadge.textContent = vm.status || 'unknown';
    statusCell.appendChild(statusBadge);

    // Create IP cell
    const ipCell = document.createElement('td');
    ipCell.textContent = vm.ip_address || 'N/A';

    // Create host cell
    const hostCell = document.createElement('td');
    hostCell.textContent = vm.host || 'N/A';

    // Create actions cell
    const actionsCell = document.createElement('td');
    const detailsButton = document.createElement('button');
    detailsButton.className = 'button button-small';
    detailsButton.textContent = 'Details';
    detailsButton.addEventListener('click', () => toggleVMRowDetails(vm.id));
    actionsCell.appendChild(detailsButton);

    // Assemble the row
    row.append(checkboxCell, nameCell, typeCell, statusCell, ipCell, hostCell, actionsCell);
    tbody.appendChild(row);

    // Create details row
    const detailsRow = document.createElement('tr');
    detailsRow.className = 'vm-details-row hidden';
    detailsRow.id = `vm-details-${vm.id}`;
    const detailsCell = document.createElement('td');
    detailsCell.colSpan = 7;

    // Clone and populate the details template
    const detailsContent = template.content.cloneNode(true);
    const detailsContainer = detailsContent.querySelector('.vm-details-container');

    // Set VM details
    detailsContainer.querySelector('[data-detail="ram"]').textContent = vm.ram ? `${vm.ram} MB` : 'N/A';
    detailsContainer.querySelector('[data-detail="cores"]').textContent = vm.cores || 'N/A';
    detailsContainer.querySelector('[data-detail="created"]').textContent = vm.created ? new Date(vm.created).toLocaleString() : 'N/A';
    detailsContainer.querySelector('[data-detail="status"]').textContent = vm.status || 'unknown';

    // Set up action buttons
    const viewLogsBtn = detailsContainer.querySelector('[data-action="view-logs"]');
    viewLogsBtn.addEventListener('click', () => viewVMLogs(vm.id));

    const destroyBtn = detailsContainer.querySelector('[data-action="destroy"]');
    destroyBtn.addEventListener('click', () => destroyVM(vm.id, false));

    detailsCell.appendChild(detailsContent);
    detailsRow.appendChild(detailsCell);
    tbody.appendChild(detailsRow);
}

// Toggle VM details row
function toggleVMRowDetails(vmId) {
    const detailsRow = document.getElementById(`vm-details-${vmId}`);
    if (!detailsRow) return;

    detailsRow.classList.toggle('hidden');

    // Update button text
    const buttons = document.querySelectorAll(`tr[data-vm-id="${vmId}"] .button-small`);
    buttons.forEach(button => {
        if (button.textContent.trim() === 'Details') {
            button.textContent = 'Hide Details';
        } else if (button.textContent.trim() === 'Hide Details') {
            button.textContent = 'Details';
        }
    });
}

// Update the state of the destroy button based on selected VMs
function updateDestroyButtonState() {
    const checkboxes = document.querySelectorAll('.vm-checkbox:checked');
    const destroyButton = document.getElementById('destroy-selected');
    if (destroyButton) {
        destroyButton.disabled = checkboxes.length === 0;
    }
}

async function showConfirmationDialog() {
    // Use a custom confirmation dialog that matches our UI
    return await new Promise((resolve) => {
        const confirmDiv = document.createElement('div');
        confirmDiv.className = 'custom-confirm';
        confirmDiv.innerHTML = `
            <div class="confirm-content">
                <h3>Confirmer la suppression</h3>
                <p>Êtes-vous sûr de vouloir supprimer cette VM ? Cette action est irréversible.</p>
                <div class="confirm-buttons">
                    <button id="confirm-yes" class="btn btn-danger">Oui, supprimer</button>
                    <button id="confirm-no" class="btn btn-secondary">Annuler</button>
                </div>
            </div>
        `;

        document.body.appendChild(confirmDiv);

        // Handle button clicks
        document.getElementById('confirm-yes').onclick = () => {
            document.body.removeChild(confirmDiv);
            resolve(true);
        };

        document.getElementById('confirm-no').onclick = () => {
            document.body.removeChild(confirmDiv);
            resolve(false);
        };
    });
}

// Destroy selected VMs using batch API
async function destroySelectedVMs() {
    const checkboxes = document.querySelectorAll('.vm-checkbox:checked');
    if (checkboxes.length === 0) return;

    showConfirmationDialog().then(async (confirmed) => {
        if (!confirmed) {
            console.log('User cancelled the destroy operation');
        }
    });

    // Show status overlay
    showStatusOverlay('Destroying VMs', `Destroying ${checkboxes.length} VM(s)...`);
    updateStatusDisplay({
        status: 'Destroying',
        progress: 0,
        message: `Preparing to destroy ${checkboxes.length} VM(s)...`
    });

    const vmIds = Array.from(checkboxes).map(checkbox => checkbox.dataset.vmId);

    try {
        // Update status to show we're starting the batch operation
        updateStatusDisplay({
            status: 'Destroying',
            progress: 10,
            message: `Sending batch destroy request for ${vmIds.length} VM(s)...`
        });

        // Send batch destroy request
        const response = await fetch('/api/vms/destroy', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ids: vmIds})
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to destroy VMs');
        }

        // Handle partial success (207 status code)
        if (response.status === 207) {
            const {successCount = 0, errorCount = 0, successfulDestructions = [], failedDestructions = []} = result;

            console.log(`Batch destroy partially completed: ${successCount} succeeded, ${errorCount} failed`);

            // Update UI for successful destructions
            if (successfulDestructions.length > 0) {
                successfulDestructions.forEach(({vmId}) => {
                    const row = document.querySelector(`tr[data-vm-id="${vmId}"]`);
                    const detailsRow = document.getElementById(`vm-details-${vmId}`);
                    const vmCard = document.getElementById(`vm-card-${vmId}`);

                    if (row) row.remove();
                    if (detailsRow) detailsRow.remove();
                    if (vmCard) vmCard.remove();
                });
            }

            // Show appropriate message
            updateStatusDisplay({
                status: errorCount > 0 ? 'Completed with errors' : 'Success',
                progress: 100,
                message: `Destroyed ${successCount} VM(s) successfully${errorCount > 0 ? `, failed to destroy ${errorCount} VM(s)` : ''}`
            });

            if (errorCount > 0) {
                showError(`Failed to destroy ${errorCount} VM(s). Check the logs for details.`);
            }
        } else {
            // Complete success
            console.log(`Successfully destroyed ${vmIds.length} VMs`);

            // Remove all VMs from UI
            vmIds.forEach(vmId => {
                const row = document.querySelector(`tr[data-vm-id="${vmId}"]`);
                const detailsRow = document.getElementById(`vm-details-${vmId}`);
                const vmCard = document.getElementById(`vm-card-${vmId}`);

                if (row) row.remove();
                if (detailsRow) detailsRow.remove();
                if (vmCard) vmCard.remove();
            });

            updateStatusDisplay({
                status: 'Success',
                progress: 100,
                message: `Successfully destroyed ${vmIds.length} VM(s)`
            });
        }
    } catch (error) {
        console.error('Error in batch destroy:', error);
        updateStatusDisplay({
            status: 'Failed',
            progress: 0,
            message: error.message || 'Failed to destroy VMs'
        });
        showError(error.message || 'Failed to destroy VMs. Please try again.');
    } finally {
        // Refresh the VM list after a short delay
        setTimeout(async () => {
            hideStatusOverlay();
            await loadVMs();

            // Update UI elements that depend on VM count
            const noVMsMessage = document.getElementById('no-vms-message');
            const selectAllBtn = document.getElementById('select-all');
            const deselectAllBtn = document.getElementById('deselect-all');
            const remainingVMs = document.querySelectorAll('.vm-row, .vm-card').length;

            if (noVMsMessage) noVMsMessage.classList.toggle('visible', remainingVMs === 0);
            if (selectAllBtn) selectAllBtn.disabled = remainingVMs === 0;
            if (deselectAllBtn) deselectAllBtn.disabled = remainingVMs === 0;
        }, 2000);
    }
}

// Toggle select all VMs
function toggleSelectAll(selectAll) {
    const checkboxes = document.querySelectorAll('.vm-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = selectAll;
    });
    updateDestroyButtonState();
}

// View VM logs
function viewVMLogs(vmId) {
    // Implementation for viewing VM logs
    alert(`Viewing logs for VM ${vmId}`);
    // You can implement this function to show logs in a modal or new page
}

// Download VPN configuration
function downloadVpnConfig() {
    console.log('Downloading VPN configuration...');

    // Create a temporary link element
    const link = document.createElement('a');

    // Set the download attribute with a filename
    link.download = 'client.ovpn';

    // Set the href to the server endpoint that serves the VPN config
    // The server should handle authentication and file serving
    link.href = '/api/vpn-config';

    // Append the link to the body (required for Firefox)
    document.body.appendChild(link);

    // Trigger the download
    link.click();

    // Clean up
    document.body.removeChild(link);

    // Show success message
    showSuccess('Téléchargement de la configuration VPN démarré');
}
