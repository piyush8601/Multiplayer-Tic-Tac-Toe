const board = document.getElementById('board');
const status = document.getElementById('status');
const ws = new WebSocket('ws://localhost:8080');

let player = null;
let cells = [];

ws.onmessage = (event) => {
    const message = JSON.parse(event.data);

    switch (message.type) {
        case 'init':
            player = message.player;
            status.textContent = `You are Player ${player}`;
            break;
        case 'update':
            updateBoard(message.gameState);
            break;
        case 'end':
            status.textContent = message.winner
                ? `Player ${message.winner} wins! 🎉`
                : 'It\'s a draw!';
            break;
        case 'error':
            alert(message.message);
            break;
    }
};

const updateBoard = (gameState) => {
    cells.forEach((cell, index) => {
        cell.textContent = gameState.board[index];
        cell.classList.toggle('taken', gameState.board[index] !== null);
    });
    status.textContent = `Player ${gameState.currentPlayer}'s turn`;
};

// Create cells
for (let i = 0; i < 9; i++) {
    const cell = document.createElement('div');
    cell.classList.add('cell');
    cell.addEventListener('click', () => {
        if (!cell.classList.contains('taken')) {
            ws.send(JSON.stringify({ index: i }));
        }
    });
    board.appendChild(cell);
    cells.push(cell);
}
