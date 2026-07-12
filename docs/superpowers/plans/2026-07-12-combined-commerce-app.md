# Combined Commerce App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the focused Good Goods storefront, persistent cart, checkout, mock/Supabase repositories, and current/future database schemas in `CombinedApp` without changing either source project.

**Architecture:** Expo Router route files render feature-owned React Native screens. Catalog, cart, and checkout features expose small typed interfaces; repository factories select mock or Supabase behavior once from environment configuration, so UI components contain no backend branching.

**Tech Stack:** Expo, React Native, TypeScript, Expo Router, AsyncStorage, Supabase JavaScript client, Expo vector icons, Jest with `jest-expo`, and React Native `StyleSheet` components shaped by ui-ux-pro-max and shadcn composition guidance.

## Global Constraints

- Do not modify any file under `C:\Users\user\OneDrive\Documents\Project\ecommerce App`.
- Do not modify any file under `C:\Users\user\OneDrive\Documents\Project\ProductSellingApp`.
- Create every source, configuration, test, documentation, and schema file under `C:\Users\user\OneDrive\Documents\Project\CombinedApp`.
- Support Android, iOS, and web from one Expo/React Native source tree.
- Run without Supabase credentials by selecting mock mode only when public environment values are absent.
- Keep mock files data-only and name them with the `mock_` prefix.
- Do not add authentication, payments, order history, or seller UI to focused v1.
- Put deferred authentication and seller schema in one separate `supabase/future_features_schema.sql` file.
- Keep files feature-oriented, interactions complete, TypeScript strict, and touch targets at least 44 px.

---

## File Map

```text
app/
  _layout.tsx
  index.tsx
  cart.tsx
  checkout.tsx
  order-confirmation.tsx
  products/[id].tsx
src/
  components/ui/{Badge,Button,IconButton,ScreenState}.tsx
  data/mock_catalog.ts
  features/catalog/
    catalogTypes.ts
    catalogSelectors.ts
    catalogSelectors.test.ts
    catalogRepository.ts
    CatalogProvider.tsx
    components/{CategoryFilter,FeaturedProduct,ProductCard,SearchField,SortMenu}.tsx
    screens/{ProductDetailScreen,StorefrontScreen}.tsx
  features/cart/
    cartTypes.ts
    cartReducer.ts
    cartReducer.test.ts
    cartStorage.ts
    CartProvider.tsx
    components/{CartItemRow,QuantityStepper}.tsx
    screens/CartScreen.tsx
  features/checkout/
    checkoutTypes.ts
    checkoutValidation.ts
    checkoutValidation.test.ts
    orderRepository.ts
    orderRepository.test.ts
    screens/{CheckoutScreen,OrderConfirmationScreen}.tsx
  lib/{env,format,supabase}.ts
  theme/{colors,layout,spacing,typography}.ts
supabase/{schema,future_features_schema}.sql
docs/{ARCHITECTURE,SUPABASE_SETUP}.md
```

### Task 1: Expo Foundation and Shared UI System

**Files:**
- Create: `package.json`
- Create: `package-lock.json` through npm
- Create: `app.json`
- Create: `expo-env.d.ts`
- Create: `tsconfig.json`
- Create: `eslint.config.js`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `src/theme/colors.ts`
- Create: `src/theme/spacing.ts`
- Create: `src/theme/typography.ts`
- Create: `src/theme/layout.ts`
- Create: `src/lib/env.ts`
- Create: `src/lib/format.ts`
- Create: `src/lib/supabase.ts`
- Create: `src/components/ui/Button.tsx`
- Create: `src/components/ui/IconButton.tsx`
- Create: `src/components/ui/Badge.tsx`
- Create: `src/components/ui/ScreenState.tsx`

**Interfaces:**
- Produces: `colors`, `spacing`, `typography`, `layout`; `formatCurrency(value, currency)`; `isSupabaseConfigured`; `getSupabaseClient()`; and shared UI primitives used by all later tasks.

- [ ] **Step 1: Generate and record the visual design direction**

Run the ui-ux-pro-max design-system and React Native stack searches for `local market ecommerce mobile clean editorial accessible`, then save the selected palette, spacing, typography, component, and accessibility decisions in `docs/DESIGN_SYSTEM.md`. The chosen semantic colors must include `canvas`, `surface`, `ink`, `muted`, `line`, `brand`, `brandPressed`, `accent`, `accentSoft`, `brass`, `success`, `danger`, and `scrim`.

