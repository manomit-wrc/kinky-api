const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const PostSchema = new Schema({
    user: { type: Schema.Types.ObjectId , ref: 'User'},
    add_time:{ type: Date },
    description:{type:String},
    user_distance:{type:Number},
    like:[{type: Schema.Types.ObjectId , ref: 'User'}],
    comments:[
        {
            comments_by:{type: Schema.Types.ObjectId , ref: 'User'},
            comment_text:{type:String},
            add_time:{ type: Date },
         }
],
    content:{type:String},
    org_content:{type:String},
    content_nudity:{type:String},
    content_type:{type:String}
});

module.exports = mongoose.model('Post', PostSchema);
