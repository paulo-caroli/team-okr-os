# Authentication and Team Membership — Technical Architecture

This document describes how authentication and team membership are implemented in this project so another codebase can replicate the same architecture and patterns. **No code is modified; this is analysis and specification only.**

---

## 1) Authentication Architecture

### 1.1 Stack and Strategy

- **Library:** NextAuth v5 (Auth.js), `next-auth@^5.0.0-beta.30`
- **Session strategy:** JWT (`session: { strategy: "jwt" }` in `lib/auth.ts`)
- **Provider:** Credentials only (email + password). No OAuth.
- **Session storage:** JWT stored in an HTTP-only cookie (managed by NextAuth). No server-side session store.
- **Password hashing:** `bcrypt` via `bcryptjs`, 12 rounds (e.g. `bcrypt.hash(password, 12)`).

Session validation is **not** done in middleware. There is **no** `middleware.ts` in the project. All protection is done in **layouts and server code** by calling `auth()` and then either redirecting or proceeding.

### 1.2 Sign Up

- **Entry:** `app/(auth)/sign-up/page.tsx` — client component, form posts to a server action.
- **Action:** `signUpAction` in `lib/actions/auth-actions.ts`.
  - Reads `name`, `email`, `password` from `FormData`; normalizes email (trim, toLowerCase).
  - Validates: all fields present; password length ≥ 8; no existing user with that email.
  - Creates user: `bcrypt.hash(password, 12)` → `passwordHash`; `db.user.create({ name, email, passwordHash })`.
  - **Before** signing in: calls `acceptPendingInvitations(newUser.id, email)` (see Invitation flow).
  - Then: `signIn("credentials", { email, password, redirectTo: "/team" })` so the user is logged in and sent to `/team`.
- **API:** Sign-up does **not** use a REST API route; it uses a **server action** only. NextAuth is only used for sign-in (and session) after the user record exists.

### 1.3 Sign In

- **Entry:** `app/(auth)/sign-in/page.tsx` — client component, form posts to a server action.
- **Action:** `signInAction` in `lib/actions/auth-actions.ts`.
  - Looks up user by email; if user exists, calls `acceptPendingInvitations(user.id, email)` **before** calling NextAuth sign-in (so any pending invites for that email are applied as soon as they sign in).
  - Then: `signIn("credentials", { email, password, redirectTo: "/team" })`.
  - NextAuth’s `authorize` (in `lib/auth.ts`) runs: `db.user.findUnique({ where: { email } })`, then `bcrypt.compare(password, user.passwordHash)`; returns `{ id, name, email, image }` or `null`.
- **API route:** `app/api/auth/[...nextauth]/route.ts` exports `GET` and `POST` from `handlers` (NextAuth’s catch-all handler). No custom sign-in API; the server action calls `signIn()` which ultimately uses this route internally.

### 1.4 Session Handling

- **Mechanism:** JWT in an HTTP-only cookie (NextAuth default for JWT strategy). No DB-backed session table.
- **Session shape:** Extended in `types/next-auth.d.ts`: `Session.user` includes `id: string` (from JWT). Populated in `lib/auth.ts` callbacks:
  - `jwt`: stores `user.id` on the token when `user` is present.
  - `session`: sets `session.user.id = token.id`.
- **Reading session:** Server code uses `auth()` from `@/lib/auth` (e.g. in layouts and server actions). No `getServerSession`; `auth()` is the single entry point.

### 1.5 Where Session Validation Happens

- **No middleware.** No file `middleware.ts` (or similar) that checks auth.
- **Protected app shell:** `app/(app)/layout.tsx` calls `requireAuth()` from `lib/auth-guard.ts`. That function:
  - Calls `auth()`; if `!session?.user?.id`, runs `redirect("/sign-in")`.
  - Returns the session so the layout can use `session.user.id` (e.g. to load teams).
- **Team-scoped routes:** `app/(app)/team/[teamId]/layout.tsx` calls `requireTeamAccess(teamId)` from `lib/auth-guard.ts`. That function:
  - Calls `requireAuth()` (so unauthenticated users go to `/sign-in`).
  - Looks up `TeamMember` by `(teamId, session.user.id)`; if no member, `redirect("/team")`.
  - Returns `{ session, member }` (member includes `team`).