- [ ] **Step 2: Inspect shadcn composition guidance**

Use the shadcn skill to confirm Button, Badge, empty-state, and form composition. Implement only equivalent React Native primitives; do not install DOM-based `@base-ui/react`, Radix, or shadcn runtime packages.

- [ ] **Step 3: Create the Expo package and install compatible dependencies**

Start from this package contract, then use `npm install expo@latest` and `npx expo install` so Expo selects compatible React and React Native versions:

```json
{
  "name": "combined-app",
  "version": "1.0.0",
  "private": true,
  "main": "expo-router/entry",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "lint": "expo lint",
    "typecheck": "tsc --noEmit",
    "test": "jest --runInBand"
  },
  "jest": {
    "preset": "jest-expo",
    "testMatch": ["**/*.test.ts"]
  }
}
```

Run:

```powershell
npm install expo@latest
npx expo install react react-dom react-native react-native-web expo-router expo-status-bar expo-linking expo-constants expo-splash-screen react-native-safe-area-context react-native-screens @expo/vector-icons @react-native-async-storage/async-storage
npm install @supabase/supabase-js react-native-url-polyfill
npm install --save-dev typescript @types/react eslint eslint-config-expo jest jest-expo @types/jest
```

Expected: npm completes without incompatible Expo peer-dependency errors and creates `package-lock.json`.

- [ ] **Step 4: Configure Expo, TypeScript, linting, and environment values**

Use Expo Router typed routes, strict TypeScript, the `@/* -> src/*` alias, portrait orientation, and web Metro bundling. `.env.example` contains only:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

`getSupabaseClient()` must return `null` when either variable is absent and lazily create one client when both exist. It must import `react-native-url-polyfill/auto` before Supabase.

- [ ] **Step 5: Implement tokens and shared primitives**

Use these public props:

```ts
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
export type ButtonProps = PressableProps & {
  label: string;
  icon?: ComponentProps<typeof Ionicons>['name'];
  loading?: boolean;
  variant?: ButtonVariant;
};

export type BadgeTone = 'brand' | 'accent' | 'neutral' | 'success';
export type BadgeProps = { label: string; tone?: BadgeTone };
```

`Button` and `IconButton` must expose disabled/loading accessibility state, use stable 44 px minimum hit areas, and change opacity/background without layout movement. `ScreenState` accepts `icon`, `title`, `message`, and optional retry action.

- [ ] **Step 6: Verify and commit the foundation**

Run:

```powershell
npm run typecheck
npm run lint
```

Expected: both commands exit 0.

Commit:

```powershell
git add package.json package-lock.json app.json expo-env.d.ts tsconfig.json eslint.config.js .gitignore .env.example src docs/DESIGN_SYSTEM.md
git commit -m "chore: establish Expo app foundation"
```

### Task 2: Catalog Domain, Data, and Repository

**Files:**
- Create: `src/features/catalog/catalogTypes.ts`
- Create: `src/features/catalog/catalogSelectors.ts`
- Create: `src/features/catalog/catalogSelectors.test.ts`
- Create: `src/data/mock_catalog.ts`
- Create: `src/features/catalog/catalogRepository.ts`
- Create: `src/features/catalog/CatalogProvider.tsx`

**Interfaces:**
- Consumes: `getSupabaseClient()` from Task 1.
- Produces: `Product`, `Category`, `StoreSettings`, `CatalogData`, `CatalogSort`, `CatalogRepository`, `selectProducts()`, `CatalogProvider`, and `useCatalog()`.

- [ ] **Step 1: Write failing catalog selector tests**

