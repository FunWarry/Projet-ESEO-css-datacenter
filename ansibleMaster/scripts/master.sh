#!/bin/bash

while true; do
    clear
    echo "==============================================="
    echo "        MENU DE DÉPLOIEMENT DE SERVICES        "
    echo "==============================================="
    echo "0) Envoi des packages"
    echo "1) Déploiement standard (tous les services)"
    echo "2) DNS"
    echo "3) DHCP & openVPN"
    echo "4) Relais"
    echo "5) Web"
    echo "6) Web"
    echo "7) Base de Données (BDD)"
    echo "8) Squash"
    echo "9) Supervision"
    echo "10) Sauvegarde"
    echo "11) Guacamole"
    echo "12) Je détruis tout :)"
    echo "13) Quitter"
    echo "-----------------------------------------------"
    read -p "Choisis un ou plusieurs services (ex: 1 4 6): " choix

    for opt in $choix; do
        case $opt in
            0)
                echo "Envoi des packages : Teaching Cloud ..."
                sleep 1
                sudo bash /vagrant/scripts/bridge.sh
                sudo -u ansible ansible-playbook -i /vagrant/ansible/variables/inventory.ini /vagrant/ansible/playbooks/send_packages.yml
                ;;
            1)
                echo "Déploiement standard : Teaching Cloud ..."
                sleep 1
                for playbook in Dns DHCP_openVPN Relais Web PHPmyadmin Bdd Squash Supervision; do
                    sudo -u ansible ansible-playbook -i /vagrant/ansible/variables/inventory.ini /vagrant/ansible/playbooks/${playbook}.yml
                done
                ;;
            2)
                echo "Déploiement de DNS..."
                sleep 1
                sudo -u ansible ansible-playbook -i /vagrant/ansible/variables/inventory.ini /vagrant/ansible/playbooks/Dns.yml
                ;;
            3)
                echo "Déploiement de DHCP..."
                sleep 1
                sudo -u ansible ansible-playbook -i /vagrant/ansible/variables/inventory.ini /vagrant/ansible/playbooks/DHCP_openVPN.yml
                ;;
            4)
                echo "Déploiement de Relais..."
                sleep 1
                sudo -u ansible ansible-playbook -i /vagrant/ansible/variables/inventory.ini /vagrant/ansible/playbooks/Relais.yml
                ;;
            5)
                echo "Déploiement de Web..."
                sleep 1
                sudo -u ansible ansible-playbook -i /vagrant/ansible/variables/inventory.ini /vagrant/ansible/playbooks/Web.yml
                ;;
            6)
                echo "Déploiement de PHPmyadmin.."
                sleep 1
                sudo -u ansible ansible-playbook -i /vagrant/ansible/variables/inventory.ini /vagrant/ansible/playbooks/PHPmyadmin.yml
                ;;
            7)
                echo "Déploiement de BDD..."
                sleep 1
                sudo -u ansible ansible-playbook -i /vagrant/ansible/variables/inventory.ini /vagrant/ansible/playbooks/Bdd.yml
                ;;
            8)
                echo "Déploiement de Squash..."
                sleep 1
                sudo -u ansible ansible-playbook -i /vagrant/ansible/variables/inventory.ini /vagrant/ansible/playbooks/Squash.yml
                ;;
            9)
                echo "Déploiement de Supervision..."
                sleep 1
                sudo -u ansible ansible-playbook -i /vagrant/ansible/variables/inventory.ini /vagrant/ansible/playbooks/Supervision.yml
                ;;
            10)
                echo "Déploiement de Sauvegarde..."
                sleep 1
                sudo -u ansible ansible-playbook -i /vagrant/ansible/variables/inventory.ini /vagrant/ansible/playbooks/Sauvegarde.yml
                ;;
            11)
                echo "Déploiement de Guacamole..."
                sleep 1
                sudo -u ansible ansible-playbook -i /vagrant/ansible/variables/inventory.ini /vagrant/ansible/playbooks/Guacamole.yml
                ;;
            12)
                echo "Destruction massive ..."
                sleep 1
                sudo -u ansible ansible-playbook -i /vagrant/ansible/variables/inventory.ini /vagrant/ansible/playbooks/destroy_all.yml
                ;;
            13)
                echo "Quitter... À bientôt !"
                exit 0
                ;;
            *)
                echo "Option inconnue: $opt"
                ;;
        esac
    done
    sleep 5
done