- **Server actions:** Each action that needs auth calls `auth()` and, if `!session?.user?.id`, runs `redirect("/sign-in")`. Some also check team membership via `teamMember.findUnique({ where: { teamId_userId: { teamId, userId: session.user.id } } })`.

So: **validation is in layouts (for UI tree) and in each server action (for mutations).**

### 1.6 How Protected Routes Are Enforced

- **Route groups:** `(app)` contains all app routes (e.g. `/team`, `/team/[teamId]/...`). The **layout** of `(app)` enforces “must be logged in” via `requireAuth()`. No separate “protected route” config; if you’re under `(app)`, you get the layout and thus the redirect when not logged in.
- **Team routes:** Under `(app)/team/[teamId]/...`, the `[teamId]` layout enforces “must be member of this team” via `requireTeamAccess(teamId)`. Unauthorized → redirect to `/team`.
- **Public routes:** `(auth)` (sign-in, sign-up) and the root page have no layout that requires auth. The root page (`app/page.tsx`) optionally redirects logged-in users: `if (session) redirect("/team")`.

---

## 2) Database Design

### 2.1 Schema (Prisma)

**File:** `prisma/schema.prisma`. Database: PostgreSQL.

#### Users

```prisma
model User {
  id           String       @id @default(cuid())
  name         String
  email        String       @unique
  passwordHash String
  image        String?
  memberships  TeamMember[]
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt
}
```

- **Unique:** `email`.
- **Relations:** One-to-many to `TeamMember` (`memberships`).

#### Teams

```prisma
model Team {
  id          String           @id @default(cuid())
  name        String
  members     TeamMember[]
  commitments TeamCommitment[]
  invitations TeamInvitation[]
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt
}
```

- No unique constraint on `name` (multiple teams can have the same name).

#### Team Members (membership junction)

```prisma
model TeamMember {
  id            String   @id @default(cuid())
  teamId        String
  userId        String
  role          TeamRole @default(MEMBER)
  dedicationPct Int?
  team          Team     @relation(fields: [teamId], references: [id], onDelete: Cascade)
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt     DateTime @default(now())

  @@unique([teamId, userId])
}

enum TeamRole {
  OWNER
  MEMBER
}
```

- **Unique index:** `@@unique([teamId, userId])` — one membership per user per team; prevents duplicate membership at the DB level.
- **Foreign keys:** `teamId` → `Team.id`, `userId` → `User.id`; both `onDelete: Cascade`.
- **No `updatedAt`** on `TeamMember`.

#### Invitations

```prisma
model TeamInvitation {
  id            String           @id @default(cuid())
  teamId        String
  name          String?
  email         String
  dedicationPct Int?
  invitedById   String
  status        InvitationStatus @default(PENDING)
  team          Team             @relation(fields: [teamId], references: [id], onDelete: Cascade)
  createdAt     DateTime         @default(now())
  updatedAt     DateTime         @updatedAt

  @@unique([teamId, email])
}

enum InvitationStatus {
  PENDING
  ACCEPTED
  CANCELLED
}
```

- **Unique index:** `@@unique([teamId, email])` — one invitation row per (team, email). Re-invites reuse the same row by updating it to `PENDING` and updating `name`, `dedicationPct`, `invitedById`.
- **No token field.** Invitations are **email-based only**: the invitee is identified by email; there is no signed link or token stored or validated.
- **No expiration field.** Invitations do not expire by design in this schema; they can be cancelled (status `CANCELLED`) or accepted (status `ACCEPTED`).
- **`invitedById`** is stored but not a Prisma relation to `User` in the schema (no `invitedBy User @relation(...)`). It is set to `session.user.id` when creating/updating the invitation.

### 2.2 Relationships and Constraints

- **User ↔ Team:** Many-to-many via `TeamMember`. A user can be in many teams; a team has many members.
- **Membership uniqueness:** Enforced by `@@unique([teamId, userId])` on `TeamMember`.
- **Invitation uniqueness:** One row per (team, email); status and metadata are updated for re-invites.

### 2.3 How Membership Is Enforced

