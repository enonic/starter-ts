# AGENTS.md

This file provides guidance to AI agents like Claude and Copilot when working with code in this repository.

## Description
Enonic XP TypeScript Starter. This is a best practices template for building Enonic XP applications.

The starter documentation is located in the docs/ folder
The starter source code is available on https://github.com/enonic/starter-ts

In the file gradle.properties, if appName has changed from com.example.typescript, this description should be updated, as you are currently in a new application that was created based on the starter. The docs/ folder documents how the starter was built and should be removed in derived projects.

## Build system

Gradle is the primary build tool, with a Node.js plugin for npm integration. However, builds require a contextual Enonic XP sandbox — the sandbox holds the specific XP version and the Java compiler needed to package the app into a JAR.

The `xpVersion` property in `gradle.properties` declares the target XP version (e.g. `8.0.2`). This determines which XP dependencies are used at build time, regardless of the sandbox version. The `@enonic-types/*` packages in `package.json` should match this version.

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
npm run build                 # Build server + assets in one tsdown run (both targets in tsdown.config.ts)

npm run check                 # Types + lint concurrently
npm run check:types           # Type check only (server + assets)
npm run lint                  # oxlint (configured in .oxlintrc.json)

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

The codebase has two distinct build targets, both defined in a single `tsdown.config.ts` (an array of two configs):

**Server** (`src/main/resources/**/*.ts`, excluding `assets/`):
- Target: ES2015, CommonJS format, `platform: 'neutral'`
- Output: `build/resources/main/`
- XP framework libraries (`/lib/xp/*`, `/lib/cache`, etc.) are marked `external` — provided by the runtime
- tsconfig: `src/main/resources/tsconfig.json`

**Client** (`src/main/resources/assets/**/*.ts`):
- Target: ES2015, ESM format, `platform: 'browser'`, minified in production
- Output: `build/resources/main/assets/`
- tsconfig: `src/main/resources/assets/tsconfig.json`

The server output is additionally re-lowered to ES5 by an SWC plugin in `tsdown.config.ts` (`nashornEs5`), because XP's Nashorn engine lacks some ES2015 syntax.

### TypeScript toolchain

The project uses TypeScript 7 — the native (Go-based) compiler. Its npm package ships only the `tsc` binary, not the JavaScript compiler API, which constrains the rest of the toolchain:

- `tsc` is used exclusively for type checking (`--noEmit`); all transpilation is done by tsdown (Oxc) and SWC, so the TypeScript version never affects build output or targets.
- Linting is done by **oxlint** (`.oxlintrc.json`), not ESLint — typescript-eslint requires the TS compiler API.
- Jest transpiles tests with **@swc/jest**, not ts-jest, and the Jest config is plain ESM (`jest.config.mjs`), not TypeScript — ts-jest and ts-node also require the TS compiler API.

Do not add ts-jest, ts-node, or typescript-eslint (or other packages with a `typescript <7` peer dependency): `npm install` will fail to resolve, and the TS7 package lacks the API they need at runtime.

### Path mappings

Server tsconfig maps:
- `/lib/xp/<name>` → `node_modules/@enonic-types/lib-<name>` (XP framework types) — one explicit entry per XP library plus a `/lib/xp/*` wildcard fallback. The explicit entries, combined with `typescript.preferences.autoImportSpecifierExcludeRegexes` in `.vscode/settings.json`, make IDE auto-import suggest the runtime-correct `/lib/xp/<name>` specifier instead of `@enonic-types/lib-<name>`. Add an entry (here and in `src/jest/server/tsconfig.json`) when installing a new `@enonic-types/lib-*` package.
- `/*` → `./src/main/resources/*` (app-local imports)

Jest moduleNameMapper mirrors these for tests:
- Server: `/lib/myproject/(.*)` → `src/main/resources/lib/myproject/$1`
- Client: `/assets/(.*)` → `src/main/resources/assets/$1`

### Testing

Two Jest projects with different environments:
- **Server tests** (`src/jest/server/`): Node.js environment, XP globals (`app`, `log`, etc.) mocked in `setupFile.ts`
- **Client tests** (`src/jest/client/`): jsdom environment

Both transpile test files with @swc/jest (no type checking; the tsconfig in each test folder, extending the respective source tsconfig, serves the editor).

### XP globals

Server-side code has access to Enonic runtime globals (`app`, `log`, `require`, `resolve`, `__`) via `@enonic-types/global`. These are real at runtime but must be mocked in tests.
