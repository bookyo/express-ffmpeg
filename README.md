# Introduction

[![Node.js Version](https://img.shields.io/badge/node.js-8.16.0-blue.svg)](http://nodejs.org/download)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/bookyo/express-ffmpeg/blob/master/LICENSE)

Language: [English](README.md) | [简体中文](README.ZH.md)

Express-ffmpeg is an open source and free video transcoding and slicing program, which uses layui as the front-end display and nodejs and mongodb as the back-end development. The transcoding and slicing tool used in the program is ffmpeg, ffmpeg is currently the most useful audio and video processing tools, the front CMS using adaptive design, simple and powerful.

In function to meet the needs of all transcoding slice entry users, transcoding plus slicing, automatic screenshots, automatically generate preview pictures, the player automatically load preview pictures (mouse drag can preview), TS encryption, second cut function, arbitrary selection of multiple resolutions, random token hotlink protection, sliced file multi-server distribution, multi-server synchronization, load balancing, support for player VTT plugins subtitles, webtorrent online playback magnetic link, front-end cms system supports pictures, articles, video release, membership system, points system and so on.

Welcome to https://ffmpeg.moejj.com/.

Functions
----

 - File upload, large file block upload, batch upload.
 - Background cloud transcoding and slicing, the use of the most concise code to make the fastest transcoding + slicing function.
 - Second cut function, slicing speed ahead of all market fee cloud transcoding systems.
 - Video classification, video filtering, video search, everything in the background.
 - Hotlink protection, token hotlink protection, multiple hotlink protection, avoid traffic loss, you can set the specified domain name can only be called iframe.
 - Subtitle program, watermark program, super simple operation, you can program subtitles into the video or add watermarks to the video.
 - Vtt subtitles are supported. Different vtt subtitles can be uploaded in the background according to different videos, and the subtitles can be automatically loaded in the foreground.
 - Video screenshots, background configuration screenshots, automatic screenshots when cloud transcoding slicing.
 - Ts distribution, multi-server synchronization of content, ts file automatic loop plus domain name prefix, load balancing.
 - The ts encrypts slice, and the KEY automatically decrypts the playback when it is played.
 - The webtorrent protocol plays magnetic links online.
 - Cms system configuration, foreground automatic generation of cms system, adaptive layout, optimized for mobile, seo effect is excellent.
 - Member system, routing level of permission control, according to different permissions, the same m3u8 file will dynamically return completely different content.

Requirements
----

 - Windows or Linux
 - Nodejs 8+
 - Redis
 - Mongodb
 - Expressjs

Docker guide
--
You can quickly get a server running using Docker. You need to have [docker](https://www.docker.com/community-edition).

Installation visit https://www.moerats.com/archives/782/.

Installation
--
This tutorial applies only to Debian 9.

**1.Installing nodejs**

    curl -sL https://deb.nodesource.com/setup_8.x | bash -
    apt install -y nodejs git

**2.Installing mongoDB**

    curl https://www.mongodb.org/static/pgp/server-4.0.asc | apt-key add -
    echo "deb http://repo.mongodb.org/apt/debian stretch/mongodb-org/4.0 main" | tee /etc/apt/sources.list.d/mongodb-org-4.0.list
    apt update -y
    apt install -y mongodb-org
    systemctl start mongod
    systemctl enable mongod

**3.Installing redis**

    apt install redis-server -y

**4.Installing pm2 and express**

    npm i -g pm2 express

**5.Installing ffmpeg**

    apt install ffmpeg -y

**6.Creating a new database**

    mongo
    use ffmpeg
    db.createUser({user:"ffmpeg",pwd:"ffmpeg",roles:[{role:"readWrite",db:"ffmpeg"}]})
    db.auth("ffmpeg","ffmpeg")

If 1 is returned and the new creation is successful, exit using Ctrl+D.

**7.Installation procedures**

    git clone https://github.com/bookyo/express-ffmpeg
    cd express-ffmpeg
    #Creating config folder.
    mkdir config
    #Creating a new configuration file. The following is a whole command that is copied to the ssh client.
    cat > config/auth.js <<EOF
    module.exports = {
        user: "admin",
        password: "admin",
        db: "ffmpeg",
        dbuser: "ffmpeg",
        dbpassword: "ffmpeg",
        secret: "yoursecret",
        login: "/adminurl",
        loginmsg: "404 Not Found",
    };
    EOF
    #Installation dependency.
    npm i
    #Running.
    pm2 start bin/www -i 0

Profile description:

    #admin username parameter user, default admin
    #admin password parameter password, default admin
    #background login path parameter login, default adminurl

The last access address http://ip:3000, the default background path /adminurl, username and password is admin.
