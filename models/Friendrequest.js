const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const FriendrequestSchema = new Schema({
    from_user: { type: Schema.Types.ObjectId , ref: 'User'},
    to_user: { type: Schema.Types.ObjectId , ref: 'User'},
    requested_add: { type: Date },
    response_add: { type: Date },
    status: { type: Number,default:0},
    requested_id: { type: Schema.Types.ObjectId , ref: 'User'},
});

module.exports = mongoose.model('Friendrequest', FriendrequestSchema);