#!/usr/bin/env bash
set -e

IMAGE_NAME="billing-app"
TAG="latest"
CONTAINER_NAME="billing-app-container"
HOST_PORT="3001" # Host port to map to container's exposed port
CONTAINER_PORT="3001" # Port exposed by the backend server in the Dockerfile

# Check if a container with the same name is already running
if [ "$(sudo docker ps -q -f name=^/${CONTAINER_NAME}$)" ]; then
    echo "Stopping existing container named $CONTAINER_NAME..."
    sudo docker stop "$CONTAINER_NAME"
fi

# Check if a container with the same name exists (even if stopped)
if [ "$(sudo docker ps -aq -f name=^/${CONTAINER_NAME}$)" ]; then
    echo "Removing existing container named $CONTAINER_NAME..."
    sudo docker rm "$CONTAINER_NAME"
fi

echo "Running Docker container $IMAGE_NAME:$TAG..."
echo "Access the application at http://localhost:$HOST_PORT"

sudo docker run -d \
    --name "$CONTAINER_NAME" \
    -p "$HOST_PORT:$CONTAINER_PORT" \
    -e "NODE_ENV=production" \
    -e "PORT=${CONTAINER_PORT}" \
    -e "API_TOKEN=your-secret-api-token" \
    "$IMAGE_NAME:$TAG"

echo "Container $CONTAINER_NAME started."
echo "To view logs: sudo docker logs -f $CONTAINER_NAME"
echo "To stop container: sudo docker stop $CONTAINER_NAME"