- **Reading:** Any team-scoped data is gated by first resolving the current user’s `TeamMember` for that `teamId` (e.g. in `requireTeamAccess` or inside server actions). Queries filter by `teamId` and sometimes by `userId` for ownership (e.g. only OWNER can remove members or cancel invites).
- **Writing:** Before creating a `TeamMember`, the code checks for an existing row with `teamId_userId`; if found, it returns a user-facing error (e.g. “This person is already a team member”) and does not insert. The unique constraint also prevents duplicate rows if two requests race.

---

## 3) Invitation / Add Member Flow

### 3.1 How Invitations Are Created

- **Entry:** Team Settings page `app/(app)/team/[teamId]/settings/page.tsx`. It renders `InviteMemberForm` (`components/team/invite-member-form.tsx`), which submits to the `addTeamMember` server action with `teamId`, optional `name`, `email`, optional `dedicationPct`.
- **Action:** `addTeamMember` in `lib/actions/team-actions.ts`:
  - Requires auth; verifies the current user is a member of the team (any role).
  - Normalizes email (trim, toLowerCase). Validates email present.
  - **If a user exists with that email:**
    - Checks for existing `TeamMember` with `(teamId, user.id)`. If exists, returns `{ error: "This person is already a team member." }`.
    - Otherwise creates `TeamMember` with `role: "MEMBER"`, optional `dedicationPct`, and returns success with `invited: "existing"`.
  - **If no user exists:**
    - Looks up `TeamInvitation` by `teamId_email`. If a row exists and status is `PENDING`, returns `{ error: "An invitation for this email is already pending." }`.
    - If a row exists with another status (e.g. `ACCEPTED`, `CANCELLED`): **reuses** it — `teamInvitation.update` to set `status: "PENDING"`, update `name`, `dedicationPct`, `invitedById`.
    - If no row exists: `teamInvitation.create` with `teamId`, `name`, `email`, `dedicationPct`, `invitedById: session.user.id`, `status` default `PENDING`.
  - After creating/updating a **pending** invitation, sends an email via `sendInvitationEmail` (see below) and returns success with `invited: "pending"`.

### 3.2 Tokens

- **This project does not use invite tokens.** There is no token generation, no token stored in `TeamInvitation`, and no token in the invite link. The link in the email is the **generic sign-up URL** (e.g. `https://host/sign-up`), not a per-invite link.

### 3.3 Token Validation, Expiration, Reuse

- Not applicable (no tokens). “Validation” is: when a user signs in or signs up with an email, all `TeamInvitation` rows with that email and `status: "PENDING"` are processed (see below). Invite “reuse” is handled by reusing the same `(teamId, email)` row and setting it back to `PENDING` when the owner invites again.

### 3.4 How Membership Insertion Is Done (Accepting Invites)

- **When:** On **sign-in** and **sign-up**, before or as part of establishing the session.
- **Where:**
  - **Sign-up:** In `signUpAction`, after `db.user.create`, the code calls `acceptPendingInvitations(newUser.id, email)`.
  - **Sign-in:** In `signInAction`, if a user with that email exists, it calls `acceptPendingInvitations(user.id, email)` before `signIn(...)`.
  - **NextAuth:** In `lib/auth.ts`, the `events.signIn` callback also runs after a successful credentials sign-in: it finds pending invitations by email and for each, if the user is not already a member, creates a `TeamMember` and then updates the invitation to `ACCEPTED`. So **both** the server action and the NextAuth event can process pending invites; the server action runs for the same user/email before sign-in, and the event runs after sign-in. In practice this gives redundancy so invites are accepted whether the flow goes through the action’s pre-sign-in call or through the event.
- **Logic of `acceptPendingInvitations` (in `lib/actions/auth-actions.ts`):**
  - `db.teamInvitation.findMany({ where: { email: email.toLowerCase(), status: "PENDING" } })`.
  - For each invitation: check `db.teamMember.findUnique({ where: { teamId_userId: { teamId: invitation.teamId, userId } } })`. If **not** already a member, `db.teamMember.create({ teamId, userId, role: "MEMBER", dedicationPct: invitation.dedicationPct })`.
  - Then `db.teamInvitation.update({ where: { id: invitation.id }, data: { status: "ACCEPTED" } })` for that row.
