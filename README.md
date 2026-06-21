# RCoach v2

PWA coach / athlete app backed by [Nhost Cloud](https://nhost.io).

## Prerequisites

- Node.js 20+
- Nhost Cloud project (subdomain + region)
- Optional: Nhost CLI for deployments (`npx nhost-cli-preview`)

## Setup

```bash
cp .env.example .env.local
# Edit VITE_NHOST_SUBDOMAIN and VITE_NHOST_REGION

npm install
npm run dev
```

## Nhost backend

Database migrations and Hasura metadata live in [`nhost/`](nhost/).

**Note:** `nhost.toml` is intentionally not committed — service config stays on Nhost Cloud (Dashboard). Only migrations + metadata are deployed via Git.

Deploy by pushing to the Git branch linked to your Nhost project, or:

```bash
nhost login
nhost deployments new --subdomain <subdomain> --ref HEAD --follow
```

## GraphQL Codegen

```bash
# Set CODEGEN_HASURA_ADMIN_SECRET in .env.local
npm run codegen
```

## Phase 0 scope

- Auth (register / login)
- Shells `/app` (mobile) and `/coach` (desktop)
- Public exercises library via GraphQL
- Postgres schema + Hasura permissions
