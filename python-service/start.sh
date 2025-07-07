#!/bin/bash

# Start script for Railway deployment
# This ensures the PORT environment variable is properly handled

# Set default port if not provided
PORT=${PORT:-8000}

echo "Starting Document Chunking Service on port $PORT"

# Start the service with the PORT environment variable
exec uvicorn api_service:app --host 0.0.0.0 --port $PORT --workers 1
