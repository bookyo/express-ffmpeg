var auth = require("../config/auth");
var Admincontroller = require("../controller/admin");
var multer = require('multer');
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './movies');
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});
var upload = multer({
  storage: storage
});
module.exports = function(app) {
    app.get('/hlsserver', checkNotLogin, function(req, res, next) {
      res.render('hlsserver', {
        title: '云转码切片服务平台'
      });
    });
    app.post("/hlsserver", checkNotLogin, function(req, res) {
      var user = req.sanitize('user').trim();
      var password = req.sanitize('password').trim();
      if(user == auth.user && password == auth.password) {
        req.session.user = user;
        res.redirect("/admin");
      } else {
        res.redirect('https://baidu.com');
      }
    });
    function posttimeout (req, res, next) {
      req.setTimeout(10000, function() {
        res.statusCode = 500;
        return res.json({
          success: 0
        });
      });
      next();
    };
    app.get("/admin", checkLogin, Admincontroller.getadmin);
    app.get("/admin/upload", checkLogin, Admincontroller.getupload);
    app.get("/admin/movies", checkLogin, Admincontroller.getmovies);
    app.post("/upzimu", checkLogin, upload.single('zimu'), Admincontroller.postzimu);
    app.post("/upload", checkLogin, posttimeout, upload.single('file'), Admincontroller.postupload);
    app.post("/transcode", checkLogin, Admincontroller.transcode);
    app.delete("/delete/movie", checkLogin, Admincontroller.delete);
    app.get("/share/:id", Admincontroller.getmovie);
    app.get("/admin/setting", checkLogin, Admincontroller.setting);
    app.post("/admin/setting", checkLogin, Admincontroller.postsetting);
    app.post("/ruku", checkLogin, Admincontroller.ruku);
    app.get("/playmagnet", Admincontroller.playmagnet);
    var storage1 = multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, './public/mark');
      },
      filename: function (req, file, cb) {
        cb(null, file.originalname);
      }
    });
    var upload1 = multer({
      storage: storage1
    });
    app.post("/upwm", checkLogin, upload1.single('img'), Admincontroller.uploadwatermark);
    var storage2 = multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, './public/videos/');
      },
      filename: function (req, file, cb) {
        cb(null, file.originalname);
      }
    });
    var upload2 = multer({
      storage: storage2
    });
    app.post("/upvtt", checkLogin, upload2.single('vtt'), Admincontroller.uploadvtt);
    function checkLogin(req, res, next) {
      if( !req.session.user ) {
        return res.redirect('/hlsserver');
      }
      next();
    }

    function checkNotLogin(req, res, next) {
      if(req.session.user) {
        return res.redirect('/admin');
      }
      next();
    }
};
