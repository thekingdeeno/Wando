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


const app = express();

// Local Server Setup
const server = app.listen(process.env.PORT, function(){
  console.log(`Wando app server running on ${process.env.PORT}`)
});
// I'm exporting the "server" variable to use in websocket functions within routes
module.exports = server;


app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

// Express Session
app.set('trust proxy', 1) // trust first proxy
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false },
}));

app.use(passport.initialize());
app.use(passport.session());





// MONGOOSE OPERATIONS 

mongoose.connect(`mongodb+srv://deeno:${process.env.MONGODB_PASSWORD}@cluster0.zg4yvyq.mongodb.net/Wando_communications?retryWrites=true&w=majority`).then(function(){
    console.log("Successfully connected to Wando database");
}).catch(err=>{
    console.log(err);
});


passport.use(User.createStrategy());


// SERIALIZE AND DESERIALIZE USER

// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, {
        id: user.id,
        username: user.username,
        picture: user.picture
      });
      
    });
  });
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
    // console.log(user)
  });
  




// -------- GOOGLE SIGN-IN AUTHOURIZATION ------- //
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/wando",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
    },
    function(accessToken, refreshToken, profile, cb) {
        User.findOrCreate({ googleId: profile.id }, function (err, user) {

                // function to set a default app username
          User.find({username: profile.name.givenName}).then(function(found) {
            if (user.username) {
              console.log("this account has already been registered and has a username")
            }else{
              if (found.length > 0) {
                let newName = (profile.name.givenName) + (Math.floor((Math.random() * 100)+ 1)).toString();
                user.username = newName;
                user.save();
              } else {
                user.username = profile.name.givenName;
                user.save();
              }
              console.log("new account created and/or username added")
            }
          });

          return cb(err, user);
        })
      }

    ));


// -------- FACEBOOK SIGN-IN AUTHOURIZATION --------- //
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/wando"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {

      // function to set a default app username
      User.find({username: (profile.displayName).split(" ")[0]}).then(function(found){
        if(user.username){
          console.log("this account has already been registered and has an username")
        }else{
          if (found.length>0) {
            let newName = ((profile.displayName).split(" ")[0]) + (Math.floor((Math.random() * 100)+ 1)).toString();
            user.username = newName;
            user.save()
          } else {
            user.username = (profile.displayName).split(" ")[0];
            user.save();
          }
          console.log("new account created and/or username added")
        }
      });

      return cb(err, user);
    });

  }
));


// -------- TWITTER SIGN-IN AUTHOURIZATION --------- //
passport.use(new TwitterStrategy({
    consumerKey: process.env.TWITTER_CONSUMER_API_KEY,
    consumerSecret: process.env.TWITTER_CONSUMER_API_KEY_SECRET,
    callbackURL: "http://localhost:3000/auth/twitter/wando"
  },
  
  function(token, tokenSecret, profile, cb) {
    User.findOrCreate({ twitterId: profile.id }, function (err, user) {

      // function to set a default app username
      User.find({username: profile._json.screen_name}).then(function(found){
        if (user.username) {
          console.log("this account has already been registered and has an username")
        } else {
          if (found.length>0) {
            let newName = (profile._json.screen_name) + (Math.floor((Math.random() * 100)+ 1)).toString();
            user.username = newName;
            user.save();
          } else {
            user.username = profile._json.screen_name;
            user.save();
          }
          console.log("new account created and/or username added")
        }
      })

      return cb(err, user);
    
    });
    
  },
));







// ------THIRD-PARTY APPS AUTH REGISTRATION ROUTES ---- //
const authRoute =  require('./routes/auth');
app.use('/auth', authRoute);



// -------- ROUTES --------- //


// Root - Route
app.get("/", function(req, res){
    res.sendFile(`${__dirname}/index.html`);
});

// Register Route
app.get("/register", function(req, res){
    res.render('register');
});


// Sign Up Route
const signupRoute = require('./routes/signup');
app.use('/signup', signupRoute);


// Log In Route
const loginRoute = require('./routes/login');
app.use('/login', loginRoute);


// Homepage Route
const homepageRoute = require('./routes/homepage');
app.use('/home', homepageRoute);


// Post Upload Route
const postRoute = require('./routes/post');
app.use('/upload', postRoute);


// Messages Route
const messagesRoute = require('./routes/messages');
app.use('/messages', messagesRoute);


// Chatroom Route
const chatroomRoute = require('./routes/chatroom');
app.use('/chat', chatroomRoute);

// Profile Route
const profileRoute = require('./routes/profile');
app.use('/profile', profileRoute);

// Profile Edit Route
const profileEditRoute = require('./routes/profileedit');
app.use('/profileedit', profileEditRoute);


// Discover Route
const discoverRoute = require('./routes/discover');
app.use('/discover', discoverRoute);




// Socket.io Functions Route
const useSocket = require("./socket");
useSocket()
// -------------- Testing Area (begining) ------------------

//--------------- Testing Area (ending) --------------------




// Ngrok Server Setup (reminder: remove Ngrok before launching this website)
async function startNgrok (){
  const url = await ngrok.connect({ addr: 3000, authtoken_from_env: true });
  console.log(`Ingress established at: ${url}`);
};

// startNgrok()