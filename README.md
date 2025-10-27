# Augov Web App (Next.js)

A minimal Next.js app to search talkers and view their latest speech contributions from MongoDB.

## Setup

1. Install dependencies
2. Set `MONGODB_URI` env var (defaults to mongodb://localhost:27017/local)
3. Run dev server

## Env

Create `.env.local` in this folder:

```
MONGODB_URI=mongodb://localhost:27017/local
```

## Scripts

- `npm run dev` – start dev server on http://localhost:3000
- `npm run build` – build
- `npm run start` – start production server


# TODO

- on speech pages add links to next/previous speech
- find way to add bill status 
  - is the bill active? is it an act?