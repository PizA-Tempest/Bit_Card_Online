// Simple Node + Socket.IO demo (NOT production-ready)
// Run: npm init -y && npm i express socket.io cors
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

let waitingQueue = []; // naive queue for ranked matches
const games = {}; // in-memory games (use Redis or DB in prod)

function createInitialGameState(playerA, playerB) {
  return {
    id: `game_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,
    players: {
      [playerA.id]: { id: playerA.id, health: 20, mana: 0, maxMana: 0, hand: [], deck: [], board: [] },
      [playerB.id]: { id: playerB.id, health: 20, mana: 0, maxMana: 0, hand: [], deck: [], board: [] }
    },
    turnPlayerId: playerA.id,
    turn: 1,
    log: []
  }
}

// Simple matchmaking
io.on('connection', socket => {
  socket.on('auth', (user) => {
    // user = { id, name, rating }
    socket.user = user;
    socket.emit('auth_ok', { user });
  });

  socket.on('joinQueue', ({ mode }) => {
    if (!socket.user) return socket.emit('error', 'Not authenticated');
    waitingQueue.push({ socket, mode, user: socket.user });
    socket.emit('queued', { mode });
    // Try match immediately (very naive: pair first two in queue with same mode)
    if (waitingQueue.length >= 2) {
      const a = waitingQueue.shift();
      const bIndex = waitingQueue.findIndex(x => x.mode === a.mode);
      if (bIndex !== -1) {
        const b = waitingQueue.splice(bIndex, 1)[0];
        const gameState = createInitialGameState(a.user, b.user);
        games[gameState.id] = gameState;
        a.socket.join(gameState.id);
        b.socket.join(gameState.id);
        a.socket.emit('matchFound', { gameId: gameState.id, opponent: b.user });
        b.socket.emit('matchFound', { gameId: gameState.id, opponent: a.user });
        io.to(gameState.id).emit('gameState', gameState);
      } else {
        // push a back
        waitingQueue.unshift(a);
      }
    }
  });

  socket.on('playCard', ({ gameId, cardId, targetId }) => {
    const gs = games[gameId];
    if (!gs) return socket.emit('error', 'Game not found');
    // Very simplified: broadcast play
    gs.log.push({ type: 'playCard', by: socket.user.id, cardId, targetId });
    io.to(gameId).emit('gameEvent', { type: 'playCard', by: socket.user.id, cardId, targetId });
  });

  socket.on('endTurn', ({ gameId }) => {
    const gs = games[gameId];
    if (!gs) return;
    gs.turn += 1;
    gs.turnPlayerId = Object.keys(gs.players).find(id => id !== gs.turnPlayerId); // swap
    // increment mana for current player
    const p = gs.players[gs.turnPlayerId];
    p.maxMana = Math.min((p.maxMana || 0) + 1, 10);
    p.mana = p.maxMana;
    io.to(gameId).emit('gameState', gs);
  });

  socket.on('disconnect', () => {});
});

app.get('/cards', (req, res) => {
  // return example card list
  res.json(require('./cards.json'));
});

server.listen(3000, () => console.log('Server listening on :3000'));