const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const PostSchema = new Schema({
    user: { type: Schema.Types.ObjectId , ref: 'User'},
    add_time:{ type: Date },
    description:{type:String},
    like:[{
        like_by:{type: Schema.Types.ObjectId , ref: 'User'},
        count:{type:Boolean}
    }]
});

module.exports = mongoose.model('Post', PostSchema);