const mongoose = require('mongoose');
const { generateBoard, shuffle } = require('./util');
const { mongodb_connection_string } = require('./config.json');

module.exports = class Database {

    games = {};
    points = {};
    moves = {};

    constructor(games, points) {
        this.games = games;
        this.points = points;

        mongoose.connect(mongodb_connection_string, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useFindAndModify: false
        }).then(() => console.log('mongoose connected!'));

        this.HighScore = mongoose.model('HighScore', mongoose.Schema({
            _id: String,
            value: Number
        }));
    }

    async getPoints(ip) {
        let result = await this.HighScore.find({ _id: ip });
        //console.log(result[0]);
        if (!result || !result[0]) {
            const NewHighScore = new this.HighScore({
                _id: ip,
                value: 1
            });
            await NewHighScore.save(error => console.log(error));
            result = await this.HighScore.find({ _id: ip });
        }
        //console.log(result[0].value);
        //if (this.games[ip]) console.log('Actual value: ' + this.games[ip].playerCardsTurned.length);
        return result[0].value;
    }

    async setPoints(ip, val) {
        //console.log('Should be value: ' + val);
        await this.HighScore.findByIdAndUpdate({ _id: ip }, { value: val });
    }

    async hasOngoingGame(ip) {
        const result = await this.getGameState(ip);
        return result !== undefined;
    }

    async createNewGame(ip) {
        const oldPoints = await this.getPoints(ip);
        if (await this.hasOngoingGame(ip)) await this.setPoints(ip, oldPoints + this.games[ip].playerCardsTurned.length);
        this.moves[ip] = [];

        this.games[ip] = {
            createdTimestamp: Date.now(),
            playerCardsTurned: [],
            opponentCardsTurned: [],
            board: generateBoard()
        }
        return this.games[ip];
    }

    gameHasEnded(gameState) {
        const game = gameState
        if (game) {
            /*console.log([...game.playerCardsTurned, ...game.opponentCardsTurned][0]);
            console.log([...game.playerCardsTurned, ...game.opponentCardsTurned].length);
            console.log((game.board.length / 2));*/
            return [...game.playerCardsTurned, ...game.opponentCardsTurned].length === (game.board.length / 2);
        }
        return false;
    }

    async getGameState(ip) {
        const gameState = this.games[ip];
        if (gameState) gameState.points = await this.getPoints(ip);
        return gameState;
    }

    async saveGameState(ip, newGameState) {
        if (await this.hasOngoingGame(ip)) this.games[ip] = newGameState;
    }

    moreCardsToTurn(game) {
        const discoveredCards = [...game.playerCardsTurned, ...game.opponentCardsTurned];
        return discoveredCards.length < game.board.length / 2;
    }

    cardIsNotAlreadyTurned(game, card) {
        const discoveredCards = [...game.playerCardsTurned, ...game.opponentCardsTurned];
        return discoveredCards.indexOf(game.board[card]) === -1
    }

    async postPlayerMoves(ip, move1, move2) {
        if (await this.hasOngoingGame(ip)) {
            const game = await this.getGameState(ip);
            if (!this.moves[ip]) this.moves[ip] = [];
            this.moves[ip].push(move1, move2);
            //console.log("moves: " + game.board[move1] + ", " + game.board[move2]);
            //console.log("board: " + game.board);

            if (this.moreCardsToTurn(game)) {
                let opponentMoves;
                if (game.board[move1] === game.board[move2] && this.cardIsNotAlreadyTurned(game, move2)) {
                    //console.log(game.playerCardsTurned);
                    game.playerCardsTurned.push(game.board[move1]);
                    let oldPoints = await this.getPoints(ip);
                    await this.setPoints(ip, oldPoints + 1);
                    //console.log(game.opponentCardsTurned);
                }
                if (this.moreCardsToTurn(game)) {
                    //console.log("executed!");
                    opponentMoves = await this.getOpponentMoves(ip, move1, move2);
                    this.moves[ip].push(opponentMoves[0]);
                    this.moves[ip].push(opponentMoves[1]);
                    //console.log("opponent moves: " + moves[0] + ", " + moves[1]);
                    if (game.board[opponentMoves[0]] === game.board[opponentMoves[1]] && this.cardIsNotAlreadyTurned(game, opponentMoves[1])) 
                        game.opponentCardsTurned.push(game.board[opponentMoves[0]]);
                }
                await this.saveGameState(ip, game);
                let newState = { ...await this.getGameState(ip)};
                //console.log("newState: " + newState);
                newState.opponentMoves = opponentMoves;
                return newState;
            }
            return game;
        }
    }

    async getOpponentMoves(ip, playerMove1, playerMove2) {
        if (await this.hasOngoingGame(ip)) {
            const game = await this.getGameState(ip);

            const discoveredCards = [...game.playerCardsTurned, ...game.opponentCardsTurned];

            //console.log("discorveredCards: " + discoveredCards);
            let undiscoveredIndexes = []
            let undiscoveredCards = [ ...discoveredCards ]
                .reduce((array, elem, i) => {
                    const index1 = array.indexOf(elem);
                    const index2 = array.indexOf(elem, index1 + 1);
                    array[index1] = -1;
                    array[index2] = -1;
                    //if (i === playerMove1 && i === playerMove2) array[i] = -1
                    return array;
                }, [ ...game.board]);
            undiscoveredCards.forEach((elem, i, array) => {
                //console.log(i !== playerMove1 && i !== playerMove2);
                if (elem !== -1 && i !== playerMove1 && i !== playerMove2) {
                    undiscoveredIndexes.push(array.indexOf(elem, i));
                }
            })
            undiscoveredCards = undiscoveredCards.filter(elem => elem !== -1);
            //console.log("undiscovered cards: " + undiscoveredCards);
            //console.log(game.board.length - discoveredCards.length === 2);
            /*console.log("playerMoves: " + playerMove1, playerMove2);
            console.log("undiscoveredIndexes: " + undiscoveredIndexes);*/
            
            if (game.board.length - discoveredCards.length === 2) return (undiscoveredIndexes[0], undiscoveredIndexes[1]);

            //console.log([ playerMove1, playerMove2, ...discoveredCards ]);
            /*this.moves[ip].forEach((move1, i) => {
                this.moves[ip].forEach((move2, j) => {
                    if (i !== j && game.board[move1] === game.board[move2] && discoveredCards.indexOf(game.board[move2]) === -1) {
                        console.log("smart moves: " + move1, move2);
                        return [move1, move2];
                    }
                });
            });*/
            for (let i = 0; i < this.moves[ip].length; i++) {
                const move1 = this.moves[ip][i];
                for (let j = 0; j < this.moves[ip].length; j++) {
                    const move2 = this.moves[ip][j];
                    const playerMoves = [ playerMove1, playerMove2 ];
                    if (move1 !== move2 && game.board[move1] === game.board[move2] && discoveredCards.indexOf(game.board[move2]) === -1 && playerMoves.indexOf(move1) === -1 && playerMoves.indexOf(move2) === -1) {
                        //console.log("smart moves: " + move1, move2);
                        return [move1, move2];
                    }
                }
            }

            undiscoveredIndexes = shuffle(undiscoveredIndexes);
            
            const move1 = undiscoveredIndexes[Math.floor(Math.random() * undiscoveredIndexes.length)];
            let move2 = undiscoveredIndexes[Math.floor(Math.random() * undiscoveredIndexes.length)];
            //if (move1 === undefined) return null;
            while (move2 === move1) move2 = undiscoveredIndexes[Math.floor(Math.random() * undiscoveredIndexes.length)];
            //console.log(move1, move2);
            return [move1, move2];
        }
        return null;
    }

};