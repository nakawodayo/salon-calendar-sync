# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

**Salon Calendar Sync** - A LINE LIFF app for managing salon reservation requests and Google Calendar integration. Customers submit reservation requests via LINE, and stylists approve/adjust them with automatic Google Calendar synchronization.

---

## AI Development Philosophy

This project follows a unique **two-phase AI-driven development approach**:

### Phase 1: Exploration through Prototypes
- Rapidly create prototypes to refine ideas and requirements
- Code lives in `prototypes/` directory
- Speed and exploration prioritized over quality
- Acceptable to have unclear requirements

### Phase 2: Understanding through Construction
- Implement production code with clear intent and design
- Code lives in `src/` directory
- Understanding, responsibility, and quality prioritized
- Requirements must be clear and documented

**Key Principle**: Iterate between phases. Never move forward without understanding. AI generates form, humans derive meaning.

### Documentation Requirements

All significant AI interactions must be logged:

- **Daily logs**: `docs/ai-philosophy/logs/YYYY-MM-DD.md` - Track decisions, agreements, and context
- **Requirements**: `docs/ai-philosophy/logs/YYYY-MM-DD-phase1-requirements.md` - Document requirement changes
- **Research**: `docs/ai-philosophy/research/<topic>.md` - Technical investigation results (no date prefix)
- **Design**: `docs/ai-philosophy/design/<topic>.md` - Architecture and design decisions (no date prefix)

**Key Rules**:
- logs/ uses date prefixes (YYYY-MM-DD-*.md)
- research/ and design/ use topic names only, with creation date inside the document
- When making philosophy changes or important decisions, mark commits with `[philosophy]` prefix
- See `docs/ai-philosophy/DOCUMENTATION.md` for complete naming conventions

---

## Branch and Collaboration Strategy

### Working Environment

- **Shell**: WSL (bash) is the standard working environment
- **Repository path**: `/mnt/c/Users/pbnakao/salon-calendar-sync/salon-calendar-sync`
- **Authentication**: Use SSH for Git operations (`git@github.com:nakawodayo/salon-calendar-sync.git`)
- **Avoid**: PowerShell for Git operations (authentication and behavior differences)

### Branch Strategy

- **main**: Always deployable, merge via PR only
- **Branch naming**:
  - `feat/<summary>` - New features
  - `fix/<summary>` - Bug fixes
  - `docs/<summary>` - Documentation
  - `chore/` or `refactor/` - Tooling and refactoring

### Commit Guidelines

- **Commit prefixes**: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`
- **Philosophy changes**: Use `[philosophy]` prefix (e.g., `[philosophy] Update PHASES.md`)
- **Prototype commits**: Use `proto:` prefix
- **PR strategy**: Squash merge for clean history
- **Commit frequency**: Aim for single-purpose commits at logical checkpoints

### Commit Reminder Checklist

When committing, verify:
- [ ] Single purpose (no mixing feature/fix/docs)
- [ ] Build/tests pass
- [ ] Diff is reviewable size
- [ ] Branch name and commit prefix match

---

## Architecture

### Tech Stack

**Frontend** (LIFF App):
- Next.js 14+ (App Router) + TypeScript
- Tailwind CSS for styling
- React Hooks for state management
- React Hook Form + Zod for forms/validation
- `@line/liff` SDK for LINE integration
- Hosting: Vercel

**Backend** (Serverless):
- Node.js 18+ LTS + TypeScript
- Express.js (lightweight, serverless-friendly)
- GCP Cloud Functions
- Firebase Firestore (database)
- External APIs: Google Calendar API, LINE API

### Clean Architecture Principles

The project uses a **staged approach** to Clean Architecture:

```
Presentation → Application → Domain ← Infrastructure
```

**Layers**:

1. **Domain Layer** (center, no external dependencies)
   - Entities: Business objects with identity (`ReservationRequest`)
   - Value Objects: Immutable values (`DateTime`, `ReservationStatus`)
   - Repository Interfaces: Defined here, implemented in Infrastructure

2. **Application Layer** (business logic)
   - Use Cases: Single-purpose business operations (`CreateReservationRequestUseCase`)
   - DTOs: Data transfer objects

3. **Presentation Layer** (HTTP)
   - Controllers: HTTP request/response handling
   - Middleware: Auth, error handling
   - Routes: API routing

4. **Infrastructure Layer** (external concerns)
   - Repository Implementations: `FirestoreReservationRepository`
   - Adapters: External service clients (`GoogleCalendarAdapter`)
   - Config: Firebase, external API setup

### Directory Structure

```
prototypes/           # Phase 1: Experimentation & MVPs
  ui-sketches/        # UI prototypes (HTML mockups)
  mvp/                # Verification implementations
src/                  # Phase 2: Production code (when ready)
  backend/
    functions/        # Cloud Functions entry points
    presentation/     # Controllers, middleware, routes
    application/      # Use cases, DTOs
    domain/           # Entities, value objects, repository interfaces
    infrastructure/   # Repository impls, adapters, config
  frontend/
    app/              # Next.js App Router
    presentation/     # Components, pages
    application/      # Use cases, services
    domain/           # Entities, repository interfaces
    infrastructure/   # API clients, repository impls
