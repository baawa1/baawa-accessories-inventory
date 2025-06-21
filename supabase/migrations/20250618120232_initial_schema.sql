DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'adjustment_type') THEN
        create type "public"."adjustment_type" as enum ('manual_count', 'damage', 'theft', 'other', 'po_received');
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
        create type "public"."order_status" as enum ('pending', 'completed', 'cancelled', 'refunded');
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN
        create type "public"."payment_method" as enum ('cash', 'bank_transfer', 'pos_machine', 'wallet_credit');
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'po_status') THEN
        create type "public"."po_status" as enum ('pending', 'ordered', 'partially_received', 'received', 'cancelled');
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'product_status') THEN
        create type "public"."product_status" as enum ('active', 'archived', 'draft');
    END IF;
END$$;


create table if not exists "public"."brands" (
    "id" SERIAL PRIMARY KEY,
    "name" text not null,
    "description" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


create table if not exists "public"."categories" (
    "id" SERIAL PRIMARY KEY,
    "name" text not null,
    "description" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


create table if not exists "public"."customers" (
    "id" SERIAL PRIMARY KEY,
    "name" text,
    "phone_number" text,
    "email" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


create table if not exists "public"."order_items" (
    "id" SERIAL PRIMARY KEY,
    "order_id" integer,
    "product_id" uuid,
    "variant_id" integer,
    "quantity" integer not null,
    "price_per_item" numeric(10,2) not null,
    "discount_per_item" numeric(10,2) default 0,
    "total_price" numeric(10,2) not null,
    "created_at" timestamp with time zone default now()
);


create table if not exists "public"."orders" (
    "id" SERIAL PRIMARY KEY,
    "customer_id" integer,
    "user_id" uuid,
    "status" order_status default 'pending'::order_status,
    "total_amount" numeric(10,2) not null,
    "discount_amount" numeric(10,2) default 0,
    "final_amount" numeric(10,2) not null,
    "payment_method" payment_method,
    "transaction_reference" text,
    "notes" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


create table if not exists "public"."product_images" (
    "id" SERIAL PRIMARY KEY,
    "product_id" uuid,
    "variant_id" integer,
    "image_url" text not null,
    "alt_text" text,
    "display_order" integer default 0,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


create table if not exists "public"."product_variants" (
    "id" SERIAL PRIMARY KEY,
    "product_id" uuid,
    "sku_variant" text,
    "color" text,
    "size" text,
    "price_variant" numeric(10,2),
    "quantity_variant" integer default 0,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


create table if not exists "public"."products" (
    "id" uuid not null default gen_random_uuid(),
    "sku" text not null,
    "name" text not null,
    "description" text,
    "short_description" text,
    "slug" text,
    "cost_price" numeric(10,2),
    "selling_price" numeric(10,2) not null,
    "regular_price" numeric(10,2) not null,
    "quantity_on_hand" integer default 0,
    "category_id" integer,
    "brand_id" integer,
    "model_name" text not null,
    "supplier_id" integer,
    "status" product_status default 'draft'::product_status,
    "tags" text[],
    "reorder_level" integer default 0,
    "stock_status" text,
    "featured" boolean default false,
    "catalog_visibility" boolean default true,
    "meta" jsonb,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


create table if not exists "public"."purchase_order_items" (
    "id" SERIAL PRIMARY KEY,
    "purchase_order_id" integer,
    "product_id" uuid not null,
    "variant_id" integer,
    "quantity_ordered" integer not null,
    "quantity_received" integer default 0,
    "cost_per_item" numeric(10,2),
    "total_cost" numeric(10,2),
    "created_at" timestamp with time zone default now()
);


create table if not exists "public"."purchase_orders" (
    "id" SERIAL PRIMARY KEY,
    "supplier_id" integer not null,
    "user_id" uuid,
    "status" po_status default 'pending'::po_status,
    "expected_delivery_date" date,
    "total_cost" numeric(10,2),
    "notes" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


create table if not exists "public"."roles" (
    "id" SERIAL PRIMARY KEY,
    "name" text not null,
    "created_at" timestamp with time zone default now()
);


create table if not exists "public"."stock_adjustments" (
    "id" SERIAL PRIMARY KEY,
    "product_id" uuid not null,
    "variant_id" integer,
    "user_id" uuid,
    "adjustment_type" adjustment_type not null,
    "quantity_changed" integer not null,
    "reason" text,
    "created_at" timestamp with time zone default now()
);


create table if not exists "public"."suppliers" (
    "id" SERIAL PRIMARY KEY,
    "name" text not null,
    "contact_name" text,
    "email" text,
    "phone" text,
    "address" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


create table if not exists "public"."user_profiles" (
    "id" uuid not null,
    "full_name" text,
    "avatar_url" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


create table if not exists "public"."user_roles" (
    "user_id" uuid not null,
    "role_id" integer not null,
    "created_at" timestamp with time zone default now()
);


CREATE UNIQUE INDEX IF NOT EXISTS brands_name_key ON public.brands USING btree (name);
CREATE UNIQUE INDEX IF NOT EXISTS categories_name_key ON public.categories USING btree (name);
CREATE UNIQUE INDEX IF NOT EXISTS customers_email_key ON public.customers USING btree (email);
CREATE UNIQUE INDEX IF NOT EXISTS customers_phone_number_key ON public.customers USING btree (phone_number);
CREATE UNIQUE INDEX IF NOT EXISTS product_variants_sku_variant_key ON public.product_variants USING btree (sku_variant);
CREATE UNIQUE INDEX IF NOT EXISTS products_pkey ON public.products USING btree (id);
CREATE UNIQUE INDEX IF NOT EXISTS products_sku_key ON public.products USING btree (sku);
CREATE UNIQUE INDEX IF NOT EXISTS products_slug_key ON public.products USING btree (slug);
CREATE UNIQUE INDEX IF NOT EXISTS roles_name_key ON public.roles USING btree (name);
CREATE UNIQUE INDEX IF NOT EXISTS user_profiles_pkey ON public.user_profiles USING btree (id);
CREATE UNIQUE INDEX IF NOT EXISTS user_roles_pkey ON public.user_roles USING btree (user_id, role_id);

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_pkey' AND conrelid = 'public.products'::regclass) THEN alter table "public"."products" add constraint "products_pkey" PRIMARY KEY using index "products_pkey"; END IF; END; $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_profiles_pkey' AND conrelid = 'public.user_profiles'::regclass) THEN alter table "public"."user_profiles" add constraint "user_profiles_pkey" PRIMARY KEY using index "user_profiles_pkey"; END IF; END; $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_roles_pkey' AND conrelid = 'public.user_roles'::regclass) THEN alter table "public"."user_roles" add constraint "user_roles_pkey" PRIMARY KEY using index "user_roles_pkey"; END IF; END; $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'brands_name_key' AND conrelid = 'public.brands'::regclass) THEN alter table "public"."brands" add constraint "brands_name_key" UNIQUE using index "brands_name_key"; END IF; END; $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'categories_name_key' AND conrelid = 'public.categories'::regclass) THEN alter table "public"."categories" add constraint "categories_name_key" UNIQUE using index "categories_name_key"; END IF; END; $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'customers_email_key' AND conrelid = 'public.customers'::regclass) THEN alter table "public"."customers" add constraint "customers_email_key" UNIQUE using index "customers_email_key"; END IF; END; $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'customers_phone_number_key' AND conrelid = 'public.customers'::regclass) THEN alter table "public"."customers" add constraint "customers_phone_number_key" UNIQUE using index "customers_phone_number_key"; END IF; END; $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'order_items_order_id_fkey' AND conrelid = 'public.order_items'::regclass) THEN alter table "public"."order_items" add constraint "order_items_order_id_fkey" FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE not valid; END IF; END; $$;
alter table "public"."order_items" validate constraint "order_items_order_id_fkey";
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'order_items_product_id_fkey' AND conrelid = 'public.order_items'::regclass) THEN alter table "public"."order_items" add constraint "order_items_product_id_fkey" FOREIGN KEY (product_id) REFERENCES products(id) not valid; END IF; END; $$;
alter table "public"."order_items" validate constraint "order_items_product_id_fkey";
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'order_items_variant_id_fkey' AND conrelid = 'public.order_items'::regclass) THEN alter table "public"."order_items" add constraint "order_items_variant_id_fkey" FOREIGN KEY (variant_id) REFERENCES product_variants(id) not valid; END IF; END; $$;
alter table "public"."order_items" validate constraint "order_items_variant_id_fkey";
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_customer_id_fkey' AND conrelid = 'public.orders'::regclass) THEN alter table "public"."orders" add constraint "orders_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES customers(id) not valid; END IF; END; $$;
alter table "public"."orders" validate constraint "orders_customer_id_fkey";
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_user_id_fkey' AND conrelid = 'public.orders'::regclass) THEN alter table "public"."orders" add constraint "orders_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid; END IF; END; $$;
alter table "public"."orders" validate constraint "orders_user_id_fkey";
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_images_product_id_fkey' AND conrelid = 'public.product_images'::regclass) THEN alter table "public"."product_images" add constraint "product_images_product_id_fkey" FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE not valid; END IF; END; $$;
alter table "public"."product_images" validate constraint "product_images_product_id_fkey";
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_images_variant_id_fkey' AND conrelid = 'public.product_images'::regclass) THEN alter table "public"."product_images" add constraint "product_images_variant_id_fkey" FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE not valid; END IF; END; $$;
alter table "public"."product_images" validate constraint "product_images_variant_id_fkey";
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_or_variant_image' AND conrelid = 'public.product_images'::regclass) THEN alter table "public"."product_images" add constraint "product_or_variant_image" CHECK (((product_id IS NOT NULL) OR (variant_id IS NOT NULL))) not valid; END IF; END; $$;
alter table "public"."product_images" validate constraint "product_or_variant_image";
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_variants_product_id_fkey' AND conrelid = 'public.product_variants'::regclass) THEN alter table "public"."product_variants" add constraint "product_variants_product_id_fkey" FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE not valid; END IF; END; $$;
alter table "public"."product_variants" validate constraint "product_variants_product_id_fkey";
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_variants_sku_variant_key' AND conrelid = 'public.product_variants'::regclass) THEN alter table "public"."product_variants" add constraint "product_variants_sku_variant_key" UNIQUE using index "product_variants_sku_variant_key"; END IF; END; $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_brand_id_fkey' AND conrelid = 'public.products'::regclass) THEN alter table "public"."products" add constraint "products_brand_id_fkey" FOREIGN KEY (brand_id) REFERENCES brands(id) not valid; END IF; END; $$;
alter table "public"."products" validate constraint "products_brand_id_fkey";
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_category_id_fkey' AND conrelid = 'public.products'::regclass) THEN alter table "public"."products" add constraint "products_category_id_fkey" FOREIGN KEY (category_id) REFERENCES categories(id) not valid; END IF; END; $$;
alter table "public"."products" validate constraint "products_category_id_fkey";
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_sku_key' AND conrelid = 'public.products'::regclass) THEN alter table "public"."products" add constraint "products_sku_key" UNIQUE using index "products_sku_key"; END IF; END; $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_slug_key' AND conrelid = 'public.products'::regclass) THEN alter table "public"."products" add constraint "products_slug_key" UNIQUE using index "products_slug_key"; END IF; END; $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_supplier_id_fkey' AND conrelid = 'public.products'::regclass) THEN alter table "public"."products" add constraint "products_supplier_id_fkey" FOREIGN KEY (supplier_id) REFERENCES suppliers(id) not valid; END IF; END; $$;
alter table "public"."products" validate constraint "products_supplier_id_fkey";
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'purchase_order_items_product_id_fkey' AND conrelid = 'public.purchase_order_items'::regclass) THEN alter table "public"."purchase_order_items" add constraint "purchase_order_items_product_id_fkey" FOREIGN KEY (product_id) REFERENCES products(id) not valid; END IF; END; $$;
alter table "public"."purchase_order_items" validate constraint "purchase_order_items_product_id_fkey";
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'purchase_order_items_purchase_order_id_fkey' AND conrelid = 'public.purchase_order_items'::regclass) THEN alter table "public"."purchase_order_items" add constraint "purchase_order_items_purchase_order_id_fkey" FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE not valid; END IF; END; $$;
alter table "public"."purchase_order_items" validate constraint "purchase_order_items_purchase_order_id_fkey";
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'purchase_order_items_variant_id_fkey' AND conrelid = 'public.purchase_order_items'::regclass) THEN alter table "public"."purchase_order_items" add constraint "purchase_order_items_variant_id_fkey" FOREIGN KEY (variant_id) REFERENCES product_variants(id) not valid; END IF; END; $$;
alter table "public"."purchase_order_items" validate constraint "purchase_order_items_variant_id_fkey";
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'purchase_orders_supplier_id_fkey' AND conrelid = 'public.purchase_orders'::regclass) THEN alter table "public"."purchase_orders" add constraint "purchase_orders_supplier_id_fkey" FOREIGN KEY (supplier_id) REFERENCES suppliers(id) not valid; END IF; END; $$;
alter table "public"."purchase_orders" validate constraint "purchase_orders_supplier_id_fkey";
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'purchase_orders_user_id_fkey' AND conrelid = 'public.purchase_orders'::regclass) THEN alter table "public"."purchase_orders" add constraint "purchase_orders_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid; END IF; END; $$;
alter table "public"."purchase_orders" validate constraint "purchase_orders_user_id_fkey";
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'roles_name_key' AND conrelid = 'public.roles'::regclass) THEN alter table "public"."roles" add constraint "roles_name_key" UNIQUE using index "roles_name_key"; END IF; END; $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'stock_adjustments_product_id_fkey' AND conrelid = 'public.stock_adjustments'::regclass) THEN alter table "public"."stock_adjustments" add constraint "stock_adjustments_product_id_fkey" FOREIGN KEY (product_id) REFERENCES products(id) not valid; END IF; END; $$;
alter table "public"."stock_adjustments" validate constraint "stock_adjustments_product_id_fkey";
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'stock_adjustments_user_id_fkey' AND conrelid = 'public.stock_adjustments'::regclass) THEN alter table "public"."stock_adjustments" add constraint "stock_adjustments_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid; END IF; END; $$;
alter table "public"."stock_adjustments" validate constraint "stock_adjustments_user_id_fkey";
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'stock_adjustments_variant_id_fkey' AND conrelid = 'public.stock_adjustments'::regclass) THEN alter table "public"."stock_adjustments" add constraint "stock_adjustments_variant_id_fkey" FOREIGN KEY (variant_id) REFERENCES product_variants(id) not valid; END IF; END; $$;
alter table "public"."stock_adjustments" validate constraint "stock_adjustments_variant_id_fkey";
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_profiles_id_fkey' AND conrelid = 'public.user_profiles'::regclass) THEN alter table "public"."user_profiles" add constraint "user_profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid; END IF; END; $$;
alter table "public"."user_profiles" validate constraint "user_profiles_id_fkey";
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_roles_role_id_fkey' AND conrelid = 'public.user_roles'::regclass) THEN alter table "public"."user_roles" add constraint "user_roles_role_id_fkey" FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE not valid; END IF; END; $$;
alter table "public"."user_roles" validate constraint "user_roles_role_id_fkey";
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_roles_user_id_fkey' AND conrelid = 'public.user_roles'::regclass) THEN alter table "public"."user_roles" add constraint "user_roles_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid; END IF; END; $$;
alter table "public"."user_roles" validate constraint "user_roles_user_id_fkey";

