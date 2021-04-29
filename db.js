const mongoose = require('mongoose');
const { generateBoard, shuffle } = require('./util');
const { mongodb_connection_string } = require('./config.json');

module.exports = class Database {

    games = {};     // game states, dictionary mapped to ip address
    points = {};    // lifetime player points, dictionary mapped to ip address
    moves = {};     // all moves performed by both player and ai, dictionary mapped to ip address

    constructor(games, points) {
        this.games = games;
        this.points = points;

        // connection to MongoDB Atlas cluster instance
        mongoose.connect(mongodb_connection_string, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useFindAndModify: false
        }).then(() => console.log('mongoose connected!'));

        // define mongoose model (and schema)
        this.HighScore = mongoose.model('HighScore', mongoose.Schema({
            _id: String,
            value: Number
        }));
    }

    async getPoints(ip) {
        // get player points from MongoDB
        let result = await this.HighScore.find({ _id: ip });
        if (!result || !result[0]) {
            // if no player exists, create it
            const NewHighScore = new this.HighScore({
                _id: ip,
                value: 1
            });
            // save and update player score
            await NewHighScore.save(error => console.log(error));
            result = await this.HighScore.find({ _id: ip });
        }
        // return high score value
        return result[0].value;
    }

    async setPoints(ip, val) {
        // update the score of a player in the MongoDB remote
        await this.HighScore.findByIdAndUpdate({ _id: ip }, { value: val });
    }

    async hasOngoingGame(ip) {
        // whether there is an ongoing game associated with a given ip address
        const result = await this.getGameState(ip);
        return result !== undefined;
    }

    async createNewGame(ip) {
        // create a new game associated with the given ip address
        const oldPoints = await this.getPoints(ip);
        // if there is currently an ongoing game, it is ended and the points from it are catalogues before restarting
        if (await this.hasOngoingGame(ip)) await this.setPoints(ip, oldPoints + this.games[ip].playerCardsTurned.length);
        this.moves[ip] = [];

        // setup new game object and return it
        this.games[ip] = {
            createdTimestamp: Date.now(),
            playerCardsTurned: [],
            opponentCardsTurned: [],
            board: generateBoard()
        }
        return this.games[ip];
    }

    gameHasEnded(gameState) {
        // whether an ongoing game should be considered finished, depending on how many cards have been matched to this point
        const game = gameState
        if (game) {
            // for a game to be done, the amount of cards matched must equal half the board size, since there is exactly two of every card
            return [...game.playerCardsTurned, ...game.opponentCardsTurned].length === (game.board.length / 2);
        }
        return false;
    }

    async getGameState(ip) {
        // get the game state associated with the given ip address and merge relevant data into it
        const gameState = this.games[ip];
        if (gameState) gameState.points = await this.getPoints(ip);
        return gameState;
    }

    async saveGameState(ip, newGameState) {
        // save the provided game state to the provided ip address
        if (await this.hasOngoingGame(ip)) this.games[ip] = newGameState;
    }

    moreCardsToTurn(game) {
        // whether there are more cards left to be matched in the deck
        const discoveredCards = [...game.playerCardsTurned, ...game.opponentCardsTurned];
        return discoveredCards.length < game.board.length / 2;
    }

    cardIsNotAlreadyTurned(game, card) {
        // whether a provided card has already been matched
        const discoveredCards = [...game.playerCardsTurned, ...game.opponentCardsTurned];
        return discoveredCards.indexOf(game.board[card]) === -1
    }

    async postPlayerMoves(ip, move1, move2) {
        // handle the given players moves
        if (await this.hasOngoingGame(ip)) {
            const game = await this.getGameState(ip);
            if (!this.moves[ip]) this.moves[ip] = [];
            this.moves[ip].push(move1, move2);

            if (this.moreCardsToTurn(game)) {
                let opponentMoves;
                if (game.board[move1] === game.board[move2] && this.cardIsNotAlreadyTurned(game, move2)) {
                    // if the player has performed a match
                    game.playerCardsTurned.push(game.board[move1]);
                    let oldPoints = await this.getPoints(ip);
                    await this.setPoints(ip, oldPoints + 1);
                }
                if (this.moreCardsToTurn(game)) {
                    // if there are still cards left over after the player, the ai gets to pick
                    opponentMoves = await this.getOpponentMoves(ip, move1, move2);
                    this.moves[ip].push(opponentMoves[0]);
                    this.moves[ip].push(opponentMoves[1]);
                    // if the ai gets a match
                    if (game.board[opponentMoves[0]] === game.board[opponentMoves[1]] && this.cardIsNotAlreadyTurned(game, opponentMoves[1])) 
                        game.opponentCardsTurned.push(game.board[opponentMoves[0]]);
                }
                // save the updated game state and return it
                await this.saveGameState(ip, game);
                let newState = { ...await this.getGameState(ip)};
                newState.opponentMoves = opponentMoves;
                return newState;
            }
            return game;
        }
    }

    async getOpponentMoves(ip, playerMove1, playerMove2) {
        // calculate the ai opponents next move
        if (await this.hasOngoingGame(ip)) {
            const game = await this.getGameState(ip);

            const discoveredCards = [...game.playerCardsTurned, ...game.opponentCardsTurned];

            // calculate which cards are left to choose from
            let undiscoveredIndexes = []
            let undiscoveredCards = [ ...discoveredCards ]
                .reduce((array, elem, i) => {
                    const index1 = array.indexOf(elem);
                    const index2 = array.indexOf(elem, index1 + 1);
                    array[index1] = -1;
                    array[index2] = -1;
                    return array;
                }, [ ...game.board]);
            undiscoveredCards.forEach((elem, i, array) => {
                if (elem !== -1 && i !== playerMove1 && i !== playerMove2) {
                    undiscoveredIndexes.push(array.indexOf(elem, i));
                }
            })
            undiscoveredCards = undiscoveredCards.filter(elem => elem !== -1);

            // if there are only two cards left to turn, the ai choice is trivial
            if (game.board.length - discoveredCards.length === 2) return (undiscoveredIndexes[0], undiscoveredIndexes[1]);

            // search the ai's memory for matches
            for (let i = 0; i < this.moves[ip].length; i++) {
                const move1 = this.moves[ip][i];
                for (let j = 0; j < this.moves[ip].length; j++) {
                    const move2 = this.moves[ip][j];
                    const playerMoves = [ playerMove1, playerMove2 ];
                    if (move1 !== move2 && game.board[move1] === game.board[move2] && discoveredCards.indexOf(game.board[move2]) === -1 && playerMoves.indexOf(move1) === -1 && playerMoves.indexOf(move2) === -1) {
                        // ai remembered a match from two previously revealed cards
                        return [move1, move2];
                    }
                }
            }

            // no possible matches from memory, result to a random pick...
            undiscoveredIndexes = shuffle(undiscoveredIndexes);  // shuffling the deck before picking at random
            
            const move1 = undiscoveredIndexes[Math.floor(Math.random() * undiscoveredIndexes.length)];
            let move2 = undiscoveredIndexes[Math.floor(Math.random() * undiscoveredIndexes.length)];
            while (move2 === move1) move2 = undiscoveredIndexes[Math.floor(Math.random() * undiscoveredIndexes.length)];

            // return random pick
            return [move1, move2];
        }
        return null;
    }

};