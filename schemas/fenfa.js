var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var fenfaSchema = new Schema({
    kaiguan: String,
    domains: [String],
    createAt: {
        type: Date,
        default: Date.now()
    }
});
fenfaSchema.pre('save', function (next) {
    if (!this.createAt) {
        this.createAt = Date.now();
    }
    next();
});
module.exports = fenfaSchema;