```ts
import { selectProducts } from './catalogSelectors';
import type { Product } from './catalogTypes';

const products: Product[] = [
  { id: '1', slug: 'tomato', name: 'Organic Tomatoes', description: 'Fresh salad tomatoes', categoryId: 'fresh', categoryName: 'Fresh', price: 4.5, unit: 'lb', imageUrl: 'tomato.jpg', rating: 4.8, stock: 8, deliveryMinutes: 20, tags: ['salad'], badge: 'Fresh', featured: false },
  { id: '2', slug: 'oil', name: 'Olive Oil', description: 'Pantry cooking oil', categoryId: 'pantry', categoryName: 'Pantry', price: 18, unit: '500 ml', imageUrl: 'oil.jpg', rating: 4.6, stock: 4, deliveryMinutes: 30, tags: ['cooking'], badge: null, featured: true },
];

test('filters by search text and category', () => {
  expect(selectProducts(products, { categoryId: 'fresh', query: 'salad', sort: 'recommended' })).toEqual([products[0]]);
});

test('sorts low price without mutating source data', () => {
  const result = selectProducts(products, { categoryId: 'all', query: '', sort: 'price-low' });
  expect(result.map(({ id }) => id)).toEqual(['1', '2']);
  expect(products.map(({ id }) => id)).toEqual(['1', '2']);
});
```

- [ ] **Step 2: Run the tests and confirm the missing-module failure**

Run: `npm test -- catalogSelectors.test.ts`

Expected: FAIL because `catalogSelectors` and catalog types do not exist.

- [ ] **Step 3: Implement catalog types and selectors**

Use these exact types:

```ts
export type CatalogSort = 'recommended' | 'price-low' | 'fastest' | 'popular';
export type Category = { id: string; name: string; sortOrder: number };
export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  categoryId: string;
  categoryName: string;
  price: number;
  unit: string;
  imageUrl: string;
  rating: number;
  stock: number;
  deliveryMinutes: number;
  tags: string[];
  badge: string | null;
  featured: boolean;
};
export type StoreSettings = { currency: string; deliveryFee: number; deliveryMessage: string; minimumOrder: number };
export type CatalogData = { categories: Category[]; products: Product[]; settings: StoreSettings };
```

`selectProducts()` normalizes the query once, matches name/description/tags, filters `all` or one category, copies the array, and applies the four supported sort modes.

- [ ] **Step 4: Add data-only mock catalog and repository adapters**

`mock_catalog.ts` exports only `mockCategories`, `mockProducts`, and `mockStoreSettings`; it defines no types or functions. Include at least six realistic products across Fresh, Pantry, Bakery, and Home, with one featured product and valid image URLs.

`CatalogRepository` has one method:

```ts
export interface CatalogRepository {
  getCatalog(): Promise<CatalogData>;
}
export function createCatalogRepository(): CatalogRepository;
```

Mock mode returns a defensive copy after a short delay. Supabase mode reads `categories`, active `products` joined to category name, and `store_settings`; it maps numeric database strings to numbers and throws a descriptive error when any query fails.

- [ ] **Step 5: Add a single catalog provider**

`CatalogProvider` loads once, exposes `{ data, error, loading, retry }`, ignores state updates after unmount, and makes `useCatalog()` throw when used outside the provider. It must not duplicate repository selection in screens.

- [ ] **Step 6: Run catalog tests, full checks, and commit**

Run:

```powershell
npm test -- catalogSelectors.test.ts
npm run typecheck
npm run lint
```

Expected: all commands exit 0.

Commit:

```powershell
git add src/data src/features/catalog
git commit -m "feat: add catalog domain and repositories"
```

### Task 3: Persistent Cart Domain

**Files:**
- Create: `src/features/cart/cartTypes.ts`
- Create: `src/features/cart/cartReducer.ts`
- Create: `src/features/cart/cartReducer.test.ts`
- Create: `src/features/cart/cartStorage.ts`
- Create: `src/features/cart/CartProvider.tsx`

**Interfaces:**
- Consumes: `Product` from Task 2 and AsyncStorage.
- Produces: `CartLine`, `CartState`, `cartReducer()`, `getCartSummary()`, `CartProvider`, and `useCart()`.

- [ ] **Step 1: Write failing cart reducer tests**

