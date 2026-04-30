# Kopahi Backend

REST API for the Kopahi marketplace.

## Setup

1. Copy `.env` and fill in real values (at minimum `MONGO_URI` and `JWT_SECRET`).
2. Install deps:
   ```
   npm install
   ```
3. Seed demo users + products (optional, recommended):
   ```
   npm run seed
   ```
4. Start the server:
   ```
   npm run dev   # nodemon
   npm start     # plain node
   ```

The API listens on `http://localhost:5000`.

## Demo accounts (after seeding)

All passwords are `demo1234`.

| Email | Role |
|---|---|
| admin@kopahi.com | admin |
| vendor@kopahi.com | vendor |
| customer@kopahi.com | user |

## Endpoints

### Auth
- `POST /api/auth/register` — name, email, password, optional role/businessName
- `POST /api/auth/login` — email, password
- `GET  /api/auth/me`     — auth required
- `PUT  /api/auth/me`     — auth required, update name/phone/businessName

### Products
- `GET    /api/products?keyword=&category=&page=&pageSize=`
- `GET    /api/products/featured/list`
- `GET    /api/products/:id`
- `POST   /api/products`         — admin
- `PUT    /api/products/:id`     — admin
- `DELETE /api/products/:id`     — admin
- `POST   /api/products/upload`  — admin · multipart `image`

### Orders
- `POST /api/orders`             — auth · server computes price/tax/shipping
- `GET  /api/orders/mine`        — auth · the caller's orders
- `GET  /api/orders`             — admin · all orders
- `GET  /api/orders/:id`         — owner or admin
- `PUT  /api/orders/:id/status`  — admin
- `PUT  /api/orders/:id/pay`     — admin
- `PUT  /api/orders/:id/cancel`  — owner or admin

### Categories
- `GET    /api/categories`
- `POST   /api/categories`     — admin
- `PUT    /api/categories/:id` — admin
- `DELETE /api/categories/:id` — admin

### Admin
- `GET    /api/admin/dashboard`   — admin · live stats
- `GET    /api/admin/users`       — admin
- `GET    /api/admin/orders`      — admin
- `GET    /api/admin/leads`       — admin
- `DELETE /api/admin/user/:id`    — admin
- `DELETE /api/admin/product/:id` — admin

### Contact
- `POST /api/contact` — public · persists Lead and emails operator (rate-limited 10/15min)

### Payment (only if `RAZORPAY_KEY_*` set)
- `POST /api/payment/razorpay/order`  — auth
- `POST /api/payment/razorpay/verify` — auth

### System
- `GET /` — service banner
- `GET /api/health` — health probe