grant delete on table "public"."brands" to "anon";

grant insert on table "public"."brands" to "anon";

grant references on table "public"."brands" to "anon";

grant select on table "public"."brands" to "anon";

grant trigger on table "public"."brands" to "anon";

grant truncate on table "public"."brands" to "anon";

grant update on table "public"."brands" to "anon";

grant delete on table "public"."brands" to "authenticated";

grant insert on table "public"."brands" to "authenticated";

grant references on table "public"."brands" to "authenticated";

grant select on table "public"."brands" to "authenticated";

grant trigger on table "public"."brands" to "authenticated";

grant truncate on table "public"."brands" to "authenticated";

grant update on table "public"."brands" to "authenticated";

grant delete on table "public"."brands" to "service_role";

grant insert on table "public"."brands" to "service_role";

grant references on table "public"."brands" to "service_role";

grant select on table "public"."brands" to "service_role";

grant trigger on table "public"."brands" to "service_role";

grant truncate on table "public"."brands" to "service_role";

grant update on table "public"."brands" to "service_role";

grant delete on table "public"."categories" to "anon";

grant insert on table "public"."categories" to "anon";

grant references on table "public"."categories" to "anon";

grant select on table "public"."categories" to "anon";

grant trigger on table "public"."categories" to "anon";

grant truncate on table "public"."categories" to "anon";

