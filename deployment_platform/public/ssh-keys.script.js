// Fonction pour charger les clés SSH
async function loadSSHKeys() {
    const loadingMessage = document.getElementById('loading-message');
    const errorMessage = document.getElementById('error-message');
    const container = document.getElementById('ssh-keys-container');
    const tableBody = document.getElementById('ssh-keys-table-body');

// Afficher le message de chargement et masquer les erreurs
    loadingMessage.style.display = 'block';
    errorMessage.style.display = 'none';
    container.style.display = 'none';

    try {
        // Appeler l'API pour récupérer les clés SSH
        const response = await fetch('/api/ssh-keys/students');

        if (!response.ok) {
            throw new Error('Erreur lors du chargement des clés SSH');
        }

        const sshKeys = await response.json();

        // Vider le tableau
        tableBody.innerHTML = '';

        if (sshKeys.length === 0) {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = 3;
            cell.textContent = 'Aucune clé SSH disponible';
            cell.style.textAlign = 'center';
            row.appendChild(cell);
            tableBody.appendChild(row);
        } else {
            // Ajouter chaque clé au tableau
            sshKeys.forEach(key => {
                const row = document.createElement('tr');

                // Cellule pour l'adresse IP
                const ipCell = document.createElement('td');
                ipCell.textContent = key.ip_address || 'N/A';

                // Cellule pour le nom d'utilisateur
                const userCell = document.createElement('td');
                userCell.textContent = key.username || 'N/A';

                // Cellule pour la clé privée
                const keyCell = document.createElement('td');
                const keyPre = document.createElement('pre');
                keyPre.className = 'private-key';

                // Créer le contenu de la clé
                const keyContent = document.createElement('span');
                keyContent.textContent = key.private_key || 'Aucune clé disponible';
                keyPre.appendChild(keyContent);

                // Créer le bouton de copie
                const copyButton = document.createElement('button');
                copyButton.className = 'copy-button';
                copyButton.title = 'Copier la clé';
                copyButton.innerHTML = '📋';
                copyButton.onclick = async (e) => {
                    e.stopPropagation();
                    try {
                        await navigator.clipboard.writeText(key.private_key || '');
                        const originalText = copyButton.innerHTML;
                        const originalBg = copyButton.style.backgroundColor;
                        copyButton.innerHTML = '✓';
                        copyButton.style.backgroundColor = '#4CAF50';
                        setTimeout(() => {
                            copyButton.innerHTML = '📋';
                            copyButton.style.backgroundColor = originalBg;
                        }, 2000);
                    } catch (err) {
                        console.error('Erreur lors de la copie:', err);
                        // Fallback pour les navigateurs qui ne supportent pas clipboard API
                        const textArea = document.createElement('textarea');
                        textArea.value = key.private_key || '';
                        document.body.appendChild(textArea);
                        textArea.select();
                        try {
                            document.execCommand('copy');
                            copyButton.innerHTML = '✓';
                            copyButton.style.backgroundColor = '#4CAF50';
                            setTimeout(() => {
                                copyButton.innerHTML = '📋';
                                copyButton.style.backgroundColor = '';
                            }, 2000);
                        } catch (copyError) {
                            console.error('Fallback copy failed:', copyError);
                        }
                        document.body.removeChild(textArea);
                    }
                };

                // Ajouter le bouton à la clé
                keyPre.appendChild(copyButton);

                // Gestion du clic pour étendre/réduire
                keyPre.onclick = (e) => {
                    if (e.target === copyButton) return; // Ne pas étendre si on clique sur le bouton copier
                    keyPre.classList.toggle('expanded');
                };

                // Ajouter la cellule de clé à la ligne
                keyCell.appendChild(keyPre);

                // Ajouter toutes les cellules à la ligne
                row.appendChild(ipCell);
                row.appendChild(userCell);
                row.appendChild(keyCell);

                // Ajouter la ligne au tableau
                tableBody.appendChild(row);
            });
        }

        // Afficher le tableau
        container.style.display = 'block';

    } catch (error) {
        console.error('Erreur lors du chargement des clés SSH:', error);
        errorMessage.textContent = `Erreur: ${error.message}`;
        errorMessage.style.display = 'block';
        errorMessage.className = 'status-message error';
    } finally {
        // Cacher le message de chargement
        loadingMessage.style.display = 'none';
    }
}


// Fonction pour exporter les clés SSH au format CSV
function exportToCSV() {
    const rows = [];
    const headers = ['Adresse IP', 'Nom d\'utilisateur', 'Clé privée'];
    const separator = ';'; // Utilisation du point-virgule comme séparateur pour une meilleure compatibilité
    
    // Récupérer toutes les lignes du tableau
    const tableRows = document.querySelectorAll('#ssh-keys-table-body tr');
    
    // Vérifier s'il y a des données à exporter
    if (tableRows.length === 0 || (tableRows.length === 1 && tableRows[0].querySelector('td').colSpan)) {
        alert('Aucune donnée à exporter');
        return;
    }
    
    // Fonction pour échapper les chaînes pour le CSV
    const escapeCSV = (str, isSSHKey = false) => {
        if (str === null || str === undefined) return '';
        str = String(str);
        
        // Pour les clés SSH, on préserve les retours à la ligne
        if (isSSHKey) {
            // On entoure toute la clé de guillemets et on double les guillemets existants
            return '"' + str.replace(/"/g, '""') + '"';
        }
        
        // Pour les autres champs, on remplace les retours à la ligne par des espaces
        str = str.replace(/\r?\n|\r/g, ' ');
        // Si la chaîne contient le séparateur ou des guillemets, l'entourer de guillemets
        if (str.includes(separator) || str.includes('"')) {
            return '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
    };
    
    // Ajouter l'en-tête
    rows.push(headers.join(separator));
    
    // Ajouter les données
    tableRows.forEach(row => {
        const cells = row.querySelectorAll('td');
        // Vérifier si c'est une ligne de données (pas un message "Aucune clé SSH disponible")
        if (cells.length > 1) {
            const rowData = [];
            cells.forEach((cell, index) => {
                if (index < 3) { // Ne prendre que les 3 premières colonnes
                    let text = cell.textContent.trim();
                    // Si c'est la cellule de la clé, prendre le contenu du span sans le trim pour préserver le format
                    if (index === 2) {
                        const span = cell.querySelector('span');
                        if (span) text = span.textContent;
                        rowData.push(escapeCSV(text, true)); // On utilise le mode spécial pour les clés SSH
                    } else {
                        rowData.push(escapeCSV(text.trim()));
                    }
                }
            });
            rows.push(rowData.join(separator));
        }
    });
    
    // Créer le contenu CSV avec un BOM pour Excel
    const csvContent = "\uFEFF" + rows.join('\r\n');
    
    // Créer un lien de téléchargement
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `cles_ssh_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url); // Libérer la mémoire
}

// Charger les clés au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    loadSSHKeys();

    // Ajouter les écouteurs d'événements
    const refreshButton = document.getElementById('refresh-keys');
    if (refreshButton) {
        refreshButton.addEventListener('click', loadSSHKeys);
    }
    
    const exportButton = document.getElementById('export-keys');
    if (exportButton) {
        exportButton.addEventListener('click', exportToCSV);
    }
});
