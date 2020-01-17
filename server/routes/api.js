const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const passwordResetToken = require("../models/resettoken");
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const db =
  "mongodb+srv://Abdurrazack:Abdurrazack@cluster0-qfh8b.mongodb.net/ParksmardDB?retryWrites=true&w=majority";

mongoose.connect(
  db,
  { useNewUrlParser: true, useUnifiedTopology: true },
  error => {
    if (error) {
      console.error("Error:" + error);
    } else {
      console.log("Connection to Database Succeeded..");
    }
  }
);

// register api
router.post("/register", (req, res) => {
  let userData = req.body;
  let newUser = new User(userData);
  User.findOne({ email: userData.email }, (err, user) => {
    if (err) {
      console.log(err);
      res.send(err);
    }
    //if a user was found, that means the user's email matches the entered email
    if (user) {
      res.status(400).send("This email has already been registered");
    } else {
      bcrypt.hash(userData.password, 10, (err, hash) => {
        newUser.password = hash;
        newUser.save((err, registeredUser) => {
          if (err) {
            res.status(500).send("Error in registering new user");
          } else {
            res
              .status(200)
              .send(registeredUser.fullName + " " + "registered successfully");
          }
        });
      });
    }
  });
});

// login api
router.post("/login", (req, res) => {
  let userData = req.body;
  User.findOne({ email: userData.email }, (error, user) => {
    if (error) {
      console.log(error);
    } else {
      if (!user) {
        res.status(401).send("Email you have entered is incorrect");
      } else {
        bcrypt.compare(userData.password, user.password, (err, loggedIn) => {
          if (loggedIn) {
            let payload = { subject: user._id };
            let token = jwt.sign(payload, "secretKey");
            res.status(200).send({ token });
          } else {
            res.sendStatus(403);
          }
        });
      }
    }
  });
});

// Getting user details api
router.get("/getUserDetails/:email", (req, res) => {
  let email = req.params.email;
  User.findOne({ email: email }, (error, user) => {
    if (error) {
      res.status(404).send("User Not Found");
    } else {
      res.status(200).send(user);
    }
  });
});

router.get("/getAllUsers", (req, res) => {
  User.find({}, (err, users) => {
    res.status(200).send(users);
  });
});

router.delete("/deleteUser/:id", (req, res) => {
  User.findByIdAndRemove(req.params.id, err => {
    if (err) {
      res.status(500).send();
    }
    return res.status(200).send();
  });
});

router.post("/req-reset-password", (req, res) => {
  if (!req.body.email) {
    return res.status(500).json({ message: "Email is required" });
  }
  User.findOne({ email: req.body.email }, (error, user) => {
    if (!user) {
      res.status(409).send("Email does not exist");
    }
    var resettoken = new passwordResetToken({
      _userId: user._id,
      resettoken: crypto.randomBytes(16).toString("hex")
    });
    resettoken.save(err => {
      if (err) {
        res.status(500).send({ msd: err.message });
      }
      passwordResetToken
        .find({ _userId: user._id, resettoken: { $ne: resettoken.resettoken } })
        .remove()
        .exec();
      res.status(200).json({ message: "Reset Password successfully." });
      var transporter = nodemailer.createTransport({
        service: "Gmail",
        port: 465,
        auth: {
          user: "user",
          pass: "password"
        }
      });
      var mailOptions = {
        to: user.email,
        from: "abdurrazack13@gmail.com",
        subject: " Password Reset",
        text:
          "You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n" +
          "Please click on the following link, or paste this into your browser to complete the process:\n\n" +
          "http://localhost:8100/login/new/" +
          resettoken.resettoken +
          "\n\n" +
          "If you did not request this, please ignore this email and your password will remain unchanged.\n"
      };
      transporter.sendMail(mailOptions, (err, info) => {});
    });
  });
});

router.post("/valid-password-token", (req, res) =>{
  if (!req.body.resettoken) {
    return res.status(500).json({ message: 'Token is required' });
    }
    const user = await passwordResetToken.findOne({
    resettoken: req.body.resettoken
    });
    if (!user) {
    return res
    .status(409)
    .json({ message: 'Invalid URL' });
    }
    User.findOneAndUpdate({ _id: user._userId }).then(() => {
    res.status(200).json({ message: 'Token verified successfully.' });
    }).catch((err) => {
    return res.status(500).send({ msg: err.message });
    });
});

router.post("/new-password", (req, res) =>{
  passwordResetToken.findOne({ resettoken: req.body.resettoken}, (err, userToken, next) => {
    if (!userToken) {
      return res.status(409).json({ message: 'Token has expired' });
    }
    User.findOne({_id: userToken._userId}, (err, userEmail, next) =>{
      if (!userEmail) {
        return res.status(409).json({ message: 'User does not exist' });
      }
      return bcrypt.hash(req.body.newPassword, 10, (err, hash) => {
        if (err) {
          return res.status(400).json({ message: 'Error hashing password' });
        }
        userEmail.password = hash;
        userEmail.save((err) => {
          if (err) {
            return res.status(400).json({ message: 'Password can not reset.' });
          } else {
            userToken.remove();
            return res.status(201).json({ message: 'Password reset successfully' });
          }
        })
        })
    })
  })
  
})

module.exports = router;
