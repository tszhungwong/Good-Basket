-- Good Goods focused-v1 schema.
-- Safe to apply more than once in a Supabase SQL editor.

create extension if not exists pgcrypto;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

do $$
begin
  create type public.order_status as enum (
    'pending',
    'confirmed',
    'preparing',
    'out_for_delivery',
    'delivered',
    'cancelled'
  );
exception
  when duplicate_object then null;
end
$$;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order integer not null default 0 check (sort_order >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete restrict,
  slug text not null unique,
  name text not null,
  description text not null,
  price numeric(12, 2) not null check (price >= 0),
  unit text not null,
  image_url text not null,
  rating numeric(2, 1) not null default 0 check (rating >= 0 and rating <= 5),
  stock integer not null default 0 check (stock >= 0),
  delivery_minutes integer not null default 30 check (delivery_minutes > 0),
  tags text[] not null default '{}',
  badge text,
  featured boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.store_settings (
  id smallint primary key default 1 check (id = 1),
  currency varchar(3) not null default 'USD',
  delivery_fee numeric(12, 2) not null default 0 check (delivery_fee >= 0),
  delivery_message text not null,
  minimum_order numeric(12, 2) not null default 0 check (minimum_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.account_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  username text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email_name text := split_part(coalesce(new.email, ''), '@', 1);
  v_display_name text := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
    nullif(initcap(replace(replace(v_email_name, '.', ' '), '_', ' ')), ''),
    'Good Goods shopper'
  );
  v_username_base text := lower(
    regexp_replace(
      coalesce(
        nullif(trim(new.raw_user_meta_data ->> 'username'), ''),
        nullif(v_email_name, ''),
        'shopper'
      ),
      '[^a-zA-Z0-9_]+',
      '',
      'g'
    )
  );
begin
  insert into public.account_profiles (user_id, display_name, username)
  values (
    new.id,
    left(v_display_name, 80),
    left(coalesce(nullif(v_username_base, ''), 'shopper'), 40)
      || '_'
      || left(replace(new.id::text, '-', ''), 8)
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

revoke all on function private.handle_new_auth_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_auth_user();

create table if not exists public.delivery_preferences (
  user_id uuid primary key references public.account_profiles(user_id) on delete cascade,
  default_address text not null,
  preferred_window text not null,
  delivery_instructions text not null,
  substitution_preference text not null default 'Replace unavailable items',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.account_profiles(user_id) on delete cascade,
  brand text not null,
  last_four char(4) not null check (last_four ~ '^[0-9]{4}$'),
  expiry_month integer not null check (expiry_month between 1 and 12),
  expiry_year integer not null check (expiry_year >= extract(year from now())::integer),
  billing_name text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  order_number text not null unique,
  customer_name text not null,
  phone text not null,
  email text,
  address text not null,
  note text,
  subtotal numeric(12, 2) not null check (subtotal >= 0),
  delivery_fee numeric(12, 2) not null check (delivery_fee >= 0),
  total numeric(12, 2) not null check (total = subtotal + delivery_fee),
  currency varchar(3) not null,
  status public.order_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  unit text not null,
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  line_total numeric(12, 2) generated always as (unit_price * quantity) stored,
  created_at timestamptz not null default now()
);

alter table public.orders
add column if not exists user_id uuid references auth.users(id) on delete set null;

create index if not exists products_category_id_idx on public.products(category_id);
create index if not exists products_active_featured_idx on public.products(active, featured desc);
create index if not exists payment_methods_user_id_idx on public.payment_methods(user_id);
create unique index if not exists payment_methods_one_default_per_user_idx
on public.payment_methods(user_id)
where is_default;
create index if not exists orders_user_id_created_at_idx on public.orders(user_id, created_at desc);
create index if not exists orders_created_at_idx on public.orders(created_at desc);
create index if not exists orders_status_idx on public.orders(status);
create index if not exists order_items_order_id_idx on public.order_items(order_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists store_settings_set_updated_at on public.store_settings;
create trigger store_settings_set_updated_at
before update on public.store_settings
for each row execute function public.set_updated_at();

drop trigger if exists account_profiles_set_updated_at on public.account_profiles;
create trigger account_profiles_set_updated_at
before update on public.account_profiles
for each row execute function public.set_updated_at();

drop trigger if exists delivery_preferences_set_updated_at on public.delivery_preferences;
create trigger delivery_preferences_set_updated_at
before update on public.delivery_preferences
for each row execute function public.set_updated_at();

drop trigger if exists payment_methods_set_updated_at on public.payment_methods;
create trigger payment_methods_set_updated_at
before update on public.payment_methods
for each row execute function public.set_updated_at();

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.store_settings enable row level security;
alter table public.account_profiles enable row level security;
alter table public.delivery_preferences enable row level security;
alter table public.payment_methods enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists categories_public_read on public.categories;
create policy categories_public_read
on public.categories
for select
to anon, authenticated
using (active);

drop policy if exists products_public_read on public.products;
create policy products_public_read
on public.products
for select
to anon, authenticated
using (active);

drop policy if exists store_settings_public_read on public.store_settings;
create policy store_settings_public_read
on public.store_settings
for select
to anon, authenticated
using (true);

drop policy if exists account_profiles_owner_read on public.account_profiles;
create policy account_profiles_owner_read
on public.account_profiles
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists account_profiles_owner_insert on public.account_profiles;
create policy account_profiles_owner_insert
on public.account_profiles
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists account_profiles_owner_update on public.account_profiles;
create policy account_profiles_owner_update
on public.account_profiles
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists delivery_preferences_owner_manage on public.delivery_preferences;
create policy delivery_preferences_owner_manage
on public.delivery_preferences
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists payment_methods_owner_manage on public.payment_methods;
create policy payment_methods_owner_manage
on public.payment_methods
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists orders_owner_read on public.orders;
create policy orders_owner_read
on public.orders
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists order_items_owner_read on public.order_items;
create policy order_items_owner_read
on public.order_items
for select
to authenticated
using (
  exists (
    select 1
    from public.orders
    where orders.id = order_items.order_id
      and orders.user_id = (select auth.uid())
  )
);

revoke all on table public.categories from anon, authenticated;
revoke all on table public.products from anon, authenticated;
revoke all on table public.store_settings from anon, authenticated;
revoke all on table public.account_profiles from anon, authenticated;
revoke all on table public.delivery_preferences from anon, authenticated;
revoke all on table public.payment_methods from anon, authenticated;
revoke all on table public.orders from anon, authenticated;
revoke all on table public.order_items from anon, authenticated;

grant select on table public.categories to anon, authenticated;
grant select on table public.products to anon, authenticated;
grant select on table public.store_settings to anon, authenticated;
grant select, insert, update on table public.account_profiles to authenticated;
grant select, insert, update, delete on table public.delivery_preferences to authenticated;
grant select, insert, update, delete on table public.payment_methods to authenticated;
grant select on table public.orders to authenticated;
grant select on table public.order_items to authenticated;

create or replace function public.create_order(
  p_customer_name text,
  p_phone text,
  p_email text,
  p_address text,
  p_note text,
  p_items jsonb
)
returns table (
  id uuid,
  order_number text,
  subtotal numeric,
  delivery_fee numeric,
  total numeric,
  currency text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order_id uuid := gen_random_uuid();
  v_order_number text;
  v_product_id uuid;
  v_quantity integer;
  v_product public.products%rowtype;
  v_settings public.store_settings%rowtype;
  v_subtotal numeric(12, 2) := 0;
  v_delivery_fee numeric(12, 2);
  v_total numeric(12, 2);
begin
  if nullif(trim(p_customer_name), '') is null then
    raise exception 'Customer name is required.' using errcode = '22023';
  end if;
  if nullif(trim(p_phone), '') is null then
    raise exception 'Phone number is required.' using errcode = '22023';
  end if;
  if nullif(trim(p_address), '') is null then
    raise exception 'Delivery address is required.' using errcode = '22023';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Your cart is empty.' using errcode = '22023';
  end if;

  select settings.*
  into v_settings
  from public.store_settings as settings
  order by settings.id
  limit 1;

  if not found then
    raise exception 'Store settings are missing.' using errcode = 'P0001';
  end if;

  for v_product_id, v_quantity in
    select
      (entry.value ->> 'product_id')::uuid,
      sum((entry.value ->> 'quantity')::integer)::integer
    from jsonb_array_elements(p_items) as entry(value)
    group by (entry.value ->> 'product_id')::uuid
    order by (entry.value ->> 'product_id')::uuid
  loop
    if v_product_id is null or v_quantity is null or v_quantity <= 0 then
      raise exception 'One or more products are unavailable.' using errcode = '22023';
    end if;

    select product.*
    into v_product
    from public.products as product
    where product.id = v_product_id and product.active
    for update;

    if not found or v_product.stock < v_quantity then
      raise exception 'One or more products are unavailable.' using errcode = 'P0001';
    end if;

    v_subtotal := v_subtotal + (v_product.price * v_quantity);
  end loop;

  if v_subtotal < v_settings.minimum_order then
    raise exception 'Order does not meet the store minimum.' using errcode = 'P0001';
  end if;

  v_order_number := 'GG-' || to_char(clock_timestamp(), 'YYYYMMDD') || '-' ||
    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 4));
  v_delivery_fee := v_settings.delivery_fee;
  v_total := v_subtotal + v_delivery_fee;

    insert into public.orders (
      id,
      user_id,
      order_number,
      customer_name,
    phone,
    email,
    address,
    note,
    subtotal,
    delivery_fee,
    total,
    currency
  )
    values (
      v_order_id,
      (select auth.uid()),
      v_order_number,
      trim(p_customer_name),
    trim(p_phone),
    nullif(trim(p_email), ''),
    trim(p_address),
    nullif(trim(p_note), ''),
    v_subtotal,
    v_delivery_fee,
    v_total,
    v_settings.currency
  );

  for v_product_id, v_quantity in
    select
      (entry.value ->> 'product_id')::uuid,
      sum((entry.value ->> 'quantity')::integer)::integer
    from jsonb_array_elements(p_items) as entry(value)
    group by (entry.value ->> 'product_id')::uuid
    order by (entry.value ->> 'product_id')::uuid
  loop
    select product.*
    into v_product
    from public.products as product
    where product.id = v_product_id;

    insert into public.order_items (
      order_id,
      product_id,
      product_name,
      unit,
      unit_price,
      quantity
    )
    values (
      v_order_id,
      v_product.id,
      v_product.name,
      v_product.unit,
      v_product.price,
      v_quantity
    );

    update public.products
    set stock = stock - v_quantity
    where products.id = v_product_id;
  end loop;

  return query
  select
    placed.id,
    placed.order_number,
    placed.subtotal,
    placed.delivery_fee,
    placed.total,
    placed.currency::text
  from public.orders as placed
  where placed.id = v_order_id;
end;
$$;

revoke all on function public.create_order(text, text, text, text, text, jsonb) from public;
grant execute on function public.create_order(text, text, text, text, text, jsonb)
to anon, authenticated;

create or replace function public.get_account_overview()
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  with current_user_account as (
    select auth.uid() as user_id
  ),
  selected_profile as (
    select profile.*
    from public.account_profiles as profile
    join current_user_account as account on account.user_id = profile.user_id
  ),
  selected_delivery as (
    select preference.*
    from public.delivery_preferences as preference
    join current_user_account as account on account.user_id = preference.user_id
  ),
  selected_payment_methods as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', method.id,
          'brand', method.brand,
          'lastFour', method.last_four,
          'expiryMonth', method.expiry_month,
          'expiryYear', method.expiry_year,
          'isDefault', method.is_default
        )
        order by method.is_default desc, method.created_at desc
      ),
      '[]'::jsonb
    ) as payload
    from public.payment_methods as method
    join current_user_account as account on account.user_id = method.user_id
  ),
  selected_orders as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', placed.id,
          'orderNumber', placed.order_number,
          'placedAt', placed.created_at,
          'status', placed.status,
          'total', placed.total,
          'currency', placed.currency,
          'items', coalesce(items.payload, '[]'::jsonb)
        )
        order by placed.created_at desc
      ),
      '[]'::jsonb
    ) as payload
    from public.orders as placed
    join current_user_account as account on account.user_id = placed.user_id
    left join lateral (
      select jsonb_agg(
        jsonb_build_object(
          'productId', item.product_id,
          'productName', item.product_name,
          'quantity', item.quantity,
          'unit', item.unit
        )
        order by item.id
      ) as payload
      from public.order_items as item
      where item.order_id = placed.id
    ) as items on true
  )
  select jsonb_build_object(
    'profile', jsonb_build_object(
      'displayName', selected_profile.display_name,
      'username', selected_profile.username,
      'memberSince', to_char(selected_profile.created_at, 'YYYY')
    ),
    'deliveryPreference', case
      when selected_delivery.user_id is null then null
      else jsonb_build_object(
        'defaultAddress', selected_delivery.default_address,
        'preferredWindow', selected_delivery.preferred_window,
        'deliveryInstructions', selected_delivery.delivery_instructions,
        'substitutionPreference', selected_delivery.substitution_preference
      )
    end,
    'paymentMethods', selected_payment_methods.payload,
    'orders', selected_orders.payload
  )
  from selected_profile
  left join selected_delivery on selected_delivery.user_id = selected_profile.user_id
  cross join selected_payment_methods
  cross join selected_orders;
