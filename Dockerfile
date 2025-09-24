FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/

# Copy source files
COPY . .

# Install dependencies and build
RUN npm run setup

# Expose ports for both frontend and backend
EXPOSE 3000
EXPOSE $PORT

# Start both services
CMD ["npm", "run", "start:all"]