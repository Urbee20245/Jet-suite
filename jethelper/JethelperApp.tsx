/* Base Styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
  background-color: #f8fafc;
  color: #333;
  line-height: 1.6;
}

.app-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  min-height: 100vh;
}

/* Header */
.app-header {
  text-align: center;
  margin-bottom: 40px;
  padding-top: 20px;
}

.app-header h1 {
  font-size: 2.5rem;
  color: #1a56db;
  margin-bottom: 15px;
  font-weight: 700;
  background: linear-gradient(90deg, #1a56db, #3b82f6);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.tagline {
  font-size: 1.1rem;
  color: #6b7280;
  max-width: 800px;
  margin: 0 auto 30px;
}

/* Features Grid */
.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 25px;
  margin-bottom: 50px;
}

.feature-card {
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s, box-shadow 0.3s;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
}

.feature-icon {
  font-size: 2.5rem;
  margin-bottom: 15px;
}

.feature-card h3 {
  font-size: 1.3rem;
  color: #1f2937;
  margin-bottom: 12px;
}

.feature-card p {
  color: #6b7280;
  font-size: 1rem;
}

/* Live Chat Widget */
.live-chat-widget {
  position: fixed;
  right: 30px;
  bottom: 30px;
  width: 380px;
  max-width: 90vw;
  height: 500px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  z-index: 1000;
  overflow: hidden;
  transition: all 0.3s ease;
  border: 1px solid #e5e7eb;
}

.live-chat-widget.closed {
  transform: translateY(100px);
  opacity: 0;
  pointer-events: none;
}

.live-chat-widget.open {
  transform: translateY(0);
  opacity: 1;
}

.chat-header {
  background: linear-gradient(135deg, #1a56db, #3b82f6);
  color: white;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chat-header h3 {
  font-size: 1.2rem;
  font-weight: 600;
}

.close-chat {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.close-chat:hover {
  background: rgba(255, 255, 255, 0.3);
}

.chat-body {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background: #f9fafb;
}

.chat-message {
  margin-bottom: 16px;
  display: flex;
}

.chat-message.bot {
  justify-content: flex-start;
}

.chat-message.user {
  justify-content: flex-end;
}

.message-content {
  max-width: 75%;
  padding: 12px 16px;
  border-radius: 18px;
  font-size: 0.95rem;
  line-height: 1.4;
}

.bot .message-content {
  background: white;
  border: 1px solid #e5e7eb;
  color: #1f2937;
  border-top-left-radius: 4px;
}

.user .message-content {
  background: #3b82f6;
  color: white;
  border-top-right-radius: 4px;
}

.chat-footer {
  padding: 20px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  gap: 10px;
}

.chat-input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 24px;
  font-size: 0.95rem;
  outline: none;
  transition: border 0.2s;
}

.chat-input:focus {
  border-color: #3b82f6;
}

.send-button {
  background: #3b82f6;
  color: white;
  border: none;
  width: 46px;
  height: 46px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  font-size: 1.2rem;
}

.send-button:hover {
  background: #1d4ed8;
}

/* Chat Toggle Button */
.chat-toggle {
  position: fixed;
  right: 30px;
  bottom: 30px;
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #1a56db, #3b82f6);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 6px 20px rgba(26, 86, 219, 0.4);
  z-index: 999;
  border: none;
  font-size: 1.5rem;
  transition: transform 0.3s, box-shadow 0.3s;
}

.chat-toggle.hidden {
  display: none;
}

.chat-toggle:hover {
  transform: scale(1.05);
  box-shadow: 0 8px 25px rgba(26, 86, 219, 0.5);
}

/* Mobile Bottom Bar */
.mobile-chat-bar {
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  padding: 15px 20px;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.1);
  z-index: 998;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
}

.mobile-chat-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.mobile-chat-text {
  flex: 1;
}

.mobile-chat-text h4 {
  color: #1f2937;
  font-size: 1.1rem;
  margin-bottom: 4px;
}

.mobile-chat-text p {
  color: #6b7280;
  font-size: 0.9rem;
}

.mobile-chat-button {
  background: linear-gradient(135deg, #1a56db, #3b82f6);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 24px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.mobile-chat-button:hover {
  background: #1d4ed8;
}

/* Powered by */
.powered-by {
  text-align: center;
  padding: 15px;
  color: #6b7280;
  font-size: 0.9rem;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

.powered-by a {
  color: #3b82f6;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s;
}

.powered-by a:hover {
  color: #1a56db;
  text-decoration: underline;
}

/* Footer */
.app-footer {
  text-align: center;
  margin-top: 40px;
  padding-top: 30px;
  border-top: 1px solid #e5e7eb;
  color: #6b7280;
  font-size: 0.9rem;
}

/* Responsive Design */
@media (max-width: 768px) {
  .live-chat-widget {
    width: 100%;
    height: 70vh;
    right: 0;
    bottom: 0;
    border-radius: 16px 16px 0 0;
  }

  .chat-toggle {
    display: none;
  }

  .mobile-chat-bar {
    display: block;
  }

  .app-header h1 {
    font-size: 2rem;
  }

  .tagline {
    font-size: 1rem;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }

  .feature-card {
    padding: 20px;
  }
}

@media (max-width: 480px) {
  .app-header h1 {
    font-size: 1.8rem;
  }

  .live-chat-widget {
    height: 80vh;
  }
}
