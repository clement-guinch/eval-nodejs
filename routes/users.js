var express = require("express");
var createError = require("http-errors");
var router = express.Router();
const Mongo = require("../bin/mongo");
var uniqid = require("uniqid");
var crypto = require("crypto-js");

/* login */
router.put("/", function(req, res, next) {
  Mongo.getInstance()
    .collection("users")
    .findOne(
      {
        email: req.body.email
      },
      function(err, user) {
        if (err) {
          return res.json({
            status: false,
            message: err.message
          });
        }
        if (
          !user ||
          !user.id ||
          crypto
            .createHash("sha256")
            .update(req.body.password + user.salt)
            .digest("hex") !== user.password
        ) {
          return res.json({
            status: false,
            message: "Merci de vérifier vos identifiants"
          });
        }
        req.session.user = user;
        return res.json({
          status: true
        });
      }
    );
});

/* Création */
router.post("/", function(req, res, next) {
  let errors = [];

  if (!req.body.avatar) {
    errors.push("Avatar");
  }

  if (!req.body.username) {
    errors.push("Nom utilisateur");
  }
  if (
    !req.body.email ||
    !/^([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,5})$/.test(
      req.body.email
    )
  ) {
    errors.push("Email");
  }
  if (
    !req.body.password ||
    !/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{8,})/.test(req.body.password)
  ) {
    errors.push("Mot de passe");
  }
  if (
    !req.body.password_confirm ||
    req.body.password_confirm !== req.body.password
  ) {
    errors.push("Confirmation de mot de passe");
  }

  if (errors.length) {
    return res.json({
      status: false,
      message: "Merci de vérifier les champs : " + errors.join(", ")
    });
  }

  // Password hash
  //sha256(password+salt)
  let salt = uniqid();
  let password = crypto
    .createHash("sha256")
    .update(req.body.password + salt)
    .digest("hex");
  let datas = {
    username: req.body.username,
    email: req.body.email,
    password: password,
    avatar: req.body.avatar,
    salt: salt
  };

  Mongo.getInstance()
    .collection("users")
    .insertOne(datas, function(err, result) {
      if (err) {
        if (err.message.indexOf("duplicate key") !== -1) {
          return res.json({
            status: false,
            message: err.message
          });
        }
        return res.json({
          status: false,
          message: "Votre adresse email existe déjà !"
        });
      }
      return res.json({
        status: true
      });
    });
});

// => verify if user is connected
router.use(function(req, res, next) {
  if (!req.session.user) {
    return next(createError(403));
  }
  return next();
});

/* Return data user */
router.get("/", function(req, res, next) {
  res.json({
    status: true,
    datas: {
      email: "a@a.com",
      username: "John Doe"
    }
  });
});

/* disconnected */
router.delete("/", function(req, res, next) {
  req.session.destroy();
  res.json({
    status: true
  });
});

module.exports = router;
