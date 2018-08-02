var ffmpeg = require('fluent-ffmpeg');
var Movie = require('../models/movie');
var Setting = require('../models/setting');
var path = require("path");
var fs = require('fs');
exports.transcode = function(movie,cb){
    var path = movie.path;
    var id = movie._id;
    var outpath = './public/videos/';
    var des = outpath + id;
    var videoarr = path.split(".");
    videoarr.pop();
    var srtpath = videoarr.join(".")+".srt";
    fs.exists(des, function(exists){
        if(!exists){
            fs.mkdir(des,function(err) {
                if(err) {
                    console.log(err);
                } 
            })
        }
    });
    ffmpeg.ffprobe(path,function(err,metadata){
        if(err) {
            console.log(err);
        }
        Setting.find()
            .exec(function(err, setting) {
                var wmimage = setting[0].wmpath;
                var hd = setting[0].hd*1;
                var videometa = metadata.streams[0];
                var size = "";
                var bv = "500k";
                var bufsize = "500k";
                var maxrate = "600k";
                var vf = 'movie=' + wmimage + ' [watermark]; [in][watermark] overlay=main_w-overlay_w [out]';
                if (hd==480) {
                    size = "720x480";
                } else if (hd==1080) {
                    size = "1920x1080";
                    bv = "2000k";
                    bufsize = "2000k";
                    maxrate = "2600k";
                } else {
                    size = "1280x720";
                    bv = "1000k";
                    bufsize = "1000k";
                    maxrate = "1400k";
                }
                var srtexists = fs.existsSync(srtpath);
                if(srtexists) {
                    vf = 'movie=' + wmimage + ' [watermark]; [in][watermark] overlay=main_w-overlay_w,subtitles=' + srtpath + '[out]';
                }
                if (videometa.height <= hd) {
                    size = videometa.width + "x" + videometa.height;
                }
                if(setting[0].miaoqie == "on") {
                    var videowidth;
                    if(hd == 480) {
                        videowidth = 720;
                    } else if(hd == 1080) {
                        videowidth = 1920;
                    } else {
                        videowidth = 1280;
                    }
                    if (videometa.width <= videowidth && metadata.streams[0].codec_name == "h264") {
                        if(srtexists) {
                            ffmpegtrans(path, des, size, bv, bufsize, maxrate, vf, id, cb);
                        } else {
                            chunk(path, des, id);
                        }
                    } else {
                        ffmpegtrans(path, des, size, bv, bufsize, maxrate, vf, id, cb);
                    }
                } else {
                    ffmpegtrans(path, des, size, bv, bufsize, maxrate, vf, id, cb);
                }
                // }
            })
    });
    
}
function ffmpegtrans(path, des, size, bv, bufsize, maxrate, vf, id, cb){
    ffmpeg(path)
    .addOptions([
        '-s '+size,
        '-b:v '+bv,
        '-vcodec libx264',
        '-acodec aac',
        '-ac 2',
        '-b:a 128k',
        '-bufsize '+bufsize,
        '-maxrate '+maxrate,
        '-q:v 6',
        '-strict -2'
    ])
    .addOption('-vf', vf)
    .output(des + '/index.mp4')
        .on('start',cb)
        .on('error', function(err, stdout, stderr) {
            console.log('Cannot process video: ' + err.message);
        })
        .on('end', function(){
            chunk(des + "/index.mp4", des, id);
        })
        .run()
}
function chunk(path, des, id) {
    ffmpeg(path)
        .addOptions([
            '-start_number 0',
            '-hls_time 10',
            '-hls_list_size 0',
            '-f hls',
            '-strict -2'
        ]).output(des+"/index.m3u8")
            .on('end', function() {
                Movie.findOne({_id:id})
                .exec(function(err,movie){
                    if(err){
                        console.log(err);
                    }
                    fs.unlinkSync(movie.path);
                    fs.exists(des+"/index.mp4", function(exists) {
                        if(exists) {
                            fs.unlinkSync(des + '/index.mp4');
                        }
                    });
                    movie.status = "finished";
                    movie.save(function(err){
                        console.log(err);
                    })
                })
            })
            .on('error', function(err, stdout, stderr) {
              console.log('Cannot chunk video: ' + err.message);
            })
            .on("start", function(){
                screenshots(path, des);
                Movie.findOne({_id:id})
                    .exec(function(err,movie) {
                        if(err) {
                            console.log(err);
                        }
                        console.log("chunking");
                        movie.status = "chunking";
                        movie.save(function(err) {
                            console.log(err);
                        })
                    });
            })
            .run()
}

function screenshots(path,des) {
    ffmpeg(path)
        .screenshots({
            count:4,
            filename: "%i.jpg",
            folder:des
        });
}
