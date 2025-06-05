#!/bin/bash
delall=0
echo "Téléchargement de l'ISO d'OPNSense depuis un mirror..."
if wget https://mirror.vraphim.com/opnsense/releases/mirror/OPNsense-25.1-dvd-amd64.iso.bz2;
then 

echo "dézippage de l'ISO..."

if bzip2 -d OPNsense-25.1-dvd-amd64.iso.bz2 ; then

echo "création de la machine virtuelle...
"
if VMUUID="$(VBoxManage createvm --name OPNSense --ostype FreeBSD_64 --register | grep -Po '(?<=UUID\:\s).*')" ; then

echo "configuration du cpu et de la mémoire..."
if VBoxManage modifyvm "$VMUUID" --cpus 2 --memory 8192 --graphicscontroller vboxvga; then
NIC="$(ip a | grep -Po '(?<=[0-9]{1}:\s)en[^:]*')" 
echo "$NIC"
NIC1=$(echo "$NIC" | grep -m1 -P '[^\r]*')
NIC2=$(echo "$NIC" | grep -P '[^\r]*' | tail -n 1)
echo "configuration des NIC..."
if VBoxManage modifyvm "$VMUUID" --nic1 bridged --bridgeadapter1 "$NIC1" ; then
echo "NIC 1 configuré"
if VBoxManage modifyvm "$VMUUID" --nic2 bridged --bridgeadapter2 "$NIC2" ; then
echo "NIC 2 configuré"

echo "configuration du disque dur...
"
if mkdir -p "$HOME/VirtualBox VMs/projet/OPNSense Firewall/"; then
if VBoxManage createhd --filename "$HOME/VirtualBox VMs/projet/OPNSense Firewall//OPNSenseFirewall.vdi" --size 40960 --variant Standard ; then

echo "création du controlleur SATA
"
if VBoxManage storagectl "$VMUUID" --name "SATA Controller" --add sata --bootable on ; then

echo "installation du controlleur SATA
"
if VBoxManage storageattach "$VMUUID" --storagectl "SATA Controller" --port 0 --device 0 --type hdd --medium "$HOME/VirtualBox VMs/projet/OPNSense Firewall//OPNSenseFirewall.vdi" ; then

echo "création du controlleur IDE
"
if VBoxManage storagectl "$VMUUID" --name "IDE Controller" --add ide ; then

echo "installation du controlleur IDE avec iso OPNSense
"
if VBoxManage storageattach "$VMUUID" --storagectl "IDE Controller" --port 1 --device 0 --type dvddrive --medium OPNsense-25.1-dvd-amd64.iso ; then

echo "Démarage de la VM
"
if VBoxManage startvm "$VMUUID" ; then

echo "Fin du setup de la machine OPNSense, continuez le setup dans l'interface de virtualbox"

else echo "échec du démarage de la VM"
delall=1
fi 
else echo "échec de l'installation du controlleur IDE avec ISO OPNSense"
delall=1
fi
else echo "échec de la création du controlleur IDE"
delall=1
fi
else echo "échec de l'installation du controlleur SATA"
delall=1
fi
else echo "échec de la création du controlleur SATA"
delall=1
fi
fi
else echo "échec de la configuration du controlleur sata"
delall=1
fi
else echo "échec de la configuration du disque dur"
delall=1
fi
else echo "échec de la configuration des NICs"
delall=1
fi
else echo "échec de la configuration du CPU et de la Mémoire"
delall=1
fi
else echo "échec de la création de la machine virtuelle"
delall=1
fi
else echo "échec du dézippage de l'iso"
delall=1
fi
else echo "échec du téléchagement de l'iso"
delall=1
fi
if [ $delall = 1 ] ; then
bash ./wipeout.sh
echo "supression des différents dossiers créés"
echo "$NIC"
fi
