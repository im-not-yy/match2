import React from 'react';
import Card from './Card';

function GameBoard({ cards, onCardClick, selectedSuits }) {
  const boardStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(13, 1fr)',
    gridTemplateRows: 'repeat(2, 1fr)',
    gap: '10px',
    width: '100%',
    maxWidth: '100%',
    padding: '15px',
    boxSizing: 'border-box',
    margin: '0 auto'
  };

  return (
    <div className="game-board" style={boardStyle}>
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