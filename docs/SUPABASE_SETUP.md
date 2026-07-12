# Supabase Setup

## Focused V1

Create a Supabase project and apply `supabase/schema.sql` in the SQL editor. The script is idempotent and creates:

- `categories`
- `products`
- `store_settings`
- `orders`
- `order_items`
- catalog read policies
- updated-at triggers
- the transactional `create_order` function
- seed catalog and store settings for the Supabase-backed app

The public client can read active catalog data and store settings. It cannot read customer orders or write directly to order tables. Order submission is available only through `create_order`.

The function calculates prices from current product rows, aggregates duplicate product IDs, locks inventory rows, checks stock, writes item snapshots, decrements stock, and returns the order result. Client-supplied prices and totals are ignored.

Seed inserts update category, product, and store-setting fields from the seed data. Reapplying the setup script still preserves operational stock values because product stock is inserted for new rows but not overwritten during product upserts.

## Environment

Create a local `.env` file:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Only use the Supabase publishable key in Expo. Do not place service-role or other secret keys in any `EXPO_PUBLIC_` variable.

Restart the Expo process after changing `.env`.

The app creates its public Supabase client in `src/lib/supabase.ts`. Shared table operations live in `src/lib/database.ts`:

- `queryTable(table, options)`
- `insertIntoTable(table, values, options)`
- `updateTable(table, values, filters, options)`
- `deleteFromTable(table, filters, options)`

These helpers use the public client by default and support dependency injection for tests.

## Applying Schema SQL

The publishable key can read and write only what RLS and grants allow. It cannot create tables, functions, triggers, or policies. Apply `supabase/schema.sql` with one privileged path:

```bash
supabase link --project-ref atwfsgvcrbmfcycvfrfa
supabase db query --linked --file supabase/schema.sql
```

Alternatively, run the same file through the Supabase SQL editor or use `supabase db query --db-url "<postgres-connection-string>" --file supabase/schema.sql`.

## Verification

After applying the schema:

1. Confirm the four categories and eight products exist.
2. Confirm an anonymous client can select active products.
3. Confirm an anonymous client cannot select `orders` or `order_items`.
4. Place one order through the app.
5. Confirm one order and its item snapshots exist.
6. Confirm ordered product stock decreased by the submitted quantity.

## Future Features

`supabase/future_features_schema.sql` is deliberately separate. It depends on the focused schema and adds structures for:

- Supabase Auth profiles and customer/seller/admin roles
- saved delivery addresses
- product variants
- inventory movement history
- order-status history
- customer-owned order reads
- seller management policies

Authenticated orders are linked to the current profile by an insert trigger, which makes customer-owned order reads work without changing the v1 order RPC. Only an admin profile can assign or change roles. Sellers can read saved addresses for fulfillment, but only customers can change their own saved addresses.

Do not apply the future schema until authentication and seller-management application features are implemented and tested. Applying it early would expose unused policy and role surfaces that the focused app cannot manage.

The future schema never inserts Auth users. User creation must remain in Supabase Auth.

## Security References

- [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Database functions](https://supabase.com/docs/guides/database/functions)
- [Function execution privileges](https://supabase.com/docs/guides/troubleshooting/how-can-i-revoke-execution-of-a-postgresql-function-2GYb0A)
