#!/bin/bash

# Script to fix common npm dependency issues, especially on macOS ARM64
# This handles the @rollup/rollup-darwin-arm64 module not found error

echo "🔧 Fixing npm dependencies..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Remove problematic files
echo "🧹 Cleaning up node_modules and lock files..."
rm -rf node_modules
rm -f package-lock.json
rm -f bun.lockb

# Clear npm cache
echo "🗑️  Clearing npm cache..."
npm cache clean --force

# Reinstall dependencies
echo "📦 Reinstalling dependencies..."
npm install

# Check if installation was successful
if [ $? -eq 0 ]; then
    echo "✅ Dependencies fixed successfully!"
    echo "🚀 You can now run 'npm run dev' to start the application."
else
    echo "❌ Installation failed. Please check the error messages above."
    exit 1
fi
