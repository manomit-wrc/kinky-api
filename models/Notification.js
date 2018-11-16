const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const schema = new Schema({
    noti_desc: { type: String },
    from_user: {type: Schema.Types.ObjectId, ref: 'User' },
    to_user:{type: Schema.Types.ObjectId, ref: 'User' },
    noti_date:{type: Date},
    read_status:{type: Number,default:0}

});

module.exports = mongoose.model('Notification', schema);