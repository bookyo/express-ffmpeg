var redis = require('redis');
var client = redis.createClient();
var jwt = require('jsonwebtoken');
var Setting = require('../models/setting');
exports.getTokenByRedis = function(cb) {
  getTokenFromRedis(function(err, token) {
    if(err) {
      console.log(err);
    }
    if(!token) {
      getMoviesFromJwt(function(err, token) {
        if(err) {
          console.log(err)
        }
        return cb(null, token);
      })
    } else {
      return cb(null, token);
    }
  })
}
function getMoviesFromJwt(cb) {
  Setting.find()
      .exec(function(err, setting) {
        if(err) {
          cb(err, null);
        }
        var token = jwt.sign({access: "view"},setting[0].antikey,{expiresIn: '100s'});
        client.setex('token',99,token);
        cb(null, token);
      })
}
function getTokenFromRedis(cb) {
  client.get('token', function(err, token) {
    if(err) {
      console.log(err);
    }
    return cb(err, token);
  })
}