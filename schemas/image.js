var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ImageSchema = new Schema({
    title: String,
    images: [String],
    poster: String,
    createAt: {
        type: Date
    }
});
ImageSchema.pre('save', function (next) {
    if (!this.createAt) {
        this.createAt = Date.now();
    }
    next();
});
module.exports = ImageSchema;