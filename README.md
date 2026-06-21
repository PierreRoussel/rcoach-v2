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

**Note:** `nhost/config.yaml` (Hasura CLI, `version: 3`) is required for Git deploys. Service config (`nhost.toml`) stays on Nhost Cloud unless you pull it with `nhost config pull`.

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
