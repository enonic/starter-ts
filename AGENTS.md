# AGENTS.md

This file provides guidance to AI agents like Claude and Copilot when working with code in this repository.

## Description
Enonic XP TypeScript Starter. This is a best practices template for building Enonic XP applications. 

The starter documentation is located in the docs/ folder
The starter source code is available on https://github.com/enonic/starter-ts

In the file gradle.properties, if appName has changed from com.example.typescript, this description should be updated, as your are currently in a new application that was created based on the starter. The docs/ folder documents how the starter was built and should be removed in derived projects.

## Build system

Gradle is the primary build tool, with a Node.js plugin for npm integration. However, builds require a contextual Enonic XP sandbox — the sandbox holds the specific XP version and the Java compiler needed to package the app into a JAR.

The `xpVersion` property in `gradle.properties` declares the target XP version (e.g. `7.16.1`). This determines which XP dependencies are used at build time, regardless of the sandbox version. The `@enonic-types/*` packages in `package.json` should match this version.

The normal approach is to use **Enonic CLI** commands, which wire the build to the correct sandbox and compiler. Direct `./gradlew` or `npm` commands work for TypeScript-only tasks (type checking, linting, testing) but the full build and deploy cycle should go through the Enonic CLI.

## Commands

### Enonic CLI (preferred for build & deploy)

```bash
enonic project create -r starter-ts   # Create a new app from this starter
enonic dev                            # Build, deploy, and watch for changes (main development workflow)
enonic project build                  # Full build (wired to the sandbox's compiler)
enonic project deploy                 # Build and deploy to the sandbox
```

The Enonic CLI automatically selects the sandbox associated with the project. If no sandbox is linked, it will prompt to create or select one.

### npm scripts (TypeScript tooling)

```bash
npm run build                 # Build server + assets concurrently (via tsup/esbuild)
npm run build:server          # Server code only
npm run build:assets          # Client/asset code only

npm run check                 # Types + lint concurrently
npm run check:types           # Type check only (server + assets)
npm run lint                  # ESLint with cache

npm test                      # All tests (server + client projects)
npm test -- --testPathPattern="server"   # Server tests only
npm test -- --testPathPattern="client"   # Client tests only
npm run cov                   # Tests with coverage
```

### Gradle (used internally by Enonic CLI)

```bash
./gradlew build               # Full build (npm install + check + test + build + jar)
./gradlew build -Pdev         # Development build (NODE_ENV=development, no minification)
./gradlew check               # Type checking + linting only
./gradlew test                # Tests only
```

## CI/CD

In CI/CD environments (no local sandbox), builds use the `enonic/enonic-ci` Docker image (e.g., `enonic/enonic-ci:7.16`) which contains the correct XP version, Enonic CLI, and Java compiler.

For GitHub Actions, the project uses `enonic/action-app-build@v1` which handles this automatically (see `.github/workflows/build.yml`). On other CI platforms (Jenkins, CircleCI, etc.), run `/setup_sandbox.sh` inside the container first, then `enonic project build`.

## Architecture

### Dual build: server vs. client

The codebase has two distinct build targets with separate tsup configs:

**Server** (`src/main/resources/**/*.ts`, excluding `assets/`):
- Target: ES5, CommonJS format, `platform: 'neutral'`
- Output: `build/resources/main/`
- XP framework libraries (`/lib/xp/*`, `/lib/cache`, etc.) are marked `external` — provided by the runtime
- Config: `tsup/server.ts`, tsconfig: `src/main/resources/tsconfig.json`

**Client** (`src/main/resources/assets/**/*.ts`):
- Target: ESM, `platform: 'browser'`, minified in production
- Output: `build/resources/main/assets/`
- Config: `tsup/client.ts`, tsconfig: `src/main/resources/assets/tsconfig.json`

### Path mappings

Server tsconfig maps:
- `/lib/xp/*` → `node_modules/@enonic-types/lib-*` (XP framework types)
- `/*` → `./src/main/resources/*` (app-local imports)

Jest moduleNameMapper mirrors these for tests:
- Server: `/lib/myproject/(.*)` → `src/main/resources/lib/myproject/$1`
- Client: `/assets/(.*)` → `src/main/resources/assets/$1`

### Testing

Two Jest projects with different environments:
- **Server tests** (`src/jest/server/`): Node.js environment, XP globals (`app`, `log`, etc.) mocked in `setupFile.ts`
- **Client tests** (`src/jest/client/`): jsdom environment

Both use ts-jest with their own tsconfig extending the respective source tsconfig.

### XP globals

Server-side code has access to Enonic runtime globals (`app`, `log`, `require`, `resolve`, `__`) via `@enonic-types/global`. These are real at runtime but must be mocked in tests.
