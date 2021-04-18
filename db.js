const { generateBoard, shuffle } = require('./util');

module.exports = class Database {

    games = {};
    points = {};

    constructor(games, points) {
        this.games = games;
        this.points = points;
    }

    async hasOngoingGame(ip) {
        const result = await this.getGameState(ip);
        return result !== undefined;
    }

    async createNewGame(ip) {
        if (await this.hasOngoingGame(ip)) this.points[ip] += this.games[ip].playerCardsTurned.length;
        else if (this.points[ip] === undefined) this.points[ip] = 0;

        this.games[ip] = {
            createdTimestamp: Date.now(),
            playerCardsTurned: [],
            opponentCardsTurned: [],
            board: generateBoard()
        }
        return this.games[ip];
    }

    async getGameState(ip) {
        return this.games[ip];
    }

    async saveGameState(ip, newGameState) {
        if (await this.hasOngoingGame(ip)) this.games[ip] = newGameState;
    }

    async postPlayerMoves(ip, move1, move2) {
        if (await this.hasOngoingGame(ip)) {
            const game = await this.getGameState(ip);
            const discoveredCards = [...game.playerCardsTurned, ...game.opponentCardsTurned];
            const moreCardsToTurn = discoveredCards.length < game.board.length;

            if (moreCardsToTurn) {
                if (game.board[move1] === game.board[move2]) {
                    game.playerCardsTurned.push(move1);
                    game.playerCardsTurned.push(move2);
                }
                if (discoveredCards.length < game.board.length / 2) {
                    const moves = await this.getOpponentMoves(ip);
                    if (game.board[moves[0]] === game.board[moves[1]]) game.opponentCardsTurned.push(game.board[moves[0]]);
                }
                await this.saveGameState(ip, game);
            }
        }
    }

    async getOpponentMoves(ip) {
        if (await this.hasOngoingGame(ip)) {
            const game = await this.getGameState(ip);

            const discoveredCards = [...game.playerCardsTurned, ...game.opponentCardsTurned];
            let undiscoveredIndexes = []
            let undiscoveredCards = [ ...discoveredCards ]
                .reduce((array, elem) => {
                    const index1 = array.indexOf(elem);
                    const index2 = array.indexOf(elem, index1 + 1);
                    array[index1] = -1;
                    array[index2] = -1;
                    return array;
                }, game.board);
            undiscoveredCards.forEach((elem, i, array) => {
                if (elem !== -1) {
                    undiscoveredIndexes.push(array.indexOf(elem, i));
                }
            })
            undiscoveredCards = undiscoveredCards.filter(elem => elem !== -1);
            
            if (game.board.length - undiscoveredCards.length === 2) return (undiscoveredIndexes[0], undiscoveredIndexes[1]);

            undiscoveredIndexes = shuffle(undiscoveredIndexes);
            
            const move1 = undiscoveredIndexes[Math.floor(Math.random() * undiscoveredIndexes.length)];
            let move2 = undiscoveredIndexes[Math.floor(Math.random() * undiscoveredIndexes.length)];
            if (move1 === undefined) return null;
            while (move2 === move1) move2 = undiscoveredIndexes[Math.floor(Math.random() * undiscoveredIndexes.length)];
            return [move1, move2];
        }
        return null;
    }

};