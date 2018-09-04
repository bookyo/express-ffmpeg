var mongoose = require('mongoose');
var PortalSchema = require('../schemas/portal');
var Portal = mongoose.model('Portal', PortalSchema);

module.exports = Portal;