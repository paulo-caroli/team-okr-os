# Team OKR OS

The operational discipline layer that helps teams operate with explicit commitment to measurable results.

**"We are talking about impact, not tasks."**

## What this is

Team OKR OS is NOT a generic OKR tool, backlog manager, or corporate OKR platform. It's a minimal, focused product that helps teams:

- Make explicit commitments to measurable outcomes
- Structure initiatives around a theory of impact
- Run impact-oriented check-ins (GRIP sessions)
- Maintain operational discipline without unnecessary complexity

## Core concepts

- **Team OKR (title + objective)** — Short label plus the outcome and why it matters for the cycle
- **Team Objectives** — Clear outcomes the team commits to for the cycle (often 1–2)
- **Key Results** — Measurable outcomes that show progress toward each objective
- **Initiatives** — Bets with explicit hypotheses about impact
- **GRIP Sessions** — Structured impact check-ins

## Tech stack

- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS 4**
- **Prisma ORM 7** with PostgreSQL
- **NextAuth** for authentication

## Getting started

### Prerequisites

- Node.js 20+
- PostgreSQL database

### Setup

1. Clone the repository:

```bash
git clone <repo-url>
cd team-okr-os
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env
```

Edit `.env` with your PostgreSQL connection string and generate an auth secret:

```bash
openssl rand -base64 32
```

4. Generate Prisma client and run migrations:

```bash
npx prisma generate
npx prisma migrate dev --name init
```

5. Start the development server:

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

## Project structure

```
app/                    Next.js App Router pages
  (auth)/               Authentication pages (sign-in, sign-up)
  (app)/                Authenticated app pages
    team/               Team hub, settings
      [teamId]/
        commitment/     Commitment creation and view
          [commitmentId]/
            check-in/   GRIP session pages

lib/
  actions/              Server Actions (mutations)
  queries/              Data access (reads)
  domain/               Pure TypeScript domain types
  auth.ts               NextAuth configuration
  db.ts                 Prisma client singleton

components/
  ui/                   Primitive UI components
  team/                 Team-scoped components
  commitment/           Commitment components
  initiative/           Initiative components
  check-in/             GRIP session components

prisma/
  schema.prisma         Database schema
```

## Design principles

- Minimal and calm
- Structured, not gamified
- Friction only where discipline is needed
- Focus on clarity over features
