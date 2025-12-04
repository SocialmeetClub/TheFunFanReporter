/*
 * Frankenstein Chat Widget v7 (CLOUD PRODUCTION)
 * Live Demo: https://thefunfanreporter.com/kiro/
 */
(function() {
  'use strict';

  // 1. Inject Socket.io Library
  const script = document.createElement('script');
  script.src = "https://cdn.socket.io/4.7.5/socket.io.min.js";
  document.head.appendChild(script);

  script.onload = function() {
      console.log("✅ Library Loaded");
      startFrankenstein();
  };

  function startFrankenstein() {
      const randomNum = Math.floor(Math.random() * 1000);
      const isFounder = document.body.classList.contains('logged-in'); 
      
      const CONFIG = {
        socketUrl: 'https://funfan-brain.onrender.com', 
        eventId: 'superbowl_2025',
        userId: isFounder ? '1' : 'user_' + randomNum,
        username: isFounder ? 'Marilyn_Founder' : 'Reporter_' + randomNum,
        tipAmount: 1
      };

      let socket = null;

      function injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
          #funfan-chat-widget {
            position: fixed; bottom: 20px; right: 20px; width: 380px; height: 550px;
            background: #0a0a0a; border: 2px solid #00ff41; border-radius: 12px;
            box-shadow: 0 0 30px rgba(0, 255, 65, 0.3); font-family: 'Courier New', monospace;
            z-index: 9999; display: flex; flex-direction: column; overflow: hidden;
            transition: all 0.3s ease;
          }
          @media (max-width: 600px) {
            #funfan-chat-widget {
              width: 100% !important; height: 100% !important;
              bottom: 0 !important; right: 0 !important;
              border: none !important; border-radius: 0 !important;
            }
            #funfan-toggle-btn { bottom: 20px; right: 20px; }
          }
          #funfan-chat-header {
            background: #1a1a1a; color: #00ff41; padding: 15px; font-weight: bold;
            border-bottom: 2px solid #00ff41; display: flex; justify-content: space-between; align-items: center;
          }
          #funfan-close-btn { cursor: pointer; font-size: 20px; }
          #funfan-status { font-size: 10px; animation: pulse 2s infinite; }
          @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
          #funfan-chat-messages {
            flex: 1; overflow-y: auto; padding: 15px; background: #0a0a0a;
            scrollbar-width: thin; scrollbar-color: #00ff41 #1a1a1a;
          }
          .funfan-message {
            margin-bottom: 15px; padding: 10px; background: #1a1a1a;
            border-left: 3px solid #00ff41; border-radius: 4px;
          }
          .funfan-username { color: #00ff41; font-weight: bold; font-size: 14px; }
          .funfan-message-text { color: #e0e0e0; font-size: 15px; margin-top: 5px; }
          .funfan-tip-btn {
            background: linear-gradient(135deg, #00ff41 0%, #00cc33 100%);
            color: #000; border: none; padding: 8px 12px; margin-top: 8px;
            border-radius: 4px; font-weight: bold; cursor: pointer; width: 100%;
          }
          #funfan-chat-input-area {
            padding: 15px; border-top: 2px solid #00ff41; display: flex; gap: 10px; background: #1a1a1a;
            padding-bottom: 20px;
          }
          #funfan-message-input {
            flex: 1; background: #0a0a0a; border: 1px solid #00ff41; color: #00ff41; padding: 12px; font-size: 16px;
          }
          #funfan-send-btn {
             background: #00ff41; border: none; padding: 0 20px; font-weight: bold; cursor: pointer;
          }
          #funfan-toggle-btn {
            position: fixed; bottom: 20px; right: 20px; width: 60px; height: 60px;
            background: #00ff41; border: none; border-radius: 50%; color: #000;
            font-size: 24px; cursor: pointer; z-index: 9998;
            box-shadow: 0 0 20px rgba(0, 255, 65, 0.5);
          }
          .funfan-hidden { display: none !important; }
        `;
        document.head.appendChild(style);
      }

      function injectHTML() {
        const widgetHTML = `
          <button id="funfan-toggle-btn">💬</button>
          <div id="funfan-chat-widget" class="funfan-hidden">
            <div id="funfan-chat-header">
              <span>⚡ ${CONFIG.username}</span>
              <div style="display:flex; gap:10px; align-items:center;">
                  <span id="funfan-status">● LIVE</span>
                  <span id="funfan-close-btn">✕</span>
              </div>
            </div>
            <div id="funfan-chat-messages"></div>
            <div id="funfan-chat-input-area">
              <input type="text" id="funfan-message-input" placeholder="Type..." />
              <button id="funfan-send-btn">SEND</button>
            </div>
          </div>
        `;
        const container = document.createElement('div');
        container.innerHTML = widgetHTML;
        document.body.appendChild(container);
      }

      function appendMessage(data) {
        const div = document.createElement('div');
        div.className = 'funfan-message';
        const isMe = data.username === CONFIG.username;
        
        let tipButtonHTML = '';
        if (!isMe) {
            tipButtonHTML = `<button class="funfan-tip-btn" onclick="window.triggerTip('${data.senderUsername || data.username}')">💰 SEND TIP</button>`;
        }

        div.innerHTML = `
          <div><span class="funfan-username">${data.username}</span></div>
          <div class="funfan-message-text">${data.message}</div>
          ${tipButtonHTML}
        `;
        const container = document.getElementById('funfan-chat-messages');
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
      }

      function initSocket() {
        socket = io(CONFIG.socketUrl);
        socket.emit('join-room', CONFIG.eventId, CONFIG.userId);
        socket.on('new-message', appendMessage);
        
        socket.on('tip-success', (data) => {
             const isInvolved = (data.senderUsername === CONFIG.username) || (data.reporterUsername === CONFIG.username);
             if (isInvolved) {
                 const reporterShare = (data.amount * 0.5).toFixed(2);
                 const platformShare = (data.amount * 0.5).toFixed(2);
                 alert(`🎉 SUCCESS! Transaction Verified.\n\nFrom: ${data.senderUsername}\nTo: ${data.reporterUsername}\nTotal Tip: ${data.amount} Coins\n\n💸 50/50 SPLIT EXECUTED:\n- Reporter Gets: ${reporterShare} Coins\n- Platform Gets: ${platformShare} Coins`);
             }
        });
      }

      window.triggerTip = function(reporterName) {
          if(!socket) return;
          const input = prompt(`How many Meritocracy Coins for ${reporterName}?\n(1 Coin = $7.25)`);
          if (input === null) return; 
          const amount = parseFloat(input);
          if (isNaN(amount) || amount <= 0) { alert("Please enter a valid number."); return; }

          socket.emit('tip-reporter', {
              messageId: Date.now(),
              reporterUsername: reporterName,
              senderUsername: CONFIG.username,
              amount: amount,
              eventId: CONFIG.eventId
          });
      };

      injectStyles();
      injectHTML();
      
      const box = document.getElementById('funfan-chat-widget');
      const toggle = document.getElementById('funfan-toggle-btn');
      const closeBtn = document.getElementById('funfan-close-btn');

      function openChat() { box.classList.remove('funfan-hidden'); if(!socket) initSocket(); }
      function closeChat() { box.classList.add('funfan-hidden'); }

      toggle.onclick = () => { if (box.classList.contains('funfan-hidden')) openChat(); else closeChat(); };
      closeBtn.onclick = closeChat;

      document.addEventListener('click', function(e) {
          if (e.target && e.target.closest('.funfan-open')) {
              e.preventDefault();
              openChat();
          }
      });

      document.getElementById('funfan-send-btn').onclick = () => {
          const input = document.getElementById('funfan-message-input');
          if(input.value) {
              socket.emit('send-message', {
                  eventId: CONFIG.eventId, userId: CONFIG.userId, username: CONFIG.username, message: input.value
              });
              input.value = '';
          }
      };
  }
})();