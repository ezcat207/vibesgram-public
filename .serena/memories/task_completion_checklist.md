# Task Completion Checklist

When completing any coding task in this project, follow these steps:

## Code Quality Checks

### Main Application (vibesgram/)
1. **Type Checking**: `pnpm typecheck`
2. **Linting**: `pnpm lint` (use `pnpm lint:fix` for auto-fixable issues)
3. **Formatting**: `pnpm format:check` (use `pnpm format:write` if needed)
4. **Combined Check**: `pnpm check` (runs both lint and typecheck)

### Cloudflare Worker (vibesgram-cf-worker/)
1. **Testing**: `pnpm test` (run Vitest tests)
2. **Type Generation**: `pnpm cf-typegen` (if worker types changed)

## Database Changes
If you made database schema changes:
1. **Generate Migration**: `pnpm db:generate`
2. **Apply Migration**: `pnpm db:migrate` (for production) or `pnpm db:push` (for development)

## Build Verification
1. **Build Success**: `pnpm build` (verify production build works)
2. **Preview Test**: `pnpm preview` (test production build locally)

## Git Workflow
1. **Check Status**: `git status`
2. **Review Changes**: `git diff`
3. **Stage Changes**: `git add .`
4. **Commit**: `git commit -m "descriptive message"`

## Before Deployment
1. All tests passing
2. No TypeScript errors
3. No ESLint errors
4. Code properly formatted
5. Database migrations applied
6. Build succeeds without warnings

## Notes
- The project uses pnpm workspaces, so run commands from the appropriate package directory
- ESLint ignores `src/components/ui/**/*` (shadcn/ui components) - these should not be modified
- Use the `@/` path alias for internal imports
- Follow the established naming conventions and file organization patterns