# Good Goods Supabase Authentication Design

## Goal

Add real Supabase email/password and Google authentication to Good Goods, with dedicated sign-in and account-creation routes and a clear path from the account loading error.

## User flow

- The account error state presents `Try again` and `Sign in` together.
- `Sign in` opens `/sign-in`.
- Email sign-in authenticates through Supabase and replaces the route with `/account`.
- Google sign-in starts Supabase OAuth with `/account` as the approved return destination.
- `Create an account` opens `/create-account`.
- Registration requires a valid email, a password of at least eight characters, and a matching confirmation.
- If registration returns a session, the user goes directly to `/account`.
- If email confirmation is enabled and no session is returned, the page presents a `Check your email` state with a route back to sign in.

## Architecture

`authRepository.ts` owns the Supabase calls and maps provider errors to user-safe messages. `authValidation.ts` contains pure validation functions. The sign-in and registration screens receive an optional repository for isolated tests and use reusable page, field, button, and password-input components. Expo Router route files remain thin exports.

The existing Supabase client will persist sessions with AsyncStorage so authenticated account requests continue to work after navigation and reload. No service-role key or Google client secret enters the application bundle.

## Visual direction

The reference image contributes its poster-over-form composition, strong title hierarchy, outlined fields, and quiet account prompt. Good Goods keeps its established grocery identity:

- Market green `#047857`, deep green `#065F46`, garden canvas `#F4F6F1`, white surface `#FFFFFF`, and brass `#9A5A08`.
- Rubik is used for display headings and Nunito Sans for fields, actions, and supporting copy.
- A compact illustrated market shelf built from produce-colored geometric forms is the signature element. It replaces the clothing photograph and makes the page specific to grocery shopping.
- Mobile uses a stacked poster and form; wider web layouts place them side by side inside the existing maximum content width.

## Database design

Supabase Auth remains the source of credentials in `auth.users`; passwords are never copied into public tables. A trigger creates one `public.account_profiles` record after every new Auth user. The profile derives its display name and collision-resistant username from safe user metadata or the email prefix. The trigger function lives in the non-exposed `private` schema, uses a locked search path, and has all client execution privileges revoked.

Existing ownership-based RLS policies remain responsible for account profile reads and updates. No fake Auth user is inserted because Auth user records must be created through Supabase Auth, where passwords are hashed and confirmation policy is applied correctly.

## Error handling

- Missing Supabase configuration produces a direct configuration message.
- Invalid credentials use a neutral message that does not disclose whether an account exists.
- OAuth provider configuration errors remain visible enough to guide project setup.
- Form validation occurs before network calls and keeps errors next to the relevant field.
- Buttons disable while requests are pending to prevent duplicate submissions.

### Missing profile recovery

The database trigger remains the primary profile-creation path. For an authenticated user whose
`account_profiles` row predates the trigger or was otherwise not created, the account repository
uses the verified Supabase Auth user to create that user's own profile through the existing
ownership RLS policy, then retries `get_account_overview`. The recovery is idempotent and never
overwrites an existing profile. The account card displays `Signed in as <email>` directly beneath
the display name so the active identity is clear.

## Testing

- Pure validation tests cover required, malformed, short, and mismatched values.
- Repository tests cover email sign-in, registration with and without a session, Google OAuth redirect options, and provider errors.
- Screen tests cover successful navigation, inline errors, password visibility, Google sign-in, registration navigation, and the email-confirmation state.
- Account screen regression coverage verifies the new `Sign in` action.
- Schema tests verify the Auth profile trigger and its RLS-safe shape.

## External setup

Google OAuth requires the Google provider to be enabled in Supabase and the local/deployed application URLs to be added to the Supabase redirect allow list. The application cannot safely configure the Google client secret itself.
