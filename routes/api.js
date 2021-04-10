var express = require('express');
var router = express.Router();

router.get('/getgame', function(req, res, next) {
  res.send('respond with previous or new game state...');
});

router.post('/makemove', function(req, res, next) {
  res.send('update game state and respond with the result of /getgame...');
});

module.exports = router;
