const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const ReviewSchema = new Schema({
    from_user: { type: Schema.Types.ObjectId , ref: 'User'},
    to_user: { type: Schema.Types.ObjectId , ref: 'User'},
    requested_add: { type: Date },
    response_add: { type: Date },
    comment: { type: String},
    requested_id: { type: Schema.Types.ObjectId , ref: 'User'},
});

module.exports = mongoose.model('Review', ReviewSchema);