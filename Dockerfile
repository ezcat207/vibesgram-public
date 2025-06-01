FROM node:20-bookworm

RUN apt update && apt install -y openssl

WORKDIR /app

# only skip env validation in build time
ARG SKIP_ENV_VALIDATION=true

# Copy workspace configuration first
COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./

# Copy the Screenshot project
COPY vibesgram-screenshot/package.json ./vibesgram-screenshot/

# Copy the NextJS project
COPY vibesgram/package.json ./vibesgram/
COPY vibesgram/prisma ./vibesgram/prisma
RUN mkdir -p vibesgram/public

# install latest corepack
# https://stackoverflow.com/questions/79411275/after-heroku-restart-pnpm-error-cannot-find-matching-keyid
RUN npm install -g corepack@latest
RUN corepack enable pnpm && pnpm i --frozen-lockfile

COPY vibesgram-screenshot/ ./vibesgram-screenshot/
# Copy the rest of the application
COPY vibesgram/ ./vibesgram/

# use an example env file, some build steps need env files
RUN mv vibesgram/.env.example vibesgram/.env

WORKDIR /app/vibesgram
RUN pnpm run build

# remove example env file
RUN rm .env && touch .env

EXPOSE 3000

CMD ["pnpm", "run", "start"]
