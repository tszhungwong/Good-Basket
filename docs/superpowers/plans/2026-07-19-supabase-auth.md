# Good Goods Supabase Authentication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add real email/password and Google authentication, registration, account navigation, and automatic profile creation.

**Architecture:** A focused auth repository wraps Supabase, pure validators own form rules, and two route screens share presentational auth components. Supabase Auth owns credentials while a database trigger creates the related application profile.

**Tech Stack:** Expo 57, React Native 0.86, Expo Router 57, TypeScript 6, Supabase JS 2.110, Jest, React Native Testing Library, PostgreSQL/RLS.

## Global Constraints

- Reuse the existing theme, `Button`, `FormField`, `IconButton`, and router patterns.
- Keep credentials only in Supabase Auth; never store password values in `public` tables.
- Persist sessions with the already-installed AsyncStorage package.
- Google client secrets stay in Supabase Dashboard configuration, never in source or public environment variables.
- All new behavior starts with a failing test and ends with focused and full-suite verification.

---

### Task 1: Authentication validation and repository

**Files:**
- Create: `src/features/auth/authValidation.test.ts`
- Create: `src/features/auth/authValidation.ts`
- Create: `src/features/auth/authRepository.test.ts`
- Create: `src/features/auth/authRepository.ts`

**Interfaces:**
- Produces: `validateEmail`, `validatePassword`, `validatePasswordConfirmation`, `AuthRepository`, and `createAuthRepository`.
- `AuthRepository` exposes `signInWithEmail`, `signInWithGoogle`, and `createAccount`.

- [ ] **Step 1: Write failing validation tests** for blank/malformed email, passwords shorter than eight characters, and mismatched confirmation.
- [ ] **Step 2: Run `npm test -- authValidation.test.ts`** and confirm failure because the module is missing.
- [ ] **Step 3: Implement pure validators** returning a string message or `null`.
- [ ] **Step 4: Run `npm test -- authValidation.test.ts`** and confirm all validation cases pass.
- [ ] **Step 5: Write failing repository tests** with a complete Supabase Auth test double and assertions for these calls:

```ts
signInWithPassword({ email: normalizedEmail, password })
signUp({ email: normalizedEmail, password })
signInWithOAuth({ provider: 'google', options: { redirectTo } })
```

- [ ] **Step 6: Run `npm test -- authRepository.test.ts`** and confirm failure because the repository is missing.
- [ ] **Step 7: Implement the repository** with injected client and redirect URL factory, returning `{ requiresEmailConfirmation: boolean }` from registration.
- [ ] **Step 8: Run both auth unit test files** and confirm green.

### Task 2: Persistent Supabase session

**Files:**
- Modify: `src/lib/supabase.ts`
- Modify: `src/lib/supabase.test.ts`

**Interfaces:**
- Consumes: `AsyncStorage` from the existing dependency.
- Produces: the same `getSupabaseClient()` interface with persistent auth storage.

- [ ] **Step 1: Add a failing client configuration test** that captures `createClient` options and expects `persistSession: true`, `autoRefreshToken: true`, and AsyncStorage.
- [ ] **Step 2: Run `npm test -- supabase.test.ts`** and confirm the existing `persistSession: false` fails the expectation.
- [ ] **Step 3: Configure the singleton client** with AsyncStorage and persistent token refresh.
- [ ] **Step 4: Run `npm test -- supabase.test.ts`** and confirm green.

### Task 3: Reusable authentication UI and sign-in screen

**Files:**
- Create: `src/features/auth/components/AuthPage.tsx`
- Create: `src/features/auth/components/PasswordField.tsx`
- Create: `src/features/auth/screens/SignInScreen.test.tsx`
- Create: `src/features/auth/screens/SignInScreen.tsx`
- Create: `app/sign-in.tsx`
- Modify: `app/_layout.tsx`

**Interfaces:**
- `AuthPage` renders the responsive market-poster composition and a form slot.
- `PasswordField` extends `FormFieldProps` minus `secureTextEntry` and exposes a visibility button.
- `SignInScreen` accepts optional `repository?: AuthRepository`.

- [ ] **Step 1: Write failing screen tests** for email login to `/account`, inline validation, Google login, password visibility, and navigation to `/create-account`.
- [ ] **Step 2: Run `npm test -- SignInScreen.test.tsx`** and confirm failure because the screen is missing.
- [ ] **Step 3: Implement shared auth components and sign-in screen** using the existing theme and controls, with loading and accessible error states.
- [ ] **Step 4: Add the thin Expo route and stack registration.**
- [ ] **Step 5: Run the sign-in tests** and confirm green.

### Task 4: Create-account screen

