import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Room from './components/Room.jsx';
import GameBoard from './components/GameBoard.jsx';
import SuitSelection from './components/SuitSelection.jsx';
import Card from './components/Card.jsx';

// Change this to use environment variables or auto-detect the server URL
const socket = io(import.meta.env.PROD ? window.location.origin : 'http://localhost:3001');

function App() {
  const [roomId, setRoomId] = useState('');
  const [inRoom, setInRoom] = useState(false);
  const [playerId, setPlayerId] = useState('');
  
  useEffect(() => {
    socket.on('connect', () => {
      setPlayerId(socket.id);
    });
    
    socket.on('room-joined', (roomData) => {
      setRoomId(roomData.roomId);
      setInRoom(true);
    });
    
    return () => {
      socket.off('connect');
      socket.off('room-joined');
    };
  }, []);
  
  const createRoom = () => {
    socket.emit('create-room');
  };
  
  const joinRoom = (roomIdToJoin) => {
    socket.emit('join-room', roomIdToJoin);
  };
  
  return (
    <div className="container">
      <h1>Memory Card Game</h1>
      
      {!inRoom ? (
        <div className="room-container">
          <h2>Join or Create a Room</h2>
          <div style={{ marginBottom: '20px' }}>
            <input 
              type="text" 
              placeholder="Enter Room ID" 
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              style={{ 
                padding: '8px', 
                marginRight: '8px',
                border: '1px solid var(--border-color)',
                borderRadius: '4px'
              }}
            />
            <button onClick={() => joinRoom(roomId)}>Join Room</button>
          </div>
          <button className="primary" onClick={createRoom}>Create New Room</button>
        </div>
      ) : (
        <Room roomId={roomId} socket={socket} playerId={playerId} />
      )}
    </div>
  );
}

export default App; 