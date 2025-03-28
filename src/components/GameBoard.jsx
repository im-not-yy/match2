import React from 'react';
import Card from './Card';

function GameBoard({ cards, onCardClick, selectedSuits }) {
  return (
    <div className="game-board">
      {cards.map((card, index) => (
        <Card 
          key={index}
          index={index}
          card={card}
          onClick={() => onCardClick(index)}
          selectedSuits={selectedSuits}
        />
      ))}
    </div>
  );
}

export default GameBoard; 