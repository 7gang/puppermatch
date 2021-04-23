function startGame(gameState) {
    // TODO: implement game here...
    console.log('game data retrieved sucessfully: ', gameState);

    // EXAMPLE: when the user has chosen two different cards, post their move with postMoves and update the gameState with the response of the api call
    postMoves(0, 1)
        .then(newState = console.log(newState) /* <-- updated gameState can be handed off from here */ )
        .catch(error => console.log(error) /* handle if an api call fails for any reason... */ );
}

function postMoves(move1, move2) {
    return new Promise((resolve, reject) => {
        fetch('http://localhost:3000/api/makemove', {
            method: 'POST',
            mode: 'cors',
            cache: 'no-cache',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            redirect: 'follow',
            referrerPolicy: 'no-referrer',
            body: JSON.stringify({moves: [move1, move2]})
          })
          .then(response => resolve(response.json()))
          .catch(error => reject(error));
    });
};

function testPostMoves(move1, move2) {
    // TODO: remember to delete this when postMoves has been implemented and tested...
    postMoves(move1, move2).then(result => console.log(result)).catch(error => console.log(error));
}

fetch('http://localhost:3000/api/getgame')
    .then(result => result.json())
    .then(data => {
        var elem = document.getElementById("connectionBox");
        elem.parentNode.removeChild(elem);  // remove the connection box

        startGame(data)
            .then(() => true /* ...at this point the game should have finished */ )
            .catch(error => console.log(error));  // some kind of error happened in the game...
    })
    .catch(error => {
        try {
            var $container = document.querySelector('#connectionBox');
            var newHTML = '<h1>Could not connect to game servers!</h1>' +
                '<p>Verify your internet connection or check back later!</p>' +
                '<p>Error: ' + error + '</p>';
            $container.innerHTML = newHTML;
        } catch(error) { /* disregard any error that occur after the connectionBox has been deleted */ }
    });