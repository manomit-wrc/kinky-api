const mongoose = require('mongoose');

const { Schema } = mongoose;

const userSchema = new Schema({
    first_name: { type: String, default: '' },
    last_name: { type: String, default: '' },
    username: { type: String, default: '' },
    email: { type: String, required: true, unique: true },
    dd: { type: String },
    mm: { type: String },
    yyyy: { type: String },
    phone_number : {type: Number},
    password: { type: String },
    avatar: { type: String },
    gender: { type: String },
    looking_for:  [{ type: String }],
    timezone: { type: String },
    sexuality: { type: String },
    country: { type: String },
    state: { type: String  },
    description: { type: String, default: '' },
    headline: { type: String, default: '' },
    location: { type: Schema.Types.ObjectId, ref: 'Location' },
    ethnicity: { type: Schema.Types.ObjectId, ref: 'Ethnicity'},
    height: { type: Schema.Types.ObjectId, ref: 'Height' },
    build: { type: Schema.Types.ObjectId, ref: 'Build' },
    hair: { type: Schema.Types.ObjectId, ref: 'HairColor' },
    body_hair: { type: Schema.Types.ObjectId, ref: 'BodyHair' },
    body_decoration: [{ type: String }],
    drink: { type: String, default: '' },
    drugs: { type: String, default: '' },
    smoke: { type: String, default: '' },
    size: { type: String, default: '' },
    safe_sex: { type: String, default: '' },
    interested_in: [{ type: String }],
    age_range: [{ type: String }],
    travel_arrangment: [{ type: String}],
    purpose: { type: String, default: '' },
    images: [
        {
            url: { type: String },
            altTag: { type: String },
            access: { type: String, default: 'Public'}
        }
    ],
    videos: [
        {
            url: { type: String },
            altTag: { type: String },
            access: { type: String, default: 'Public'}
        }
    ],
    status: { type: Number, default: 1},
    email_verified: { type: Number, default: 0},
    activation_link: { type: String },
    created_at : { type: Date, default : Date.now()}

});

module.exports = mongoose.model('User', userSchema);
