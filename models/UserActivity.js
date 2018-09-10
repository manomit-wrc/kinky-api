const mongoose = require('mongoose');

const { Schema } = mongoose;

const useractivitySchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    status: { type: Number, default: '' },
    ip:{ type: String, default: '0.0.0.0' },
    created_at : { type: Date, default : Date.now()}

});

module.exports = mongoose.model('UserActivity', useractivitySchema);
