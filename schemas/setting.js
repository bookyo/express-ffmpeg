var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var SettingSchema = new Schema({
    host: String,
    hd: String,
    antiurl: String,
    antikey: String,
    wmpath: String,
    createAt: {
        type: Date,
        default: Date.now()
    }
});
SettingSchema.pre('save', function (next) {
    if (!this.createAt) {
        this.createAt = Date.now();
    }
    next();
});
module.exports = SettingSchema;