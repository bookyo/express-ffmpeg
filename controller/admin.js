var Movie = require('../models/movie');
var Setting = require("../models/setting");
var Fenfa = require("../models/fenfa");
var FFmpeghelper = require('../helper/newffmpeg');
var Category = require("../models/category");
var Portal = require("../models/portal");
var fs = require('fs');
var jwt = require('jsonwebtoken');
var path = require('path');
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
    var path = filename.split(".")[0];
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
    var perPage = 10;
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
exports.getmovie = function(req, res) {
    var id = req.params.id;
    Movie.findOne({_id:id})
        .exec(function(err,movie){
            if(err) {
                console.log(err);
            }
            if(!movie) {
                res.statusCode = 404;
                return res.send("对不起，此页面不存在");
            }
            Setting.find()
                .exec(function(err, setting){
                    if(err) {
                        console.log(err);
                    }
                    var token = jwt.sign({access: "view"},setting[0].antikey,{expiresIn: '1h'});
                    res.render("movie",{
                        user:req.session.user,
                        title: movie.originalname+"在线播放",
                        id:id,
                        token: token,
                        antiurl: setting[0].antiurl
                    })
                })
        })
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
                    antiurl: "",
                    antikey: "",
                    wmpath: "",
                    miaoqie: "",
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
    console.log(kaiguan);
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
    var antikey = req.body.key;
    var wmpath = req.body.watermark;
    var miaoqie = req.body.miaoqie;
    var screenshots = req.body.screenshots;
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
                setting[0].antiurl = antiurl;
                setting[0].miaoqie = miaoqie;
                setting[0].screenshots = screenshots;
                setting[0].save(function(err) {
                    if(err) {
                        console.log(err);
                    }
                });
            } else {
                var settingobj = {
                    host: host,
                    hd: hd,
                    antiurl: antiurl,
                    antikey: antikey,
                    miaoqie: miaoqie,
                    screenshots: screenshots,
                    wmpath: wmpath
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
                    host: '',
                    screenshots: 0,
                    keywords: '',
                    description: ''
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
    var description = req.body.description;
    Portal.find()
        .exec(function(err, portals) {
            if(err) {
                console.log(err);
            }
            if(portals.length>0) {
                portals[0].screenshots = screenshots;
                portals[0].host = host;
                portals[0].title = title;
                portals[0].seottile = seotitle;
                portals[0].kaiguan = kaiguan;
                portals[0].keywords = keywords;
                portals[0].description = description;
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
                    description: description,
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