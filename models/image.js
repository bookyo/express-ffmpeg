var mongoose = require('mongoose');
var ImageSchema = require('../schemas/image');
var Image = mongoose.model('Image', ImageSchema);

module.exports = Image;