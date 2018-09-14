var mongoose = require('mongoose');
var CardSchema = require('../schemas/card');
var Card = mongoose.model('Card', CardSchema);

module.exports = Card;