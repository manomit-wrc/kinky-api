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
    alert_setting: [{ type: String }],
    preferred_introduction: { type: String },
    own_introduction: { type: String },
    profile_protection: { type: Number },
    gender: [{ type: String }],
    from_age: { type: Number }, 
    to_age: { type: Number },
    distance: { type: Number },
    country: { type: Schema.Types.ObjectId, ref: 'Country' },
    state: { type: Schema.Types.ObjectId, ref: 'State'  },
    contactmember: [{ type: String }],
    explicit_content: { type: Boolean,default:true },
    profile_setting: { type: Number },
    instant_msg: { type: Number },
    auto_reply_subject: { type: String },
    auto_reply_body: { type: String },
    enable_auto_reply: { type: Boolean },
    promotion: { type: String },
    promotion_chk: { type: Boolean }

});

module.exports = mongoose.model('Setting', SettingSchema);