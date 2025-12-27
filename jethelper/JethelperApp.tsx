<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Live Chat Software | JetAutomations</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Poppins', sans-serif;
        }

        body {
            background-color: #f8fafc;
            color: #333;
            line-height: 1.6;
            padding: 20px;
            min-height: 100vh;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
        }

        header {
            text-align: center;
            margin-bottom: 40px;
            padding-top: 20px;
        }

        h1 {
            font-size: 2.8rem;
            color: #1a56db;
            margin-bottom: 10px;
            background: linear-gradient(90deg, #1a56db, #3b82f6);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
            font-weight: 700;
        }

        .tagline {
            font-size: 1.2rem;
            color: #6b7280;
            max-width: 800px;
            margin: 0 auto 30px;
        }

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
            color: #3b82f6;
            margin-bottom: 15px;
        }

        .feature-card h3 {
            font-size: 1.4rem;
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

        .chat-header {
            background: linear-gradient(135deg, #1a56db, #3b82f6);
            color: white;
            padding: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .chat-header h3 {
            font-size: 1.3rem;
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

        .chat-toggle:hover {
            transform: scale(1.05);
            box-shadow: 0 8px 25px rgba(26, 86, 219, 0.5);
        }

        .chat-hidden {
            transform: translateY(100px);
            opacity: 0;
            pointer-events: none;
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

        .mobile-chat-bar-content {
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
        footer {
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

            h1 {
                font-size: 2.2rem;
            }

            .tagline {
                font-size: 1.1rem;
            }
        }

        @media (max-width: 480px) {
            .features-grid {
                grid-template-columns: 1fr;
            }

            .feature-card {
                padding: 20px;
            }

            .live-chat-widget {
                height: 80vh;
            }

            h1 {
                font-size: 1.8rem;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>The live chat software that gets the job done</h1>
            <p class="tagline">Premium customer service software that helps you engage with customers, boost sales, and support your business growth with powerful tools and integrations.</p>
        </header>

        <div class="features-grid">
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-comments"></i>
                </div>
                <h3>Engage with live chat, sell with ease</h3>
                <p>Convert website visitors into customers with real-time conversations and personalized support that drives sales.</p>
            </div>

            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-headset"></i>
                </div>
                <h3>Make premium support your new standard</h3>
                <p>Deliver exceptional customer service with AI-powered tools, canned responses, and seamless ticket management.</p>
            </div>

            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-share-alt"></i>
                </div>
                <h3>Admission support and share with a customer service solution</h3>
                <p>Streamline your support processes with shared inboxes, team collaboration, and performance analytics.</p>
            </div>

            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-users"></i>
                </div>
                <h3>Empower your teams with business insights</h3>
                <p>Equip your support team with the data and tools they need to excel and drive customer satisfaction.</p>
            </div>

            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-tools"></i>
                </div>
                <h3>Connect with tools that support your business growth</h3>
                <p>Integrate with your favorite CRM, marketing, and productivity tools to create a seamless workflow.</p>
            </div>

            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-bolt"></i>
                </div>
                <h3>LinkedIn customer service software</h3>
                <p>Capture leads from LinkedIn conversations and provide instant support through integrated chat functionality.</p>
            </div>
        </div>

        <footer>
            <p>Ready to transform your customer service? Get started today with our industry-leading live chat solution.</p>
        </footer>
    </div>

    <!-- Mobile Chat Bar (shown on mobile) -->
    <div class="mobile-chat-bar">
        <div class="mobile-chat-bar-content">
            <div class="mobile-chat-text">
                <h4>Need help?</h4>
                <p>Chat with our support team</p>
            </div>
            <button class="mobile-chat-button" id="mobileChatOpen">
                <i class="fas fa-comment-dots"></i> Start Chat
            </button>
        </div>
    </div>

    <!-- Chat Toggle Button (shown on desktop) -->
    <button class="chat-toggle" id="chatToggle">
        <i class="fas fa-comment-dots"></i>
    </button>

    <!-- Live Chat Widget -->
    <div class="live-chat-widget chat-hidden" id="chatWidget">
        <div class="chat-header">
            <h3>Live Chat Support</h3>
            <button class="close-chat" id="closeChat">
                <i class="fas fa-times"></i>
            </button>
        </div>

        <div class="chat-body" id="chatBody">
            <div class="chat-message bot">
                <div class="message-content">
                    Hello! Welcome to our live chat. How can we help you today?
                </div>
            </div>
            <div class="chat-message user">
                <div class="message-content">
                    I'm interested in your live chat software
                </div>
            </div>
            <div class="chat-message bot">
                <div class="message-content">
                    Great! Our software helps businesses engage with customers in real-time, boost sales, and provide premium support. Would you like to know about specific features?
                </div>
            </div>
        </div>

        <div class="chat-footer">
            <input type="text" class="chat-input" id="chatInput" placeholder="Type your message...">
            <button class="send-button" id="sendMessage">
                <i class="fas fa-paper-plane"></i>
            </button>
        </div>

        <div class="powered-by">
            Powered by <a href="https://jetautomations.ai" target="_blank">JetAutomations.ai</a>
        </div>
    </div>

    <script>
        // DOM Elements
        const chatToggle = document.getElementById('chatToggle');
        const chatWidget = document.getElementById('chatWidget');
        const closeChat = document.getElementById('closeChat');
        const mobileChatOpen = document.getElementById('mobileChatOpen');
        const chatInput = document.getElementById('chatInput');
        const sendMessage = document.getElementById('sendMessage');
        const chatBody = document.getElementById('chatBody');

        // Toggle chat widget
        function toggleChat() {
            chatWidget.classList.toggle('chat-hidden');
        }

        // Open chat
        chatToggle.addEventListener('click', toggleChat);
        mobileChatOpen.addEventListener('click', toggleChat);

        // Close chat
        closeChat.addEventListener('click', toggleChat);

        // Send message function
        function sendChatMessage() {
            const message = chatInput.value.trim();
            
            if (message) {
                // Add user message
                const userMessage = document.createElement('div');
                userMessage.className = 'chat-message user';
                userMessage.innerHTML = `<div class="message-content">${message}</div>`;
                chatBody.appendChild(userMessage);
                
                // Clear input
                chatInput.value = '';
                
                // Scroll to bottom
                chatBody.scrollTop = chatBody.scrollHeight;
                
                // Simulate bot response after delay
                setTimeout(() => {
                    const responses = [
                        "Thanks for your message! Our team will get back to you shortly.",
                        "That's a great question! Let me connect you with a specialist.",
                        "I can help with that! Would you like to schedule a demo of our software?",
                        "We offer several plans depending on your business needs. Would you like to see pricing options?"
                    ];
                    
                    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
                    
                    const botMessage = document.createElement('div');
                    botMessage.className = 'chat-message bot';
                    botMessage.innerHTML = `<div class="message-content">${randomResponse}</div>`;
                    chatBody.appendChild(botMessage);
                    
                    // Scroll to bottom
                    chatBody.scrollTop = chatBody.scrollHeight;
                }, 1000);
            }
        }

        // Send message on button click
        sendMessage.addEventListener('click', sendChatMessage);

        // Send message on Enter key
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendChatMessage();
            }
        });

        // Auto-open chat on page load for demo purposes
        setTimeout(() => {
            if (window.innerWidth > 768) {
                toggleChat();
            }
        }, 2000);
    </script>
</body>
</html>
