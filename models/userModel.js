const mongoose = require("mongoose");

const user = mongoose.Schema(
  {
    name: {
      type: String,
     
    },
    email: {
      type: String,
      required: true,
      unique: true,
            match: [
        /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/,
        "Please fill a valid email address",
      ],
    },
    password: {
      type: String,
      required: true,
      minLength: [6, "Password should be greater than 6 characters"],
    },
    // image: {
    //   type: String,
    //   required: true,
    // },
    mobile: {
      type: String,
   
    },
    role: {
      type: String,
      // enum: ["user", "admin"],
      enum: ["user", "admin", "superAdmin", "master", "agent"], // Define all possible roles here
      default: "user", // Default role is "user"
    },
    otp: {
      type: String,
      default: "",
    },
    blocked:{
      type : Boolean,
      default : false,
    },
    username: {
      type: String,
      unique: true, // Ensure the username is unique
    },
    online:Boolean,
    lastActivity: {
      type: Date,
      default: Date.now,
    },
    country:{
      type: String,
      required: true,
    },
    countryIcon:{
      type: String,
      required: true,
    },
    rating:{
      type: Number,
      default: 1500,
    },
    dynamoCoin:{
      type: Number,
    },
    inviteCode: { 
      type: String,
    },
  
    // notifications: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Notification' }],
    // fcmToken: String, // Add FCM token field to user schema
  },
  
  { versionKey: false }
);

module.exports = mongoose.model("User", user);
