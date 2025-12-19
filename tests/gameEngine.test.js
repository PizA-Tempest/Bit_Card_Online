// Jest tests for the minimal game engine
const ge = require('../server/gameEngine');

test('mana increments and is set to max on start turn', () => {
  const p = ge.createPlayer('p1');
  expect(p.maxMana).toBe(0);
  ge.startTurn(p);
  expect(p.maxMana).toBe(1);
  expect(p.mana).toBe(1);
  ge.startTurn(p);
  expect(p.maxMana).toBe(2);
  expect(p.mana).toBe(2);
});

test('playing minion costs mana and places on board', () => {
  const p = ge.createPlayer('p1');
  p.maxMana = 3; p.mana = 3;
  const card = { id: 'wolf', manaCost: 2, type: 'minion', attack: 3, health: 2 };
  const minion = ge.playCard(p, card);
  expect(p.mana).toBe(1);
  expect(p.board.length).toBe(1);
  expect(minion.attack).toBe(3);
  expect(minion.exhausted).toBe(true);
});

test('poison deals damage at start of turn and expires', () => {
  const p = ge.createPlayer('p1');
  p.statuses.push({ name: 'poison', turns: 2, damagePerTurn: 1 });
  expect(p.health).toBe(20);
  ge.startTurn(p); // 1st tick
  expect(p.health).toBe(19);
  expect(p.statuses.length).toBe(1);
  ge.startTurn(p); // 2nd tick -> expires
  expect(p.health).toBe(18);
  expect(p.statuses.length).toBe(0);
});

test('frozen minion cannot attack', () => {
  const minion = { attack: 3, health: 2, exhausted: false, statuses: [{ name: 'frozen', turns: 1 }] };
  expect(ge.canMinionAttack(minion)).toBe(false);
  // remove frozen
  minion.statuses = [];
  expect(ge.canMinionAttack(minion)).toBe(true);
});

test('attack resolves simultaneous damage and applies poison-on-hit', () => {
  const a = { attack: 3, health: 4, exhausted: false, statuses: [{ name: 'poisonOnHit' }] };
  const d = { attack: 2, health: 3, statuses: [] };
  const res = ge.attack(a, d);
  expect(res.attacker.health).toBe(2); // 4 - 2
  expect(res.defender.health).toBe(0); // 3 - 3
  expect(res.attacker.exhausted).toBe(true);
  expect(res.defender.statuses.some(s => s.name === 'poison')).toBe(true);
});