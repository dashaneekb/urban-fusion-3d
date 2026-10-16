# City Strike (prototype)

City Strike is an original-IP, mobile-friendly 3D browser prototype that blends FPS combat, basketball mini-games, vehicles, and an open shared city. This initial commit provides a simple client (Three.js) and a small authoritative Node WebSocket server for multiplayer sync (up to 4 players). Everything is free.

WARNING: This is an early prototype. To play with friends you must run the server (instructions below) or deploy it to a hosting provider. I can help deploy under your account if you want.

Features in this first version:
- Mobile-friendly 3D scene with a controllable player cube
- WebSocket server that accepts up to 4 players in a single room
- Synchronized player positions and simple shooting events
- Placeholders and hooks for basketball, vehicles, and further game logic

How to run locally (quick):

1) Clone the repo
   git clone https://github.com/dashaneekb/urban-fusion-3d.git
   cd urban-fusion-3d

2) Start the server
   cd server
   npm install
   node index.js

   By default the server listens on port 8080.

3) Open the client
   Open client/index.html in a modern browser (Chrome / Edge / Firefox) or serve the client folder using a static server (recommended):
   npx serve client
   Then open the provided URL (mobile browsers supported).

Notes on hosting a live "play now" link:
- The client can be hosted as static files (GitHub Pages / Vercel / Cloudflare Pages).
- The server (WebSocket) must be deployed to a Node host (Render, Railway, Fly, Heroku, or similar). I can deploy this for you if you grant deployment access or provide credentials.

Next steps I will take after you confirm:
- Add mobile virtual-stick controls and polish touch UX
- Implement authoritative ball physics for basketball and simple vehicle prototypes
- Deploy a public server and static client to provide a live "play now" link you can share with friends

If you want me to deploy the server (Option A: hosted prototype), tell me which hosting provider/account to use (Render, Railway, Vercel + a separate server host), or I can provide step-by-step deployment commands so you can deploy quickly.
