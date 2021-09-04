const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

///////////For mailgun//////////

var API_KEY = "";
var DOMAIN = "";
const mailgun = require("mailgun-js")({
  apiKey: API_KEY,
  domain: DOMAIN
});

///////////////////////////////

const app = express();
const JWT_SECRET = 'secret pass';

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));
app.use(express.json());

mongoose.connect("mongodb://localhost:27017/regDB", {
  useNewUrlParser: true
});

const userSchema = {
  email: String,
  password: String
};

const User = mongoose.model("User", userSchema);

/////////////////////////////////////////////////////

app.post("/signup", (req, res) => {

  const newUser = new User({
    email: req.body.email,
    password: req.body.password
  });

  newUser.save(function(err) {
    if (!err) {
      res.send("Successfully added");
    } else {
      res.send(err);
    }
  });

})

app.post("/login", (req, res) => {

  User.findOne({
      email: req.body.email,
      password: req.body.password
    },
    function(err, foundUser) {
      if (!err) {
        res.send(foundUser);
      } else {
        res.send(err);
      }
    }
  );

})

app.post("/forgot-password", (req, res) => {

  User.findOne({
      email: req.body.email
    },
    function(err, foundUser) {
      if (!err) {
        const secret = JWT_SECRET + foundUser.password;
        const payload = {
          email: foundUser.email,
          id: foundUser._id
        }
        const token = jwt.sign(payload, secret, {
          expiresIn: '24h'
        });
        const link = "http://localhost:3000/reset-password/"+foundUser._id+"/"+token;

        const data = {
          from: 'Jishnu <jishnusarmah1398oda@gmail.com>',
          to: 'jishnusarmah1398oda@gmail.com',
          subject: 'Reset your password',
          text: 'Here is your reset link ' + link
        };

        mailgun.messages().send(data, (error, body) => {
          if(!error){
            console.log(body);
          }
          else{
            console.log(error);
          }
        });

        res.send("Reset link sent");

      }
      else {
        res.send(err);
      }
    }
  );

})

app.post('/reset-password/:id/:token', (req, res)=>{

  const token=req.params.token;
  console.log(req.params.token);

  User.findOne(
    {_id: req.params.id},
    function(err,foundUser){
      if(!err){
        const secret = JWT_SECRET + foundUser.password;
        console.log(secret);

        try{
          const payload=jwt.verify(token,secret);

          User.updateOne(
            {_id: req.params.id},
            {$set: req.body},
            function(err){
              if(!err){
                res.send("Password updated");
              }
              else{
                res.send(err);
              }
            }
          )
        } catch(error){
          res.send(error.message);
        }
      }
    }
  );

})

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
