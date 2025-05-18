#!/bin/bash

# Exit on any error
set -e

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Check required environment variables
if [ -z "$D_ID_API_KEY" ]; then
  echo "Error: D_ID_API_KEY environment variable is not set"
  exit 1
fi

# Build and push Docker images
echo "Building and deploying video generation service..."
docker-compose build
docker-compose up -d

# Wait for services to be ready
echo "Waiting for services to be ready..."
sleep 10

# Check service health
echo "Checking service health..."
if curl -f http://localhost:3000/health; then
  echo "Video generation service is healthy"
else
  echo "Error: Video generation service is not healthy"
  docker-compose logs
  exit 1
fi

echo "Deployment completed successfully" 