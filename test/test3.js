const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const app = express();

mongoose.connect('mongodb://localhost/your_database_name', { useNewUrlParser: true, useUnifiedTopology: true });

const UserSchema = new mongoose.Schema({
  username: String,
  online: Boolean,
  lastActivity: Date
});

const User = mongoose.model('User', UserSchema);
const sessionMiddleware = session({
  secret: process.env.SECRET_KEY, // Use secret key from environment variable
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({ mongoUrl: 'mongodb://localhost/your_database_name' })
});

app.use(sessionMiddleware);

// Middleware to update user's last activity
app.use(async (req, res, next) => {
  if (!req.session.username) {
    req.session.username = 'user' + Math.floor(Math.random() * 1000);
  }

  const username = req.session.username;
  await User.findOneAndUpdate(
    { username },
    { username, online: true, lastActivity: new Date() },
    { upsert: true, new: true }
  );

  next();
});

// Route to get the list of online users
app.get('/online-users', async (req, res) => {
  // Consider users online if their last activity was within the last 5 minutes
  const onlineUsers = await User.find({ lastActivity: { $gte: new Date(Date.now() - 5 * 60 * 1000) } });
  res.json(onlineUsers);
});

// Route for testing
app.get('/', (req, res) => {
  res.send(`Hello ${req.session.username}`);
});

// Periodically mark users as offline if they haven't been active
setInterval(async () => {
  await User.updateMany(
    { lastActivity: { $lt: new Date(Date.now() - 5 * 60 * 1000) } },
    { online: false }
  );
}, 5 * 60 * 1000); // Run every 5 minutes

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
console.log(new Date(Date.now() - 5 * 60 * 1000))