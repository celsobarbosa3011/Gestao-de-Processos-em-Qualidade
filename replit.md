# MediFlow - Healthcare Process Management System

## Overview

MediFlow is a Kanban-based administrative process management system designed for healthcare units. It provides workflow tracking, user management, and reporting capabilities for organizations that manage multiple health units with periodic (biweekly) on-site visits.

The system enables:
- Drag-and-drop Kanban board for process workflow management
- Role-based access control (admin vs regular users)
- Process tracking with deadlines, priorities, and SLA alerts
- Dashboard with analytics and reporting
- White-label branding configuration

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight router)
- **State Management**: Zustand with persistence for client-side state
- **Data Fetching**: TanStack Query (React Query) for server state
- **UI Components**: shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS v4 with CSS variables for theming
- **Drag & Drop**: @hello-pangea/dnd for Kanban functionality
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **API Style**: RESTful JSON API under `/api` prefix
- **Build Tool**: Vite for client, esbuild for server bundling

### Data Storage
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with drizzle-zod for schema validation
- **Schema Location**: `shared/schema.ts` (shared between client and server)
- **Migrations**: Drizzle Kit with `db:push` command

### Authentication
- Simple email/password authentication stored in profiles table
- Session state managed client-side via Zustand persist
- No external auth providers currently integrated
- Role field in profiles table controls admin vs user access

### Key Design Patterns
- **Monorepo Structure**: Client in `/client`, server in `/server`, shared types in `/shared`
- **Path Aliases**: `@/` for client src, `@shared/` for shared code
- **Storage Abstraction**: `server/storage.ts` provides a data access layer interface
- **API Client**: `client/src/lib/api.ts` centralizes all fetch calls

## External Dependencies

### Database
- PostgreSQL via `DATABASE_URL` environment variable
- Connection pooling with `pg` package
- Session storage support with `connect-pg-simple`

### UI Libraries
- Full shadcn/ui component library (Radix-based)
- Recharts for dashboard visualizations
- date-fns for date manipulation
- Lucide icons

### Development Tools
- Vite dev server with HMR
- Replit-specific plugins for dev banner and error overlay
- TypeScript strict mode enabled