- **Transaction:** The implementation does **not** wrap these steps in a single database transaction. Each invite is processed in a loop with separate reads and writes. Duplicate membership is still prevented by the unique constraint and the “already member” check.

### 3.5 Idempotency

- **Same user invited twice (existing user):** First time creates `TeamMember`. Second time `findUnique` finds the member and the code returns “This person is already a team member” — no second insert.
- **Same email invited twice (no account yet):** First time creates `TeamInvitation` (or reuses row) with `PENDING`. Second time with same (teamId, email) returns “An invitation for this email is already pending” — no duplicate row because of `@@unique([teamId, email])`.
- **Sign-in/sign-up with pending invites:** Multiple sign-ins do not create duplicate memberships because of the “already member” check and the unique constraint.

---

## 4) Server Logic

### 4.1 What Handles Sign Up, Sign In, Join Team

| Flow            | Handler type   | Location                          |
|-----------------|----------------|-----------------------------------|
| Sign up         | Server action  | `lib/actions/auth-actions.ts` → `signUpAction` |
| Sign in         | Server action  | `lib/actions/auth-actions.ts` → `signInAction` |
| Join team       | No dedicated “join” API. Membership is created (a) when an existing user is added by email in `addTeamMember`, or (b) when a new user signs up or an existing user signs in and `acceptPendingInvitations` (or NextAuth `signIn` event) runs. |

NextAuth’s `authorize` in `lib/auth.ts` is used for **credential verification** only; user creation and invite acceptance are done in the server action and in NextAuth events.

### 4.2 Side Effects (Adding to Team)

- **Adding existing user to team:** Directly in `addTeamMember`: after checks, `db.teamMember.create(...)`.
- **Pending invite → member:** Triggered by sign-in/sign-up:
  - In **auth-actions:** `acceptPendingInvitations(userId, email)` before (sign-in) or after (sign-up) user creation, then `signIn(...)`.
  - In **NextAuth** `events.signIn`: after successful sign-in, same logic (find PENDING by email, create TeamMember if not already member, mark invite ACCEPTED). So side effect runs in both places for robustness.

### 4.3 Error Handling

- **Server actions** return a **state object** to the client instead of throwing for “expected” validation errors:
  - Auth: `AuthState = { error: string } | null`. On validation or credential failure, return `{ error: "..." }`; the form displays it and does not redirect.
  - Invite: `InviteState = { error: string } | null | { success: true, invited: "existing"|"pending", email, name, teamName }`. On duplicate member or duplicate pending invite, return `{ error: "..." }`.
- **Redirects** are used for “must be logged in” or “no access to this team”: `redirect("/sign-in")` or `redirect("/team")` inside server code. These are thrown and handled by the framework.
- **NextAuth:** Invalid credentials cause `authorize` to return `null`; NextAuth returns 401. The server action catches `AuthError` and returns `{ error: "Invalid email or password." }` so the UI shows a single generic message (no email enumeration).

---

## 5) Security Decisions

### 5.1 Why These Choices

- **JWT strategy:** No server-side session store to scale or manage; cookie is self-contained. Session data is minimal (user id, name, email, image).
- **Credentials only:** Simple product requirement; no OAuth in this codebase.
- **No invite tokens:** Simpler model: invite is “this email is allowed to join this team when they have an account.” No token theft or expiration; trade-off is no one-click magic link — user must sign up/sign in with that email.
- **Email normalized:** Trim and toLowerCase on email everywhere to avoid duplicate accounts and to match invites reliably.

### 5.2 Token Security (Invites)

- There are no invite tokens. Security is “only the person who can sign in with that email gets the membership.” Email delivery is trusted for “this email belongs to the invitee.”

### 5.3 Duplicate Membership Prevention

- **DB:** `@@unique([teamId, userId])` on `TeamMember`. Any duplicate insert would throw.
- **Application:** Before creating a member, code always checks `teamMember.findUnique({ where: { teamId_userId } })` and returns a friendly error if already a member. Same for “already pending” invite on `(teamId, email)`.