```ts
import { cartReducer, getCartSummary, initialCartState } from './cartReducer';
import type { Product } from '@/features/catalog/catalogTypes';

const product: Product = { id: '1', slug: 'tomato', name: 'Tomatoes', description: 'Fresh', categoryId: 'fresh', categoryName: 'Fresh', price: 4.5, unit: 'lb', imageUrl: 'tomato.jpg', rating: 4.8, stock: 2, deliveryMinutes: 20, tags: [], badge: null, featured: false };

test('adds, increments, and clamps a line to stock', () => {
  let state = cartReducer(initialCartState, { type: 'add', product });
  state = cartReducer(state, { type: 'add', product });
  state = cartReducer(state, { type: 'add', product });
  expect(state.items[0].quantity).toBe(2);
});

test('removes a line when quantity becomes zero', () => {
  const added = cartReducer(initialCartState, { type: 'add', product });
  expect(cartReducer(added, { type: 'set-quantity', productId: '1', quantity: 0 }).items).toEqual([]);
});

test('calculates item count and subtotal', () => {
  const state = cartReducer(initialCartState, { type: 'add', product });
  expect(getCartSummary(state)).toEqual({ itemCount: 1, subtotal: 4.5 });
});
```

- [ ] **Step 2: Run the tests and confirm the missing-module failure**

Run: `npm test -- cartReducer.test.ts`

Expected: FAIL because cart modules do not exist.

- [ ] **Step 3: Implement cart snapshots and pure reducer**

Use a stable product snapshot so persistence is independent of catalog object identity:

```ts
export type CartLine = {
  productId: string;
  name: string;
  imageUrl: string;
  price: number;
  unit: string;
  stock: number;
  quantity: number;
};
export type CartState = { hydrated: boolean; items: CartLine[] };
```

Actions are `hydrate`, `add`, `set-quantity`, `remove`, and `clear`. `set-quantity` removes at zero and clamps positive values to stock. `getCartSummary()` derives item count and subtotal without storing duplicate totals.

- [ ] **Step 4: Implement AsyncStorage adapter and provider**

Persist under `good-goods.cart.v1`. Validate loaded JSON as an array of lines with string IDs and positive finite quantities; invalid data returns an empty cart. `CartProvider` exposes `addProduct`, `setQuantity`, `removeProduct`, `clearCart`, `items`, `itemCount`, `subtotal`, `hydrated`, and an optional non-blocking `storageError`.

- [ ] **Step 5: Run cart tests, full checks, and commit**

Run:

```powershell
npm test -- cartReducer.test.ts
npm run typecheck
npm run lint
```

Expected: all commands exit 0.

Commit:

```powershell
git add src/features/cart
git commit -m "feat: add persistent cart state"
```

### Task 4: Checkout Validation and Order Repositories

**Files:**
- Create: `src/features/checkout/checkoutTypes.ts`
- Create: `src/features/checkout/checkoutValidation.ts`
- Create: `src/features/checkout/checkoutValidation.test.ts`
- Create: `src/features/checkout/orderRepository.ts`
- Create: `src/features/checkout/orderRepository.test.ts`

**Interfaces:**
- Consumes: cart lines and store settings.
- Produces: `CheckoutDetails`, `CheckoutErrors`, `OrderRequest`, `OrderResult`, `validateCheckout()`, `buildOrderRequest()`, `OrderRepository`, and `createOrderRepository()`.

- [ ] **Step 1: Write failing validation and mapping tests**

```ts
import { buildOrderRequest, validateCheckout } from './checkoutValidation';

test('requires name, phone, and address', () => {
  expect(validateCheckout({ fullName: '', phone: '', email: '', address: '', note: '' })).toEqual({
    fullName: 'Enter your name.',
    phone: 'Enter your phone number.',
    address: 'Enter a delivery address.',
  });
});

test('rejects malformed optional email', () => {
  expect(validateCheckout({ fullName: 'Ari Lee', phone: '0912345678', email: 'bad', address: '1 Market Road', note: '' }).email).toBe('Enter a valid email address.');
});

test('maps cart lines to quantity-only order items', () => {
  expect(buildOrderRequest(
    { fullName: ' Ari Lee ', phone: ' 0912345678 ', email: '', address: ' 1 Market Road ', note: ' door ' },
    [{ productId: 'p1', name: 'Tomato', imageUrl: '', price: 4.5, unit: 'lb', stock: 4, quantity: 2 }],
  ).items).toEqual([{ productId: 'p1', quantity: 2 }]);
});
```

- [ ] **Step 2: Run tests and confirm the missing-module failure**

Run: `npm test -- checkoutValidation.test.ts`

Expected: FAIL because checkout modules do not exist.

- [ ] **Step 3: Implement normalized checkout types and validation**

