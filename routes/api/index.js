const express = require('express');
const router = express.Router();

const bcrypt = require('bcryptjs');
const gravatar = require('gravatar');
const passport = require('passport');
const User = require('../../models/User');
const Country = require('../../models/Country');
const State = require('../../models/State');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const Timezone = require('../../models/Timezone');
const secretOrKey = require('../../config/keys').secretOrKey;
const Settings = require('../../models/Settings');
const Ethnicity = require('../../models/Ethnicity');
const HairColor = require('../../models/HairColor');
const Height = require('../../models/Height');
const BodyHair = require('../../models/BodyHair');
const Build = require('../../models/Build');
const UserActivity = require ('../../models/UserActivity');
const Friendrequest = require ('../../models/Friendrequest');
const AWS = require('aws-sdk');
var multer = require('multer')
var multerS3 = require('multer-s3-transform');
var sharp = require('sharp');
const im = require('imagemagick');
const PasswordChangeRequests = require('../../models/PasswordChangeRequests');
const _ = require('lodash');
const mongoose = require('mongoose');

const CountryList = require('../../config/countries.json');
const Post = require('../../models/Post');

//for sending email
const Mailjet = require('node-mailjet').connect('f6419360e64064bc8ea8c4ea949e7eb8', 'fde7e8364b2ba00150f43eae0851cc85');
//end

const Pusher = require('pusher');

const pusher = new Pusher({
  appId: `${process.env.PUSHER_APP_ID}`,
  key: `${process.env.PUSHER_API_KEY}`,
  secret: `${process.env.PUSHER_API_SECRET}`,
  cluster: `${process.env.PUSHER_APP_CLUSTER}`,
  encrypted: true
});

var s3 = new AWS.S3({
  accessKeyId: process.env.accessKeyId,
  secretAccessKey: process.env.secretAccessKey
})

var upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'kinky-wrc/images',
    acl: 'public-read',
    shouldTransform: function (req, file, cb) {
      cb(null, /^image/i.test(file.mimetype))
    },
    transforms: [{
      id: 'thumbnail',
      key: function (req, file, cb) {
        cb(null, `${Date.now().toString()}.jpg`)
      },
      transform: function (req, file, cb) {
        cb(null, sharp().resize(170, 170).jpeg())
      }
    }]
  })
})

var video = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'kinky-wrc/videos',
    acl: 'public-read',
    metadata: function (req, file, cb) {
      cb(null, {fieldName: file.fieldname});
    },
    key: function (req, file, cb) {
      const ext = file.originalname.split(".");
      cb(null, `${Date.now().toString()}.${ext[1]}`)
    }
  })
})


