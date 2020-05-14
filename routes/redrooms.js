var express = require("express");
//var createError = require("http-errors");
var router = express.Router();
//const Mongo = require("../bin/mongo");
//var uniqid = require("uniqid");
//const ObjectId = require("mongodb").ObjectId;

/* user avec formulaire login */
router.get("/", function(req, res, next) {
  if (req.session.user) {
    return next();
  }
});

router.use(function(req, res, next) {
  if (!req.session || !req.session.user) {
    return next(createError(403));
  }
  return next();
});

router.get("/", function(req, res, next) {
  Mongo.getInstance()
    .collection("rooms")
    .find()
    .toArray((err, rooms) => {
      res.render("redrooms/index", { title: "Liste des rooms", rooms: rooms });
    });
});

module.exports = router;
