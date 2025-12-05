#!/bin/bash

# Script tự động deploy lên Vercel
# Sử dụng: ./deploy.sh

echo "🚀 Bắt đầu deploy lên Vercel..."

# Kiểm tra xem đã cài Vercel CLI chưa
if ! command -v vercel &> /dev/null
then
    echo "❌ Vercel CLI chưa được cài đặt"
    echo "📦 Đang cài đặt Vercel CLI..."
    npm install -g vercel
fi

# Kiểm tra xem đã login chưa
echo "🔐 Kiểm tra đăng nhập Vercel..."
vercel whoami || vercel login

# Build test trước khi deploy
echo "🔨 Build test..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build thất bại! Vui lòng kiểm tra lỗi."
    exit 1
fi

echo "✅ Build thành công!"

# Deploy lên Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

echo "✅ Deploy hoàn tất!"
echo "🌐 Kiểm tra URL của bạn trên Vercel dashboard"
