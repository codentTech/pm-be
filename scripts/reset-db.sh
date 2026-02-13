#!/bin/bash
# Reset database for Board→Project schema migration.
# Run from backend/ with: ./scripts/reset-db.sh
# Requires DB_NAME, DB_USERNAME, etc. from .env (or set them)

set -e
cd "$(dirname "$0")/.."
source .env 2>/dev/null || true

DB_NAME="${DB_NAME:-trello_clone}"
DB_USER="${DB_USERNAME:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

echo "Dropping database: $DB_NAME"
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS \"$DB_NAME\";"

echo "Creating database: $DB_NAME"
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "CREATE DATABASE \"$DB_NAME\";"

echo "Done. Restart the backend to let TypeORM recreate the schema."
