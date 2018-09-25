var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var playerSchema = new Schema({
    kaiguan: String,
    mark: String,
    position: String,
    markx: Number,
    marky: Number,
    wenzikaiguan: String,
    text: String,
    font: String,
    fontsize: Number,
    opacity: Number,
    link: String,
    color: String,
    bold: String,
    underline: String,
    italic: String,
    wenzix: Number,
    wenziy: Number,
    p2p: String,
    waplock: String,
    locktip: String,
    wenziposition: String,
    wenzibackground: String,
    wenzibackgroundopacity: Number,
    tongji: String,
    createAt: {
        type: Date
    }
});
playerSchema.pre('save', function (next) {
    if (!this.createAt) {
        this.createAt = Date.now();
    }
    next();
});
module.exports = playerSchema;