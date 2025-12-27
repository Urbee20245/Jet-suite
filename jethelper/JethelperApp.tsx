import React, { useState, useRef, useEffect } from 'react';
import './JethelperApp.css';

const JethelperApp: React.FC = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{text: string, isUser: boolean}>>([
    { text: "Hello! Welcome to our live chat. How can we help you today?", isUser: false },
    { text: "I'm interested in your live chat software", isUser: true }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const chatBodyRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    
    // Add user message
    setMessages(prev => [...prev, { text: inputMessage, isUser: true }]);
    setInputMessage('');
    
    // Simulate bot response
    setTimeout(() => {
      const responses = [
        "Thanks for your message! Our team will get back to you shortly.",
        "That's a great question! Let me connect you with a specialist.",
        "I can help with that! Would you like to schedule a demo of our software?",
        "We offer several plans depending on your business needs. Would you like to see pricing options?"
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      setMessages(prev => [...prev, { text: randomResponse, isUser: false }]);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  useEffect(() => {
    // Auto-scroll to bottom when messages change
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>The live chat software that gets the job done</h1>
        <p className="tagline">
          Premium customer service software that helps you engage with customers, boost sales, and support your business growth.
        </p>
      </header>

      <div className="features-grid">
        <div className="feature-card">
          <div className="feature-icon">💬</div>
          <h3>Engage with live chat, sell with ease</h3>
          <p>Convert website visitors into customers with real-time conversations and personalized support that drives sales.</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">⭐</div>
          <h3>Make premium support your new standard</h3>
          <p>Deliver exceptional customer service with AI-powered tools, canned responses, and seamless ticket management.</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">🔄</div>
          <h3>Admission support and share with a customer service solution</h3>
          <p>Streamline your support processes with shared inboxes, team collaboration, and performance analytics.</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">👥</div>
          <h3>Empower your teams with business insights</h3>
          <p>Equip your support team with the data and tools they need to excel and drive customer satisfaction.</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">🛠️</div>
          <h3>Connect with tools that support your business growth</h3>
          <p>Integrate with your favorite CRM, marketing, and productivity tools to create a seamless workflow.</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">🔗</div>
          <h3>LinkedIn customer service software</h3>
          <p>Capture leads from LinkedIn conversations and provide instant support through integrated chat functionality.</p>
        </div>
      </div>

      {/* Mobile Chat Bar (shown on mobile) */}
      <div className="mobile-chat-bar">
        <div className="mobile-chat-content">
          <div className="mobile-chat-text">
            <h4>Need help?</h4>
            <p>Chat with our support team</p>
          </div>
          <button className="mobile-chat-button" onClick={() => setIsChatOpen(true)}>
            💬 Start Chat
          </button>
        </div>
      </div>

      {/* Chat Toggle Button (shown on desktop) */}
      <button className={`chat-toggle ${isChatOpen ? 'hidden' : ''}`} onClick={() => setIsChatOpen(true)}>
        💬
      </button>

      {/* Live Chat Widget */}
      <div className={`live-chat-widget ${isChatOpen ? 'open' : 'closed'}`}>
        <div className="chat-header">
          <h3>Live Chat Support</h3>
          <button className="close-chat" onClick={() => setIsChatOpen(false)}>
            ✕
          </button>
        </div>

        <div className="chat-body" ref={chatBodyRef}>
          {messages.map((message, index) => (
            <div key={index} className={`chat-message ${message.isUser ? 'user' : 'bot'}`}>
              <div className="message-content">
                {message.text}
              </div>
            </div>
          ))}
        </div>

        <div className="chat-footer">
          <input
            type="text"
            className="chat-input"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
          />
          <button className="send-button" onClick={handleSendMessage}>
            ↗
          </button>
        </div>

        <div className="powered-by">
          Powered by <a href="https://jetautomations.ai" target="_blank" rel="noopener noreferrer">JetAutomations.ai</a>
        </div>
      </div>

      <footer className="app-footer">
        <p>Ready to transform your customer service? Get started today with our industry-leading live chat solution.</p>
      </footer>
    </div>
  );
};

export default JethelperApp;
