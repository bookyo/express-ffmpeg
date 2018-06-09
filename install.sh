#!/bin/bash
sudo apt-get -y install build-essential
cd ~
mkdir git
cd git
git clone https://github.com/cnpm/nvm.git
source ~/git/nvm/nvm.sh​
echo "source ~/git/nvm/nvm.sh" >> ~/.bashrc
nvm install 8.11.2
nvm alias default v8.11.2
npm install express -gd
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 2930ADAE8CAF5059EE73BB4B58712A2291FA4AD5
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu xenial/mongodb-org/3.6 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.6.list
sudo apt-get update
sudo apt-get install -y mongodb-org
cd /
mkdir data
cd data
mkdir db
mkdir log
mongod --dbpath /data/db --fork --logpath /data/log/mongodb.log
read -p "Enter your tablename and password:" tablename password
mongo --eval "use admin;use $tablename;db.createUser({user:'$tablename',pwd:'$password',roles:[{role:'readWrite',db:'$tablename'}]});"
ID=`ps -ef | grep "mongod" | grep -v "grep" | awk '{print $2}'`
for id in $ID
do
kill -9 $id
done
mongod -auth --bind_ip 127.0.0.1 --port 27017 --dbpath /data/db --fork --logpath /data/log/mongodb.log
npm install -g pm2
nginx=stable
add-apt-repository ppa:nginx/$nginx
apt-get update
apt-get install nginx
cd /etc/nginx/sites-available
echo -n 'Enter your site:'
read site
cp default $site
ln -s /etc/nginx/sites-available/$site /etc/nginx/sites-enabled/$site
echo "server {
server_name $site;
listen 80;
location / {
proxy_set_header X-Real-IP \$remote_addr;
proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
proxy_set_header Host \$http_host;
proxy_set_header X-NginX-Proxy true;
proxy_pass http://127.0.0.1:3000;
proxy_redirect off;
}
client_max_body_size 10m;
location ~ ^/(assets/|layui/|ckplayer/|images/|img/|javascript/|js/|css/|stylesheets/|flash/|media/|static/|robots.txt|humans.txt|favicon.ico) {
root /www/express-ffmpeg/public/;
access_log off;
expires 24h;
}
location ~ .*\\.(ts)\$ {
root /www/express-ffmpeg/public/;
expires 24h;
access_log off;
valid_referers none blocked $site; 
if (\$invalid_referer) {
  return 403; 
}
} 
}" > $site
/etc/init.d/nginx restart
cd /
mkdir www
cd www
git clone https://gitee.com/quazero/express-ffmpeg
cd express-ffmpeg
npm install
mkdir config
cd config
touch auth.js
read -p "Enter your admin username and password:" username hslpassword
echo "module.exports = {
    user: '$username',
    password: '$hslpassword',
    db: '$tablename',
    dbuser: '$tablename',
    dbpassword: '$password'
};" > auth.js
cd ..
pm2 start bin/www -i 0
