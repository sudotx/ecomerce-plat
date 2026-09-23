# Ecommerce Platform

- **Client**: React (JavaScript) + Vite + React Router
- **Server**: Node.js + Express (JavaScript, REST API)
- **Database**: MongoDB with Mongoose
- **Auth**: JWT + bcrypt (added in a later phase)
- **Image storage**: Cloudinary (added in a later phase)

## Repository structure

```
class0.3/
├── client/          # React/Vite frontend
├── server/          # Express backend (REST API)
├── .gitignore
├── README.md
└── PROGRESS.md      # phase-by-phase progress log
```

## Running locally

### Server

```bash
cd server
npm install
cp .env.example .env   # then fill in real values
npm run dev            # starts on http://localhost:5000
```

Health check: `GET http://localhost:5001/api/health`

### Client

```bash
cd client
npm install
cp .env.example .env   # defaults already point at the local server
npm run dev            # starts on http://localhost:5173
```

## Environment variables

See `server/.env.example` and `client/.env.example` for the full list.
Never commit `.env` files — they contain secrets.
