import React, { useState, useRef, useEffect } from 'react';
import './JethelperApp.css';

const JethelperApp: React.FC = () => {
  // Original state from screenshot
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  
  // Original functions from screenshot
  const handleSendMessage = () => {
    if (inputValue.trim()) {
      setMessages([...messages, `User: ${inputValue}`]);
      setInputValue('');
      
      // Simulate bot response (original logic)
      setTimeout(() => {
        setMessages(prev => [...prev, "Bot: Thanks for your message!"]);
      }, 1000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  // Original chat toggle logic
  const toggleChat = () => {
    setChatOpen(!chatOpen);
  };

  // Auto-open for demo (original behavior)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!chatOpen) {
        setChatOpen(true);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="jethelper-app">
      {/* Original header from screenshot */}
      <header className="app-header">
        <h1>The live chat software that gets the job done</h1>
        <div className="header-subtitle">
          <p><strong>LinkedIn:</strong> In service customer service software,</p>
          <p>Chats for info, name for user name use and age-to-choice for your customers.</p>
        </div>
      </header>

      <main className="app-main">
        {/* Original content sections from screenshot */}
        <section className="content-section">
          <div className="content-card">
            <h2>Email:</h2>
            <a href="https://www.facebook.com" className="email-link">www.facebook.com</a>
          </div>
        </section>

        <section className="features-grid">
          <div className="feature-card original">
            <h3>Engage with live chat, sell with ease</h3>
          </div>
          
          <div className="feature-card original">
            <h3>Make premium support your new staunch</h3>
          </div>
          
          <div className="feature-card original">
            <h3>Admission support and share with a customer service solution</h3>
          </div>
          
          <div className="feature-card original">
            <h3>Backer your teams in business with Content inside the app</h3>
          </div>
          
          <div className="feature-card original">
            <h3>Connect with tools that support your business growth</h3>
          </div>
        </section>
      </main>

      {/* Mobile Chat Toggle (bottom bar for mobile) */}
      <div className="mobile-chat-toggle" onClick={toggleChat}>
        <div className="mobile-toggle-content">
          <span className="chat-icon">💬</span>
          <span className="toggle-text">Need help? Chat with us</span>
          <span className="toggle-arrow">{chatOpen ? '▼' : '▲'}</span>
        </div>
      </div>

      {/* Desktop Chat Toggle (floating button on right) */}
      <button 
        className={`desktop-chat-toggle ${chatOpen ? 'active' : ''}`}
        onClick={toggleChat}
        aria-label={chatOpen ? "Close chat" : "Open chat"}
      >
        <span className="toggle-icon">💬</span>
        <span className="toggle-badge">1</span>
      </button>

      {/* Chat Widget - Now positioned on the right side */}
      <div className={`chat-widget ${chatOpen ? 'open' : 'closed'} ${window.innerWidth <= 768 ? 'mobile' : 'desktop'}`}>
        <div className="chat-header">
          <div className="header-content">
            <h3>Live Chat Support</h3>
            <p className="header-sub">How can we help you today?</p>
          </div>
          <button 
            className="close-chat" 
            onClick={toggleChat}
            aria-label="Close chat"
          >
            ×
          </button>
        </div>

        <div className="chat-messages">
          {/* Initial welcome message (original logic) */}
          <div className="message bot">
            <div className="message-content">
              <p>Hello! Welcome to our live chat. How can we help you today?</p>
            </div>
            <div className="message-time">Just now</div>
          </div>

          {/* Original message rendering logic */}
          {messages.map((message, index) => (
            <div 
              key={index} 
              className={`message ${message.startsWith('User:') ? 'user' : 'bot'}`}
            >
              <div className="message-content">
                <p>{message.replace('User: ', '').replace('Bot: ', '')}</p>
              </div>
              <div className="message-time">Just now</div>
            </div>
          ))}
        </div>

        <div className="chat-input-area">
          <div className="input-wrapper">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message here..."
              className="chat-input"
            />
            <button 
              onClick={handleSendMessage}
              className="send-button"
              disabled={!inputValue.trim()}
            >
              <span className="send-icon">➤</span>
            </button>
          </div>
          
          {/* Original powered by section */}
          <div className="chat-footer">
            <p className="powered-by">
              Powered by <a href="https://jetautomations.ai" target="_blank" rel="noopener noreferrer">JetAutomations.ai</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JethelperApp;
