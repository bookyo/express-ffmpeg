var ffmpeg = require('fluent-ffmpeg');
var Movie = require('../models/movie');
var Setting = require('../models/setting');
var fs = require('fs');
exports.transcode = function(movie,cb){
    var path = movie.path;
    var id = movie._id;
    var outpath = './public/videos/';
    var des = outpath + id;
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
                console.log(wmimage);
                var hd = setting[0].hd*1;
                var videometa = metadata.streams[0];
                var size = "";
                var bv = "500k";
                var bufsize = "500k";
                var maxrate = "600k";
                if (hd==480) {
                    size = "720x480";
                } else {
                    size = "1280x720";
                    bv = "1000k";
                    bufsize = "1000k";
                    maxrate = "1400k";
                }
                // var codename = metadata.streams[0].codec_name;
                if (videometa.height <= hd) {
                    size = videometa.width + "x" + videometa.height;
                }
                // if (videometa.height <= hd && codename == "h264") {
                //     chunk(path,des,function(){
                //         Movie.findOne({_id:id})
                //             .exec(function(err,movie){
                //                 if(err){
                //                     console.log(err);
                //                 }
                //                 fs.unlinkSync(path);
                //                 movie.status = "finished";
                //                 movie.save(function(err){
                //                     console.log(err);
                //                 })
                //             })
                //     })
                // } else {
                ffmpeg(path)
                .addOptions([
                    '-s '+size,
                    '-b:v '+bv,
                    '-vcodec h264',
                    '-acodec aac',
                    '-ac 2',
                    '-b:a 128k',
                    '-bufsize '+bufsize,
                    '-maxrate '+maxrate,
                    '-q:v 6'
                ])
                .addOption('-vf', 'movie='+wmimage+' [watermark]; [in][watermark] overlay=main_w-overlay_w [out]')
                .output(des + '/index.mp4')
                    .on('start',cb)
                    .on('end', function(){
                        chunk(des + '/index.mp4', des, function () {
                            Movie.findOne({_id:id})
                                .exec(function(err,movie){
                                    if(err){
                                        console.log(err);
                                    }
                                    fs.unlinkSync(path);
                                    fs.unlinkSync(des + '/index.mp4');
                                    movie.status = "finished";
                                    movie.save(function(err){
                                        console.log(err);
                                    })
                                })
                        })
                    })
                    .run()
                // }
            })
    });
    
}

function chunk(path,des,cb) {
    ffmpeg(path)
        .addOptions([
            '-start_number 0',
            '-hls_time 10',
            '-hls_list_size 0',
            '-f hls'
        ]).output(des+'/index.m3u8')
            .on('end', cb)
            .run()
}
