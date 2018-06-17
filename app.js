var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var config = require("./config/auth");
var session = require('express-session');
var flash = require('connect-flash');
var jwt = require('jsonwebtoken');
var expressValidator = require('express-validator');
var mongoose = require("mongoose");
var MongoStore = require('connect-mongo')(session);
var routes = require('./routes/index');
var app = express();
mongoose.connect("mongodb://" + config.dbuser + ":"+config.dbpassword+"@127.0.0.1/"+config.db);
var Setting = require('./models/setting');
// view engine setup
app.use("/videos/*/index.m3u8", function(req, res, next){
  var token = req.query.token;
  Setting.find()
      .exec(function(err, setting) {
        if(err) {
          console.log(err);
        }
        jwt.verify(token, setting[0].antikey, function (err, decoded) {
          if(err) {
            console.log(err);
            res.statusCode = 404;
            return res.send("对不起，您没有权限");
          }
          if(decoded.access == "view"){
            next();
          }
        })
      });
});
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(expressValidator());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: "hlsccccc",
  resave: true,
  saveUninitialized: false,
  key: "hls",
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 30
  }, //30day
  store: new MongoStore({
    url: 'mongodb://' + config.dbuser + ':'+config.dbpassword+'@127.0.0.1/'+config.db
  })
}));
app.use(function (req, res, next) {
  res.locals.createPagination = function (pages, page) {
    var url = require('url'),
      qs = require('querystring'),
      params = qs.parse(url.parse(req.url).query),
      str = '',
      list_len = 2,
      total_list = list_len * 2 + 1,
      j = 1,
      pageNo = parseInt(page);
    if (pageNo >= total_list) {
      j = pageNo - list_len;
      total_list = pageNo + list_len;
      if (total_list > pages) {
        total_list = pages;
      }
    } else {
      j = 1;
      if (total_list > pages) {
        total_list = pages;
      }
    }
    params.page = 0
    for (j; j <= total_list; j++) {
      params.page = j
      clas = pageNo == j ? "active" : "no"
      str += '<li class="' + clas + '"><a href="?' + qs.stringify(params) + '">' + j + '</a></li>'
    }
    return str
  }
  next();
});
app.use(flash());
// app.use(function (req, res, next) {
//   res.setTimeout(480000, function () { // 4 minute timeout adjust for larger uploads
//     console.log('Request has timed out.');
//     res.send(408);
//   });

//   next();
// });
routes(app);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
