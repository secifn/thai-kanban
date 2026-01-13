#!/bin/sh
set -e

echo "🔧 Initializing Thai Kanban Server..."

# Ensure data directory exists
mkdir -p /app/data

# Check if database exists, if not create it
if [ ! -f /app/data/thai-kanban.db ]; then
    echo "📦 Creating new database..."
    # Create empty SQLite database
    touch /app/data/thai-kanban.db
fi

# Run database migrations/push
echo "📦 Setting up database schema..."
npx prisma db push --skip-generate 2>&1 || {
    echo "⚠️ Prisma db push failed, trying alternative method..."
    # Alternative: just start the server and let Prisma handle it
    echo "🚀 Starting server anyway..."
}

echo "🚀 Starting server..."
exec node dist/index.js
