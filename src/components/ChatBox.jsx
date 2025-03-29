import React, { useState, useEffect, useRef } from 'react';

function ChatBox({ socket, roomId, playerId }) {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    socket.on('chat-message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    return () => socket.off('chat-message');
  }, [socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      const messageData = {
        text: message,
        sender: playerId,
        isSystem: false
      };
      socket.emit('chat-message', { roomId, ...messageData });
      setMessage('');
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.map((msg, i) => (
          <div 
            key={i} 
            className={`chat-message ${msg.sender === playerId ? 'own' : 'other'}`}
          >
            {msg.text}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="chat-form">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}

export default ChatBox; 