grant update on table "public"."categories" to "anon";

grant delete on table "public"."categories" to "authenticated";

grant insert on table "public"."categories" to "authenticated";

grant references on table "public"."categories" to "authenticated";

grant select on table "public"."categories" to "authenticated";

grant trigger on table "public"."categories" to "authenticated";

grant truncate on table "public"."categories" to "authenticated";

grant update on table "public"."categories" to "authenticated";

grant delete on table "public"."categories" to "service_role";

grant insert on table "public"."categories" to "service_role";

grant references on table "public"."categories" to "service_role";

grant select on table "public"."categories" to "service_role";

grant trigger on table "public"."categories" to "service_role";

grant truncate on table "public"."categories" to "service_role";

grant update on table "public"."categories" to "service_role";

grant delete on table "public"."customers" to "anon";

grant insert on table "public"."customers" to "anon";

grant references on table "public"."customers" to "anon";

grant select on table "public"."customers" to "anon";

grant trigger on table "public"."customers" to "anon";

grant truncate on table "public"."customers" to "anon";

grant update on table "public"."customers" to "anon";

grant delete on table "public"."customers" to "authenticated";

grant insert on table "public"."customers" to "authenticated";

grant references on table "public"."customers" to "authenticated";

grant select on table "public"."customers" to "authenticated";

