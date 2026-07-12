# Combined Commerce App Design

## Goal

Build a focused customer-facing commerce app that combines the polished storefront experience from `ecommerce App` with the Expo Router, model, and cart structure from `ProductSellingApp`. The app must run on Android, iOS, and web, work immediately without backend credentials, and become Supabase-backed through environment configuration without changing screen code.

## Safety Boundary

- Do not modify any file under `C:\Users\user\OneDrive\Documents\Project\ecommerce App`.
- Do not modify any file under `C:\Users\user\OneDrive\Documents\Project\ProductSellingApp`.
- Create all source, configuration, documentation, tests, and database files under `C:\Users\user\OneDrive\Documents\Project\CombinedApp`.

## Product Scope

The focused v1 includes:

- A storefront with a featured product, delivery summary, search, category filtering, and sorting.
- Product cards with price, unit, rating, stock, delivery estimate, badge, and image.
- A product-detail screen.
- A persistent cart with add, remove, and quantity controls.
- A checkout form for customer contact and delivery information.
- Order submission and an order-confirmation screen.
- Mock mode for immediate local use and Supabase mode when public environment variables are configured.

The focused v1 excludes authentication, payment processing, order history, and seller administration.

## Technology

- Expo and React Native with TypeScript.
- Expo Router for file-based navigation.
- React Context plus a reducer for cart state.
- AsyncStorage for cart and mock-order persistence.
- Supabase JavaScript client for production catalog and order access.
- React Native primitives and Expo vector icons for universal UI.
- Jest-compatible pure unit tests for filtering, sorting, cart calculations, and order mapping.

The official shadcn React package targets browser DOM primitives and cannot render directly in native React Native screens. The implementation will use the shadcn skill for component composition, variants, naming, and accessibility conventions, then implement the small required component set with React Native primitives. This preserves the requested design approach without adding a second browser-only UI tree.

## Visual Direction

The product is named **Good Goods**, a neighborhood market for fresh food, pantry items, bakery goods, and practical home products. The visual system uses paper white and charcoal for clarity, leaf green for primary actions, tomato red for cart emphasis, and restrained brass for ratings and delivery details.

The storefront borrows the strongest ideas from the web source: compact sticky identity, prominent search, category pills, an image-led featured product, scannable product cards, and a persistent cart summary. Corners stay at or below 8 px, touch targets are at least 44 px, spacing follows a 4/8 px rhythm, and text remains readable with larger system font settings. Layouts use responsive width constraints so web and tablet views do not stretch phone-oriented content excessively.

## Architecture

```text
CombinedApp/
|-- app/                         Expo Router route files only
|-- src/
|   |-- components/ui/           Small reusable React Native UI primitives
|   |-- features/catalog/        Product model, repository, selectors, and catalog UI
|   |-- features/cart/           Cart model, reducer, provider, storage, and cart UI
|   |-- features/checkout/       Checkout model, repository, validation, and form UI
|   |-- data/                    Data-only files named mock_*.ts
|   |-- lib/                     Supabase client and environment helpers
|   |-- theme/                   Color, spacing, typography, and layout tokens
|   `-- test/                    Shared test setup
|-- supabase/
|   |-- schema.sql               Executable schema required by focused v1
|   `-- future_features_schema.sql
|                                 Separate schema for deferred auth/admin features
`-- docs/                        Setup, architecture, and workflow documentation
```

Route files only parse parameters and render feature screens. Business rules remain in feature modules. Each feature owns its types and repository contract so mock and Supabase implementations can be exchanged without conditional logic in components.

## Core Components

Shared UI is intentionally small:

- `Button` supports primary, secondary, outline, ghost, and icon variants.
- `Badge` presents product and availability states.
- `IconButton` provides stable, accessible square controls.
- `QuantityStepper` owns quantity interaction and remove-at-one behavior.
- `EmptyState`, `LoadingState`, and `ErrorState` provide consistent screen feedback.

Feature-specific components remain with their feature, including `ProductCard`, `FeaturedProduct`, `CategoryFilter`, `SortMenu`, `CartItemRow`, and `CheckoutForm`.

## Data Flow

At startup, the app chooses one repository mode:

1. If `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` exist, catalog reads and order submission use Supabase.
2. If either value is absent, the app uses data-only mock files and stores submitted orders locally with AsyncStorage.
3. A runtime Supabase error is shown to the user with retry support; it does not silently switch production data to mock data.

The catalog repository returns categories, products, and store settings. Pure selectors apply search, category, and sort choices. The cart reducer updates items and derived totals, while its storage adapter persists only the serializable cart payload. Checkout validation produces a normalized order request. The order repository either invokes the Supabase `create_order` function or creates the same response shape in local storage. The confirmation route receives only the resulting order identifier.

## Implemented Database Schema

`supabase/schema.sql` will be idempotent and contain only focused-v1 requirements:

- `categories` for data-driven filtering and display order.
- `products` for catalog content, images, tags, prices, stock, ratings, delivery estimates, badges, featured state, and active state.
- `store_settings` for currency, delivery fee, delivery estimate text, and minimum-order configuration.
- `orders` for customer contact, delivery details, totals, status, order number, and timestamps.
- `order_items` for immutable product-name, unit, price, and quantity snapshots linked to each order.
- Public read policies for active categories, products, and store settings.
- No public read access to customer orders or order items.
- A transactional `create_order` RPC that validates product availability, calculates prices from server data, writes the order and item snapshots, adjusts stock, and returns the order result.
- Seed data aligned with the local mock catalog so both repository modes present the same experience.

The app does not trust client-submitted prices or totals in Supabase mode.

## Future Database Schema

`supabase/future_features_schema.sql` will be a separate, executable extension for features that are deliberately not implemented in focused v1:

- Customer and seller `profiles` linked to Supabase Auth.
- Saved customer delivery addresses.
- Product variants and variant-level inventory.
- Inventory movement history for seller adjustments.
- Order status history for customer tracking and seller operations.
- Role-aware row-level security and seller-management policies.
- Updated timestamps and supporting indexes required by those tables.

The file will clearly state that it depends on `schema.sql` and must not be applied until the corresponding auth/admin application features are developed.

## Error Handling

- Catalog loading shows a stable loading state, then either content, an empty result, or a retryable error.
- Cart persistence failures do not discard in-memory items; a non-blocking message explains that persistence is unavailable.
- Checkout validates name, phone, address, and cart contents before submission.
- The submit button is disabled while submitting to prevent duplicate orders.
- Supabase errors are mapped to short customer-facing messages while technical details remain available to development logs.
- Product stock is checked again by the database transaction to handle concurrent orders.

## Testing and Verification

- Unit tests cover catalog search/filter/sort, cart add/update/remove/totals, checkout validation, and repository data mapping.
- TypeScript runs in strict mode.
- Lint and test scripts run from the project root.
- Expo web is smoke-tested at phone and desktop widths.
- Main storefront, product detail, cart, checkout, empty, loading, and error states are visually checked for overlap and accessibility.
- A final hash comparison verifies that both original source folders remain unchanged.

## Success Criteria

- The app can be installed and run from `CombinedApp` without Supabase credentials.
- A user can browse, search, filter, sort, inspect a product, manage a persistent cart, submit checkout details, and reach order confirmation.
- Adding Supabase environment values switches the same screens to database-backed catalog and order behavior.
- No placeholder interactions, empty handlers, duplicated models, or browser-only persistence remain.
- The code stays feature-oriented, data-driven, and small enough that each file has one clear responsibility.
