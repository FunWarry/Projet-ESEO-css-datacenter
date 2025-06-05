#!/bin/bash

cd / 

if  ls '/root/VirtualBox VMs/' ; then
rm -rf '/root/VirtualBox VMs/'
fi 

cd /home/hostubuntu/ || exit

if ls '/home/etudis/' ; then 
rm -rf '../etudis/'
fi 

if ls ./OPNsense-25.1-dvd-amd64.iso ; then
rm -f ./OPNsense-25.1-dvd-amd64.iso
fi 
