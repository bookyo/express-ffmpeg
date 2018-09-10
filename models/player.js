var mongoose = require('mongoose');
var PlayerSchema = require('../schemas/player');
var Player = mongoose.model('Player', PlayerSchema);

module.exports = Player;