$$;

revoke all on function public.get_account_overview() from public;
grant execute on function public.get_account_overview() to authenticated;

create or replace function public.delete_current_user()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Sign in is required to delete an account.' using errcode = '28000';
  end if;

  delete from auth.users as auth_user
  where auth_user.id = v_user_id;
end;
$$;

revoke all on function public.delete_current_user() from public, anon, authenticated;
grant execute on function public.delete_current_user() to authenticated;

insert into public.categories (id, name, sort_order, active)
values
  ('10000000-0000-4000-8000-000000000001', 'Fresh', 1, true),
  ('10000000-0000-4000-8000-000000000002', 'Pantry', 2, true),
  ('10000000-0000-4000-8000-000000000003', 'Bakery', 3, true),
  ('10000000-0000-4000-8000-000000000004', 'Home', 4, true)
on conflict (id) do update
set
  name = excluded.name,
  sort_order = excluded.sort_order,
  active = excluded.active;

insert into public.store_settings (
  id,
  currency,
  delivery_fee,
  delivery_message,
  minimum_order
)
values (1, 'USD', 2.50, 'Today, before dinner', 0)
on conflict (id) do update
set
  currency = excluded.currency,
  delivery_fee = excluded.delivery_fee,
  delivery_message = excluded.delivery_message,
  minimum_order = excluded.minimum_order;

