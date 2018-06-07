var mongoose = require('mongoose');
var SettingSchema = require('../schemas/setting');
var Setting = mongoose.model('Setting', SettingSchema);

module.exports = Setting;