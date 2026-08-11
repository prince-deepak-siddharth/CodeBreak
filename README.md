# ☕ DevBrew

> **Coffee chats for developers.** Get matched 1:1 with another dev who shares your interests. 15 minutes of real conversation. Then back to work.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4-010101?style=flat-square&logo=socket.io)
![WebRTC](https://img.shields.io/badge/WebRTC-Enabled-brightgreen?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)

---

## ✨ Features

- **🎯 Interest-Based Matching** — Pick your tech interests (React, Kubernetes, AI, etc.) and get matched with developers who share them
- **📹 HD Video Chat** — Real-time peer-to-peer video calls powered by WebRTC
- **⚡ Instant Connect** — No signup required. Jump straight into conversations
- **🔀 Skip & Match** — Not vibing? Skip and instantly find a new partner
- **🔒 Privacy First** — No data stored. Connections are ephemeral
---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16, React 19, TypeScript |
| **Real-time** | Socket.IO for signaling |
| **Video** | WebRTC with STUN/TURN servers |
| **Backend** | Node.js, Express, TypeScript |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn



## 📁 Project Structure

```
DevBrew/
├── backend/
│   ├── src/
│   │   └── index.ts        # WebRTC signaling server
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/
    ├── app/
    │   ├── page.tsx        # Landing page
    │   ├── interests/
    │   │   └── page.tsx    # Interest selection
    │   ├── chat/
    │   │   └── page.tsx    # Video chat room
    │   ├── globals.css     # Global styles
    │   └── layout.tsx      # Root layout
    ├── package.json
    └── tsconfig.json
```

---

## ⚙️ How It Works

1. **User joins** → Selects interests → Joins the matching queue
2. **Matching algorithm** → Finds best match based on shared interests
3. **WebRTC handshake** → Signaling server facilitates offer/answer exchange
4. **Peer connection** → Direct video/audio stream between users
5. **Chat ends** → User can skip or leave; no data is stored

```
┌──────────┐     Socket.IO     ┌──────────────┐     Socket.IO     ┌──────────┐
│  User A  │ ◄──────────────► │   Signaling   │ ◄──────────────► │  User B  │
│ (Peer A) │                   │    Server     │                   │ (Peer B) │
└────┬─────┘                   └──────────────┘                   └────┬─────┘
     │                                                                  │
     │                      WebRTC Peer Connection                      │
     └──────────────────────────────────────────────────────────────────┘
                           (Direct Video/Audio)
```

---

## 🔧 Configuration

### STUN/TURN Servers

The app uses public STUN servers and OpenRelay TURN servers for NAT traversal:

```typescript
const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        {
            urls: 'turn:openrelay.metered.ca:80',
            username: 'openrelayproject',
            credential: 'openrelayproject',
        },
    ],
};
```

For production, consider using your own TURN server (e.g., Coturn) for reliability.

---

## 📦 Deployment

### Backend
Deploy to any Node.js hosting (Railway, Render, Fly.io, etc.):
```bash
cd backend
npm run build
npm start
```

### Frontend
Deploy to Vercel:
```bash
cd frontend
npm run build
# Deploy with Vercel CLI or GitHub integration
```

Update `NEXT_PUBLIC_SIGNALING_SERVER` to your production backend URL.

---

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests

---

<div align="center">
  <strong>☕ Grab a coffee. Find your people.</strong>
</div>
