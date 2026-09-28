# Tourney frontend

Angular 17 client for the Tourney ban/pick draft. Talks to the backend over HTTP + Server-Sent Events.

## Run locally

```bash
npm install
npm start    # http://localhost:4200, uses http://localhost:3000 as the API
```

Start the backend first (`tourney-backend-re/backend`, `npm run dev`).

## Configure

- `src/environments/environment.development.ts` → API for `ng serve`
- `src/environments/environment.ts` → API for production builds. **Set this to your deployed backend URL.**

## Deploy (Vercel)

Import the repo; the Angular preset works as-is (`ng build`, output `dist/frontend/browser`).
Deep links like `/lobby/<id>` are served by Vercel's SPA fallback.

## How identity works

No accounts. Creating a lobby returns an owner token, and taking a seat returns a player token; both are kept in
`localStorage` and sent with each action. The server checks them, so only the seated player can act on their turn.
