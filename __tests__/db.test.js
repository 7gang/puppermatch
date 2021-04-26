const { getDatabaseMock } = require('../util');

const Database = require('../db');

const ip = "ip1";
let games;
let points;
let db;

beforeEach( async done => {
    const dbMock = await getDatabaseMock();
    games = dbMock.games;
    points = dbMock.points;
    db = new Database({ ...games}, { ...points});

    done();
});

it('initializes', () => {
    expect(db.games).toBeDefined();
    expect(db.points).toBeDefined();
    expect(db.games[ip].createdTimestamp).toBeDefined();
})

it('has ongoing game', async done => {
    expect(await db.hasOngoingGame(ip)).toBeTruthy();
    expect(await db.hasOngoingGame("fake")).not.toBeTruthy();

    expect(await db.hasOngoingGame(ip)).toBeTruthy();
    expect(await db.hasOngoingGame("fake")).not.toBeTruthy();

    done();
})

it('gets game state', async done => {
    expect(await db.getGameState(ip)).toEqual(games[ip]);
    expect(await db.getGameState("fake")).not.toBeDefined();

    expect(await db.hasOngoingGame("fake")).not.toBeTruthy();

    expect(await db.getGameState("fake")).not.toBeDefined();
    expect(await db.hasOngoingGame("fake")).not.toBeTruthy();

    done();
})

it('saves game state', async done => {
    oldGameState = games[ip];
    const alteredGameState = {
        ip: {
            createdTimestamp: games[ip].createdTimestamp,
            playerCardsTurned: [0, 1, 2],  // <- 4 changed to 2
            opponentCardsTurned: [5, 3, 6],
            board: [0, 1, 2, 3, 4, 5, 6, 7, 0, 1, 2, 3, 4, 5, 6, 7],
            dogs: games[ip].dogs
        }
    }
    expect(alteredGameState).not.toEqual(oldGameState);
    
    await db.saveGameState(ip, alteredGameState);
    expect(await db.getGameState(ip)).toEqual(alteredGameState);
    expect(await db.getGameState(ip)).not.toEqual(oldGameState);

    await db.saveGameState("fake", oldGameState);
    expect(await db.getGameState(ip)).not.toEqual(oldGameState);
    expect(await db.getGameState("fake")).not.toBeDefined();

    done();
})

it('creates new game state with new ip', async done => {
    const newIP = "ip2";
    await db.createNewGame(newIP);
    expect(await db.getGameState(newIP)).toBeDefined();
    expect((await db.getGameState(newIP)).playerCardsTurned.length).toEqual(0);
    expect(db.points[newIP]).toEqual(0);

    done();
})

it('creates new game state from ongoing game', async done => {
    await db.createNewGame(ip);
    expect((await db.getGameState(ip)).playerCardsTurned.length).toEqual(0);
    expect(db.points[ip]).toEqual(points[ip] + games[ip].playerCardsTurned.length);

    done();
})

it('only creates new game if all cards have been matched', async done => {
    // ...
    done();
})

it('gets opponent moves', async done => {
    expect(await db.getOpponentMoves("fake")).toEqual(null);

    const moves = await db.getOpponentMoves(ip);
    expect(moves[0]).toBeDefined();
    expect(moves[1]).toBeDefined();
    expect(moves[0]).not.toEqual(moves[1]);

    done();
})

it('randomly distributes opponent moves', async done => {
    let moves = [];
    for (i = 0; i < 10000; i++) {
        let iterMoves = await db.getOpponentMoves(ip);
        moves[iterMoves[0]] = moves[iterMoves[0]] === undefined ? 0 : moves[iterMoves[0]] += 1;
        moves[iterMoves[1]] = moves[iterMoves[1]] === undefined ? 0 : moves[iterMoves[1]] += 1;
    }
    moves = moves.filter(elem => elem !== undefined);

    let largestValue = moves[0];
    let smallestValue = moves[0];
    moves.forEach(elem => {
        if (elem > largestValue) largestValue = elem;
        else if (elem < smallestValue) smallestValue = elem;
    });

    expect(largestValue - smallestValue < 500).toBeTruthy();

    done();
})

it('posts player moves', async done => {
    await db.postPlayerMoves(ip, 7, 2)
    expect(db.games).toEqual(games);
    expect(db.points).toEqual(points);

    await db.postPlayerMoves(ip, 7, 15);
    expect(db.games[ip].playerCardsTurned[3]).toEqual(7);

    done();
})

it('does not post a match that has already been posted', async done => {
    // ...
    done();
})

it('does not post invalid player moves', async done => {
    await db.postPlayerMoves("fake", 0, 1);
    expect(db.games).toEqual(games);
    expect(db.points).toEqual(points);

    await db.postPlayerMoves(ip, 0, 1);
    expect(db.games[ip]).toEqual(games[ip]);

    const newState = {
        createdTimestamp: games[ip].createdTimestamp,
        playerCardsTurned: [0, 1, 4, 2],
        opponentCardsTurned: [5, 3, 6, 7],
        board: [0, 1, 2, 3, 4, 5, 6, 7, 0, 1, 2, 3, 4, 5, 6, 7],
        dogs: games[ip].dogs
    }
    db.games[ip] = { ...newState};
    await db.postPlayerMoves(ip, 0, 1);
    expect(db.games[ip]).toEqual(newState);
    
    done();
})

it('does not alter game board on player move', async done => {
    await db.postPlayerMoves("fake", 0, 1);
    expect(db.games[ip].board).toEqual(games[ip].board);

    expect(games[ip].board[0]).not.toEqual(games[ip].board[1]);
    await db.postPlayerMoves(ip, 0, 1);
    expect(db.games[ip].board).toEqual(games[ip].board);

    expect(games[ip].board[0]).toEqual(games[ip].board[8]);
    await db.postPlayerMoves(ip, 0, 8);
    expect(db.games[ip].board).toEqual(games[ip].board);
    expect(db.games[ip].board[0]).not.toEqual(-1);
    expect(db.games[ip].board[8]).not.toEqual(-1);

    done();
})