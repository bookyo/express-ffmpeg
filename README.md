# 自带CMS系统的云转码系统，一体化自动发布云转码cms系统

### 开发计划
利用react native开发的跨平台原生APP代码正在紧锣密鼓的准备中，大概15天会第一个基础版本。大家敬请期待。

### 2018年9月4日大更新
这次完全更改了项目了定位，云转码不再是简单的云转码系统，而是CMS系统+云转码系统一体化，自带整个完备的并且对移动端友好的，而且非常利于SEO优化的自适应CMS系统，根据后台的分类系统和门户CMS管理系统，直接在首页达成完备的在线视频播放系统，适用于在线教育、企业内部培训视频、在线视频自媒体门户等多种运用方向。这次更新完善了视频的分类系统，完善了视频的搜索功能。CMS现在集成有视频发布，文章发布和图集发布三个功能。

### 增加会员系统
增加会员系统，可以不开启CMS，独立开启会员系统，双向验证，安全可靠，后台可以配合卡劵生成，前台用户使用卡劵进行升级。

### 真正意义上的权限系统
**路由层面的权限系统**，非网上的播放器假权限，根据权限不同，相同的M3U8播放文件返回不同的内容，比如普通会员只能播放3分钟，就只会返回3分钟的切片内容，升级之后才会返回完整的切片内容。

### 卡劵系统
后台设定卡劵生成，可以设置开通会员时间，用户前台使用即可升级到对应的会员，到期之后权限失效，需要重新开通，如果连续使用则是累加会员时间。

#### 项目介绍
主要实现功能：
一、视频批量上传，视频分块上传。
二、视频批量转码并且切片，切片完成删除原视频文件。
三、视频批量添加水印。
四、一键获取分享链接，防盗链设置，只允许指定域名ifream调用，token防盗链等。
五、自带完备的CMS系统。

