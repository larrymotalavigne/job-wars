# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Job Wars is a collectible card game built with Angular 21+, featuring career-themed cards across 20 professional domains (IT, Health, Police, Finance, etc.). The game supports single-player (vs AI) and multiplayer modes with a full collection/deck-building system.

## Development Commands

```bash
# Install dependencies (use --legacy-peer-deps due to peer dependency conflicts)
npm ci --legacy-peer-deps

# Start development server (http://localhost:4200)
npm start
# or
ng serve

# Build for production
npm run build:prod

# Run tests
npm test

# Watch mode (auto-rebuild during development)
npm run watch
```

## Architecture Overview

### Core Models (`src/app/models/`)

- **card.model.ts**: Base card types and enums
  - `Card` union type: `JobCard | ToolCard | EventCard`
  - `Domain` enum: 20 professional domains (IT, Police, Health, etc.)
  - `CardType` enum: Job (units), Tool (equipment), Event (spells)
  - `Rarity` enum: Common, Uncommon, Rare, Legendary
  - Domain-specific color schemes and icons

- **game.model.ts**: Game state and runtime structures
  - `GameState`: Root game state with both players, phase, combat, effects
  - `PlayerState`: Reputation (life), budget (mana), zones (deck/hand/field/graveyard)
  - `CardInstance`: Runtime wrapper around `Card` with instanceId, zone, modifiers, tapped state
  - `GamePhase` enum: Mulligan → Budget → Draw → Hiring → Work (Attack/Block/Damage) → End

- **effect.model.ts**: Card ability system
  - `EffectTrigger`: OnHire, OnCast, OnDestroy, OnAttack, etc.
  - `EffectType`: Draw, Damage, Buff, Debuff, Heal, Budget, Destroy, Tap, Bounce
  - `TargetType`: Targeting modes (AllyJob, EnemyJob, AllAllyJobs, etc.)
  - `PendingEffect`: Tracks active effects requiring player input

### Services (`src/app/services/`)

- **game.service.ts**: Core game engine
  - Manages `GameState` via BehaviorSubject (`gameState$`)
  - Handles turn/phase progression, combat resolution, win conditions
  - Orchestrates interactions between effect/card/deck services
  - Supports both local AI and online multiplayer modes

- **effect.service.ts**: Effect execution engine
  - Processes effects from `EFFECT_REGISTRY` based on triggers
  - Handles targeting, condition checking, and effect application
  - Manages `pendingEffect` state for player-targeted abilities

- **card.service.ts**: Card database and queries
  - Provides access to all card definitions (from `src/app/data/*.cards.ts`)
  - Filter/search by domain, type, cost, rarity

- **collection.service.ts**: Progression system
  - Tracks unlocked cards in localStorage
  - Versioned storage with migration system (`CURRENT_VERSION`)
  - Unlock conditions: games_played, games_won, domain_games, achievements

- **deck.service.ts**: Deck management (30 cards, domain restrictions)
- **multiplayer.service.ts**: WebSocket-based online play
- **ai.service.ts**: AI opponent logic (card evaluation, decision-making)
- **stats.service.ts**: Game statistics tracking
- **sound.service.ts**: Audio effects management

### Data Layer (`src/app/data/`)

- **\*.cards.ts**: Card definitions by domain (e.g., `it.cards.ts`, `health.cards.ts`)
  - 20 domain files defining all card data
  - `index.ts` exports `ALL_CARDS` array

- **effect-registry.ts**: Maps card IDs to their effect definitions
  - Used by EffectService to execute card abilities
  - **When adding new cards with effects**, register them here

- **starter-decks.ts**: Pre-built decks for new players

### Components (`src/app/components/`)

- **game/**: All in-game UI components
  - `game-board/`: Main game view orchestrating all zones
  - `player-area/`: Player stats, zones, and action buttons
  - `hand-zone/`, `field-zone/`: Zone-specific card displays
  - `combat-overlay/`: Attack/block declaration UI
  - `targeting-overlay/`: Target selection for effects
  - `phase-bar/`: Turn phase indicator
  - `game-log/`: Action history
  - `mulligan-overlay/`, `tutorial-overlay/`: Special overlays

- **deck-builder/**: Deck construction UI
- **collection/**: Card collection browser
- **card-gallery/**: Public card viewer
- **stats/**: Statistics dashboard

### Routing (`src/app/app.routes.ts`)

```
/ → /gallery (default)
/gallery - Card browser (public)
/collection - Unlocked cards
/deck-builder - Deck editor
/deck-builder/:deckId - Edit specific deck
/game - Game lobby (mode/deck selection)
/game/play - Active game (requires gameGuard)
/stats - Player statistics
/print - Print sheet for physical cards
/rules - Game rules
```

## Key Patterns

### Card Definition and Registration

1. Define cards in appropriate domain file (`src/app/data/*.cards.ts`)
2. If card has abilities, register effects in `src/app/data/effect-registry.ts`
3. Export from `src/app/data/index.ts` (usually automatic via `ALL_CARDS`)

### Game State Management

- GameService maintains single source of truth via `stateSubject`
- Components subscribe to `gameState$` for reactivity
- All game actions go through GameService methods (never mutate state directly)
- State updates emit new complete GameState objects (immutable pattern)

### Effect Execution Flow

1. Trigger occurs (e.g., card hired, attack declared)
2. EffectService looks up effects in `EFFECT_REGISTRY`
3. If targeting required, creates `PendingEffect` in GameState
4. GameService pauses, shows targeting-overlay
5. Player selects target(s), GameService calls `resolveEffect()`
6. EffectService applies effect, updates GameState

### Card Instances vs Card Definitions

- `Card` types are immutable definitions (templates)
- `CardInstance` wraps a `Card` with runtime state (zone, tapped, modifiers)
- Each instance has unique `instanceId` for tracking
- Modifiers stack on instances without mutating base `Card`

### Collection Unlocks

- Cards start locked (except starter deck cards)
- Unlock conditions checked after each game
- Collection service uses versioned localStorage
- Version changes trigger full collection migration

## Testing

- Test framework: Vitest (configured in Angular)
- Test files: `*.spec.ts` alongside source files
- Run tests: `npm test` or `npm run test:ci`
- Angular testing utilities: TestBed, fixture, inject

## Docker Deployment

- Multi-stage build (Node 24 Alpine → Nginx)
- Build artifacts compressed with gzip + brotli
- Production URL: https://job-wars.atomstudios.fr
- Deployed via GitLab CI (`.gitlab-ci.yml`) — frontend-only pipeline archetype:
  `test → build → deploy → verify`
- Image: `CI_REGISTRY_IMAGE/job-wars-web:<SHA>` pushed to GitLab Container Registry
- Deploy: `kubectl rollout restart deployment/job-wars-web -n apps`

**Canonical reference:** see `process/ci/frontend-only.yml` in the infra repo.
Required CI/CD variables: see `process/deployment/required-variables.md` in the infra repo.

## Important Notes

- Always use `--legacy-peer-deps` when installing packages (PrimeNG peer dependency conflicts)
- Card IDs must be unique and follow pattern: `{domain-code}-{number}` (e.g., `it-001`)
- Game phases must progress linearly (no skipping phases)
- Effect conditions must be checked before execution (see `EffectCondition`)
- localStorage keys prefixed with `jobwars-` (collection, decks, stats)
- Multiplayer uses shared game state with validation on both sides
- AI uses same game rules as human players (no cheating)
