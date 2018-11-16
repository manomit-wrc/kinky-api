const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

const passport = require("passport");
const path = require("path");
const cors = require('cors');
require('dotenv').config({path: 'variables.env'});
const dbURI = require("./config/keys").mongoURI;

const port = process.env.PORT || 9000;



const api = require('./routes/api/index');

const app = express();

// const allowCrossDomain = function(req, res, next) {
//     res.header('Access-Control-Allow-Origin', '*');
//     res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE');
//     res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

//     // intercept OPTIONS method
//     if ('OPTIONS' == req.method) {
//         res.send(200);
//     }
//     else {
//         next();
//     }
// };

app.use(cors());

mongoose.Promise = global.Promise;

mongoose.connect(dbURI, { useNewUrlParser: true })
    .then(() => console.log("Database connected successfully"))
    .catch(err => console.log(err));



app.use(bodyParser.urlencoded({
    limit: '50mb',
    extended: false
}));

app.use(bodyParser.json({limit: '50mb'}));


app.use(passport.initialize());


require('./config/passport')(passport);
app.use(express.static(path.join(__dirname, 'public')));


/******* Routes ********/
app.use('/api/users', api);

/******* End **********/


app.listen(port, () => console.log(`Server listening to port ${port}`));