```ts
export type CheckoutDetails = { fullName: string; phone: string; email: string; address: string; note: string };
export type CheckoutErrors = Partial<Record<keyof CheckoutDetails, string>>;
export type OrderRequest = { customer: CheckoutDetails; items: Array<{ productId: string; quantity: number }> };
export type OrderResult = { id: string; orderNumber: string; subtotal: number; deliveryFee: number; total: number; currency: string };
```

Trim all fields, require name/phone/address, validate email only when present, reject empty carts, and never include client prices in the Supabase payload.

- [ ] **Step 4: Implement local and Supabase order adapters**

```ts
export interface OrderRepository {
  createOrder(request: OrderRequest, catalog: CatalogData): Promise<OrderResult>;
}
export function createOrderRepository(): OrderRepository;
```

Local mode validates current products and stock, computes subtotal and delivery fee from catalog data, creates `GG-YYYYMMDD-XXXX`, and appends the complete request/result record to `good-goods.orders.v1` in AsyncStorage. Supabase mode calls `create_order` with customer fields and JSON items, maps its single returned row to `OrderResult`, and exposes a customer-safe error while logging the original error in development.

- [ ] **Step 5: Test local order calculations**

Mock AsyncStorage, submit two items, and assert that subtotal, configured delivery fee, total, currency, and persisted order number match. Also assert that unavailable product IDs reject with `One or more products are unavailable.`

- [ ] **Step 6: Run checkout tests, full checks, and commit**

Run:

```powershell
npm test -- checkout
npm run typecheck
npm run lint
```

Expected: all commands exit 0.

Commit:

```powershell
git add src/features/checkout
git commit -m "feat: add checkout and order repositories"
```

### Task 5: Complete Storefront, Cart, and Checkout UI

**Files:**
- Create: `app/_layout.tsx`
- Create: `app/index.tsx`
- Create: `app/products/[id].tsx`
- Create: `app/cart.tsx`
- Create: `app/checkout.tsx`
- Create: `app/order-confirmation.tsx`
- Create: `src/features/catalog/components/CategoryFilter.tsx`
- Create: `src/features/catalog/components/FeaturedProduct.tsx`
- Create: `src/features/catalog/components/ProductCard.tsx`
- Create: `src/features/catalog/components/SearchField.tsx`
- Create: `src/features/catalog/components/SortMenu.tsx`
- Create: `src/features/catalog/screens/StorefrontScreen.tsx`
- Create: `src/features/catalog/screens/ProductDetailScreen.tsx`
- Create: `src/features/cart/components/CartItemRow.tsx`
- Create: `src/features/cart/components/QuantityStepper.tsx`
- Create: `src/features/cart/screens/CartScreen.tsx`
- Create: `src/features/checkout/screens/CheckoutScreen.tsx`
- Create: `src/features/checkout/screens/OrderConfirmationScreen.tsx`

**Interfaces:**
- Consumes: all providers and domain operations from Tasks 2-4.
- Produces: complete customer flow from storefront to order confirmation.

- [ ] **Step 1: Add provider and route composition**

`app/_layout.tsx` wraps one `CatalogProvider` around one `CartProvider`, applies the safe-area provider and status bar, and renders a headerless Stack. Route files contain only parameter parsing and one screen component. The dynamic route uses `useLocalSearchParams<{ id: string }>()` and passes the ID to `ProductDetailScreen`.

- [ ] **Step 2: Build the storefront interactions**

The storefront must include Good Goods identity, delivery summary, cart icon/count, controlled search, horizontally scrolling category pills, a four-option sort menu, featured-product media, product cards, loading/error/empty states, and a bottom cart summary when items exist. Search/category/sort state stays local to this screen and feeds `selectProducts()`.

- [ ] **Step 3: Build product details and cart**

Product detail shows a real image, category/badge, name, description, price/unit, rating, stock, delivery time, and a functional add-to-cart button that changes to `View cart` after adding. Cart supports remove, increase, decrease-to-remove, clear, empty state, subtotal, delivery fee, total, storage warning, and a checkout button disabled for an empty cart.

- [ ] **Step 4: Build checkout and confirmation**

Checkout uses labeled React Native `TextInput` controls for name, phone, optional email, address, and note. It shows inline field errors, order summary, loading state, repository error, and one `Place order` action. On success it clears the cart and replaces the route with `/order-confirmation` carrying only serializable result values. Confirmation shows order number and total with one action back to the storefront.

