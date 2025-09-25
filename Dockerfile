FROM node:20-alpine

WORKDIR /app

# Install necessary build tools
RUN apk add --no-cache python3 make g++

# Copy package files first for better caching
COPY package*.json ./
COPY server/package*.json ./server/

# Install global dependencies
RUN npm install -g nodemon npm-run-all typescript vite

# Copy source files
COPY . .

# Set build-time environment variables
ENV VITE_FIREBASE_API_KEY=AIzaSyCh0LnJSHAhJZkr1RM3hNnJHPm43I4q0p8
ENV VITE_FIREBASE_AUTH_DOMAIN=civic-issue-sih-bac7e.firebaseapp.com
ENV VITE_FIREBASE_PROJECT_ID=civic-issue-sih-bac7e
ENV VITE_FIREBASE_STORAGE_BUCKET=civic-issue-sih-bac7e.firebasestorage.app
ENV VITE_FIREBASE_MESSAGING_SENDER_ID=973217616582
ENV VITE_FIREBASE_APP_ID=1:973217616582:web:34bbdbdcf8e99468a13dc7
ENV VITE_FIREBASE_MEASUREMENT_ID=G-ZN30BENWZ9
ENV VITE_API_URL=http://localhost:3000

# Set runtime environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY
ENV VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN
ENV VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID
ENV VITE_FIREBASE_STORAGE_BUCKET=$VITE_FIREBASE_STORAGE_BUCKET
ENV VITE_FIREBASE_MESSAGING_SENDER_ID=$VITE_FIREBASE_MESSAGING_SENDER_ID
ENV VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID
ENV VITE_FIREBASE_MEASUREMENT_ID=$VITE_FIREBASE_MEASUREMENT_ID
ENV VITE_API_URL=$VITE_API_URL

# Install dependencies including dev dependencies
RUN npm ci --include=dev --legacy-peer-deps && \
    npx vite build

# Install server dependencies
WORKDIR /app/server
RUN npm ci --legacy-peer-deps

# Copy the built frontend files to the correct location
WORKDIR /app
RUN cp -r dist server/

# Switch to server directory
WORKDIR /app/server

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start server only
CMD ["node", "index.js"]