### 5.4 Invalid Invites and Information Leakage

- **No token to validate.** So there’s no “invalid token” response. For “already a team member” or “invitation already pending,” the message is shown only to the **inviter** (authenticated team member), not to the invitee. The invitee never hits a “invalid invite” page; they just sign up or sign in and are added if there was a pending invite for their email. So no information is leaked to unauthenticated users about whether an invite exists.

---

## 6) UX Decisions

### 6.1 Where Invite Input Appears

- **Team Settings:** “Add a team member” form is on the team settings page: `app/(app)/team/[teamId]/settings`. Not on sign-up; not on a standalone “invite” page. One form: email (required), name (optional), dedication % (optional).

### 6.2 On Success (Add Member)

- **Existing user:** Green banner: “**email** has been added to the team.” Form can be reset.
- **New user (pending invite):** Green banner: “Invitation created for **email**. They will join automatically when they sign up.” A copyable “InviteMessage” block is shown with a short text that includes the sign-up link and explains they’ll get access when they sign up with that email.

### 6.3 On Failure

- Errors shown in a red banner above the form: “This person is already a team member.” / “An invitation for this email is already pending.” / “Email is required.” etc. No redirect; user stays on settings.

### 6.4 Sign-Up / Sign-In Feedback

- Errors (e.g. “Invalid email or password”, “All fields are required”) shown in a red box on the same page. Success is a redirect (via NextAuth `redirectTo: "/team"`), so no explicit “success” message on the auth page.

---

## 7) Architectural Patterns

### 7.1 Folder Structure Involved

```
app/
  (auth)/                    # Route group: sign-in, sign-up (no auth required)
    sign-in/page.tsx
    sign-up/page.tsx
  (app)/                     # Route group: all app routes (layout enforces auth)
    layout.tsx                # requireAuth(), loads teams, AppNav
    team/
      page.tsx               # list teams
      new/page.tsx           # create team form
      [teamId]/
        layout.tsx           # requireTeamAccess(teamId), TeamNav
        page.tsx
        setup/
        settings/page.tsx     # team name + members + invite form + pending list
        ...
  api/auth/[...nextauth]/route.ts
  layout.tsx
  page.tsx                   # landing; redirects logged-in to /team
  providers.tsx              # PostHog only; no SessionProvider

lib/
  auth.ts                    # NextAuth config (Credentials, JWT, callbacks, signIn event)
  auth-guard.ts              # requireAuth(), requireTeamAccess()
  actions/
    auth-actions.ts          # signInAction, signUpAction, signOutAction, acceptPendingInvitations
    team-actions.ts          # createTeam, updateTeam, addTeamMember, cancelInvitation, removeTeamMember
  db.ts                      # Prisma singleton
  email.ts                   # sendInvitationEmail (Resend)

types/
  next-auth.d.ts             # Session.user.id
```

### 7.2 Separation of Concerns

- **Auth config:** `lib/auth.ts` — provider, strategy, callbacks, signIn event.
- **Guards:** `lib/auth-guard.ts` — pure async functions that return session/member or redirect. No UI.
- **Mutations and auth flows:** `lib/actions/auth-actions.ts` and `lib/actions/team-actions.ts` — server actions that call `auth()`, validate input, call DB, call `signIn`/`signOut` where needed, return state or redirect.
- **Data access:** `lib/db.ts` (Prisma client); `lib/queries/team-queries.ts` (and similar) for read-only helpers. Actions use `db` and sometimes query helpers.
- **Email:** `lib/email.ts` — single function `sendInvitationEmail`; fails gracefully if no API key.

### 7.3 Repeated Patterns

- **Auth in actions:** `const session = await auth(); if (!session?.user?.id) redirect("/sign-in")`.
- **Team access in actions:** `teamMember.findUnique({ where: { teamId_userId: { teamId, userId: session.user.id } } })`; if no member, return error or redirect.
- **Form state:** Server actions take `prevState` and `FormData`, return a state object (`{ error }` or `{ success, ... }`). Client uses `useActionState(action, null)` and renders error/success from state.
- **Redirect on success:** Auth actions call `signIn(..., { redirectTo: "/team" })`; team creation uses `redirect(\`/team/${team.id}/setup\`)` after create.

