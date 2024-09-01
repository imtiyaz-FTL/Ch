const express = require('express');
const mongoose = require('mongoose');
const admin = require('./firebase');

// Create Express app
const app = express();
app.use(express.json());

// Connect to MongoDB (replace 'your_mongodb_uri' with your actual MongoDB URI)
mongoose.connect('your_mongodb_uri', { useNewUrlParser: true, useUnifiedTopology: true });

// User Schema
const userSchema = new mongoose.Schema({
  username: String,
  notifications: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Notification' }],
  fcmToken: String, // Add FCM token field to user schema
});

const User = mongoose.model('User', userSchema);

// Notification Schema
const notificationSchema = new mongoose.Schema({
  message: String,
  date: { type: Date, default: Date.now },
  read: { type: Boolean, default: false },
});

const Notification = mongoose.model('Notification', notificationSchema);

// Routes
app.post('/register-token', async (req, res) => {
  const { username, token } = req.body;
  let user = await User.findOne({ username });

  if (!user) {
    user = new User({ username, fcmToken: token });
  } else {
    user.fcmToken = token;
  }
  
  await user.save();
  res.status(200).send('FCM token registered');
});

app.post('/send-challenge', async (req, res) => {
  const { fromUser, toUser } = req.body;
  const notification = new Notification({ message: `${fromUser} has challenged you to a game!` });
  await notification.save();

  const user = await User.findOne({ username: toUser });
  user.notifications.push(notification);
  await user.save();

  // Send notification via FCM
  const payload = {
    notification: {
      title: 'New Challenge',
      body: `${fromUser} has challenged you to a game!`,
    }
  };

  if (user.fcmToken) {
    admin.messaging().sendToDevice(user.fcmToken, payload)
      .then(response => {
        console.log('Successfully sent message:', response);
      })
      .catch(error => {
        console.log('Error sending message:', error);
      });
  }

  res.status(200).send('Challenge sent and notification delivered');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
