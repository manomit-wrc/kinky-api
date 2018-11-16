const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const StateSchema = new Schema({
    name: { type: String },
    country: { type: Schema.Types.ObjectId , ref: 'Country'}
});

module.exports = mongoose.model('State', StateSchema);