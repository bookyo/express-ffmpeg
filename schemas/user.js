var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var UserSchema = new Schema({
    username: String,
    email: String,
    password: String,
    level: { type: Number, default: 1},
    duedate: Date,
    createAt: {
        type: Date
    }
});
UserSchema.pre('save', function (next) {
    if (!this.createAt) {
        this.createAt = Date.now();
    }
    next();
});
module.exports = UserSchema;