文档更新地址：[https://moejj.com/yun-zhuan-ma-qie-pian/](https://moejj.com/yun-zhuan-ma-qie-pian/)   
官网地址：[https://ffmpeg.moejj.com](https://ffmpeg.moejj.com)
演示站：[https://www.moejj.com](https://www.moejj.com)
这里不会再更新文档和版本内容

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

2. 安装nodejs、expessjs、mongodb、redis环境。
详情见：[express+nodejs+redis+mongodb+pm2+nginx环境部署安装，生产环境及开发环境部署](http://blog.sina.com.cn/s/blog_13e807ed00102wlxo.html)

3. node ./bin/www
访问localhost:3000/server
登陆账号密码在/config/auth.js中设置

4. ffmpeg烧录字幕的时候会查找字体配置文件，/etc/fonts，如果里边没有fonts.conf，请将本源码中fonts.conf上传到/etc/fonts，有些linux系统没有中文字体支持，请将msyh.ttf上传至/usr/share/fonts里边。

##### 利用sh文件安装
* ./install.sh 使用前请给予权限。(已经弃用，请前往官网按步骤安装)

#### 使用说明
1. 创建/config文件夹并在里边创建auth.js文件
代码如下：

```
module.exports = {
    user: "username",
    password: "password",
    db: "dbname",
    dbuser: "dbuser",
    dbpassword: "dbpassword",
    secret: "yoursecret"
};
```

2. 登陆后台之后请立刻在设置中进行设置。
3. 上传视频即可上传视频。
4. 转码页面一键转码。
5. 支持后台字幕上传，名称与视频名一致，则系统会自动烧录字幕。例如：aaa.mp4，则srt字幕名为aaa.srt。
6. 支持一键入库，利用ftp等工具将视频上传至movies文件夹，后台可以一键入库，进行转码切片操作。
7. 秒切功能，开启之后，无需进行转码的视频会直接切片。（后台可设置）

#### 版本
##### V4.3版本
* 增加批量切片头的功能，选择视频，设置时间轴，一键切片头，利用速度最快的参数，秒切片头。
* 增加m3u8开放浏览功能，设置里边删除key，则m3u8开放浏览，可以分享到任何播放器进行播放，如果设置了key，则可以使用m3u8api调用，安全性更高。
* 修复转码切片核心源码中的一个bug，此bug会导致切片时候之后转码也会失败，推荐更新。

##### V4.2版本
* 更新了上传封面功能，可以独立为视频上传封面，没有上传封面就会使用截图做封面。
* 增加了M3U8的api功能，直接填入需要输入m3u8的地方就可以直接调用m3u8，此api仅支持H5播放器，ckplayer等flash播放器不支持，并且需要nginx的正确配置。
* 引入redis缓存机制，有些页面需要大量计算的地方，通过redis缓存速度大增，后期可以为分布式做准备。
* CMS首页更改为2列排序，手机上的效果更好。
* 因为bootcss的CDN爆炸，已经把所有cdn上的JS和css全部更改为本地。

##### V4.1版本
* 优化分类引用防盗链控制的逻辑，增加单分类开放浏览的选项。
* 优化后台视频管理数量选择，和一键批量修改。
* 后台增加设置选项，设置引用盗链跳转链接。
* 图集页展示更加完美。

##### V4版本
* 大更新，CMS怎么能没有图集发布和文章发布，这次更新增加图集和文章发布的完整支持。
* 图集发布，一键上传图片，一键完成封面截图，一键前端展示，点击翻页。
* 文章发布，集成editor.md，markdown编辑器，极其完美的书写体验。
* 增加分类编辑，编辑中可以针对分类添加防引用盗链，盗链功能颗粒化管理。
* 电影管理页，增加一键修改所有电影分类的功能。
* 增加播放器文字水印广告背景色和背景透明度设置。
* 完全重写分享页面的代码，速度更快。

##### V3.2版本
* 增加播放器进度条预览效果，鼠标移动到进度条会显示对应时间轴的预览图。
* 增加后台设置TS加密，设置加密之后，切片文件TS会全部加密。
* Ts加密高级特性，每一个视频都对应一个独立的KEY文件，安全性大涨。
![输入图片说明](https://images.gitee.com/uploads/images/2018/0920/212642_dc2f0ad0_145248.png "屏幕快照 2018-09-20 下午7.22.39.png")
![输入图片说明](https://images.gitee.com/uploads/images/2018/0920/212650_285c80e9_145248.png "屏幕快照 2018-09-20 下午9.21.22.png")
##### V3.1版本
* 增加队列转码功能，先上传的先转码，循环处理，转码失败会自动跳过
* 增加后台统计代码功能，可以添加第三方统计代码，分享链接和CMS单独设置
* 修复会员开通卡劵之后，m3u8浏览器缓存问题

##### V3版本
* 市面上唯一的路由层面的权限控制
* 完备可扩展的会员系统
* VIP卡劵后台一键生成
* **根据权限不同，相同M3u8文件动态生成不同的内容**

##### V2.1版本
* 增加防盗链域名多域名支持
* 针对手机QQ浏览器优化，支持显示播放器水印广告和文字链接广告
* 增加图表统计页面，炫酷图表统计和表格统计。
* 增加P2P功能，待测试效果。

##### V2版本：
* 大更新，增加门户CMS设置，内嵌CMS系统
* 增加播放器配置
* 播放器图片水印和文字广告
* 播放页面完全自定义图片水印和文字广告

##### V1.5版本：
* 完全重构ffmpeg相关的所有代码。
* 将转码和切片合并成一次操作，提升双倍效率，原来是转码成mp4，然后再mp4切片。
* 完全重写切片代码，秒切的速度提升超过10倍，1G视频切片完成只需要半分钟。
  
##### V1.4版本：
* 增加了1080P的选项。
* 增加切片ts域名分发，负载均衡的功能。
* 开启域名分发，数台服务器同步切片内容，访问m3u8动态生成循环域名切片前缀。

##### v1.3版本：
* 更改播放器为Dplayer播放。
* 增加VTT字幕支持，后台可以给视频分别上传vtt字幕，前台播放会自动加载，支持了字幕和视频分开。
* 增加一个webtorrent功能（测试玩），地址：yourdomain/playmagnet。

##### v1.2版本：
* 增加批量烧录字幕功能，支持srt字幕，改成和视频名一样，系统在转码的时候会自动把字幕烧录进去。如果存在srt字幕文件，则对应电影无论是否设置秒切都会进行转码。
* 增加批量入库功能，利用ftp或者其他工具将视频传至movies文件夹，在后台即可一键入库。
* 增加秒切功能，后台设置开启，即视频如果小于设置的分辨率并且编码为h264则会跳过转码直接切片。
* 增加自动生成截图功能，默认4张截图，路径yourdomain/videos/:id/(1|2|3|4).jpg。

##### v1.1版本：
* 批量上传视频，大文件切片上传。
* 批量转码并切片。
* 设置防盗链和分辨率，添加水印，一气呵成。


#### 截图
![图集展示](https://images.gitee.com/uploads/images/2018/0927/104338_617a2992_145248.jpeg "FireShot Capture 5 - 热血动漫角色大集合 I 新的在线教育 - http___localhost_3000_image_5baa513d0046647562fb1e0c_1.jpg")
![文章列表](https://images.gitee.com/uploads/images/2018/0925/232417_da13c156_145248.png "FireShot Capture 1 - 文章 - 新的在线教育 - http___localhost_3000_articles.png")
![图集](https://images.gitee.com/uploads/images/2018/0925/233414_4ffade89_145248.jpeg "FireShot Capture 2 - 图集 - 新的在线教育 - http___localhost_3000_imageslist.jpg")
![视频](https://images.gitee.com/uploads/images/2018/0925/233446_1f357ab5_145248.jpeg "FireShot Capture 3 - 新的在线教育 - http___localhost_3000_.jpg")
![输入图片说明](https://images.gitee.com/uploads/images/2018/0904/192833_58d6b693_145248.jpeg "FireShot Capture 3 - 在线教育，美丽人生 - http___localhost_3000_.jpg")
![输入图片说明](https://images.gitee.com/uploads/images/2018/0904/192842_6a95e52a_145248.jpeg "FireShot Capture 4 - 门户cms设置 - http___localhost_3000_admin_portal.jpg")
![输入图片说明](https://images.gitee.com/uploads/images/2018/0904/192851_cfc5123c_145248.jpeg "FireShot Capture 5 - 分类管理 - http___localhost_3000_admin_categories.jpg")
![输入图片说明](https://images.gitee.com/uploads/images/2018/0904/192907_42fa526f_145248.jpeg "FireShot Capture 6 - 全部电影库 - http___localhost_3000_admin_movies.jpg")
![输入图片说明](https://images.gitee.com/uploads/images/2018/0904/192931_5918d089_145248.jpeg "FireShot Capture 8 - [喵萌奶茶屋][繁体中文][与僧侣交合的色欲之_ - http___localhost_3000_movie_5b8e49643c3ee95a185469a7.jpg")
![输入图片说明](https://images.gitee.com/uploads/images/2018/0915/092922_4ab46535_145248.jpeg "屏幕快照 2018-09-15 上午9.26.56.jpg")
![输入图片说明](https://images.gitee.com/uploads/images/2018/0915/092907_0ce6f5d8_145248.jpeg "屏幕快照 2018-09-15 上午9.26.48.jpg")
![输入图片说明](https://images.gitee.com/uploads/images/2018/0915/092858_2ba6278d_145248.jpeg "屏幕快照 2018-09-15 上午9.26.38.jpg")
![图表统计](https://images.gitee.com/uploads/images/2018/0913/144939_3ba18b3c_145248.jpeg "屏幕快照 2018-09-13 下午2.46.55.jpg")
![输入图片说明](https://images.gitee.com/uploads/images/2018/0910/120203_ea18551d_145248.png "播放器设置 - http___localhost_3000_admin_bofangqi.png")
![ts文件域名分发](https://images.gitee.com/uploads/images/2018/0731/102414_be8e1a72_145248.jpeg "屏幕快照 2018-07-31 上午10.18.51.jpg")
![上传截图](https://gitee.com/uploads/images/2018/0606/185630_b769b67c_145248.jpeg "屏幕快照 2018-06-06 下午6.55.28.jpg")
![设置](https://images.gitee.com/uploads/images/2018/0731/102525_c3f5c8ae_145248.jpeg "屏幕快照 2018-07-31 上午10.18.37.jpg")

有问题请联系我，q 195996048，邮mwm0022@qq.com
