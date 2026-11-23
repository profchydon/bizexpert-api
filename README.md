# BizExpert API

NestJS API for BizExpert inventory and sales. Prisma talks to PostgreSQL; Bull uses Redis.

## Setup

```bash
cp .env.example .env
npm install --legacy-peer-deps
npx prisma generate
npm run db:migrate
npm run db:seed
npm run dev
```

Host Postgres from the root Compose file uses port **5440**.

- API: http://localhost:3001/api/v1
- Swagger: http://localhost:3001/api/v1/docs

Demo login after seed: `owner@demo.bizexpert.ng` / `Demo1234!`

## Docker

Build context is this directory. Clone this repo as `api/` next to the Compose root (`profchydon/bizexpert`), then:

```bash
npm run compose:up
```
