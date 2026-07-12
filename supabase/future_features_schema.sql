-- Deferred Good Goods auth and seller schema.
-- Apply supabase/schema.sql first.
-- Do not apply this extension until matching authentication and seller UI are developed.

do $$
begin
  create type public.profile_role as enum ('customer', 'seller', 'admin');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.inventory_movement_kind as enum (
    'restock',
    'sale',
    'return',
    'adjustment'
  );
exception
  when duplicate_object then null;
end
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.profile_role not null default 'customer',
  display_name text not null,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.saved_addresses (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  label text not null,
  recipient_name text not null,
  phone text not null,
  address text not null,
  instructions text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  sku text not null unique,
  name text not null,
  attributes jsonb not null default '{}',
  price_delta numeric(12, 2) not null default 0,
  stock integer not null default 0 check (stock >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.inventory_movements (
  id bigint generated always as identity primary key,
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete set null,
  kind public.inventory_movement_kind not null,
  quantity_delta integer not null check (quantity_delta <> 0),
  note text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.order_status_history (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  status public.order_status not null,
  note text,
  changed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.orders
add column if not exists customer_id uuid references public.profiles(id) on delete set null;

create index if not exists saved_addresses_user_id_idx
on public.saved_addresses(user_id);
create index if not exists product_variants_product_id_idx
on public.product_variants(product_id);
create index if not exists inventory_movements_product_id_created_at_idx
on public.inventory_movements(product_id, created_at desc);
create index if not exists inventory_movements_variant_id_idx
on public.inventory_movements(variant_id);
create index if not exists order_status_history_order_id_created_at_idx
on public.order_status_history(order_id, created_at desc);
create index if not exists orders_customer_id_created_at_idx
on public.orders(customer_id, created_at desc);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists saved_addresses_set_updated_at on public.saved_addresses;
create trigger saved_addresses_set_updated_at
before update on public.saved_addresses
for each row execute function public.set_updated_at();

drop trigger if exists product_variants_set_updated_at on public.product_variants;
create trigger product_variants_set_updated_at
before update on public.product_variants
for each row execute function public.set_updated_at();

create or replace function public.attach_order_customer()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.customer_id is null then
    new.customer_id := auth.uid();
  end if;
  return new;
end;
$$;

revoke all on function public.attach_order_customer() from public;

drop trigger if exists orders_attach_customer on public.orders;
create trigger orders_attach_customer
before insert on public.orders
for each row execute function public.attach_order_customer();

create or replace function public.is_seller()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles as profile
    where profile.id = auth.uid()
      and profile.role in ('seller', 'admin')
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles as profile
    where profile.id = auth.uid()
      and profile.role = 'admin'
  );
$$;

revoke all on function public.is_seller() from public;
revoke all on function public.is_admin() from public;
grant execute on function public.is_seller() to authenticated;
grant execute on function public.is_admin() to authenticated;

alter table public.profiles enable row level security;
alter table public.saved_addresses enable row level security;
alter table public.product_variants enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.order_status_history enable row level security;

drop policy if exists profiles_read_own on public.profiles;
create policy profiles_read_own
on public.profiles
for select
to authenticated
using (id = auth.uid() or public.is_seller());

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own
on public.profiles
for insert
to authenticated
with check (id = auth.uid() and role = 'customer');

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid() and role = 'customer');

drop policy if exists profiles_update_seller_own on public.profiles;
create policy profiles_update_seller_own
on public.profiles
for update
to authenticated
using (id = auth.uid() and role = 'seller')
with check (id = auth.uid() and role = 'seller');

drop policy if exists profiles_manage_seller on public.profiles;
drop policy if exists profiles_manage_admin on public.profiles;
create policy profiles_manage_admin
on public.profiles
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists saved_addresses_manage_own on public.saved_addresses;
create policy saved_addresses_manage_own
on public.saved_addresses
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists saved_addresses_read_seller on public.saved_addresses;
create policy saved_addresses_read_seller
on public.saved_addresses
for select
to authenticated
using (public.is_seller());

drop policy if exists product_variants_public_read on public.product_variants;
create policy product_variants_public_read
on public.product_variants
for select
to anon, authenticated
using (active);

drop policy if exists product_variants_manage_seller on public.product_variants;
create policy product_variants_manage_seller
on public.product_variants
for all
to authenticated
using (public.is_seller())
with check (public.is_seller());

drop policy if exists inventory_movements_manage_seller on public.inventory_movements;
create policy inventory_movements_manage_seller
on public.inventory_movements
for all
to authenticated
using (public.is_seller())
with check (public.is_seller());

drop policy if exists order_status_history_read on public.order_status_history;
create policy order_status_history_read
on public.order_status_history
for select
to authenticated
using (
  public.is_seller()
  or exists (
    select 1
    from public.orders as customer_order
    where customer_order.id = order_status_history.order_id
      and customer_order.customer_id = auth.uid()
  )
);

drop policy if exists order_status_history_manage_seller on public.order_status_history;
create policy order_status_history_manage_seller
on public.order_status_history
for all
to authenticated
using (public.is_seller())
with check (public.is_seller());

drop policy if exists orders_read_own on public.orders;
create policy orders_read_own
on public.orders
for select
to authenticated
using (customer_id = auth.uid() or public.is_seller());

drop policy if exists orders_manage_seller on public.orders;
create policy orders_manage_seller
on public.orders
for all
to authenticated
using (public.is_seller())
with check (public.is_seller());

drop policy if exists order_items_read_own on public.order_items;
create policy order_items_read_own
on public.order_items
for select
to authenticated
using (
  exists (
    select 1
    from public.orders as customer_order
    where customer_order.id = order_items.order_id
      and (
        customer_order.customer_id = auth.uid()
        or public.is_seller()
      )
  )
);

drop policy if exists categories_manage_seller on public.categories;
create policy categories_manage_seller
on public.categories
for all
to authenticated
using (public.is_seller())
with check (public.is_seller());

drop policy if exists products_manage_seller on public.products;
create policy products_manage_seller
on public.products
for all
to authenticated
using (public.is_seller())
with check (public.is_seller());

drop policy if exists store_settings_manage_seller on public.store_settings;
create policy store_settings_manage_seller
on public.store_settings
for all
to authenticated
using (public.is_seller())
with check (public.is_seller());

grant select, insert, update on table public.profiles to authenticated;
grant select, insert, update, delete on table public.saved_addresses to authenticated;
grant select on table public.product_variants to anon;
grant select, insert, update, delete on table public.product_variants to authenticated;
grant select, insert on table public.inventory_movements to authenticated;
grant select, insert on table public.order_status_history to authenticated;
grant select, update on table public.orders to authenticated;
grant select on table public.order_items to authenticated;
grant insert, update, delete on table public.categories to authenticated;
grant insert, update, delete on table public.products to authenticated;
grant insert, update on table public.store_settings to authenticated;
grant usage on sequence public.saved_addresses_id_seq to authenticated;
grant usage on sequence public.inventory_movements_id_seq to authenticated;
grant usage on sequence public.order_status_history_id_seq to authenticated;
