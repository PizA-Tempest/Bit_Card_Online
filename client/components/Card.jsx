import React from 'react';
import './Card.css'; // create simple styling

// Props: card {id,name,manaCost,attack,health,description}, onPlay(card)
export default function Card({ card, onPlay }) {
  return (
    <div className="card">
      <div className="card-mana">{card.manaCost}</div>
      <div className="card-art">
        {/* placeholder */}
        <img src={card.artUrl || '/images/placeholder.png'} alt={card.name} />
      </div>
      <div className="card-body">
        <div className="card-title">{card.name}</div>
        <div className="card-desc">{card.description}</div>
      </div>
      <div className="card-stats">
        <div className="card-attack">{card.attack}</div>
        <div className="card-health">{card.health}</div>
      </div>
      <button onClick={() => onPlay && onPlay(card)}>Play</button>
    </div>
  )
}