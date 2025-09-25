FROM node:20-alpine

WORKDIR /app

# Install necessary build tools
RUN apk add --no-cache python3 make g++

# Copy package files first for better caching
COPY package*.json ./
COPY server/package*.json ./server/

# Install global dependencies
RUN npm install -g nodemon npm-run-all

# Copy source files
COPY . .

# Install project dependencies and build
RUN npm ci --legacy-peer-deps \
    && cd server && npm ci --legacy-peer-deps \
    && cd .. \
    && npm run build

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose ports
EXPOSE 3000
EXPOSE 5173

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start both services
CMD ["npm", "run", "start:all"]