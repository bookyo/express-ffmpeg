var ffmpeg = require('fluent-ffmpeg');
var fs = require('fs');
var Movie = require('../models/movie');
exports.cuthead = function(movie,duration) {
  var duration = duration;
  var des = './movies';
  var path = movie.path;
  var originalname = movie.originalname;
  var namearr = originalname.split('.');
  var houzhui = namearr[namearr.length - 1];
  namearr.pop();
  var moviename = namearr.join('.')+'cut.'+houzhui;
  ffmpeg(path)
      .addInputOption('-ss',duration)
      .addOption('-c', 'copy')
      .output(des + '/'+ moviename)
      .on('error', function (err, stdout, stderr) {
          console.log('Cannot cut video: ' + path + err.message);
      })
      .on('end', function () {
          Movie.findOne({_id:movie._id})
              .exec(function(err, movie) {
                if(err) {
                  console.log(err);
                }
                movie.originalname = moviename;
                movie.path = des + '/'+ moviename;
                movie.save(function(err) {
                  if(err) {
                    console.log(err);
                  }
                  fs.unlinkSync(path);;
                })
              })
      })
      .run()
}