# galera-cluster

Project to store tools and script usefull for implementing a multinodes galera cluster

## Usage

1. Clone the repo or download/decompress the archive
2. In the directory, issue the vagrant up command, vagrant should provision 3 debian11 nodes (1024M Ram, 1CPU, 1 internal network adapter + 1 NAT)
3. Each nodes comes up without any additional software, galera4 + mariadb needs to be installed ( as desribed in https://www.it-connect.fr/comment-mettre-en-place-mariadb-galera-cluster-sur-debian-11/).
4. Configure galera on each cluster nodes, and stop mariadb
5. Bootstrap cluster on one node
6. Start mariadb on each remaining nodes, they should join the cluster
5. Enjoy !!!