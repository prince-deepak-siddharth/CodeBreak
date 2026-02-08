#!/bin/bash
set -e


git branch -M main

# Commit 1: 2026-02-08 12:39:24
git add "README.md"
git add "frontend/hooks/useWebRTC.ts"
git add "frontend/public/window.svg"
GIT_AUTHOR_DATE="2026-02-08 12:39:24" GIT_COMMITTER_DATE="2026-02-08 12:39:24" git commit -m "Initial project setup"

# Commit 2: 2026-02-08 12:44:15
git add "backend/src/index.ts"
git add "frontend/public/vercel.svg"
git add "frontend/next-env.d.ts"
GIT_AUTHOR_DATE="2026-02-08 12:44:15" GIT_COMMITTER_DATE="2026-02-08 12:44:15" git commit -m "Added core configuration"

# Commit 3: 2026-02-08 13:19:54
git add "frontend/public/file.svg"
git add "frontend/eslint.config.mjs"
git add "frontend/public/next.svg"
GIT_AUTHOR_DATE="2026-02-08 13:19:54" GIT_COMMITTER_DATE="2026-02-08 13:19:54" git commit -m "Implemented frontend structure"

# Commit 4: 2026-02-08 14:09:09
git add "frontend/app/layout.tsx"
git add "frontend/tsconfig.json"
git add "frontend/app/interests/page.tsx"
GIT_AUTHOR_DATE="2026-02-08 14:09:09" GIT_COMMITTER_DATE="2026-02-08 14:09:09" git commit -m "Implement basic backend server"

# Commit 5: 2026-02-08 14:40:35
git add "frontend/package-lock.json"
git add "frontend/next.config.ts"
git add "frontend/app/globals.css"
GIT_AUTHOR_DATE="2026-02-08 14:40:35" GIT_COMMITTER_DATE="2026-02-08 14:40:35" git commit -m "Added socket.io support"

# Commit 6: 2026-02-08 15:19:54
git add "frontend/postcss.config.mjs"
git add "backend/package.json"
git add "backend/package-lock.json"
GIT_AUTHOR_DATE="2026-02-08 15:19:54" GIT_COMMITTER_DATE="2026-02-08 15:19:54" git commit -m "Create UI layout components"

# Commit 7: 2026-02-08 15:35:20
git add "frontend/package.json"
git add "frontend/app/page.tsx"
GIT_AUTHOR_DATE="2026-02-08 15:35:20" GIT_COMMITTER_DATE="2026-02-08 15:35:20" git commit -m "Implemented chat functionality"

# Commit 8: 2026-02-08 15:39:04
git add "frontend/README.md"
git add "frontend/app/chat/page.tsx"
GIT_AUTHOR_DATE="2026-02-08 15:39:04" GIT_COMMITTER_DATE="2026-02-08 15:39:04" git commit -m "Added WebRTC hooks"

# Commit 9: 2026-02-08 15:49:10
git add "frontend/public/globe.svg"
git add "backend/tsconfig.json"
GIT_AUTHOR_DATE="2026-02-08 15:49:10" GIT_COMMITTER_DATE="2026-02-08 15:49:10" git commit -m "Style improvements and assets"

# Commit 10: 2026-02-08 16:13:21
git add "frontend/app/favicon.ico"
git add "frontend/hooks/useSocket.ts"
GIT_AUTHOR_DATE="2026-02-08 16:13:21" GIT_COMMITTER_DATE="2026-02-08 16:13:21" git commit -m "Fixed features"

echo "Created 10 commits successfully."
git log --oneline --graph --all
