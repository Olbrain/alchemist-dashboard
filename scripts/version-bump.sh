#!/bin/bash

# Version Bump Helper Script
# Automates the process of bumping version, tagging, and triggering npm publish
#
# Usage:
#   ./scripts/version-bump.sh <version|patch|minor|major>
#
# Examples:
#   ./scripts/version-bump.sh 0.1.7      # Set specific version
#   ./scripts/version-bump.sh patch      # 0.1.6 -> 0.1.7
#   ./scripts/version-bump.sh minor      # 0.1.6 -> 0.2.0
#   ./scripts/version-bump.sh major      # 0.1.6 -> 1.0.0

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if argument provided
if [ -z "$1" ]; then
  echo -e "${RED}Error: Version argument required${NC}"
  echo ""
  echo "Usage: $0 <version|patch|minor|major>"
  echo ""
  echo "Examples:"
  echo "  $0 0.1.7      # Set specific version"
  echo "  $0 patch      # Increment patch version"
  echo "  $0 minor      # Increment minor version"
  echo "  $0 major      # Increment major version"
  exit 1
fi

VERSION_ARG=$1

# Check if we're in a git repository
if ! git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
  echo -e "${RED}Error: Not in a git repository${NC}"
  exit 1
fi

# Check for uncommitted changes
if [[ -n $(git status -s) ]]; then
  echo -e "${YELLOW}Warning: You have uncommitted changes${NC}"
  git status -s
  echo ""
  read -p "Do you want to continue? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Aborted${NC}"
    exit 1
  fi
fi

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo -e "${BLUE}Current version: ${CURRENT_VERSION}${NC}"

# Bump version using npm version
echo -e "${BLUE}Bumping version...${NC}"
if [[ "$VERSION_ARG" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  # Specific version provided
  NEW_VERSION=$VERSION_ARG
  npm version $NEW_VERSION --no-git-tag-version
else
  # Use npm version for patch/minor/major
  NEW_VERSION=$(npm version $VERSION_ARG --no-git-tag-version | sed 's/v//')
fi

echo -e "${GREEN}✓ Version bumped to: ${NEW_VERSION}${NC}"

# Commit the version change
echo -e "${BLUE}Committing version change...${NC}"
git add package.json package-lock.json
git commit -m "Bump version to ${NEW_VERSION}

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

echo -e "${GREEN}✓ Committed version change${NC}"

# Create git tag
TAG_NAME="v${NEW_VERSION}"
echo -e "${BLUE}Creating tag: ${TAG_NAME}${NC}"
git tag -a "$TAG_NAME" -m "Release version ${NEW_VERSION}"
echo -e "${GREEN}✓ Created tag: ${TAG_NAME}${NC}"

# Push changes and tag
echo -e "${BLUE}Pushing to GitHub...${NC}"
git push && git push --tags

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Version ${NEW_VERSION} published!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}GitHub Actions will now:${NC}"
echo "  1. Build the package"
echo "  2. Run tests"
echo "  3. Publish to npm"
echo "  4. Create GitHub Release"
echo ""
echo -e "${BLUE}Monitor progress at:${NC}"
echo "  https://github.com/Olbrain/alchemist-dashboard/actions"
echo ""
echo -e "${BLUE}Once published, install with:${NC}"
echo "  npm install @olbrain/alchemist-dashboard@${NEW_VERSION}"
echo ""