docs/ai-philosophy/   # Philosophy docs and logs
```

### Implementation Priority

1. **Repository Pattern** (Phase 1 - Must)
   - Define interfaces in domain layer
   - Implement in infrastructure layer
   - Eliminate direct database access

2. **Use Cases** (Phase 2 - Must)
   - Extract business logic to use cases
   - Controllers only handle HTTP concerns
   - Single responsibility per use case

3. **Dependency Injection** (Phase 3 - Optional)
   - Factory pattern for managing dependencies
   - Consider lightweight DI container if needed

4. **Full Clean Architecture** (Phase 4 - Future)
   - Complete layer separation
   - Comprehensive testing strategy

---

## Key Design Decisions

### Reservation Flow

**States**: `requested` → `adjusting` → `fixed` | `rejected`

1. **Customer submits request** → Status: `requested`
2. **Stylist approves** → Google Calendar event created immediately → Status: `fixed`
3. **Stylist adjusts** → Status: `adjusting` → Edit details → **FIX** → Calendar created → Status: `fixed`
4. **Stylist rejects** → Status: `rejected`

**Important**: Approval creates calendar event immediately (no separate FIX step). Only adjusting state requires explicit FIX action.

### Error Handling & Retry Logic

Detailed in `docs/ai-philosophy/design/error-handling-retry.md`:

- Use structured error types at domain layer
- Implement retry logic for Google Calendar API (exponential backoff)
- Error middleware at presentation layer
- Maintain request state on failure for manual retry

### Logging & Monitoring

Detailed in `docs/ai-philosophy/design/logging-monitoring.md`:

- Winston for structured logging
- Cloud Logging integration
- Error logs with full context
- Cloud Monitoring for alerts

---

## Naming Conventions

- **Entities**: PascalCase, singular (`ReservationRequest`)
- **Value Objects**: PascalCase, singular (`ReservationStatus`)
- **Repository Interfaces**: `I` + Entity + `Repository` (`IReservationRepository`)
- **Repository Implementations**: Implementation + `Repository` (`FirestoreReservationRepository`)
- **Use Cases**: Verb + Noun + `UseCase` (`CreateReservationRequestUseCase`)
- **Controllers**: Noun + `Controller` (`ReservationController`)

---

## Migration from Prototypes to Production

When moving from `prototypes/` to `src/`:

1. **Reconfirm purpose** - Document learnings from prototype (1-3 lines)
2. **Clarify requirements** - Define boundaries, assumptions, non-functional requirements
3. **Sketch design** - Data structures, responsibilities, flow
4. **Reimplement in `src/`** - Do not copy directly; understand and rewrite
5. **Update logs** - Document additional learnings and questions

**Keep prototypes** for comparison and learning asset preservation.

---

## Important References

- **Philosophy**: `docs/ai-philosophy/README.md`
- **Phases**: `docs/ai-philosophy/PHASES.md`
- **Requirements**: `docs/ai-philosophy/REQUIREMENTS.md`
- **Logging**: `docs/ai-philosophy/LOGGING.md`
- **Collaboration**: `docs/ai-philosophy/COLLABORATION.md`
- **Branching**: `docs/ai-philosophy/BRANCHING.md`
- **MVP Plan**: `docs/ai-philosophy/design/mvp-plan.md`
- **System Design**: `docs/ai-philosophy/design/system-design.md`
- **Architecture**: `docs/ai-philosophy/design/architecture-guidelines.md`

---

## Development Workflow

### Current Phase: Phase 1 (Prototyping)

The project is in **Phase 1** - exploring and refining requirements through UI prototypes in `prototypes/ui-sketches/`. Production implementation in `src/` will begin once requirements are solidified.

**Important**: No package.json or npm commands exist yet. The project currently consists only of:
- HTML prototypes in `prototypes/ui-sketches/`
- Design and philosophy documentation in `docs/ai-philosophy/`

### Viewing Prototypes

```bash
# Open prototypes in browser (from repo root)
# On Windows: Use file explorer to navigate to prototypes/ui-sketches/ and open index.html
# On WSL: Use a command like `explorer.exe prototypes/ui-sketches/index.html`

# Available prototypes:
# - index.html: Navigation hub to all prototypes
# - customer-*.html: Customer-facing screens (home, create request, request list)
# - stylist-*.html: Stylist-facing screens (auth, request list, request detail, edit)
```

### WSL Commands

```bash
# Navigate to repo
cd /mnt/c/Users/pbnakao/salon-calendar-sync/salon-calendar-sync

# Git operations
git fetch --all -p
git status
git branch -vv

# Push with tracking
git push -u origin <branch>

# Test SSH auth
ssh -T git@github.com
```

### Future Development Commands (Phase 2 - Not Yet Available)

Once production implementation begins in `src/`, these commands will be relevant:

```bash
# Install dependencies
npm install

# Frontend development
cd src/frontend
npm run dev

# Backend development
cd src/backend
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Lint code
npm run lint
```

---

## Testing Philosophy

- **Domain/Entities**: Unit test business logic
- **Use Cases**: Test with mock repositories
- **Repositories**: Test with Firestore emulator or in-memory DB
- **API/Controllers**: End-to-end integration tests
- **Tools**: Jest, React Testing Library, Firestore Emulator, Supertest
