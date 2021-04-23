var express = require('express');
var router = express.Router();
const Database = require('../db');
const { getDatabaseMock, getDogs } = require('../util');

let db = null;
(async function() {
  const dbMock = await getDatabaseMock();
  db = new Database(dbMock.games, dbMock.points);
}());

router.get('/getgame', async function(req, res, next) {
  const ip = req.ip;
  
  let gameState = await db.getGameState(ip);
  if (gameState === undefined) {
    await db.createNewGame(ip);
    gameState = await db.getGameState(ip);
    gameState.dogs = await getDogs(gameState.board);
  }

  res.send(gameState);
  next();
});

router.post('/makemove', async function(req, res, next) {
  try{
    const ip = req.ip;
    const moves = req.body.moves;

    await db.postPlayerMoves(ip, moves[0], moves[1]);
    const newState = { ...await db.getGameState(ip)};
    newState.dogs = undefined; newState.board = undefined; newState.createdTimestamp = undefined;
    res.send(newState);
  } catch(error) {
    res.sendStatus(400);
    console.log(error);
  }

  next();
});

module.exports = router;
