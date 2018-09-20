const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const SettingSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    mobile: { type: String },
    language: { type: String },
    timezone: { type: String },
    switch_account: { type: Number },
    delete_account: { type: Number },
    other_delete_reason: { type: String },
    newsletter: { type: Boolean,default:false },
    message: { type: Boolean,default:false },
    preferred_introduction: { type: String },
    own_introduction: { type: String },
    profile_protection: { type: Number },
    looking_for_male: { type: Boolean,default:false },
    looking_for_female: { type: Boolean,default:false },
    looking_for_couple: { type: Boolean,default:false },
    looking_for_cd: { type: Boolean,default:false },
    interest_match: { type: Boolean,default:false },
    live_country: { type: Boolean,default:false },
    from_age: { type: Number }, 
    to_age: { type: Number },
    distance: { type: Number },
    country: { type: String },
    state: { type: String  },
    explicit_content: { type: Boolean,default:false },
    profile_setting: { type: Number },
    instant_msg: { type: Number },
    auto_reply_subject: { type: String },
    auto_reply_body: { type: String },
    enable_auto_reply: { type: Boolean },
    promotion: { type: String },
    promotion_chk: { type: Boolean }

});

module.exports = mongoose.model('Setting', SettingSchema);