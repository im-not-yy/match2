import React, { useState, useEffect, useRef } from 'react';

function ChatBox({ socket, roomId, playerId }) {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(true);
  const messagesEndRef = useRef(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    socket.on('chat-message', (msg) => {
      setMessages(prev => [...prev, msg]);
      if (isCollapsed && msg.sender !== playerId) {
        setUnreadCount(prev => prev + 1);
      }
    });

    return () => socket.off('chat-message');
  }, [socket, isCollapsed, playerId]);

  useEffect(() => {
    if (!isCollapsed) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setUnreadCount(0);
    }
  }, [messages, isCollapsed]);

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

  const toggleChat = () => {
    setIsCollapsed(!isCollapsed);
    if (!isCollapsed) {
      setUnreadCount(0);
    }
  };

  return (
    <div className={`chat-container ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="chat-header" onClick={toggleChat}>
        <span>Chat {unreadCount > 0 && `(${unreadCount})`}</span>
        <button type="button" className="toggle-chat">
          {isCollapsed ? '▲' : '▼'}
        </button>
      </div>
      <div className="chat-content">
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
    </div>
  );
}

export default ChatBox; 