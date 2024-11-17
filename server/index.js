const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

let players = [];
let gameState = {
    board: Array(9).fill(null), // 3x3 grid
    currentPlayer: 'X',
};

wss.on('connection', (ws) => {
    if (players.length >= 2) {
        ws.send(JSON.stringify({ type: 'error', message: 'Game is full!' }));
        ws.close();
        return;
    }

    // Assign player X or O
    const player = players.length === 0 ? 'X' : 'O';
    players.push(ws);
    ws.send(JSON.stringify({ type: 'init', player }));

    // Broadcast the updated board and turn
    const broadcast = (data) => {
        players.forEach((playerWs) => {
            if (playerWs.readyState === WebSocket.OPEN) {
                playerWs.send(JSON.stringify(data));
            }
        });
    };

    ws.on('message', (message) => {
        const { index } = JSON.parse(message);

        // Ignore invalid moves
        if (gameState.board[index] !== null || players.indexOf(ws) !== (gameState.currentPlayer === 'X' ? 0 : 1)) {
            return;
        }

        // Update game state
        gameState.board[index] = gameState.currentPlayer;
        gameState.currentPlayer = gameState.currentPlayer === 'X' ? 'O' : 'X';

        broadcast({ type: 'update', gameState });

        // Check for a win or draw
        const winner = checkWinner(gameState.board);
        if (winner || !gameState.board.includes(null)) {
            broadcast({ type: 'end', winner });
            gameState = { board: Array(9).fill(null), currentPlayer: 'X' }; // Reset game
        }
    });

    ws.on('close', () => {
        players = players.filter((playerWs) => playerWs !== ws);
    });
});

const checkWinner = (board) => {
    const winPatterns = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6],
    ];

    for (let pattern of winPatterns) {
        const [a, b, c] = pattern;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a]; // Winner (X or O)
        }
    }
    return null;
};

console.log('WebSocket server is running on ws://localhost:8080');
