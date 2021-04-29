var selectedCards = [];
var gameState;

var backs = Array.from(document.getElementsByClassName('card'));
var deck = Array.from(document.getElementsByClassName('card-front'));

pscore = document.getElementById("pscore");
prompt = document.getElementById("prompt");

let matches = 0;
function startGame(gs) {

    // perform the initialization of the game
    gameState = gs;
    pscore.innerHTML = `Lifetime matches: ${gameState.points}`;

    backs.forEach((card, i) => {
      // flip any cards that may have been matched already in a previous session on reload
      if (gameState.playerCardsTurned.indexOf(gameState.board[i]) !== -1) {
        card.classList.add("playermatched")
        card.classList.add("visible");
      }
      else if (gameState.opponentCardsTurned.indexOf(gameState.board[i]) !== -1) {
        card.classList.add("matched")
        card.classList.add("visible");
      }
    });
    
    for (var i = 0; i < deck.length; i++){
        // populate game board/deck
        deck[i].innerHTML = `<img src="${gameState.dogs[gameState.board[i]]}" alt="Dog ${i}">`;
        backs[i].type = gameState.board[i];
        backs[i].addEventListener("click", flipCard);
    }

}

var flipCard = function (){
    cardOpen(this);
 }

function cardOpen(card, isPlayer = true) {
  // animate a card flip and handle matches
  card.classList.add("visible");
  card.classList.add("disabled");
  selectedCards.push(card);
  if(selectedCards.length === 2){

    if (isPlayer) postMoves(backs.indexOf(selectedCards[0]), backs.indexOf(selectedCards[1]))  // post player moves to the api endpoint
      .then(newState => {
        pscore.innerHTML = `Lifetime matches: ${newState.points}`; // insert the score from the db here
        console.log(newState);

        if([...newState.playerCardsTurned, ...newState.opponentCardsTurned].length === 8){
            // if all cards have been matched, prompt the user to play again
            setTimeout(function(){
              prompt.innerHTML = "Game over! Refresh to start a new game.";
            }, 1300);
        }

        disableAll()
        setTimeout(function(){
          // add artificial delay when animating the opponents moves
          enablenotMatched()
          performOpponentMove(newState.opponentMoves);
          gameState = newState;
        }, 1000);
      })
      .catch(error => console.log(error) /* the api requiest failed for any reason... */ );

    if(selectedCards[0].type === selectedCards[1].type){  // animate a card match
        if (isPlayer){  // the player has a different match animation than the ai opponent
            selectedCards[0].classList.add("playermatched");
            selectedCards[1].classList.add("playermatched");
        } else {
            selectedCards[0].classList.add("matched");
            selectedCards[1].classList.add("matched");
        }
        selectedCards[0].classList.remove("selected");
        selectedCards[1].classList.remove("selected");
        selectedCards = [];
    }
    else {
      fail();
    }

  }
};

function fail() {
    // animate an unsuccessful match
    selectedCards[0].classList.add("disabled");
    selectedCards[1].classList.add("disabled");
    disableAll();
    setTimeout(function(){
      // inject artificial delay to the animation
      selectedCards.forEach(card => card.classList.remove("disabled", "visible"));
      enablenotMatched();
      selectedCards = [];
    }, 1100);
}

function disableAll(){
  // bar the player from interacting with cards that are yet to be matched
    Array.prototype.filter.call(backs, function(card){
        card.classList.add('disabled');
    });
}

function enablenotMatched(){
    // allow the player to interact with cards that are yet to be matched
    Array.prototype.filter.call(backs, function(card){
        card.classList.remove('disabled');
    });
}

function performOpponentMove(moves) {
    // animate the opponents moves
    if (!moves) return;
    card1 = backs[moves[0]];
    card2 = backs[moves[1]];
    cardOpen(card1, false);
    cardOpen(card2, false);
}

function postMoves(move1, move2) {
  // return a promise, eventually returning the updated game state as the result of the player's moves
    return new Promise((resolve, reject) => {
        fetch('http://localhost:3000/api/makemove', {
            method: 'POST',
            mode: 'cors',
            cache: 'no-cache',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            redirect: 'follow',
            referrerPolicy: 'no-referrer',
            body: JSON.stringify({moves: [move1, move2]})  // post player moves as json to the backend
          })
          .then(response => resolve(response.json()))  // response will contain updated game state
          .catch(error => reject(error));
    });
};

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
        } catch(error) { /* disregard any error that occurs after the connectionBox has been deleted */ }
    });