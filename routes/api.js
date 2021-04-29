var express = require('express');
var router = express.Router();
const Database = require('../db');
const { getDatabaseMock, getDogs } = require('../util');

let db = null;
(async function() {
  const dbMock = await getDatabaseMock();
  db = new Database(dbMock.games, dbMock.points);
}());  // initialize the databbase with this weird work-around to top-level async/await

router.get('/getgame', async function(req, res, next) {
  const ip = req.ip;
  
  let gameState = await db.getGameState(ip);
  if (gameState === undefined || db.gameHasEnded(gameState)) {
    // start a newe game if the requiesting ip address is unrecognized
    await db.createNewGame(ip);
    gameState = await db.getGameState(ip);
    gameState.dogs = await getDogs(gameState.board);
  }

  res.send(gameState);  // respond to /getgame with game state
  next();
});

router.post('/makemove', async function(req, res, next) {
  try{
    // perform the player's desired moves
    const ip = req.ip;
    const moves = req.body.moves;

    const newState = await db.postPlayerMoves(ip, moves[0], moves[1]);
    newState.dogs = undefined; newState.board = undefined; newState.createdTimestamp = undefined;  // remove unnecessary data
    res.send(newState);

  } catch(error) {
    res.sendStatus(400);
    console.log(error);
  }

  next();
});

module.exports = router;
