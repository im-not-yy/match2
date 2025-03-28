import React from 'react';

function Card({ index, card, onClick, selectedSuits }) {
  const getSuitSymbol = (suit) => {
    switch (suit) {
      case 'hearts': return '♥';
      case 'diamonds': return '♦';
      case 'clubs': return '♣';
      case 'spades': return '♠';
      default: return '';
    }
  };
  
  return (
    <div 
      className={`card ${card.isFlipped ? 'flipped' : ''}`}
      onClick={() => !card.isFlipped && !card.isMatched && onClick(index)}
    >
      <div className="card-back"></div>
      <div className={`card-front ${card.suit}`}>
        <div>
          {card.value}
          {getSuitSymbol(card.suit)}
        </div>
      </div>
    </div>
  );
}

export default Card; 