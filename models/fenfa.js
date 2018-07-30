var mongoose = require('mongoose');
var FenfaSchema = require('../schemas/fenfa');
var Fenfa = mongoose.model('Fenfa', FenfaSchema);

module.exports = Fenfa;