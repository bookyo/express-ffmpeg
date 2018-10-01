var Movie = require('../models/movie');
var Setting = require("../models/setting");
var Fenfa = require("../models/fenfa");
var FFmpeghelper = require('../helper/newffmpeg');
var ListsFFmpegHelper = require("../helper/listsffmpeg");
var Category = require("../models/category");
var Portal = require("../models/portal");
var Player = require("../models/player");
var User = require("../models/user");
var Card = require("../models/card");
var fs = require('fs');
var jwt = require('jsonwebtoken');
var _ = require('underscore');
var moment = require('moment');
var crypto = require('crypto');
var async = require('async');
var redis = require('redis')
redis.createClient();
var cache = require('../helper/rediscache');
var path = require('path');
const { validationResult } = require('express-validator/check');
exports.getadmin = function(req,res){
    res.render('admin',{
        user: req.session.user,
        title: "云转码后台管理平台"
    })
}

exports.getupload = function(req, res){
    res.render('upload', {
        user: req.session.user,
        title: "上传电影"
    })
}

exports.postupload = function(req, res) {
    var file = req.file;
    var body = req.body;
    var des = "./movies/";
    var filename = file.originalname;
    var filearr = filename.split(".");
    filearr.pop();
    var path = filearr.join('.');
    var tmppath = des + path;
    var exitst = fs.existsSync(tmppath);
    if(!exitst) {
        fs.mkdirSync(tmppath);
    }
    var newfilename = filename + body.dzchunkindex;
    fs.renameSync(file.path, tmppath + "/" + newfilename);
    if (body.dzchunkindex*1 + 1 == body.dztotalchunkcount*1) {
        var files = fs.readdirSync(tmppath);
        for(var i=0; i<files.length;i++){
            fs.appendFileSync(file.path+"",fs.readFileSync(tmppath+"/"+filename+i));
            fs.unlinkSync(tmppath + "/" + filename + i);
        }
        fs.rmdirSync(tmppath);
        var movieObj = {
            status: "waiting",
            originalname: file.originalname,
            path: file.path,
            size: body.dztotalfilesize
        }
        var movie = new Movie(movieObj);
        movie.save(function(err, movie) {
            if(err) {
                console.log(err);
            }
        });
    }
    return res.json({success:1});
    // if(file){
    //     var movieObj = {
    //         status: "transcoding",
    //         originalname: file.originalname,
    //         path: file.path,
    //         size: file.size
    //     }
    //     var movie = new Movie(movieObj)
    //     movie.save(function(err, movie) {
    //         if(err) {
    //             console.log(err);
    //         }
    //         FFmpeg.transcode(movie,function(){
    //             Movie.findOne({originalname:file.originalname})
    //                  .exec(function(err, movie){
    //                      movie.status = "finished";
    //                      movie.save(function(err, movie){
    //                          if(err) {
    //                              console.log(log);
    //                          }
    //                      })
    //                  })
    //         });
    //         res.json({success:1});
    //     });
    // }
    
}

