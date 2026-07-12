# Architecture

## Boundaries

Route files in `app/` are intentionally thin. They parse route parameters and render feature screens. UI, state, models, and backend access remain under `src/features`.

Each feature owns one concern:

- `catalog` defines the canonical product shape, search/sort selectors, repository, loading provider, product UI, and storefront/detail screens.
- `cart` stores small product snapshots in a reducer and persists them through one AsyncStorage adapter.
- `checkout` validates customer input and maps a cart to a quantity-only order request. Its repository submits that request through Supabase.

Shared `src/components/ui` components provide semantic variants and accessibility behavior. They are built with React Native primitives, so there is no parallel browser-only component tree.

## Repository Selection

`getSupabaseClient()` returns a client only when both public environment values exist. `createCatalogRepository()` and `createOrderRepository()` receive that result once and require Supabase:

```text
Environment configured?
  yes -> Supabase catalog + create_order RPC
  no  -> configuration error shown by the screen
```

Screens consume repository contracts through providers or a small factory. They do not inspect environment variables and do not contain database branching.

## Customer Flow

```text
CatalogProvider loads catalog
  -> Storefront selects visible products
  -> CartProvider stores product snapshots
  -> Checkout validates customer details
  -> OrderRepository creates Supabase order
  -> Cart clears
  -> Confirmation receives serializable order result
```

The Supabase RPC receives only product IDs and quantities. It locks product rows, verifies current stock, calculates current prices and delivery fee, saves immutable item snapshots, and adjusts stock in one transaction.

## Adding a Product Field

1. Add the property once to `Product` in `catalogTypes.ts`.
2. Add the database column to `supabase/schema.sql`.
3. Add the data value to the SQL seed.
4. Map the database row in `catalogRepository.ts`.
5. Render the value only in the feature component that owns it.
6. Update selector or repository tests when the field affects behavior.

Do not create a second product model for a screen or backend adapter.

## Persistence Keys

- Cart: `good-goods.cart.v1`
Versioned keys allow a later migration without guessing the shape of existing device data.
