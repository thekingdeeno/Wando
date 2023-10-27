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
// routing func setup
const router = express.Router();


router.get('/', function(req, res){
    if (req.isAuthenticated()){
      Chat.find({"users.userId": (req.user).id,"messages": {$exists: true,$not: {$size: 0}}}).then(function(foundChats){
  
      User.findById((req.user).id).then((found) =>{
        res.render('messages', {
          myObjId: found._id,
          myId: (req.user).id,
          myUsername: found.username,
          chats: foundChats,
        });            
      });
  
  
      }).catch(err=>{
        console.log(err);
      });
  
    }else{
      res.redirect('/register')
    };
  });
  
  router.post('/', function(req, res){
    User.find({username: req.body.search}).then(function(searchResult){
  
      res.render('chatsearchresult',{
        foundUser : searchResult,
      });
    });
  });


  module.exports = router;
