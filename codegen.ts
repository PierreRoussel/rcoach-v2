import type { CodegenConfig } from '@graphql-codegen/cli'

const subdomain = process.env.VITE_NHOST_SUBDOMAIN ?? 'your-subdomain'
const region = process.env.VITE_NHOST_REGION ?? 'eu-central-1'

const config: CodegenConfig = {
  schema: {
    [`https://${subdomain}.graphql.${region}.nhost.run/v1`]: {
      headers: {
        'x-hasura-admin-secret':
          process.env.CODEGEN_HASURA_ADMIN_SECRET ?? '',
      },
    },
  },
  documents: ['src/graphql/**/*.graphql'],
  generates: {
    './src/generated/': {
      preset: 'client',
    },
  },
  ignoreNoDocuments: true,
}

export default config
