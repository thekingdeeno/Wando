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
// console.log(window.location);


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








  // WEBSOCKET SETUP FOR FOLLOW AND UNFOLLOW
    socket.on('profileFollow', function(data) {
      console.log(data);
      async function profileFollow (){
        const newFollower = await User.findById(data.follower);
        const profile = await User.findById(data.profile);


        newFollower.following.push(profile._id);
        profile.followers.push(newFollower._id);

        newFollower.save();
        profile.save();
      };
      profileFollow()
    });

    socket.on('profileUnfollow', function(data) {
      async function profileUnfollow (){
        const unfollower = await User.findById(data.follower);
        const profile = await User.findById(data.profile);

        // removing profile from unfollowers following list
        (unfollower.following).forEach(user => {
          if (user.toString() === (profile._id).toString()) {
            const userIndex = (unfollower.following).indexOf(user);
            (unfollower.following).splice(userIndex, 1);
            unfollower.save();             
          };
         
        });

        // removing unfollower from profile followers list
        (profile.followers).forEach(user => {
          if (user.toString() === (unfollower._id).toString()) {
            const userIndex = (profile.followers).indexOf(user);
            (profile.followers).splice(userIndex, 1);
            profile.save();
          };

        });
      };
      profileUnfollow();
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


      // SOCKET SETUP FOR POST LIKE AND UNLIKE
      socket.on('like-post', function(data){

        async function likePost(){
          const foundPost = await Post.findById(data.postId);

          if ((foundPost.likes).includes(data.likeId)) {
            (foundPost.likes).forEach(like => {
              console.log('2');
              console.log(like,data.likeId);
              if (like.toString()===(data.likeId).toString()) {
                const likeIndex = (foundPost.likes).indexOf(like);
                foundPost.likes.splice(likeIndex, 1);
                foundPost.save();
              };
            });            
          } else {
            foundPost.likes.push(data.likeId)
            foundPost.save();            
          }         


        };
        likePost();
      });



      // SOCKET SETUP FOR POST COMMENTS
      socket.on('show-comments', function(postId){
        console.log(postId);
        Post.findById(postId).then(function(foundPost) {
          socket.emit('show-comments', foundPost)
        });
      });

      socket.on('new-comment', function(data){
        console.log(data);

        async function postComment(){
          const post = await Post.findById(data.post);
          const commenter = await User.findById(data.user);
          (post.comments).push({
            userId: data.user,
            username: commenter.username,
            content: data.comment,
          });
          post.save();
        };
        postComment();

      });








  });


}


module.exports = socketFunctions