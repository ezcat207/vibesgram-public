# Suggested Commands

## Main Application (vibesgram/)

### Development
```bash
cd vibesgram
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm preview      # Build and start production server
```

### Code Quality
```bash
pnpm lint         # Run ESLint
pnpm lint:fix     # Run ESLint with auto-fix
pnpm typecheck    # Run TypeScript type checking
pnpm check        # Run both lint and typecheck
pnpm format:check # Check Prettier formatting
pnpm format:write # Apply Prettier formatting
```

### Database
```bash
pnpm db:generate  # Generate Prisma client and run migrations
pnpm db:migrate   # Deploy migrations to database
pnpm db:push      # Push schema changes directly to database
pnpm db:studio    # Open Prisma Studio GUI
```

## Cloudflare Worker (vibesgram-cf-worker/)

### Development & Deployment
```bash
cd vibesgram-cf-worker
pnpm dev          # Start local development server
pnpm deploy       # Deploy to staging environment
pnpm deploy:prod  # Deploy to production environment
pnpm test         # Run Vitest tests
pnpm cf-typegen   # Generate Cloudflare Worker types
```

## Screenshot Service (vibesgram-screenshot/)

### Execution
```bash
cd vibesgram-screenshot
pnpm start        # Start screenshot service with .env file
```

## System Commands (macOS/Darwin)
```bash
# File operations
ls -la            # List files with details
find . -name      # Find files by name
grep -r           # Search in files recursively
git status        # Check git status
git log --oneline # View commit history
```

## Root Level Commands
```bash
# Install all dependencies
pnpm install

# Run version bump script
./bump-version.sh

# Docker build (if needed)
docker build -t vibesgram .
```