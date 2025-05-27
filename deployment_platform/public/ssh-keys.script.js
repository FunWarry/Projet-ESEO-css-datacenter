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


// Charger les clés au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    loadSSHKeys();

// Ajouter un écouteur d'événement pour le bouton de rafraîchissement
    const refreshButton = document.getElementById('refresh-keys');
    if (refreshButton) {
        refreshButton.addEventListener('click', loadSSHKeys);
    }
});
