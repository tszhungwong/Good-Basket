# Good Goods

Good Goods is a focused Expo commerce app for Android, iOS, and web. It includes a storefront, search, category filters, sorting, product details, a persistent cart, checkout validation, local order creation, and optional Supabase catalog/order storage.

## Requirements

- Node.js 22.13 or newer. Node.js 24 is supported.
- npm.
- Expo Go or a native simulator for mobile testing.

## Install and Run

```powershell
npm install
npm start
```

Platform shortcuts:

```powershell
npm run web
npm run android
npm run ios
```

The app starts in mock mode when Supabase values are absent. Products come from `src/data/mock_catalog.ts`, the cart is stored under `good-goods.cart.v1`, and submitted mock orders are stored under `good-goods.orders.v1` with AsyncStorage.

## Supabase Mode

1. Apply `supabase/schema.sql` to a Supabase project.
2. Create `.env` from `.env.example`.
3. Set the project URL and publishable key.
4. Restart Expo so public environment values are bundled.

```dotenv
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

When both values exist, the same screens use Supabase for catalog reads and the transactional `create_order` RPC. Runtime database failures are shown to the customer and do not silently switch back to mock data.

Do not apply `supabase/future_features_schema.sql` yet. It is a separate extension for deferred authentication and seller-management features.

## Quality Commands

```powershell
npm test
npm run typecheck
npm run lint
npx expo export --platform web
```

## Project Structure

```text
app/                         Expo Router route adapters
src/components/ui/           Shared native UI primitives
src/data/                    Data-only mock files
src/features/catalog/        Catalog model, repository, provider, UI, and screens
src/features/cart/           Cart reducer, storage, provider, UI, and screen
src/features/checkout/       Validation, order repositories, and checkout screens
src/lib/                     Environment, formatting, and Supabase client helpers
src/theme/                   Semantic visual tokens
supabase/schema.sql          Focused-v1 database and seed data
supabase/future_features_schema.sql
                             Deferred auth/admin database extension
docs/                        Design, architecture, and backend setup notes
```

See `docs/ARCHITECTURE.md` for data flow and `docs/SUPABASE_SETUP.md` for database details.