exports.getmovies = function(req, res) {
    var page = req.query.page > 0 ? req.query.page : 1;
    var perPage = req.query.counts>0?req.query.counts*1:10;
    var keyword = req.query.keyword;
    if(keyword&&keyword!=""){
        var reg = /^[A-Za-z0-9]{24}$/;
        if(reg.test(keyword)) {
            Movie
                .find({_id: keyword})
                .exec(function(err, movies) {
                    Category.find()
                        .exec(function(err,categories) {
                            return res.render("movies", {
                                user: req.session.user,
                                title: '搜索结果',
                                movies: movies,
                                categories: categories,
                                page: 1,
                                pages: 1
                            })
                        })
                })
        } else {
            var reg = new RegExp(keyword);
            Movie
                .find({originalname: reg})
                .exec(function(err, movies) {
                    Category.find()
                        .exec(function(err,categories) {
                            return res.render("movies", {
                                user: req.session.user,
                                title: '搜索结果',
                                movies: movies,
                                categories: categories,
                                page: 1,
                                pages: 1
                            })
                        })
                })
        }
    } else {
        var category = req.query.category;
        var search = {};
        if(category&&category!=""){
            search = {category: category};
        }
        Movie
            .find(search)
            .sort('-createAt')
            .limit(perPage)
            .skip(perPage * (page-1))
            .exec(function(err, movies) {
                if(err) {
                    console.log(err);
                }
                Movie.find().count(function (err, count){
                    Category.find()
                        .exec(function(err, categories) {
                            res.render("movies", {
                                user: req.session.user,
                                title: "全部电影库",
                                movies: movies,
                                categories: categories,
                                page: page,
                                pages: Math.ceil(count / perPage)
                            })
                        })
                })
                
            })
    }
    
}
// apimanager
exports.apim3u8 = function(req, res) {
    var id = req.params.id;
    var refer = req.headers.referer;
    var agent = req.headers["user-agent"];
    if(!refer || !agent) {
        return res.status(404).send("错误页面");
    }
    Movie.findOne({_id: id})
        .exec(function(err, movie){
            if(err) {
                console.log(err);
            }
            if(!movie) {
                return res.status(404).send("页面已删除");
            } else {
                Setting.find()
                    .exec(function(err, setting){
                        if(err) {
                            console.log(err);
                        }
                        var antiurl = setting[0].antiurl;
                        for (let index = 0; index < antiurl.length; index++) {
                            const element = antiurl[index];
                            if(refer.indexOf(element)==0||refer.indexOf(setting[0].host)==0) {
                                var path = "./public/videos/"+id+"/index.m3u8";
                                var data = fs.readFileSync(path);
                                var datastring = data.toString('utf-8');
                                var m3u8arr = datastring.split("index");
                                var m3u8strings = m3u8arr.join(setting[0].host+"/videos/"+id+"/index");
                                res.status(200).send(m3u8strings);
                            } else {
                                res.status(404).send("无权访问");
                            }
                        }
                    })
            }
        })
}
// end apimanager
exports.transcode = function(req, res) {
    Movie
        .find({status:"waiting"})
        .exec(function(err, movies){
            if(err){
                console.log(err);
            }
            for (let i = 0; i < movies.length; i++) {
                FFmpeghelper.transcode(movies[i]);
            }
            res.json({
                success: 1
            });
        })
}
exports.listszhuanma = function(req, res) {
    ListsFFmpegHelper.transcode();
    res.json({
        success:1
    })
}
exports.delete = function(req,res) {
    var id = req.query.id;
    Movie.findOne({_id:id})
        .exec(function(err,movie){
            if(err) {
                console.log(err);
            }
            movie.remove(function(err){
                if(err){
                    console.log(err);
                }
                fs.exists(movie.path, function(exists) {
                    if (exists) {
                        fs.unlinkSync(movie.path);
                    }
                });
                deleteall("./public/videos/"+id);
                res.json({success:1});
            })
         });
}
exports.delcategory = function(req, res) {
    var id = req.query.id;
    Category.deleteOne({_id: id}, function(err) {
        if(err) {
            console.log(err);
        }
        res.json({success:1});
    })
}
exports.deluser = function(req, res) {
    var id = req.query.id;
    User.deleteOne({_id: id}, function(err) {
        if(err) {
            console.log(err);
        }
        res.json({success:1});
    })
}
exports.getmovie = function(req, res) {
    var id = req.params.id;
    async.parallel({
        movie: function(callback) {
            Movie.findOneAndUpdate({
                _id: id
            }, {
                $inc: {
                    count: 1
                }
            })
                .exec(function(err,movie){
                    if(err) {
                        console.log(err);
                    }
                    callback(null, movie);
                });
        },
        setting: function(callback) {
            Setting.find()
                .exec(function(err, setting){
                    if(err) {
                        console.log(err);
                    }
                    callback(null, setting[0]);
                })
        },
        player: function(callback) {
            Player.find()
                .exec(function(err, players) {
                    if(err) {
                        console.log(err);
                    }
                    callback(null, players[0]);
                });
        }
    }, function(err,results) {
        if(err) {
            console.log(err);
        }
        if(!results.movie) {
            res.statusCode = 404;
            return res.send("对不起，此页面不存在");
        }
        var waplock = true;
        if(results.player.waplock == 'on') {
            var agent = req.headers["user-agent"].toLowerCase();
            var phoneviewer = agent.match(/(iphone|ipod|ipad|android)/);
            var browser = agent.match(/mqqbrowser/);
            if(phoneviewer) {
                if(browser) {
                    waplock = false;
                }
            }
        }
        Category.findOne({title: results.movie.category})
            .exec(function(err, category) {
                if(err) {
                    console.log(err);
                }
                var categoryanti = "";
                var open = "";
                if(category) {
                    categoryanti = category.antiurl?category.antiurl:"";
                    open = category.open?category.open:"";
                }
                var rgba = colorRgba(results.player.wenzibackground,results.player.wenzibackgroundopacity);
                cache.getTokenByRedis(function(err, token){
                    if(err) {
                        console.log(err);
                    }
                    res.render("movie",{
                        level:req.level,
                        title: results.movie.originalname+"在线播放",
                        id:id,
                        token: token,
                        poster: results.movie.poster,
                        phoneviewer: phoneviewer,
                        antiredirect: results.setting.antiredirect,
                        waplock: waplock,
                        player: results.player,
                        rgba: rgba,
                        antiurl: results.setting.antiurl,
                        categoryanti: categoryanti,
                        open: open
                    })
                })
            })
    });
}
exports.setting = function(req, res) {
    Setting.find()
        .exec(function(err, setting) {
            if(err) {
                console.log(err);
            }
            var newset;
            if(setting.length>0) {
                newset = setting[0];
            } else {
                newset = {
                    host:"",
                    hd: "",
                    antiurl: [""],
                    antiredirect: "https://ffmpeg.moejj.com",
                    antikey: "",
                    wmpath: "./public/mark/mark.png",
                    miaoqie: "",
                    tsjiami: "",
                    api: "",
                    screenshots: 0
                }
            }
            Fenfa.find()
                .exec(function(err, fenfa) {
                    if(err) {
                        console.log(err);
                    }
                    var newfenfa;
                    if(fenfa.length>0) {
                        newfenfa = fenfa[0]
                    } else {
                        newfenfa = {
                            kaiguan: "off",
                            domains: [""]
                        }
                    }
                    res.render("setting",{
                        user: req.session.user,
                        title: "云转码设置",
                        setting: newset,
                        fenfa: newfenfa
                    })
                });
        })
    
}
exports.postfenfa = function(req, res) {
    var kaiguan = req.body.kaiguan;
    var domains = req.body.domains;
    if(!kaiguan) {
        kaiguan = "";
    }
    Fenfa.find()
        .exec(function(err, fenfa) {
            if(err) {
                console.log(err);
            }
            console.log(fenfa[0]);
            if(fenfa.length>0) {
                fenfa[0].kaiguan = kaiguan;
                fenfa[0].domains = domains;
                fenfa[0].save(function(err) {
                    if(err) {
                        console.log(err);
                    }
                })
            } else {
                var fenfaobj = {
                    kaiguan: kaiguan,
                    domains: domains
                }
                var newfenfa = new Fenfa(fenfaobj);
                newfenfa.save(function(err) {
                    if(err) {
                        console.log(err);
                    }
                })
            }
            res.redirect("/admin/setting");
        })
}
exports.postsetting = function(req, res) {
    var host = req.body.host;
    var hd = req.body.hd;
    var antiurl = req.body.antiurl;
    var antiredirect = req.body.antiredirect;
    var antikey = req.body.key;
    var wmpath = req.body.watermark;
    var miaoqie = req.body.miaoqie;
    var screenshots = req.body.screenshots;
    var tsjiami = req.body.tsjiami;
    var api = req.body.api;
    antiurlarr = antiurl.split("|");
    if(!miaoqie) {
        miaoqie = "";
    }
    Setting.find()
        .exec(function(err,setting){
            if(err) {
                console.log(err);
            }
            if(setting.length>0){
                setting[0].host = host;
                setting[0].hd = hd;
                setting[0].antikey = antikey;
                setting[0].wmpath = wmpath;
                setting[0].antiurl = antiurlarr;
                setting[0].antiredirect = antiredirect;
                setting[0].miaoqie = miaoqie;
                setting[0].screenshots = screenshots;
                setting[0].tsjiami = tsjiami;
                setting[0].api = api;
                setting[0].save(function(err) {
                    if(err) {
                        console.log(err);
                    }
                });
            } else {
                var settingobj = {
                    host: host,
                    hd: hd,
                    antiurl: antiurlarr,
                    antiredirect: antiredirect,
                    antikey: antikey,
                    miaoqie: miaoqie,
                    screenshots: screenshots,
                    wmpath: wmpath,
                    tsjiami: tsjiami,
                    api: api
                }
                var setting = new Setting(settingobj);
                setting.save(function(err) {
                    if(err) {
                        console.log(err);
                    }
                });
            }
        });
    res.redirect("/admin/setting");
}
exports.editmovie = function(req, res) {
    var id = req.params.id;
    Movie.findOne({_id: id})
        .exec(function(err, movie) {
            if(err) {
                console.log(err);
            }
            res.render("editmovie", {
                title: "修改电影标题",
                movie: movie
            })
        })
}
exports.postupdatemovie = function(req, res) {
    var id = req.params.id;
    var originalname = req.body.originalname;
    Movie.findOne({_id: id})
        .exec(function(err, movie) {
            if(err) {
                console.log(err);
            }
            movie.originalname = originalname;
            movie.save(function(err) {
                if(err) {
                    console.log(err);
                }
                res.redirect("/admin/movies");
            })
        })
}
exports.uploadwatermark = function(req, res) {
    var file = req.file;
    var path = file.path;
    res.json({
        code: 0,
        img: path
    })
}
exports.uploadvtt = function(req, res) {
    var path = req.file.path;
    var des = './public/videos/'+req.body.id;
    var exists = fs.existsSync(des);
    if(exists) {
        fs.rename(path,des+"/1.vtt",function(err) {
            if(err) {
                console.log(err);
            }
            res.json({
                code:0
            })
        })
    }
}
exports.uploadposter = function(req, res) {
    var path = req.file.path;
    var id = req.body.id;
    var des = './public/videos/'+id;
    var exists = fs.existsSync(des);
    if(exists) {
        fs.rename(path,des+"/poster.jpg",function(err) {
            if(err) {
                console.log(err);
            }
            Movie.findOne({_id: id})
                .exec(function(err, movie) {
                    if(err) {
                        console.log(err);
                    }
                    movie.poster = '/videos/'+id+'/poster.jpg';
                    movie.save(function(err) {
                        if(err) {
                            console.log(err);
                        }
                        res.json({
                            code:0
                        });
                    })
                })
        })
    }
}
exports.postzimu = function(req, res) {
    res.json({
        code:0
    })
}

