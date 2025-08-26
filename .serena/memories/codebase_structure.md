# Codebase Structure

## Root Directory Structure
```
vibesgram-public/
├── vibesgram/              # Main Next.js application
├── vibesgram-cf-worker/    # Cloudflare Worker for static hosting
├── vibesgram-screenshot/   # Screenshot service using Playwright
├── docs/                   # Documentation
├── .serena/               # Serena configuration
├── pnpm-workspace.yaml    # pnpm workspace configuration
├── pnpm-lock.yaml         # Lock file
├── Dockerfile             # Docker configuration
├── bump-version.sh        # Version bump script
└── README.md              # Project README
```

## Main Application Structure (vibesgram/)
```
src/
├── app/                   # Next.js App Router
│   ├── agent/            # Browser coding agent (unused legacy)
│   ├── api/              # API routes
│   ├── onboarding/       # User onboarding flow
│   ├── upload/           # File upload pages
│   ├── u/                # User profile pages
│   ├── a/                # Application pages
│   ├── privacy-policy/   # Legal pages
│   ├── tos/              # Terms of service
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page
├── components/           # Reusable React components
│   └── ui/              # shadcn/ui components (auto-generated)
├── hooks/               # Custom React hooks
├── lib/                 # Utility functions and configurations
├── server/              # Server-side code
│   ├── auth.ts          # NextAuth configuration
│   └── db.ts            # Database connection
├── styles/              # Global CSS and Tailwind
│   └── globals.css      # Global styles
├── trpc/                # tRPC setup
│   ├── react.tsx        # Client-side tRPC
│   └── server.ts        # Server-side tRPC
├── middleware.ts        # Next.js middleware
└── env.js              # Environment validation
```

## Configuration Files
```
vibesgram/
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
├── .eslintrc.cjs        # ESLint configuration
├── prettier.config.js   # Prettier configuration
├── tailwind.config.ts   # Tailwind CSS configuration
├── next.config.js       # Next.js configuration
├── postcss.config.js    # PostCSS configuration
├── components.json      # shadcn/ui configuration
├── .env.example         # Environment variables template
└── prisma/              # Database schema and migrations
    └── schema.prisma    # Prisma schema
```

## Key Features by Directory
- **app/agent/**: Browser automation agent for coding (legacy, not deployed)
- **app/api/**: API endpoints including preview creation, authentication
- **app/onboarding/**: User registration and setup flow  
- **server/**: Authentication, database connections, tRPC procedures
- **components/**: Reusable UI components following shadcn/ui patterns
- **trpc/**: Type-safe API layer with React Query integration
- **prisma/**: Database schema, migrations, and seeding