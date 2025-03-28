const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  
  // Handle any requests that don't match the above
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

// Game state storage
const rooms = {};

// Card values and suits
const cardValues = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const suits = ['hearts', 'diamonds', 'clubs', 'spades'];

// Create a new deck with only two suits
function createDeck(suit1, suit2) {
  const deck = [];
  
  // Add cards for both suits
  for (const suit of [suit1, suit2]) {
    for (const value of cardValues) {
      // Add each card twice for matching
      deck.push({ value, suit, isFlipped: false, isMatched: false });
      deck.push({ value, suit, isFlipped: false, isMatched: false });
    }
  }
  
  // Shuffle the deck
  return shuffleDeck(deck);
}

// Fisher-Yates shuffle algorithm
function shuffleDeck(deck) {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);
  
  // Create a new room
  socket.on('create-room', () => {
    const roomId = uuidv4().substring(0, 6);
    
    // Initialize room state
    rooms[roomId] = {
      players: [socket.id],
      status: 'waiting',
      currentTurn: socket.id,
      cards: [],
      scores: { [socket.id]: 0 },
      selectedSuits: {},
      flippedCards: []
    };
    
    // Join the socket to the room
    socket.join(roomId);
    
    // Notify the client
    socket.emit('room-joined', { roomId });
    
    // Send initial game state
    io.to(roomId).emit('game-state-update', rooms[roomId]);
  });
  
  // Join an existing room
  socket.on('join-room', (roomId) => {
    // Check if room exists and has less than 2 players
    if (rooms[roomId] && rooms[roomId].players.length < 2) {
      // Add player to the room
      rooms[roomId].players.push(socket.id);
      rooms[roomId].scores[socket.id] = 0;
      
      // Join the socket to the room
      socket.join(roomId);
      
      // Notify the client
      socket.emit('room-joined', { roomId });
      
      // Notify other players
      socket.to(roomId).emit('player-joined', socket.id);
      
      // If we now have 2 players, start the suit selection phase
      if (rooms[roomId].players.length === 2) {
        rooms[roomId].status = 'selecting-suits';
        
        // Randomly select who goes first for suit selection
        const randomIndex = Math.floor(Math.random() * 2);
        rooms[roomId].currentTurn = rooms[roomId].players[randomIndex];
      }
      
      // Send updated game state to all players in the room
      io.to(roomId).emit('game-state-update', rooms[roomId]);
    } else {
      // Room doesn't exist or is full
      socket.emit('error', { message: 'Room not available' });
    }
  });
  
  // Handle suit selection
  socket.on('select-suit', ({ roomId, suit }) => {
    const room = rooms[roomId];
    
    if (room && room.status === 'selecting-suits' && room.currentTurn === socket.id) {
      // Record the selected suit
      room.selectedSuits[socket.id] = suit;
      
      // Switch turns if the other player hasn't selected yet
      const otherPlayer = room.players.find(id => id !== socket.id);
      
      if (!room.selectedSuits[otherPlayer]) {
        room.currentTurn = otherPlayer;
      } else {
        // Both players have selected, start the game
        room.status = 'playing';
        
        // Create the deck with the two selected suits
        room.cards = createDeck(
          room.selectedSuits[room.players[0]], 
          room.selectedSuits[room.players[1]]
        );
        
        // Randomly select who goes first for the game
        const randomIndex = Math.floor(Math.random() * 2);
        room.currentTurn = room.players[randomIndex];
      }
      
      // Send updated game state
      io.to(roomId).emit('game-state-update', room);
    }
  });
  
  // Handle card flipping
  socket.on('flip-card', ({ roomId, cardIndex }) => {
    const room = rooms[roomId];
    
    if (
      room && 
      room.status === 'playing' && 
      room.currentTurn === socket.id &&
      !room.cards[cardIndex].isFlipped &&
      !room.cards[cardIndex].isMatched &&
      room.flippedCards.length < 2
    ) {
      // Flip the card
      room.cards[cardIndex].isFlipped = true;
      room.flippedCards.push(cardIndex);
      
      // If this is the second card flipped
      if (room.flippedCards.length === 2) {
        const [firstIndex, secondIndex] = room.flippedCards;
        const firstCard = room.cards[firstIndex];
        const secondCard = room.cards[secondIndex];
        
        // Check if the cards match
        if (firstCard.value === secondCard.value) {
          // Cards match
          firstCard.isMatched = true;
          secondCard.isMatched = true;
          
          // Increment score
          room.scores[socket.id] = (room.scores[socket.id] || 0) + 1;
          
          // Clear flipped cards array
          room.flippedCards = [];
          
          // Check if the game is over
          const allMatched = room.cards.every(card => card.isMatched);
          if (allMatched) {
            room.status = 'finished';
          }
          
          // Send updated game state immediately
          io.to(roomId).emit('game-state-update', { ...room });
        } else {
          // Cards don't match, send updated state and schedule to flip them back
          io.to(roomId).emit('game-state-update', { ...room });
          
          // Wait 1 second before flipping cards back
          setTimeout(() => {
            // Flip cards back
            firstCard.isFlipped = false;
            secondCard.isFlipped = false;
            
            // Clear flipped cards array
            room.flippedCards = [];
            
            // Switch turns
            const otherPlayer = room.players.find(id => id !== socket.id);
            room.currentTurn = otherPlayer;
            
            // Send updated game state
            io.to(roomId).emit('game-state-update', { ...room });
          }, 1000);
        }
      } else {
        // First card flipped, just update the state
        io.to(roomId).emit('game-state-update', { ...room });
      }
    }
  });
  
  // Handle game restart
  socket.on('restart-game', ({ roomId }) => {
    const room = rooms[roomId];
    
    if (room && room.status === 'finished') {
      // Reset the game state
      room.status = 'selecting-suits';
      room.selectedSuits = {};
      room.cards = [];
      room.flippedCards = [];
      
      // Reset scores
      room.players.forEach(player => {
        room.scores[player] = 0;
      });
      
      // Randomly select who goes first for suit selection
      const randomIndex = Math.floor(Math.random() * 2);
      room.currentTurn = room.players[randomIndex];
      
      // Send updated game state
      io.to(roomId).emit('game-state-update', room);
    }
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    
    // Find all rooms the player is in
    Object.keys(rooms).forEach(roomId => {
      const room = rooms[roomId];
      
      if (room.players.includes(socket.id)) {
        // Remove player from the room
        room.players = room.players.filter(id => id !== socket.id);
        
        // If room is empty, delete it
        if (room.players.length === 0) {
          delete rooms[roomId];
        } else {
          // Notify remaining players
          io.to(roomId).emit('player-left', socket.id);
          
          // Reset the game to waiting state
          room.status = 'waiting';
          room.selectedSuits = {};
          room.cards = [];
          room.flippedCards = [];
          
          // Send updated game state
          io.to(roomId).emit('game-state-update', room);
        }
      }
    });
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 