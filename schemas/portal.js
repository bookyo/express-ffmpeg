var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var portalSchema = new Schema({
    host: String,
    screenshots: Number,
    title: String,
    seotitle: String,
    keywords: String,
    kaiguan: String,
    usersystem: String,
    description: String,
    createAt: {
        type: Date
    }
});
portalSchema.pre('save', function (next) {
    if (!this.createAt) {
        this.createAt = Date.now();
    }
    next();
});
module.exports = portalSchema;