insert into public.products (
  id,
  category_id,
  slug,
  name,
  description,
  price,
  unit,
  image_url,
  rating,
  stock,
  delivery_minutes,
  tags,
  badge,
  featured,
  active
)
values
  (
    '20000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'weekend-market-basket',
    'Weekend Market Basket',
    'Greens, tomatoes, sourdough, and pantry staples packed as one easy restock.',
    36.00,
    'bundle',
    'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=85',
    4.9,
    12,
    28,
    array['bundle', 'produce', 'weekend', 'market'],
    'Best seller',
    true,
    true
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    'organic-tomatoes',
    'Organic Tomatoes',
    'Bright, firm tomatoes selected for salads, sandwiches, and sauces.',
    4.50,
    'lb',
    'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=900&q=85',
    4.8,
    28,
    22,
    array['vegetable', 'salad', 'organic'],
    'Fresh today',
    false,
    true
  ),
  (
    '20000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000001',
    'cold-pressed-juice',
    'Cold Pressed Juice',
    'Small-batch citrus, carrot, and ginger juice with no added sugar.',
    6.75,
    'bottle',
    'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?auto=format&fit=crop&w=900&q=85',
    4.7,
    18,
    24,
    array['drink', 'citrus', 'ginger'],
    null,
    false,
    true
  ),
  (
    '20000000-0000-4000-8000-000000000004',
    '10000000-0000-4000-8000-000000000002',
    'extra-virgin-olive-oil',
    'Extra Virgin Olive Oil',
    'Smooth everyday olive oil for cooking, dressings, and finishing.',
    18.00,
    '500 ml',
    'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=900&q=85',
    4.6,
    9,
    30,
    array['cooking', 'oil', 'dressing'],
    'Small batch',
    false,
    true
  ),
  (
    '20000000-0000-4000-8000-000000000005',
    '10000000-0000-4000-8000-000000000002',
    'bronze-cut-pasta',
    'Bronze Cut Pasta',
    'Slow-dried rigatoni with a textured surface that holds sauce well.',
    5.80,
    'pack',
    'https://images.unsplash.com/photo-1556761223-4c4282c73f77?auto=format&fit=crop&w=900&q=85',
    4.5,
    21,
    30,
    array['pasta', 'dinner', 'italian'],
    null,
    false,
    true
  ),
  (
    '20000000-0000-4000-8000-000000000006',
    '10000000-0000-4000-8000-000000000003',
    'country-sourdough',
    'Country Sourdough',
    'A naturally leavened loaf with a crisp crust and tender crumb.',
    7.25,
    'loaf',
    'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=85',
    4.9,
    14,
    26,
    array['bread', 'breakfast', 'baked'],
    'Baked today',
    false,
    true
  ),
  (
    '20000000-0000-4000-8000-000000000007',
    '10000000-0000-4000-8000-000000000004',
    'linen-kitchen-towels',
    'Linen Kitchen Towels',
    'Absorbent, quick-drying linen towels made for everyday kitchen work.',
    14.00,
    'set of 2',
    'https://images.unsplash.com/photo-1609840114035-3c981b782dfe?auto=format&fit=crop&w=900&q=85',
    4.4,
    15,
    34,
    array['linen', 'kitchen', 'towels'],
    null,
    false,
    true
  ),
  (
    '20000000-0000-4000-8000-000000000008',
    '10000000-0000-4000-8000-000000000004',
    'beeswax-food-wraps',
    'Beeswax Food Wraps',
    'Reusable cotton wraps for bread, produce, bowls, and packed lunches.',
    12.00,
    'set of 3',
    'https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?auto=format&fit=crop&w=900&q=85',
    4.5,
    17,
    34,
    array['reusable', 'storage', 'kitchen'],
    'Low waste',
    false,
    true
  )
