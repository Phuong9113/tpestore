# TPE Store - Backend (Refactored Layered Architecture)

This repository contains a Next.js frontend and a refactored Express + Prisma backend following a clean layered architecture. The backend is now mounted under /api/v1 and is structured for production-grade maintainability and easy integration with a separate frontend.

## Overview

- Runtime: Node.js (ESM)
- Framework: Express
- ORM: Prisma (PostgreSQL)
- Auth: JWT (Bearer token)
- External services: GHN (shipping), ZaloPay (payments)

## Folder Structure (Backend)

```
backend/
  src/
    app.js                 # Express config, middlewares, route mount (/api)
    server.js              # Server bootstrap

    config/                # Env & external service configs
      env.js
      ghn.js
      zalopay.js
      index.js

    routes/
      v1/
        auth.routes.js
        products.routes.js
        orders.routes.js
        users.routes.js
        admin.routes.js
        categories.routes.js
        cart.routes.js
        shipping.routes.js
        zalopay.routes.js
        index.js           # mounts v1 groups
      index.js             # mounts /api/v1

    controllers/           # HTTP layer: req/res + calls services
      auth.controller.js
      product.controller.js
      order.controller.js
      user.controller.js
      admin.controller.js
      category.controller.js
      cart.controller.js
      shipping.controller.js
      zalopay.controller.js

    services/              # Business logic: calls repositories/external services
      auth.service.js
      product.service.js
      order.service.js
      user.service.js
      ghn.service.js
      zalopay.service.js
      category.service.js
      cart.service.js

    repositories/          # Data access using Prisma
      user.repository.js
      product.repository.js
      order.repository.js
      category.repository.js
      address.repository.js
      index.js

    middleware/
      auth.js              # authMiddleware, authenticate, authorizeAdmin
      errorHandler.js
      logger.js

    utils/
      prisma.js            # PrismaClient singleton
      response.js          # success()/error() helpers
      helpers.js           # shared helpers placeholder
      constants.js         # enums/constants

    prisma/
      schema.prisma
      migrations/          # copied from root prisma/migrations
```

## Getting Started

1) Install deps

```
npm install
```

2) Configure environment (.env)

At project root, set (examples):

```
NODE_ENV=development
PORT=4000
HOST=0.0.0.0
DATABASE_URL=postgresql://user:password@host:5432/db
JWT_SECRET=your-strong-secret

# GHN
GHN_BASE_URL=https://dev-online-gateway.ghn.vn
GHN_TOKEN=
GHN_SHOP_ID=

# ZaloPay
ZALOPAY_APP_ID=
ZALOPAY_KEY1=
ZALOPAY_KEY2=
ZALOPAY_CREATE_ENDPOINT=https://sb-openapi.zalopay.vn/v2/create
ZALOPAY_SANDBOX_CALLBACK_URL=

# Frontend
CLIENT_URL=http://localhost:3000
```

3) Prisma generate (if needed)

```
npx prisma generate
```

4) Run backend (development)

```
npm run server
# Server: http://localhost:4000
```

Frontend example calls should use the v1 prefix. The project already proxies/mounts backend under /api; ensure requests hit /api/v1/... at runtime.

## API Base

- Base: http://localhost:4000/api/v1
- Auth: Bearer <token> for protected endpoints

## Routes (v1)

- Auth: `/auth`
  - POST `/register`
  - POST `/login`
  - GET `/me` (auth)
  - PUT `/me` (auth)

- Products: `/products`
  - GET `/` (list)
  - GET `/:id` (detail)
  - GET `/:productId/reviews`
  - POST `/:productId/reviews` (auth)
  - POST `/:productId/interact` (auth)
  - GET `/recommendations` (auth)

- Categories: `/categories`
  - GET `/`
  - GET `/:id`

- Cart: `/cart` (auth)
  - GET `/`
  - POST `/`
  - PATCH `/:productId`
  - DELETE `/:productId`
  - DELETE `/`

- Orders: `/orders` (auth)
  - GET `/`
  - POST `/`
  - PATCH `/:id/status`
  - GET `/:id`

- Users: `/users` (auth)
  - GET `/` (admin)
  - GET `/profile`
  - PUT `/profile`
  - POST `/orders/:orderId/cancel`
  - Addresses:
    - GET `/addresses`
    - GET `/addresses/:id`
    - POST `/addresses`
    - PUT `/addresses/:id`
    - DELETE `/addresses/:id`
    - POST `/addresses/:id/default`

- Shipping (GHN): `/shipping`
  - GET `/provinces`
  - GET `/districts/:provinceId`
  - GET `/wards/:districtId`
  - POST `/fee`
  - GET `/services`
  - POST `/order`
  - GET `/track/:orderCode`
  - POST `/cancel/:orderCode`

- ZaloPay: `/zalopay`
  - POST `/callback` (public)
  - POST `/verify` (public)
  - POST `/create-order` (auth)
  - GET `/status/:orderId` (auth)

- Admin: `/admin` (auth + admin)
  - Products: list/get/create/update/delete, Excel import/export
  - Categories: list/get/create/update/delete
  - Users: list/get/update/delete, stats
  - Orders: list/get/update status/cancel, stats, GHN detail

## Conventions

- ESM only (`type: "module"`)
- Controllers catch errors and call `next(err)`; global `errorHandler` returns JSON { success: false, message }
- `utils/response.js`: use `success(res, data, message = "Success", status = 200)`
- `middleware/auth.js` exposes: `authMiddleware` (attach user if token present), `authenticate` (required), `authorizeAdmin`
- Prisma client singleton: `utils/prisma.js`

## Notes on Migration

- Previous flat folders in `backend/` were removed after migration. All logic lives under `backend/src`.
- Prisma schema and migrations are duplicated under `backend/src/prisma` for reference; the active schema remains at root `prisma/schema.prisma` (used by `npx prisma generate`).
- External integrations:
  - GHN logic under `src/services/ghn.service.js`
  - ZaloPay logic under `src/services/zalopay.service.js`

## Development Tips

- Lint/format as per project tooling.
- When adding new endpoints: create route → controller → service → (optional) repository.
- Keep controllers thin, services focused, repositories data-only.

## Example Frontend Usage

Frontend should call the versioned endpoints, for example in a checkout flow:

```ts
// creating an order
await api.post("/orders", orderData); // api base should prefix /api/v1
```

Ensure your frontend HTTP client base URL points to `/api/v1` (or that your proxy/server mounts it accordingly).
