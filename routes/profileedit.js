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

    async function renderProfile(){
        // const userData = await User.findById((req.user).id)
        if (req.isAuthenticated()) {


            res.render('profileedit',{
                // userid: (req.user).id,
                userData: await User.findById((req.user).id),
            });
        } else {
            res.redirect('/login')
        }        
    };
    renderProfile();

});

router.post('/', function(req, res){
    async function updateProfile(){
        const foundUser = await User.findById((req.user).id);
        foundUser.fullname = req.body.fullname;
        foundUser.username = req.body.username;
        foundUser.bio = req.body.bio;
        foundUser.link = req.body.link;
        foundUser.contactEmail = req.body.contactEmail;
        foundUser.contactPhone = req.body.contactPhone;

        foundUser.save().then(()=>{
            res.redirect(`/profile/${foundUser.username}`)
        });
    };
    updateProfile()
});




module.exports = router;