exports.playmagnet = function(req, res) {
    Setting.find()
    .exec(function(err, setting){
        if(err) {
            console.log(err);
        }
        res.render("playmagnet", {
            title: "在线播放磁力链接",
            antiurl: setting[0].antiurl
        })
    })
    
}

exports.ruku = function(req, res) {
    fs.readdir('./movies', function(err, files) {
        if(err) {
            console.log(err);
        }
        var path = "./movies/";
        files.forEach(function(file) {
            fs.stat(path+file, function(err, stats) {
                if(err) {
                    console.log(err);
                }
                if(stats.isFile && stats.size>500000){
                  Movie.findOne({originalname: file})
                      .exec(function(err, movie) {
                          if(err) {
                              console.log(err);
                          }
                          if(!movie) {
                            var movieobj = {
                                originalname: file,
                                status: "waiting",
                                path: path+file,
                                size: stats.size,
                                createAt: Date.now()
                            }
                            var newmovie = new Movie(movieobj);
                            newmovie.save(function(err) {
                                if(err) {
                                    console.log(err);
                                }
                            })
                          }
                      })
                }
            })
        })
        res.json({success: 1});
    });
}
exports.addcategory = function(req, res) {
    var id = req.body.id;
    var inputcategory = req.body.inputcategory;
    var selectcategory = req.body.selectcategory;
    if(selectcategory&&selectcategory!="") {
        Movie.findOne({_id: id})
            .exec(function(err, movie) {
                if(err) {
                    console.log(err);
                }
                movie.category = selectcategory;
                movie.save(function(err) {
                    if(err) {
                        console.log(err);
                    }
                })
            })
    }
    if(inputcategory&&inputcategory!="") {
        var categoryarr = inputcategory.split(",");
        var newcategoryarr = [];
        categoryarr.forEach(element => {
            newcategoryarr.push({title: element});
        });
        Category.insertMany(newcategoryarr, function(err) {
            if(err) {
                console.log(err);
            }
        });
    }
    res.json({
        success:1
    });
}
exports.getCategories = function(req, res) {
    Category.find()
        .exec(function(err, categories) {
            if(err) {
                console.log(err);
            }
            res.render('categories', {
                title:"分类管理",
                categories: categories
            })
        })
}
exports.portal = function(req, res) {
    var portal;
    Portal.find()
        .exec(function(err, portals) {
            if(err) {
                console.log(err);
            }
            if(portals.length>0) {
                portal=portals[0];
            } else {
                portal = {
                    title: '',
                    seotitle: '',
                    kaiguan: '',
                    usersystem: '',
                    host: '',
                    screenshots: 0,
                    keywords: '',
                    description: '',
                    moviestitle: '视频',
                    images: '',
                    imagestitle: '图集',
                    articles: '',
                    articlestitle: '文章',
                    theme: 'default',
                    tongji: ''
                }
            }
            res.render('portal', {
                title: '门户cms设置',
                portal: portal
            })
        });
}
exports.postportal = function(req, res) {
    var title = req.body.title;
    var seotitle = req.body.seotitle;
    var keywords = req.body.keywords;
    var kaiguan = req.body.kaiguan;
    var host = req.body.host;
    var screenshots = req.body.screenshots;
    var moviestitle = req.body.moviestitle;
    var description = req.body.description;
    var usersystem = req.body.usersystem;
    var images = req.body.images;
    var imagestitle = req.body.imagestitle;
    var articles = req.body.articles;
    var articlestitle = req.body.articlestitle;
    var theme = req.body.theme;
    var tongji = req.body.tongji;
    Portal.find()
        .exec(function(err, portals) {
            if(err) {
                console.log(err);
            }
            if(portals.length>0) {
                portals[0].screenshots = screenshots;
                portals[0].host = host;
                portals[0].title = title;
                portals[0].seotitle = seotitle;
                portals[0].kaiguan = kaiguan;
                portals[0].usersystem = usersystem;
                portals[0].keywords = keywords;
                portals[0].description = description;
                portals[0].moviestitle = moviestitle;
                portals[0].images = images;
                portals[0].imagestitle = imagestitle;
                portals[0].articles = articles;
                portals[0].articlestitle = articlestitle;
                portals[0].theme = theme,
                portals[0].tongji = tongji;
                portals[0].save(function(err) {
                    if(err) {
                        console.log(err);
                    }
                })
            } else {
                var portalobj = {
                    host: host,
                    screenshots: screenshots,
                    title: title,
                    seotitle: seotitle,
                    keywords: keywords,
                    kaiguan: kaiguan,
                    usersystem: usersystem,
                    description: description,
                    moviestitle: moviestitle,
                    articles: articles,
                    images: images,
                    imagestitle: imagestitle,
                    articlestitle: articlestitle,
                    theme: theme,
                    tongji: tongji
                }
                var newportal = new Portal(portalobj);
                newportal.save(function(err) {
                    if(err) {
                        console.log(err);
                    }
                })
            }
            res.redirect("/admin/portal");
        })
}

