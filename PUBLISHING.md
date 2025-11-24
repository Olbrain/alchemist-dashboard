# Publishing Guide

This document explains how to publish new versions of `@olbrain/alchemist-dashboard` to npm.

## 🔐 One-Time Setup

Before you can publish, you need to configure npm authentication in GitHub:

### 1. Create npm Access Token

1. Log in to npm: https://www.npmjs.com/login
2. Go to Access Tokens: https://www.npmjs.com/settings/nishagh/tokens
3. Click **"Generate New Token"** → **"Classic Token"**
4. Select token type: **"Automation"**
5. Copy the token (starts with `npm_...`) - you won't see it again!

### 2. Add Token to GitHub Repository

1. Go to repository settings: https://github.com/Olbrain/alchemist-dashboard/settings/secrets/actions
2. Click **"New repository secret"**
3. Name: `NPM_TOKEN`
4. Value: Paste your npm token from step 1
5. Click **"Add secret"**

✅ **Setup complete!** You only need to do this once.

---

## 📦 Publishing a New Version

### Quick Method (Recommended)

Use the version bump helper script:

```bash
# Bump patch version (0.1.6 → 0.1.7)
./scripts/version-bump.sh patch

# Bump minor version (0.1.6 → 0.2.0)
./scripts/version-bump.sh minor

# Bump major version (0.1.6 → 1.0.0)
./scripts/version-bump.sh major

# Set specific version
./scripts/version-bump.sh 1.2.3
```

The script will:
1. ✅ Update `package.json` version
2. ✅ Commit the change
3. ✅ Create a git tag (e.g., `v0.1.7`)
4. ✅ Push to GitHub
5. ✅ Trigger automated publishing

### Manual Method

If you prefer to do it manually:

```bash
# 1. Update version in package.json
npm version patch  # or minor, major, or specific version

# 2. Commit the change
git add package.json package-lock.json
git commit -m "Bump version to 0.1.7"

# 3. Create and push tag
git tag v0.1.7
git push && git push --tags
```

---

## 🤖 What Happens Automatically

When you push a version tag (e.g., `v0.1.7`), GitHub Actions will:

1. **Run Tests** - Ensures code quality
2. **Build Package** - Runs `npm run build:prod`
3. **Verify Version** - Ensures tag matches package.json
4. **Publish to npm** - Publishes to https://npmjs.com
5. **Create GitHub Release** - Generates changelog and creates release

### Monitor Progress

Watch the automation at:
- **GitHub Actions**: https://github.com/Olbrain/alchemist-dashboard/actions
- **npm Package**: https://www.npmjs.com/package/@olbrain/alchemist-dashboard
- **Releases**: https://github.com/Olbrain/alchemist-dashboard/releases

---

## 🔄 Workflow Details

### Publish Workflow (`.github/workflows/publish.yml`)

**Trigger**: Push version tags (`v*`)

**Steps**:
1. Checkout code
2. Setup Node.js 18
3. Install dependencies (`npm ci`)
4. Run build (`npm run build:prod`)
5. Run tests
6. Publish to npm with provenance
7. Generate changelog
8. Create GitHub Release

### Test Workflow (`.github/workflows/test.yml`)

**Trigger**: Pull requests and pushes to main

**Steps**:
1. Run tests on Node 18 and 20
2. Build package
3. Verify build output

---

## 📋 Pre-Release Checklist

Before publishing a new version:

- [ ] All tests pass locally: `npm test`
- [ ] Build succeeds: `npm run build:prod`
- [ ] Update README or docs if needed
- [ ] Review CHANGELOG or commit messages
- [ ] Commit all changes
- [ ] Decide version bump type (patch/minor/major)

---

## 🐛 Troubleshooting

### "Error: You must be logged in to publish packages"

- Make sure you've added `NPM_TOKEN` to GitHub Secrets
- Verify token is valid and has "Automation" permissions
- Check token hasn't expired

### "Error: package.json version doesn't match tag version"

- The version in `package.json` must match the git tag
- If tag is `v0.1.7`, package.json must have `"version": "0.1.7"`
- Use the `version-bump.sh` script to avoid this issue

### "Error: Cannot publish over the previously published versions"

- You're trying to publish a version that already exists
- Bump to a new version number

### Publish workflow didn't run

- Check that you pushed the tag: `git push --tags`
- Verify tag format starts with `v` (e.g., `v0.1.7`, not `0.1.7`)
- Check GitHub Actions is enabled in repository settings

---

## 📚 Version Numbering Guide

Follow [Semantic Versioning](https://semver.org/):

- **MAJOR** (1.0.0 → 2.0.0): Breaking changes
- **MINOR** (1.0.0 → 1.1.0): New features, backwards compatible
- **PATCH** (1.0.0 → 1.0.1): Bug fixes, backwards compatible

### Examples:

```bash
# Bug fix: 0.1.6 → 0.1.7
./scripts/version-bump.sh patch

# New feature: 0.1.7 → 0.2.0
./scripts/version-bump.sh minor

# Breaking change: 0.2.0 → 1.0.0
./scripts/version-bump.sh major
```

---

## 🎯 Quick Reference

| Task | Command |
|------|---------|
| Bump patch version | `./scripts/version-bump.sh patch` |
| Bump minor version | `./scripts/version-bump.sh minor` |
| Bump major version | `./scripts/version-bump.sh major` |
| Set specific version | `./scripts/version-bump.sh 1.2.3` |
| Check current version | `npm version` |
| View published versions | `npm view @olbrain/alchemist-dashboard versions` |
| View latest version | `npm view @olbrain/alchemist-dashboard version` |

---

## 📧 Support

If you encounter issues:

1. Check [GitHub Actions logs](https://github.com/Olbrain/alchemist-dashboard/actions)
2. Review this guide
3. Check npm token permissions
4. Contact repository maintainers

---

**Happy Publishing! 🚀**
