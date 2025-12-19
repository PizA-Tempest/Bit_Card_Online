// Minimal game engine functions for testing purposes.
// Not production-ready; only enough logic for unit tests and simulation.
function createPlayer(id) {
  return {
    id,
    health: 20,
    maxMana: 0,
    mana: 0,
    hand: [],
    deck: [],
    board: [],
    statuses: [] // [{ name: 'poison', turns: 2, damagePerTurn: 1 }, { name: 'frozen', turns: 1 }]
  };
}

function startTurn(player) {
  player.maxMana = Math.min((player.maxMana || 0) + 1, 10);
  player.mana = player.maxMana;
  // apply start-of-turn status effects (poison/burn)
  applyStatusStartOfTurn(player);
}

function applyStatusStartOfTurn(player) {
  const still = [];
  for (const s of player.statuses) {
    if (s.name === 'poison') {
      player.health -= s.damagePerTurn || 1;
    }
    if (s.name === 'burn') {
      player.health -= s.damagePerTurn || 1;
    }
    s.turns = (s.turns || 1) - 1;
    if (s.turns > 0) still.push(s);
  }
  player.statuses = still;
}

function canMinionAttack(minion) {
  // minion structure: { id, attack, health, exhausted: bool, statuses: [...] }
  if (!minion) return false;
  if (minion.exhausted) return false;
  if ((minion.statuses || []).some(s => s.name === 'frozen')) return false;
  return true;
}

function attack(attacker, defender) {
  // attacker and defender are objects with attack/health and statuses arrays
  if (!canMinionAttack(attacker)) throw new Error('attacker cannot attack');
  // simultaneous damage
  defender.health -= attacker.attack || 0;
  attacker.health -= defender.attack || 0;
  // mark attacker exhausted
  attacker.exhausted = true;
  // trigger on-hit statuses (poison-on-hit)
  if ((attacker.statuses || []).some(s => s.name === 'poisonOnHit')) {
    defender.statuses = defender.statuses || [];
    defender.statuses.push({ name: 'poison', turns: 2, damagePerTurn: 1 });
  }
  return { attacker, defender };
}

function playCard(player, card) {
  // card: { id, manaCost, type, attack, health, abilities }
  if (player.mana < (card.manaCost || 0)) throw new Error('not enough mana');
  player.mana -= card.manaCost || 0;
  if (card.type === 'minion') {
    // place on board
    const minion = {
      id: card.id + '_' + Math.random().toString(36).slice(2,8),
      attack: card.attack || 0,
      health: card.health || 0,
      exhausted: true, // summoning sickness
      statuses: (card.statuses || []).map(s => ({ ...s }))
    };
    player.board.push(minion);
    return minion;
  }
  // spells and other card types omitted for brevity
  return null;
}

function addStatus(entity, status) {
  entity.statuses = entity.statuses || [];
  // simple stacking behavior
  if (status.stack) {
    entity.statuses.push(status);
  } else {
    // replace existing of same name
    entity.statuses = entity.statuses.filter(s => s.name !== status.name);
    entity.statuses.push(status);
  }
}

module.exports = {
  createPlayer,
  startTurn,
  applyStatusStartOfTurn,
  canMinionAttack,
  attack,
  playCard,
  addStatus
};