grant trigger on table "public"."customers" to "authenticated";

grant truncate on table "public"."customers" to "authenticated";

grant update on table "public"."customers" to "authenticated";

grant delete on table "public"."customers" to "service_role";

grant insert on table "public"."customers" to "service_role";

grant references on table "public"."customers" to "service_role";

grant select on table "public"."customers" to "service_role";

grant trigger on table "public"."customers" to "service_role";

grant truncate on table "public"."customers" to "service_role";

grant update on table "public"."customers" to "service_role";

grant delete on table "public"."order_items" to "anon";

grant insert on table "public"."order_items" to "anon";

grant references on table "public"."order_items" to "anon";

grant select on table "public"."order_items" to "anon";

grant trigger on table "public"."order_items" to "anon";

grant truncate on table "public"."order_items" to "anon";

grant update on table "public"."order_items" to "anon";

grant delete on table "public"."order_items" to "authenticated";

grant insert on table "public"."order_items" to "authenticated";

grant references on table "public"."order_items" to "authenticated";

grant select on table "public"."order_items" to "authenticated";

grant trigger on table "public"."order_items" to "authenticated";

grant truncate on table "public"."order_items" to "authenticated";

grant update on table "public"."order_items" to "authenticated";

grant delete on table "public"."order_items" to "service_role";

