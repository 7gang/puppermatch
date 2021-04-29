const assert = require('assert');
const axios = require('axios');

function shuffle(deck) {
    if (!Array.isArray(deck)) throw new Error("Parameter Must Be An Array");
    let randomizedDeck = [];
    let array = deck.slice();
    while (array.length !== 0) {
        let rIndex = Math.floor(array.length * Math.random());
        randomizedDeck.push(array[rIndex]);
        array.splice(rIndex, 1);
    }
    return randomizedDeck;
}

async function getMock() {
    return {
        games: {
            "ip1": {
                createdTimestamp: Date.now(),
                playerCardsTurned: [0, 1, 4],
                opponentCardsTurned: [5, 3, 6],
                board: [0, 1, 2, 3, 4, 5, 6, 7, 0, 1, 2, 3, 4, 5, 6, 7],
            }
        },
        points: {
            "ip1": 10
        }
    }
}

async function getDogs(board) {
    assert(board.length % 2 === 0, 'uneven number of cards!');
    const numberOfDogs = board.length / 2;

    const dogRequest = await axios.get('https://dog.ceo/api/breeds/image/random/' + numberOfDogs, { timeout: 1000 });
    //console.log(dogRequest.data.message);

    return dogRequest.data.message;
}

module.exports = {

    shuffle: shuffle,

    generateBoard: () => {
        sortedBoard = [0, 1, 2, 3, 4, 5, 6, 7, 0, 1, 2, 3, 4, 5, 6, 7]
        return shuffle(sortedBoard);
    },

    getDogs: getDogs,

    getDatabaseMock: getMock

}