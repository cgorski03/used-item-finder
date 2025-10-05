```mermaid
golf-polo-finder/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx           # Dashboard
│   │   └── search/
│   │       └── [id]/
│   │           └── page.tsx   # Search detail
│   ├── components/
│   │   ├── search/
│   │   │   ├── SearchCard.tsx
│   │   │   └── CreateSearchForm.tsx
│   │   └── items/
│   │       ├── ItemCard.tsx
│   │       ├── ItemGrid.tsx
│   │       └── AnalysisBadge.tsx
│   ├── server/
│   │   ├── db/
│   │   │   ├── schema.ts      # Drizzle schema
│   │   │   └── index.ts       # DB connection
│   │   ├── routers/
│   │   │   ├── search.ts      # Search CRUD
│   │   │   ├── items.ts       # Item queries
│   │   │   └── platforms.ts   # Platform config
│   │   ├── services/
│   │   │   ├── ebay.ts
│   │   │   ├── vision.ts
│   │   │   └── scraper.ts     # Future: other platforms
│   │   └── trpc.ts            # tRPC setup
│   └── trpc/
│       ├── client.ts          # Client setup
│       └── react.tsx          # React hooks
├── workers/
│   └── poller/
│       └── src/
│           └── index.ts       # Cloudflare Worker
└── drizzle/
    └── migrations/
```
