const mongoose = require('mongoose');
const findOrCreate = require('mongoose-findorcreate');
const { Schema, SchemaTypes, model } = mongoose;
const passportLocalMongoose = require('passport-local-mongoose');
// const passport = require('passport');

const userSchema = new mongoose.Schema ({
    email: String, // User login email (formerly "username")
    username: String, // Username (formerly "username")
    fullname: String,
    password: String,
    userImage: String,

    googleId: String,
    facebookId: String,
    twitterId: String,
    instagramId: String,
    githubId: String,

    bio: String,
    friends: [{
        type: SchemaTypes.ObjectId,
        ref: 'User',
    }],

    posts: [{
        type: SchemaTypes.ObjectId,
        ref: 'Posts',
    }],
    chats: [{
        type: SchemaTypes.ObjectId,
        ref: 'Chat'
    }],
    following:[{
        type: SchemaTypes.ObjectId,
        ref: 'User'
    }],
    followers: [{
        type: SchemaTypes.ObjectId,
        ref: 'User'
    }]

});

userSchema.plugin(passportLocalMongoose, { usernameField : 'email' });
userSchema.plugin(findOrCreate);
const User = new mongoose.model('User', userSchema);


module.exports = User;