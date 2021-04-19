function runGame(gameState) {
    var elem = document.getElementById("connectionBox");
    elem.parentNode.removeChild(elem);

    console.log('game data retrieved sucessfully: ', gameState);
}

fetch('http://localhost:3000/api/getgame')
    .then(result => result.json())
    .then(data => runGame(data))
    .catch(error => {
        var $container = document.querySelector('#connectionBox');
        var newHTML = '<h1>Could not connect to game servers!</h1>' +
            '<p>Verify your internet connection or check back later!</p>';
        $container.innerHTML = newHTML;
    });