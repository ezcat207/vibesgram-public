# Tech Stack

## Main Application (vibesgram/)
- **Framework**: Next.js 15 with TypeScript 5.5
- **UI**: React 18.3, Tailwind CSS 3.4, Radix UI components
- **Styling**: Tailwind CSS with shadcn/ui components, Geist font
- **State Management**: tRPC with React Query
- **Authentication**: NextAuth.js 5.0 beta with Prisma adapter
- **Database**: Prisma ORM with PostgreSQL
- **File Upload**: AWS S3 SDK
- **AI Integration**: Vercel AI SDK with OpenAI
- **Rate Limiting**: Upstash Redis
- **Payments**: Stripe
- **Form Handling**: React Hook Form with Zod validation
- **Animations**: Framer Motion
- **Drag & Drop**: DND Kit
- **Live Code**: React Live for code execution
- **Icons**: Lucide React

## Cloudflare Worker (vibesgram-cf-worker/)
- **Runtime**: Cloudflare Workers with TypeScript
- **Testing**: Vitest with Cloudflare Workers pool
- **Build Tool**: Wrangler

## Screenshot Service (vibesgram-screenshot/)
- **Runtime**: Node.js with TypeScript
- **Browser Automation**: Playwright
- **Validation**: Zod
- **Execution**: tsx for TypeScript execution

## Development Tools
- **Package Manager**: pnpm 9.10
- **Linting**: ESLint with TypeScript rules
- **Formatting**: Prettier with Tailwind plugin
- **Type Checking**: TypeScript strict mode
- **Testing**: Vitest (for CF Worker)