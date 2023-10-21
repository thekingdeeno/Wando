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
    res.render('signup')
});

router.post('/', function(req, res){

  User.register({username: req.body.username,}, req.body.password, function(err, user){
    if (err) {
      console.log(err);
      res.redirect('/register');
    } else {
      passport.authenticate('local')(req, res, function(){
        res.redirect('/home');

        async function defaultUsername(){

          const email = req.body.username;

          const username = (email.split("@"[0]))[0];


          try {
          User.findById(req.user.id).then(function(foundUser){
            User.find({appUsername: username}).then(function(found){
              if (found.length>0) {
                foundUser.appUsername = username + (Math.floor((Math.random() * 100)+ 1)).toString();
                foundUser.save();
              } else {
                foundUser.appUsername = username;
                foundUser.save();
              }
            })

          });

          } catch (error) {
          console.error(error)
          };
        };
          defaultUsername().catch(console.error);
      });
    };
  });

});


module.exports = router;