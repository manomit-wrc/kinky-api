const mongoose = require('mongoose');

const { Schema } = mongoose;

const userSchema = new Schema({
    first_name: { type: String, default: '' },
    last_name: { type: String, default: '' },
    username: { type: String, default: '' },
    email: { type: String, required: true, unique: true },
    dd: { type: String },
    dd_female: { type: String },
    mm: { type: String },
    mm_female: { type: String },
    yyyy: { type: String },
    yyyy_female: { type: String },
    phone_number : {type: Number},
    password: { type: String },
    avatar: { type: String },
    gender: { type: String },
    looking_for:  [{ type: String }],
    looking_for_male: {type:Boolean},
    looking_for_female: {type:Boolean},
    looking_for_couple: {type:Boolean},
    looking_for_cd: {type:Boolean},
    timezone: { type: String },
    sexuality: { type: String },
    sexuality_female: { type: String },
    country: { type: String },
    state: { type: String  },
    description: { type: String, default: '' },
    headline: { type: String, default: '' },
    location: { type: Schema.Types.ObjectId, ref: 'Location' },
    ethnicity: { type: Schema.Types.ObjectId, ref: 'Ethnicity'},
    ethnicity_female: { type: Schema.Types.ObjectId, ref: 'Ethnicity'},
    height: { type: Schema.Types.ObjectId, ref: 'Height' },
    height_female: { type: Schema.Types.ObjectId, ref: 'Height' },
    build: { type: Schema.Types.ObjectId, ref: 'Build' },
    build_female: { type: Schema.Types.ObjectId, ref: 'Build' },
    hair: { type: Schema.Types.ObjectId, ref: 'HairColor' },
    hair_female: { type: Schema.Types.ObjectId, ref: 'HairColor' },
    body_hair: { type: Schema.Types.ObjectId, ref: 'BodyHair' },
    body_hair_female: { type: Schema.Types.ObjectId, ref: 'BodyHair' },
    body_decoration: [{ type: String }],
    body_decoration_female: [{ type: String }],
    drink: { type: String, default: '' },
    drink_female: { type: String, default: '' },
    drugs: { type: String, default: '' },
    drugs_female: { type: String, default: '' },
    smoke: { type: String, default: '' },
    smoke_female: { type: String, default: '' },
    size: { type: String, default: '' },
    size_female: { type: String, default: '' },
    safe_sex: { type: String, default: '' },
    safe_sex_female: { type: String, default: '' },
    interested_in: [{ type: String }],
    age_range: [{ type: String }],
    travel_arrangment: [{ type: String}],
    purpose: { type: String, default: '' },
    images: [
        {
            url: { type: String },
            altTag: { type: String },
            access: { type: String, default: 'Private'}
        }
    ],
    videos: [
        {
            url: { type: String },
            altTag: { type: String },
            access: { type: String, default: 'Private'}
        }
    ],
    friends: [
        {
            friend: { type: Schema.Types.ObjectId, ref: 'User' },
            request_by: { type: Schema.Types.ObjectId, ref: 'User' },
            status: { type: Number, default: 0 },
            request_date: { type: Date, default: Date.now() },
            response_date: { type: Date }
        }
    ],
    hotlist: [
         { type: Schema.Types.ObjectId, ref: 'User' }
        
    ],
    status: { type: Number, default: 1},
    email_verified: { type: Number, default: 0},
    activation_link: { type: String },
    created_at : { type: Date, default : Date.now()}

});

module.exports = mongoose.model('User', userSchema);
