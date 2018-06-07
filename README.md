# 云转码切片平台 linux版本

#### 项目介绍
主要实现功能：
一、视频批量上传，视频分块上传。
二、视频批量转码并且切片，切片完成删除原视频文件。
三、视频批量添加水印。
四、一键获取分享链接，防盗链设置，只允许指定域名ifream调用，token防盗链等。

本开源项目采用nodejs、expressjs、mongodb开发。
使用前请安装ffmpeg。

#### 软件架构
nodejs v8.7.0版本
expressjs 4.16.0版本
mongoDb
ffmpeg 3.4.1版本
Linux系统上运行完美。

#### 安装教程

1. 安装ffmpeg
Ubuntu16.04安装方法：

```
sudo add-apt-repository ppa:djcj/hybrid
sudo apt-get update  
sudo apt-get install ffmpeg  
```
然后输入ffmpeg和ffprobe查看是否安装成功。

2. 安装nodejs、expessjs、mongodb环境。
详情见：[express+nodejs+redis+mongodb+pm2+nginx环境部署安装，生产环境及开发环境部署](http://blog.sina.com.cn/s/blog_13e807ed00102wlxo.html)

3. node ./bin/www
访问localhost:3000/server
登陆账号密码在/config/auth.js中设置

#### 使用说明
1. 在/config文件夹中创建auth.js文件
代码如下：

```
module.exports = {
    user: "username",
    password: "password",
    db: "dbname",
    dbuser: "dbuser",
    dbpassword: "dbpassword"
};```

2. 登陆后台之后请立刻在设置中进行设置。
3. 上传视频即可上传视频。
4. 转码页面一键转码。

#### 截图
![上传截图](https://gitee.com/uploads/images/2018/0606/185630_b769b67c_145248.jpeg "屏幕快照 2018-06-06 下午6.55.28.jpg")
![转码页面](https://gitee.com/uploads/images/2018/0606/185709_88123554_145248.jpeg "屏幕快照 2018-06-06 下午6.55.37.jpg")
![设置页面](https://gitee.com/uploads/images/2018/0606/185721_9fa0c0c5_145248.jpeg "屏幕快照 2018-06-06 下午6.55.56.jpg")

有问题请联系我。
