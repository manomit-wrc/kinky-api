const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const PasswordChangeRequestsSchema = new Schema({
    email: { type: String },
    activation_id: { type: String },
    status: { type: Number, default: 0 },
    requested_date: { type: Date, default : Date.now() }
});

module.exports = mongoose.model('PasswordChangeRequests', PasswordChangeRequestsSchema);