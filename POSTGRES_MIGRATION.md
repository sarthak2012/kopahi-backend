# Postgres migration playbook

The backend currently runs on MongoDB + Mongoose. The data-access layer in
`db/` is the only place that imports Mongoose models. To switch to Postgres,
you only need to rewrite the files in `db/` — routes, controllers, and
middleware are storage-agnostic.

## What stays the same

- `routes/*.js` — they only call `db.users.*`, `db.products.*`, etc.
- `controllers/*.js` — same.
- `middleware/authMiddleware.js` — uses `db.users.findById`.
- The HTTP contract — request/response shapes do not change.

## What you rewrite

- `db/users.js`
- `db/products.js`
- `db/orders.js`
- `db/categories.js`
- `db/leads.js`
- `config/db.js` — the connection bootstrap.
- `models/*.js` — delete (Mongoose) and replace with Postgres schemas
  (Prisma `schema.prisma`, Drizzle table definitions, or Knex migrations).
- `scripts/seed.js` — rewrite the inserts using the new client.

## Recommended stack

For a familiar JS-first experience:

- **Prisma** — best DX, built-in migrations, typed client. Add a `prisma/`
  folder with `schema.prisma`, run `npx prisma generate`, and have each
  `db/*.js` file import the Prisma client.
- **Drizzle** — lighter-weight, SQL-feels-like-SQL. Good if you want to keep
  control over query shape.
- **Knex + pg** — most explicit, no codegen, but you write more boilerplate.

The repository functions in `db/` were named to be ORM-agnostic: `findById`,
`findByEmail`, `create`, `updateById`, `list`, `count`, etc. They map cleanly
to any of the above.

## Schema mapping (Mongoose → Postgres)

### users

| Mongoose field | Postgres column |
|---|---|
| `_id` (ObjectId) | `id` (uuid or bigserial primary key) |
| `name` (String, required) | `name TEXT NOT NULL` |
| `email` (String, unique, required) | `email TEXT UNIQUE NOT NULL` |
| `password` (String, select:false) | `password_hash TEXT NOT NULL` (don't select by default in your repo) |
| `phone` (String) | `phone TEXT DEFAULT ''` |
| `role` (enum) | `role TEXT CHECK (role IN ('user','vendor','admin')) DEFAULT 'user'` |
| `businessName` (String) | `business_name TEXT DEFAULT ''` |
| `createdAt`/`updatedAt` | `created_at`/`updated_at TIMESTAMPTZ DEFAULT now()` |

### products

| Mongoose field | Postgres column |
|---|---|
| `_id` | `id` (pk) |
| `name`/`slug` | `name TEXT`, `slug TEXT UNIQUE` |
| `description`/`shortDescription` | `description TEXT`, `short_description TEXT` |
| `brand`/`category` | `brand TEXT`, `category TEXT` |
| `price`/`originalPrice`/`discount`/`stock` | `numeric` columns |
| `images` (array of strings) | separate `product_images (product_id, url, position)` table OR `images TEXT[]` |
| `featured`/`isActive` | `boolean` |
| `rating`/`numReviews` | `numeric`, `int` |
| `reviews` (embedded) | separate `reviews` table referencing `products(id)` and `users(id)` |
| `tags` | separate `product_tags` table |

### orders

| Mongoose field | Postgres |
|---|---|
| `_id` | `id` (pk) |
| `user` (ObjectId ref) | `user_id` FK to users |
| `items` (embedded array) | separate `order_items (order_id, product_id, name, image, price, quantity)` table |
| `shippingAddress` (embedded) | flatten into columns OR keep as `jsonb` |
| `paymentMethod`/`paymentStatus`/`orderStatus` | enum-checked TEXT columns |
| `*Price` fields | `numeric` |
| `paidAt`/`deliveredAt` | `timestamptz NULL` |

### categories / leads

Trivial mapping — name, slug, image, status as TEXT columns; timestamps as TIMESTAMPTZ.

## Adapting `db/orders.js`

The Mongo aggregation in `db.orders.totalPaidRevenue()` becomes:

```sql
SELECT COALESCE(SUM(total_price), 0) AS revenue
FROM orders
WHERE payment_status = 'Paid';
```

The `.populate("user", "name email")` calls become:

```sql
SELECT o.*, u.id AS user_id, u.name AS user_name, u.email AS user_email
FROM orders o
LEFT JOIN users u ON u.id = o.user_id
WHERE o.id = $1;
```

Reshape the result into `order.user = { _id, name, email }` so callers don't change.

## ID strategy

Existing route handlers compare ids with `String(...)` — that works for both
ObjectIds (via `.toString()`) and uuid/bigint (via `.toString()` on numbers).
Pick uuid if you want collision-free public ids; pick bigserial if you want
short, sequential numeric ids. Either way, keep the field exposed as `_id` in
JSON responses (or rename across the frontend in one pass).

## Cutover checklist

1. Pick an ORM/query builder. Add to `package.json`.
2. Add `DATABASE_URL` to `.env`. Keep `MONGO_URI` until cutover is verified.
3. Write the schema (Prisma migration / Knex migration / Drizzle schema).
4. Rewrite `db/*.js` files one at a time. Run the server after each — the
   non-rewritten repos still talk to Mongo, so the app stays functional.
5. Rewrite `config/db.js` to open the Postgres connection (same exported
   `connectDB` signature).
6. Rewrite `scripts/seed.js`.
7. Delete `models/*.js` and remove `mongoose` from `package.json`.
8. Update `PROJECT_KNOWLEDGE.md` section 1 to reflect the new stack.
