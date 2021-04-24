selectedCards = [];
const deck = document.querySelectorAll(".card");
let matches = 0;
function startGame(gameState) {
    
    for (var i = 0; i < deck.length; i++){
        deck[i].innerHTML = `<img src="${gameState.dogs[gameState.board[i]]}" alt="Dog ${i}">`;
        deck[i].type = gameState.board[i];
        deck[i].addEventListener("click", displayCard);
    }
    console.log(deck);
    console.log(gameState);

    // EXAMPLE: when the user has chosen two different cards, post their move with postMoves and update the gameState with the response of the api call
    postMoves(0, 1)
        .then(newState = console.log(newState) /* <-- updated gameState can be handed off from here */ )
        .catch(error => console.log(error) /* handle if an api call fails for any reason... */ );
}

var displayCard = function (){
    this.classList.toggle("selected");
    cardOpen(this);
 }

 function cardOpen(card) {
    selectedCards.push(card);
    var len = selectedCards.length;
    if(len === 2){
        if(selectedCards[0].type === selectedCards[1].type){
            match();
        } else {
            fail();
        }
    }
};

function match() {
    console.log("MATCHED!");
    selectedCards[0].classList.add("matched");
    selectedCards[1].classList.add("matched");
    selectedCards[0].classList.remove("selected");
    selectedCards[1].classList.remove("selected");
    selectedCards = [];
    matches += 1;
    if (matches === 8){
        console.log("You Won!");
    }
}

function fail() {
    console.log("Nope!");
    selectedCards[0].classList.add("disabled");
    selectedCards[1].classList.add("disabled");
    disableAll();
    setTimeout(function(){
        selectedCards[0].classList.remove("selected");
        selectedCards[1].classList.remove("selected");
        enablenotMatched();
        selectedCards = [];
    },1100);
}

function disableAll(){
    Array.prototype.filter.call(deck, function(card){
        card.classList.add('disabled');
    });
}

function enablenotMatched(){
    Array.prototype.filter.call(deck, function(card){
        card.classList.remove('disabled');
    });
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

//window.onload = startGame();