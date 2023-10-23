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



// to access server for socket.io 
const server = require('../app')

router.get('/:searchParam', function(req, res){

    const chatCall = (req.params.searchParam).slice(0,7)
    if (chatCall === "newChat") {
  
      const userSearchId = (req.params.searchParam).slice(7,31)
      console.log();
  
      Chat.find({$and: [{"users.userId":(req.user).id},{"users.userId": userSearchId}]}).then(function(foundChat){
        
        if (foundChat.length===0) {
  
        User.findById((req.user).id).then(function(user1) {
          User.findById(userSearchId).then(function(user2) {
            
            const chat = new Chat({
              type: "private",
              users: [
                {
                  userName: user1.appUsername,
                  userId: (req.user).id,
                },
                {
                  userName: user2.appUsername,
                  userId: userSearchId,
                }
                  
              ]
            })
          chat.save(res.redirect(`/chat/${(chat._id).toString()}`))
          });
        });
  
        } else {
  
          res.redirect(`/chat/${(foundChat[0]._id).toString()}`)
  
        }
  
      })
  
    }else{
  
      const chatUrl = req.params.searchParam
  
        Chat.findById(req.params.searchParam).then(function(foundChat){
  
          const userArray = foundChat.users;
          userArray.forEach(user => {
            if ((user.userId).toString() != (req.user).id) {
  
            async function userDetails(){
              const primaryUser = await User.findById((req.user).id);
              const secondaryUser = await User.findById(user.userId);
  
                res.render('chat', {
                chatData : foundChat,
                senderData : primaryUser,
                recipientData: secondaryUser,
                wssConnect: chatUrl,
              });
            };
  
          userDetails();
            }
          });
  
        })
        
    };
  });





//   router.post("/", function(req, res){
//     Chat.find({$and: [{"users.userId":(req.user).id},{"users.userId": req.body.recipientId}]}).then(function(foundChat){
      
//       foundChat[0].messages.push({
//         authorName: req.body.senderName,
//         authorId: req.body.senderId,
//         text: req.body.message,
//       });
  
//         foundChat[0].save()
//     });
  
//   })


module.exports = router;