router.post('/signup',  async (req, res) => {
      const current_date = new Date();
      const new_date = new Date(req.body.yyyy, req.body.mm - 1 , req.body.dd + 1);
      const activation_link = crypto.randomBytes(64).toString('hex');
      const year_diff = diff_years(current_date,new_date);
      if(year_diff < 18) {
        return res.json({ success: false, code: 403, message: 'Minimum age require 18 years.'});
      }
    User.findOne({ $or:[ {'username':req.body.username}, {'email':req.body.email} ] }).then(user => {
        if (user) {
         return res.json({ success: false, code: 403, message: 'Username or email already exists'});
        } else {
          const avatar = gravatar.url(req.body.email, {
            s: '200', // Size
            r: 'pg', // Rating
            d: 'mm' // Default
        });
          
          const newUser = new User({
            username: req.body.username,
            email: req.body.email,
            avatar,
            password: req.body.password,
            gender: req.body.gender,
            dd: req.body.dd,
            mm: req.body.mm,
            yyyy: req.body.yyyy,
            activation_link
          });
    
          bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(newUser.password, salt, (err, hash) => {
              if (err) throw err;
              newUser.password = hash;
              newUser
                .save()
                .then(user => {
                  const payload = { 
                    id: user._id, 
                    email: user.email, 
                    avatar: user.avatar
                  }; // Create JWT Payload

                  const settings = new Settings({
                    user: user._id
                  });
                  settings.save().then(settings => {

                    const userActivity = new UserActivity({
                      user : user._id,
                      status : 1,
                      ip : req.body.ip
                    });
                    userActivity.save();

                   UserActivity.find({'status':1 , 'user':{$ne:user._id}}).count(function(err,countData){

                  jwt.sign(
                  payload,
                  secretOrKey,
                  { expiresIn: 60 * 60 },
                  (err, token) => {
                    
                    var email_body = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">

                <html xmlns="http://www.w3.org/1999/xhtml">
                
                <head>
                
                    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
                
                    <title>Registration Notification</title>
                <style>
                
                        body {
                
                            background-color: #FFFFFF; padding: 0; margin: 0;
                
                        }
                
                    </style>
                
                </head>
                
                <body style="background-color: #FFFFFF; padding: 0; margin: 0;">
                
                <table border="0" cellpadding="0" cellspacing="10" height="100%" bgcolor="#FFFFFF" width="100%" style="max-width: 650px;" id="bodyTable">
                
                    <tr>
                
                        <td align="center" valign="top">
                
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" id="emailContainer" style="font-family:Arial; color: #333333;">
                
                                <!-- Logo -->
                
                                <tr>
                
                                    <td align="left" valign="top" colspan="2" style="border-bottom: 1px solid #CCCCCC; padding-bottom: 10px;">
                
                                        
                
                                    </td>
                
                                </tr>
                
                                <!-- Title -->
                
                                <tr>
                
                                    <td align="left" valign="top" colspan="2" style="border-bottom: 1px solid #CCCCCC; padding: 20px 0 10px 0;">
                
                                        <span style="font-size: 18px; font-weight: normal;">Registration notification</span>
                
                                    </td>
                
                                </tr>
                
                                <!-- Messages -->
                
                                <tr>
                
                                    <td align="left" valign="top" colspan="2" style="padding-top: 10px;">
                
                                        <span style="font-size: 12px; line-height: 1.5; color: #333333;">
                
                                          Hi ${user.username}, <br/>    
                                          Please click on the below link to verify your email
                  
                                          <br/><br/>
              
                                          <a href="${process.env.FRONT_END_URL}/verify/${user.activation_link}">Click here to verify</a>
                                          <br/>
          
                                          
              
                                          <br/><br/>
                
                                            We recommend that you keep your password secure and not share it with anyone.If you feel your password has been compromised, you can change it by going to your Change password page and clicking on the "Change Password" link.
                
                                           
                
                                            <br/><br/>
                
                                           Kinky - AN online dating service
                
                                        </span>
                
                                    </td>
                
                                </tr>
                
                            </table>
                
                        </td>
                
                    </tr>
                
                </table>
                
                </body>
                
                </html> `;
            
      var sendEmail = Mailjet.post('send');
    
      var emailData = {
          'FromEmail': 'info@wrctpl.com',
          'FromName': 'Kinky - An online dating service',
          'Subject': 'Registration notification',
          'Html-part': email_body,
          'Recipients': [{'Email': user.email}]
      };
      
      if(sendEmail.request(emailData)) {
        delete user.activation_link;
        return res.json({
          success: true,
          token: token,
          info:user,
          settings: settings,
          count: countData,
          code: 200
        });
        }
      }
          );

          });
                  })

                })
                .catch(err => {
                  throw new Error("Something is not right. Please try again.");
                });
            });
          });
        }
      });
});

router.post('/forgot-password', (req, res) => {

  // Find user by username or email
  User.findOne({ $or:[ {'username':req.body.email}, {'email':req.body.email} ] }).then(user => {
    
    if (!user) {
        return res.json({ success: false, code: 404, message: 'Username or email not matched.'});
    }else{
      const activation_link = crypto.randomBytes(64).toString('hex');
      const passwdReq = new PasswordChangeRequests({
        email: req.body.email,
        activation_id: activation_link
      }).save();
      var email_body = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">

                  <html xmlns="http://www.w3.org/1999/xhtml">
                  
                  <head>
                  
                      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
                  
                      <title>Forgot Password</title>
                  
                      <style>
                  
                          body {
                  
                              background-color: #FFFFFF; padding: 0; margin: 0;
                  
                          }
                  
                      </style>
                  
                  </head>
                  
                  <body style="background-color: #FFFFFF; padding: 0; margin: 0;">
                  
                  <table border="0" cellpadding="0" cellspacing="10" height="100%" bgcolor="#FFFFFF" width="100%" style="max-width: 650px;" id="bodyTable">
                  
                      <tr>
                  
                          <td align="center" valign="top">
                  
                              <table border="0" cellpadding="0" cellspacing="0" width="100%" id="emailContainer" style="font-family:Arial; color: #333333;">
                  
                                  <!-- Logo -->
                  
                                  <tr>
                  
                                      <td align="left" valign="top" colspan="2" style="border-bottom: 1px solid #CCCCCC; padding-bottom: 10px;">
                  
                                          
                  
                                      </td>
                  
                                  </tr>
                  
                                  <!-- Title -->
                  
                                  <tr>
                  
                                      <td align="left" valign="top" colspan="2" style="border-bottom: 1px solid #CCCCCC; padding: 20px 0 10px 0;">
                  
                                          <span style="font-size: 18px; font-weight: normal;">Forgot Password</span>
                  
                                      </td>
                  
                                  </tr>
                  
                                  <!-- Messages -->
                  
                                  <tr>
                  
                                      <td align="left" valign="top" colspan="2" style="padding-top: 10px;">
                  
                                          <span style="font-size: 12px; line-height: 1.5; color: #333333;">
                  
                                            
                                            Please click on the below link to change your password
                  
                                              <br/><br/>
                  
                                              <a href="${process.env.FRONT_END_URL}/forgot-password/${activation_link}">Click here to verify</a>
                                              <br/>
              
                                              
                  
                                              <br/><br/>
                  
                                              We recommend that you keep your password secure and not share it with anyone.If you feel your password has been compromised, you can change it by going to your Change password page and clicking on the "Change Password" link.
                  
                                              <br/><br/>
                  
                  
                                             Kinky - AN online dating service
                  
                                          </span>
                  
                                      </td>
                  
                                  </tr>
                  
                              </table>
                  
                          </td>
                  
                      </tr>
                  
                  </table>
                  
                  </body>
                  
                  </html> `;
              
                  var sendEmail = Mailjet.post('send');
               
                  var emailData = {
                      'FromEmail': 'info@wrctpl.com',
                      'FromName': 'Kinky - An online dating service',
                      'Subject': 'Forgot Password',
                      'Html-part': email_body,
                      'Recipients': [{'Email': user.email}]
                  };
                  
                  if(sendEmail.request(emailData)) {
                    
                    res.json({
                      success: true, 
                      code: 200, 
                      message: 'Please check your email to change password'
                    });
                    
                  }
    }

 


});

});



router.post('/count-online-user' ,passport.authenticate('jwt', {session : false}), async(req,res) => {

   UserActivity.find({'status':1 , 'user':{$ne:req.user.id}}).count(function(err,countData){

                return res.json({
                  success: true,
                  count: countData,
                  code: 200
                });
            

            });

});


router.post('/login', (req, res) => {

  console.log(req.body.ip);
    const username = req.body.username;
    const password = req.body.password;

  // Find user by username
  User.findOne({ username }).then(user => {
    // Check for user
    if (!user) {
        return res.json({ success: false, code: 404, message: 'Username or Password is wrong.'});
    }

    // Check Password
    
    bcrypt.compare(password, user.password).then(isMatch => {
      if (isMatch) {
        if(user.status === 0) {
          return res.json({ success: false, code: 404, message: 'Account is not activated. Please contact systemd administrator'});
        }
        // User Matched
        const payload = { 
          id: user._id, 
          email: user.email, 
          avatar: user.avatar
        }; // Create JWT Payload
        Settings.findOne({ user: user._id })
          .then(settings => {

            const userActivity = new UserActivity({
              user : user._id,
              status : 1,
              ip : req.body.ip
            });
            userActivity.save();

             UserActivity.find({'status':1 , 'user':{$ne:user._id}}).count(function(err,countData){

              jwt.sign(
              payload,
              secretOrKey,
              { expiresIn: 60 * 60 },
              (err, token) => {
                delete user.activation_link;
                return res.json({
                  success: true,
                  token: token,
                  info:user,
                  settings: settings,
                  count: countData,
                  code: 200
                });
              }
            );

            });
           
          })
        
      } else {
        return res.json({ success: false, code: 404, message: 'Email or Password is wrong.'});
      }
    });
  });
    
});

router.post('/logout', passport.authenticate('jwt', {session : false}), (req,res) => {

UserActivity.remove({ user: req.user.id}, (err) => {
  return res.json({
    success: true,
    code:200,
    message: "Logout successfully."
  });
})


});

router.post('/fetch-online-users', passport.authenticate('jwt', {session : false}), async(req,res) => {




  const user = await UserActivity.find({'status':1 , 'user': { $ne: req.user.id }}).populate('user');
  if(user){
    return res.json({
      success: true,
      code:200,
      user: user
    });
  }else{
    throw new Error("User not found");
  } 

});


router.post('/change-password',passport.authenticate('jwt', {session : false}),  async (req,res) => {
  let old_password = req.body.old_password;
  let new_password = req.body.new_password;

  const user = await User.findById(req.user.id);
  if(user) {
    bcrypt.compare(old_password, user.password).then(isMatch => {
      if (isMatch) {
        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(req.body.new_password, salt, (err, hash) => {
            if (err) throw err;
            new_password_with_hashing = hash;
  
            User.updateOne({
                _id: req.user.id //matching with table id
              },{
                $set: {
                  password: new_password_with_hashing
                }
              }).then(function (result) {
                if(result) {
                  var email_body = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">

                  <html xmlns="http://www.w3.org/1999/xhtml">
                  
                  <head>
                  
                      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
                  
                      <title>Password Updated</title>
                  
                      <style>
                  
                          body {
                  
                              background-color: #FFFFFF; padding: 0; margin: 0;
                  
                          }
                  
                      </style>
                  
                  </head>
                  
                  <body style="background-color: #FFFFFF; padding: 0; margin: 0;">
                  
                  <table border="0" cellpadding="0" cellspacing="10" height="100%" bgcolor="#FFFFFF" width="100%" style="max-width: 650px;" id="bodyTable">
                  
                      <tr>
                  
                          <td align="center" valign="top">
                  
                              <table border="0" cellpadding="0" cellspacing="0" width="100%" id="emailContainer" style="font-family:Arial; color: #333333;">
                  
                                  <!-- Logo -->
                  
                                  <tr>
                  
                                      <td align="left" valign="top" colspan="2" style="border-bottom: 1px solid #CCCCCC; padding-bottom: 10px;">
                  
                                          
                  
                                      </td>
                  
                                  </tr>
                  
                                  <!-- Title -->
                  
                                  <tr>
                  
                                      <td align="left" valign="top" colspan="2" style="border-bottom: 1px solid #CCCCCC; padding: 20px 0 10px 0;">
                  
                                          <span style="font-size: 18px; font-weight: normal;">Password Changed Status</span>
                  
                                      </td>
                  
                                  </tr>
                  
                                  <!-- Messages -->
                  
                                  <tr>
                  
                                      <td align="left" valign="top" colspan="2" style="padding-top: 10px;">
                  
                                          <span style="font-size: 12px; line-height: 1.5; color: #333333;">
                  
                                            
                                                    Your password successful updated.
                  
                                    
                  
              
                                              <br/>
              
                                              
                  
                                              <br/><br/>
                  
                                              We recommend that you keep your password secure and not share it with anyone.If you feel your password has been compromised, you can change it by going to your Change password page and clicking on the "Change Password" link.
                  
                                              <br/><br/>

                                             Kinky - AN online dating service
                  
                                          </span>
                  
                                      </td>
                  
                                  </tr>
                  
                              </table>
                  
                          </td>
                  
                      </tr>
                  
                  </table>
                  
                  </body>
                  
                  </html> `;
              
                  var sendEmail = Mailjet.post('send');
               
                  var emailData = {
                      'FromEmail': 'info@wrctpl.com',
                      'FromName': 'Kinky - An online dating service',
                      'Subject': 'Password Updated',
                      'Html-part': email_body,
                      'Recipients': [{'Email': req.user.email}]
                  }; 
                  if(sendEmail.request(emailData)) {
                  return res.json({
                    success: true,
                    code:200,
                    message: "Password changed successfully."
                  });
                }
              }
              });
          });
        });
      } else {
        return res.json({ success: false, code: 404, message: 'Old password not matched'});
      }
    });
  }
  else {
    throw new Error("User not found");
  }


});

router.post('/user-settings',passport.authenticate('jwt', {session : false}), async (req, res) => {

  const setting = await Settings.findOne({ user: req.user.id });  
  const user = await User.findById(req.user.id).populate('country').populate('state').populate('height').populate('build').populate('hair');
  const timezones = await Timezone.find({});
  
  if(setting) {
    return res.json({
      success: true,
      info:setting,
      user:user,
      timezones: timezones,
      code: 200
    });
  }
  else {
    return res.json({
      success: false,
      info:{},
      code: 403,
      timezones: timezones
    });
  }

});

router.post('/check-activation', async (req, res) => {
  
    const user = await User.findOne({
      activation_link: req.body.activation_id
    });
    
    if(user) {
      if(user.status === 1) {
        res.json({
          success: false,
          message: "Your account is already activated. Please login to cointinue."
        })
      }
      else {
        res.json({
          success: true,
          message: `Hey ${user.first_name} ${user.last_name}, We received a request to set your email to ${user.email}. If this correct, please confirm by clicking the button bellow.`
        })
      }
    }
    else {
      res.json({
        success: false,
        message: "Sorry, system can't activate your account."
      })
    }
});

router.post('/verify-activation', async(req, res) => {
    const user = await User.findOne({
      activation_link: req.body.activation_id
    });
    if(user) {
      user.status = 1;
      user.save();
      const payload = { 
        id: user._id, 
        email: user.email, 
        avatar: user.avatar,
        first_name: user.first_name,
        last_name: user.last_name 
      }; // Create JWT Payload
    
      // Sign Token
      jwt.sign(
        payload,
        secretOrKey,
        { expiresIn: 60 * 60 },
        (err, token) => {
          return res.json({
            success: true,
            token: token,
            info: user,
            code: 200
          });
        }
      );
    }
    else {
      res.json({
        success: true,
        message: "Something is not right. Please try again"
      });
    }
});

router.get('/Country' , async (req,res) => {
  var all_country = await Country.find();
  if(all_country){
    res.json({
      status: true,
      code: 200,
      data: all_country
    });
  }else{
    res.json({
      status : false,
      code : 300,
      message : "No countries found."
    });
  }
});
router.get('/Ethnicity' , async (req,res) => {
  var all_ethncity = await Ethnicity.find();
  if(all_ethncity){
    res.json({
      status : true,
      code : 200,
      data : all_ethncity
    });
  }else{
    res.json({
      status : false,
      code : 300,
      message : "No Ethncity found."
    });
  }
});
router.get('/Hair' , async (req,res) => {
  var all_hair = await HairColor.find();
  if(all_hair){
    res.json({
      status : true,
      code : 200,
      data : all_hair
    });
  }else{
    res.json({
      status : false,
      code : 300,
      message : "No Hair found."
    });
  }
});
router.get('/BodyHair' , async (req,res) => {
  var body_hair = await BodyHair.find();
  if(body_hair){
    res.json({
      status : true,
      code : 200,
      data : body_hair
    });
  }else{
    res.json({
      status : false,
      code : 300,
      message : "No Body Hair found."
    });
  }
});
router.get('/Build' , async (req,res) => {
  var build = await Build.find();
  if(build){
    res.json({
      status : true,
      code : 200,
      data : build
    });
  }else{
    res.json({
      status : false,
      code : 300,
      message : "No Build found."
    });
  }
});
router.get('/Height' , async (req,res) => {
  var height = await Height.find();
  if(height){
    res.json({
      status : true,
      code : 200,
      data : height
    });
  }else{
    res.json({
      status : false,
      code : 300,
      message : "No Height found."
    });
  }
});

router.post('/State' , async (req,res) => {
  var all_state = await State.find({country:req.body.e});
  if(all_state){
    res.json({
      status : true,
      code : 200,
      data : all_state
    });
  }else{
    res.json({
      status : false,
      code : 300,
      message : "No states found."
    });
  }
});

router.post('/load-masters', async( req, res) => {
  var all_country = await Country.find();
  var all_ethncity = await Ethnicity.find();
  var all_hair = await HairColor.find();
  var build = await Build.find();
  var height = await Height.find();
  var body_hairs = await BodyHair.find();
  const timezones = await Timezone.find({});

  res.json({
    status: true,
    code: 200,
    countries: all_country,
    ethnicity: all_ethncity,
    hair: all_hair,
    build: build,
    height: height,
    timezones: timezones,
    body_hairs: body_hairs
  })
});

router.post('/alert-update',passport.authenticate('jwt', {session : false}), (req,res) => {
  
  try {
    Settings.update({ user: req.user.id }, req.body, { upsert: true, setDefaultsOnInsert: true }, (err, data) => {
      Settings.findOne({ user: req.user.id })
        .then(data => {
          return res.json({
            success: true,
            message:"updated successfull",
            code: 200,
            settings: data
          });
        })
      
    })
  }
  catch(err) {
    throw new Error("User not found");
  }

});

router.post('/profile-protect-update',passport.authenticate('jwt', {session : false}), (req,res) => {
  try {
    Settings.update({ user: req.user.id }, req.body, { upsert: true, setDefaultsOnInsert: true }, (err, data) => {
      Settings.findOne({ user: req.user.id })
        .then(data => {
          return res.json({
            success: true,
            message:"updated successfull",
            code: 200,
            settings: data
          });
        })
      
    })
  }
  catch(err) {
    throw new Error("User not found");
  }
});

router.post('/switch-account-update',passport.authenticate('jwt', {session : false}), (req,res) => {
  try {
    Settings.update({ user: req.user.id }, req.body, { upsert: true, setDefaultsOnInsert: true }, (err, data) => {
      Settings.findOne({ user: req.user.id })
        .then(data => {
          return res.json({
            success: true,
            message:"updated successfull",
            code: 200,
            settings: data
          });
        })
      
    } )
  }
  catch(err) {
    throw new Error("User not found");
  }
  
});
router.post('/delete-account-update',passport.authenticate('jwt', {session : false}), async (req,res) => {
  
  const user = await User.findOne({_id: req.user.id});
  if(user) {
    user.status = 0;
    if (user.save()){

      Settings.update({ user: req.user.id }, req.body, { upsert: true, setDefaultsOnInsert: true }, (err, data) => {
        return res.json({
          success: true,
          message:"Account deleted successfull",
          code: 200
        });
      })

    }else{
      return res.json({
        success: false,
        message:"Account deleted failed",
        code: 300
      });
    }

    
  }
  else {
    throw new Error("User not found");
  }
});
router.post('/update-personal-headline',passport.authenticate('jwt', {session : false}), async (req,res) => {
  const user = await User.findOne({_id: req.user.id});
  if(user) {
    user.headline = req.body.headline;
    user.description = req.body.description;
    if (user.save()){

     
        return res.json({
          success: true,
          message:"updated successfull",
          info: user,
          code: 200
        });
      

    }else{
      return res.json({
        success: false,
        message:"updated failed",
        info: user,
        code: 300
      });
    }

    
  }
  else {
    throw new Error("User not found");
  }
});

router.post('/site-config-update',passport.authenticate('jwt', {session : false}), (req,res) => {
  
  try {
    Settings.update({ user: req.user.id }, req.body, { upsert: true, setDefaultsOnInsert: true }, (err, data) => {
      Settings.findOne({ user: req.user.id })
        .then(data => {
          return res.json({
            success: true,
            message:"updated successfull",
            code: 200,
            settings: data
          });
        })
      
    })
  }
  catch(err) {
    throw new Error("User not found");
  }
});

router.post('/introduction_update',passport.authenticate('jwt', {session : false}), async (req,res) => {
  
  try {
    Settings.update({ user: req.user.id }, req.body, { upsert: true, setDefaultsOnInsert: true }, (err, data) => {
      Settings.findOne({ user: req.user.id })
        .then(data => {
          return res.json({
            success: true,
            message:"updated successfull",
            code: 200,
            settings: data
          });
        })
     
    })
  }
  catch(err) {
    throw new Error("User not found");
  }

});
router.post('/interest-update',passport.authenticate('jwt', {session : false}), (req,res) => {
  User.update({ _id: req.user.id }, req.body , { upsert: true, setDefaultsOnInsert: true } , (err, data) => {

  });
  try {
    Settings.update({ user: req.user.id }, req.body , { upsert: true, setDefaultsOnInsert: true } , (err, data) => {
      Settings.findOne({ user: req.user.id }).then(data => {
        return res.json({
          success: true,
          message:"updated successfull",
          code: 200,
          settings: data
        })
      })
      
    })
  
  }
  catch(err) {
    throw new Error("User not found");
  }
  
});

router.post('/check-account', async(req, res) => {
  const activation_link = req.body.link;
  const user = await User.findOne({ activation_link });
  if(user) {
    if(user.email_verified === 1) {
      return res.json({ success: false, code: 403, message: 'Your account is already verified'})
    }
    else {
      return res.json({ success: true, code: 200, message: 'Welcome to Kinky - Online dateing application. Click on verify button to continue with this site.'})
    } 
  }
  else {
    return res.json({ success: false, code: 403, message: 'Something is not right. Please try again'})
  }
})

router.post('/activate-account', async(req, res) => {
  const activation_link = req.body.link;
  const user = await User.findOne({ activation_link });
  if(user) {
    user.email_verified = 1;
    user.save();
    const payload = { 
      id: user._id, 
      email: user.email, 
      avatar: user.avatar
    };

    Settings.findOne({ user: user._id })
      .then(settings => {
        jwt.sign(
          payload,
          secretOrKey,
          { expiresIn: 60 * 60 },
          (err, token) => {
            return res.json({
              success: true,
              token: token,
              info:user,
              settings: settings,
              code: 200
            });
          }
        );
      })
  }
  else {
    return res.json({ success: false, code: 403, message: 'Something is not right. Please try again'})
  }
})

router.post('/update-instant-message', passport.authenticate('jwt', {session : false}), (req, res) => {
  try {
    Settings.update({ user: req.user.id }, req.body , { upsert: true, setDefaultsOnInsert: true } , (err, data) => {
      Settings.findOne({ user: req.user.id })
        .then(data => {
          return res.json({
            success: true,
            message:"updated successfull",
            code: 200,
            settings: data
          })
        })
      
    })
  
  }
  catch(err) {
    throw new Error("User not found");
  }
})

router.post('/update-auto-reply-email', passport.authenticate('jwt', { session : false }), (req, res) => {
  try {
    Settings.update({ user: req.user.id }, req.body, { upsert: true, setDefaultsOnInsert: true }, (err, data) => {
      Settings.findOne({ user: req.user.id })
        .then(data => {
          return res.json({
            success: true,
            message:"updated successfull",
            code: 200,
            settings: data
          })
        })
    })
  }
  catch(err) {
    throw new Error("User not found");
  }
})

router.post('/update-promotion', passport.authenticate('jwt', { session : false }), (req, res) => {
  try {
    Settings.update({ user: req.user.id }, req.body, { upsert: true, setDefaultsOnInsert: true }, (err, data) => {
      Settings.findOne({ user: req.user.id })
        .then(data => {
          return res.json({
            success: true,
            message:"updated successfull",
            code: 200,
            settings: data
          })
        })
    })
  }
  catch(err) {
    throw new Error("User not found");
  }
})

 
 


/* router.post('/image-upload',passport.authenticate('jwt', { session : false }), (req, res) => {
  upload(req,res,function(err) {
    //console.log(req.body);
    //console.log(req.files);
  if(err) {
      console.log("sd",err);
      
        return res.end("Error uploading file.");
    } 
    res.end("File is uploaded");
});
}); */

router.post('/personal-details-update', passport.authenticate('jwt', { session : false }), async (req, res) => {
  

  const user = await User.findOne({_id: req.user.id});
  

  if(user) {
    user.dd = req.body.data.dd;
    user.mm = req.body.data.mm;
    user.yyyy = req.body.data.yyyy;
    user.dd_female = req.body.data.dd_female;
    user.mm_female = req.body.data.mm_female;
    user.yyyy_female = req.body.data.yyyy_female;
    user.gender = req.body.data.gender;
    user.looking_for_male = req.body.data.looking_for_male; 
    user.looking_for_female = req.body.data.looking_for_female; 
    user.looking_for_couple = req.body.data.looking_for_couple; 
    user.looking_for_cd = req.body.data.looking_for_cd; 
    user.timezone = req.body.data.timezone;
    user.sexuality = req.body.data.sexuality;
    user.sexuality_female = req.body.data.sexuality_female;
    user.country = req.body.data.country;
    user.state = req.body.data.state;
    user.ethnicity = req.body.data.ethnicity;
    user.ethnicity_female = req.body.data.ethnicity_female;
    user.height =req.body.data.height;
    user.height_female =req.body.data.height_female;
    user.build = req.body.data.build;
    user.build_female = req.body.data.build_female;
    user.hair =req.body.data.hair;
    user.hair_female =req.body.data.hair_female;
    user.body_hair = req.body.data.body_hair;
    user.body_hair_female = req.body.data.body_hair_female;
    user.body_decoration = req.body.data.body_decoration;
    user.body_decoration_female = req.body.data.body_decoration_female;
    user.drink = req.body.data.drink;
    user.drink_female = req.body.data.drink_female;
    user.drugs = req.body.data.drugs;
    user.drugs_female = req.body.data.drugs_female;
    user.smoke = req.body.data.smoke;
    user.smoke_female = req.body.data.smoke_female;
    user.size = req.body.data.size;
    user.size_female = req.body.data.size_female;
    user.safe_sex = req.body.data.safe_sex;
    user.safe_sex_female = req.body.data.safe_sex_female;
    user.travel_arrangment = req.body.data.travel_arrangment;
    user.purpose = req.body.data.purpose;
    user.interested_in = req.body.data.interested_in;
    user.age_range = req.body.data.age_range;
    if (user.save()){
     const settings = await Settings.findOne({user: req.user.id});

     if(settings !== null) {
      settings.looking_for_male = user.looking_for_male; 
      settings.looking_for_female = user.looking_for_female; 
      settings.looking_for_couple = user.looking_for_couple; 
      settings.looking_for_cd = user.looking_for_cd; 
      settings.save();
      return res.json({
        success: true,
        message:"updated successfull",
        info: user,
        settings:settings,
        code: 200
      });
     }
     else {
       const settings = new Settings({
        looking_for_male : user.looking_for_male, 
      looking_for_female : user.looking_for_female, 
      looking_for_couple : user.looking_for_couple, 
      looking_for_cd : user.looking_for_cd
       })
       settings.save();
       return res.json({
        success: true,
        message:"updated successfull",
        info: user,
        settings:settings,
        code: 200
      });
     }
   
      

    }else{
      return res.json({
        success: false,
        message:"updated failed",
        code: 300
      });
    }

    
  }
  else {
    throw new Error("User not found");
  }
})

router.post('/check-password-request', async(req, res) => {
  const passwdReq = await PasswordChangeRequests.findOne({ activation_id: req.body.link, status: 0 });
  if(passwdReq) {
    const reqDate = passwdReq.requested_date.getTime();
    const currentDate = new Date().getTime();
    const diffDays = parseInt((currentDate - reqDate) / (1000 * 60 * 60 * 24));
    if(diffDays > 0) {
      return res.json({
        success: false,
        code: 403,
        message: 'Link is expired. Please try again'
      })
    }
    else {
      return res.json({
        success: true,
        code: 200,
        message: ''
      })
    }
  }
  else {
    return res.json({
      success: false,
      code: 403,
      message: 'Link is expired. Please try again'
    })
  }
})

router.post('/update-password-request', async (req, res) => {
  const passwdReq = await PasswordChangeRequests.findOne({ activation_id: req.body.link, status: 0 });
  if(passwdReq) {
    const user = await User.findOne({ email: passwdReq.email });
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(req.body.password, salt, (err, hash) => {
        if (err) throw err;
        new_password_with_hashing = hash;

        User.updateOne({
            _id: user._id
          },{
            $set: {
              password: new_password_with_hashing
            }
          }).then(function (result) {
            if(result) {
              passwdReq.status = 1;
              passwdReq.save();
              return res.json({
                success: true,
                code:200,
                message: "Password updated successfully."
              });
            }
          });
      });
    });
  }
  else {
    return res.json({
      success: false,
      code: 403,
      message: 'Link is expired. Please try again'
    })
  }
})
/*  router.get('/test-upload', (req, res) => {
const arr = ['Shaved', 'Smooth', 'Trimmed', 'Natural', 'Wild', 'I will tell you later'];
  for(let i=0; i<arr.length; i++) {
    const eth = new BodyHair({
      name: arr[i]
    }).save();
  }
  res.send("End")
});  */

  router.get('/test-upload', async(req, res) =>{

  const from_user = await User.findOne({_id: '5b98f7eb54f5af2a38cc3bf0'});
  //console.log(from_user);

        let seeking_for = from_user.looking_for_male ? 'Male,': '';
        seeking_for += from_user.looking_for_female ? 'Female,': '';
        seeking_for += from_user.looking_for_couple ? 'Couple,': '';
        seeking_for += from_user.looking_for_cd ? ' CD/TV/TS,': '';

        seeking_for = seeking_for.substring(0, seeking_for.length - 1);
        let interested_in = from_user.interested_in;
         let avatar = from_user.avatar !== undefined ? from_user.avatar: null;
        let name = from_user.username;
        let gender = from_user.gender !== undefined ? from_user.gender : 'N/A';
        let sexuality = from_user.sexuality !== undefined ? from_user.sexuality : 'N/A';
        let sexuality_female = from_user.sexuality_female !== undefined ? from_user.sexuality_female : 'N/A';
        let age = getAge(from_user.mm +"/"+from_user.dd +"/"+from_user.yyyy );
        let age_female = getAge(from_user.mm_female +"/"+from_user.dd_female +"/"+from_user.yyyy_female );
        let email_verified;
         if(from_user.email_verified) {
        let email_verified = true;
      }
      const to_user = await User.findOne({_id: req.body.to_id});
  var email_body = `<!DOCTYPE html>
  <html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
  <head>
    <meta charset="utf-8"> <!-- utf-8 works for most cases -->
    <meta name="viewport" content="width=device-width"> <!-- Forcing initial-scale shouldn't be necessary -->
    <meta http-equiv="X-UA-Compatible" content="IE=edge"> <!-- Use the latest (edge) version of IE rendering engine -->
    <meta name="x-apple-disable-message-reformatting">  <!-- Disable auto-scale in iOS 10 Mail entirely -->
    <title>Kynky</title> <!-- The title tag shows in email notifications, like Android 4.4. -->
  
  
  
    <link href="https://fonts.googleapis.com/css?family=Montserrat:300,500" rel="stylesheet">
    <link href="https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css" rel="stylesheet">
  
    <!--<![endif]-->
  
  
    <!-- CSS Reset -->
    <style>
  
    /* What it does: Remove spaces around the email design added by some email clients. */
    /* Beware: It can remove the padding / margin and add a background color to the compose a reply window. */
    html,
    body {
      margin: 0 auto !important;
      padding: 0 !important;
      height: 100% !important;
      width: 100% !important;
    }
  
    /* What it does: Stops email clients resizing small text. */
    * {
      -ms-text-size-adjust: 100%;
      -webkit-text-size-adjust: 100%;
    }
  
    /* What it does: Centers email on Android 4.4 */
    div[style*="margin: 16px 0"] {
      margin:0 !important;
    }
  
    /* What it does: Stops Outlook from adding extra spacing to tables. */
    table,
    td {
      mso-table-lspace: 0pt !important;
      mso-table-rspace: 0pt !important;
    }
  
    /* What it does: Fixes webkit padding issue. Fix for Yahoo mail table alignment bug. Applies table-layout to the first 2 tables then removes for anything nested deeper. */
    table {
      border-spacing: 0 !important;
      border-collapse: collapse !important;
      table-layout: fixed !important;
      margin: 0 auto !important;
    }
    table table table {
      table-layout: auto;
    }
  
    /* What it does: Uses a better rendering method when resizing images in IE. */
    img {
      -ms-interpolation-mode:bicubic;
    }
  
    /* What it does: A work-around for email clients meddling in triggered links. */
    *[x-apple-data-detectors],	/* iOS */
    .x-gmail-data-detectors, 	/* Gmail */
    .x-gmail-data-detectors *,
    .aBn {
      border-bottom: 0 !important;
      cursor: default !important;
      color: inherit !important;
      text-decoration: none !important;
      font-size: inherit !important;
      font-family: inherit !important;
      font-weight: inherit !important;
      line-height: inherit !important;
    }
  
    /* What it does: Prevents Gmail from displaying an download button on large, non-linked images. */
    .a6S {
      display: none !important;
      opacity: 0.01 !important;
    }
    /* If the above doesn't work, add a .g-img class to any image in question. */
    img.g-img + div {
      display:none !important;
    }
  
    /* What it does: Prevents underlining the button text in Windows 10 */
    .button-link {
      text-decoration: none !important;
    }
  
    .progress-circle.progress-70:after {
      background-image: linear-gradient(-18deg, #9cad4f 50%, transparent 50%, transparent), linear-gradient(270deg, #9cad4f 50%, #fff 50%, #fff);
    }
  
    .progress-circle:after {
      content: '';
      display: inline-block;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      -webkit-border-radius: 50%;
      -moz-border-radius: 50%;
      -ms-animation: colorload 2s;
      -o-animation: colorload 2s;
      animation: colorload 2s;
    }

    .save-btn {
      border-radius:5px; -webkit-border-radius:5px; -moz-border-radius:5px; -o-border-radius:5px;
    }
  
    /* What it does: Removes right gutter in Gmail iOS app: https://github.com/TedGoas/Cerberus/issues/89  */
    /* Create one of these media queries for each additional viewport size you'd like to fix */
    /* Thanks to Eric Lepetit @ericlepetitsf) for help troubleshooting */
    @media only screen and (min-device-width: 375px) and (max-device-width: 413px) { /* iPhone 6 and 6+ */
      .email-container {
        min-width: 375px !important;
      }
    }
  
  </style>
  
  <!-- Progressive Enhancements -->
  <style>
  
  /* Media Queries */
  @media screen and (max-width: 480px) {
  
    /* What it does: Forces elements to resize to the full width of their container. Useful for resizing images beyond their max-width. */
    .fluid {
      width: 100% !important;
      max-width: 100% !important;
      height: auto !important;
      margin-left: auto !important;
      margin-right: auto !important;
    }
  
    /* What it does: Forces table cells into full-width rows. */
    .stack-column,
    .stack-column-center {
      display: block !important;
      width: 100% !important;
      max-width: 100% !important;
      direction: ltr !important;
    }
    /* And center justify these ones. */
    .stack-column-center {
      text-align: center !important;
    }
  
    /* What it does: Generic utility class for centering. Useful for images, buttons, and nested tables. */
    .center-on-narrow {
      text-align: center !important;
      display: block !important;
      margin-left: auto !important;
      margin-right: auto !important;
      float: none !important;
    }
    table.center-on-narrow {
      display: inline-block !important;
    }
  
    /* What it does: Adjust typography on small screens to improve readability */
    .email-container p {
      font-size: 17px !important;
      line-height: 22px !important;
    }
  }
  
  </style>
  
  
  </head>
  <body width="100%" style="margin: 0; mso-line-height-rule: exactly;">
    <center style="width: 100%; text-align: left;">
  
      <div style="max-width: 680px; margin: auto;" class="email-container">
  
        <!-- Email Body : BEGIN -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%" style="max-width: 680px;" class="email-container">
  
          <!-- INTRO : BEGIN -->
          <tr>
            <td bgcolor="#f4f4f4">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="padding: 0 40px 20px 40px; font-family: sans-serif; font-size: 15px; line-height: 25px; color: #555555; text-align: left; font-weight:normal;">
                    <div style="width: 100%; position: relative; background: #f4f4f4; padding: 15px; border-radius: 6px;" class="profile-left-top-box">
                      <div class="profile-left-details-box">
                        <div style="width: 170px; display: block; margin: 0 auto; border-radius: 100%;" class="profile-left-img">
                          <div style="background: #fff; width: 100px; height: auto; margin: 0 23px; display: inline-block; vertical-align: top; text-align: center; width: 170px; height: auto; background: none; margin: 0;" class="box-circle hidden-xxs">
                            <div style="width: 170px; height: 170px; background-color: #fff; border-radius: 50%; -webkit-border-radius: 50%; -moz-border-radius: 50%; display: inline-block; position: relative;
                            " class="progress-circle progress-70">
                            <span style="background: #fff none repeat scroll 0 0; border-radius: 100%; -webkit-border-radius: 100%; -moz-border-radius: 100%; color: #8b8b8b; display: block; font-size: 1.5rem; left: 32%; line-height: 60px; margin-left: -44px; margin-top: -46px; position: absolute; text-align: center; top: 32%; width: 151px; z-index: 1;">
                              <img style="display: block;width: 100%;border-radius: 100%;-webkit-border-radius: 100%;-moz-border-radius: 100%;" src="${avatar}" alt="">
                            </span> 
                          </div>
                        </div>
                        <p style="text-align: center;color: #9cad4f; font-size: 14px; margin-top: 15px;"><strong style="font-size: 18px; display: block; font-weight: bold;">70%</strong> Matched</p>
                      </div>
                      <div style="text-align: center; display: inline-block; vertical-align: top; padding-left: 0; width: 100%;" class="profile-top-text">
                        <h5 style="font-size: 18px; font-weight: 600; margin: 0;"><a style="color: #d1832b; text-decoration: none;" href="#">${name}</a></h5>
                        <p style="margin: 5px 0; font-weight: 600;"><i style="color: #929292; margin-right: 5px; font-size: 16px;" class="fa fa-map-marker"></i>${from_user.state},${from_user.country}</p>
                        <p style="margin: 5px 0; font-weight: 600;"><i style="color: #929292; margin-right: 5px; font-size: 16px;" class="fa fa-mars"></i>${age} ${sexuality}</p>
                        
                        <p style="margin: 5px 0; font-weight: 600;">
                          <a style="color: #558fa0; font-weight: 400; text-decoration: none;" href="javascript:void(0)">Reviews 0</a> 
                          <strong style="font-weight: 400; color: #929292;">|</strong> 
                          <a style="color: #558fa0; font-weight: 400; text-decoration: none;" href="javascript:void(0)"><span>${email_verified?"Email Verified":"Email Unverified"}</span></a>
                        </p>
                        <p style="margin: 5px 0; font-weight: 600;"><em style="font-weight: 400; color: #929292;">Seeking ${seeking_for}</em></p>
                        <p style="margin: 5px 0; font-weight: 600;"><a style="color: #558fa0; font-weight: 400; text-decoration: none;" href="javascript:void(0)">${interested_in} </a></p>
                      </div>
                      <a style="width:130px; height:35px; border:none; text-align:center; background: rgba(29,9,12,1); background: -moz-linear-gradient(left, rgba(29,9,12,1) 0%, rgba(133,35,53,1) 100%); background: -webkit-gradient(left top, right top, color-stop(0%, rgba(29,9,12,1)), color-stop(100%, rgba(133,35,53,1))); background: -webkit-linear-gradient(left, rgba(29,9,12,1) 0%, rgba(133,35,53,1) 100%); background: -o-linear-gradient(left, rgba(29,9,12,1) 0%, rgba(133,35,53,1) 100%); background: -ms-linear-gradient(left, rgba(29,9,12,1) 0%, rgba(133,35,53,1) 100%); background: linear-gradient(to right, rgba(29,9,12,1) 0%, rgba(133,35,53,1) 100%); filter: progid:DXImageTransform.Microsoft.gradient( startColorstr='#1d090c', endColorstr='#852335', GradientType=1 ); border-radius:5px; -webkit-border-radius:5px; -moz-border-radius:5px; -o-border-radius:5px; color:#fff; text-transform:capitalize; font-weight:600; font-size:16px; border: 1px solid transparent; cursor: pointer; display: table; margin: 0 auto; margin-top: 15px; outline: none;" class="save-btn usertimeline-send-btn" href="${process.env.FRONT_END_URL}/user-timeline/${from_user._id}">View Details</a>
                    </div>
                  </div>                     
                </td>
              </tr>
              
            </table>
          </td>
        </tr>

        <tr>
                  
                                      <td align="left" valign="top" colspan="2" style="padding-top: 10px;">
                  
                                          <span style="font-size: 12px; line-height: 1.5; color: #333333;">
                                          
                   If you need help, or you have any other questions, feel free to email info@wrctpl.com, or call customer service toll-free at +91-1234567890.
                                              <br/><br/>
                  
                                             
                                             Kinky - AN online dating service
                  
                                          </span>
                  
                                      </td>
                  
                                  </tr>
        <!-- INTRO : END -->
  
      </table>
      <!-- Email Body : END -->
    </div>
  
  </center>
  </body>
  </html> `;

var sendEmail = Mailjet.post('send');

var emailData = {
'FromEmail': 'info@wrctpl.com',
'FromName': 'Kinky - An online dating service',
'Subject': 'New Friend Request',
'Html-part': email_body,
'Recipients': [{'Email': 'amir@wrctpl.com'}]
};

if(sendEmail.request(emailData)) {

res.json({
success: true, 
code: 200, 
message: 'Please check your email to verify your account.'
});

}
  });

router.post('/verify-email', passport.authenticate('jwt', { session : false }), async (req, res) => {
  const user = await User.findById(req.user.id);
  const activation_link = crypto.randomBytes(64).toString('hex');
  user.activation_link = activation_link;
  user.save();

  var email_body = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">

                  <html xmlns="http://www.w3.org/1999/xhtml">
                  
                  <head>
                  
                      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
                  
                      <title>Registration confirmation</title>
                  
                      <style>
                  
                          body {
                  
                              background-color: #FFFFFF; padding: 0; margin: 0;
                  
                          }
                  
                      </style>
                  
                  </head>
                  
                  <body style="background-color: #FFFFFF; padding: 0; margin: 0;">
                  
                  <table border="0" cellpadding="0" cellspacing="10" height="100%" bgcolor="#FFFFFF" width="100%" style="max-width: 650px;" id="bodyTable">
                  
                      <tr>
                  
                          <td align="center" valign="top">
                  
                              <table border="0" cellpadding="0" cellspacing="0" width="100%" id="emailContainer" style="font-family:Arial; color: #333333;">
                  
                                  <!-- Logo -->
                  
                                  <tr>
                  
                                      <td align="left" valign="top" colspan="2" style="border-bottom: 1px solid #CCCCCC; padding-bottom: 10px;">
                  
                                          
                  
                                      </td>
                  
                                  </tr>
                  
                                  <!-- Title -->
                  
                                  <tr>
                  
                                      <td align="left" valign="top" colspan="2" style="border-bottom: 1px solid #CCCCCC; padding: 20px 0 10px 0;">
                  
                                          <span style="font-size: 18px; font-weight: normal;">Email verification</span>
                  
                                      </td>
                  
                                  </tr>
                  
                                  <!-- Messages -->
                  
                                  <tr>
                  
                                      <td align="left" valign="top" colspan="2" style="padding-top: 10px;">
                  
                                          <span style="font-size: 12px; line-height: 1.5; color: #333333;">
                  
                                            Hi ${user.username}, <br/>    
                                            Please click on the below link to verify your email
                  
                                              <br/><br/>
                  
                                              <a href="${process.env.FRONT_END_URL}/verify/${activation_link}">Click here to verify</a>
                                              <br/>
              
                                              
                  
                                              <br/><br/>
                  
                                              We recommend that you keep your password secure and not share it with anyone.If you feel your password has been compromised, you can change it by going to your Change password page and clicking on the "Change Password" link.
                  
                                              <br/><br/>
                  
                                             
                                             Kinky - AN online dating service
                  
                                          </span>
                  
                                      </td>
                  
                                  </tr>
                  
                              </table>
                  
                          </td>
                  
                      </tr>
                  
                  </table>
                  
                  </body>
                  
                  </html> `;
              
        var sendEmail = Mailjet.post('send');
      
        var emailData = {
            'FromEmail': 'info@wrctpl.com',
            'FromName': 'Kinky - An online dating service',
            'Subject': 'Email verification',
            'Html-part': email_body,
            'Recipients': [{'Email': user.email}]
        };
        
        if(sendEmail.request(emailData)) {
          
          res.json({
            success: true, 
            code: 200, 
            message: 'Please check your email to verify your account.'
          });
          
        }
})

router.get('/load-json', (req, res) => {
  const states = search_states(CountryList, "India");
  console.log(states);
  console.log(req.connection.remoteAddress);
  res.send("Loaded");
})

router.get('/load-geo', (req, res) => {
  var Request = require("request");
  Request.get("https://jsonip.com/", (error, response, body) => {
    if(error) {
        return console.dir(error);
    }
    const data = JSON.parse(body);
    console.log(data.ip);
});
})

router.post('/load-location', (req, res) => {
  var Request = require("request");
  var iplocation = require('iplocation');
  Request.get("https://jsonip.com/", (error, response, body) => {
    if(error) {
        return console.dir(error);
    }
    const data = JSON.parse(body);
    iplocation(data.ip, (error, response) => {
      return res.json({
        country: response.country_name,
        city: response.city
      })
    })
  });
  
})

router.post('/load-cities', (req, res) => {
  const cities = search_states(CountryList, req.body.country);
  
  return res.json({
    cities: cities
  });
})

router.post('/upload-profile-image', upload.any('images'), passport.authenticate('jwt', { session : false }), (req, res) => {
     var imageData = [];
     for(let i = 0; i < req.files.length; i++) {
        
        imageData.push({
          url: req.files[i].transforms[0].location,
          altTag: req.files[i].transforms[0].key,
          access: 'Private'
        })
     }
  
  User.findByIdAndUpdate(
    req.user.id,
    {$push: {images: imageData}},
    {safe: true, upsert: true},
    (err, data) => {
     
      User.findById(req.user.id).then(user => {
        
        return res.json({
          success: true,
          code: 200,
          info: user
        });
      })
      
    }
  )

  
});

router.post('/upload-profile-video', video.any('videos'), passport.authenticate('jwt', { session : false }), (req, res) => {

  var videoData = [];
  for(let i = 0; i < req.files.length; i++) {
     
    videoData.push({
       url: req.files[i].location,
       altTag: req.files[i].key,
       access: 'Private'
     })
  }

  User.findByIdAndUpdate(
  req.user.id,
  {$push: {videos: videoData}},
  {safe: true, upsert: true},
  (err, data) => {
    
    User.findById(req.user.id).then(user => {
      
      return res.json({
        success: true,
        code: 200,
        info: user
      });
    })
    
  }
  )

  
})
router.post('/video-set-private', passport.authenticate('jwt', { session : false }), (req, res) => {

  User.update({"_id": req.user.id, "videos.url": `${req.body.videoUrl}`}, 
  {
    $set: {"videos.$.access": `${req.body.access}`}}, (err, data) => {
        
        User.findById(req.user.id).then(user => {
          
          return res.json({
            success: true,
            code: 200,
            info: user
          });
        })
});
  
})
router.post('/video-delete', passport.authenticate('jwt', { session : false }), (req, res) => {

  User.findById(req.user.id).then(user => {
    
 for(let i =0;i<user.videos.length;i++){
  if(user.videos[i].url == req.body.id){
    //console.log(user.videos[i].access);
    user.videos.splice(i, 1);
  }
 }
 if(user.save()){
  return res.json({
    success: true,
    code: 200,
    info: user
  });
 }
  })
  
})
router.post('/video-update', passport.authenticate('jwt', { session : false }), (req, res) => {

  User.update({"_id": req.user.id, "videos.url": `${req.body.videoUrl}`}, 
  {
    $set: {"videos.$.access": `${req.body.access}`, "videos.$.altTag": `${req.body.altTag}`}
  }, (err, data) => {
        
        User.findById(req.user.id).then(user => {
          
          return res.json({
            success: true,
            code: 200,
            info: user
          });
        })
});
  
})

router.post('/delete-image', passport.authenticate('jwt', { session : false }), async (req, res) => {
  const user = await User.findById(req.user.id);
  const imgArr = _.reject(user.images, img => img.url === req.body.image);
  user.images = imgArr;
  user.save();
  return res.json({
    success: true,
    code: 200,
    info: user
  })
})

router.post('/move-to-private', passport.authenticate('jwt', { session: false }), (req, res) => {
  
  User.update({"_id": req.user.id, "images.url": `${req.body.imageUrl}`}, 
  {
    $set: {"images.$.access": `${req.body.access}`}}, (err, data) => {
        
        User.findById(req.user.id).then(user => {
          
          return res.json({
            success: true,
            code: 200,
            info: user
          });
        })
});
  
});

router.post('/set-as-profile', passport.authenticate('jwt', { session: false }), async (req, res) => {
  const user = await User.findById(req.user.id);
  user.avatar = req.body.imageUrl;
  user.save();

  User.update({"_id": req.user.id, "images.url": `${req.body.imageUrl}`}, {
    $set: {"images.$.access": "Public" }}, (err, data) => {
      User.findById(req.user.id).then(user => {
          
        return res.json({
          success: true,
          code: 200,
          info: user
        });
      });
    });
});

router.post('/search-by-username', passport.authenticate('jwt', { session : false }), async (req, res) => {

  Settings.aggregate([
    { "$match": { "user": { "$ne": new mongoose.Types.ObjectId(req.user.id ) } } },
    {
      "$lookup": {
          "from": "users",
          "localField": "user",
          "foreignField": "_id",
          "as": "user"
      }
    },
    {
      "$lookup": {
          "from": "friendrequests",
          "localField": "user._id",
          "foreignField": "from_user",
          "as": "friend_request_from"
      }
    },
    {
      "$lookup": {
          "from": "friendrequests",
          "localField": "user._id",
          "foreignField": "to_user",
          "as": "friend_request_to"
      }
    },
    { "$match": { "user.username": req.body.username } }
  ]).exec((err, response) => {
    return res.json({
      success: true,
      code: 200,
      info: response
    });
   
  });
  
});
router.post('/userdetailsByid' , async (req, res) => {
  const user = await User.findById(req.body.id);

  if(user) {
    return res.json({
      success: true,
      code: 200,
      info: user
    });
  }else{
    return res.json({
      success: true,
      code: 400,
      info: "user not found"
    });
  }
});
router.post('/submit-quick-search', passport.authenticate('jwt', { session : false }), (req, res) => {
  
  var match =  { $match: { 
    $and: [ 
        { distance: parseInt(req.body.distance), country: req.body.country, state: req.body.state, user: { $ne: new mongoose.Types.ObjectId(req.user.id ) } },  
        {
            $or:[{looking_for_male: req.body.looking_for_male},
                 {looking_for_female: req.body.looking_for_female},
                 {looking_for_couple: req.body.looking_for_couple},
                 {looking_for_cd: req.body.looking_for_cd}] 
        }]
    }
  }

Settings.aggregate([
  match,
    {
      "$lookup": {
          "from": "users",
          "localField": "user",
          "foreignField": "_id",
          "as": "user"
      }
    },
    {
      "$lookup": {
          "from": "friendrequests",
          "localField": "user._id",
          "foreignField": "from_user",
          "as": "friend_request_from"
      }
    },
    {
      "$lookup": {
          "from": "friendrequests",
          "localField": "user._id",
          "foreignField": "to_user",
          "as": "friend_request_to"
      }
    },
  /* 
    {"$match":{ $or: [{ 'friend_request.from_user': req.user.id }, { 'friend_request.to_user': req.user.id }] }}, */
  ]).exec((err, response) => {
    console.log(response);
    return res.json({
      success: true,
      code: 200,
      info: response
    });
  });
})
router.post('/submit-advance-search', passport.authenticate('jwt', { session : false }), (req, res) => {
  let cond = {};

  if(req.body.ethnicity) {
    cond["user.ethnicity"] = new mongoose.Types.ObjectId(req.body.ethnicity);
  }
  if(req.body.smoke) {
    cond["user.smoke"] = req.body.smoke;
  }
  if(req.body.safe_sex) {
    cond["user.safe_sex"] = req.body.safe_sex;
  }
  if(req.body.size) {
    cond["user.size"] = req.body.size;
  }
  if(req.body.build) {
    cond["user.build"] = new mongoose.Types.ObjectId(req.body.build);
  } 

  var match =  { $match: { 
    $and: [ 
        { distance: parseInt(req.body.distance), country: req.body.country, state: req.body.state,from_age:req.body.from_age,to_age:req.body.to_age,user: { $ne: new mongoose.Types.ObjectId(req.user.id ) } },  
         {
            $or:[{looking_for_male: req.body.looking_for_male},
                 {looking_for_female: req.body.looking_for_female},
                 {looking_for_couple: req.body.looking_for_couple},
                 {looking_for_cd: req.body.looking_for_cd}] 
        } ]
    }
  }



  Settings.aggregate([
    match,
    {
      "$lookup": {
          "from": "users",
          "localField": "user",
          "foreignField": "_id",
          "as": "user"
      }
    },
    {
      "$lookup": {
          "from": "friendrequests",
          "localField": "user._id",
          "foreignField": "from_user",
          "as": "friend_request_from"
      }
    },
    {
      "$lookup": {
          "from": "friendrequests",
          "localField": "user._id",
          "foreignField": "to_user",
          "as": "friend_request_to"
      }
    },
    { $match: cond },
  ]).exec((err, response) => {
    return res.json({
      success: true,
      code: 200,
      info: response
    });
   
  });

})


router.post('/request_send', passport.authenticate('jwt', { session : false }), async (req, res) => {

  const from_id = req.user.id;
  const to_id = req.body.to_id;

  const sendRequest = new Friendrequest({
    from_user : from_id,
    to_user : to_id,
    requested_add : new Date()
  });
  if (sendRequest.save()){

    return res.json({
      success: true,
      code: 200,
      status: 0,
      info: "Request sent successfully"
    });
  }
    

});
router.post('/fetch-invetation', passport.authenticate('jwt', { session : false }), async (req, res) => {

  const from_id = req.user.id;
  const user = await Friendrequest.find({to_user: from_id , status: 0}).populate('from_user');
  if(user){
    return res.json({
      success: true,
      code: 200,
      info: user
    });
  }
    

});
router.post('/show_invetation_list', passport.authenticate('jwt', { session : false }), async (req, res) => {

  const from_id = req.user.id;
  const user = await Friendrequest.find({from_user: from_id, status: { $ne: 1 }}).populate('to_user');
  if(user){
    return res.json({
      success: true,
      code: 200,
      info: user
    });
  }
    

});
router.get('/check_friends', passport.authenticate('jwt', { session : false }), async (req, res) => {

  const to_id = req.user.id;
 
  const users = await Friendrequest.find().and([
    { $or: [{to_user: to_id}, {from_user: to_id}] }
]).populate('from_user').populate('to_user');

  
if(users){
  return res.json({
    success: true,
    code: 200,
    info: users
  });
} 

    

});


router.post('/similar_profile', passport.authenticate('jwt', { session : false }), async (req, res) => {

  const user_details = await User.findOne({_id:req.body.to_id});

const users = await User.find({gender: user_details.gender , looking_for_male: user_details.looking_for_male,looking_for_female: user_details.looking_for_female,looking_for_couple: user_details.looking_for_couple,looking_for_cd: user_details.looking_for_cd,_id:{$ne:user_details._id}});


  
 if(users){
  return res.json({
    success: true,
    code: 200,
    info: users
  }); 
} 

    

});

router.post('/saveTohotlist', passport.authenticate('jwt', { session : false }), async (req, res) => {

 const flag = req.body.flag;
 const user_id = req.body.to_id;
 const user = await User.findOne({_id: req.user.id});
if(flag == true){
  User.update({ _id: req.user.id }, req.body , { upsert: true, setDefaultsOnInsert: true } , (err, data) => {
    User.findById(req.user.id).then(user => {
          
      return res.json({
        success: true,
        code: 200,
        info: user
      });
    })
  });

}else{
  user.hotlist.splice( user.hotlist.indexOf(req.body.hotlist), 1 );
  user.save();
  return res.json({
    success: true,
    code: 200,
    info: user
  });
}


    

});
router.post('/accept', passport.authenticate('jwt', { session : false }), async (req, res) => {

  const to_id = req.user.id;
  const from_id = req.body.from_id;

  const user = await Friendrequest.findOne({from_user:from_id,to_user:to_id});

  user.status = 1;
  user.requested_add = new Date();

   if(user.save()){
    const users = await Friendrequest.find({to_user: to_id, status: 0}).populate('from_user');
    return res.json({
      success: true,
      code: 200,
      info: users,
      msg: "Request accepted"
    });
  } 
    

});
router.post('/reject', passport.authenticate('jwt', { session : false }), async (req, res) => {

  const to_id = req.user.id;
  const from_id = req.body.from_id;

  const user = await Friendrequest.findOne({from_user:from_id,to_user:to_id});

  user.status = 2;
  user.requested_add = new Date();

   if(user.save()){
    const users = await Friendrequest.find({to_user: to_id, status: 0}).populate('from_user');
    return res.json({
      success: true,
      code: 200,
      info: users,
      msg: "Request decline"
    });
  } 
    

});
router.post('/friend_list', passport.authenticate('jwt', { session : false }), async (req, res) => {

  const to_id = req.user.id;
 
  const users = await Friendrequest.find( { status: 1 }).and([
    { $or: [{to_user: to_id}, {from_user: to_id}] }
]).populate('from_user').populate('to_user');

  
  
   if(users){
    return res.json({
      success: true,
      code: 200,
      info: users
    });
  } 
    

});
router.post('/friend_list_by_user', passport.authenticate('jwt', { session : false }), async (req, res) => {

  const to_id = req.body.id;

  const users = await Friendrequest.find( { status: 1 }).and([
    { $or: [{to_user: to_id}, {from_user: to_id}] }
]).populate('from_user').populate('to_user');
  
   if(users){
    return res.json({
      success: true,
      code: 200,
      info: users
    });
  } 
    

});
router.post('/cancel_invetation', passport.authenticate('jwt', { session : false }), async (req, res) => {

  const from_id = req.user.id;
  const to_id = req.body.to_id;

  const user = await Friendrequest.findOne({from_user:from_id,to_user:to_id});
  
    if(user.remove()){
  const users = await Friendrequest.find({from_user: from_id}).populate('to_user');
    return res.json({
      success: true,
      code: 200,
      info: users, 
      msg: 'Request canceled'
    });
  }  
    

});
router.post('/friend_remove', passport.authenticate('jwt', { session : false }), async (req, res) => {

  const to_id = req.body.to_id;
  const from_id = req.user.id;

  const user = await Friendrequest.findOne({from_user:from_id,to_user:to_id});
  
  
   if(user.remove()){
  const users = await Friendrequest.find({to_user: to_id}).populate('from_user');
    return res.json({
      success: true,
      code: 200,
      info: users, 
      msg: 'Friend removed from list'
    });
  }  
    

});
router.post('/count_friend_list', passport.authenticate('jwt', { session : false }), async (req, res) => {

  const to_users = await Friendrequest.find({to_user: req.user.id, status: 1});
  const from_users = await Friendrequest.find({from_user: req.user.id, status: 1});
  const users = to_users.concat(from_users);
if(users){
  return res.json({
    success: true,
    count: users.length,
    code: 200
  });
}

});
router.post('/friends_request_count', passport.authenticate('jwt', { session : false }), (req, res) => {

  
  Friendrequest.find({to_user: req.user.id, status: { $ne: 1 }}).count(function(err,countData){

    return res.json({
      success: true,
      count: countData,
      code: 200
    });


});
    

});

router.post('/friends_request_count', passport.authenticate('jwt', { session: false}), (req, res) => {

  Friendrequest.find({ to_user: req.user.id }).count((err, countData) => {
    return res.json({
      success: true,
      count: countData,
      code: 200
    });
  });

});



router.post('/post_description', passport.authenticate('jwt', { session : false }), async (req, res) => {

   const post = new Post({
     user: req.user.id,
     add_time: new Date(),
     description: req.body.post_description
   });

   if(post.save()){
    return res.json({
      success: true,
      info: post,
      code: 200
    });
   }

});
router.post('/post_list', passport.authenticate('jwt', { session : false }), async (req, res) => {

const post = await Post.find({user:req.user.id}).populate('user');

   if(post){
    return res.json({
      success: true,
      info: post,
      code: 200
    });
   }

});


router.post("/change-image-details", passport.authenticate('jwt', { session : false }), async (req, res) => {
  User.update({"_id": req.user.id, "images.url": `${req.body.imageUrl}`}, 
  {
    $set: {"images.$.access": `${req.body.access}`, "images.$.altTag": `${req.body.altTag}`}
  }, (err, data) => {
        
        User.findById(req.user.id).then(user => {
          
          return res.json({
            success: true,
            code: 200,
            info: user
          });
        })
});
})

router.post("/check-loggedin", passport.authenticate('jwt', { session : false }), async (req, res) => {
  const user = await UserActivity.find({ user: req.body.user_id });
  
  if(user.length > 0) {
    pusher.trigger("events-channel", "check-logged-in", {
      status: 1,
      user_id: req.body.user_id
    });
  }
  else {
    pusher.trigger("events-channel", "check-logged-in", {
      status: 0,
      user_id: req.body.user_id
    });
  }
  return res.json({ success: true });
})


function diff_years(dt2, dt1) 
{

var diff =(dt2.getTime() - dt1.getTime()) / 1000;
  diff /= (60 * 60 * 24);
return Math.abs(Math.round(diff/365.25));
  
}

var search_states = function(countries, country) {
  for(let i in countries) {
    if(i === country ) return countries[i]
  }
}
 function getAge(DOB) {
    var today = new Date();
    var birthDate = new Date(DOB);
    var age = today.getFullYear() - birthDate.getFullYear();
    var m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age = age - 1;
    }

    return age;
}
module.exports = router;

