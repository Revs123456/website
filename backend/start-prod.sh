#!/bin/bash
set -e

# Construct DATABASE_URL from individual env vars if not already set
if [ -z "$DATABASE_URL" ]; then
  export DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT:-5432}/${DB_NAME:-postgres}?sslmode=require&pgbouncer=true"
fi

npx prisma migrate deploy

exec node dist/main
