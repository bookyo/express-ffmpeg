var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var MovieSchema = new Schema({
    status: String,
    size: String,
    originalname: String,
    path:String,
    createAt: {
        type: Date,
        default: Date.now()
    }
});
MovieSchema.pre('save', function (next) {
    if (!this.createAt) {
        this.createAt = Date.now();
    }
    next();
});
module.exports = MovieSchema;