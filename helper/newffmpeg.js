var ffmpeg = require('fluent-ffmpeg');
var Movie = require('../models/movie');
var Setting = require('../models/setting');
var fs = require('fs');
exports.transcode = function(movie){
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
            var wd = 0;
            var markdir = "./public/mark/mark.png";
            var videometa = metadata.format;
            var videostreams = metadata.streams;
            var bitrate = Math.floor(videometa.bit_rate / 1000);
            var size = "";
            var bv = 500;
            var bufsize = 1000;
            var maxrate = 500;
            var config = [];
            var videooriginH = 0;
            var videooriginC = "";
            if(!wmimage || wmimage == "") {
                wmimage = markdir;
            }
            var vf = 'movie=' + wmimage + ' [watermark]; [in][watermark] overlay=main_w-overlay_w [out]';
            if (hd==480) {
                wd = 720;
            } else if (hd==1080) {
                wd = 1920;
                bv = 2000;
                bufsize = 4000;
                maxrate = 2000;
            } else {
                wd = 1280;
                bv = 1000;
                bufsize = 2000;
                maxrate = 1000;
            }
            if(bitrate < bv) {
                bv = bitrate;
                maxrate = bv;
                bufsize = 2*bv;
            }
            for (var i = 0; i < videostreams.length; i++) {
                if (videostreams[i].codec_type == 'video') {
                    if (videostreams[i].height <= hd) {
                        hd = videostreams[i].height;
                    }
                    if (videostreams[i].width <= wd) {
                        wd = videostreams[i].width;
                    }
                    videooriginH = videostreams[i].height;
                    videooriginC = videostreams[i].codec_name;
                    break;
                }
            }
            size = wd + "x" + hd;
            var srtexists = fs.existsSync(srtpath);
            if(srtexists) {
                vf = 'movie=' + wmimage + ' [watermark]; [in][watermark] overlay=main_w-overlay_w,subtitles=' + srtpath + '[out]';
            }
            config = [
                '-s ' + size,
                '-b:v ' + bv + "k",
                '-vcodec libx264',
                '-acodec aac',
                '-ac 2',
                '-b:a 128k',
                '-bufsize ' + bufsize + "k",
                '-maxrate ' + maxrate + "k",
                '-q:v 6',
                '-strict -2',
                '-start_number 0',
                '-hls_time 10',
                '-hls_list_size 0',
                '-f hls'
            ];
            if(setting[0].miaoqie == "on") {
                if (videooriginH <= setting[0].hd * 1 && videooriginC == "h264") {
                    if(srtexists) {
                        ffmpegtransandchunk(des, path, config, vf, id);
                    } else {
                        chunk(path, des, id, config, vf);
                    }
                } else {
                    ffmpegtransandchunk(des, path, config, vf, id);
                }
            } else {
                ffmpegtransandchunk(des, path, config, vf, id);
            }
        });
})

}

function ffmpegtransandchunk(des, path, config, vf, id) {
    ffmpeg(path)
        .addOptions(config)
        .addOption('-vf', vf)
        .output(des + '/index.m3u8')
        .on('start', function () {
            screenshots(path, des);
            Movie.findOne({
                    _id: id
                })
                .exec(function (err, movie) {
                    if (err) {
                        console.log(err);
                    }
                    movie.status = "trans&chunk";
                    movie.save(function (err) {
                        console.log(err);
                    })
                });
        })
        .on('error', function (err, stdout, stderr) {
            console.log('Cannot process video: ' + path + err.message);
        })
        .on('end', function () {
            Movie.findOne({
                    _id: id
                })
                .exec(function (err, movie) {
                    if (err) {
                        console.log(err);
                    }
                    fs.unlinkSync(movie.path);
                    movie.status = "finished";
                    movie.save(function (err) {
                        console.log(err);
                    })
                })
        })
        .run()
}
function screenshots(path, des) {
    Setting.find()
        .exec(function(err, setting) {
            if(err) {
                console.log(err);
            }
            ffmpeg(path)
                .screenshots({
                    count: setting[0].screenshots,
                    filename: "%i.jpg",
                    folder: des
                });
        });  
}
function chunk(path, des, id, config, vf) {
    ffmpeg(path)
        .addOptions([
            '-codec copy',
            '-vbsf h264_mp4toannexb',
            '-map 0',
            '-f segment',
            '-segment_list ' + des + '/index.m3u8',
            '-segment_time 10',
            '-strict -2'
        ]).output(des + "/index%d.ts")
        .on('end', function () {
            Movie.findOne({
                    _id: id
                })
                .exec(function (err, movie) {
                    if (err) {
                        console.log(err);
                    }
                    fs.unlinkSync(movie.path);
                    movie.status = "finished";
                    movie.save(function (err) {
                        console.log(err);
                    })
                })
        })
        .on('error', function (err, stdout, stderr) {
            console.log('Cannot chunk video: ' + err.message);
            deleteall(des);
            ffmpegtransandchunk(des, path, config, vf, id);
        })
        .on("start", function () {
            screenshots(path, des);
            Movie.findOne({
                    _id: id
                })
                .exec(function (err, movie) {
                    if (err) {
                        console.log(err);
                    }
                    console.log("chunking");
                    movie.status = "chunking";
                    movie.save(function (err) {
                        console.log(err);
                    })
                });
        })
        .run()
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