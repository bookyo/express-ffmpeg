简介
--
express-ffmpeg云转码是是一款开源免费的视频转码切片程序，采用layui作为前端展示，后端采用nodejs、mongodb进行开发，程序中利用的转码和切片工具为ffmpeg，ffmpeg是目前最好用的音视频处理工具，前台CMS利用自适应设计，简洁并且功能强大。

功能上满足所有转码切片入门用户的需求，转码加切片，自动截图，自动生成预览图，播放器自动加载预览图（鼠标拖动可预览），TS加密，秒切功能，多个分辨率任意选择，随机token防盗链，切片文件多服务器分发，多服务器同步，负载均衡，播放器VTT外挂字幕支持，webtorrent在线播放磁力链接，前端cms系统，支持图片、文章、视频发布，会员系统，积分系统等。

**官方网站：** https://ffmpeg.moejj.com/

功能介绍
----

 - 文件上传，大文件分块上传，批量上传。
 - 后台云转码加切片，运用最精简的代码，做成最快的转码+切片功能。
 - 秒切功能，切片速度领先所有市面收费云转码系统。
 - 视频分类、视频筛选、视频搜索，后台一应俱全。
 - 防盗链、token防盗链，多重防盗链，避免流量损失，可以设置指定域名只能iframe调用。
 - 字幕烧录，水印烧录，超级简单的操作，即可将字幕烧录进视频或者添加水印到视频中。
 - 支持vtt字幕，后台可以根据不同的视频上传不同的vtt字幕，前台播放自动加载字幕。
 - 视频截图，后台配置截图数，云转码切片的时候自动截图。
 - ts分发，多服务器同步内容，ts文件自动循环加域名前缀，负载均衡。
 - ts加密切片，播放的时候KEY自动解密播放。
 - webtorrent协议在线播放磁力链接。
 - cms系统配置，前台自动生成cms系统，自适应布局，针对移动端优化，seo效果极佳。
 - 会员系统，路由层面的权限控制，根据权限不同，相同的m3u8文件将会动态返回完全不同的内容。

环境要求
----

 - Windows or Linux
 - Nodejs 8+
 - Redis
 - FFMPEG
 - Mongodb
 - Expressjs

Docker安装
--
安装参考：https://www.moerats.com/archives/782/

安装
--
本教程只适用Debian 9。

**1、安装nodejs**

    curl -sL https://deb.nodesource.com/setup_8.x | bash -
    apt install -y nodejs git

**2、安装mongoDB**

    curl https://www.mongodb.org/static/pgp/server-4.0.asc | apt-key add -
    echo "deb http://repo.mongodb.org/apt/debian stretch/mongodb-org/4.0 main" | tee /etc/apt/sources.list.d/mongodb-org-4.0.list
    apt update -y
    apt install -y mongodb-org
    systemctl start mongod
    systemctl enable mongod

**3、安装redis**

    apt install redis-server -y

**4、安装pm2和express**

    npm i -g pm2 express

**5、安装ffmpeg**

    apt install ffmpeg -y

**6、新建数据库**

    mongo
    use ffmpeg
    db.createUser({user:"ffmpeg",pwd:"ffmpeg",roles:[{role:"readWrite",db:"ffmpeg"}]})
    db.auth("ffmpeg","ffmpeg")
如果返回1则新建成功，使用Ctrl+D退出。

**7、安装程序**

    git clone https://github.com/bookyo/express-ffmpeg
    cd express-ffmpeg
    #创建config文件夹
    mkdir config
    #新建配置文件，以下为一整条命令，一起复制进ssh客户端
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
    #安装依赖
    npm i
    #运行
    pm2 start bin/www -i 0
配置文件说明：

    #管理员用户名参数user，默认admin
    #管理员密码参数password，默认admin
    #后台登录路径参数login，默认adminurl
最后访问地址ip:3000，默认后台路径/adminurl，用户名和密码为admin。
