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

const server = require('../app');


router.get('/:searchParam', function(req, res){
    if (req.isAuthenticated()) {
            async function renderProfile(){
        const viewerData = await User.findById((req.user).id);
        const profileData = await User.findOne({username: req.params.searchParam});

        try {
            const userPosts = await Post.find({authorId: profileData._id});


            res.render('profile',{
                postArray: userPosts,
                profileInfo: profileData,
                viewerInfo: viewerData,
            });

        } catch (error) {

            // res.redirect(`/profile/${viewerData.username}`);
            res.redirect(`/home`);
            
        };

    };

    renderProfile();
    } else {
        res.redirect('/register')
    }


});




module.exports = router;