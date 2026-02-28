#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "Setting up backend environment..."
cd server

if [ ! -d ".venv" ]; then
    python3 -m venv .venv
fi

source .venv/bin/activate
pip install -q --upgrade pip
pip install -q -r requirements.txt

echo "Removing old database..."
rm -f database/game_database.db

echo "Creating database..."
python3 -m database.createDatabase

echo "Adding default questions..."
python3 -m utils.addDefaultQuestions

echo "Starting backend server..."
python3 main.py &
SERVER_PID=$!

cd ..

echo "Starting frontend client..."
cd client

if [ ! -d "node_modules" ]; then
    npm install
fi

npm run dev &
CLIENT_PID=$!

cd ..

echo ""
echo "Application running:"
echo "  Frontend: http://localhost:5173/"
echo "  Backend:  http://localhost:8000/"
echo ""
echo "Press Ctrl+C to stop both servers"

cleanup() {
    echo ""
    echo "Shutting down..."
    kill $SERVER_PID 2>/dev/null
    kill $CLIENT_PID 2>/dev/null
    deactivate 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

wait
