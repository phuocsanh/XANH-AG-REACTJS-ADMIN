#!/bin/bash

# Script tự động set tất cả environment variables lên Vercel
# Sử dụng: ./set-vercel-env.sh

echo "🔧 Setting up Vercel Environment Variables..."

# API URL
echo "Setting VITE_API_URL..."
echo "https://xanh-ag-server.onrender.com" | vercel env add VITE_API_URL production --force

# Firebase Configuration
echo "Setting Firebase variables..."
echo "AIzaSyAGMx-HdOewyUD5uNHp40vF04rkfHvRr8g" | vercel env add VITE_FIREBASE_API_KEY production --force
echo "xanh-ag.firebaseapp.com" | vercel env add VITE_FIREBASE_AUTH_DOMAIN production --force
echo "xanh-ag" | vercel env add VITE_FIREBASE_PROJECT_ID production --force
echo "xanh-ag.firebasestorage.app" | vercel env add VITE_FIREBASE_STORAGE_BUCKET production --force
echo "694980744718" | vercel env add VITE_FIREBASE_MESSAGING_SENDER_ID production --force
echo "1:694980744718:web:6dcd46b6d0414e26ba4e5f" | vercel env add VITE_FIREBASE_APP_ID production --force
echo "G-RN13VJVJZB" | vercel env add VITE_FIREBASE_MEASUREMENT_ID production --force
echo "BJl3rSMvHJ_zrrcwdRZ-1Q7YPcr3gSDTy6H3duLWIFVXAmv6YLjBt4LEgRpgSsEIZ-IWdQX9TrOAF7OH-ffyy-s" | vercel env add VITE_FIREBASE_VAPID_KEY production --force

# Gemini AI Model
echo "Setting Gemini model..."
echo "gemini-2.5-flash" | vercel env add VITE_GEMINI_MODEL production --force

echo "✅ All environment variables have been set!"
echo "🚀 Now redeploy with: vercel --prod"