grant insert on table "public"."order_items" to "service_role";

grant references on table "public"."order_items" to "service_role";

grant select on table "public"."order_items" to "service_role";

grant trigger on table "public"."order_items" to "service_role";

grant truncate on table "public"."order_items" to "service_role";

grant update on table "public"."order_items" to "service_role";

grant delete on table "public"."orders" to "anon";

grant insert on table "public"."orders" to "anon";

grant references on table "public"."orders" to "anon";

grant select on table "public"."orders" to "anon";

grant trigger on table "public"."orders" to "anon";

grant truncate on table "public"."orders" to "anon";

grant update on table "public"."orders" to "anon";

grant delete on table "public"."orders" to "authenticated";

grant insert on table "public"."orders" to "authenticated";

grant references on table "public"."orders" to "authenticated";

grant select on table "public"."orders" to "authenticated";

grant trigger on table "public"."orders" to "authenticated";

grant truncate on table "public"."orders" to "authenticated";

grant update on table "public"."orders" to "authenticated";

grant delete on table "public"."orders" to "service_role";

grant insert on table "public"."orders" to "service_role";

grant references on table "public"."orders" to "service_role";

grant select on table "public"."orders" to "service_role";

grant trigger on table "public"."orders" to "service_role";

grant truncate on table "public"."orders" to "service_role";

grant update on table "public"."orders" to "service_role";

grant delete on table "public"."product_images" to "anon";

grant insert on table "public"."product_images" to "anon";

grant references on table "public"."product_images" to "anon";

grant select on table "public"."product_images" to "anon";

grant trigger on table "public"."product_images" to "anon";

grant truncate on table "public"."product_images" to "anon";

grant update on table "public"."product_images" to "anon";

grant delete on table "public"."product_images" to "authenticated";

grant insert on table "public"."product_images" to "authenticated";

grant references on table "public"."product_images" to "authenticated";

grant select on table "public"."product_images" to "authenticated";

grant trigger on table "public"."product_images" to "authenticated";

