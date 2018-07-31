# 云转码切片平台 linux版本

#### 项目介绍
主要实现功能：
一、视频批量上传，视频分块上传。
二、视频批量转码并且切片，切片完成删除原视频文件。
三、视频批量添加水印。
四、一键获取分享链接，防盗链设置，只允许指定域名ifream调用，token防盗链等。

文档更新地址：[https://moejj.com/yun-zhuan-ma-qie-pian/](https://moejj.com/yun-zhuan-ma-qie-pian/)   这里不会再更新文档和版本内容

本开源项目采用nodejs、expressjs、mongodb开发。
使用前请安装ffmpeg。

#### 软件架构
nodejs v8.7.0版本
expressjs 4.16.0版本
mongoDb
ffmpeg 3.4.1版本
Linux系统上运行完美。

#### 安装教程
##### 自己编译
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

4. ffmpeg烧录字幕的时候会查找字体配置文件，/etc/fonts，如果里边没有fonts.conf，请将本源码中fonts.conf上传到/etc/fonts，有些linux系统没有中文字体支持，请将msyh.ttf上传至/usr/share/fonts里边。

##### 利用sh文件安装
* ./install.sh 使用前请给予权限。

#### 使用说明
1. 创建/config文件夹并在里边创建auth.js文件
代码如下：

```
module.exports = {
    user: "username",
    password: "password",
    db: "dbname",
    dbuser: "dbuser",
    dbpassword: "dbpassword"
};
```

2. 登陆后台之后请立刻在设置中进行设置。
3. 上传视频即可上传视频。
4. 转码页面一键转码。
5. 支持后台字幕上传，名称与视频名一致，则系统会自动烧录字幕。例如：aaa.mp4，则srt字幕名为aaa.srt。
6. 支持一键入库，利用ftp等工具将视频上传至movies文件夹，后台可以一键入库，进行转码切片操作。
7. 秒切功能，开启之后，无需进行转码的视频会直接切片。（后台可设置）

#### 版本
##### V4版本：
增加了1080P的选项。
增加切片ts域名分发，负载均衡的功能。
开启域名分发，数台服务器同步切片内容，访问m3u8动态生成循环域名切片前缀。

##### v3版本：
更改播放器为Dplayer播放。
增加VTT字幕支持，后台可以给视频分别上传vtt字幕，前台播放会自动加载，支持了字幕和视频分开。
增加一个webtorrent功能（测试玩）。

##### v2版本：
* 增加批量烧录字幕功能，支持srt字幕，改成和视频名一样，系统在转码的时候会自动把字幕烧录进去。如果存在srt字幕文件，则对应电影无论是否设置秒切都会进行转码。
* 增加批量入库功能，利用ftp或者其他工具将视频传至movies文件夹，在后台即可一键入库。
* 增加秒切功能，后台设置开启，即视频如果小于设置的分辨率并且编码为h264则会跳过转码直接切片。
* 增加自动生成截图功能，默认4张截图，路径yourdomain/videos/:id/(1|2|3|4).jpg。

##### v1版本：
* 批量上传视频，大文件切片上传。
* 批量转码并切片。
* 设置防盗链和分辨率，添加水印，一气呵成。


#### 截图
![上传截图](https://gitee.com/uploads/images/2018/0606/185630_b769b67c_145248.jpeg "屏幕快照 2018-06-06 下午6.55.28.jpg")
![转码页面](https://gitee.com/uploads/images/2018/0606/185709_88123554_145248.jpeg "屏幕快照 2018-06-06 下午6.55.37.jpg")
![设置页面](https://gitee.com/uploads/images/2018/0606/185721_9fa0c0c5_145248.jpeg "屏幕快照 2018-06-06 下午6.55.56.jpg")

有问题请联系我，q 195996048，邮mwm0022@qq.com
