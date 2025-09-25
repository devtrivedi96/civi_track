#!/bin/bash

# Backup original package.json
mv package.json package.json.backup

# Copy frontend package.json for Netlify
cp frontend-package.json package.json

# Clear npm cache and node_modules
rm -rf node_modules
npm cache clean --force

# Install dependencies
npm install --legacy-peer-deps

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

# Build the application
npm run build

# Restore original package.json
mv package.json.backup package.json