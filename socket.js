require("dotenv").config();
const express = require('express');
const socket = require('socket.io');
const ngrok = require("@ngrok/ngrok");
const User = require('./model/users');
const Post = require('./model/posts');
const Chat = require('./model/chat');
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


const server = require('./app');


const socketFunctions = function() {

    // WEBSOCKET SETUP FOR REALTIME DATA EXCHANGFE BETWEEN SERVER AND CLIENT USING SOCKET.IO

const io = socket(server, {
    transports: ["websocket","webtransport"],
    addTrailingSlash: false,
  });
  
  io.on('connection', function(socket){
      console.log("made socket connection on "+ socket.id)

    // join default room for user 
    socket.join(socket.id);







  // WEBSOCKET SETUP FOR SIGNUP ROUTE
    // function to check form credentials
    socket.on('signupFormCheck',function(data){
      async function validateForm(){
        const emailCheck = await User.find({email: data.email});
        const usernameCheck = await User.find({username: data.username});

        if (emailCheck.length===0 && usernameCheck.length===0) {
          // console.log("valid")
          socket.emit('signupFormCheck', {
            status: "valid"
          });
        } else {
          // console.log("invalid")
          socket.emit('signupFormCheck', {
            status: "invalid",
            emailError: emailCheck.length,
            usernameError: usernameCheck.length,
          });
        };
      };

      validateForm();
    });
    // function to tell user if username alredy exists 
    socket.on('createUsername', function(data) {
      // console.log(data.newUsername)

      async function checkUsername() {
      const allUsernames = await User.find({username: data.newUsername})
        if (allUsernames.length===0) {
          socket.emit('createUsername', "available")
        } else {
          socket.emit('createUsername', "unavailable")
        };
      };
      checkUsername();
    });
  








  // WEBSOCKET SETUP FOR PROFILE EDIT
    socket.on('editUsername', function(data){
      async function usernameCheck(){
        const foundUsers = await User.find({username: data.newUsername});
        if (foundUsers.length===0) {
          socket.emit('editUsername', "available");
        } else {
          socket.emit('editUsername', "unavailable");
        };
      };
      usernameCheck();
    });











  // WEBSOCKET SETUP FOR MESSAGES PAGE

    socket.on('msgSearch', function(data){
        console.log(data)
        async function search(){
          
          const msgUsers = [] 

          const startsWith = await User.find({username: {$regex: "^"+data.searchData, $options: "i"}});

          const includes = await User.find({username: {$regex: data.searchData, $options: "i"}});


          msgUsers.push(...startsWith)

          if (startsWith.length === 0 ) {
            msgUsers.push(...includes)
          };

          socket.emit('msgUsers', msgUsers);
        };
        search()
        
    });








  // WEBSOCKET SETUP FOR CHAT

      // Send message to specific chatroom
      socket.on("chat-room", function(data){
          socket.join(data);
      });
  
      // User is typing notification
      socket.on('typing',function(data){
          socket.to(data.room).emit('typing', data);
      });
  
  
      // Using Websocket (Socket.io) to send data to the database directly
      socket.on('chat',function(data) {
          socket.to(data.room).emit('chat',data);
  
  
      // send the recieved data into the Chat database
              Chat.findById(data.room).then(function(foundChat){
  
              foundChat.messages.push({
                  authorName: data.senderName,
                  authorId: data.senderId,
                  recipientName: data.recipientName,
                  text: data.message,
              });
  
              foundChat.save();
  
          });
      });









      // WEBSOCKET (Socket.io) SETUP FOR DICOVER SEARCH

      socket.emit('search-room', {
        room: socket.id,
      });

      // // join default room
      // socket.join(socket.id)

      // Listen for emits from backend
      socket.on('search', function(data){
        async function search(){
          
          const searchResult = [] 

          const startsWith = await User.find({username: {$regex: "^"+data.searchData, $options: "i"}});

          const includes = await User.find({username: {$regex: data.searchData, $options: "i"}});


          searchResult.push(...startsWith)

          if (startsWith.length === 0 ) {
            searchResult.push(...includes)
          };

          socket.emit('appUsers', searchResult); 
        }
        search()
        
      });


  
  });


}


module.exports = socketFunctions