on conflict (id) do update
set
  category_id = excluded.category_id,
  slug = excluded.slug,
  name = excluded.name,
  description = excluded.description,
  price = excluded.price,
  unit = excluded.unit,
  image_url = excluded.image_url,
  rating = excluded.rating,
  delivery_minutes = excluded.delivery_minutes,
  tags = excluded.tags,
  badge = excluded.badge,
  featured = excluded.featured,
  active = excluded.active;

-- Backfill related profile data for Auth users created before this trigger existed.
insert into public.account_profiles (user_id, display_name, username)
select
  existing_user.id,
  left(
    coalesce(
      nullif(trim(existing_user.raw_user_meta_data ->> 'full_name'), ''),
      nullif(trim(existing_user.raw_user_meta_data ->> 'name'), ''),
      nullif(
        initcap(
          replace(
            replace(split_part(coalesce(existing_user.email, ''), '@', 1), '.', ' '),
            '_',
            ' '
          )
        ),
        ''
      ),
      'Good Goods shopper'
    ),
    80
  ),
  left(
    coalesce(
      nullif(
        lower(
          regexp_replace(
            coalesce(
              nullif(trim(existing_user.raw_user_meta_data ->> 'username'), ''),
              nullif(split_part(coalesce(existing_user.email, ''), '@', 1), ''),
              'shopper'
            ),
            '[^a-zA-Z0-9_]+',
            '',
            'g'
          )
        ),
        ''
      ),
      'shopper'
    ),
    40
  ) || '_' || left(replace(existing_user.id::text, '-', ''), 8)
from auth.users as existing_user
on conflict (user_id) do nothing;
