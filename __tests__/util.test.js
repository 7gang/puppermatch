const { generateBoard, shuffle } = require('../util');

it('generates board', () => {
    const board1 = generateBoard();
    const board2 = generateBoard();

    expect(board1).not.toEqual(board2);
    expect(board1.length).toEqual(board2.length);

    const board1Set = new Set(board1);
    const board2Set = new Set(board2);

    expect(board1Set).toEqual(board2Set);
})

it('randomizes generated board', () => {
    const cum = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (i = 0; i < 1000; i++) {
        const board = generateBoard();
        board.forEach((elem, n) => cum[n] += elem);
    }

    let largestValue = cum[0];
    let smallestValue = cum[0];
    cum.forEach(elem => {
        if (elem > largestValue) largestValue = elem;
        else if (elem < smallestValue) smallestValue = elem;
    });

    //console.log(cum);
    expect(largestValue - smallestValue < 500).toBeTruthy();
})