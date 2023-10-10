require("dotenv").config();
const http  = require('http');
// const ngrok = require("@ngrok/ngrok");
const User = require('./model/users');
const Post = require('./model/posts');
const Chat = require('./model/chat');
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const mongodb = require('mongodb')
const findOrCreate = require("mongoose-findorcreate");
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const { ObjectId } = require("mongodb");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const TwitterStrategy = require('passport-twitter').Strategy;


const app = express();

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
  cookie: { secure: false }
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
          User.find({appUsername: profile.name.givenName}).then(function(found) {
            if (user.appUsername) {
              console.log("this account has already been registered and has a appUsername")
            }else{
              if (found.length > 0) {
                let newName = (profile.name.givenName) + (Math.floor((Math.random() * 100)+ 1)).toString();
                user.appUsername = newName;
                user.save();
              } else {
                user.appUsername = profile.name.givenName;
                user.save();
              }
              console.log("new account created and/or appUsername added")
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
      User.find({appUsername: (profile.displayName).split(" ")[0]}).then(function(found){
        if(user.appUsername){
          console.log("this account has already been registered and has an appUsername")
        }else{
          if (found.length>0) {
            let newName = ((profile.displayName).split(" ")[0]) + (Math.floor((Math.random() * 100)+ 1)).toString();
            user.appUsername = newName;
            user.save()
          } else {
            user.appUsername = (profile.displayName).split(" ")[0];
            user.save();
          }
          console.log("new account created and/or appUsername added")
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
      User.find({appUsername: profile._json.screen_name}).then(function(found){
        if (user.appUsername) {
          console.log("this account has already been registered and has an appUsername")
        } else {
          if (found.length>0) {
            let newName = (profile._json.screen_name) + (Math.floor((Math.random() * 100)+ 1)).toString();
            user.appUsername = newName;
            user.save();
          } else {
            user.appUsername = profile._json.screen_name;
            user.save();
          }
          console.log("new account created and/or appUsername added")
        }
      })

      return cb(err, user);
    
    });
    
  },
));











// GOOGLE AUTHOURIZATION REGISTRATION ROUTE
app.get("/auth/google", passport.authenticate('google', {scope: ["profile"]}));

// GOOGLE AUTHOURIZATION CALLBACK ROUTE
app.get("/auth/google/wando",
      passport.authenticate('google', {failureRedirect:"/register"}),
      function(req, res){
        res.redirect("/home")
      }
)



// FACEBOOK AUTHOURIZATION REGISTRATION ROUTE
app.get('/auth/facebook',
  passport.authenticate('facebook'));

// FACEBOOK AUTHOURIZATION CALLBACK ROUTE
app.get('/auth/facebook/wando',
  passport.authenticate('facebook', { failureRedirect: '/register' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/home');
  });




// TWITTER AUTHOURIZATION REGISTRATION ROUTE
app.get('/auth/twitter',
  passport.authenticate('twitter'));

// TWITTER AUTHOURIZATION CALLBACK ROUTE
app.get('/auth/twitter/wando', 
  passport.authenticate('twitter', { failureRedirect: '/register' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/home');
  });




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
app.get('/signup', function(req, res){
    res.render('signup')
});

app.post('/signup', function(req, res){

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



// Log In Route
app.get('/login', function(req, res){
    res.render('login');
});

app.post('/login', function(req, res){

    const user = new User ({
        username: req.body.username,
        password: req.body.password,
    })

        req.login(user, function(err){
        if(err){
            console.log(err);
        } else {
            passport.authenticate('local')(req, res, function(){
                res.redirect('/home');
            });
        };
    });
});



// Homepage Route
app.get('/home', function(req, res){
    if (req.isAuthenticated()) {

      
      Post.find().then(function(posts){
        res.render('home', {
          postArray: posts.reverse(),
        });

      }).catch(err=>{
        console.log(err);
      });
    } else {
        res.redirect('register');
    };
});


// Post Route
app.get('/upload', function(req, res){

  if (req.isAuthenticated()) {
    res.render('upload')
  } else {
    res.redirect('register');
  };
});

app.post('/upload', function(req, res){



  User.findById((req.user).id).then(function(foundUser){
    const post = new Post({
    title: req.body.title,
    content: req.body.content,
    authorId: (req.user).id,
    authorUsername: foundUser.appUsername,
  });

    post.save().then(function(){
      res.redirect('/home');
    }).catch(err=>{
      console.log(err);
    })
    foundUser.posts.push(post._id);
    foundUser.save();

  });
  
  

});


app.get('/messages', function(req, res){
  if (req.isAuthenticated()){
    Chat.find({"users.userId": (req.user).id,"messages": {$exists: true,$not: {$size: 0}}}).then(function(foundChats){

    User.findById((req.user).id).then((found) =>{
      res.render('messages', {
        myObjId: found._id,
        myId: (req.user).id,
        myUsername: found.appUsername,
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

app.post('/messages', function(req, res){
  User.find({appUsername: req.body.search}).then(function(searchResult){
    // console.log(searchResult)
    res.render('chatsearchresult',{
      foundUser : searchResult,
    });
  });
});


app.get('/chat/:searchParam', function(req, res){
Chat.find({"users.userId": (req.user).id, "users.userId": req.params.searchParam}).then(function(foundChat){
  if (foundChat.length===0){

    User.findById((req.user).id).then(function(user1) {
      User.findById(req.params.searchParam).then(function(user2) {
        
    const chat = new Chat({
      type: "private",
      users: [
        {
          userName: user1.appUsername,
          userId: (req.user).id,
        },
        {
          userName: user2.appUsername,
          userId: req.params.searchParam,
        }
          
      ]
    })
    chat.save().then(res.redirect(`/chat/${req.params.searchParam}`)).catch(err=>{console.log(err)})
      });
    });

          
  } else {

    async function userDetails(){
      const primaryUser = await User.findById((req.user).id);
      const secondaryUser = await User.findById(req.params.searchParam);

        res.render('chat', {
        chatData : foundChat,
        senderData : primaryUser,
        recipientData: secondaryUser
      });
    };

    userDetails();

  };
});
});

app.post("/chat", function(req, res){
  const message = req.body.message;
  const sender = req.body.sender;
  const recipient = req.body.recipient;

  Chat.find({"users.userId": (req.user).id, "users.userId": req.body.recipientId}).then(function(foundChat){
    
    foundChat[0].messages.push({
      authorName: req.body.senderName,
      authorId: req.body.senderId,
      text: req.body.message,
    });


      foundChat[0].save(res.redirect("/chat/"+req.body.recipientId))
    
  })

})

// -------------- Testing Area ------------------


//--------------- Testing Area ------------------



// Local Server Setup
app.listen(process.env.PORT, function(){
    console.log(`Wando app server running on ${process.env.PORT}`);
});


// Ngrok Server Setup
// (async function () {
//   const url = await ngrok.connect({ addr: 3000, authtoken_from_env: true });
//   console.log(`Ingress established at: ${url}`);
// })();