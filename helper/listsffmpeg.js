var ffmpeg = require('fluent-ffmpeg');
var Movie = require('../models/movie');
var Setting = require('../models/setting');
var fs = require('fs');
exports.transcode = function () {
    Movie.findOne({status: 'waiting'})
        .exec(function(err, movie) {
            if(err) {
                console.log(err);
            }
            if(movie) {
                var path = movie.path;
                var id = movie._id;
                var outpath = './public/videos/';
                var des = outpath + id;
                var videoarr = path.split(".");
                videoarr.pop();
                var srtpath = videoarr.join(".") + ".srt";
                fs.exists(des, function (exists) {
                    if (!exists) {
                        fs.mkdir(des, function (err) {
                            if (err) {
                                console.log(err);
                            }
                        })
                    }
                });
                ffmpeg.ffprobe(path, function (err, metadata) {
                    if (err) {
                        console.log(err);
                    }
                    Setting.find()
                        .exec(function (err, setting) {
                            var wmimage = setting[0].wmpath;
                            var hd = setting[0].hd * 1;
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
                            var audiooriginC = "";
                            var tsjiami = setting[0].tsjiami;
                            if (!wmimage || wmimage == "") {
                                wmimage = markdir;
                            }
                            var vf = 'movie=' + wmimage + ' [watermark]; [in][watermark] overlay=main_w-overlay_w [out]';
                            if (hd == 480) {
                                wd = 720;
                            } else if (hd == 1080) {
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
                            if (bitrate < bv) {
                                bv = bitrate;
                                maxrate = bv;
                                bufsize = 2 * bv;
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
                            for (var i = 0; i < videostreams.length; i++) {
                                if (videostreams[i].codec_type == 'audio') {
                                    audiooriginC = videostreams[i].codec_name;
                                    break;
                                }
                            }
                            size = wd + "x" + hd;
                            var srtexists = fs.existsSync(srtpath);
                            if (srtexists) {
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
                            if(tsjiami=='on') {
                                fs.writeFileSync(des+"/key.info",setting[0].host+"/videos/"+id+"/ts.key\n"+des+"/ts.key");
                                var key = randomkey();
                                fs.writeFileSync(des+"/ts.key",key);
                                var jiamiconfig = '-hls_key_info_file '+des+'/key.info';
                                config.push(jiamiconfig);
                            }
                            if (setting[0].miaoqie == "on") {
                                if (videooriginH <= setting[0].hd * 1 && videooriginC == "h264" && audiooriginC == "aac") {
                                    if (srtexists) {
                                        ffmpegtransandchunk(des, path, config, vf, id);
                                    } else {
                                        chunk(path, des, id, config, vf, tsjiami);
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
        })

}

function ffmpegtransandchunk(des, path, config, vf, id) {
    ffmpeg(path)
        .addOptions(config)
        .addOption('-vf', vf)
        .output(des + '/index.m3u8')
        .on('start', function () {
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
            Movie.findOne({_id: id})
                .exec(function(err, movie) {
                    if(err) {
                        console.log(err);
                    }
                    movie.status = "error & failed";
                    movie.save(function(err) {
                        console.log(err);
                    })
                    exports.transcode();
                })
        })
        .on('end', function () {
            screenshots(path, des);
            Movie.findOne({
                    _id: id
                })
                .exec(function (err, movie) {
                    if (err) {
                        console.log(err);
                    }
                    movie.status = "finished";
                    movie.save(function (err) {
                        console.log(err);
                    })
                    exports.transcode();
                })
        })
        .run()
}

function screenshots(path, des) {
    Setting.find()
        .exec(function (err, setting) {
            if (err) {
                console.log(err);
            }
            ffmpeg(path)
                .screenshots({
                    count: setting[0].screenshots,
                    filename: "%i.jpg",
                    folder: des
                })
                .on('end', function () {
                    thumbnails(des,path);
                });
        });
}

function chunk(path, des, id, config, vf, tsjiami) {
    var chunkconfig = [
        '-c copy',
        '-bsf:v h264_mp4toannexb',
        '-hls_time 10',
        '-strict -2',
        '-start_number 0',
        '-hls_list_size 0'
    ];
    if(tsjiami=='on') {
        chunkconfig.push('-hls_key_info_file '+des+'/key.info');
    }
    ffmpeg(path)
        .addOptions(chunkconfig).output(des + "/index.m3u8")
        .on('end', function () {
            screenshots(path, des);
            Movie.findOne({
                    _id: id
                })
                .exec(function (err, movie) {
                    if (err) {
                        console.log(err);
                    }
                    movie.status = "finished";
                    movie.save(function (err) {
                        console.log(err);
                    })
                    exports.transcode();
                })
        })
        .on('error', function (err, stdout, stderr) {
            console.log('Cannot chunk video: ' + err.message);
            deleteall(des);
            ffmpegtransandchunk(des, path, config, vf, id);
        })
        .on("start", function () {
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

function thumbnails(des, path) {
    var exec = require('child_process').exec; 
    var cmdStr = 'dplayer-thumbnails -o '+des+'/thumbnails.jpg -q 60 '+path;
    exec(cmdStr, function(err,stdout,stderr){
    if(err) {
      console.log('thumbnails error:'+stderr);
    } 
    console.log(`stdout: ${stdout}`);
    if(stdout.match(/Done/)) {
        fs.unlinkSync(path);
    }
    });
}
function randomkey() {
    var data = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f","g","A","B","C","D","E","F","G"];
    for (var j = 0; j < 500; j++) {
        var result = "";
        for (var i = 0; i < 16; i++) {
            r = Math.floor(Math.random() * data.length);

            result += data[r];
        }
        return result;
    }
}