exports.bofangqi = function(req, res) {
   var player;
   Player.find()
       .exec(function(err, players) {
           if(err) {
               console.log(err);
           }
           if(players.length>0) {
               player=players[0];
           } else {
               player = {
                   kaiguan: '',
                   mark: '/mark/mark.png',
                   position: 'lefttop',
                   markx: 20,
                   marky: 20,
                   p2p: 'on',
                   waplock: 'on',
                   locktip: '<p style="color:#fff;">请使用qq浏览器观看</p>',
                   font: 'Microsoft Yahei',
                   fontsize: 14,
                   opacity: 0.8,
                   bold: 'on',
                   color: '#701919',
                   text: '云转码express-ffmpeg',
                   wenzikaiguan: 'on',
                   italic: 'on',
                   underline: 'on',
                   link: 'http://ffmpeg.moejj.com',
                   wenziposition: 'lefttop',
                   wenzibackground: '#fff',
                   wenzibackgroundopacity: 0.5,
                   tongji: '',
                   wenzix: 20,
                   wenziy: 20
               }
           }
           res.render('adminplayer', {
               title: '播放器设置',
               player: player
           })
       });
}
exports.postbofangqi = function(req, res) {
    var kaiguan = req.body.kaiguan;
    var position = req.body.position;
    var mark = req.body.watermark;
    var markx = req.body.markx;
    var marky = req.body.marky;
    var p2p = req.body.p2p;
    var wenzikaiguan = req.body.wenzikaiguan;
    var font = req.body.font;
    var fontsize = req.body.fontsize;
    var opacity = req.body.opacity;
    var link = req.body.link;
    var wenziposition = req.body.wenziposition;
    var wenzibackground = req.body.wenzibackground;
    var wenzibackgroundopacity = req.body.wenzibackgroundopacity;
    var wenzix = req.body.wenzix;
    var wenziy = req.body.wenziy;
    var color = req.body.color;
    var bold = req.body.bold;
    var text = req.body.text;
    var italic = req.body.italic;
    var underline = req.body.underline;
    var waplock = req.body.waplock;
    var locktip = req.body.locktip;
    var tongji = req.body.tongji;
    Player.find()
        .exec(function(err, players) {
            if(err) {
                console.log(err);
            }
            if(players.length>0) {
                players[0].kaiguan = kaiguan;
                players[0].mark = mark;
                players[0].position = position;
                players[0].markx = markx;
                players[0].marky = marky;
                players[0].p2p = p2p;
                players[0].waplock = waplock;
                players[0].locktip = locktip;
                players[0].wenzikaiguan = wenzikaiguan;
                players[0].font = font;
                players[0].fontsize = fontsize;
                players[0].opacity = opacity;
                players[0].link = link;
                players[0].wenziposition = wenziposition;
                players[0].wenzibackground = wenzibackground;
                players[0].wenzibackgroundopacity = wenzibackgroundopacity;
                players[0].wenzix = wenzix;
                players[0].wenziy = wenziy;
                players[0].color = color;
                players[0].bold = bold;
                players[0].text = text;
                players[0].italic = italic;
                players[0].underline = underline;
                players[0].tongji = tongji;
                players[0].save(function(err) {
                    if(err) {
                        console.log(err);
                    }
                })
            } else {
                var playerobj = {
                    kaiguan: kaiguan,
                    mark: mark,
                    position: position,
                    markx: markx,
                    marky: marky,
                    p2p: p2p,
                    waplock: waplock,
                    locktip: locktip,
                    text: text,
                    wenzikaiguan: wenzikaiguan,
                    font: font,
                    fontsize: fontsize,
                    opacity: opacity,
                    bold: bold,
                    color: color,
                    underline: underline,
                    italic: italic,
                    link: link,
                    wenziposition: wenziposition,
                    wenzibackground:wenzibackground,
                    wenzibackgroundopacity: wenzibackgroundopacity,
                    wenzix: wenzix,
                    wenziy: wenziy,
                    tongji: tongji
                };
                var newplayer = new Player(playerobj);
                newplayer.save(function(err) {
                    if(err) {
                        console.log(err);
                    }
                })
            }
            res.redirect("/admin/bofangqi");
        })
}
exports.tongji = function(req, res) {
    var page = req.query.page > 0 ? req.query.page : 1;
    var perPage = req.query.counts?req.query.counts:10;
    var sort = req.query.sort?req.query.sort:"newtime";
    var perPage = parseInt(perPage);
    var sortquery = '';
    if(sort=="hot") {
        sortquery = '-count';
    } else if (sort == 'nothot') {
        sortquery = 'count';
    } else if (sort == 'newtime') {
        sortquery = '-createAt';
    } else if (sort == 'oldtime') {
        sortquery = 'createAt';
    }
    Movie.find()
        .sort(sortquery)
        .limit(perPage)
        .skip(perPage * (page-1))
        .exec(function(err, movies) {
            if(err) {
                console.log(err);
            }
            var backgroundColor = [];
            for (let index = 0; index < movies.length; index++) {
                backgroundColor.push(randomcolor());
                movies[index].formatdate=moment(movies[index].createAt).format('YYYY年MM月DD日, HH:mm:ss');
            }
            var data = {};
            var dataarr = _.pluck(movies,'count');
            data.datasets = [{
                data: dataarr,
                backgroundColor: backgroundColor
            }];
            var labelarr = _.pluck(movies, 'originalname');
            data.labels = labelarr;
            Movie.find().count(function (err, count) {
               if(err) {
                   console.log(err);
               }
               res.render('tongji', {
                   title: "播放统计",
                   movies: movies,
                   data: JSON.stringify(data),
                   page: page,
                   pages: Math.ceil(count / perPage)
               })
            })
        })
}

