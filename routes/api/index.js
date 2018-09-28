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
var multer = require('multer');
var imager = require('multer-imager');
const im = require('imagemagick');
const PasswordChangeRequests = require('../../models/PasswordChangeRequests');
const _ = require('lodash');
const mongoose = require('mongoose');

const CountryList = require('../../config/countries.json');
const Post = require('../../models/Post');

//for sending email
const Mailjet = require('node-mailjet').connect('f6419360e64064bc8ea8c4ea949e7eb8', 'fde7e8364b2ba00150f43eae0851cc85');
//end


router.post('/signup',  async (req, res) => {
      const current_date = new Date();
      const new_date = new Date(req.body.yyyy, req.body.mm - 1 , req.body.dd + 1);

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
        const activation_link = crypto.randomBytes(64).toString('hex');
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

router.post('/logout', passport.authenticate('jwt', {session : false}), async(req,res) => {

UserActivity.updateOne({
  user:req.user.id,
  status:1
},{
  $set: {
    status: 0
  }
}).then(user => {
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

router.post('/upload-profile-image', passport.authenticate('jwt', { session : false }), (req, res) => {
 
  User.findByIdAndUpdate(
    req.user.id,
    {$push: {images: req.body.imageData}},
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
router.post('/upload-profile-video', passport.authenticate('jwt', { session : false }), (req, res) => {
  User.findByIdAndUpdate(
    req.user.id,
    {$push: {videos: req.body.videoData}},
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
  return res.json({
    success: true,
    code: 200,
    info: user
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
          "foreignField": "to_user",
          "as": "friend_request"
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
  let cond = {};
  let settingCond = {};

  if(req.body.looking_for_male){
    settingCond.looking_for_male = req.body.looking_for_male;
  }
  if(req.body.looking_for_female){
    settingCond.looking_for_female = req.body.looking_for_female;
  }
  if(req.body.looking_for_couple){
    settingCond.looking_for_couple = req.body.looking_for_couple;
  }
  if(req.body.looking_for_cd){
    settingCond.looking_for_cd = req.body.looking_for_cd;
  }
  
  if(req.body.distance){
    settingCond.distance = parseInt(req.body.distance);
  }
  if(req.body.country){
    settingCond.country = req.body.country;
  }
  if(req.body.state){
    settingCond.state = req.body.state;
  }
  
  

  if(req.body.gender) {
    cond["user.gender"] = req.body.gender;
  }

Settings.aggregate([
    { "$match": settingCond },
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
          "foreignField": "to_user",
          "as": "friend_request"
      }
    },
    { "$match": cond }
  ]).exec((err, response) => {
    
    return res.json({
      success: true,
      code: 200,
      info: response
    });
  }); 
})
router.post('/submit-advance-search', passport.authenticate('jwt', { session : false }), (req, res) => {
  let cond = {};
  let settingCond = {};

  if(req.body.looking_for_male){
    settingCond.looking_for_male = req.body.looking_for_male;
  }
  if(req.body.looking_for_female){
    settingCond.looking_for_female = req.body.looking_for_female;
  }
  if(req.body.looking_for_couple){
    settingCond.looking_for_couple = req.body.looking_for_couple;
  }
  if(req.body.looking_for_cd){
    settingCond.looking_for_cd = req.body.looking_for_cd;
  }
  
  if(req.body.distance){
    settingCond.distance = parseInt(req.body.distance);
  }
  if(req.body.country){
    settingCond.country = req.body.country;
  }
  if(req.body.state){
    settingCond.state = req.body.state;
  }
  if(req.body.from_age){
    settingCond.from_age = req.body.from_age;
  }
  if(req.body.to_age){
    settingCond.to_age = req.body.to_age;
  }
  
  if(req.body.gender) {
    cond["user.gender"] = req.body.gender;
  }
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


  Settings.aggregate([
    { "$match": settingCond },
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
          "foreignField": "to_user",
          "as": "friend_request"
      }
    },
    { "$match": cond }
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
      info: "Request send successfully"
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
  const user = await Friendrequest.find({from_user: from_id,status:0}).populate('to_user');
  if(user){
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
    const users2 = await Friendrequest.find({to_user: to_id, status: 1}).populate('from_user');
    return res.json({
      success: true,
      code: 200,
      info: users,
      results:users2,
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

  const users1 = await Friendrequest.find({to_user: to_id, status: 1}).populate('from_user');
  const users2 = await Friendrequest.find({from_user: to_id, status: 1}).populate('to_user');

  const user3 = users1.concat(users2);


  
   if(user3){
    return res.json({
      success: true,
      code: 200,
      info: user3
    });
  } 
    

});
router.post('/friend_list_by_user', passport.authenticate('jwt', { session : false }), async (req, res) => {

  const to_id = req.body.id;

  const users1 = await Friendrequest.find({to_user: to_id, status: 1}).populate('from_user');
  const users2 = await Friendrequest.find({from_user: to_id, status: 1}).populate('to_user');
  const user3 = users1.concat(users2);
   if(user3){
    return res.json({
      success: true,
      code: 200,
      info: user3
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
      msg: 'Request withdraw successfully'
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
router.post('/friends_request_count', passport.authenticate('jwt', { session : false }), async (req, res) => {

  Friendrequest.find({to_user: req.user.id, status: 0}).count(function(err,countData){

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

module.exports = router;

