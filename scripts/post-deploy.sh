#!/bin/bash

echo "Running post-deployment tasks..."

# Run database migrations
echo "Running database migrations..."
npx prisma migrate deploy

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Seed database with initial data (optional)
# echo "Seeding database..."
# npx prisma db seed

echo "Post-deployment tasks completed!"