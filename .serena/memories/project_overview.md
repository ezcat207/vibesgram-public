# Vibesgram Project Overview

## Project Purpose
Vibesgram is an AI coding sharing platform that was deployed to Vibesgram.com. It's a monorepo containing three main packages:

1. **vibesgram** - Main Next.js web application
2. **vibesgram-cf-worker** - Cloudflare Worker for static website hosting
3. **vibesgram-screenshot** - Screenshot service using Playwright

## Key Features
- AI Coding sharing platform
- Static website hosting on Cloudflare with worker-injected pill-shaped component
- Browser agent for coding (in vibesgram/src/app/agent - not deployed but functional)
- Preview creation API supporting HTML & files input with 7-day expiry
- User authentication and onboarding system
- Screenshot functionality (migrated to Browserless.io)

## Architecture
The project implements a full-stack web application with:
- Frontend: Next.js with React, TypeScript, Tailwind CSS
- Backend: tRPC API, Prisma ORM, NextAuth.js
- Database: PostgreSQL (via Prisma)
- Deployment: Cloudflare Workers for static hosting
- File Storage: AWS S3 integration
- Rate Limiting: Upstash Redis
- Payments: Stripe integration
- Analytics: Google Analytics

## Recent Changes
- Updated global color scheme to black and orange
- Implemented preview creation API with HTML & files input support
- Migrated screenshot functionality to Browserless.io service
- Hid screenshot button due to service issues