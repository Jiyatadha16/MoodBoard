#!/bin/bash

# Ambient Moodboard Deployment Script
# This script provides a local preview and deployment instructions

echo "🚀 Ambient Moodboard Deployment Helper"
echo "======================================"

# Check if http-server is available
if ! command -v npx &> /dev/null; then
    echo "❌ npx not found. Please install Node.js to use this script."
    exit 1
fi

echo "📋 Starting local preview server on http://localhost:8080"
echo "   Press Ctrl+C to stop the server"
echo ""

# Start local server
npx http-server -p 8080 -c-1 --cors

echo ""
echo "✅ Local preview complete!"
echo ""
echo "🌐 Deployment Instructions:"
echo "=========================="
echo ""
echo "1. GitHub + Vercel:"
echo "   - Push this code to a GitHub repository"
echo "   - Go to vercel.com and import your GitHub repo"
echo "   - Vercel will auto-detect it as a static site"
echo "   - Deploy!"
echo ""
echo "2. GitHub + Netlify:"
echo "   - Push to GitHub"
echo "   - Go to netlify.com and drag-drop the ambient-moodboard/ folder"
echo "   - Or connect your GitHub repo for continuous deployment"
echo ""
echo "3. Manual FTP:"
echo "   - Upload all files in ambient-moodboard/ to your web server"
echo "   - Ensure the server supports static files"
echo ""
echo "4. GitHub Pages:"
echo "   - Push to GitHub"
echo "   - Go to repository Settings > Pages"
echo "   - Set source to 'Deploy from a branch' and select main/master"
echo "   - The ambient-moodboard/ folder will be served"
echo ""
echo "📝 Notes:"
echo "   - All paths are relative, so it works from any subdirectory"
echo "   - No build step required"
echo "   - Ensure assets are added to assets/ folders before deploying"
