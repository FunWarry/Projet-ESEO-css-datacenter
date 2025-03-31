$script_hosts = <<-SCRIPT
echo '192.168.234.3 galeranode1'>> /etc/hosts
echo '192.168.234.4 galeranode2'>> /etc/hosts
echo '192.168.234.5 galeranode3'>> /etc/hosts
echo '192.168.234.6 haproxynode1'>> /etc/hosts
SCRIPT

$script_stats_haproxy = <<-SCRIPT
echo 'listen stats'>>/etc/haproxy/haproxy.cfg
echo '  bind :9999'>>/etc/haproxy/haproxy.cfg
echo '  mode http'>>/etc/haproxy/haproxy.cfg
echo '  stats enable'>>/etc/haproxy/haproxy.cfg
echo '  stats hide-version'>>/etc/haproxy/haproxy.cfg
echo '  stats uri /stats'>>/etc/haproxy/haproxy.cfg
SCRIPT

$script_ssh = <<-SCRIPT
sed -i 's/ChallengeResponseAuthentication no/ChallengeResponseAuthentication yes/g' /etc/ssh/sshd_config    
sleep 3
service ssh restart
SCRIPT

$script_route = <<-SCRIPT
sudo ip route del default
sudo ip route add default via 192.168.234.1 dev enp0s8
SCRIPT

Vagrant.configure("2") do |config|

	# Number of nodes to provision
	numNodes = 3
 
	# IP Address Base for private network
	ipAddrPrefix1 = "192.168.234."
	
 
	# Define Number of RAM for each node
	config.vm.provider "virtualbox" do |v|
		v.customize ["modifyvm", :id, "--groups", "/projet"]
		v.customize ["modifyvm", :id, "--cpus", "1"]
		v.customize ["modifyvm", :id, "--memory", 512]
		v.customize ["modifyvm", :id, "--natdnshostresolver1", "off"]
		v.customize ["modifyvm", :id, "--natdnsproxy1", "off"]
	end

	 # Download the initial box from this url
 
	 # Provision Config for each of the nodes
	1.upto(numNodes) do |num|
		nodeName = ("galeranode" + num.to_s).to_sym
		config.vm.define nodeName do |node|
			node.vm.host_name = nodeName
			node.vm.box = "chavinje/fr-book-64"
			node.vm.network :public_network, ip: ipAddrPrefix1 + (num + 2).to_s
			node.vm.provider "virtualbox" do |v|
				v.name = "GaleraNode" + num.to_s
			end

			node.vm.provision "shell", inline: $script_hosts
			node.vm.provision "shell", inline: $script_ssh
			node.vm.provision "shell", path: "scripts/config_sys.sh"
			node.vm.provision "shell", inline: $script_route
			node.vm.provision "shell", path: "scripts/install_galera.sh"
			node.vm.provision "shell", path: "scripts/install_zabbix_agent.sh"
			node.vm.provision "shell", path: "scripts/install_sys.sh"
		end
	end

	# Number of haproxy nodes to provision
    numHaproxys = 1

	1.upto(numHaproxys) do |num|
		haproxyName = ("haproxynode" + num.to_s).to_sym
		config.vm.define haproxyName do |ha|
			ha.vm.host_name = haproxyName
			ha.vm.box = "chavinje/fr-book-64"
			ha.vm.network :public_network, ip: ipAddrPrefix1 + (6).to_s
			ha.vm.provider "virtualbox" do |v|
				v.name = "haproxynode" + num.to_s
			end

			ha.vm.provision "shell", inline: $script_hosts
			ha.vm.provision "shell", inline: $script_ssh
			ha.vm.provision "shell", path: "scripts/config_sys.sh"
			ha.vm.provision "shell", inline: $script_route
			ha.vm.provision "shell", path: "scripts/install_ha.sh"
			ha.vm.provision "shell", inline: $script_stats_haproxy
			ha.vm.provision "shell", path: "scripts/install_zabbix_agent.sh"
			ha.vm.provision "shell", path: "scripts/install_sys.sh"
		end
	end
end
