const mongoose = require('mongoose');

const { Schema } = mongoose;

const userSchema = new Schema({
    first_name: { type: String, default: '' },
    last_name: { type: String, default: '' },
    username: { type: String, default: '' },
    email: { type: String, required: true, unique: true },
    dob: { type: Date },
    phone_number : {type: Number},
    password: { type: String },
    avatar: { type: String },
    description: { type: String, default: '' },
    headline: { type: String, default: '' },
    country: { type: Schema.Types.ObjectId, ref: 'Country' },
    location: { type: Schema.Types.ObjectId, ref: 'Location' },
    timezone: { type: Schema.Types.ObjectId, ref: 'TimeZone' },
    ethnicity: { type: Schema.Types.ObjectId, ref: 'Ethnicity'},
    height: { type: Schema.Types.ObjectId, ref: 'Height' },
    build: { type: Schema.Types.ObjectId, ref: 'Build' },
    hair: { type: Schema.Types.ObjectId, ref: 'Hair' },
    body_hair: { type: Schema.Types.ObjectId, ref: 'BodyHair' },
    body_decoration: { type: String, default: '' },
    info: [
        {
            drink: { type: String, default: '' },
            drugs: { type: String, default: '' },
            smoke: { type: String, default: '' },
            size: { type: String, default: '' },
            safe_sex: { type: String, default: '' },


        }
    ],
    interested_in: [{ type: String }],
    age_range: [{ type: String }],
    travel_arrangment: { type: String, default: '' },
    purpose: { type: String, default: '' },
    status: { type: Number, default: 0},
    activation_link: { type: String },
    created_at : { type: Date, default : Date.now()}

});

module.exports = mongoose.model('User', userSchema);