grant truncate on table "public"."product_images" to "authenticated";

grant update on table "public"."product_images" to "authenticated";

grant delete on table "public"."product_images" to "service_role";

grant insert on table "public"."product_images" to "service_role";

grant references on table "public"."product_images" to "service_role";

grant select on table "public"."product_images" to "service_role";

grant trigger on table "public"."product_images" to "service_role";

grant truncate on table "public"."product_images" to "service_role";

grant update on table "public"."product_images" to "service_role";

grant delete on table "public"."product_variants" to "anon";

grant insert on table "public"."product_variants" to "anon";

grant references on table "public"."product_variants" to "anon";

grant select on table "public"."product_variants" to "anon";

grant trigger on table "public"."product_variants" to "anon";

grant truncate on table "public"."product_variants" to "anon";

grant update on table "public"."product_variants" to "anon";

grant delete on table "public"."product_variants" to "authenticated";

grant insert on table "public"."product_variants" to "authenticated";

grant references on table "public"."product_variants" to "authenticated";

grant select on table "public"."product_variants" to "authenticated";

grant trigger on table "public"."product_variants" to "authenticated";

grant truncate on table "public"."product_variants" to "authenticated";

grant update on table "public"."product_variants" to "authenticated";

grant delete on table "public"."product_variants" to "service_role";

grant insert on table "public"."product_variants" to "service_role";

grant references on table "public"."product_variants" to "service_role";

grant select on table "public"."product_variants" to "service_role";

grant trigger on table "public"."product_variants" to "service_role";

grant truncate on table "public"."product_variants" to "service_role";

grant update on table "public"."product_variants" to "service_role";

grant delete on table "public"."products" to "anon";

grant insert on table "public"."products" to "anon";

grant references on table "public"."products" to "anon";

grant select on table "public"."products" to "anon";

grant trigger on table "public"."products" to "anon";

grant truncate on table "public"."products" to "anon";

grant update on table "public"."products" to "anon";

grant delete on table "public"."products" to "authenticated";

grant insert on table "public"."products" to "authenticated";

grant references on table "public"."products" to "authenticated";

grant select on table "public"."products" to "authenticated";

grant trigger on table "public"."products" to "authenticated";

grant truncate on table "public"."products" to "authenticated";

grant update on table "public"."products" to "authenticated";

grant delete on table "public"."products" to "service_role";

grant insert on table "public"."products" to "service_role";

grant references on table "public"."products" to "service_role";

grant select on table "public"."products" to "service_role";

grant trigger on table "public"."products" to "service_role";

grant truncate on table "public"."products" to "service_role";

grant update on table "public"."products" to "service_role";

grant delete on table "public"."purchase_order_items" to "anon";

grant insert on table "public"."purchase_order_items" to "anon";

grant references on table "public"."purchase_order_items" to "anon";

grant select on table "public"."purchase_order_items" to "anon";

grant trigger on table "public"."purchase_order_items" to "anon";

grant truncate on table "public"."purchase_order_items" to "anon";

grant update on table "public"."purchase_order_items" to "anon";

grant delete on table "public"."purchase_order_items" to "authenticated";

grant insert on table "public"."purchase_order_items" to "authenticated";

grant references on table "public"."purchase_order_items" to "authenticated";

grant select on table "public"."purchase_order_items" to "authenticated";

grant trigger on table "public"."purchase_order_items" to "authenticated";

grant truncate on table "public"."purchase_order_items" to "authenticated";

grant update on table "public"."purchase_order_items" to "authenticated";

grant delete on table "public"."purchase_order_items" to "service_role";

grant insert on table "public"."purchase_order_items" to "service_role";

grant references on table "public"."purchase_order_items" to "service_role";

grant select on table "public"."purchase_order_items" to "service_role";

grant trigger on table "public"."purchase_order_items" to "service_role";

grant truncate on table "public"."purchase_order_items" to "service_role";

grant update on table "public"."purchase_order_items" to "service_role";

grant delete on table "public"."purchase_orders" to "anon";

grant insert on table "public"."purchase_orders" to "anon";

grant references on table "public"."purchase_orders" to "anon";

grant select on table "public"."purchase_orders" to "anon";

grant trigger on table "public"."purchase_orders" to "anon";

grant truncate on table "public"."purchase_orders" to "anon";

grant update on table "public"."purchase_orders" to "anon";

