const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const TimezoneSchema = new Schema({
    label: { type: String },
    name: { type: String }
});

module.exports = mongoose.model('Timezone', TimezoneSchema);