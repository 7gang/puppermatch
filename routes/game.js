var express = require('express');
var router = express.Router();
var path = require('path');

/* GET game page */
router.get('/', function(req, res, next) {
  res.sendFile(path.join(__dirname + '/../public/game.html'));
});

module.exports = router;