---

## 8) Step-by-Step Replication Guide

### 8.1 Core Components Required

1. **Auth provider** (e.g. NextAuth) with:
   - Credentials provider
   - JWT session strategy
   - Callbacks to put `user.id` on the session
   - Optional: `signIn` event to accept pending invites by email after login

2. **Auth guard module** with:
   - `requireAuth()`: get session, redirect to sign-in if missing, return session.
   - `requireTeamAccess(teamId)`: require auth, then check membership for `teamId`; redirect if not member; return `{ session, member }`.

3. **Server actions (or equivalent)** for:
   - Sign up (create user, hash password, accept pending invites, then sign in and redirect).
   - Sign in (optionally accept pending invites for that email, then sign in with redirect).
   - Sign out (sign out and redirect).
   - Add team member (by email: if user exists add membership; else create/update pending invitation and send email).

4. **Invitation acceptance logic** (in sign-up and sign-in path):
   - Find all invitations with `email` (normalized) and `status = PENDING`.
   - For each: if user is not already a member of that team, create membership; then set invitation status to ACCEPTED.

5. **API route** for the auth provider (e.g. NextAuth catch-all `GET`/`POST`).

6. **Layouts** that call the guards:
   - App layout: `requireAuth()` so all child routes are protected.
   - Team layout: `requireTeamAccess(teamId)` so team routes are team-member-only.

### 8.2 Required DB Tables

- **users:** id (PK), name, email (unique), passwordHash, optional image, timestamps.
- **teams:** id (PK), name, timestamps.
- **team_members:** id (PK), teamId (FK → teams), userId (FK → users), role (e.g. OWNER/MEMBER), optional dedicationPct, createdAt. **Unique (teamId, userId).**
- **team_invitations:** id (PK), teamId (FK → teams), email, optional name, optional dedicationPct, invitedById (user id), status (PENDING | ACCEPTED | CANCELLED), timestamps. **Unique (teamId, email).**

No token column on invitations if you replicate the “email-only” design.

### 8.3 Required Services / Modules

- **Auth config:** Credentials + JWT; authorize = look up user by email, verify password; on signIn event (optional): accept pending invitations for that user’s email.
- **Password:** Hash on sign-up with a safe algorithm (e.g. bcrypt 12 rounds); compare on sign-in.
- **Email (optional):** Send one “you’re invited” email with a link to sign-up (generic URL). Handle missing config gracefully.

### 8.4 Required Flows (Order)

1. **DB:** Create schema with User, Team, TeamMember (with unique (teamId, userId)), TeamInvitation (with unique (teamId, email)), and enums.
2. **Auth:** Configure provider (Credentials + JWT), session callbacks (attach user id), and optionally `signIn` event to accept pending invites.
3. **Guards:** Implement `requireAuth` and `requireTeamAccess(teamId)` using session and DB.
4. **Routes:** Mount auth API route; add sign-in and sign-up pages that submit to server actions (or equivalent).
5. **Sign-up action:** Validate input → create user → run “accept pending invitations” for that email → sign in → redirect to app.
6. **Sign-in action:** Optionally run “accept pending invitations” for that email (if user exists) → sign in → redirect to app.
7. **App layout:** Call `requireAuth()`; load user’s teams and render nav + children.
8. **Team layout:** Call `requireTeamAccess(teamId)`; render team context + children.
9. **Add member action:** Auth + team membership check → if user exists add member else create/update invitation (reuse row by (teamId, email)) → send email if pending → return state.
10. **Settings UI:** Form that calls add-member action; display pending invitations list and allow cancel; display success/error state from action.

### 8.5 Implementation Order Summary

1. Schema and migrations  
2. Auth provider + API route + session type  
3. Auth guards  
4. Sign-up and sign-in actions + pages  
5. Accept-pending-invitations helper (and optionally NextAuth signIn event)  
6. App and team layouts using guards  
7. Team creation and team-scoped data  
8. Add-member action + invitation table usage  
9. Invitation email (optional) and settings UI (invite form, pending list, cancel)

This order keeps auth and membership foundations first, then adds team and invite features on top.