exports.login = function(req, res) {
    var user = req.session.leveluser;
    Portal.find()
        .exec(function(err, portal) {
            if(err) {
                console.log(err);
            }
            res.render(req.portal.theme+"/cmslogin", {
                user: user,
                portal: portal[0],
                title: "用户登陆",
                info: req.flash('info')
            })
        })
}
exports.reg = function(req, res) {
    Portal.find()
        .exec(function(err, portal) {
            if(err) {
                console.log(err);
            }
            res.render(req.portal.theme+'/cmsreg', {
                portal: portal[0],
                title: '用户注册',
                info: req.flash('info')
            })
        })
}
exports.postreg = function(req, res) {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(422).json({
            errors: errors.array()
        });
    }
    var username = req.body.username;
    var email = req.body.email;
    var md5 = crypto.createHash('md5');
    var password = md5.update(req.body.password).digest('hex');
    var newuserobj = {
        username: username,
        email: email,
        password: password
    }
    User.findOne({username: username})
        .exec(function(err,user) {
            if(err) {
                console.log(err);
            }
            if(user) {
                req.flash('info', '此用户名已经被注册');
                return res.redirect('/register');
            }
            User.findOne({email: email})
                .exec(function(err, user) {
                    if(err) {
                        console.log(err);
                    }
                    if(user) {
                        req.flash('info', '此邮箱已经被注册');
                        return res.redirect("/register");
                    }
                    var newuser = new User(newuserobj);
                    newuser.save(function(err,user) {
                        if(err) {
                            console.log(err);
                        }
                        req.session.leveluser = user.username;
                        res.redirect('/');
                    });
                })
        });
}
exports.postlogin = function(req, res) {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(422).json({
            errors: errors.array()
        });
    }
    var email = req.body.email;
    var md5 = crypto.createHash('md5');
    var password = md5.update(req.body.password).digest('hex');
    User.findOne({email:email,password:password})
        .exec(function(err,user){
            if(err) {
                console.log(err);
            }
            if(!user) {
                req.flash('info','对不起，邮箱或密码错误');
                return res.redirect("/login");
            }
            req.session.leveluser = user.username;
            res.redirect("/");
        });

}
exports.logout = function(req, res) {
    req.session.leveluser = null;
    res.redirect("/");
}
exports.adminusers = function(req ,res) {
    var page = req.query.page > 0 ? req.query.page : 1;
    var perPage = 15;
    User.find()
        .sort("-createAt")
        .limit(perPage)
        .skip(perPage * (page - 1))
        .exec(function(err, users) {
            if(err) {
                console.log(err);
            }
            User.find().count(function(err, count) {
                if(err) {
                    console.log(err);
                }
                res.render("adminusers", {
                    title: '后台用户管理',
                    users: users,
                    page: page,
                    pages: Math.ceil(count/perPage)
                })
            })
        })
}
exports.gencard = function(req, res) {
    var days = req.body.days;
    var counts = req.body.counts;
    var cards = [];
    for (let index = 0; index < parseInt(counts); index++) {
        cards.push({
            card: randomcard(),
            days: days,
            status: 'notuse',
            createAt: Date.now()
        })
    }
    Card.insertMany(cards, function(err) {
        if(err) {
            console.log(err);
        }
        res.redirect("/admin/users");
    })
}
exports.cards = function(req, res) {
    var page = req.query.page > 0 ? req.query.page : 1;
    var perPage = 15;
    Card.find()
        .sort("-createAt")
        .limit(perPage)
        .skip(perPage * (page - 1))
        .exec(function(err, cards) {
            if(err) {
                console.log(err);
            }
            Card.find().count(function(err, count) {
                if(err) {
                    console.log(err);
                }
                res.render("admincards", {
                    title: '后台用户管理',
                    cards: cards,
                    page: page,
                    pages: Math.ceil(count/perPage)
                })
            })
        })
}
exports.addcard = function(req, res) {
    Portal.find()
        .exec(function(err, portal) {
            if(err) {
                console.log(err);
            }
            res.render(req.portal.theme+'/addcard', {
                portal: portal[0],
                title: '升级成会员',
                user: req.session.leveluser,
                info: req.flash('info')
            })
        })
}
exports.postcard = function(req, res) {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(422).json({
            errors: errors.array()
        });
    }
    var card = req.body.card;
    Card.findOne({card: card,status:'notuse'})
        .exec(function(err, card) {
            if(err) {
                console.log(err);
            }
            if(card) {
                User.findOne({username: req.session.leveluser})
                    .exec(function(err, user) {
                        if(err) {
                            console.log(err);
                        }
                        var duedate = user.duedate;
                        if(duedate&&moment(duedate).isAfter(Date.now())) {
                            duedate = moment(duedate).add(card.days, 'days');
                        } else {
                            duedate = moment().add(card.days, 'days');
                        }
                        user.duedate = duedate;
                        user.level = 2;
                        user.save(function(err,newuser){
                            if(err) {
                                console.log(err);
                            }
                            card.status = 'used';
                            card.useby = newuser.username;
                            card.save(function(err) {
                                if(err) {
                                    console.log(err);
                                }
                                req.flash('info', '开通会员成功，会员时间到' + moment(newuser.duedate).format("YYYY MM DD"));
                                return res.redirect("/addcard");
                            })
                        })
                    })
            } else {
                req.flash('info', '对不起卡劵错误或已使用，请重新核对输入');
                return res.redirect("/addcard");
            }
        })
}
exports.getcardtxt = function(req, res) {
    Card.find({status: 'notuse'})
        .exec(function(err, cards){
            if(err) {
                console.log(err);
            }
            res.set({
                'Content-Type': 'application/octet-stream', 
                'Content-Disposition': 'attachment; filename=card.txt'
            });
            var thecards = _.pluck(cards,'card');
            res.send(thecards.join("\n"));
        })
}
exports.updatecategory = function(req, res) {
    var datas = req.body.datas;
    var datasjson = JSON.parse(datas);
    for (let index = 0; index < datasjson.length; index++) {
        const element = datasjson[index];
        Movie.findOne({_id:element.id})
            .exec(function(err, movie) {
                if(err) {
                    console.log(err);
                }
                movie.category = element.category;
                movie.save(function(err) {
                    if(err) {
                        console.log(err);
                    }
                })
            })
    }
    res.json({
        success: 1
    });
}
exports.editcategory = function(req, res) {
    var id = req.params.id;
    Category.findOne({_id: id})
        .exec(function(err, category) {
            if(err) {
                console.log(err);
            }
            res.render('editcategory', {
                title: '编辑分类'+category.title,
                category: category
            })
        })
}
exports.posteditcategory = function(req, res) {
    var id = req.params.id;
    var title = req.body.title;
    var antiurl = req.body.antiurl;
    var open = req.body.open;
    console.log(open);
    Category.findOne({_id:id})
        .exec(function(err, category) {
            if(err) {
                console.log(err);
            }
            Movie.updateMany({category:category.title},{ $set: { category: title }},function(err) {
                if(err) {
                    console.log(err);
                }
            });
            category.title = title;
            category.antiurl = antiurl;
            category.open = open;
            category.save(function(err) {
                if(err) {
                    console.log(err);
                }
                res.redirect("/admin/categories");
            })
        })
}
exports.selectedcategory = function(req, res) {
    var ids = [];
    var category = req.body.category;
    ids = ids.concat(req.body.idarr);
    for (let index = 0; index < ids.length; index++) {
        const id = ids[index];
        Movie.findOne({_id:id})
            .exec(function(err, movie) {
                if(err) {
                    console.log(err);
                }
                movie.category = category;
                movie.save(function(err) {
                    if(err) {
                        console.log(err);
                    }
                })
            })
    }
    res.json({
        success: 1
    });
}
function randomcard() {
    var data = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f","g","A","B","C","D","E","F","G"];
    for (var j = 0; j < 500; j++) {
        var result = "";
        for (var i = 0; i < 20; i++) {
            r = Math.floor(Math.random() * data.length);

            result += data[r];
        }
        return result;
    }
}
function randomcolor(){
    var r=Math.floor(Math.random()*256);
    var g=Math.floor(Math.random()*256);
    var b=Math.floor(Math.random()*256);
    return "rgb("+r+','+g+','+b+")";
}
function deleteall(path) {
    var files = [];
    if (fs.existsSync(path)) {
        files = fs.readdirSync(path);
        files.forEach(function (file, index) {
            var curPath = path + "/" + file;
            if (fs.statSync(curPath).isDirectory()) { // recurse
                deleteall(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
};
function colorRgba (str,n){
    //十六进制颜色值的正则表达式
    var reg = /^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6})$/;
    var sColor = str.toLowerCase();
    //十六进制颜色转换为RGB格式  
    if(sColor && reg.test(sColor)){  
        if(sColor.length === 4){
            var sColorNew = "#";  
            for(var i=1; i<4; i+=1){  //例如：#eee,#fff等
                sColorNew += sColor.slice(i,i+1).concat(sColor.slice(i,i+1));     
            }  
            sColor = sColorNew;  
        }  
        //处理六位颜色值  
        var sColorChange = [];  
        for(var i=1; i<7; i+=2){  
            sColorChange.push(parseInt("0x"+sColor.slice(i,i+2)));    
        }
        return "rgba(" + sColorChange.join(",") + ","+n+")"; 
    }else{  
        return sColor;    
    }
}