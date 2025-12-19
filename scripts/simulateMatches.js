// Run many short random matches using the minimal engine to find invariants / crashes.
const ge = require('../server/gameEngine');

function randomCard() {
  const mn = Math.floor(Math.random() * 4) + 1;
  return { id: 'm' + Math.random().toString(36).slice(2,6), manaCost: mn, type: 'minion', attack: Math.max(1, mn), health: Math.max(1, mn) };
}

function playRandomGame() {
  const A = ge.createPlayer('A');
  const B = ge.createPlayer('B');
  // give 4 random cards to each hand and some mana
  for (let i=0;i<4;i++){ A.hand.push(randomCard()); B.hand.push(randomCard()); }
  A.maxMana = A.mana = 1; B.maxMana = B.mana = 1;
  let turn = 0;
  while (turn < 50 && A.health > 0 && B.health > 0) {
    const cur = (turn % 2 === 0) ? A : B;
    ge.startTurn(cur);
    // try to play one random card affordable
    const afford = cur.hand.filter(c => c.manaCost <= cur.mana);
    if (afford.length) {
      const card = afford[Math.floor(Math.random() * afford.length)];
      try { ge.playCard(cur, card); } catch(e) {}
    }
    // try to attack with each board minion against random enemy minion / face
    const opponent = (cur === A) ? B : A;
    for (const m of cur.board.slice()) {
      // remove expired statuses for attackability (simulate end of status ticks)
      if (ge.canMinionAttack(m)) {
        if (opponent.board.length) {
          const t = opponent.board[Math.floor(Math.random() * opponent.board.length)];
          ge.attack(m, t);
        } else {
          // attack face
          opponent.health -= m.attack;
          m.exhausted = true;
        }
      }
    }
    // small chance to apply poison/burn randomly
    if (Math.random() < 0.05) ge.addStatus(opponent, { name: 'poison', turns: 2, damagePerTurn: 1, stack: true });
    turn++;
  }
  return { winner: A.health > 0 ? 'A' : (B.health > 0 ? 'B' : 'draw'), turns: turn };
}

function run(n=200) {
  let wins = { A:0, B:0, draw:0 };
  for (let i=0;i<n;i++) {
    const r = playRandomGame();
    wins[r.winner]++;
    if ((i+1) % 50 === 0) console.log(`Simulated ${i+1} games`);
  }
  console.log('Summary', wins);
}

run(process.argv[2] ? parseInt(process.argv[2],10) : 200);