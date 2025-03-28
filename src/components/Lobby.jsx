import React, { useState, useEffect } from 'react';

function Lobby({ socket, onJoinRoom, onCreateRoom }) {
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    // Request room list when component mounts
    socket.emit('get-rooms');

    // Listen for room updates
    socket.on('rooms-update', (updatedRooms) => {
      setRooms(updatedRooms);
    });

    return () => {
      socket.off('rooms-update');
    };
  }, [socket]);

  return (
    <div className="lobby">
      <div className="lobby-header">
        <h2>Game Lobby</h2>
        <button className="primary" onClick={onCreateRoom}>Create Room</button>
      </div>
      
      <div className="rooms-list">
        {rooms.length > 0 ? (
          rooms.map((room) => (
            <div key={room.id} className="room-item">
              <div className="room-info">
                <span className="room-id">Room: {room.id}</span>
                <span className="player-count">
                  Players: {room.playerCount}/2
                </span>
                <span className="room-status">
                  {room.status === 'waiting' ? 'Waiting for players' : 'Game in progress'}
                </span>
              </div>
              <button 
                onClick={() => onJoinRoom(room.id)}
                disabled={room.playerCount >= 2}
                className={room.playerCount >= 2 ? 'disabled' : ''}
              >
                {room.playerCount >= 2 ? 'Full' : 'Join'}
              </button>
            </div>
          ))
        ) : (
          <p className="no-rooms">No active rooms. Create one to start playing!</p>
        )}
      </div>
    </div>
  );
}

export default Lobby; 