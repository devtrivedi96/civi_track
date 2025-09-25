#!/bin/bash

# Copy frontend package.json for Netlify
cp frontend-package.json package.json

# Install dependencies
npm install

# Build the application
npm run build