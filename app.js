const express = require('express');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
const ejs = require('ejs');
const mongoose = require('mongoose');
<<<<<<< HEAD
const bcrypt = require('bcrypt'); // Added for password hashing
=======
 // Added for password hashing
>>>>>>> e405ffe9c63276e3c615fed7224309e346bdef48
const FacebookStrategy = require('passport-facebook').Strategy;
const flash = require('connect-flash');
const multer = require('multer'); 
const path = require('path');
const app = express();

app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

app.use(session({
  secret: '123456',
  resave: false,
  saveUninitialized: true,
}));

app.use(flash());

mongoose.connect("mongodb+srv://swapansuvo648:ronisuvo@cluster0.kardea6.mongodb.net/AimodelDB?retryWrites=true&w=majority", { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });

  const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    email: String,
    verified: Boolean,
    googleId: String,
    facebookId: String,
  });
  

const User = mongoose.model('User', userSchema);

passport.use(new LocalStrategy(
  (username, password, done) => {
    User.findOne({ username: username })
      .then(user => {
        if (!user) {
          return done(null, false, { message: 'Incorrect username or password.' });
        }

        // Compare the plain text password
        if (user.password === password) {
          console.log('Password matched successfully.');
          return done(null, user);
        } else {
          console.log('Incorrect username or password.');
          return done(null, false, { message: 'Incorrect username or password.' });
        }
      })
      .catch(err => done(err));
  }
));

const storage = multer.memoryStorage(); // Store the image in memory
const upload = multer({ storage: storage });

const medicineSchema = new mongoose.Schema({
  name: String,
  type: String,
  price: Number,
  image: {
    data: Buffer,
    contentType: String,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
});

const Medicine = mongoose.model('Medicine', medicineSchema);



passport.use(new FacebookStrategy({
  clientID: '360217930207917',
  clientSecret: 'ab8af1746bdccd75544b12d17ae204f0',
  callbackURL: 'http://localhost:3000/auth/facebook/callback',
  profileFields: ['id', 'displayName', 'email']
},
(accessToken, refreshToken, profile, done) => {
  User.findOne({ facebookId: profile.id })
    .then(user => {
      if (user) {
        return done(null, user);
      }

      const newUser = new User({
        username: profile.displayName,
        email: profile.emails[0].value,
        verified: true, // Set based on your verification logic
        facebookId: profile.id,
      });

      newUser.save()
        .then(() => done(null, newUser))
        .catch(err => done(err));
    })
    .catch(err => done(err));
}));



























passport.use(new GoogleStrategy({
  clientID: '148505435130-cv24i1o8dqv18o0pgonbaor3t1bl56s5.apps.googleusercontent.com',
  clientSecret: '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',
  callbackURL: 'http://localhost:3000/auth/google/callback',
},
(accessToken, refreshToken, profile, done) => {
  User.findOne({ googleId: profile.id })
    .then(user => {
      if (user) {
        return done(null, user);
      }

      const newUser = new User({
        username: profile.displayName,
        verified: true,
        googleId: profile.id,
      });

      newUser.save()
        .then(() => done(null, newUser))
        .catch(err => done(err));
    })
    .catch(err => done(err));
}
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id)
    .then(user => done(null, user))
    .catch(err => done(err));
});

app.use(passport.initialize());
app.use(passport.session());

app.get('/', (req, res) => {
  res.render('login');
});









app.post('/login', (req, res, next) => {
  console.log('Received username:', req.body.username); 
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      console.log('Incorrect username or password.'); // Set a flash message for incorrect login
      return res.redirect('/');
    }

    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }
      return res.redirect('/home');
    });
  })(req, res, next);
});

app.get('/auth/google',
  passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/plus.login'] })
);

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('/home');
  }
);



app.get('/auth/facebook',
  passport.authenticate('facebook', { scope: ['email'] })
);

app.get('/auth/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('/home');
  }
);


app.get('/AI.html', (req, res) => {
  if (req.isAuthenticated()) {
    res.sendFile(path.join(__dirname,'AI.html'));
  } else {
    res.redirect('/');
  }
})
.post((req, res) => {
  req.logout(() => {
    res.redirect('/');
  })
});





app.get('/dash', (req, res) => {
  if (req.isAuthenticated()) {
    res.render('dash', { user: req.user });
  } else {
    res.redirect('/');
  }
})
.post((req, res) => {
  req.logout(() => {
    res.redirect('/');
  })
})

app.route('/add')
  .get((req, res) => {
    if (req.isAuthenticated()) {
      res.render('add', { user: req.user });
    } else {
      res.redirect('/');
    }
  })
  .post(upload.single('medicineImage'), async (req, res) => {
    try {
      const { medicineName, medicineType, medicinePrice } = req.body;
      const { user } = req;

      if (req.file) {
        const newMedicine = new Medicine({
          name: medicineName,
          type: medicineType,
          price: medicinePrice,
          image: {
            data: req.file.buffer,
            contentType: req.file.mimetype,
          },
          user: user._id,
        });

        await newMedicine.save();
        res.redirect('/dash');
      } else {
        console.error("Error: No file uploaded");
        res.redirect('/add');
      }
    } catch (err) {
      console.error("Error saving medicine:", err);
      res.redirect('/add');
    }
  });


  app.get('/medicines', async (req, res) => {
    try {
      // Fetch all medicines from the database
      const medicines = await Medicine.find();
  
      // Render the medicines.ejs template with the fetched data
      res.render('medicines', { medicines });
    } catch (error) {
      console.error('Error fetching medicines:', error);
      res.status(500).send('Internal Server Error');
    }
  });





app.route('/home')
  .get((req, res) => {
    if (req.isAuthenticated()) {
      res.render('home', { user: req.user });
    } else {
      res.redirect('/');
    }
  })
  .post((req, res) => {
    req.logout(() => {
      res.redirect('/');
    });
  });

  app.route('/location')
  .get((req, res) => {
    if (req.isAuthenticated()) {
      res.render('loc', { user: req.user });
    } else {
      res.redirect('/');
    }
  })
  .post((req, res) => {
    req.logout(() => {
      res.redirect('/');
    });
  });


app.post('/signup', async (req, res) => {
  const { name, password, email } = req.body;

  try {
    // Check if the username or email is already taken
    const existingUser = await User.findOne({ $or: [{ name }, { email }] });
    if (existingUser) {
      return res.redirect('/'); // Redirect to the signup page with a message indicating the issue
    }

    // Store the password as plain text for local signup
    const newUser = new User({
      name: name,
      password: password,
      username: email,
      verified: false, // Set based on your verification logic
    });

    await newUser.save();

    // Log in the user after successful signup
    req.login(newUser, (err) => {
      if (err) {
        console.error('Error logging in after signup:', err);
        return res.redirect('/');
      }
      return res.redirect('/home');
    });

  } catch (err) {
    console.error("Error saving user:", err);
    res.redirect('/');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
