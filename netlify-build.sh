#!/bin/bash
set -e # Exit on error
set -x # Print commands for debugging

echo "Starting Netlify build process..."

# Backup original package.json
mv package.json package.json.backup

# Copy frontend package.json for Netlify
cp frontend-package.json package.json

echo "Setting up Node environment..."
export NODE_OPTIONS="--max-old-space-size=4096"

# Clear npm cache and node_modules
rm -rf node_modules dist
npm cache clean --force

echo "Installing dependencies..."
# Install dependencies with verbose logging
npm install --legacy-peer-deps --verbose

echo "Setting up configuration files..."

# Create index.html if it doesn't exist
if [ ! -f "index.html" ]; then
  echo "Creating index.html..."
  echo '<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CiviTrack</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>' > index.html
fi

# Copy PostCSS and Tailwind configs
echo "module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}" > postcss.config.js

echo "/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
}" > tailwind.config.js

# Create minimal vite config if it doesn't exist
echo "import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});" > vite.config.js

echo "Starting build process..."
# Build the application with detailed logging
npm run build

echo "Checking build output..."
ls -la dist/

# Restore original package.json
mv package.json.backup package.json

echo "Build process completed."