var Movie = require('../models/movie');
var Setting = require("../models/setting");
var FFmpeghelper = require('../helper/ffmpeg');
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
    req.setTimeout(50000000000);
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
    Movie
        .find()
        .limit(perPage)
        .skip(perPage * (page-1))
        .exec(function(err, movies) {
            if(err) {
                console.log(err);
            }
            Movie.find().count(function (err, count){
                res.render("movies", {
                    user: req.session.user,
                    title: "全部电影库",
                    movies: movies,
                    page: page,
                    pages: Math.ceil(count / perPage)
                })
            })
            
        })
    
}

exports.transcode = function(req, res) {
    Movie
        .find({status:"waiting"})
        .exec(function(err, movies){
            if(err){
                console.log(err);
            }
            for (let i = 0; i < movies.length; i++) {
                FFmpeghelper.transcode(movies[i],function(){
                    Movie.findOne({_id:movies[i]._id})
                        .exec(function(err,movie){
                            if(err){
                                console.log(err);
                            }
                            console.log("transcoding");
                            movie.status = "transcoding";
                            movie.save(function(err) {
                                console.log(err);
                                res.json({
                                    success: 1
                                });
                            })
                        })
                });
            }
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
                })
                res.json({success:1});
            })
         });
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
                    wmpath: ""
                }
            }
            res.render("setting",{
                user: req.session.user,
                title: "云转码设置",
                setting: newset
            })
        })
    
}

exports.postsetting = function(req, res) {
    var host = req.body.host;
    var hd = req.body.hd;
    var antiurl = req.body.antiurl;
    var antikey = req.body.key;
    var wmpath = req.body.watermark;
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