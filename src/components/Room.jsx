import React, { useState, useEffect } from 'react';
import GameBoard from './GameBoard.jsx';
import SuitSelection from './SuitSelection.jsx';
import ChatBox from './ChatBox.jsx';

function Room({ roomId, socket, playerId }) {
  const [gameState, setGameState] = useState({
    status: 'waiting', // waiting, selecting-suits, playing, finished
    players: [],
    currentTurn: '',
    cards: [],
    scores: {},
    selectedSuits: {}
  });
  
  useEffect(() => {
    socket.on('game-state-update', (newState) => {
      setGameState(newState);
    });
    
    socket.on('player-joined', (player) => {
      console.log(`${player} joined the room`);
    });
    
    return () => {
      socket.off('game-state-update');
      socket.off('player-joined');
    };
  }, [socket]);
  
  const selectSuit = (suit) => {
    socket.emit('select-suit', { roomId, suit });
  };
  
  const handleCardClick = (cardIndex) => {
    if (gameState.currentTurn === playerId) {
      socket.emit('flip-card', { roomId, cardIndex });
    }
  };
  
  const renderGameContent = () => {
    switch (gameState.status) {
      case 'waiting':
        return (
          <div className="waiting-message">
            <h2>Waiting for another player to join...</h2>
            <p>Share this room ID with a friend: <span className="room-id">{roomId}</span></p>
          </div>
        );
      
      case 'selecting-suits':
        const isMyTurn = gameState.currentTurn === playerId;
        const availableSuits = ['hearts', 'diamonds', 'clubs', 'spades'].filter(
          suit => !Object.values(gameState.selectedSuits).includes(suit)
        );
        
        return (
          <div>
            {isMyTurn ? (
              <div>
                <h2>Select your suit</h2>
                <SuitSelection 
                  availableSuits={availableSuits} 
                  onSelect={selectSuit} 
                />
              </div>
            ) : (
              <div className="waiting-message">
                <h2>Waiting for other player to select a suit...</h2>
              </div>
            )}
          </div>
        );
      
      case 'playing':
        return (
          <div>
            <div className="game-info">
              {gameState.players.map(player => (
                <div 
                  key={player} 
                  className={`player-info ${gameState.currentTurn === player ? 'current-turn' : ''}`}
                >
                  <span className={gameState.selectedSuits[player]}>
                    {getSuitSymbol(gameState.selectedSuits[player])}
                  </span>
                  <span>
                    {player === playerId ? 'You' : 'Opponent'}: {gameState.scores[player] || 0} points
                  </span>
                  {gameState.currentTurn === player && <span> (Your turn)</span>}
                </div>
              ))}
            </div>
            
            <GameBoard 
              cards={gameState.cards} 
              onCardClick={handleCardClick} 
              selectedSuits={gameState.selectedSuits}
            />
          </div>
        );
      
      case 'finished':
        const winner = Object.entries(gameState.scores).reduce(
          (a, b) => (a[1] > b[1] ? a : b)
        )[0];
        
        return (
          <div className="waiting-message">
            <h2>Game Over!</h2>
            <p>
              {winner === playerId ? 'You won!' : 'You lost!'} Final score: 
              {gameState.players.map(player => (
                <span key={player}> {player === playerId ? 'You' : 'Opponent'}: {gameState.scores[player]}</span>
              ))}
            </p>
            <button 
              className="primary" 
              onClick={() => socket.emit('restart-game', { roomId })}
              style={{ marginTop: '20px' }}
            >
              Play Again
            </button>
          </div>
        );
      
      default:
        return <div>Loading...</div>;
    }
  };
  
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
    <div className="room-container">
      <h2>Room: <span className="room-id">{roomId}</span></h2>
      {renderGameContent()}
      <ChatBox socket={socket} roomId={roomId} playerId={playerId} />
    </div>
  );
}

export default Room; 