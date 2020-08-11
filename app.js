const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const User = require('./models/user');
const app = express();
const port = 3000;
require('dotenv').config();

// Set config template engine pug 
app.set('view engine', 'pug');
app.set('views', './public/views');

// Use config to consume static resource files 
app.use(express.static('public'));

// Use config to get forms data request
app.use(express.urlencoded({ extended: true }));

// Use config to use cookies to save session
app.use(
  cookieSession({
    secret: 'lorem ipsum dolor',
    maxAge: 24 * 60 * 60 * 1000,
  })
);

// Handle DB conection
mongoose.connect(
  process.env.MONGODB_URL || "mongodb://localhost:27017/mongo-1",
  {
    useNewUrlParser: true,
  }
);
mongoose.connection.on('error', (error) => console.error(error.message));

// Middleware to handle start session into selected routes 
const requireUser = async (req, res, next) => {
  const userId = req.session.userId;
  if (userId) {
    const user = await User.findOne({ _id: userId });
    res.locals.user = user;
    next();
  } else {
    return res.redirect('/login');
  }
};

// App routes 
app.get('/', requireUser, async (req, res) => {
  const users = await User.find();
  res.render('index', { users: users });
});

app.get('/register', requireUser, (req, res) => {
  res.render('form');
});

app.post('/register', (req, res) => {
  const name = req.body.name;
  const email = req.body.email;
  const password = req.body.password;
  bcrypt.hash(password, 10).then(async (hash) => {
    const user = new User({
      name: name,
      email: email,
      password: hash,
    });
    await user.save((error) => {
      if (error) return console.error(error.message);
      return res.redirect('/');
    });
  });
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = await User.findOne({ email: email });
  if (user) {
    bcrypt.compare(password, user.password).then((result) => {
      if (!result)
        return res.render('login', {
          error: 'Password doesn\'t match. Try again!',
        });
      req.session.userId = user._id;
      return res.redirect('/');
    });
  } else {
    res.render('login', { error: 'Email doesn\'t exist. Try again!' });
  }
});

app.get('/logout', (req, res) => {
  req.session = null;
  return res.render('login');
});

// Deploy NodeJS Server
app.listen(port, () => console.log(`Listening on Port ${port}`));
