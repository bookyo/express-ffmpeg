var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var MovieSchema = new Schema({
    status: String,
    size: String,
    category: String,
    originalname: String,
    count: {type:Number, default: 0},
    path:String,
    createAt: {
        type: Date
    }
});
MovieSchema.pre('save', function (next) {
    if (!this.createAt) {
        this.createAt = Date.now();
    }
    next();
});
module.exports = MovieSchema;