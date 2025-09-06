#!/bin/bash

# Tag and Deploy script for TxRay
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
VERSION=""
DEPLOY_TYPE=""
PUSH=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -v|--version)
      VERSION="$2"
      shift 2
      ;;
    -t|--type)
      DEPLOY_TYPE="$2"
      shift 2
      ;;
    -p|--push)
      PUSH=true
      shift
      ;;
    -h|--help)
      echo "Usage: $0 [OPTIONS]"
      echo "Options:"
      echo "  -v, --version VERSION   Version number (e.g., 0.0.1)"
      echo "  -t, --type TYPE         Deployment type: production or docker"
      echo "  -p, --push              Push tag to remote repository"
      echo "  -h, --help              Show this help message"
      echo ""
      echo "Examples:"
      echo "  $0 -v 0.0.1 -t production -p  # Deploy v0.0.1-production to Vercel"
      echo "  $0 -v 0.0.1 -t docker -p      # Build Docker images for v0.0.1-docker"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Validate inputs
if [ -z "$VERSION" ]; then
  echo -e "${RED}❌ Version is required. Use -v or --version${NC}"
  exit 1
fi

if [ -z "$DEPLOY_TYPE" ]; then
  echo -e "${RED}❌ Deployment type is required. Use -t or --type${NC}"
  echo -e "${YELLOW}Valid types: production, docker${NC}"
  exit 1
fi

if [ "$DEPLOY_TYPE" != "production" ] && [ "$DEPLOY_TYPE" != "docker" ]; then
  echo -e "${RED}❌ Invalid deployment type: $DEPLOY_TYPE${NC}"
  echo -e "${YELLOW}Valid types: production, docker${NC}"
  exit 1
fi

# Create tag
TAG="v${VERSION}-${DEPLOY_TYPE}"
echo -e "${BLUE}🏷️  Creating tag: ${TAG}${NC}"

# Check if tag already exists
if git tag -l | grep -q "^${TAG}$"; then
  echo -e "${YELLOW}⚠️  Tag ${TAG} already exists${NC}"
  read -p "Do you want to delete and recreate it? (y/N): " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}🗑️  Deleting existing tag...${NC}"
    git tag -d "${TAG}"
    if [ "$PUSH" = true ]; then
      git push origin ":refs/tags/${TAG}" || true
    fi
  else
    echo -e "${YELLOW}Tag operation cancelled${NC}"
    exit 0
  fi
fi

# Create the tag
git tag "${TAG}"

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Tag ${TAG} created successfully${NC}"
else
  echo -e "${RED}❌ Failed to create tag${NC}"
  exit 1
fi

# Push tag if requested
if [ "$PUSH" = true ]; then
  echo -e "${BLUE}🚀 Pushing tag to remote repository...${NC}"
  git push origin "${TAG}"
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Tag ${TAG} pushed successfully${NC}"
  else
    echo -e "${RED}❌ Failed to push tag${NC}"
    exit 1
  fi
else
  echo -e "${YELLOW}💡 Tag created locally. Use -p to push to remote${NC}"
fi

# Show next steps
echo ""
echo -e "${GREEN}🎉 Tag ${TAG} ready!${NC}"
echo ""
if [ "$DEPLOY_TYPE" = "production" ]; then
  echo -e "${BLUE}📋 Next steps:${NC}"
  echo -e "  • GitHub Actions will automatically deploy to Vercel"
  echo -e "  • Monitor deployment at: https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[:/]\([^/]*\/[^/]*\).*/\1/')/actions"
  echo -e "  • Check Vercel dashboard for deployment status"
elif [ "$DEPLOY_TYPE" = "docker" ]; then
  echo -e "${BLUE}📋 Next steps:${NC}"
  echo -e "  • GitHub Actions will automatically build Docker images"
  echo -e "  • Images will be pushed to GitHub Container Registry"
  echo -e "  • Monitor build at: https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[:/]\([^/]*\/[^/]*\).*/\1/')/actions"
fi
echo ""
echo -e "${BLUE}🔍 To view tag:${NC}"
echo -e "  git show ${TAG}"
echo ""
echo -e "${BLUE}🗑️  To delete tag if needed:${NC}"
echo -e "  git tag -d ${TAG}"
if [ "$PUSH" = true ]; then
  echo -e "  git push origin :refs/tags/${TAG}"
fi
