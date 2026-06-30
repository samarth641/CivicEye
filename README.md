# CivicEye

A **map-first** civic monitoring platform for Nagpur, India, powered by **CivicEye**. The map fills the screen; overlays provide reporting, filters, and legend.

## Features

- **Full-screen interactive map** (Google Maps) centered on Nagpur
- **Report types**: Potholes, speed breakers, road damage, other
- **Map controls**: Zoom in/out, roadmap / satellite / hybrid, traffic layer
- **Filters**: Toggle visibility of report types, news, traffic
- **Report dialog**: Submit new issues (location = current map center)
- **Marker clustering** for many reports
- **Auth**: NextAuth with Google and email (credentials demo)
- **API**: REST API for reports; optional Cloudinary upload for images

## Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, TailwindCSS, ShadCN-style UI, Zustand, Framer Motion
- **Maps**: Google Maps JavaScript API, MarkerClusterer
- **Backend**: Next.js API routes, PostgreSQL, Prisma
- **Auth**: NextAuth.js

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local` and set:

```env
# Required for DB
DATABASE_URL="postgresql://..."

# Required for map (create a Map ID in Google Cloud for Advanced Markers)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your-key"
NEXT_PUBLIC_GOOGLE_MAP_ID="your-map-id"   # or leave as DEMO_MAP_ID for dev

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="random-secret"
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Optional: report images
NEXT_PUBLIC_CLOUDINARY_UPLOAD_URL="https://api.cloudinary.com/v1_1/YOUR_CLOUD/image/upload"
CLOUDINARY_UPLOAD_PRESET=""
```

### 3. Database

```bash
npx prisma generate
npx prisma db push
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Google Cloud setup

1. Create a project and enable:
   - Maps JavaScript API
   - Places API
   - Geocoding API
2. Create an API key and restrict it (HTTP referrers for your domains).
3. For **Advanced Markers** (used for report pins), create a **Map ID** in Google Cloud Console (Map Management) and set `NEXT_PUBLIC_GOOGLE_MAP_ID`. Without a custom Map ID, the map may fall back to a limited style.

## Deployment

- **Frontend**: Vercel (`vercel`)
- **Database**: Railway, Supabase, or any PostgreSQL host
- Set all env vars in the deployment dashboard.

## Project structure

```
src/
  app/           # App Router pages and API routes
  components/    # Map, overlays (Header, ReportDialog, etc.), UI
  lib/           # Prisma, auth, store, utils
  types/         # Shared TypeScript types
prisma/
  schema.prisma  # User, Report, Session, etc.
```

## License

MIT
