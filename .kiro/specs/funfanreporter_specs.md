# PROJECT SPECIFICATION: TheFunFanReporter
## Context
We are building a "Frankenstein" application for the Kiroween Hackathon.
The goal is to embed a high-concurrency Node.js Real-Time Chat into a legacy WordPress site.

## The Architecture
1. **Frontend:** WordPress (PHP/HTML). The chat interface is a Floating Widget (Javascript) injected into the WP Footer.
2. **Backend:** Node.js (Express) + Socket.io (Version 4+).
3. **Database/State:** Redis (for chat history and scaling) + WordPress MySQL (via REST API for user balances).

## The Business Logic (The "Meritocracy" Model)
1. **Chat Rooms:** Dynamic rooms based on Event ID (e.g., `room_superbowl_2025`).
2. **Reporter Tipping Flow (50/50 Split):**
    - User A (The Reporter) posts a message.
    - User B (The Fan) clicks "Tip 1 Coin" on that message.
    - **Step 1:** Server verifies User B has 1 Meritocracy Coin (via WP API).
    - **Step 2:** Server executes the transaction:
        - Deduct 1 Coin from User B.
        - **Credit 0.5 Coins to User A (Reporter).**
        - **Credit 0.5 Coins to Admin (TheFunFanReporter Platform).**
    - **Step 3:** Server broadcasts a "Coin Sound" and updates the UI live.

## Technical Constraints for Kiro
- Use `socket.io` for real-time comms.
- Use `redis` for the adapter (simulating AWS ElastiCache).
- The Client-Side Script must be pure vanilla JS (No React/Vue build steps) so it can be pasted directly into WordPress.
- **UI Design:** Cyberpunk Sports theme. Dark mode, Neon Green text for tips.

## API Endpoints (Mock Logic)
- `POST /api/process-tip`: Accepts `{ senderId, reporterId, amount }`. Returns `{ success: true, split: "50/50" }`.