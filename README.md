# Xanlytics

A production-ready pNode analytics platform with MongoDB-backed architecture.

## Features

- **Dashboard** — Network overview with stats, version distribution, and node map
- **Nodes List** — Searchable, sortable table with CSV export
- **Node Details** — Historical snapshots and detailed info
- **History** — Network trends over time with charts
- **Compare** — Side-by-side comparison of up to 3 nodes
- **Status Page** — System health and manual sync trigger

## Architecture

```
Background Sync Worker → pRPC → MongoDB (cache)
User Request → API Routes → MongoDB → Response (fast!)
```

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Create `.env.local`:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/xanlytics
PRPC_ENDPOINT=http://127.0.0.1:6000/rpc
```

### 3. Connect to pNode (for local development)

```bash
ssh -L 6000:localhost:6000 root@your-pnode-ip
```

### 4. Run development server

```bash
npm run dev
```

### 5. Trigger initial sync

Visit `http://localhost:3000/api/cron/sync` to populate the database.

## API Routes

| Route | Description |
|-------|-------------|
| `GET /api/nodes` | List all nodes (search, filter, sort) |
| `GET /api/nodes/[id]` | Node details with history |
| `GET /api/stats` | Network overview stats |
| `GET /api/cron/sync` | Trigger manual sync |

## Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS, Leaflet, Recharts
- **Backend**: MongoDB Atlas, Mongoose
- **Data**: pRPC (Xandeum pNode API)

## Deployment to Vercel

### 1. Push to GitHub

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2. Import to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Vercel will auto-detect Next.js

### 3. Configure Environment Variables

In Vercel project settings → Environment Variables:

| Variable | Value |
|----------|-------|
| `MONGODB_URI` | Your MongoDB Atlas connection string |
| `PRPC_ENDPOINT` | Your pNode RPC endpoint (must be publicly accessible) |
| `NEXT_PUBLIC_BASE_URL` | Your Vercel deployment URL (e.g., `https://xanlytics.vercel.app`) |

> **Note**: For production, you need a pNode with a publicly accessible RPC endpoint, or set up a proxy/tunnel that Vercel can reach.

### 4. Cron Jobs (Pro Plan)

The `vercel.json` configures automatic syncing every 5 minutes:

```json
{
  "crons": [{
    "path": "/api/cron/sync",
    "schedule": "*/5 * * * *"
  }]
}
```

> **Note**: Vercel Cron requires a Pro plan. On free tier, you'll need to trigger syncs manually or use an external cron service like [cron-job.org](https://cron-job.org).

### 5. Deploy

Click "Deploy" in Vercel. Your app will be live!

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | Yes | MongoDB Atlas connection string |
| `PRPC_ENDPOINT` | Yes | pNode RPC endpoint URL |
| `NEXT_PUBLIC_BASE_URL` | No | Base URL for API calls (auto-detected on Vercel) |
| `SYNC_INTERVAL_MS` | No | Sync interval in ms (default: 300000 = 5 min) |

## License

MIT
