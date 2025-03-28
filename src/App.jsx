import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Room from './components/Room.jsx';
import Lobby from './components/Lobby.jsx';

// Change this to use environment variables or auto-detect the server URL
const socket = io(import.meta.env.PROD ? window.location.origin : 'http://localhost:3001');

function App() {
  const [roomId, setRoomId] = useState('');
  const [inRoom, setInRoom] = useState(false);
  const [playerId, setPlayerId] = useState('');
  const [showLobby, setShowLobby] = useState(true);
  
  useEffect(() => {
    socket.on('connect', () => {
      setPlayerId(socket.id);
    });
    
    socket.on('room-joined', (roomData) => {
      setRoomId(roomData.roomId);
      setInRoom(true);
      setShowLobby(false);
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
      <h1>Match 2</h1>
      
      {!inRoom ? (
        <Lobby 
          socket={socket}
          onJoinRoom={joinRoom}
          onCreateRoom={createRoom}
        />
      ) : (
        <Room roomId={roomId} socket={socket} playerId={playerId} />
      )}
      
      <div className="watermark">by yy</div>
    </div>
  );
}

export default App; 