**Files:**
- Create: `src/features/auth/screens/CreateAccountScreen.test.tsx`
- Create: `src/features/auth/screens/CreateAccountScreen.tsx`
- Create: `app/create-account.tsx`
- Modify: `app/_layout.tsx`

**Interfaces:**
- `CreateAccountScreen` accepts optional `repository?: AuthRepository`.
- Successful registration with a session calls `router.replace('/account')`; confirmation-required registration renders a check-email state.

- [ ] **Step 1: Write failing tests** for mismatch blocking submission, direct account navigation, confirmation-required messaging, and return to sign in.
- [ ] **Step 2: Run `npm test -- CreateAccountScreen.test.tsx`** and confirm failure because the screen is missing.
- [ ] **Step 3: Implement the registration form** using the shared page and password field, normalizing email through the repository.
- [ ] **Step 4: Add the thin Expo route and stack registration.**
- [ ] **Step 5: Run the registration tests** and confirm green.

### Task 5: Account error sign-in action

**Files:**
- Modify: `src/components/ui/ScreenState.tsx`
- Modify: `src/components/ui/ScreenState.test.tsx`
- Modify: `src/features/account/screens/AccountScreen.tsx`
- Modify: `src/features/account/screens/AccountScreen.test.tsx`

**Interfaces:**
- Extend `ScreenState` with optional `secondaryActionLabel` and `onSecondaryAction`.

- [ ] **Step 1: Add failing component and account tests** expecting both actions and `/sign-in` navigation.
- [ ] **Step 2: Run the two focused test files** and confirm the secondary action is absent.
- [ ] **Step 3: Render paired actions in `ScreenState`** and provide `Sign in` from the account error state.
- [ ] **Step 4: Run the focused tests** and confirm green.

### Task 6: Auth profile database bootstrap

**Files:**
- Modify: `supabase/schema.sql`
- Modify: `src/test/databaseSchemas.test.ts`

**Interfaces:**
- Produces: private trigger function `private.handle_new_auth_user()` and trigger `on_auth_user_created` on `auth.users`.

- [ ] **Step 1: Add a failing schema assertion** for the trigger, normalized email-derived username, locked search path, and revoked public execution.
- [ ] **Step 2: Run `npm test -- databaseSchemas.test.ts`** and confirm the SQL contract is absent.
- [ ] **Step 3: Add idempotent SQL** that inserts an `account_profiles` row from each new Auth user without inserting or exposing credentials.
- [ ] **Step 4: Run the schema test** and confirm green.

### Task 7: Full verification and browser review

**Files:**
- Review all files above; no new production interface.

- [ ] **Step 1: Run `npm run typecheck`.** Expected exit code: 0.
- [ ] **Step 2: Run `npm run lint`.** Expected exit code: 0.
- [ ] **Step 3: Run `npm test`.** Expected: zero failed suites and tests.
- [ ] **Step 4: Preview `/account`, `/sign-in`, and `/create-account`** at mobile width and confirm both account-error actions, responsive layout, focusable inputs, provider action, validation, and route transitions.
- [ ] **Step 5: Review `git diff --check` and `git diff --stat`** for whitespace errors and scope drift.

### Task 8: Recover authenticated accounts with missing profiles

**Files:**
- Create: `src/features/account/accountRepository.test.ts`
- Modify: `src/features/account/accountRepository.ts`
- Modify: `src/features/account/screens/AccountScreen.test.tsx`
- Modify: `src/features/account/screens/AccountScreen.tsx`

**Interfaces:**
- `AccountProfile` adds the verified Auth `email` used only for display.
- `AccountRepository.getAccount()` retains its public signature.
- `createAccountRepository()` accepts the existing Supabase client and performs an idempotent
  owner-scoped `account_profiles` upsert only when the overview has no profile.

- [ ] **Step 1: Write failing repository tests** for an existing profile, missing-profile recovery,
  an absent Auth user, and a failed profile upsert.
- [ ] **Step 2: Run `npm test -- accountRepository.test.ts`** and confirm the missing-profile test
  fails because the repository currently parses the empty overview immediately.
- [ ] **Step 3: Implement verified-user lookup, deterministic profile defaults, idempotent upsert,
  one RPC retry, and email enrichment.**
- [ ] **Step 4: Run `npm test -- accountRepository.test.ts`** and confirm all cases pass.
- [ ] **Step 5: Add a failing AccountScreen assertion** for `Signed in as jamie@example.com`.
- [ ] **Step 6: Run `npm test -- AccountScreen.test.tsx`** and confirm the identity line is absent.
- [ ] **Step 7: Render the email under the profile name** using the existing typography and muted
  color tokens.
- [ ] **Step 8: Run focused tests, typecheck, lint, the full suite, and reload `/account` in the web
  preview** to confirm the profile is created and the authenticated account renders.
