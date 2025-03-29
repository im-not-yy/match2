import React, { useEffect, useState } from 'react';
import Card from './Card';

function GameBoard({ cards, onCardClick, selectedSuits }) {
  const [columns, setColumns] = useState(13);

  // Adjust grid columns based on screen width
  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth;
      if (width <= 480) {
        setColumns(4);
      } else if (width <= 768) {
        setColumns(6);
      } else {
        setColumns(13);
      }
    };

    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  const boardStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gap: window.innerWidth <= 768 ? '8px' : '10px',
    width: '100%',
    maxWidth: '100%',
    padding: window.innerWidth <= 768 ? '10px' : '15px',
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