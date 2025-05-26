#!/bin/bash

while true; do
    clear
    echo "==============================================="
    echo "        MENU DE DÉPLOIEMENT DE SERVICES        "
    echo "==============================================="
    echo "0) Envoi des packages"
    echo "1) Déploiement standard (tous les services)"
    echo "2) DNS"
    echo "3) DHCP"
    echo "4) Relais"
    echo "5) Web"
    echo "6) Base de Données (BDD)"
    echo "7) Squash"
    echo "8) Supervision"
    echo "9) Sauvegarde"
    echo "10) Guacamole"
    echo "11) Je détruis tout :)"
    echo "12) Quitter"
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
                for playbook in Dns Dhcp Relais Web Bdd Squash Supervision; do
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
                sudo -u ansible ansible-playbook -i /vagrant/ansible/variables/inventory.ini /vagrant/ansible/playbooks/Dhcp.yml
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
                echo "Déploiement de BDD..."
                sleep 1
                sudo -u ansible ansible-playbook -i /vagrant/ansible/variables/inventory.ini /vagrant/ansible/playbooks/Bdd.yml
                ;;
            7)
                echo "Déploiement de Squash..."
                sleep 1
                sudo -u ansible ansible-playbook -i /vagrant/ansible/variables/inventory.ini /vagrant/ansible/playbooks/Squash.yml
                ;;
            8)
                echo "Déploiement de Supervision..."
                sleep 1
                sudo -u ansible ansible-playbook -i /vagrant/ansible/variables/inventory.ini /vagrant/ansible/playbooks/Supervision.yml
                ;;
            9)
                echo "Déploiement de Sauvegarde..."
                sleep 1
                sudo -u ansible ansible-playbook -i /vagrant/ansible/variables/inventory.ini /vagrant/ansible/playbooks/Sauvegarde.yml
                ;;
            10)
                echo "Déploiement de Guacamole..."
                sleep 1
                sudo -u ansible ansible-playbook -i /vagrant/ansible/variables/inventory.ini /vagrant/ansible/playbooks/Guacamole.yml
                ;;
            11)
                echo "Destruction massive ..."
                sleep 1
                sudo -u ansible ansible-playbook -i /vagrant/ansible/variables/inventory.ini /vagrant/ansible/playbooks/destroy_all.yml
                ;;
            12)
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
