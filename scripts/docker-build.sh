#!/bin/bash

# Docker build script for TxRay monorepo
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
TAG="latest"
PUSH=false
PLATFORM="linux/amd64,linux/arm64"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -t|--tag)
      TAG="$2"
      shift 2
      ;;
    -p|--push)
      PUSH=true
      shift
      ;;
    --platform)
      PLATFORM="$2"
      shift 2
      ;;
    -h|--help)
      echo "Usage: $0 [OPTIONS]"
      echo "Options:"
      echo "  -t, --tag TAG       Docker tag (default: latest)"
      echo "  -p, --push          Push images to registry"
      echo "  --platform PLATFORM Target platform (default: linux/amd64,linux/arm64)"
      echo "  -h, --help          Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

echo -e "${BLUE}🐳 Building Docker images for TxRay${NC}"
echo -e "${YELLOW}Tag: ${TAG}${NC}"
echo -e "${YELLOW}Platform: ${PLATFORM}${NC}"
echo -e "${YELLOW}Push: ${PUSH}${NC}"
echo ""

# Build UI package first
echo -e "${BLUE}📦 Building UI package...${NC}"
docker build \
  --platform ${PLATFORM} \
  -f docker/Dockerfile.ui \
  -t txray/ui:${TAG} \
  .

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ UI package built successfully${NC}"
else
  echo -e "${RED}❌ Failed to build UI package${NC}"
  exit 1
fi

# Build API
echo -e "${BLUE}🔧 Building API...${NC}"
docker build \
  --platform ${PLATFORM} \
  -f docker/Dockerfile.api \
  -t txray/api:${TAG} \
  .

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ API built successfully${NC}"
else
  echo -e "${RED}❌ Failed to build API${NC}"
  exit 1
fi

# Build Web app
echo -e "${BLUE}🌐 Building Web app...${NC}"
docker build \
  --platform ${PLATFORM} \
  -f docker/Dockerfile.web \
  -t txray/web:${TAG} \
  .

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Web app built successfully${NC}"
else
  echo -e "${RED}❌ Failed to build Web app${NC}"
  exit 1
fi

# Push images if requested
if [ "$PUSH" = true ]; then
  echo -e "${BLUE}🚀 Pushing images to registry...${NC}"
  
  # You can customize the registry here
  REGISTRY="your-registry.com"
  
  docker tag txray/ui:${TAG} ${REGISTRY}/txray/ui:${TAG}
  docker tag txray/api:${TAG} ${REGISTRY}/txray/api:${TAG}
  docker tag txray/web:${TAG} ${REGISTRY}/txray/web:${TAG}
  
  docker push ${REGISTRY}/txray/ui:${TAG}
  docker push ${REGISTRY}/txray/api:${TAG}
  docker push ${REGISTRY}/txray/web:${TAG}
  
  echo -e "${GREEN}✅ Images pushed successfully${NC}"
fi

echo ""
echo -e "${GREEN}🎉 All Docker images built successfully!${NC}"
echo ""
echo -e "${BLUE}Available images:${NC}"
echo -e "  ${YELLOW}txray/ui:${TAG}${NC}"
echo -e "  ${YELLOW}txray/api:${TAG}${NC}"
echo -e "  ${YELLOW}txray/web:${TAG}${NC}"
echo ""
echo -e "${BLUE}To run with Docker Compose:${NC}"
echo -e "  ${YELLOW}docker-compose up${NC}"
echo ""
echo -e "${BLUE}To run development environment:${NC}"
echo -e "  ${YELLOW}docker-compose -f docker-compose.dev.yml up${NC}"
