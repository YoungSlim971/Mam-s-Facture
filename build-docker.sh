#!/usr/bin/env bash
set -e

IMAGE_NAME="billing-app"
TAG="latest"
TARGET_ARCH=$(uname -m) # e.g., arm64 or x86_64

# Convert to Docker platform string: linux/arm64 or linux/amd64
if [[ "$TARGET_ARCH" == "arm64" ]]; then
  PLATFORM="linux/arm64"
elif [[ "$TARGET_ARCH" == "x86_64" ]]; then
  PLATFORM="linux/amd64"
else
  echo "Unsupported architecture: $TARGET_ARCH"
  exit 1
fi

echo "Building Docker image $IMAGE_NAME:$TAG for platform $PLATFORM..."

# Ensure Docker buildx is available and a builder is ready (usually default)
# docker buildx create --use # Uncomment if you need to create a new builder

sudo docker buildx build --platform "$PLATFORM" -t "$IMAGE_NAME:$TAG" -f Dockerfile . --load

echo ""
echo "Docker image $IMAGE_NAME:$TAG built successfully for $PLATFORM."
echo "To run the image: ./run-docker.sh"
