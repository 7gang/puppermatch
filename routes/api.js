var express = require('express');
var router = express.Router();
const Database = require('../db');
const { databaseMock } = require('../util');

const db = new Database(databaseMock().games, databaseMock().points);

router.get('/getgame', async function(req, res, next) {
  const ip = req.ip;
  
  let gameState = await db.getGameState(ip);
  if (gameState === undefined) {
    await db.createNewGame(ip);
    gameState = await db.getGameState(ip);
  }

  res.send(gameState);
  next();
});

router.post('/makemove', function(req, res, next) {
  res.send('update game state and respond with the result of /getgame...');
});

module.exports = router;
