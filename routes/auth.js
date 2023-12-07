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
const TiktokStrategy = require('passport-tiktok-auth').Strategy;
// routing func setup
const router = express.Router();


// GOOGLE AUTHOURIZATION REGISTRATION ROUTE
router.get("/google", passport.authenticate('google', {scope: ["profile"]}));

// GOOGLE AUTHOURIZATION CALLBACK ROUTE
router.get("/google/wando",
      passport.authenticate('google', {failureRedirect:"/register"}),
      function(req, res){
        res.redirect("/home")
      }
)



// FACEBOOK AUTHOURIZATION REGISTRATION ROUTE
router.get('/facebook',
  passport.authenticate('facebook'));

// FACEBOOK AUTHOURIZATION CALLBACK ROUTE
router.get('/facebook/wando',
  passport.authenticate('facebook', { failureRedirect: '/register' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/home');
  });




// TWITTER AUTHOURIZATION REGISTRATION ROUTE
router.get('/twitter',
  passport.authenticate('twitter'));

// TWITTER AUTHOURIZATION CALLBACK ROUTE
router.get('/twitter/wando', 
  passport.authenticate('twitter', { failureRedirect: '/register' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/home');
  });


  // TIKTOK AUTHOURIZATION REGISTRATION ROUTE
  router.get('/tiktok',
  passport.authenticate('tiktok'));

  // TIKTOK AUTHOURIZATION CALLBACK ROUTE
  router.get('/tiktok/wando', 
    passport.authenticate('tiktok', { failureRedirect: '/register' }),
    function(req, res) {
        // Successful authentication, redirect home.
        res.redirect('/home');
    });



module.exports = router