- [ ] **Step 5: Confirm responsive and accessibility behavior**

Every icon button has an accessibility label, selected filters expose selected state, fields expose labels and errors, images have meaningful labels, and fixed bottom actions include safe-area padding. Product grids use one column on narrow phones and two columns only when enough width exists; content is constrained on wide web screens.

- [ ] **Step 6: Run all automated checks and commit**

Run:

```powershell
npm test
npm run typecheck
npm run lint
npx expo export --platform web
```

Expected: tests, typecheck, lint, and static web export all exit 0.

Commit:

```powershell
git add app src
git commit -m "feat: complete customer shopping flow"
```

### Task 6: Current and Future Supabase Schemas, Documentation, and Visual Verification

**Files:**
- Create: `supabase/schema.sql`
- Create: `supabase/future_features_schema.sql`
- Create: `docs/ARCHITECTURE.md`
- Create: `docs/SUPABASE_SETUP.md`
- Create: `README.md`

**Interfaces:**
- Consumes: catalog/order field names from Tasks 2 and 4.
- Produces: executable v1 schema, separate deferred-feature schema, setup instructions, and verified app handoff.

- [ ] **Step 1: Create the executable focused-v1 schema**

`schema.sql` must create `categories`, `products`, `store_settings`, `orders`, and `order_items`, their foreign keys/checks/indexes, updated-at trigger, row-level security, active-catalog read policies, and no order-read policies for public clients. Seed categories, store settings, and the same six products as `mock_catalog.ts` using stable UUIDs and `on conflict ... do update`.

Create `create_order(p_customer_name text, p_phone text, p_email text, p_address text, p_note text, p_items jsonb)` as a `security definer` function with an empty `search_path`. It must reject empty items, invalid quantities, inactive/missing products, and insufficient stock; lock product rows, calculate prices and delivery fee server-side, insert order snapshots, decrement stock, and return exactly:

```sql
table (
  id uuid,
  order_number text,
  subtotal numeric,
  delivery_fee numeric,
  total numeric,
  currency text
)
```

Revoke direct order-table access and grant only `execute` on this function to `anon` and `authenticated`.

- [ ] **Step 2: Create the separate deferred-feature schema**

`future_features_schema.sql` must state that `schema.sql` is required first and create only deferred auth/admin support: `profile_role`, `profiles`, `saved_addresses`, `product_variants`, `inventory_movements`, and `order_status_history`, plus indexes, updated timestamps, and role-aware policies. It must not seed users, expose customer data publicly, or change focused-v1 app behavior.

- [ ] **Step 3: Validate SQL structure**

Run a static scan confirming both files contain no placeholders and that every app query column exists in `schema.sql`. If a local Supabase CLI is available, run `supabase db reset`; otherwise document that live database execution was not available and validate the SQL with a PostgreSQL parser or careful statement-level inspection.

- [ ] **Step 4: Document setup and architecture**

`README.md` includes install/run/test commands and mock-mode behavior. `SUPABASE_SETUP.md` includes project creation, applying `schema.sql`, optional future schema warning, public environment setup, and security notes. `ARCHITECTURE.md` explains route/feature/repository boundaries and how to add a product field once without duplicating models.

- [ ] **Step 5: Start Expo web and verify the UI**

Run `npm run web -- --port 8081`, keep the server active, and inspect with browser automation at approximately 390x844 and 1440x1000. Verify storefront images load, search/filter/sort work, detail navigation works, cart quantities persist after reload, checkout validation is visible, mock order submission reaches confirmation, and no content overlaps fixed actions.

- [ ] **Step 6: Verify the original folders are unchanged**

Recalculate SHA-256 hashes for non-generated files under both source folders and compare them to the captured baseline. Expected: no added, removed, or changed source file. Preserve the pre-existing untracked `ProductSellingApp/skills-lock.json` state.

- [ ] **Step 7: Run final checks and commit**

Run:

```powershell
npm test
npm run typecheck
npm run lint
npx expo export --platform web
git status --short
```

Expected: all verification commands exit 0; Git shows only intended schema/docs or is clean after commit.

Commit:

```powershell
git add supabase docs README.md
git commit -m "docs: add database schemas and project guide"
```
