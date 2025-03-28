import React from 'react';

function SuitSelection({ availableSuits, onSelect }) {
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
    <div className="suit-selection">
      {availableSuits.map(suit => (
        <div 
          key={suit} 
          className={`suit-option ${suit}`}
          onClick={() => onSelect(suit)}
        >
          {getSuitSymbol(suit)}
        </div>
      ))}
    </div>
  );
}

export default SuitSelection; 