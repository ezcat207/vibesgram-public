# Code Style and Conventions

## TypeScript Configuration
- **Strict Mode**: Enabled with `noUncheckedIndexedAccess`
- **Target**: ES2022
- **Module System**: ESNext with bundler resolution
- **Path Aliases**: `@/*` maps to `./src/*`
- **JSX**: Preserve (Next.js handles compilation)

## ESLint Rules
- Extends Next.js core web vitals and TypeScript recommended
- **Import Style**: Prefer type-only imports with inline syntax
- **Unused Variables**: Warning for variables not prefixed with `_`
- **Consistent Type Imports**: Enforced with inline style preference
- **Array Type**: Flexible (both `T[]` and `Array<T>` allowed)
- **Nullish Coalescing**: Not enforced
- **Ignored Paths**: 
  - `src/components/ui/**/*` (shadcn/ui components)
  - `src/**/__test__/**/*` and `*.test.ts` files

## Prettier Configuration
- Uses Tailwind CSS plugin for class sorting
- Default Prettier settings otherwise

## File Organization
```
src/
├── app/           # Next.js App Router pages and layouts
├── components/    # Reusable React components
├── hooks/         # Custom React hooks
├── lib/           # Utility functions and configurations
├── server/        # Server-side code (auth, database)
├── styles/        # Global CSS and Tailwind
└── trpc/          # tRPC client and server setup
```

## Naming Conventions
- **Components**: PascalCase (e.g., `UserProfile.tsx`)
- **Files**: kebab-case for pages, camelCase for utilities
- **Variables/Functions**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **Types/Interfaces**: PascalCase

## Import Organization
- External packages first
- Internal imports using `@/` path alias
- Type imports marked with `type` keyword inline