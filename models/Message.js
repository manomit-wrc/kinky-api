const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const MessageSchema = new Schema({
    from_user: { type: Schema.Types.ObjectId , ref: 'User'},
    to_user: { type: Schema.Types.ObjectId , ref: 'User'},
    requested_add: { type: Date },
    read_status: { type: Number,default:0},
    message_text:{type:String},
    requested_id: { type: Schema.Types.ObjectId , ref: 'User'},
});

module.exports = mongoose.model('Message', MessageSchema);
