require("dotenv").config();
const express = require('express');
const socket = require('socket.io');
const ngrok = require("@ngrok/ngrok");
const User = require('../model/users');
const Post = require('../model/posts');
const Chat = require('../model/chat');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const mongodb = require('mongodb');
const findOrCreate = require('mongoose-findorcreate');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const { ObjectId } = require("mongodb");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const TwitterStrategy = require('passport-twitter').Strategy;

const router = express.Router();

router.get('/', function(req, res){
    res.render('signup',{
      allUser: User.find(),
    })
});

router.post('/', function(req, res){

  User.register({email: req.body.email,}, req.body.password, function(err, user){
    if (err) {
      console.log(err);
      res.redirect('/register');
    } else {
      passport.authenticate('local')(req, res, function(){
        res.redirect('/home');

        async function setUserData(){

          // const username = (email.split("@"[0]))[0];

          const foundUser = await User.findById(req.user.id);

            foundUser.fullname = req.body.fullname;
            foundUser.username = req.body.username;

            foundUser.save();

        };
          setUserData()
      });
    };
  });

});


module.exports = router;