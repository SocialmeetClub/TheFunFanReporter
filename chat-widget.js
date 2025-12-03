/**
 * TheFunFanReporter Chat Widget
 * Pure Vanilla JS - No build process required
 * Cyberpunk Sports Theme
 */

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    socketUrl: window.FUNFAN_SOCKET_URL || 'http://localhost:3000',
    eventId: window.FUNFAN_EVENT_ID || 'superbowl_2025',
    userId: window.FUNFAN_USER_ID || null,
    username: window.FUNFAN_USERNAME || 'Guest',
    tipAmount: 1 // 1 Meritocracy Coin (equivalent to $7.25)
  };

  let socket = null;
  let isConnected = false;

  // Inject CSS Styles (Cyberpunk Sports Theme)
  function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      #funfan-chat-widget {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 380px;
        height: 550px;
        background: #0a0a0a;
        border: 2px solid #00ff41;
        border-radius: 12px;
        box-shadow: 0 0 30px rgba(0, 255, 65, 0.3);
        font-family: 'Courier New', monospace;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      #funfan-chat-header {
        background: linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%);
        color: #00ff41;
        padding: 15px;
        font-weight: bold;
        font-size: 16px;
        border-bottom: 2px solid #00ff41;
        text-transform: uppercase;
        letter-spacing: 2px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      #funfan-status {
        font-size: 10px;
        color: #00ff41;
        animation: pulse 2s infinite;
      }

      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }

      #funfan-chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 15px;
        background: #0a0a0a;
        scrollbar-width: thin;
        scrollbar-color: #00ff41 #1a1a1a;
      }

      #funfan-chat-messages::-webkit-scrollbar {
        width: 8px;
      }

      #funfan-chat-messages::-webkit-scrollbar-track {
        background: #1a1a1a;
      }

      #funfan-chat-messages::-webkit-scrollbar-thumb {
        background: #00ff41;
        border-radius: 4px;
      }

      .funfan-message {
        margin-bottom: 15px;
        padding: 10px;
        background: #1a1a1a;
        border-left: 3px solid #00ff41;
        border-radius: 4px;
        animation: slideIn 0.3s ease;
      }

      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateX(20px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }

      .funfan-message-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }

      .funfan-username {
        color: #00ff41;
        font-weight: bold;
        font-size: 14px;
      }

      .funfan-timestamp {
        color: #666;
        font-size: 11px;
      }

      .funfan-message-text {
        color: #e0e0e0;
        font-size: 13px;
        line-height: 1.4;
        margin-bottom: 8px;
      }

      .funfan-tip-btn {
        background: linear-gradient(135deg, #00ff41 0%, #00cc33 100%);
        color: #0a0a0a;
        border: none;
        padding: 6px 12px;
        border-radius: 4px;
        font-weight: bold;
        font-size: 11px;
        cursor: pointer;
        text-transform: uppercase;
        letter-spacing: 1px;
        transition: all 0.3s ease;
        box-shadow: 0 0 10px rgba(0, 255, 65, 0.3);
      }

      .funfan-tip-btn:hover {
        background: linear-gradient(135deg, #00cc33 0%, #00ff41 100%);
        box-shadow: 0 0 20px rgba(0, 255, 65, 0.6);
        transform: scale(1.05);
      }

      .funfan-tip-btn:disabled {
        background: #333;
        color: #666;
        cursor: not-allowed;
        box-shadow: none;
      }

      .funfan-tip-success {
        color: #00ff41;
        font-size: 11px;
        margin-top: 5px;
        animation: fadeIn 0.5s ease;
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      #funfan-chat-input-area {
        padding: 15px;
        background: #1a1a1a;
        border-top: 2px solid #00ff41;
        display: flex;
        gap: 10px;
      }

      #funfan-message-input {
        flex: 1;
        background: #0a0a0a;
        border: 1px solid #00ff41;
        color: #00ff41;
        padding: 10px;
        border-radius: 4px;
        font-family: 'Courier New', monospace;
        font-size: 13px;
      }

      #funfan-message-input:focus {
        outline: none;
        box-shadow: 0 0 10px rgba(0, 255, 65, 0.3);
      }

      #funfan-send-btn {
        background: linear-gradient(135deg, #00ff41 0%, #00cc33 100%);
        color: #0a0a0a;
        border: none;
        padding: 10px 20px;
        border-radius: 4px;
        font-weight: bold;
        cursor: pointer;
        text-transform: uppercase;
        letter-spacing: 1px;
        transition: all 0.3s ease;
      }

      #funfan-send-btn:hover {
        background: linear-gradient(135deg, #00cc33 0%, #00ff41 100%);
        box-shadow: 0 0 15px rgba(0, 255, 65, 0.5);
      }

      #funfan-toggle-btn {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 60px;
        height: 60px;
        background: linear-gradient(135deg, #00ff41 0%, #00cc33 100%);
        border: none;
        border-radius: 50%;
        color: #0a0a0a;
        font-size: 24px;
        cursor: pointer;
        box-shadow: 0 0 20px rgba(0, 255, 65, 0.5);
        z-index: 9998;
        transition: all 0.3s ease;
      }

      #funfan-toggle-btn:hover {
        transform: scale(1.1);
        box-shadow: 0 0 30px rgba(0, 255, 65, 0.8);
      }

      .funfan-hidden {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  // Inject HTML Structure
  function injectHTML() {
    const widgetHTML = `
      <button id="funfan-toggle-btn">💬</button>
      <div id="funfan-chat-widget" class="funfan-hidden">
        <div id="funfan-chat-header">
          <span>⚡ TheFunFanReporter</span>
          <span id="funfan-status">● LIVE</span>
        </div>
        <div id="funfan-chat-messages"></div>
        <div id="funfan-chat-input-area">
          <input 
            type="text" 
            id="funfan-message-input" 
            placeholder="Type your message..." 
            maxlength="500"
          />
          <button id="funfan-send-btn">Send</button>
        </div>
      </div>
    `;
    
    const container = document.createElement('div');
    container.innerHTML = widgetHTML;
    document.body.appendChild(container);
  }

  // Format timestamp
  function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  // Play coin sound effect
  function playCoinSound() {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGS57OihUBELTKXh8bllHgU2jdXvzn0pBSh+zPDhkj4KFV+16+qnVRQLRp/g8r5sIQUrgs/y2Ik2CBhkuezooVARDEyl4fG5ZR4FNo3V785+KQUofszw4ZI+ChVftevqp1UVC0af4PK+bCEFK4LP8tmJNggYZLns6KFQEQxMpeHxuWUeBTaN1e/OfikFKH7M8OGSPgoVX7Xr6qdVFQtGn+DyvmwhBSuCz/LZiTYIGGS57OihUBEMTKXh8bllHgU2jdXvzn4pBSh+zPDhkj4KFV+16+qnVRULRp/g8r5sIQUrgs/y2Yk2CBhkuezooVARDEyl4fG5ZR4FNo3V785+KQUofszw4ZI+ChVftevqp1UVC0af4PK+bCEFK4LP8tmJNggYZLns6KFQEQxMpeHxuWUeBTaN1e/OfikFKH7M8OGSPgoVX7Xr6qdVFQtGn+DyvmwhBSuCz/LZiTYIGGS57OihUBEMTKXh8bllHgU2jdXvzn4pBSh+zPDhkj4KFV+16+qnVRULRp/g8r5sIQUrgs/y2Yk2CBhkuezooVARDEyl4fG5ZR4FNo3V785+KQUofszw4ZI+ChVftevqp1UVC0af4PK+bCEFK4LP8tmJNggYZLns6KFQEQxMpeHxuWUeBTaN1e/OfikFKH7M8OGSPgoVX7Xr6qdVFQtGn+DyvmwhBSuCz/LZiTYIGGS57OihUBEMTKXh8bllHgU2jdXvzn4pBSh+zPDhkj4KFV+16+qnVRULRp/g8r5sIQUrgs/y2Yk2CBhkuezooVARDEyl4fG5ZR4FNo3V785+KQUofszw4ZI+ChVftevqp1UVC0af4PK+bCEFK4LP8tmJNggYZLns6KFQEQxMpeHxuWUeBTaN1e/OfikFKH7M8OGSPgoVX7Xr6qdVFQtGn+DyvmwhBSuCz/LZiTYIGGS57OihUBEMTKXh8bllHgU2jdXvzn4pBSh+zPDhkj4KFV+16+qnVRULRp/g8r5sIQUrgs/y2Yk2CBhkuezooVARDEyl4fG5ZR4FNo3V785+KQUofszw4ZI+ChVftevqp1UVC0af4PK+bCEFK4LP8tmJNggYZLns6KFQEQxMpeHxuWUeBTaN1e/OfikFKH7M8OGSPgoVX7Xr6qdVFQtGn+DyvmwhBSuCz/LZiTYIGGS57OihUBEMTKXh8bllHgU2jdXvzn4pBSh+zPDhkj4KFV+16+qnVRULRp/g8r5sIQUrgs/y');
    audio.volume = 0.3;
    audio.play().catch(e => console.log('Audio play failed:', e));
  }

  // Append message to chat
  function appendMessage(messageData) {
    const messagesContainer = document.getElementById('funfan-chat-messages');
    const isOwnMessage = messageData.userId === CONFIG.userId;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'funfan-message';
    messageDiv.dataset.messageId = messageData.messageId;
    
    messageDiv.innerHTML = `
      <div class="funfan-message-header">
        <span class="funfan-username">${messageData.username}</span>
        <span class="funfan-timestamp">${formatTime(messageData.timestamp)}</span>
      </div>
      <div class="funfan-message-text">${escapeHtml(messageData.message)}</div>
      ${!isOwnMessage ? `
        <button 
          class="funfan-tip-btn" 
          data-reporter-id="${messageData.userId}"
          data-reporter-username="${messageData.username}"
          data-message-id="${messageData.messageId}"
        >
          💰 Tip $7.25
        </button>
        <div class="funfan-tip-status"></div>
      ` : ''}
    `;
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Attach tip button listener
    if (!isOwnMessage) {
      const tipBtn = messageDiv.querySelector('.funfan-tip-btn');
      tipBtn.addEventListener('click', handleTipClick);
    }
  }

  // Escape HTML to prevent XSS
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Handle tip button click
  function handleTipClick(e) {
    const btn = e.target;
    const reporterId = btn.dataset.reporterId;
    const reporterUsername = btn.dataset.reporterUsername;
    const messageId = btn.dataset.messageId;
    
    if (!CONFIG.userId) {
      alert('Please log in to tip reporters!');
      return;
    }
    
    btn.disabled = true;
    btn.textContent = 'Processing...';
    
    // Emit tip event to server
    socket.emit('tip-reporter', {
      messageId,
      reporterId,
      reporterUsername,
      senderId: CONFIG.userId,
      senderUsername: CONFIG.username,
      amount: CONFIG.tipAmount,
      eventId: CONFIG.eventId
    });
  }

  // Initialize Socket.io connection
  function initSocket() {
    socket = io(CONFIG.socketUrl, {
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('✅ Connected to TheFunFanReporter');
      isConnected = true;
      document.getElementById('funfan-status').textContent = '● LIVE';
      
      // Join event room
      socket.emit('join-room', CONFIG.eventId, CONFIG.userId);
      
      // Load chat history
      socket.emit('load-history', CONFIG.eventId);
    });

    socket.on('disconnect', () => {
      console.log('❌ Disconnected from server');
      isConnected = false;
      document.getElementById('funfan-status').textContent = '● OFFLINE';
    });

    // Listen for new messages
    socket.on('new-message', (messageData) => {
      appendMessage(messageData);
    });

    // Listen for chat history
    socket.on('chat-history', (messages) => {
      const messagesContainer = document.getElementById('funfan-chat-messages');
      messagesContainer.innerHTML = '';
      messages.forEach(msg => appendMessage(msg));
    });

    // Listen for tip success
    socket.on('tip-success', (tipData) => {
      const messageDiv = document.querySelector(`[data-message-id="${tipData.messageId}"]`);
      if (messageDiv) {
        const btn = messageDiv.querySelector('.funfan-tip-btn');
        const statusDiv = messageDiv.querySelector('.funfan-tip-status');
        
        btn.textContent = '✓ Tipped!';
        btn.disabled = true;
        statusDiv.innerHTML = `<div class="funfan-tip-success">💚 ${tipData.senderUsername} tipped ${tipData.split.reporter} coins!</div>`;
      }
    });

    // Listen for coin sound trigger
    socket.on('play-coin-sound', () => {
      playCoinSound();
    });

    // Listen for tip errors
    socket.on('tip-error', (errorData) => {
      alert(`Tip failed: ${errorData.error}`);
      const messageDiv = document.querySelector(`[data-message-id="${errorData.messageId}"]`);
      if (messageDiv) {
        const btn = messageDiv.querySelector('.funfan-tip-btn');
        btn.textContent = '💰 Tip $7.25';
        btn.disabled = false;
      }
    });
  }

  // Send message
  function sendMessage() {
    const input = document.getElementById('funfan-message-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    if (!CONFIG.userId) {
      alert('Please log in to send messages!');
      return;
    }
    
    socket.emit('send-message', {
      eventId: CONFIG.eventId,
      userId: CONFIG.userId,
      username: CONFIG.username,
      message
    });
    
    input.value = '';
  }

  // Initialize widget
  function init() {
    injectStyles();
    injectHTML();
    
    // Toggle widget visibility
    const toggleBtn = document.getElementById('funfan-toggle-btn');
    const widget = document.getElementById('funfan-chat-widget');
    
    toggleBtn.addEventListener('click', () => {
      widget.classList.toggle('funfan-hidden');
      if (!widget.classList.contains('funfan-hidden') && !isConnected) {
        initSocket();
      }
    });
    
    // Send message on button click
    const sendBtn = document.getElementById('funfan-send-btn');
    sendBtn.addEventListener('click', sendMessage);
    
    // Send message on Enter key
    const input = document.getElementById('funfan-message-input');
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        sendMessage();
      }
    });
  }

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
