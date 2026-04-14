# venum — Deploy Checklist

## What's already done (in code)

- [x] `package.json` — name, version, exports, keywords, license, homepage, bugs, repository
- [x] `tsconfig.json` — strict, declaration, sourceMap
- [x] `README.md` — badges (npm version, bundle size, license, TypeScript strict, zero deps, downloads), star history chart, full docs
- [x] `.npmignore` — only `lib/`, `README.md`, `LICENSE`, `package.json` get published
- [x] `LICENSE` — MIT
- [x] `prepublishOnly` script — runs tests + typecheck + build before every publish
- [x] `np` added as devDependency for safe publishing
- [x] Verified: `npm pack --dry-run` = 7 files, 4.8kB
- [x] Verified: `require('venum')` works correctly from a consumer project
- [x] Verified: TypeScript strict type-checking works from a consumer project

## What YOU need to do

### Step 1: Create GitHub repo (browser)

1. Go to https://github.com/new
2. Repository name: `venum`
3. Description: `Tiny tagged unions for TypeScript. Two functions, zero dependencies, full type inference.`
4. Public
5. DON'T add README/LICENSE/gitignore (you already have them)
6. Create repository

### Step 2: Push to GitHub (terminal)

```bash
cd venum
git init
git add .
git commit -m "v1.0.0 — initial release"
git branch -M main
git remote add origin git@github.com:FrancoisVongue/venum.git
git push -u origin main
```

### Step 3: Add GitHub repo topics (browser)

Go to your repo → gear icon next to "About" → add topics:
`typescript`, `tagged-union`, `pattern-matching`, `enum`, `functional-programming`, `discriminated-union`

### Step 4: Publish to npm (terminal)

```bash
cd venum
npm install        # install np if not yet
npm login          # if not logged in
npx np             # interactive publish — picks version, runs tests, publishes, creates GitHub release
```

`np` will:
- Run tests
- Bump version
- Build
- Publish to npm
- Create a git tag
- Create a GitHub release

### Step 5 (optional): After publish

- [ ] **Verify on npm**: https://www.npmjs.com/package/venum
- [ ] **Verify badges**: refresh README on GitHub — badges will now show real data
- [ ] **Star history**: will populate automatically as people star the repo
- [ ] **Bundle size**: check https://bundlephobia.com/package/venum
- [ ] **Add a GitHub Action for CI** (optional, create `.github/workflows/ci.yml`):

```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install
      - run: bun test
      - run: npx tsc --noEmit -p .
```

## If `venum` name is taken on npm

Check: `npm view venum` — if it exists, consider:
- `@francoisvongue/venum` (scoped package)
- `venumjs`
- `venum-ts`

To use a scoped package, change `"name"` in `package.json` to `"@francoisvongue/venum"` and publish with `npm publish --access public`.
