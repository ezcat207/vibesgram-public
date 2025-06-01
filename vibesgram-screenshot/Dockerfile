# Use the official Playwright image as base
FROM mcr.microsoft.com/playwright:v1.51.1-noble

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY src/ ./src/
COPY tsconfig.json ./

# Create data directory for screenshots
RUN mkdir -p data

# our tsx command needs .env file
RUN touch .env

# Command to run the script
ENTRYPOINT ["npm", "start", "--"]
