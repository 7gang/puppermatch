var selectedCards = [];
var gameState;

var backs = Array.from(document.getElementsByClassName('card'));
var deck = Array.from(document.getElementsByClassName('card-front'));

pscore = document.getElementById("pscore");
prompt = document.getElementById("prompt");

let matches = 0;
function startGame(gs) {
    gameState = gs;
    pscore.innerHTML = `Lifetime matches: ${gameState.points}`;
    //console.log(gameState);
    //console.log([...gameState.playerCardsTurned, ...gameState.opponentCardsTurned]);
    var previouslyMatchedCards = backs.filter((card, i) => [...gameState.playerCardsTurned, ...gameState.opponentCardsTurned].indexOf(gameState.board[i]) !== -1);
    //console.log(previouslyMatchedCards);
    previouslyMatchedCards.forEach(card => {
      card.classList.add("matched")
      card.classList.add("visible");
    });
    
    for (var i = 0; i < deck.length; i++){
        deck[i].innerHTML = `<img src="${gameState.dogs[gameState.board[i]]}" alt="Dog ${i}">`;
        backs[i].type = gameState.board[i];
        backs[i].addEventListener("click", flipCard);
      
    }
    /*console.log(deck);
    console.log(gameState);*/
}

var flipCard = function (){
    cardOpen(this);
 }

function cardOpen(card, isPlayer = true) {
  card.classList.add("visible");
  card.classList.add("disabled");
  selectedCards.push(card);
  //console.log(selectedCards);
  if(selectedCards.length === 2){
    if (isPlayer /*&& selectedCards[1] !== -1*/) postMoves(backs.indexOf(selectedCards[0]), backs.indexOf(selectedCards[1]))
      .then(newState => {
        //selectedCards = [];
        pscore.innerHTML = `Lifetime matches: ${newState.points}`; // insert the score from the db here
        console.log(newState);
        if([...newState.playerCardsTurned, ...newState.opponentCardsTurned].length === 8){
            prompt.innerHTML = "Game over! Refresh to start a new game.";
        }

        performOpponentMove(newState.opponentMoves);
        gameState = newState;
      })
      .catch(error => console.log(error) /* handle if an api call fails for any reason... */ );
    if(selectedCards[0].type === selectedCards[1].type){
      match();
    } else {
      fail();
    }
    //console.log(backs.indexOf(selectedCards[0]),backs.indexOf(selectedCards[1]));
  }
};

function match() {
    //console.log("MATCHED!");
    selectedCards[0].classList.add("matched");
    selectedCards[1].classList.add("matched");
    selectedCards[0].classList.remove("selected");
    selectedCards[1].classList.remove("selected");
    selectedCards = [];
}

function fail() {
    //console.log("Nope!");
    //console.log(selectedCards[0].classList);
    selectedCards[0].classList.add("disabled");
    selectedCards[1].classList.add("disabled");
    disableAll();
    setTimeout(function(){
      selectedCards.forEach(card => card.classList.remove("disabled", "visible"));
      enablenotMatched();
      selectedCards = [];
    },1100);
}

function disableAll(){
    Array.prototype.filter.call(backs, function(card){
        card.classList.add('disabled');
    });
}

function enablenotMatched(){
    Array.prototype.filter.call(backs, function(card){
        card.classList.remove('disabled');
    });
}

function performOpponentMove(moves) {
  if (!moves) return;
  card1 = backs[moves[0]];
  card2 = backs[moves[1]];
  /*console.log("backs: " + backs);
  console.log("backs[0]: " + backs[0]);*/
  /*if (match) {
    console.log("NOT RAND");
    //console.log(backs);
    var types = backs.filter(elem => elem.type === match);
    card1 = types[0];
    card2 = types[1];
  }
  else {
    console.log("RAND");
    // TODO: make this take into account cards that are already turned...
    var randInt1 = Math.floor(Math.random() * backs.length);
    var randInt2 = randInt1;
    while (randInt1 === randInt2) randInt2 = Math.floor(Math.random() * backs.length);
    card1 = backs[randInt1];
    card2 = backs[randInt2];
  }*/
  /*selectedCards.push(card1);
  selectedCards.push(card2);*/
  /*console.log(card1);
  console.log(card2);*/
  cardOpen(card1, false);
  cardOpen(card2, false);
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