grant delete on table "public"."purchase_orders" to "authenticated";

grant insert on table "public"."purchase_orders" to "authenticated";

grant references on table "public"."purchase_orders" to "authenticated";

grant select on table "public"."purchase_orders" to "authenticated";

grant trigger on table "public"."purchase_orders" to "authenticated";

grant truncate on table "public"."purchase_orders" to "authenticated";

grant update on table "public"."purchase_orders" to "authenticated";

grant delete on table "public"."roles" to "anon";

grant insert on table "public"."roles" to "anon";

grant references on table "public"."roles" to "anon";

grant select on table "public"."roles" to "anon";

grant trigger on table "public"."roles" to "anon";

grant truncate on table "public"."roles" to "anon";

grant update on table "public"."roles" to "anon";

grant delete on table "public"."roles" to "authenticated";

grant insert on table "public"."roles" to "authenticated";

grant references on table "public"."roles" to "authenticated";

grant select on table "public"."roles" to "authenticated";

grant trigger on table "public"."roles" to "authenticated";

grant truncate on table "public"."roles" to "authenticated";

grant update on table "public"."roles" to "authenticated";

grant delete on table "public"."stock_adjustments" to "anon";

grant insert on table "public"."stock_adjustments" to "anon";

grant references on table "public"."stock_adjustments" to "anon";

grant select on table "public"."stock_adjustments" to "anon";

grant trigger on table "public"."stock_adjustments" to "anon";

grant truncate on table "public"."stock_adjustments" to "anon";

grant update on table "public"."stock_adjustments" to "anon";

grant delete on table "public"."stock_adjustments" to "authenticated";

grant insert on table "public"."stock_adjustments" to "authenticated";

grant references on table "public"."stock_adjustments" to "authenticated";

grant select on table "public"."stock_adjustments" to "authenticated";

grant trigger on table "public"."stock_adjustments" to "authenticated";

grant truncate on table "public"."stock_adjustments" to "authenticated";

grant update on table "public"."stock_adjustments" to "authenticated";

grant delete on table "public"."suppliers" to "anon";

grant insert on table "public"."suppliers" to "anon";

grant references on table "public"."suppliers" to "anon";

grant select on table "public"."suppliers" to "anon";

grant trigger on table "public"."suppliers" to "anon";

grant truncate on table "public"."suppliers" to "anon";

grant update on table "public"."suppliers" to "anon";

grant delete on table "public"."suppliers" to "authenticated";

grant insert on table "public"."suppliers" to "authenticated";

grant references on table "public"."suppliers" to "authenticated";

grant select on table "public"."suppliers" to "authenticated";

grant trigger on table "public"."suppliers" to "authenticated";

grant truncate on table "public"."suppliers" to "authenticated";

grant update on table "public"."suppliers" to "authenticated";

grant delete on table "public"."user_profiles" to "anon";

grant insert on table "public"."user_profiles" to "anon";

grant references on table "public"."user_profiles" to "anon";

grant select on table "public"."user_profiles" to "anon";

grant trigger on table "public"."user_profiles" to "anon";

grant truncate on table "public"."user_profiles" to "anon";

grant update on table "public"."user_profiles" to "anon";

grant delete on table "public"."user_profiles" to "authenticated";

grant insert on table "public"."user_profiles" to "authenticated";

grant references on table "public"."user_profiles" to "authenticated";

grant select on table "public"."user_profiles" to "authenticated";

grant trigger on table "public"."user_profiles" to "authenticated";

grant truncate on table "public"."user_profiles" to "authenticated";

grant update on table "public"."user_profiles" to "authenticated";

grant delete on table "public"."user_roles" to "anon";

grant insert on table "public"."user_roles" to "anon";

grant references on table "public"."user_roles" to "anon";

grant select on table "public"."user_roles" to "anon";

grant trigger on table "public"."user_roles" to "anon";

grant truncate on table "public"."user_roles" to "anon";

grant update on table "public"."user_roles" to "anon";

grant delete on table "public"."user_roles" to "authenticated";

grant insert on table "public"."user_roles" to "authenticated";

grant references on table "public"."user_roles" to "authenticated";

grant select on table "public"."user_roles" to "authenticated";

grant trigger on table "public"."user_roles" to "authenticated";

grant truncate on table "public"."user_roles" to "authenticated";

grant update on table "public"."user_roles" to "authenticated";


