# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure(2) do |config|
  config.vm.box = "ubuntu/trusty64"

 config.vm.provider "virtualbox" do |vb|
   vb.memory = "1024"
 end

 config.vm.network "forwarded_port", guest: 3000, host: 3000

 config.vm.provision "shell", inline: <<-SHELL
   sudo apt-get update -y
   curl -sL https://deb.nodesource.com/setup_iojs_1.x | sudo bash -
   sudo apt-get install -y iojs redis-server postgresql-9.3-postgis-2.1
   psql -U postgres
   sudo sed -i -- 's/peer/trust/g' /etc/postgresql/9.3/main/pg_hba.conf
   sudo sed -i -- 's/md5/trust/g' /etc/postgresql/9.3/main/pg_hba.conf
   sudo service postgresql restart
   psql -U postgres -c "CREATE DATABASE snaparound"
   psql -U postgres -c "CREATE USER snaparound"
   psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE snaparound to snaparound"
   psql -U postgres -c "CREATE DATABASE snaparoundtest"
   psql -U postgres -c "CREATE USER snaparoundtest"
   psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE snaparoundtest to snaparoundtest"
   psql -U postgres -d snaparound -c "CREATE EXTENSION postgis"
   psql -U postgres -d snaparoundtest -c "CREATE EXTENSION postgis"
 SHELL
end
